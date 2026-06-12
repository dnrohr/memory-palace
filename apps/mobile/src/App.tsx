import { CalendarDays, ClipboardList, Download, Edit3, Lock, MapPin, Mic, Plus, RotateCcw, Save, Search, Settings as SettingsIcon, Square, Tags, Trash2, Users, Wand2, X } from "lucide-react-native";
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
import type { DateCandidate, DatePrecision, Memory, TagSuggestion, TagType } from "../../../src/core/types";
import type { AppLockSettings } from "../../../src/security/appLock";
import type { EncryptionKeySource, EncryptionScope, EncryptionSettings } from "../../../src/security/encryption";
import {
  buildTimelineBuckets,
  appendMemoryAddendum,
  deleteTag,
  filterTimelineBuckets,
  filterMemories,
  mergeTags,
  permanentlyDeleteMemory,
  renameTag,
  restoreMemory,
  mergeMemories,
  summarizeArchive,
  splitMemory,
  updateTagType
} from "../../../src/core/archiveOperations";
import type { TimelineBucketFilter } from "../../../src/core/archiveOperations";
import { JsonExportProvider } from "../../../src/export/jsonExport";
import { MarkdownBundleExportProvider } from "../../../src/export/markdownBundle";
import { MarkdownExportProvider } from "../../../src/export/markdownExport";
import { SqliteExportProvider } from "../../../src/export/sqliteExport";
import {
  applyArchiveImport,
  previewArchiveImport,
  type ArchiveImportWorkflowPreview,
  type ArchiveMergeOptions
} from "../../../src/import/importWorkflow";
import { createLifeContextId, type LifeContextEntity } from "../../../src/core/lifeContext";
import { extractDateCandidates } from "../../../src/processing/rules/dateExtraction";
import { suggestTags } from "../../../src/processing/rules/tagSuggestion";
import { acceptReviewItem, buildReviewInbox, rejectReviewItem } from "../../../src/processing/reviewInbox";
import { buildResurfacingPrompts, type ResurfacingPrompt } from "../../../src/product/resurfacing";
import { findStaleEmbeddingMemoryIds, rebuildEmbeddingIndex, searchEmbeddingIndex } from "../../../src/search/embeddingIndex";
import { findRelatedMemories, type RelatedMemoryResult } from "../../../src/search/relatedMemories";
import { searchArchive } from "../../../src/search/searchService";
import {
  buildDataAuditReport,
  clearDeletedMemoryArtifacts,
  clearProcessingRuns,
  clearRetainedAudioReferences
} from "../../../src/security/dataAudit";
import { buildTagClusters } from "../../../src/visualization/clusters";
import { buildGraphNeighborhood, buildTagGraphData } from "../../../src/visualization/graph";
import {
  buildLifeChapterCandidates,
  mergeLifeChapterCandidate,
  rejectLifeChapterCandidate,
  renameLifeChapterCandidate,
  splitLifeChapterCandidate,
  type LifeChapterCandidate
} from "../../../src/visualization/lifeChapters";
import {
  createMemory,
  deleteLifeContext,
  loadArchive,
  replaceTags,
  saveArchive,
  searchMemoryIdsWithFts,
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
  AudioCaptureError,
  type AudioCaptureDraft,
  type AudioCaptureSession
} from "./audioCapture";
import { combineBundleArtifacts, combineMarkdownArtifacts, pickImportArtifacts, shareExportArtifact } from "./filePortability";
import { ExpoBiometricAppLockProvider } from "./appLockProvider";

type ViewMode = "list" | "editor" | "detail" | "voice" | "timeline" | "review" | "context" | "tags" | "settings";
type SearchMode = "keyword" | "semantic";
type ExploreTab = "timeline" | "graph" | "clusters" | "chapters";
type TimelineCertaintyFilter = "all" | "confirmed" | "inferred" | "unknown";
type TimelineSpanFilter = "all" | "point" | "range" | "unknown";
type StructuredExtractionMode = "none" | "rules";
type EmbeddingMaintenanceMode = "automatic" | "manual";

