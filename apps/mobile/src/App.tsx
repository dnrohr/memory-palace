import { CalendarDays, ClipboardList, Download, Edit3, List, Lock, MapPin, Mic, Plus, RotateCcw, Save, Search, Settings as SettingsIcon, Square, Tags, Trash2, Users, Wand2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import type { DateCandidate, DatePrecision, Memory, TagSuggestion } from "../../../src/core/types";
import type { AppLockSettings } from "../../../src/security/appLock";
import {
  buildTimelineBuckets,
  deleteTag,
  filterMemories,
  permanentlyDeleteMemory,
  renameTag,
  restoreMemory,
  summarizeArchive
} from "../../../src/core/archiveOperations";
import { JsonExportProvider } from "../../../src/export/jsonExport";
import { MarkdownExportProvider } from "../../../src/export/markdownExport";
import { applyArchiveImport, previewArchiveImport, type ArchiveImportWorkflowPreview } from "../../../src/import/importWorkflow";
import { createLifeContextId, type LifeContextEntity } from "../../../src/core/lifeContext";
import { extractDateCandidates } from "../../../src/processing/rules/dateExtraction";
import { suggestTags } from "../../../src/processing/rules/tagSuggestion";
import { acceptReviewItem, buildReviewInbox, rejectReviewItem } from "../../../src/processing/reviewInbox";
import { rebuildEmbeddingIndex, searchEmbeddingIndex } from "../../../src/search/embeddingIndex";
import { findRelatedMemories, type RelatedMemoryResult } from "../../../src/search/relatedMemories";
import { buildDataAuditReport, clearProcessingRuns, clearRetainedAudioReferences } from "../../../src/security/dataAudit";
import { buildTagClusters } from "../../../src/visualization/clusters";
import { buildTagGraphData } from "../../../src/visualization/graph";
import { buildLifeChapterCandidates } from "../../../src/visualization/lifeChapters";
import {
  createMemory,
  deleteLifeContext,
  loadArchive,
  replaceTags,
  saveArchive,
  softDeleteMemory,
  tagsForMemory,
  upsertLifeContext,
  upsertMemory
} from "./memoryStore";
import type { MemoryArchive } from "../../../src/core/archive";
import {
  requestAudioCapturePermission,
  startAudioCapture,
  stopAudioCapture,
  type AudioCaptureDraft,
  type AudioCaptureSession
} from "./audioCapture";
import { combineMarkdownArtifacts, pickImportArtifacts, shareExportArtifact } from "./filePortability";
import { ExpoBiometricAppLockProvider } from "./appLockProvider";

type ViewMode = "list" | "editor" | "detail" | "voice" | "timeline" | "review" | "context" | "tags" | "settings";
type SearchMode = "keyword" | "semantic";
type ExploreTab = "timeline" | "graph" | "clusters" | "chapters";

export default function App() {
  const appLockProvider = useMemo(() => new ExpoBiometricAppLockProvider(), []);
  const [archive, setArchive] = useState<MemoryArchive | undefined>();
  const [appLockSettings, setAppLockSettings] = useState<AppLockSettings>({
    mode: "disabled",
    autoLockTimeoutMs: 0,
    hidePreviewsInSwitcher: false
  });
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [semanticMemories, setSemanticMemories] = useState<Memory[]>([]);
  const [semanticSearchPending, setSemanticSearchPending] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDatePrecision, setSelectedDatePrecision] = useState<DatePrecision | undefined>();

  useEffect(() => {
    void loadArchive().then(async (loadedArchive) => {
      const { archive: indexedArchive, indexedMemoryIds, removedMemoryIds } = await rebuildEmbeddingIndex(loadedArchive);
      setArchive(indexedArchive);
      if (indexedMemoryIds.length > 0 || removedMemoryIds.length > 0) {
        await saveArchive(indexedArchive);
      }
    });
  }, []);

  useEffect(() => {
    void appLockProvider.getSettings().then(async (settings) => {
      setAppLockSettings(settings);
      if (settings.mode !== "disabled") {
        await appLockProvider.lock();
        setIsAppLocked(await appLockProvider.isLocked());
      }
    });
  }, [appLockProvider]);

  const keywordMemories = useMemo(() => {
    if (!archive) return [];
    return filterMemories(archive, {
      text: query,
      tagIds: selectedTagIds,
      datePrecisions: selectedDatePrecision ? [selectedDatePrecision] : []
    });
  }, [archive, query, selectedDatePrecision, selectedTagIds]);

  const semanticFilteredMemories = useMemo(() => {
    if (!archive) return [];
    const allowedIds = new Set(
      filterMemories(archive, {
        tagIds: selectedTagIds,
        datePrecisions: selectedDatePrecision ? [selectedDatePrecision] : []
      }).map((memory) => memory.id)
    );
    return semanticMemories.filter((memory) => allowedIds.has(memory.id));
  }, [archive, selectedDatePrecision, selectedTagIds, semanticMemories]);

  const memories = searchMode === "semantic" && query.trim() ? semanticFilteredMemories : keywordMemories;

  useEffect(() => {
    if (!archive || searchMode !== "semantic" || !query.trim()) {
      setSemanticMemories([]);
      setSemanticSearchPending(false);
      return;
    }

    let isCurrent = true;
    setSemanticSearchPending(true);
    void searchEmbeddingIndex(archive, query, { limit: 50 }).then((results) => {
      if (!isCurrent) return;
      setSemanticMemories(results.map((result) => result.memory));
      setSemanticSearchPending(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [archive, query, searchMode]);

  const selectedMemory = archive?.memories.find((memory) => memory.id === selectedId);

  async function persist(nextArchive: MemoryArchive) {
    const { archive: indexedArchive } = await rebuildEmbeddingIndex(nextArchive);
    setArchive(indexedArchive);
    await saveArchive(indexedArchive);
  }

  async function saveAppLockSettings(settings: AppLockSettings) {
    await appLockProvider.saveSettings(settings);
    setAppLockSettings(settings);
    setIsAppLocked(await appLockProvider.isLocked());
  }

  if (!archive) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading archive</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAppLocked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <UnlockView
          onUnlock={async () => {
            const unlocked = await appLockProvider.unlock();
            setIsAppLocked(await appLockProvider.isLocked());
            return unlocked;
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <Header
          mode={mode}
          onNew={() => {
            setSelectedId(undefined);
            setMode("editor");
          }}
          onVoice={() => setMode("voice")}
          onList={() => setMode("list")}
          onTimeline={() => setMode("timeline")}
          onReview={() => setMode("review")}
          onContext={() => setMode("context")}
          onTags={() => setMode("tags")}
          onSettings={() => setMode("settings")}
        />

        {mode === "list" ? (
          <MemoryList
            archive={archive}
            memories={memories}
            query={query}
            onQueryChange={setQuery}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
            semanticSearchPending={semanticSearchPending}
            selectedTagIds={selectedTagIds}
            onToggleTag={(tagId) =>
              setSelectedTagIds((current) =>
                current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
              )
            }
            {...(selectedDatePrecision ? { selectedDatePrecision } : {})}
            onSelectDatePrecision={(precision) =>
              setSelectedDatePrecision((current) => (current === precision ? undefined : precision))
            }
            onClearFilters={() => {
              setQuery("");
              setSelectedTagIds([]);
              setSelectedDatePrecision(undefined);
            }}
            onSelect={(id) => {
              setSelectedId(id);
              setMode("detail");
            }}
            onNew={() => {
              setSelectedId(undefined);
              setMode("editor");
            }}
          />
        ) : null}

        {mode === "editor" ? (
          <MemoryEditor
            archive={archive}
            {...(selectedMemory ? { memory: selectedMemory } : {})}
            onCancel={() => setMode(selectedMemory ? "detail" : "list")}
            onSave={async (memory, tagText) => {
              const withMemory = upsertMemory(archive, memory);
              const withTags = replaceTags(
                withMemory,
                memory.id,
                tagText.split(",").map((tag) => tag.trim())
              );
              await persist(withTags);
              setSelectedId(memory.id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "detail" && selectedMemory ? (
          <MemoryDetail
            archive={archive}
            memory={selectedMemory}
            onEdit={() => setMode("editor")}
            onSelect={(id) => {
              setSelectedId(id);
              setMode("detail");
            }}
            onDelete={async () => {
              await persist(softDeleteMemory(archive, selectedMemory.id));
              setSelectedId(undefined);
              setMode("list");
            }}
          />
        ) : null}

        {mode === "voice" ? (
          <VoiceCaptureView
            onSave={async (draft) => {
              const baseMemory = createMemory(draft.transcript || "Untitled voice memory");
              const memory = {
                ...baseMemory,
                sourceType: "voice" as const,
                isAudioRetained: draft.retainAudio,
                ...(draft.retainAudio ? { audioUri: draft.artifact.uri } : {})
              };
              const nextArchive = upsertMemory(archive, memory);
              await persist(nextArchive);
              setSelectedId(memory.id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "timeline" ? (
          <TimelineView
            archive={archive}
            memories={memories}
            onSelect={(id) => {
              setSelectedId(id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "review" ? (
          <ReviewInboxView
            archive={archive}
            onAccept={async (item) => persist(acceptReviewItem(archive, item))}
            onReject={async (item) => persist(rejectReviewItem(archive, item))}
            onSelect={(id) => {
              setSelectedId(id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "context" ? (
          <LifeContextView
            archive={archive}
            onSave={async (entity) => persist(upsertLifeContext(archive, entity))}
            onDelete={async (kind, id) => persist(deleteLifeContext(archive, kind, id))}
          />
        ) : null}

        {mode === "tags" ? (
          <TagManagement
            archive={archive}
            onRename={async (tagId, name) => persist(renameTag(archive, tagId, name))}
            onDelete={async (tagId) => {
              await persist(deleteTag(archive, tagId));
              setSelectedTagIds((current) => current.filter((id) => id !== tagId));
            }}
          />
        ) : null}

        {mode === "settings" ? (
          <Settings
            archive={archive}
            appLockSettings={appLockSettings}
            onImport={async (preview) => persist(applyArchiveImport(archive, preview))}
            onClearProcessingRuns={async () => persist(clearProcessingRuns(archive))}
            onClearRetainedAudio={async () => persist(clearRetainedAudioReferences(archive))}
            onEnableBiometricLock={async () =>
              saveAppLockSettings({
                mode: "biometric",
                autoLockTimeoutMs: 60_000,
                hidePreviewsInSwitcher: true
              })
            }
            onDisableAppLock={async () =>
              saveAppLockSettings({
                mode: "disabled",
                autoLockTimeoutMs: 0,
                hidePreviewsInSwitcher: false
              })
            }
            onLockNow={async () => {
              await appLockProvider.lock();
              setIsAppLocked(await appLockProvider.isLocked());
            }}
            onRestore={async (memoryId) => persist(restoreMemory(archive, memoryId))}
            onPermanentlyDelete={async (memoryId) => persist(permanentlyDeleteMemory(archive, memoryId))}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Header(props: {
  mode: ViewMode;
  onNew: () => void;
  onVoice: () => void;
  onList: () => void;
  onTimeline: () => void;
  onReview: () => void;
  onContext: () => void;
  onTags: () => void;
  onSettings: () => void;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Memory Palace</Text>
        <Text style={styles.subtle}>Local archive</Text>
      </View>
      <View style={styles.headerActions}>
        <IconButton label="List" active={props.mode === "list"} onPress={props.onList} icon={<List size={20} />} />
        <IconButton label="New" active={props.mode === "editor"} onPress={props.onNew} icon={<Plus size={20} />} />
        <IconButton label="Voice" active={props.mode === "voice"} onPress={props.onVoice} icon={<Mic size={20} />} />
        <IconButton label="Timeline" active={props.mode === "timeline"} onPress={props.onTimeline} icon={<CalendarDays size={20} />} />
        <IconButton label="Review" active={props.mode === "review"} onPress={props.onReview} icon={<ClipboardList size={20} />} />
        <IconButton label="Context" active={props.mode === "context"} onPress={props.onContext} icon={<Users size={20} />} />
        <IconButton label="Tags" active={props.mode === "tags"} onPress={props.onTags} icon={<Tags size={20} />} />
        <IconButton label="Settings" active={props.mode === "settings"} onPress={props.onSettings} icon={<SettingsIcon size={20} />} />
      </View>
    </View>
  );
}

function UnlockView(props: { onUnlock: () => Promise<boolean> }) {
  const [error, setError] = useState<string | undefined>();

  async function unlock() {
    setError(undefined);
    const unlocked = await props.onUnlock();
    if (!unlocked) setError("Unlock was not completed.");
  }

  return (
    <View style={styles.lockScreen}>
      <Lock size={32} color="#374236" />
      <Text style={styles.detailTitle}>Memory Palace is locked</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <PrimaryButton label="Unlock" onPress={unlock} icon={<Lock size={18} />} />
    </View>
  );
}

function VoiceCaptureView(props: { onSave: (draft: AudioCaptureDraft) => Promise<void> }) {
  const [session, setSession] = useState<AudioCaptureSession | undefined>();
  const [draft, setDraft] = useState<AudioCaptureDraft | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function start() {
    setError(undefined);
    const granted = await requestAudioCapturePermission();
    if (!granted) {
      setError("Microphone permission was denied.");
      return;
    }

    setSession(await startAudioCapture());
  }

  async function stop() {
    if (!session) return;
    const artifact = await stopAudioCapture(session);
    setSession(undefined);
    setDraft({
      artifact,
      transcript: "",
      retainAudio: false
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Voice capture</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {session ? (
          <PrimaryButton label="Stop recording" onPress={stop} icon={<Square size={18} />} />
        ) : (
          <PrimaryButton label="Start recording" onPress={start} icon={<Mic size={18} />} />
        )}
      </View>
      {draft ? (
        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Draft transcript</Text>
          <TextInput
            value={draft.transcript}
            onChangeText={(transcript) => setDraft({ ...draft, transcript })}
            placeholder="Type or paste the transcript"
            placeholderTextColor="#7b8178"
            multiline
            textAlignVertical="top"
            style={styles.bodyInput}
          />
          <Pressable
            onPress={() => setDraft({ ...draft, retainAudio: !draft.retainAudio })}
            style={[styles.segment, draft.retainAudio ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, draft.retainAudio ? styles.segmentTextActive : null]}>
              Retain audio file
            </Text>
          </Pressable>
          <Text style={styles.metadata}>
            Audio: {draft.artifact.durationMs ? `${Math.round(draft.artifact.durationMs / 1000)}s` : "recorded"}
          </Text>
          <PrimaryButton
            label="Save voice memory"
            onPress={() => void props.onSave(draft)}
            disabled={!draft.transcript.trim()}
            icon={<Save size={18} />}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

type LifeContextKind = LifeContextEntity["kind"];

function LifeContextView(props: {
  archive: MemoryArchive;
  onSave: (entity: LifeContextEntity) => Promise<void>;
  onDelete: (kind: LifeContextKind, id: string) => Promise<void>;
}) {
  const [kind, setKind] = useState<LifeContextKind>("person");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");

  const entities = getLifeContextEntities(props.archive, kind);
  const canSave = name.trim().length > 0;

  async function save() {
    if (!canSave) return;
    const trimmedName = name.trim();
    const now = new Date().toISOString();
    await props.onSave(buildLifeContextEntity(kind, trimmedName, detail.trim(), now));
    setName("");
    setDetail("");
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.segmentRow}>
        {(["person", "pet", "place", "life_period"] as LifeContextKind[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setKind(value)}
            style={[styles.segment, kind === value ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, kind === value ? styles.segmentTextActive : null]}>
              {lifeContextKindLabel(value)}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.filterPanel}>
        <View style={styles.panelHeader}>
          <MapPin size={18} color="#374236" />
          <Text style={styles.panelTitle}>Add {lifeContextKindLabel(kind)}</Text>
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor="#7b8178"
          style={styles.tagInput}
        />
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder={lifeContextDetailPlaceholder(kind)}
          placeholderTextColor="#7b8178"
          style={styles.tagInput}
        />
        <PrimaryButton label="Save" onPress={save} disabled={!canSave} icon={<Save size={18} />} />
      </View>
      {entities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No {lifeContextKindLabel(kind).toLowerCase()} yet</Text>
        </View>
      ) : (
        entities.map((entity) => (
          <View key={entity.id} style={styles.tagCard}>
            <View>
              <Text style={styles.memoryTitle}>{entity.name}</Text>
              {entity.detail ? <Text style={styles.metadata}>{entity.detail}</Text> : null}
            </View>
            <View style={styles.headerActions}>
              <IconButton
                label="Delete context"
                danger
                onPress={() => void props.onDelete(kind, entity.id)}
                icon={<Trash2 size={20} />}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function getLifeContextEntities(archive: MemoryArchive, kind: LifeContextKind): Array<{ id: string; name: string; detail?: string }> {
  switch (kind) {
    case "person":
      return archive.people.map((person) => ({
        id: person.id,
        name: person.displayName,
        ...(person.relationship ? { detail: person.relationship } : {})
      }));
    case "pet":
      return archive.pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        ...(pet.species ? { detail: pet.species } : {})
      }));
    case "place":
      return archive.places.map((place) => ({ id: place.id, name: place.name, detail: place.type }));
    case "life_period":
      return archive.lifePeriods.map((period) => ({ id: period.id, name: period.name, detail: period.datePrecision }));
  }
}

function buildLifeContextEntity(kind: LifeContextKind, name: string, detail: string, now: string): LifeContextEntity {
  switch (kind) {
    case "person":
      return {
        kind,
        value: {
          id: createLifeContextId(kind, name),
          displayName: name,
          normalizedName: name.toLocaleLowerCase(),
          ...(detail ? { relationship: detail } : {}),
          createdAt: now
        }
      };
    case "pet":
      return {
        kind,
        value: {
          id: createLifeContextId(kind, name),
          name,
          ...(detail ? { species: detail } : {})
        }
      };
    case "place":
      return {
        kind,
        value: {
          id: createLifeContextId(kind, name),
          name,
          type: "custom",
          privacyLevel: detail === "exact" || detail === "approximate" || detail === "hidden" ? detail : "vague",
          ...(detail && !["exact", "approximate", "hidden", "vague"].includes(detail) ? { notes: detail } : {})
        }
      };
    case "life_period":
      return {
        kind,
        value: {
          id: createLifeContextId(kind, name),
          name,
          datePrecision: "unknown",
          ...(detail ? { notes: detail } : {})
        }
      };
  }
}

function lifeContextKindLabel(kind: LifeContextKind): string {
  switch (kind) {
    case "person":
      return "People";
    case "pet":
      return "Pets";
    case "place":
      return "Places";
    case "life_period":
      return "Life periods";
  }
}

function lifeContextDetailPlaceholder(kind: LifeContextKind): string {
  switch (kind) {
    case "person":
      return "Relationship";
    case "pet":
      return "Species";
    case "place":
      return "Privacy or notes";
    case "life_period":
      return "Notes";
  }
}

type ReviewInboxItem = ReturnType<typeof buildReviewInbox>[number];

function ReviewInboxView(props: {
  archive: MemoryArchive;
  onAccept: (item: ReviewInboxItem) => Promise<void>;
  onReject: (item: ReviewInboxItem) => Promise<void>;
  onSelect: (id: string) => void;
}) {
  const items = buildReviewInbox(props.archive);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nothing to review</Text>
        </View>
      ) : (
        items.map((item) => {
          const memory = props.archive.memories.find((candidate) => candidate.id === item.memoryId);
          return (
            <Pressable key={item.id} style={styles.reviewItem} onPress={() => props.onSelect(item.memoryId)}>
              <Text style={styles.reviewType}>{reviewTypeLabel(item.type)}</Text>
              <Text style={styles.memoryTitle}>{item.label}</Text>
              {memory ? (
                <Text style={styles.memoryPreview} numberOfLines={2}>
                  {memory.cleanedText || memory.rawText}
                </Text>
              ) : null}
              <Text style={styles.metadata}>Confidence {Math.round(item.confidence * 100)}%</Text>
              <View style={styles.actionRow}>
                {item.type !== "untagged_memory" ? (
                  <PrimaryButton label="Accept" onPress={() => void props.onAccept(item)} icon={<Save size={18} />} />
                ) : null}
                {item.type === "tag_suggestion" ? (
                  <SecondaryButton label="Reject" onPress={() => void props.onReject(item)} icon={<X size={18} />} />
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function TimelineView(props: { archive: MemoryArchive; memories: Memory[]; onSelect: (id: string) => void }) {
  const [tab, setTab] = useState<ExploreTab>("timeline");
  const buckets = buildTimelineBuckets(props.memories);
  const graph = buildTagGraphData(props.archive);
  const clusters = buildTagClusters(props.archive);
  const chapters = buildLifeChapterCandidates(props.archive);
  const memoriesById = new Map(props.archive.memories.map((memory) => [memory.id, memory]));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.segmentRow}>
        {(["timeline", "graph", "clusters", "chapters"] as ExploreTab[]).map((nextTab) => (
          <Pressable
            key={nextTab}
            onPress={() => setTab(nextTab)}
            style={[styles.segment, tab === nextTab ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, tab === nextTab ? styles.segmentTextActive : null]}>{nextTab}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "timeline" && buckets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No timeline entries</Text>
        </View>
      ) : null}

      {tab === "timeline" ? (
        buckets.map((bucket) => (
          <View key={bucket.key} style={styles.timelineBucket}>
            <Text style={styles.timelineYear}>{bucket.label}</Text>
            {bucket.entries.map((entry) => (
              <Pressable
                key={entry.memory.id}
                style={[
                  styles.timelineItem,
                  entry.certainty === "inferred" ? styles.timelineItemInferred : null,
                  entry.span === "range" ? styles.timelineItemRange : null,
                  entry.certainty === "unknown" ? styles.timelineItemUnknown : null
                ]}
                onPress={() => props.onSelect(entry.memory.id)}
              >
                <View style={styles.timelineItemHeader}>
                  <Text style={styles.memoryTitle}>{entry.memory.title}</Text>
                  <Text style={styles.timelineBadge}>{formatTimelineBadge(entry.certainty, entry.span)}</Text>
                </View>
                <Text style={styles.memoryPreview} numberOfLines={2}>
                  {entry.memory.cleanedText || entry.memory.rawText}
                </Text>
                <Text style={styles.metadata}>{entry.dateLabel}</Text>
              </Pressable>
            ))}
          </View>
        ))
      ) : null}

      {tab === "graph" ? (
        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Tag graph</Text>
          <Text style={styles.metadata}>
            {graph.nodes.length} nodes · {graph.edges.length} links
          </Text>
          {graph.nodes.slice(0, 20).map((node) => (
            <View key={node.id} style={styles.graphRow}>
              <Text style={styles.memoryTitle}>{node.label}</Text>
              <Text style={styles.timelineBadge}>{node.kind}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "clusters" ? (
        clusters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No clusters yet</Text>
          </View>
        ) : (
          clusters.map((cluster) => (
            <View key={cluster.id} style={styles.filterPanel}>
              <Text style={styles.panelTitle}>{cluster.label}</Text>
              <Text style={styles.metadata}>
                {cluster.memoryIds.length} memories · {cluster.basis.replace("_", " ")}
              </Text>
              {cluster.memoryIds.map((memoryId) => {
                const memory = memoriesById.get(memoryId);
                if (!memory) return null;
                return (
                  <Pressable key={memoryId} style={styles.relatedItem} onPress={() => props.onSelect(memoryId)}>
                    <Text style={styles.memoryTitle}>{memory.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )
      ) : null}

      {tab === "chapters" ? (
        chapters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No chapter candidates yet</Text>
          </View>
        ) : (
          chapters.map((chapter) => (
            <View key={chapter.id} style={styles.filterPanel}>
              <Text style={styles.panelTitle}>{chapter.name}</Text>
              <Text style={styles.metadata}>
                {chapter.memoryIds.length} memories · {chapter.basis.replace("_", " ")}
              </Text>
              {chapter.memoryIds.slice(0, 5).map((memoryId) => {
                const memory = memoriesById.get(memoryId);
                if (!memory) return null;
                return (
                  <Pressable key={memoryId} style={styles.relatedItem} onPress={() => props.onSelect(memoryId)}>
                    <Text style={styles.memoryTitle}>{memory.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )
      ) : null}
    </ScrollView>
  );
}

function reviewTypeLabel(type: string): string {
  switch (type) {
    case "tag_suggestion":
      return "Suggested tag";
    case "date_suggestion":
      return "Suggested date";
    case "untagged_memory":
      return "Needs tags";
    default:
      return "Review";
  }
}

function MemoryList(props: {
  archive: MemoryArchive;
  memories: Memory[];
  query: string;
  onQueryChange: (query: string) => void;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  semanticSearchPending: boolean;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  selectedDatePrecision?: DatePrecision;
  onSelectDatePrecision: (precision: DatePrecision) => void;
  onClearFilters: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.searchRow}>
        <Search size={20} color="#5f655d" />
        <TextInput
          value={props.query}
          onChangeText={props.onQueryChange}
          placeholder={props.searchMode === "semantic" ? "Search by meaning" : "Search memories or tags"}
          placeholderTextColor="#7b8178"
          style={styles.searchInput}
        />
      </View>
      <View style={styles.segmentRow}>
        {(["keyword", "semantic"] as SearchMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => props.onSearchModeChange(mode)}
            style={[styles.segment, props.searchMode === mode ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, props.searchMode === mode ? styles.segmentTextActive : null]}>
              {mode}
            </Text>
          </Pressable>
        ))}
        {props.semanticSearchPending ? <Text style={styles.metadata}>Searching local index</Text> : null}
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Filters</Text>
        <View style={styles.tags}>
          {props.archive.tags.length === 0 ? <Text style={styles.metadata}>No tags yet</Text> : null}
          {props.archive.tags.map((tag) => (
            <Pressable
              key={tag.id}
              onPress={() => props.onToggleTag(tag.id)}
              style={[styles.tag, props.selectedTagIds.includes(tag.id) ? styles.tagSelected : null]}
            >
              <Text style={[styles.tagLabel, props.selectedTagIds.includes(tag.id) ? styles.tagLabelSelected : null]}>
                {tag.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.segmentRow}>
          {(["unknown", "year", "grade", "range", "exact"] as DatePrecision[]).map((precision) => (
            <Pressable
              key={precision}
              onPress={() => props.onSelectDatePrecision(precision)}
              style={[styles.segment, props.selectedDatePrecision === precision ? styles.segmentActive : null]}
            >
              <Text style={[styles.segmentText, props.selectedDatePrecision === precision ? styles.segmentTextActive : null]}>
                {precision}
              </Text>
            </Pressable>
          ))}
        </View>
        {props.query || props.selectedTagIds.length > 0 || props.selectedDatePrecision ? (
          <SecondaryButton label="Clear filters" onPress={props.onClearFilters} icon={<X size={18} />} />
        ) : null}
      </View>

      {props.memories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{props.query ? "No matching memories" : "No memories yet"}</Text>
          <PrimaryButton label="New memory" onPress={props.onNew} icon={<Plus size={18} />} />
        </View>
      ) : (
        props.memories.map((memory) => (
          <Pressable key={memory.id} style={styles.memoryCard} onPress={() => props.onSelect(memory.id)}>
            <Text style={styles.memoryTitle}>{memory.title}</Text>
            <Text style={styles.memoryPreview} numberOfLines={3}>
              {memory.cleanedText || memory.rawText}
            </Text>
            <TagRow labels={tagsForMemory(props.archive, memory.id).map((tag) => tag.name)} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function TagManagement(props: {
  archive: MemoryArchive;
  onRename: (tagId: string, name: string) => Promise<void>;
  onDelete: (tagId: string) => Promise<void>;
}) {
  const [editingTagId, setEditingTagId] = useState<string | undefined>();
  const [draftName, setDraftName] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {props.archive.tags.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No tags yet</Text>
        </View>
      ) : (
        props.archive.tags.map((tag) => {
          const usageCount = props.archive.memoryTags.filter((link) => link.tagId === tag.id && !link.rejected).length;
          const isEditing = editingTagId === tag.id;

          return (
            <View key={tag.id} style={styles.tagCard}>
              {isEditing ? (
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Tag name"
                  placeholderTextColor="#7b8178"
                  style={styles.tagInput}
                />
              ) : (
                <View>
                  <Text style={styles.memoryTitle}>{tag.name}</Text>
                  <Text style={styles.metadata}>
                    {tag.type} · {usageCount} {usageCount === 1 ? "memory" : "memories"}
                  </Text>
                </View>
              )}
              <View style={styles.headerActions}>
                {isEditing ? (
                  <>
                    <IconButton
                      label="Save tag"
                      onPress={async () => {
                        await props.onRename(tag.id, draftName);
                        setEditingTagId(undefined);
                      }}
                      icon={<Save size={20} />}
                    />
                    <IconButton label="Cancel edit" onPress={() => setEditingTagId(undefined)} icon={<X size={20} />} />
                  </>
                ) : (
                  <>
                    <IconButton
                      label="Rename tag"
                      onPress={() => {
                        setEditingTagId(tag.id);
                        setDraftName(tag.name);
                      }}
                      icon={<Edit3 size={20} />}
                    />
                    <IconButton label="Delete tag" danger onPress={() => void props.onDelete(tag.id)} icon={<Trash2 size={20} />} />
                  </>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function MemoryEditor(props: {
  archive: MemoryArchive;
  memory?: Memory;
  onCancel: () => void;
  onSave: (memory: Memory, tagText: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(props.memory?.title ?? "");
  const [text, setText] = useState(props.memory?.rawText ?? "");
  const [tagText, setTagText] = useState(
    props.memory ? tagsForMemory(props.archive, props.memory.id).map((tag) => tag.name).join(", ") : ""
  );
  const [startDate, setStartDate] = useState(props.memory?.approximateStartDate ?? "");
  const [endDate, setEndDate] = useState(props.memory?.approximateEndDate ?? "");
  const [datePrecision, setDatePrecision] = useState<DatePrecision>(props.memory?.datePrecision ?? "unknown");
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [dateSuggestions, setDateSuggestions] = useState<DateCandidate[]>([]);

  const canSave = text.trim().length > 0;

  async function save() {
    if (!canSave) return;
    const now = new Date().toISOString();
    const trimmedTitle = title.trim();
    const trimmedStartDate = startDate.trim();
    const trimmedEndDate = endDate.trim();
    const memory = props.memory
      ? buildUpdatedMemory({
          ...props.memory,
          rawText: text.trim(),
          cleanedText: text.trim(),
          ...(trimmedTitle || props.memory.title ? { title: trimmedTitle || props.memory.title } : {}),
          updatedAt: now,
          datePrecision,
          userDateConfirmed: Boolean(trimmedStartDate || trimmedEndDate)
        }, trimmedStartDate, trimmedEndDate)
      : buildUpdatedMemory({ ...createMemory(text, title), datePrecision }, trimmedStartDate, trimmedEndDate);

    await props.onSave(memory, tagText);
  }

  function generateSuggestions() {
    const nextTagSuggestions = suggestTags(text);
    const nextDateSuggestions = extractDateCandidates(text);
    setTagSuggestions(nextTagSuggestions);
    setDateSuggestions(nextDateSuggestions);

    const existingTags = new Set(tagText.split(",").map((tag) => tag.trim().toLocaleLowerCase()).filter(Boolean));
    const mergedTags = [
      ...tagText.split(",").map((tag) => tag.trim()).filter(Boolean),
      ...nextTagSuggestions.filter((tag) => !existingTags.has(tag.name.toLocaleLowerCase())).map((tag) => tag.name)
    ];
    setTagText(mergedTags.join(", "));

    const preferredDate = nextDateSuggestions[0];
    if (preferredDate) {
      setDatePrecision(preferredDate.precision);
      setStartDate(preferredDate.startDate ?? "");
      setEndDate(preferredDate.endDate ?? "");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor="#7b8178"
        style={styles.titleInput}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write a memory"
        placeholderTextColor="#7b8178"
        multiline
        textAlignVertical="top"
        style={styles.bodyInput}
      />
      <TextInput
        value={tagText}
        onChangeText={setTagText}
        placeholder="Tags, separated by commas"
        placeholderTextColor="#7b8178"
        style={styles.tagInput}
      />
      <View style={styles.datePanel}>
        <View style={styles.panelHeader}>
          <CalendarDays size={18} color="#374236" />
          <Text style={styles.panelTitle}>Memory date</Text>
        </View>
        <View style={styles.segmentRow}>
          {(["unknown", "year", "grade", "range", "exact"] as DatePrecision[]).map((precision) => (
            <Pressable
              key={precision}
              onPress={() => setDatePrecision(precision)}
              style={[styles.segment, datePrecision === precision ? styles.segmentActive : null]}
            >
              <Text style={[styles.segmentText, datePrecision === precision ? styles.segmentTextActive : null]}>
                {precision}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.dateInputs}>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="Start date"
            placeholderTextColor="#7b8178"
            style={styles.dateInput}
          />
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="End date"
            placeholderTextColor="#7b8178"
            style={styles.dateInput}
          />
        </View>
      </View>
      {tagSuggestions.length > 0 || dateSuggestions.length > 0 ? (
        <View style={styles.suggestionPanel}>
          <Text style={styles.panelTitle}>Suggested metadata</Text>
          <TagRow labels={tagSuggestions.map((tag) => tag.name)} />
          {dateSuggestions.map((candidate) => (
            <Text key={`${candidate.label}-${candidate.startDate ?? ""}`} style={styles.metadata}>
              {candidate.label}: {candidate.startDate ?? "unknown"} {candidate.endDate ? `to ${candidate.endDate}` : ""}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.actionRow}>
        <SecondaryButton label="Cancel" onPress={props.onCancel} icon={<X size={18} />} />
        <SecondaryButton label="Suggest" onPress={generateSuggestions} icon={<Wand2 size={18} />} />
        <PrimaryButton label="Save" onPress={save} disabled={!canSave} icon={<Save size={18} />} />
      </View>
    </ScrollView>
  );
}

function MemoryDetail(props: {
  archive: MemoryArchive;
  memory: Memory;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onSelect: (id: string) => void;
}) {
  const [relatedMemories, setRelatedMemories] = useState<RelatedMemoryResult[]>([]);

  useEffect(() => {
    let isCurrent = true;
    void findRelatedMemories(props.archive, props.memory.id, { limit: 3 }).then((results) => {
      if (isCurrent) setRelatedMemories(results);
    });
    return () => {
      isCurrent = false;
    };
  }, [props.archive, props.memory.id]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>{props.memory.title}</Text>
        <View style={styles.headerActions}>
          <IconButton label="Edit" onPress={props.onEdit} icon={<Edit3 size={20} />} />
          <IconButton
            label="Delete"
            danger
            onPress={() => {
              if (Platform.OS === "web") {
                void props.onDelete();
                return;
              }
              Alert.alert("Delete memory", "Move this memory out of the active archive?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => void props.onDelete() }
              ]);
            }}
            icon={<Trash2 size={20} />}
          />
        </View>
      </View>
      <Text style={styles.memoryBody}>{props.memory.cleanedText || props.memory.rawText}</Text>
      <TagRow labels={tagsForMemory(props.archive, props.memory.id).map((tag) => tag.name)} />
      <Text style={styles.metadata}>Created {new Date(props.memory.createdAt).toLocaleString()}</Text>
      <Text style={styles.metadata}>
        Memory date: {formatMemoryDate(props.memory)} ({props.memory.datePrecision})
      </Text>
      {relatedMemories.length > 0 ? (
        <View style={styles.relatedPanel}>
          <Text style={styles.panelTitle}>Related memories</Text>
          {relatedMemories.map((result) => (
            <Pressable key={result.memory.id} style={styles.relatedItem} onPress={() => props.onSelect(result.memory.id)}>
              <Text style={styles.memoryTitle}>{result.memory.title}</Text>
              <Text style={styles.memoryPreview} numberOfLines={2}>
                {result.memory.cleanedText || result.memory.rawText}
              </Text>
              <Text style={styles.metadata}>{formatRelatedReasons(result)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Settings(props: {
  archive: MemoryArchive;
  appLockSettings: AppLockSettings;
  onImport: (preview: ArchiveImportWorkflowPreview) => Promise<void>;
  onClearProcessingRuns: () => Promise<void>;
  onClearRetainedAudio: () => Promise<void>;
  onEnableBiometricLock: () => Promise<void>;
  onDisableAppLock: () => Promise<void>;
  onLockNow: () => Promise<void>;
  onRestore: (memoryId: string) => Promise<void>;
  onPermanentlyDelete: (memoryId: string) => Promise<void>;
}) {
  const deletedMemories = props.archive.memories.filter((memory) => memory.deletedAt);
  const summary = summarizeArchive(props.archive);
  const audit = buildDataAuditReport(props.archive);
  const [importPreview, setImportPreview] = useState<ArchiveImportWorkflowPreview | undefined>();
  const [portabilityError, setPortabilityError] = useState<string | undefined>();

  async function shareJson() {
    const [artifact] = await new JsonExportProvider().exportArchive(props.archive);
    if (artifact) await shareExportArtifact(artifact);
  }

  async function shareMarkdown() {
    const artifacts = await new MarkdownExportProvider().exportArchive(props.archive);
    await shareExportArtifact(combineMarkdownArtifacts(artifacts));
  }

  async function previewImport() {
    setPortabilityError(undefined);
    const artifacts = await pickImportArtifacts();
    if (artifacts.length === 0) return;
    try {
      setImportPreview(await previewArchiveImport(props.archive, artifacts));
    } catch (error) {
      setPortabilityError(error instanceof Error ? error.message : "Import preview failed.");
    }
  }

  async function applyImport() {
    if (!importPreview) return;
    await props.onImport(importPreview);
    setImportPreview(undefined);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.statsGrid}>
        <Stat label="Memories" value={String(summary.activeMemoryCount)} />
        <Stat label="Deleted" value={String(summary.deletedMemoryCount)} />
        <Stat label="Tags" value={String(summary.tagCount)} />
        <Stat label="Retained audio" value={String(summary.retainedAudioCount)} />
        <Stat label="Confirmed dates" value={String(summary.confirmedDateCount)} />
        <Stat label="Inferred dates" value={String(summary.inferredDateCount)} />
        <Stat label="Processing runs" value={String(summary.processingRunCount)} />
        <Stat label="Embeddings" value={String(audit.embeddingCount)} />
        <Stat label="Vector bytes" value={String(audit.estimatedEmbeddingBytes)} />
        <Stat label="Schema" value={props.archive.schemaVersion} />
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Data audit</Text>
        <Text style={styles.metadata}>Local modes: {audit.localProcessingModes.join(", ")}</Text>
        <Text style={styles.metadata}>Retained audio references: {audit.retainedAudioCount}</Text>
        <Text style={styles.metadata}>Generated processing logs: {audit.processingRunCount}</Text>
        <Text style={styles.metadata}>Stored embedding vectors: {audit.embeddingCount}</Text>
        <View style={styles.actionRow}>
          <SecondaryButton label="Clear processing logs" onPress={props.onClearProcessingRuns} icon={<Trash2 size={18} />} />
          <SecondaryButton label="Forget audio links" onPress={props.onClearRetainedAudio} icon={<Trash2 size={18} />} />
        </View>
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>App lock</Text>
        <Text style={styles.metadata}>Mode: {props.appLockSettings.mode}</Text>
        <Text style={styles.metadata}>
          Hide previews in switcher: {props.appLockSettings.hidePreviewsInSwitcher ? "yes" : "no"}
        </Text>
        <View style={styles.actionRow}>
          {props.appLockSettings.mode === "disabled" ? (
            <PrimaryButton label="Enable biometric" onPress={props.onEnableBiometricLock} icon={<Lock size={18} />} />
          ) : (
            <>
              <SecondaryButton label="Lock now" onPress={props.onLockNow} icon={<Lock size={18} />} />
              <SecondaryButton label="Disable lock" onPress={props.onDisableAppLock} icon={<X size={18} />} />
            </>
          )}
        </View>
      </View>
      <View style={styles.actionRow}>
        <PrimaryButton label="JSON" onPress={shareJson} icon={<Download size={18} />} />
        <SecondaryButton label="Markdown" onPress={shareMarkdown} icon={<Download size={18} />} />
        <SecondaryButton label="Import" onPress={previewImport} icon={<Download size={18} />} />
      </View>
      {portabilityError ? <Text style={styles.errorText}>{portabilityError}</Text> : null}
      {importPreview ? (
        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Import preview</Text>
          <Text style={styles.metadata}>
            {importPreview.mergePreview.newMemoryCount} new memories, {importPreview.mergePreview.duplicateMemoryCount} duplicates,{" "}
            {importPreview.mergePreview.newTagCount} new tags
          </Text>
          {importPreview.warnings.concat(importPreview.mergePreview.warnings).map((warning) => (
            <Text key={warning} style={styles.errorText}>
              {warning}
            </Text>
          ))}
          <View style={styles.actionRow}>
            <SecondaryButton label="Cancel" onPress={() => setImportPreview(undefined)} icon={<X size={18} />} />
            <PrimaryButton label="Apply import" onPress={applyImport} icon={<Save size={18} />} />
          </View>
        </View>
      ) : null}
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Deleted memories</Text>
        {deletedMemories.length === 0 ? <Text style={styles.metadata}>No deleted memories</Text> : null}
        {deletedMemories.map((memory) => (
          <View key={memory.id} style={styles.deletedRow}>
            <View style={styles.deletedText}>
              <Text style={styles.memoryTitle}>{memory.title}</Text>
              <Text style={styles.metadata}>Deleted {memory.deletedAt ? new Date(memory.deletedAt).toLocaleString() : "recently"}</Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton label="Restore memory" onPress={() => void props.onRestore(memory.id)} icon={<RotateCcw size={20} />} />
              <IconButton
                label="Delete permanently"
                danger
                onPress={() => void props.onPermanentlyDelete(memory.id)}
                icon={<Trash2 size={20} />}
              />
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.privacy}>Processing: on-device. Internet required: no. Memory text leaves device: no.</Text>
    </ScrollView>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{props.value}</Text>
      <Text style={styles.statLabel}>{props.label}</Text>
    </View>
  );
}

function TagRow(props: { labels: string[] }) {
  if (props.labels.length === 0) return null;
  return (
    <View style={styles.tags}>
      {props.labels.map((label) => (
        <View key={label} style={styles.tag}>
          <Text style={styles.tagLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function IconButton(props: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={[styles.iconButton, props.active ? styles.iconButtonActive : null, props.danger ? styles.iconButtonDanger : null]}
    >
      {props.icon}
    </Pressable>
  );
}

function PrimaryButton(props: { label: string; icon: ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={props.onPress} disabled={props.disabled} style={[styles.primaryButton, props.disabled ? styles.disabled : null]}>
      {props.icon}
      <Text style={styles.primaryButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function SecondaryButton(props: { label: string; icon: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.secondaryButton}>
      {props.icon}
      <Text style={styles.secondaryButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function buildUpdatedMemory(memory: Memory, startDate: string, endDate: string): Memory {
  const {
    approximateStartDate: _approximateStartDate,
    approximateEndDate: _approximateEndDate,
    dateConfidence: _dateConfidence,
    dateExplanation: _dateExplanation,
    ...rest
  } = memory;

  return {
    ...rest,
    ...(startDate ? { approximateStartDate: startDate } : {}),
    ...(endDate ? { approximateEndDate: endDate } : {})
  };
}

function formatMemoryDate(memory: Memory): string {
  if (memory.approximateStartDate && memory.approximateEndDate) {
    return `${memory.approximateStartDate} to ${memory.approximateEndDate}`;
  }

  return memory.approximateStartDate ?? memory.approximateEndDate ?? "unknown";
}

function formatTimelineBadge(certainty: "confirmed" | "inferred" | "unknown", span: "point" | "range" | "unknown"): string {
  if (certainty === "unknown") return "unknown";
  if (span === "range") return certainty === "confirmed" ? "confirmed range" : "inferred range";
  return certainty;
}

function formatRelatedReasons(result: RelatedMemoryResult): string {
  const labels = result.reasons.map((reason) => {
    switch (reason) {
      case "shared_tag":
        return result.sharedTagNames.length > 0 ? `shared tags: ${result.sharedTagNames.join(", ")}` : "shared tags";
      case "same_period":
        return "same period";
      case "semantic_similarity":
        return "similar wording";
      default:
        return reason;
    }
  });

  return labels.join(" · ");
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f6f1"
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 960,
    alignSelf: "center"
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingText: {
    color: "#41463f",
    fontSize: 16
  },
  lockScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14
  },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dedbd1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  brand: {
    fontSize: 24,
    fontWeight: "700",
    color: "#252925"
  },
  subtle: {
    marginTop: 2,
    color: "#697067",
    fontSize: 13
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  content: {
    padding: 18,
    gap: 14
  },
  searchRow: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: "#252925",
    fontSize: 16,
    outlineStyle: "none" as never
  },
  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  emptyTitle: {
    color: "#41463f",
    fontSize: 20,
    fontWeight: "700"
  },
  memoryCard: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 8
  },
  memoryTitle: {
    color: "#252925",
    fontSize: 18,
    fontWeight: "700"
  },
  memoryPreview: {
    color: "#50564e",
    fontSize: 15,
    lineHeight: 22
  },
  titleInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    paddingHorizontal: 14,
    color: "#252925",
    fontSize: 18,
    fontWeight: "700",
    outlineStyle: "none" as never
  },
  bodyInput: {
    minHeight: 260,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    color: "#252925",
    fontSize: 16,
    lineHeight: 24,
    outlineStyle: "none" as never
  },
  tagInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    paddingHorizontal: 14,
    color: "#252925",
    fontSize: 16,
    outlineStyle: "none" as never
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  datePanel: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 12
  },
  suggestionPanel: {
    borderWidth: 1,
    borderColor: "#cfd8c8",
    backgroundColor: "#f4f8f0",
    borderRadius: 8,
    padding: 14,
    gap: 10
  },
  relatedPanel: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 10
  },
  relatedItem: {
    borderTopWidth: 1,
    borderTopColor: "#e4e0d5",
    paddingTop: 10,
    gap: 6
  },
  graphRow: {
    borderTopWidth: 1,
    borderTopColor: "#e4e0d5",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  filterPanel: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 10
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  panelTitle: {
    color: "#30352f",
    fontSize: 15,
    fontWeight: "800"
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  segment: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: "#c7cdbf",
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActive: {
    backgroundColor: "#dae7d3",
    borderColor: "#9eb590"
  },
  segmentText: {
    color: "#4e554c",
    fontSize: 13,
    fontWeight: "700"
  },
  segmentTextActive: {
    color: "#263323"
  },
  dateInputs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  dateInput: {
    minHeight: 46,
    minWidth: 160,
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "#252925",
    fontSize: 15,
    outlineStyle: "none" as never
  },
  detailHeader: {
    gap: 12
  },
  detailTitle: {
    color: "#252925",
    fontSize: 26,
    fontWeight: "800"
  },
  memoryBody: {
    color: "#30352f",
    fontSize: 17,
    lineHeight: 27
  },
  metadata: {
    color: "#697067",
    fontSize: 13
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    borderRadius: 999,
    backgroundColor: "#e9eee4",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  tagSelected: {
    backgroundColor: "#38543c"
  },
  tagLabel: {
    color: "#374236",
    fontSize: 13,
    fontWeight: "600"
  },
  tagLabelSelected: {
    color: "#ffffff"
  },
  tagCard: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 12
  },
  timelineBucket: {
    gap: 10
  },
  timelineYear: {
    color: "#252925",
    fontSize: 22,
    fontWeight: "800"
  },
  timelineItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#8aa17f",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 6
  },
  timelineItemInferred: {
    borderLeftColor: "#c0ad72",
    backgroundColor: "#fffaf0"
  },
  timelineItemRange: {
    borderLeftWidth: 6
  },
  timelineItemUnknown: {
    borderLeftColor: "#b7b9b0",
    backgroundColor: "#f3f2ed"
  },
  timelineItemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  timelineBadge: {
    color: "#4e554c",
    backgroundColor: "#e9eee4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden"
  },
  deletedRow: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 12,
    gap: 10
  },
  reviewItem: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 8
  },
  reviewType: {
    color: "#5d6b58",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  errorText: {
    color: "#9a3d2f",
    fontSize: 14,
    fontWeight: "700"
  },
  deletedText: {
    gap: 2
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    justifyContent: "center"
  },
  iconButtonActive: {
    backgroundColor: "#dae7d3",
    borderColor: "#9eb590"
  },
  iconButtonDanger: {
    backgroundColor: "#fff4f0",
    borderColor: "#dfb7a8"
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#38543c",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfc5b9",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  secondaryButtonText: {
    color: "#30352f",
    fontSize: 15,
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.45
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  stat: {
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14
  },
  statValue: {
    color: "#252925",
    fontSize: 22,
    fontWeight: "800"
  },
  statLabel: {
    color: "#697067",
    fontSize: 13,
    marginTop: 3
  },
  privacy: {
    color: "#41463f",
    fontSize: 14,
    lineHeight: 21
  }
});