export default function App() {
  const appLockProvider = useMemo(() => new ExpoBiometricAppLockProvider(), []);
  const [archive, setArchive] = useState<MemoryArchive | undefined>();
  const [appLockSettings, setAppLockSettings] = useState<AppLockSettings>({
    mode: "disabled",
    autoLockTimeoutMs: 0,
    hidePreviewsInSwitcher: false
  });
  const [encryptionSettings, setEncryptionSettings] = useState<EncryptionSettings>({
    scope: "disabled",
    keySource: "none",
    requireUnlockForExport: false
  });
  const [structuredExtractionMode, setStructuredExtractionMode] = useState<StructuredExtractionMode>("rules");
  const [embeddingMaintenanceMode, setEmbeddingMaintenanceMode] = useState<EmbeddingMaintenanceMode>("automatic");
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [postSaveMemoryId, setPostSaveMemoryId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [semanticMemories, setSemanticMemories] = useState<Memory[]>([]);
  const [semanticSearchPending, setSemanticSearchPending] = useState(false);
  const [ftsMemoryIds, setFtsMemoryIds] = useState<string[] | undefined>();
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
    const filtered = filterMemories(archive, {
      text: query,
      tagIds: selectedTagIds,
      datePrecisions: selectedDatePrecision ? [selectedDatePrecision] : []
    });

    if (!query.trim() || !ftsMemoryIds) return filtered;

    const memoriesById = new Map(
      filterMemories(archive, {
        tagIds: selectedTagIds,
        datePrecisions: selectedDatePrecision ? [selectedDatePrecision] : []
      }).map((memory) => [memory.id, memory])
    );
    return ftsMemoryIds.map((id) => memoriesById.get(id)).filter((memory): memory is Memory => Boolean(memory));
  }, [archive, ftsMemoryIds, query, selectedDatePrecision, selectedTagIds]);

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
  const prompts = useMemo(() => (archive ? buildResurfacingPrompts(archive) : []), [archive]);

  useEffect(() => {
    if (!query.trim()) {
      setFtsMemoryIds(undefined);
      return;
    }

    let isCurrent = true;
    void searchMemoryIdsWithFts(query).then((ids) => {
      if (isCurrent) setFtsMemoryIds(ids);
    });
    return () => {
      isCurrent = false;
    };
  }, [query]);

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

  async function persist(nextArchive: MemoryArchive, options: { rebuildEmbeddings?: boolean } = {}) {
    const shouldRebuildEmbeddings = embeddingMaintenanceMode === "automatic" || options.rebuildEmbeddings;
    const archiveToSave = shouldRebuildEmbeddings ? (await rebuildEmbeddingIndex(nextArchive)).archive : nextArchive;
    setArchive(archiveToSave);
    await saveArchive(archiveToSave);
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
          mode={appLockSettings.mode}
          onUnlock={async (secret) => {
            const unlocked = await appLockProvider.unlock(secret);
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
            prompts={prompts}
            onPrompt={(prompt) => {
              if (prompt.memoryId) {
                setSelectedId(prompt.memoryId);
                setMode("detail");
                return;
              }
              if (prompt.tagId) {
                setSelectedTagIds([prompt.tagId]);
                setMode("list");
              }
            }}
            onSelect={(id) => {
              setSelectedId(id);
              setMode("detail");
            }}
            onNew={() => {
              setSelectedId(undefined);
              setMode("editor");
            }}
            onTimeline={() => setMode("timeline")}
            onContext={() => setMode("context")}
            onTags={() => setMode("tags")}
            onFastCapture={async (text) => {
              const memory = createMemory(text);
              await persist(upsertMemory(archive, memory));
              setSelectedId(memory.id);
              setPostSaveMemoryId(memory.id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "editor" ? (
          <MemoryEditor
            archive={archive}
            structuredExtractionMode={structuredExtractionMode}
            {...(selectedMemory ? { memory: selectedMemory } : {})}
            onVoice={() => setMode("voice")}
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
              if (!selectedMemory) setPostSaveMemoryId(memory.id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "detail" && selectedMemory ? (
          <MemoryDetail
            archive={archive}
            memory={selectedMemory}
            postSaveActive={postSaveMemoryId === selectedMemory.id}
            postSaveItems={buildReviewInbox(archive)
              .filter((item) => item.memoryId === selectedMemory.id && item.type !== "untagged_memory")
              .slice(0, 4)}
            onEdit={() => setMode("editor")}
            onSelect={(id) => {
              setPostSaveMemoryId(undefined);
              setSelectedId(id);
              setMode("detail");
            }}
            onAcceptPostSave={async (item) => persist(acceptReviewItem(archive, item))}
            onDismissPostSave={() => setPostSaveMemoryId(undefined)}
            onAddendum={async (text) => persist(appendMemoryAddendum(archive, selectedMemory.id, text))}
            onSplit={async (splitIndex) => persist(splitMemory(archive, selectedMemory.id, splitIndex))}
            onMergeRelated={async (sourceMemoryId) => persist(mergeMemories(archive, selectedMemory.id, sourceMemoryId))}
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
              setPostSaveMemoryId(memory.id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "timeline" ? (
          <TimelineView
            archive={archive}
            memories={memories}
            onArchiveChange={persist}
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
            onTypeChange={async (tagId, type) => persist(updateTagType(archive, tagId, type))}
            onMerge={async (sourceTagId, targetTagId) => {
              await persist(mergeTags(archive, sourceTagId, targetTagId));
              setSelectedTagIds((current) => current.map((id) => (id === sourceTagId ? targetTagId : id)));
            }}
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
            encryptionSettings={encryptionSettings}
            structuredExtractionMode={structuredExtractionMode}
            embeddingMaintenanceMode={embeddingMaintenanceMode}
            onImport={async (preview, options) => persist(applyArchiveImport(archive, preview, options))}
            onClearProcessingRuns={async () => persist(clearProcessingRuns(archive))}
            onClearRetainedAudio={async () => persist(clearRetainedAudioReferences(archive))}
            onClearDeletedArtifacts={async () => persist(clearDeletedMemoryArtifacts(archive))}
            onRegenerateEmbeddings={async () => persist(archive, { rebuildEmbeddings: true })}
            onEnableBiometricLock={async () =>
              saveAppLockSettings({
                mode: "biometric",
                autoLockTimeoutMs: 60_000,
                hidePreviewsInSwitcher: true
              })
            }
            onSavePin={async (pin) => {
              await appLockProvider.savePin(pin);
              setAppLockSettings(await appLockProvider.getSettings());
              setIsAppLocked(await appLockProvider.isLocked());
            }}
            onDisableAppLock={async () =>
              appLockSettings.mode === "pin"
                ? appLockProvider.clearPin().then(async () => {
                    setAppLockSettings(await appLockProvider.getSettings());
                    setIsAppLocked(await appLockProvider.isLocked());
                  })
                : saveAppLockSettings({
                    mode: "disabled",
                    autoLockTimeoutMs: 0,
                    hidePreviewsInSwitcher: false
                  })
            }
            onLockNow={async () => {
              await appLockProvider.lock();
              setIsAppLocked(await appLockProvider.isLocked());
            }}
            onSaveEncryptionSettings={async (settings) => setEncryptionSettings(settings)}
            onStructuredExtractionModeChange={async (mode) => setStructuredExtractionMode(mode)}
            onEmbeddingMaintenanceModeChange={async (mode) => setEmbeddingMaintenanceMode(mode)}
            onRestore={async (memoryId) => persist(restoreMemory(archive, memoryId))}
            onPermanentlyDelete={async (memoryId) => persist(permanentlyDeleteMemory(archive, memoryId))}
          />
        ) : null}

        <BottomNavigation
          mode={mode}
          onExplore={() => setMode("list")}
          onCapture={() => {
            setSelectedId(undefined);
            setMode("editor");
          }}
          onReview={() => setMode("review")}
          onSettings={() => setMode("settings")}
        />
      </View>
    </SafeAreaView>
  );
}

function Header(props: {
  mode: ViewMode;
  onSettings: () => void;
}) {
  const title = screenTitle(props.mode);
  const subtitle = screenSubtitle(props.mode);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>{title}</Text>
        <Text style={styles.subtle}>{subtitle}</Text>
      </View>
      <View style={styles.headerActions}>
        <IconButton label="Settings" active={props.mode === "settings"} onPress={props.onSettings} icon={<SettingsIcon size={20} />} />
      </View>
    </View>
  );
}

function BottomNavigation(props: {
  mode: ViewMode;
  onExplore: () => void;
  onCapture: () => void;
  onReview: () => void;
  onSettings: () => void;
}) {
  const exploreActive = ["list", "timeline", "detail", "context", "tags"].includes(props.mode);

  return (
    <View style={styles.bottomNav}>
      <NavButton label="Explore" active={exploreActive} onPress={props.onExplore} icon={<Search size={20} />} />
      <Pressable accessibilityLabel="New memory" onPress={props.onCapture} style={styles.captureButton}>
        <Plus size={26} color="#ffffff" />
      </Pressable>
      <NavButton label="Review" active={props.mode === "review"} onPress={props.onReview} icon={<ClipboardList size={20} />} />
      <NavButton label="Settings" active={props.mode === "settings"} onPress={props.onSettings} icon={<SettingsIcon size={20} />} />
    </View>
  );
}

function NavButton(props: { label: string; icon: ReactNode; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={[styles.navButton, props.active ? styles.navButtonActive : null]}>
      {props.icon}
      <Text style={[styles.navLabel, props.active ? styles.navLabelActive : null]}>{props.label}</Text>
    </Pressable>
  );
}

function screenTitle(mode: ViewMode): string {
  switch (mode) {
    case "editor":
      return "New Memory";
    case "voice":
      return "Voice";
    case "detail":
      return "Memory";
    case "timeline":
      return "Ways through";
    case "review":
      return "Review";
    case "context":
      return "People, Pets, Places";
    case "tags":
      return "Themes";
    case "settings":
      return "Settings";
    default:
      return "Explore";
  }
}

function screenSubtitle(mode: ViewMode): string {
  switch (mode) {
    case "editor":
      return "A fragment is enough";
    case "voice":
      return "No audio is kept unless you choose";
    case "review":
      return "Possible details";
    case "settings":
      return "Privacy, storage, and portability";
    case "timeline":
    case "context":
    case "tags":
      return "Move through the archive";
    default:
      return "Local memory archive";
  }
}

function UnlockView(props: { mode: AppLockSettings["mode"]; onUnlock: (secret?: string) => Promise<boolean> }) {
  const [error, setError] = useState<string | undefined>();
  const [pin, setPin] = useState("");

  async function unlock() {
    setError(undefined);
    const unlocked = await props.onUnlock(props.mode === "pin" ? pin : undefined);
    if (!unlocked) setError("Unlock was not completed.");
  }

  return (
    <View style={styles.lockScreen}>
      <Lock size={32} color="#374236" />
      <Text style={styles.detailTitle}>Memory Palace is locked</Text>
      {props.mode === "pin" ? (
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="PIN"
          placeholderTextColor="#7b8178"
          secureTextEntry
          keyboardType="number-pad"
          style={styles.tagInput}
        />
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <PrimaryButton label="Unlock" onPress={unlock} icon={<Lock size={18} />} />
    </View>
  );
}

function VoiceCaptureView(props: { onSave: (draft: AudioCaptureDraft) => Promise<void> }) {
  const [session, setSession] = useState<AudioCaptureSession | undefined>();
  const [draft, setDraft] = useState<AudioCaptureDraft | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "requesting_permission" | "recording" | "stopping" | "draft_ready">("idle");

  async function start() {
    setError(undefined);
    setStatus("requesting_permission");
    try {
      const granted = await requestAudioCapturePermission();
      if (!granted) {
        setError("Microphone permission was denied.");
        setStatus("idle");
        return;
      }

      setSession(await startAudioCapture());
      setDraft(undefined);
      setStatus("recording");
    } catch (error) {
      setError(formatAudioCaptureError(error, "Recording could not be started."));
      setStatus("idle");
    }
  }

  async function stop() {
    if (!session) return;
    setError(undefined);
    setStatus("stopping");
    try {
      const artifact = await stopAudioCapture(session);
      setSession(undefined);
      setDraft({
        artifact,
        transcript: "",
        retainAudio: false
      });
      setStatus("draft_ready");
    } catch (error) {
      setError(formatAudioCaptureError(error, "Recording could not be saved."));
      setSession(undefined);
      setStatus("idle");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Voice capture</Text>
        <Text style={styles.metadata}>Status: {voiceCaptureStatusLabel(status)}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {session ? (
          <PrimaryButton label="Stop recording" onPress={stop} icon={<Square size={18} />} />
        ) : (
          <PrimaryButton
            label={status === "requesting_permission" ? "Requesting permission" : "Start recording"}
            onPress={start}
            disabled={status === "requesting_permission" || status === "stopping"}
            icon={<Mic size={18} />}
          />
        )}
        {error ? <SecondaryButton label="Try again" onPress={start} icon={<RotateCcw size={18} />} /> : null}
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

function voiceCaptureStatusLabel(status: "idle" | "requesting_permission" | "recording" | "stopping" | "draft_ready"): string {
  switch (status) {
    case "requesting_permission":
      return "requesting microphone access";
    case "recording":
      return "recording";
    case "stopping":
      return "saving audio";
    case "draft_ready":
      return "draft ready";
    case "idle":
      return "ready";
  }
}

function formatAudioCaptureError(error: unknown, fallback: string): string {
  if (error instanceof AudioCaptureError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
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
              {"sourceText" in item && item.sourceText ? (
                <Text style={styles.metadata}>Source: {item.sourceText}</Text>
              ) : null}
              {"explanation" in item && item.explanation ? (
                <Text style={styles.metadata}>{item.explanation}</Text>
              ) : null}
              <View style={styles.actionRow}>
                {item.type !== "untagged_memory" ? (
                  <PrimaryButton label="Accept" onPress={() => void props.onAccept(item)} icon={<Save size={18} />} />
                ) : null}
                {item.type === "tag_suggestion" ? (
                  <SecondaryButton label="Dismiss" onPress={() => void props.onReject(item)} icon={<X size={18} />} />
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function TimelineView(props: {
  archive: MemoryArchive;
  memories: Memory[];
  onArchiveChange: (archive: MemoryArchive) => Promise<void>;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState<ExploreTab>("timeline");
  const [certaintyFilter, setCertaintyFilter] = useState<TimelineCertaintyFilter>("all");
  const [spanFilter, setSpanFilter] = useState<TimelineSpanFilter>("all");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | undefined>();
  const allBuckets = buildTimelineBuckets(props.memories);
  const timelineFilter: TimelineBucketFilter = {};
  const parsedFromYear = parseOptionalYear(fromYear);
  const parsedToYear = parseOptionalYear(toYear);
  if (certaintyFilter !== "all") timelineFilter.certainties = [certaintyFilter];
  if (spanFilter !== "all") timelineFilter.spans = [spanFilter];
  if (parsedFromYear !== undefined) timelineFilter.fromYear = parsedFromYear;
  if (parsedToYear !== undefined) timelineFilter.toYear = parsedToYear;
  const buckets = filterTimelineBuckets(allBuckets, timelineFilter);
  const graph = buildTagGraphData(props.archive);
  const selectedGraphNode = selectedGraphNodeId ?? graph.nodes.find((node) => node.kind !== "memory")?.id;
  const graphNeighborhood = selectedGraphNode ? buildGraphNeighborhood(graph, selectedGraphNode, 1) : undefined;
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

      {tab === "timeline" ? (
        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Timeline filters</Text>
          <View style={styles.filterSection}>
            <Text style={styles.metadata}>Date source</Text>
            <View style={styles.tags}>
              {(["all", "confirmed", "inferred", "unknown"] as TimelineCertaintyFilter[]).map((filter) => (
                <FilterChip
                  key={filter}
                  label={filter}
                  selected={certaintyFilter === filter}
                  onPress={() => setCertaintyFilter(filter)}
                />
              ))}
            </View>
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.metadata}>Date shape</Text>
            <View style={styles.tags}>
              {(["all", "point", "range", "unknown"] as TimelineSpanFilter[]).map((filter) => (
                <FilterChip key={filter} label={filter} selected={spanFilter === filter} onPress={() => setSpanFilter(filter)} />
              ))}
            </View>
          </View>
          <View style={styles.dateInputs}>
            <TextInput
              value={fromYear}
              onChangeText={setFromYear}
              placeholder="From year"
              keyboardType="number-pad"
              style={styles.dateInput}
            />
            <TextInput
              value={toYear}
              onChangeText={setToYear}
              placeholder="To year"
              keyboardType="number-pad"
              style={styles.dateInput}
            />
          </View>
          <Text style={styles.metadata}>
            Showing {buckets.reduce((count, bucket) => count + bucket.entries.length, 0)} of{" "}
            {allBuckets.reduce((count, bucket) => count + bucket.entries.length, 0)} timeline entries
          </Text>
        </View>
      ) : null}

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
            <Pressable key={node.id} style={styles.graphRow} onPress={() => setSelectedGraphNodeId(node.id)}>
              <Text style={styles.memoryTitle}>{node.label}</Text>
              <Text style={styles.timelineBadge}>{node.kind}</Text>
            </Pressable>
          ))}
          {graphNeighborhood ? (
            <View style={styles.relatedPanel}>
              <Text style={styles.panelTitle}>{graphNeighborhood.center.label} neighborhood</Text>
              <Text style={styles.metadata}>
                {graphNeighborhood.nodes.length} nodes · {graphNeighborhood.edges.length} links
              </Text>
              {graphNeighborhood.edges.slice(0, 8).map((edge) => (
                <Text key={`${edge.source}-${edge.target}-${edge.kind}`} style={styles.metadata}>
                  {formatGraphEdge(edge)}
                </Text>
              ))}
            </View>
          ) : null}
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
          chapters.map((chapter, index) => (
            <ChapterCandidateCard
              key={chapter.id}
              chapter={chapter}
              {...(index > 0 && chapters[index - 1] ? { previousChapter: chapters[index - 1] } : {})}
              memoriesById={memoriesById}
              onSelect={props.onSelect}
              onRename={(name) => props.onArchiveChange(renameLifeChapterCandidate(props.archive, chapter.id, name))}
              onReject={() => props.onArchiveChange(rejectLifeChapterCandidate(props.archive, chapter.id))}
              onMergeInto={(targetId) => props.onArchiveChange(mergeLifeChapterCandidate(props.archive, chapter.id, targetId))}
              onSplit={(memoryIds, name) => props.onArchiveChange(splitLifeChapterCandidate(props.archive, chapter.id, memoryIds, name))}
            />
          ))
        )
      ) : null}
    </ScrollView>
  );
}

function FilterChip(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={[styles.tag, props.selected ? styles.tagSelected : null]}>
      <Text style={[styles.tagLabel, props.selected ? styles.tagLabelSelected : null]}>{props.label}</Text>
    </Pressable>
  );
}

function ChapterCandidateCard(props: {
  chapter: LifeChapterCandidate;
  previousChapter?: LifeChapterCandidate;
  memoriesById: Map<string, Memory>;
  onSelect: (id: string) => void;
  onRename: (name: string) => Promise<void>;
  onReject: () => Promise<void>;
  onMergeInto: (targetId: string) => Promise<void>;
  onSplit: (memoryIds: string[], name: string) => Promise<void>;
}) {
  const [draftName, setDraftName] = useState(props.chapter.name);
  const splitMemoryId = props.chapter.memoryIds[0];

  useEffect(() => {
    setDraftName(props.chapter.name);
  }, [props.chapter.name]);

  return (
    <View style={styles.filterPanel}>
      <TextInput
        value={draftName}
        onChangeText={setDraftName}
        placeholder="Chapter name"
        placeholderTextColor="#7b8178"
        style={styles.tagInput}
      />
      <Text style={styles.metadata}>
        {props.chapter.memoryIds.length} memories · {props.chapter.basis.replace("_", " ")}
      </Text>
      <View style={styles.actionRow}>
        <SecondaryButton label="Rename" onPress={() => props.onRename(draftName)} icon={<Save size={18} />} />
        {props.previousChapter ? (
          <SecondaryButton
            label="Merge into previous"
            onPress={() => props.onMergeInto(props.previousChapter!.id)}
            icon={<Plus size={18} />}
          />
        ) : null}
        {splitMemoryId && props.chapter.memoryIds.length > 1 ? (
          <SecondaryButton
            label="Split first"
            onPress={() => props.onSplit([splitMemoryId], `${props.chapter.name} split`)}
            icon={<Edit3 size={18} />}
          />
        ) : null}
        <SecondaryButton label="Reject" onPress={props.onReject} icon={<X size={18} />} />
      </View>
      {props.chapter.memoryIds.slice(0, 5).map((memoryId) => {
        const memory = props.memoriesById.get(memoryId);
        if (!memory) return null;
        return (
          <Pressable key={memoryId} style={styles.relatedItem} onPress={() => props.onSelect(memoryId)}>
            <Text style={styles.memoryTitle}>{memory.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function reviewTypeLabel(type: string): string {
  switch (type) {
    case "tag_suggestion":
      return "Possible tag";
    case "date_suggestion":
      return "Possible date";
    case "untagged_memory":
      return "Possible details";
    default:
      return "Review";
  }
}

function parseOptionalYear(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return undefined;
  return Number(trimmed);
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
  prompts: ResurfacingPrompt[];
  onPrompt: (prompt: ResurfacingPrompt) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onTimeline: () => void;
  onContext: () => void;
  onTags: () => void;
  onFastCapture: (text: string) => Promise<void>;
}) {
  const [fastCaptureText, setFastCaptureText] = useState("");
  const searchResultsByMemoryId = useMemo(() => {
    if (!props.query.trim() || props.searchMode !== "keyword") return new Map();
    return new Map(
      searchArchive(props.archive, {
        text: props.query,
        tagIds: props.selectedTagIds,
        datePrecisions: props.selectedDatePrecision ? [props.selectedDatePrecision] : []
      }).map((result) => [result.memory.id, result])
    );
  }, [props.archive, props.query, props.searchMode, props.selectedDatePrecision, props.selectedTagIds]);

  async function saveFastCapture() {
    const text = fastCaptureText.trim();
    if (!text) return;
    await props.onFastCapture(text);
    setFastCaptureText("");
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.capturePanel}>
        <Text style={styles.capturePrompt}>What came back?</Text>
        <TextInput
          value={fastCaptureText}
          onChangeText={setFastCaptureText}
          placeholder="Put the fragment here"
          placeholderTextColor="#7b8178"
          multiline
          textAlignVertical="top"
          style={styles.fastCaptureInput}
        />
        <Text style={styles.metadata}>Dates and tags can wait.</Text>
        <View style={styles.actionRow}>
          <PrimaryButton label="Save memory" onPress={saveFastCapture} disabled={!fastCaptureText.trim()} icon={<Save size={18} />} />
          <SecondaryButton label="Open capture" onPress={props.onNew} icon={<Plus size={18} />} />
        </View>
      </View>
      {props.prompts.length > 0 ? (
        <View style={styles.promptPanel}>
          <Text style={styles.panelTitle}>Prompts</Text>
          {props.prompts.slice(0, 3).map((prompt) => (
            <Pressable key={prompt.id} style={styles.promptItem} onPress={() => props.onPrompt(prompt)}>
              <Text style={styles.memoryPreview}>{prompt.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.searchRow}>
        <Search size={20} color="#5f655d" />
        <TextInput
          value={props.query}
          onChangeText={props.onQueryChange}
          placeholder={props.searchMode === "semantic" ? "Nearby memories" : "Search memories"}
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
              {mode === "semantic" ? "Nearby" : "Keyword"}
            </Text>
          </Pressable>
        ))}
        {props.semanticSearchPending ? <Text style={styles.metadata}>Searching local index</Text> : null}
      </View>
      <View style={styles.pathGrid}>
        <PathCard
          label="Timeline"
          detail="By approximate date"
          icon={<CalendarDays size={20} color="#5f655d" />}
          onPress={props.onTimeline}
        />
        <PathCard
          label="People & pets"
          detail="Known companions"
          icon={<Users size={20} color="#5f655d" />}
          onPress={props.onContext}
        />
        <PathCard
          label="Places"
          detail="Homes and rooms"
          icon={<MapPin size={20} color="#5f655d" />}
          onPress={props.onContext}
        />
        <PathCard
          label="Themes"
          detail={`${props.archive.tags.length} tags`}
          icon={<Tags size={20} color="#5f655d" />}
          onPress={props.onTags}
        />
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
        props.memories.map((memory) => {
          const result = searchResultsByMemoryId.get(memory.id);
          const preview = result?.snippet ?? memory.cleanedText ?? memory.rawText;
          return (
            <Pressable key={memory.id} style={styles.memoryCard} onPress={() => props.onSelect(memory.id)}>
              <Text style={styles.memoryTitle}>{memory.title}</Text>
              <HighlightedText text={preview} query={props.searchMode === "keyword" ? props.query : ""} />
              {result?.matchedTags.length ? <Text style={styles.metadata}>Matched tags: {result.matchedTags.join(", ")}</Text> : null}
              <TagRow labels={tagsForMemory(props.archive, memory.id).map((tag) => tag.name)} />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function HighlightedText(props: { text: string; query: string }) {
  const query = props.query.trim();
  if (!query) {
    return (
      <Text style={styles.memoryPreview} numberOfLines={3}>
        {props.text}
      </Text>
    );
  }

  const lowerText = props.text.toLocaleLowerCase();
  const lowerQuery = query.toLocaleLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index < 0) {
    return (
      <Text style={styles.memoryPreview} numberOfLines={3}>
        {props.text}
      </Text>
    );
  }

  return (
    <Text style={styles.memoryPreview} numberOfLines={3}>
      {props.text.slice(0, index)}
      <Text style={styles.highlightText}>{props.text.slice(index, index + query.length)}</Text>
      {props.text.slice(index + query.length)}
    </Text>
  );
}

function PathCard(props: { label: string; detail: string; icon: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.pathCard}>
      <View style={styles.pathIcon}>{props.icon}</View>
      <View style={styles.pathText}>
        <Text style={styles.memoryTitle}>{props.label}</Text>
        <Text style={styles.metadata}>{props.detail}</Text>
      </View>
    </Pressable>
  );
}

function TagManagement(props: {
  archive: MemoryArchive;
  onRename: (tagId: string, name: string) => Promise<void>;
  onTypeChange: (tagId: string, type: TagType) => Promise<void>;
  onMerge: (sourceTagId: string, targetTagId: string) => Promise<void>;
  onDelete: (tagId: string) => Promise<void>;
}) {
  const [editingTagId, setEditingTagId] = useState<string | undefined>();
  const [mergingTagId, setMergingTagId] = useState<string | undefined>();
  const [draftName, setDraftName] = useState("");
  const tagTypes: TagType[] = ["custom", "person", "pet", "place", "time", "emotion", "theme", "activity", "life_period"];

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
                  <View style={styles.segmentRow}>
                    {tagTypes.map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => void props.onTypeChange(tag.id, type)}
                        style={[styles.segment, tag.type === type ? styles.segmentActive : null]}
                      >
                        <Text style={[styles.segmentText, tag.type === type ? styles.segmentTextActive : null]}>{type}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {mergingTagId === tag.id ? (
                    <View style={styles.segmentRow}>
                      {props.archive.tags
                        .filter((target) => target.id !== tag.id)
                        .map((target) => (
                          <Pressable
                            key={target.id}
                            onPress={async () => {
                              await props.onMerge(tag.id, target.id);
                              setMergingTagId(undefined);
                            }}
                            style={styles.segment}
                          >
                            <Text style={styles.segmentText}>{target.name}</Text>
                          </Pressable>
                        ))}
                    </View>
                  ) : null}
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
                    <IconButton
                      label="Merge tag"
                      onPress={() => setMergingTagId((current) => (current === tag.id ? undefined : tag.id))}
                      icon={<Tags size={20} />}
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
  structuredExtractionMode: StructuredExtractionMode;
  memory?: Memory;
  onVoice: () => void;
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
  const isEditing = Boolean(props.memory);

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
    if (props.structuredExtractionMode === "none") {
      setTagSuggestions([]);
      setDateSuggestions([]);
      return;
    }

    const rejectedTagNames = props.memory
      ? props.archive.memoryTags
          .filter((link) => link.memoryId === props.memory?.id && link.rejected)
          .map((link) => props.archive.tags.find((tag) => tag.id === link.tagId)?.normalizedName)
          .filter((name): name is string => Boolean(name))
      : [];
    const nextTagSuggestions = suggestTags(text, { rejectedNames: rejectedTagNames });
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
      <View style={styles.capturePanel}>
        <Text style={styles.capturePrompt}>What came back?</Text>
        <Text style={styles.metadata}>You can save this before you understand where it belongs.</Text>
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="A fragment is enough"
        placeholderTextColor="#7b8178"
        multiline
        textAlignVertical="top"
        style={styles.bodyInput}
      />
      {isEditing ? (
        <>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor="#7b8178"
            style={styles.titleInput}
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
        </>
      ) : (
        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Optional</Text>
          <Text style={styles.metadata}>Dates, tags, and title can wait. Memory Palace will suggest possible details after saving.</Text>
          <SecondaryButton label="Use voice instead" onPress={props.onVoice} icon={<Mic size={18} />} />
        </View>
      )}
      {tagSuggestions.length > 0 || dateSuggestions.length > 0 ? (
        <View style={styles.suggestionPanel}>
          <Text style={styles.panelTitle}>Possible details</Text>
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
        {isEditing ? <SecondaryButton label="Suggest" onPress={generateSuggestions} icon={<Wand2 size={18} />} /> : null}
        <PrimaryButton label={isEditing ? "Save changes" : "Save privately"} onPress={save} disabled={!canSave} icon={<Save size={18} />} />
      </View>
    </ScrollView>
  );
}

function MemoryDetail(props: {
  archive: MemoryArchive;
  memory: Memory;
  postSaveActive: boolean;
  postSaveItems: ReviewInboxItem[];
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onSelect: (id: string) => void;
  onAcceptPostSave: (item: ReviewInboxItem) => Promise<void>;
  onDismissPostSave: () => void;
  onAddendum: (text: string) => Promise<void>;
  onSplit: (splitIndex: number) => Promise<void>;
  onMergeRelated: (sourceMemoryId: string) => Promise<void>;
}) {
  const [relatedMemories, setRelatedMemories] = useState<RelatedMemoryResult[]>([]);
  const [addendumText, setAddendumText] = useState("");
  const [splitMarker, setSplitMarker] = useState("");
  const memoryText = props.memory.cleanedText || props.memory.rawText;
  const trimmedSplitMarker = splitMarker.trim();
  const splitMarkerIndex = trimmedSplitMarker ? memoryText.indexOf(trimmedSplitMarker) : -1;
  const splitIndex = splitMarkerIndex >= 0 ? splitMarkerIndex + trimmedSplitMarker.length : -1;

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
      {props.postSaveActive ? (
        <PostSaveSuggestionSheet
          items={props.postSaveItems}
          onAccept={props.onAcceptPostSave}
          onLater={props.onDismissPostSave}
        />
      ) : null}
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
      <Text style={styles.memoryBody}>{memoryText}</Text>
      <TagRow labels={tagsForMemory(props.archive, props.memory.id).map((tag) => tag.name)} />
      <Text style={styles.metadata}>Created {new Date(props.memory.createdAt).toLocaleString()}</Text>
      <Text style={styles.metadata}>
        Memory date: {formatMemoryDate(props.memory)} ({props.memory.datePrecision})
      </Text>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Addendum</Text>
        <TextInput
          value={addendumText}
          onChangeText={setAddendumText}
          placeholder="Add a later note or correction"
          placeholderTextColor="#7b8178"
          multiline
          textAlignVertical="top"
          style={styles.addendumInput}
        />
        <PrimaryButton
          label="Append"
          disabled={!addendumText.trim()}
          onPress={async () => {
            await props.onAddendum(addendumText);
            setAddendumText("");
          }}
          icon={<Save size={18} />}
        />
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Split memory</Text>
        <TextInput
          value={splitMarker}
          onChangeText={setSplitMarker}
          placeholder="Split after exact text"
          placeholderTextColor="#7b8178"
          style={styles.tagInput}
        />
        <SecondaryButton
          label="Split"
          disabled={splitIndex <= 0 || splitIndex >= memoryText.length}
          onPress={async () => {
            await props.onSplit(splitIndex);
            setSplitMarker("");
          }}
          icon={<Edit3 size={18} />}
        />
      </View>
      {relatedMemories.length > 0 ? (
        <View style={styles.relatedPanel}>
          <Text style={styles.panelTitle}>Related memories</Text>
          {relatedMemories.map((result) => (
            <View key={result.memory.id} style={styles.relatedItem}>
              <Pressable onPress={() => props.onSelect(result.memory.id)}>
                <Text style={styles.memoryTitle}>{result.memory.title}</Text>
                <Text style={styles.memoryPreview} numberOfLines={2}>
                  {result.memory.cleanedText || result.memory.rawText}
                </Text>
                <Text style={styles.metadata}>{formatRelatedReasons(result)}</Text>
              </Pressable>
              <SecondaryButton label="Merge into this" onPress={() => props.onMergeRelated(result.memory.id)} icon={<Plus size={18} />} />
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function PostSaveSuggestionSheet(props: {
  items: ReviewInboxItem[];
  onAccept: (item: ReviewInboxItem) => Promise<void>;
  onLater: () => void;
}) {
  return (
    <View style={styles.postSaveSheet}>
      <Text style={styles.panelTitle}>Saved privately</Text>
      {props.items.length > 0 ? (
        <>
          <Text style={styles.memoryPreview}>I found a few possible details.</Text>
          {props.items.map((item) => (
            <View key={item.id} style={styles.postSaveItem}>
              <Text style={styles.reviewType}>{reviewTypeLabel(item.type)}</Text>
              <Text style={styles.memoryTitle}>{item.label}</Text>
              {"explanation" in item && item.explanation ? (
                <Text style={styles.metadata}>{item.explanation}</Text>
              ) : null}
              <PrimaryButton label="Accept" onPress={() => void props.onAccept(item)} icon={<Save size={18} />} />
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.memoryPreview}>No possible details need review right now.</Text>
      )}
      <SecondaryButton label={props.items.length > 0 ? "Later" : "Close"} onPress={props.onLater} icon={<X size={18} />} />
    </View>
  );
}

function Settings(props: {
  archive: MemoryArchive;
  appLockSettings: AppLockSettings;
  encryptionSettings: EncryptionSettings;
  structuredExtractionMode: StructuredExtractionMode;
  embeddingMaintenanceMode: EmbeddingMaintenanceMode;
  onImport: (preview: ArchiveImportWorkflowPreview, options: ArchiveMergeOptions) => Promise<void>;
  onClearProcessingRuns: () => Promise<void>;
  onClearRetainedAudio: () => Promise<void>;
  onClearDeletedArtifacts: () => Promise<void>;
  onRegenerateEmbeddings: () => Promise<void>;
  onEnableBiometricLock: () => Promise<void>;
  onSavePin: (pin: string) => Promise<void>;
  onDisableAppLock: () => Promise<void>;
  onLockNow: () => Promise<void>;
  onSaveEncryptionSettings: (settings: EncryptionSettings) => Promise<void>;
  onStructuredExtractionModeChange: (mode: StructuredExtractionMode) => Promise<void>;
  onEmbeddingMaintenanceModeChange: (mode: EmbeddingMaintenanceMode) => Promise<void>;
  onRestore: (memoryId: string) => Promise<void>;
  onPermanentlyDelete: (memoryId: string) => Promise<void>;
}) {
  const deletedMemories = props.archive.memories.filter((memory) => memory.deletedAt);
  const summary = summarizeArchive(props.archive);
  const audit = buildDataAuditReport(props.archive);
  const staleEmbeddingCount = findStaleEmbeddingMemoryIds(props.archive).length;
  const [importPreview, setImportPreview] = useState<ArchiveImportWorkflowPreview | undefined>();
  const [portabilityError, setPortabilityError] = useState<string | undefined>();
  const [pinDraft, setPinDraft] = useState("");
  const [duplicateMemoryResolution, setDuplicateMemoryResolution] =
    useState<NonNullable<ArchiveMergeOptions["duplicateMemory"]>>("skip");
  const [memoryIdResolution, setMemoryIdResolution] = useState<NonNullable<ArchiveMergeOptions["memoryIdConflict"]>>("skip");
  const [tagTypeResolution, setTagTypeResolution] = useState<NonNullable<ArchiveMergeOptions["tagTypeConflict"]>>("keep_existing");
  const [encryptionDraft, setEncryptionDraft] = useState<EncryptionSettings>(props.encryptionSettings);

  async function shareJson() {
    const [artifact] = await new JsonExportProvider().exportArchive(props.archive);
    if (artifact) await shareExportArtifact(artifact);
  }

  async function shareMarkdown() {
    const artifacts = await new MarkdownExportProvider().exportArchive(props.archive);
    await shareExportArtifact(combineMarkdownArtifacts(artifacts));
  }

  async function shareMarkdownBundle() {
    const artifacts = await new MarkdownBundleExportProvider().exportArchive(props.archive);
    await shareExportArtifact(combineBundleArtifacts(artifacts));
  }

  async function shareSqlite() {
    const [artifact] = await new SqliteExportProvider().exportArchive(props.archive);
    if (artifact) await shareExportArtifact(artifact);
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
    await props.onImport(importPreview, {
      duplicateMemory: duplicateMemoryResolution,
      memoryIdConflict: memoryIdResolution,
      tagTypeConflict: tagTypeResolution
    });
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
        <Stat label="Local bytes" value={formatBytes(audit.estimatedTotalLocalBytes)} />
        <Stat label="Schema" value={props.archive.schemaVersion} />
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Data audit</Text>
        <Text style={styles.metadata}>Local modes: {audit.localProcessingModes.join(", ")}</Text>
        <Text style={styles.metadata}>Retained audio references: {audit.retainedAudioCount}</Text>
        <Text style={styles.metadata}>Deleted-memory audio references: {audit.deletedRetainedAudioCount}</Text>
        <Text style={styles.metadata}>Generated processing logs: {audit.processingRunCount}</Text>
        <Text style={styles.metadata}>Stored embedding vectors: {audit.embeddingCount}</Text>
        <Text style={styles.metadata}>Stale embedding vectors: {audit.staleEmbeddingCount}</Text>
        <Text style={styles.metadata}>
          Estimated storage: text {formatBytes(audit.estimatedTextBytes)}, embeddings {formatBytes(audit.estimatedEmbeddingBytes)},
          processing {formatBytes(audit.estimatedProcessingBytes)}
        </Text>
        <Text style={styles.metadata}>Stale embedding queue: {staleEmbeddingCount}</Text>
        <View style={styles.actionRow}>
          <SecondaryButton label="Clear processing logs" onPress={props.onClearProcessingRuns} icon={<Trash2 size={18} />} />
          <SecondaryButton label="Forget audio links" onPress={props.onClearRetainedAudio} icon={<Trash2 size={18} />} />
          <SecondaryButton label="Clear deleted artifacts" onPress={props.onClearDeletedArtifacts} icon={<Trash2 size={18} />} />
          <SecondaryButton label="Regenerate embeddings" onPress={props.onRegenerateEmbeddings} icon={<Search size={18} />} />
        </View>
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Structured extraction</Text>
        <Text style={styles.metadata}>Mode: {props.structuredExtractionMode === "rules" ? "local rules" : "off"}</Text>
        <View style={styles.tags}>
          <FilterChip
            label="off"
            selected={props.structuredExtractionMode === "none"}
            onPress={() => void props.onStructuredExtractionModeChange("none")}
          />
          <FilterChip
            label="local rules"
            selected={props.structuredExtractionMode === "rules"}
            onPress={() => void props.onStructuredExtractionModeChange("rules")}
          />
        </View>
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Embedding maintenance</Text>
        <Text style={styles.metadata}>Mode: {props.embeddingMaintenanceMode}</Text>
        <View style={styles.tags}>
          {(["automatic", "manual"] as EmbeddingMaintenanceMode[]).map((mode) => (
            <FilterChip
              key={mode}
              label={mode}
              selected={props.embeddingMaintenanceMode === mode}
              onPress={() => void props.onEmbeddingMaintenanceModeChange(mode)}
            />
          ))}
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
            <>
              <PrimaryButton label="Enable biometric" onPress={props.onEnableBiometricLock} icon={<Lock size={18} />} />
              <TextInput
                value={pinDraft}
                onChangeText={setPinDraft}
                placeholder="Set PIN"
                placeholderTextColor="#7b8178"
                secureTextEntry
                keyboardType="number-pad"
                style={styles.dateInput}
              />
              <SecondaryButton
                label="Save PIN"
                onPress={async () => {
                  await props.onSavePin(pinDraft);
                  setPinDraft("");
                }}
                icon={<Save size={18} />}
              />
            </>
          ) : (
            <>
              <SecondaryButton label="Lock now" onPress={props.onLockNow} icon={<Lock size={18} />} />
              <SecondaryButton label="Disable lock" onPress={props.onDisableAppLock} icon={<X size={18} />} />
            </>
          )}
        </View>
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Encryption</Text>
        <Text style={styles.metadata}>Provider: none installed</Text>
        <Text style={styles.metadata}>Status: preferences saved only; archive data is not encrypted by Memory Palace yet.</Text>
        <View style={styles.filterSection}>
          <Text style={styles.metadata}>Scope</Text>
          <View style={styles.tags}>
            {(["disabled", "exports", "archive"] as EncryptionScope[]).map((scope) => (
              <FilterChip
                key={scope}
                label={scope}
                selected={encryptionDraft.scope === scope}
                onPress={() =>
                  setEncryptionDraft((current) => ({
                    ...current,
                    scope,
                    keySource: scope === "disabled" ? "none" : current.keySource === "none" ? "user_passphrase" : current.keySource
                  }))
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.filterSection}>
          <Text style={styles.metadata}>Key source</Text>
          <View style={styles.tags}>
            {(["none", "device_secure_store", "user_passphrase"] as EncryptionKeySource[]).map((keySource) => (
              <FilterChip
                key={keySource}
                label={keySource.replace(/_/g, " ")}
                selected={encryptionDraft.keySource === keySource}
                onPress={() => setEncryptionDraft((current) => ({ ...current, keySource }))}
              />
            ))}
          </View>
        </View>
        <View style={styles.tags}>
          <FilterChip
            label="require unlock for export"
            selected={encryptionDraft.requireUnlockForExport}
            onPress={() =>
              setEncryptionDraft((current) => ({ ...current, requireUnlockForExport: !current.requireUnlockForExport }))
            }
          />
        </View>
        <SecondaryButton label="Save encryption options" onPress={() => props.onSaveEncryptionSettings(encryptionDraft)} icon={<Save size={18} />} />
      </View>
      <View style={styles.actionRow}>
        <PrimaryButton label="JSON" onPress={shareJson} icon={<Download size={18} />} />
        <SecondaryButton label="Markdown" onPress={shareMarkdown} icon={<Download size={18} />} />
        <SecondaryButton label="Markdown bundle" onPress={shareMarkdownBundle} icon={<Download size={18} />} />
        <SecondaryButton label="SQLite SQL" onPress={shareSqlite} icon={<Download size={18} />} />
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
          {importPreview.mergePreview.conflicts.map((conflict, index) => (
            <Text key={`${conflict.kind}-${index}`} style={styles.metadata}>
              {formatImportConflict(conflict)}
            </Text>
          ))}
          <View style={styles.filterSection}>
            <Text style={styles.metadata}>Duplicate memories</Text>
            <View style={styles.tags}>
              <FilterChip
                label="skip"
                selected={duplicateMemoryResolution === "skip"}
                onPress={() => setDuplicateMemoryResolution("skip")}
              />
              <FilterChip
                label="import copy"
                selected={duplicateMemoryResolution === "import_copy"}
                onPress={() => setDuplicateMemoryResolution("import_copy")}
              />
            </View>
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.metadata}>Same ID memories</Text>
            <View style={styles.tags}>
              {(["skip", "replace", "keep_both"] as NonNullable<ArchiveMergeOptions["memoryIdConflict"]>[]).map((resolution) => (
                <FilterChip
                  key={resolution}
                  label={resolution.replace("_", " ")}
                  selected={memoryIdResolution === resolution}
                  onPress={() => setMemoryIdResolution(resolution)}
                />
              ))}
            </View>
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.metadata}>Tag type conflicts</Text>
            <View style={styles.tags}>
              <FilterChip
                label="keep existing"
                selected={tagTypeResolution === "keep_existing"}
                onPress={() => setTagTypeResolution("keep_existing")}
              />
              <FilterChip
                label="use incoming"
                selected={tagTypeResolution === "use_incoming"}
                onPress={() => setTagTypeResolution("use_incoming")}
              />
            </View>
          </View>
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

function SecondaryButton(props: { label: string; icon: ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={props.onPress} disabled={props.disabled} style={[styles.secondaryButton, props.disabled ? styles.disabled : null]}>
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

function formatGraphEdge(edge: ReturnType<typeof buildTagGraphData>["edges"][number]): string {
  const kind = edge.kind.replace("_", " ");
  return `${kind}: ${edge.source} -> ${edge.target}${edge.label ? ` (${edge.label})` : ""}`;
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

function formatImportConflict(conflict: ArchiveImportWorkflowPreview["mergePreview"]["conflicts"][number]): string {
  switch (conflict.kind) {
    case "duplicate_memory":
      return `Duplicate memory: ${conflict.title ?? conflict.incomingId}`;
    case "memory_id_conflict":
      return `Memory ID conflict: ${conflict.memoryId}`;
    case "tag_type_conflict":
      return `Tag type conflict: ${conflict.tagName} (${conflict.existingType} vs ${conflict.incomingType})`;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
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
  bottomNav: {
    minHeight: 74,
    borderTopWidth: 1,
    borderTopColor: "#dedbd1",
    backgroundColor: "#f8f6f1",
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 10
  },
  navButton: {
    minWidth: 72,
    minHeight: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  navButtonActive: {
    backgroundColor: "#ece8dd"
  },
  navLabel: {
    color: "#697067",
    fontSize: 12,
    fontWeight: "700"
  },
  navLabelActive: {
    color: "#252925"
  },
  captureButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#38543c",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#252925",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
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
    paddingBottom: 28,
    gap: 14
  },
  capturePanel: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 16,
    gap: 10
  },
  capturePrompt: {
    color: "#252925",
    fontSize: 22,
    fontWeight: "800"
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
  highlightText: {
    color: "#1f2c1f",
    backgroundColor: "#dce9bd",
    fontWeight: "800"
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
  addendumInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 12,
    color: "#252925",
    fontSize: 15,
    lineHeight: 22,
    outlineStyle: "none" as never
  },
  fastCaptureInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#d1cdbf",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 12,
    color: "#252925",
    fontSize: 15,
    lineHeight: 22,
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
  postSaveSheet: {
    borderWidth: 1,
    borderColor: "#cfd8c8",
    backgroundColor: "#f4f8f0",
    borderRadius: 8,
    padding: 16,
    gap: 12
  },
  postSaveItem: {
    borderTopWidth: 1,
    borderTopColor: "#dce6d5",
    paddingTop: 10,
    gap: 8
  },
  promptPanel: {
    borderWidth: 1,
    borderColor: "#d4dccb",
    backgroundColor: "#f7faf3",
    borderRadius: 8,
    padding: 14,
    gap: 10
  },
  promptItem: {
    borderTopWidth: 1,
    borderTopColor: "#e1e7d9",
    paddingTop: 10
  },
  pathGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  pathCard: {
    minWidth: 150,
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  pathIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#ece8dd",
    alignItems: "center",
    justifyContent: "center"
  },
  pathText: {
    flex: 1,
    minWidth: 0,
    gap: 2
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
  filterSection: {
    gap: 8
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
