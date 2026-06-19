import { ArrowLeft, CalendarDays, ClipboardList, Download, Edit3, Lock, MapPin, Mic, Plus, RotateCcw, Save, Search, Settings as SettingsIcon, SlidersHorizontal, Square, Tags, Trash2, Users, Wand2, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoCrypto from "expo-crypto";
import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  Alert,
  AppState,
  Button,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "react-native";
import type { DateCandidate, DatePrecision, Memory, TagSuggestion, TagType, UserProfile } from "../../../src/core/types";
import {
  DEFAULT_KINDERGARTEN_START_AGE,
  DEFAULT_SCHOOL_YEAR_START_MONTH,
  formatLifeCalendarPreview
} from "../../../src/core/lifeCalendar";
import type { AppLockSettings } from "../../../src/security/appLock";
import type { ExportArtifact } from "../../../src/export/contracts";
import type { EncryptionKeySource, EncryptionScope, EncryptionSettings } from "../../../src/security/encryption";
import { WebCryptoExportEncryptionProvider } from "../../../src/security/encryption";
import { EncryptedArchiveAtRestAdapter } from "../../../src/security/archiveAtRest";
import { EncryptedBackupSyncProvider } from "../../../src/sync/encryptedBackupSync";
import { WebDAVSyncProvider } from "../../../src/sync/webDavSync";
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
  updateMemorySafety,
  updateMemoryPrivateNotes,
  updateTagType
} from "../../../src/core/archiveOperations";
import type { TimelineBucketFilter } from "../../../src/core/archiveOperations";
import { JsonExportProvider } from "../../../src/export/jsonExport";
import { MarkdownBundleExportProvider } from "../../../src/export/markdownBundle";
import { MarkdownExportProvider } from "../../../src/export/markdownExport";
import { SqliteExportProvider } from "../../../src/export/sqliteExport";
import { ManualTextTranscriptionEngine } from "../../../src/transcription/contracts";
import {
  applyArchiveImport,
  previewArchiveImport,
  type ArchiveImportWorkflowPreview,
  type ArchiveMergeOptions
} from "../../../src/import/importWorkflow";
import { createLifeContextId, findLifeContextMatches, type LifeContextEntity } from "../../../src/core/lifeContext";
import { mergeStructuredExtractionResults, RulesStructuredExtractionEngine } from "../../../src/processing/structuredExtraction";
import { HashEmbeddingEngine, type IEmbeddingEngine } from "../../../src/processing/embeddings";
import { parseTagNames } from "../../../src/core/tagParsing";
import { acceptReviewItem, buildReviewInbox, rejectReviewItem } from "../../../src/processing/reviewInbox";
import { buildResurfacingPrompts, type ResurfacingPrompt } from "../../../src/product/resurfacing";
import { findStaleEmbeddingMemoryIds, rebuildEmbeddingIndex, searchEmbeddingIndex } from "../../../src/search/embeddingIndex";
import { findRelatedMemories, type RelatedMemoryResult } from "../../../src/search/relatedMemories";
import { buildExploreFilterSuggestionGroups, type ExploreFilterSuggestion } from "../../../src/search/filterSuggestions";
import { searchArchive } from "../../../src/search/searchService";
import {
  BGE_SMALL_EN_V15_ASSET_MANIFEST,
  checkLocalModelAvailability,
  createBgeEmbeddingEngineFromAssets,
  createQwenStructuredExtractionEngineFromAssets,
  createQwenTranscriptFormatterFromAssets,
  QWEN_2_5_0_5B_ASSET_MANIFEST,
  type LocalModelAvailability
} from "../../../src/processing/localModelAssets";
import { QwenTranscriptRewriteError, QWEN_TRANSCRIPT_FORMATTING_UNAVAILABLE_MESSAGE } from "../../../src/processing/qwenTranscriptFormatting";
import {
  buildDataAuditReport,
  clearDeletedMemoryArtifacts,
  clearProcessingRuns,
  clearRetainedAudioReferences
} from "../../../src/security/dataAudit";
import { buildTagClusters } from "../../../src/visualization/clusters";
import { buildGraphNeighborhood, buildTagGraphData } from "../../../src/visualization/graph";
import {
  acceptLifeChapterCandidate,
  buildLifeChapterCandidates,
  mergeLifeChapterCandidate,
  rejectLifeChapterCandidate,
  renameLifeChapterCandidate,
  splitLifeChapterCandidate,
  type LifeChapterCandidate
} from "../../../src/visualization/lifeChapters";
import {
  createMemory,
  clearPlaintextArchiveStorage,
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
import { AsyncStorageArchiveAtRestRecordStore } from "./archiveAtRestStore";
import { ExpoDocumentLocalModelAssetStore, localModelDirectoryHint, pickAndImportLocalModelFiles } from "./localModelAssetStore";
import { loadBgeRuntimeOptionsFromAssets } from "./bgeRuntime";
import { loadQwenNativeRuntimeFromAssets } from "./qwenNativeRuntime";
import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppearanceMode,
  saveEmbeddingEngineMode,
  saveEmbeddingMaintenanceMode,
  saveEncryptionSettings,
  saveStructuredExtractionMode,
  type AppearanceMode,
  type EmbeddingEngineMode,
  type EmbeddingMaintenanceMode,
  type StructuredExtractionMode
} from "./settingsStore";
import { darkTheme, lightTheme } from "./designTokens";

type ViewMode = "list" | "editor" | "detail" | "voice" | "timeline" | "review" | "context" | "tags" | "settings";
type SearchMode = "keyword" | "semantic";
type ExploreTab = "timeline" | "graph" | "clusters" | "chapters";
type TimelineCertaintyFilter = "all" | "confirmed" | "inferred" | "unknown";
type TimelineSpanFilter = "all" | "point" | "range" | "unknown";

const NEW_MEMORY_DRAFT_KEY = "memory-palace.new-memory-draft.v1";

function createMobileEncryptionProvider() {
  return new WebCryptoExportEncryptionProvider({
    randomValuesSource: {
      getRandomValues(bytes) {
        return ExpoCrypto.getRandomValues(bytes);
      }
    }
  });
}

async function createEmbeddingEngineForMode(mode: EmbeddingEngineMode): Promise<IEmbeddingEngine> {
  if (mode === "bge-small-en-v1.5") {
    try {
      const engine = await createBgeEmbeddingEngineFromAssets(
        new ExpoDocumentLocalModelAssetStore(BGE_SMALL_EN_V15_ASSET_MANIFEST),
        loadBgeRuntimeOptionsFromAssets
      );
      if (engine) return engine;
    } catch {
      // Fall through to hash embeddings so optional model assets never block capture or search.
    }
    return new HashEmbeddingEngine();
  }

  return new HashEmbeddingEngine();
}

async function extractStructuredSuggestionsForMode(mode: StructuredExtractionMode, text: string, userProfile?: UserProfile) {
  const extractionInput = userProfile ? { text, userProfile } : { text };
  const rulesResult = await new RulesStructuredExtractionEngine().extract(extractionInput);

  if (mode === "none") {
    return {
      title: undefined,
      dates: [],
      tags: [],
      emotionalTone: [],
      engineId: "none"
    };
  }

  if (mode === "qwen2.5-0.5b") {
    try {
      const engine = await createQwenStructuredExtractionEngineFromAssets(
        new ExpoDocumentLocalModelAssetStore(QWEN_2_5_0_5B_ASSET_MANIFEST),
        loadQwenNativeRuntimeFromAssets
      );
      if (engine) {
        const modelResult = await engine.extract(extractionInput);
        return mergeStructuredExtractionResults(rulesResult, modelResult, { sourceText: text });
      }
    } catch {
      // Fall through to local rules so unavailable optional models never block capture.
    }
  }

  return rulesResult;
}

async function formatTranscriptDraftWithQwen(text: string): Promise<string | undefined> {
  const formatter = await createQwenTranscriptFormatterFromAssets(
    new ExpoDocumentLocalModelAssetStore(QWEN_2_5_0_5B_ASSET_MANIFEST),
    loadQwenNativeRuntimeFromAssets
  );
  if (!formatter) return undefined;
  return formatter.format(text);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { width } = useWindowDimensions();
  const appLockProvider = useMemo(() => new ExpoBiometricAppLockProvider(), []);
  const [archive, setArchive] = useState<MemoryArchive | undefined>();
  const [appLockSettings, setAppLockSettings] = useState<AppLockSettings>({
    mode: "disabled",
    autoLockTimeoutMs: 0,
    hidePreviewsInSwitcher: false
  });
  const [encryptionSettings, setEncryptionSettings] = useState<EncryptionSettings>(DEFAULT_APP_SETTINGS.encryptionSettings);
  const [structuredExtractionMode, setStructuredExtractionMode] = useState<StructuredExtractionMode>(
    DEFAULT_APP_SETTINGS.structuredExtractionMode
  );
  const [embeddingEngineMode, setEmbeddingEngineMode] = useState<EmbeddingEngineMode>(DEFAULT_APP_SETTINGS.embeddingEngineMode);
  const [embeddingMaintenanceMode, setEmbeddingMaintenanceMode] = useState<EmbeddingMaintenanceMode>(
    DEFAULT_APP_SETTINGS.embeddingMaintenanceMode
  );
  const [localModelAvailability, setLocalModelAvailability] = useState<LocalModelAvailability[]>([]);
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(DEFAULT_APP_SETTINGS.appearanceMode);
  const [archiveAtRestPassphrase, setArchiveAtRestPassphrase] = useState("");
  const [archiveUnlockRequired, setArchiveUnlockRequired] = useState(false);
  const [archiveUnlockError, setArchiveUnlockError] = useState<string | undefined>();
  const [archiveLoadError, setArchiveLoadError] = useState<string | undefined>();
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [mode, setMode] = useState<ViewMode>("editor");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [postSaveMemoryId, setPostSaveMemoryId] = useState<string | undefined>();
  const [saveNotice, setSaveNotice] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("keyword");
  const [semanticMemories, setSemanticMemories] = useState<Memory[]>([]);
  const [semanticSearchPending, setSemanticSearchPending] = useState(false);
  const [ftsMemoryIds, setFtsMemoryIds] = useState<string[] | undefined>();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDatePrecision, setSelectedDatePrecision] = useState<DatePrecision | undefined>();

  useEffect(() => {
    void loadInitialArchive();
    void refreshLocalModelAvailability();
  }, []);

  useEffect(() => {
    if (!saveNotice) return undefined;
    const timeout = setTimeout(() => setSaveNotice(undefined), 3000);
    return () => clearTimeout(timeout);
  }, [saveNotice]);

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
  styles = appearanceMode === "dark" ? darkStyles : lightStyles;
  const statusBarStyle = appearanceMode === "dark" ? "light-content" : "dark-content";
  const statusBarBackgroundColor = appearanceMode === "dark" ? darkColors.background : theme.colors.background;

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
    void createEmbeddingEngineForMode(embeddingEngineMode)
      .then((engine) => searchEmbeddingIndex(archive, query, { engine, limit: 50 }))
      .catch(() => searchEmbeddingIndex(archive, query, { limit: 50 }))
      .then((results) => {
      if (!isCurrent) return;
      setSemanticMemories(results.map((result) => result.memory));
      setSemanticSearchPending(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [archive, embeddingEngineMode, query, searchMode]);

  const selectedMemory = archive?.memories.find((memory) => memory.id === selectedId);

  async function loadArchiveForSettings(settings: EncryptionSettings, engineMode: EmbeddingEngineMode = embeddingEngineMode) {
    setArchiveLoadError(undefined);
    if (settings.scope === "archive" && settings.keySource === "user_passphrase") {
      const encryptedRecord = await new AsyncStorageArchiveAtRestRecordStore().read();
      if (encryptedRecord?.format === "memory-palace.archive.encrypted.v1") {
        setArchiveUnlockRequired(true);
        return;
      }
    }

    await loadAndIndexArchive(await loadArchive(), undefined, engineMode);
  }

  async function loadInitialArchive() {
    try {
      const settings = await loadAppSettings();
      setEncryptionSettings(settings.encryptionSettings);
      setStructuredExtractionMode(settings.structuredExtractionMode);
      setEmbeddingEngineMode(settings.embeddingEngineMode);
      setEmbeddingMaintenanceMode(settings.embeddingMaintenanceMode);
      setAppearanceMode(settings.appearanceMode);
      await loadArchiveForSettings(settings.encryptionSettings, settings.embeddingEngineMode);
    } catch (error) {
      setArchiveLoadError(error instanceof Error ? error.message : "Archive could not be loaded.");
    }
  }

  async function refreshLocalModelAvailability() {
    const manifests = [BGE_SMALL_EN_V15_ASSET_MANIFEST, QWEN_2_5_0_5B_ASSET_MANIFEST];
    const availability = await Promise.all(
      manifests.map((manifest) => checkLocalModelAvailability(manifest, new ExpoDocumentLocalModelAssetStore(manifest)))
    );
    setLocalModelAvailability(availability);
  }

  async function loadAndIndexArchive(
    loadedArchive: MemoryArchive,
    passphraseOverride?: string,
    engineMode: EmbeddingEngineMode = embeddingEngineMode
  ) {
    const engine = await createEmbeddingEngineForMode(engineMode);
    const { archive: indexedArchive, indexedMemoryIds, removedMemoryIds } = await rebuildEmbeddingIndex(loadedArchive, { engine });
    setArchive(indexedArchive);
    if (indexedMemoryIds.length > 0 || removedMemoryIds.length > 0) {
      await saveArchiveForCurrentSettings(indexedArchive, passphraseOverride);
    }
  }

  async function unlockEncryptedArchive(passphrase: string): Promise<boolean> {
    try {
      setArchiveUnlockError(undefined);
      const adapter = await createArchiveAtRestAdapter(passphrase);
      const unlockedArchive = await adapter.loadArchive();
      if (!unlockedArchive) {
        setArchiveUnlockError("No encrypted archive was found.");
        return false;
      }
      setArchiveAtRestPassphrase(passphrase);
      setArchiveUnlockRequired(false);
      await loadAndIndexArchive(unlockedArchive, passphrase);
      return true;
    } catch (error) {
      setArchiveUnlockError(error instanceof SyntaxError ? "Encrypted archive opened but could not be parsed." : "Archive passphrase did not unlock this archive.");
      return false;
    }
  }

  async function createArchiveAtRestAdapter(passphrase: string): Promise<EncryptedArchiveAtRestAdapter> {
    const provider = createMobileEncryptionProvider();
    await provider.saveSettings({
      scope: "archive",
      keySource: "user_passphrase",
      requireUnlockForExport: true
    });
    return new EncryptedArchiveAtRestAdapter(new AsyncStorageArchiveAtRestRecordStore(), provider, {
      async getPassphrase() {
        return passphrase;
      }
    });
  }

  async function saveArchiveForCurrentSettings(archiveToSave: MemoryArchive, passphraseOverride?: string) {
    const passphrase = passphraseOverride ?? archiveAtRestPassphrase;
    if (encryptionSettings.scope === "archive" && encryptionSettings.keySource === "user_passphrase" && passphrase.trim()) {
      await (await createArchiveAtRestAdapter(passphrase)).saveArchive(archiveToSave);
      await clearPlaintextArchiveStorage();
      return;
    }
    await saveArchive(archiveToSave);
  }

  async function persist(nextArchive: MemoryArchive, options: { rebuildEmbeddings?: boolean } = {}) {
    const shouldRebuildEmbeddings = embeddingMaintenanceMode === "automatic" || options.rebuildEmbeddings;
    const archiveToSave = shouldRebuildEmbeddings
      ? (await rebuildEmbeddingIndex(nextArchive, { engine: await createEmbeddingEngineForMode(embeddingEngineMode) })).archive
      : nextArchive;
    setArchive(archiveToSave);
    await saveArchiveForCurrentSettings(archiveToSave);
  }

  async function saveAppLockSettings(settings: AppLockSettings) {
    await appLockProvider.saveSettings(settings);
    setAppLockSettings(settings);
    setIsAppLocked(await appLockProvider.isLocked());
  }

  if (!archive) {
    if (archiveUnlockRequired) {
      return (
        <RootSafeArea statusBarStyle={statusBarStyle} statusBarBackgroundColor={statusBarBackgroundColor}>
          <ArchiveUnlockView error={archiveUnlockError} onUnlock={unlockEncryptedArchive} />
        </RootSafeArea>
      );
    }

    return (
      <RootSafeArea statusBarStyle={statusBarStyle} statusBarBackgroundColor={statusBarBackgroundColor}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{archiveLoadError ? "Archive could not be loaded" : "Loading archive"}</Text>
          {archiveLoadError ? <Text style={styles.errorText}>{archiveLoadError}</Text> : null}
          {archiveLoadError ? <SecondaryButton label="Try again" onPress={loadInitialArchive} icon={<RotateCcw size={18} />} /> : null}
        </View>
      </RootSafeArea>
    );
  }

  if (isAppLocked) {
    return (
      <RootSafeArea statusBarStyle={statusBarStyle} statusBarBackgroundColor={statusBarBackgroundColor}>
        <UnlockView
          mode={appLockSettings.mode}
          onUnlock={async (secret) => {
            const unlocked = await appLockProvider.unlock(secret);
            setIsAppLocked(await appLockProvider.isLocked());
            return unlocked;
          }}
        />
      </RootSafeArea>
    );
  }

  return (
    <AppShell
      mode={mode}
      wide={width >= 900}
      statusBarStyle={statusBarStyle}
      statusBarBackgroundColor={statusBarBackgroundColor}
      saveNotice={saveNotice}
      onExplore={() => setMode("list")}
      onCapture={() => {
        setSelectedId(undefined);
        setMode("editor");
      }}
      onReview={() => setMode("review")}
      onSettings={() => setMode("settings")}
    >
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
              setSelectedId(undefined);
              setPostSaveMemoryId(undefined);
              setSaveNotice("Memory saved.");
              setMode("list");
            }}
          />
        ) : null}

        {mode === "editor" && !selectedMemory ? (
          <NewMemoryCapture
            onVoice={() => setMode("voice")}
            onCancel={() => setMode("list")}
            onSave={async (text) => {
              const memory = createMemory(text);
              await persist(upsertMemory(archive, memory));
              await AsyncStorage.removeItem(NEW_MEMORY_DRAFT_KEY);
              setSelectedId(undefined);
              setPostSaveMemoryId(undefined);
              setSaveNotice("Memory saved.");
              setMode("list");
            }}
          />
        ) : null}

        {mode === "editor" && selectedMemory ? (
          <MemoryEditor
            archive={archive}
            structuredExtractionMode={structuredExtractionMode}
            memory={selectedMemory}
            onVoice={() => setMode("voice")}
            onCancel={() => setMode("detail")}
            onSave={async (memory, tagText) => {
              const withMemory = upsertMemory(archive, memory);
              const withTags = replaceTags(
                withMemory,
                memory.id,
                parseTagNames(tagText)
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
            postSaveActive={postSaveMemoryId === selectedMemory.id}
            postSaveItems={buildPostSaveItems(archive, selectedMemory.id)}
            onEdit={() => setMode("editor")}
            onBack={() => {
              setPostSaveMemoryId(undefined);
              setMode("list");
            }}
            onSelect={(id) => {
              setPostSaveMemoryId(undefined);
              setSelectedId(id);
              setMode("detail");
            }}
            onReviewPostSave={() => {
              setPostSaveMemoryId(undefined);
              setMode("review");
            }}
            onDismissPostSave={() => setPostSaveMemoryId(undefined)}
            onAddendum={async (text) => persist(appendMemoryAddendum(archive, selectedMemory.id, text))}
            onUpdateSafety={async (safety) => persist(updateMemorySafety(archive, selectedMemory.id, safety))}
            onSavePrivateNotes={async (notes) => persist(updateMemoryPrivateNotes(archive, selectedMemory.id, notes))}
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
              setSelectedId(undefined);
              setPostSaveMemoryId(undefined);
              setSaveNotice("Memory saved.");
              setMode("list");
            }}
          />
        ) : null}

        {mode === "timeline" ? (
          <TimelineView
            archive={archive}
            memories={memories}
            onArchiveChange={persist}
            onBack={() => setMode("list")}
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
            onBack={() => setMode("list")}
            onSelect={(id) => {
              setSelectedId(id);
              setMode("detail");
            }}
          />
        ) : null}

        {mode === "tags" ? (
          <TagManagement
            archive={archive}
            onOpenTag={(tagId) => {
              setSelectedTagIds([tagId]);
              setSelectedDatePrecision(undefined);
              setQuery("");
              setMode("list");
            }}
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
            onBack={() => setMode("list")}
          />
        ) : null}

        {mode === "settings" ? (
          <Settings
            archive={archive}
            appLockSettings={appLockSettings}
            encryptionSettings={encryptionSettings}
            structuredExtractionMode={structuredExtractionMode}
            embeddingEngineMode={embeddingEngineMode}
            embeddingMaintenanceMode={embeddingMaintenanceMode}
            localModelAvailability={localModelAvailability}
            appearanceMode={appearanceMode}
            onArchiveChange={persist}
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
            onSaveEncryptionSettings={async (settings, passphrase) => {
              const savedSettings = await saveEncryptionSettings(settings);
              setEncryptionSettings(savedSettings.encryptionSettings);
              if (savedSettings.encryptionSettings.scope === "archive" && savedSettings.encryptionSettings.keySource === "user_passphrase") {
                if (!passphrase?.trim()) {
                  throw new Error("Archive-at-rest encryption requires an archive passphrase.");
                }
                setArchiveAtRestPassphrase(passphrase);
                await (await createArchiveAtRestAdapter(passphrase)).saveArchive(archive);
                await clearPlaintextArchiveStorage();
                setArchiveUnlockRequired(false);
                return;
              }

              await saveArchive(archive);
              await new AsyncStorageArchiveAtRestRecordStore().clear();
              setArchiveAtRestPassphrase("");
            }}
            onStructuredExtractionModeChange={async (mode) => {
              const savedSettings = await saveStructuredExtractionMode(mode);
              setStructuredExtractionMode(savedSettings.structuredExtractionMode);
            }}
            onEmbeddingEngineModeChange={async (mode) => {
              const savedSettings = await saveEmbeddingEngineMode(mode);
              setEmbeddingEngineMode(savedSettings.embeddingEngineMode);
            }}
            onEmbeddingMaintenanceModeChange={async (mode) => {
              const savedSettings = await saveEmbeddingMaintenanceMode(mode);
              setEmbeddingMaintenanceMode(savedSettings.embeddingMaintenanceMode);
            }}
            onRefreshLocalModels={refreshLocalModelAvailability}
            onImportLocalModels={async () => {
              const result = await pickAndImportLocalModelFiles([BGE_SMALL_EN_V15_ASSET_MANIFEST, QWEN_2_5_0_5B_ASSET_MANIFEST]);
              await refreshLocalModelAvailability();
              return result;
            }}
            onAppearanceModeChange={async (mode) => {
              const savedSettings = await saveAppearanceMode(mode);
              setAppearanceMode(savedSettings.appearanceMode);
            }}
            onRestore={async (memoryId) => persist(restoreMemory(archive, memoryId))}
            onPermanentlyDelete={async (memoryId) => persist(permanentlyDeleteMemory(archive, memoryId))}
          />
        ) : null}

    </AppShell>
  );
}

function AppShell(props: {
  mode: ViewMode;
  wide: boolean;
  statusBarStyle: "dark-content" | "light-content";
  statusBarBackgroundColor: string;
  saveNotice?: string | undefined;
  children: ReactNode;
  onExplore: () => void;
  onCapture: () => void;
  onReview: () => void;
  onSettings: () => void;
}) {
  return (
    <RootSafeArea statusBarStyle={props.statusBarStyle} statusBarBackgroundColor={props.statusBarBackgroundColor}>
      <View style={[styles.shell, props.wide ? styles.shellWide : null]}>
        <ScreenHeader mode={props.mode} onSettings={props.onSettings} />
        {props.saveNotice ? (
          <View style={styles.saveNotice} accessibilityLiveRegion="polite">
            <Text style={styles.saveNoticeText}>{props.saveNotice}</Text>
          </View>
        ) : null}
        {props.children}
        <BottomNavigation
          mode={props.mode}
          onExplore={props.onExplore}
          onCapture={props.onCapture}
          onReview={props.onReview}
          onSettings={props.onSettings}
        />
      </View>
    </RootSafeArea>
  );
}

function RootSafeArea(props: {
  children: ReactNode;
  statusBarStyle: "dark-content" | "light-content";
  statusBarBackgroundColor: string;
}) {
  return (
    <>
      <StatusBar
        barStyle={props.statusBarStyle}
        backgroundColor={props.statusBarBackgroundColor}
        translucent={false}
      />
      <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safeArea}>
        {props.children}
      </SafeAreaView>
    </>
  );
}

function ScreenHeader(props: {
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
      <CenterCaptureButton onPress={props.onCapture} />
      <NavButton label="Review" active={props.mode === "review"} onPress={props.onReview} icon={<ClipboardList size={20} />} />
      <NavButton label="Settings" active={props.mode === "settings"} onPress={props.onSettings} icon={<SettingsIcon size={20} />} />
    </View>
  );
}

function CenterCaptureButton(props: { onPress: () => void }) {
  return (
    <Pressable accessibilityLabel="New memory" onPress={props.onPress} style={styles.captureButton}>
      <Plus size={26} color={styles.captureButtonIcon.color} />
    </Pressable>
  );
}

function NavButton(props: { label: string; icon: ReactNode; active: boolean; onPress: () => void }) {
  const iconColor = props.active ? styles.navIconActive.color : styles.navIcon.color;
  return (
    <Pressable onPress={props.onPress} style={[styles.navButton, props.active ? styles.navButtonActive : null]}>
      {renderIcon(props.icon, iconColor)}
      <Text style={[styles.navLabel, props.active ? styles.navLabelActive : null]}>{props.label}</Text>
    </Pressable>
  );
}

function screenTitle(mode: ViewMode): string {
  switch (mode) {
    case "editor":
      return "New memory";
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
      <Text style={styles.detailTitle}>memory palace is locked</Text>
      {props.mode === "pin" ? (
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="PIN"
          placeholderTextColor="#7b8178"
          secureTextEntry
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.tagInput}
        />
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <PrimaryButton label="Unlock" onPress={unlock} icon={<Lock size={18} />} />
    </View>
  );
}

function ArchiveUnlockView(props: { error: string | undefined; onUnlock: (passphrase: string) => Promise<boolean> }) {
  const [passphrase, setPassphrase] = useState("");
  const [localError, setLocalError] = useState<string | undefined>();
  const [unlocking, setUnlocking] = useState(false);

  async function unlock() {
    setLocalError(undefined);
    if (!passphrase.trim()) {
      setLocalError("Archive passphrase is required.");
      return;
    }
    setUnlocking(true);
    try {
      await props.onUnlock(passphrase);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <View style={styles.lockScreen}>
      <Lock size={32} color="#374236" />
      <Text style={styles.detailTitle}>Encrypted archive</Text>
      <Text style={styles.metadata}>Enter the archive passphrase to open the local encrypted archive.</Text>
      <TextInput
        value={passphrase}
        onChangeText={setPassphrase}
        placeholder="Archive passphrase"
        placeholderTextColor="#7b8178"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={() => void unlock()}
        style={styles.tagInput}
      />
      {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}
      {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
      <PrimaryButton
        label={unlocking ? "Unlocking..." : "Unlock archive"}
        onPress={unlock}
        disabled={!passphrase.trim() || unlocking}
        icon={<Lock size={18} />}
      />
    </View>
  );
}

function VoiceCaptureView(props: { onSave: (draft: AudioCaptureDraft) => Promise<void> }) {
  const transcriptionEngine = useMemo(() => new ManualTextTranscriptionEngine(), []);
  const [session, setSession] = useState<AudioCaptureSession | undefined>();
  const [draft, setDraft] = useState<AudioCaptureDraft | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [formatNotice, setFormatNotice] = useState<string | undefined>();
  const [isFormatting, setIsFormatting] = useState(false);
  const [status, setStatus] = useState<"idle" | "requesting_permission" | "recording" | "stopping" | "transcribing" | "draft_ready">("idle");
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | undefined>();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pendingStopRef = useRef(false);
  const draftTranscriptRef = useRef("");

  async function start() {
    if (status !== "idle" && status !== "draft_ready") return;
    pendingStopRef.current = false;
    setError(undefined);
    setStatus("requesting_permission");
    try {
      const granted = await requestAudioCapturePermission();
      if (!granted) {
        setError("Microphone permission was denied.");
        setStatus("idle");
        return;
      }

      const nextSession = await startAudioCapture();
      setSession(nextSession);
      setDraft(undefined);
      const startedAt = Date.now();
      setRecordingStartedAt(startedAt);
      setElapsedSeconds(0);
      setStatus("recording");
      if (pendingStopRef.current) {
        pendingStopRef.current = false;
        await stop("user", nextSession);
      }
    } catch (error) {
      setError(formatAudioCaptureError(error, "Recording could not be started."));
      setStatus("idle");
    }
  }

  async function stop(reason: "user" | "interruption" = "user", sessionOverride?: AudioCaptureSession) {
    const sessionToStop = sessionOverride ?? session;
    if (!sessionToStop) {
      if (status === "requesting_permission") pendingStopRef.current = true;
      return;
    }
    setError(undefined);
    setStatus("stopping");
    try {
      const artifact = await stopAudioCapture(sessionToStop);
      setSession(undefined);
      setRecordingStartedAt(undefined);
      setStatus("transcribing");
      let transcript = artifact.transcript ?? "";
      if (!transcript.trim()) {
        try {
          transcript = (await transcriptionEngine.transcribe(artifact)).text;
        } catch (error) {
          setError(formatAudioCaptureError(error, "Recording saved. Type or paste the transcript to continue."));
        }
      }
      setDraft({ artifact, transcript, retainAudio: false });
      if (reason === "interruption") {
        setError("Recording stopped because memory palace moved to the background. Review the transcript before saving.");
      }
      setStatus("draft_ready");
    } catch (error) {
      setError(formatAudioCaptureError(error, "Recording could not be saved."));
      setSession(undefined);
      setRecordingStartedAt(undefined);
      setStatus("idle");
    }
  }

  async function formatDraftTranscript() {
    const source = draft?.transcript.trim() ?? "";
    if (!source || isFormatting) return;

    setIsFormatting(true);
    setFormatNotice(undefined);
    setError(undefined);
    try {
      const formatted = await formatTranscriptDraftWithQwen(source);
      if (!formatted) {
        setFormatNotice(QWEN_TRANSCRIPT_FORMATTING_UNAVAILABLE_MESSAGE);
        return;
      }

      if (draftTranscriptRef.current.trim() !== source) {
        setFormatNotice("Draft changed while Qwen was formatting. Current text was not changed.");
        return;
      }

      draftTranscriptRef.current = formatted;
      setDraft((current) => (current ? { ...current, transcript: formatted } : current));
      setFormatNotice("Transcript formatted. Review it before saving.");
    } catch (error) {
      setFormatNotice(
        error instanceof QwenTranscriptRewriteError
          ? "Qwen tried to rewrite the transcript, so your draft was not changed."
          : "Qwen transcript formatting failed. Your draft was not changed."
      );
    } finally {
      setIsFormatting(false);
    }
  }

  useEffect(() => {
    if (!recordingStartedAt || status !== "recording") return undefined;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [recordingStartedAt, status]);

  useEffect(() => {
    if (!session || status !== "recording") return undefined;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        void stop("interruption");
      }
    });
    return () => subscription.remove();
  }, [session, status]);

  useEffect(() => {
    draftTranscriptRef.current = draft?.transcript ?? "";
  }, [draft?.transcript]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.voicePanel}>
        <Text style={styles.sectionEyebrow}>Private voice capture</Text>
        <Text style={styles.capturePrompt}>{status === "recording" ? "Listening" : "Say the fragment"}</Text>
        <Text style={styles.voiceTimer}>{formatElapsedTime(elapsedSeconds)}</Text>
        <View style={styles.waveform} accessibilityLabel="soft recording waveform">
          {[18, 32, 24, 42, 28, 36, 20].map((height, index) => (
            <View
              key={`${height}-${index}`}
              style={[
                styles.waveformBar,
                { height: status === "recording" ? height : Math.max(12, Math.round(height * 0.45)) }
              ]}
            />
          ))}
        </View>
        <Text style={styles.captureNote}>No audio is kept unless you choose. You can type or edit the transcript before saving.</Text>
        <Text style={styles.metadata}>Status: {voiceCaptureStatusLabel(status)}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable
          onPressIn={() => void start()}
          onPressOut={() => void stop()}
          disabled={status === "stopping" || status === "transcribing"}
          style={[
            styles.holdToSpeakButton,
            status === "recording" ? styles.holdToSpeakButtonActive : null,
            status === "stopping" || status === "transcribing" ? styles.disabled : null
          ]}
        >
          {renderIcon(status === "recording" ? <Square size={20} /> : <Mic size={20} />, styles.primaryButtonIcon.color)}
          <Text style={styles.primaryButtonText}>
            {status === "requesting_permission"
              ? "Requesting permission"
              : status === "recording"
                ? "Release to stop"
                : "Hold to speak"}
          </Text>
        </Pressable>
        {session ? <SecondaryButton label="Stop recording" onPress={() => void stop()} icon={<Square size={18} />} /> : null}
        {error ? <SecondaryButton label="Try again" onPress={start} icon={<RotateCcw size={18} />} /> : null}
      </View>
      {draft ? (
        <View style={styles.transcriptPanel}>
          <Text style={styles.sectionEyebrow}>Transcript review</Text>
          <Text style={styles.panelTitle}>Here is what I heard</Text>
          <TextInput
            value={draft.transcript}
            onChangeText={(transcript) => {
              setDraft({ ...draft, transcript });
              draftTranscriptRef.current = transcript;
              setFormatNotice(undefined);
            }}
            placeholder="Type or paste the transcript"
            placeholderTextColor="#7b8178"
            multiline
            textAlignVertical="top"
            style={styles.bodyInput}
          />
          <SecondaryButton
            label={isFormatting ? "Formatting..." : "Format transcript"}
            onPress={() => void formatDraftTranscript()}
            disabled={isFormatting || !draft.transcript.trim()}
            icon={<Wand2 size={18} />}
          />
          <Pressable
            onPress={() => setDraft({ ...draft, retainAudio: !draft.retainAudio })}
            style={[styles.segment, draft.retainAudio ? styles.segmentActive : null]}
          >
            <Text style={[styles.segmentText, draft.retainAudio ? styles.segmentTextActive : null]}>
              Optional: keep original audio
            </Text>
          </Pressable>
          <Text style={styles.captureNote}>Edit only what matters. An imperfect transcript can still be saved.</Text>
          <Text style={styles.metadata}>
            Audio: {draft.artifact.durationMs ? `${Math.round(draft.artifact.durationMs / 1000)}s` : "recorded"}
          </Text>
          {formatNotice ? <Text style={styles.metadata}>{formatNotice}</Text> : null}
          <PrimaryButton
            label="Save voice memory"
            onPress={() => void props.onSave(draft)}
            disabled={!draft.transcript.trim() || isFormatting}
            icon={<Save size={18} />}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function voiceCaptureStatusLabel(status: "idle" | "requesting_permission" | "recording" | "stopping" | "transcribing" | "draft_ready"): string {
  switch (status) {
    case "requesting_permission":
      return "requesting microphone access";
    case "recording":
      return "recording";
    case "stopping":
      return "saving audio";
    case "transcribing":
      return "listening back locally";
    case "draft_ready":
      return "draft ready";
    case "idle":
      return "ready";
  }
}

function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
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
  onBack: () => void;
  onSelect: (id: string) => void;
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
      <PathBackButton onPress={props.onBack} />
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
        entities.map((entity) => {
          const constellation = buildLifeContextConstellation(props.archive, kind, entity);
          return (
            <EntityCard
              key={entity.id}
              kind={kind}
              entity={entity}
              constellation={constellation}
              onDelete={() => void props.onDelete(kind, entity.id)}
              onSelectMemory={props.onSelect}
            />
          );
        })
      )}
    </ScrollView>
  );
}

type LifeContextListEntity = { id: string; name: string; detail?: string };

function EntityCard(props: {
  kind: LifeContextKind;
  entity: LifeContextListEntity;
  constellation: ReturnType<typeof buildLifeContextConstellation>;
  onDelete: () => void;
  onSelectMemory: (id: string) => void;
}) {
  return (
    <View style={styles.constellationCard}>
      <View style={styles.constellationHeader}>
        <View style={styles.detailTitleBlock}>
          <Text style={styles.sectionEyebrow}>{lifeContextSingularLabel(props.kind)}</Text>
          <Text style={styles.memoryTitle}>{props.entity.name}</Text>
          {props.entity.detail ? <Text style={styles.metadata}>{props.entity.detail}</Text> : null}
        </View>
        <IconButton label="Delete context" danger onPress={props.onDelete} icon={<Trash2 size={20} />} />
      </View>
      <View style={styles.constellationStats}>
        <Text style={styles.timelineBadge}>
          {props.constellation.memoryCount} {props.constellation.memoryCount === 1 ? "memory" : "memories"}
        </Text>
        {props.constellation.period ? <Text style={styles.metadata}>{props.constellation.period}</Text> : null}
      </View>
      <View style={styles.constellationSection}>
        <Text style={styles.sectionEyebrow}>{props.kind === "place" ? "Recurring details" : "Often with"}</Text>
        {props.constellation.recurringDetails.length > 0 ? (
          <TagRow labels={props.constellation.recurringDetails} />
        ) : (
          <Text style={styles.metadata}>More connections will appear as memories mention this.</Text>
        )}
      </View>
      <View style={styles.constellationSection}>
        <Text style={styles.sectionEyebrow}>Memories</Text>
        {props.constellation.memories.length > 0 ? (
          props.constellation.memories.map((memory) => (
            <Pressable key={memory.id} style={styles.constellationMemory} onPress={() => props.onSelectMemory(memory.id)}>
              <Text style={styles.memoryPreview} numberOfLines={2}>
                {memory.title ?? memory.rawText}
              </Text>
              <ConnectionReason label="Connected by" reason={props.entity.name} />
            </Pressable>
          ))
        ) : (
          <Text style={styles.metadata}>No matching memories yet.</Text>
        )}
      </View>
    </View>
  );
}

function buildLifeContextConstellation(archive: MemoryArchive, kind: LifeContextKind, entity: LifeContextListEntity) {
  const activeMemories = archive.memories.filter((memory) => !memory.deletedAt);
  const memories = activeMemories.filter((memory) =>
    findLifeContextMatches(memory.cleanedText ?? memory.rawText, archive).some(
      (match) => match.kind === kind && match.id === entity.id
    )
  );
  const details = topRecurringLifeContextDetails(archive, kind, entity, memories);
  const period = kind === "place" || kind === "life_period" ? formatConstellationPeriod(memories, entity) : undefined;

  return {
    memoryCount: memories.length,
    memories: memories.slice(0, 4),
    recurringDetails: details,
    period
  };
}

function topRecurringLifeContextDetails(
  archive: MemoryArchive,
  kind: LifeContextKind,
  entity: LifeContextListEntity,
  memories: Memory[]
): string[] {
  const counts = new Map<string, number>();

  for (const memory of memories) {
    for (const match of findLifeContextMatches(memory.cleanedText ?? memory.rawText, archive)) {
      if (match.kind === kind && match.id === entity.id) continue;
      incrementCount(counts, match.name);
    }
    for (const tag of tagsForMemory(archive, memory.id)) {
      if (tag.name.toLocaleLowerCase() === entity.name.toLocaleLowerCase()) continue;
      incrementCount(counts, tag.name);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([name]) => name);
}

function incrementCount(counts: Map<string, number>, label: string) {
  const trimmed = label.trim();
  if (!trimmed) return;
  counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
}

function formatConstellationPeriod(memories: Memory[], entity: LifeContextListEntity): string | undefined {
  const years = memories.flatMap((memory) => [
    parseYearFromDateText(memory.approximateStartDate),
    parseYearFromDateText(memory.approximateEndDate)
  ]).filter((year): year is number => year !== undefined);

  if (years.length > 0) {
    const first = Math.min(...years);
    const last = Math.max(...years);
    return first === last ? `around ${first}` : `roughly ${first}-${last}`;
  }

  const detailYear = parseYearFromDateText(entity.detail);
  return detailYear ? `around ${detailYear}` : undefined;
}

function parseYearFromDateText(value?: string): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function getLifeContextEntities(archive: MemoryArchive, kind: LifeContextKind): LifeContextListEntity[] {
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

function buildPostSaveItems(archive: MemoryArchive, memoryId: string): ReviewInboxItem[] {
  try {
    const items = buildReviewInbox(archive).filter((item) => item.memoryId === memoryId && item.type !== "untagged_memory");
    const dateSuggestion = items.find((item) => item.type === "date_suggestion");
    const tagSuggestions = items.filter((item) => item.type === "tag_suggestion");
    return dateSuggestion ? [dateSuggestion, ...tagSuggestions.slice(0, 3)] : tagSuggestions.slice(0, 4);
  } catch {
    return [];
  }
}

function ReviewInboxView(props: {
  archive: MemoryArchive;
  onAccept: (item: ReviewInboxItem) => Promise<void>;
  onReject: (item: ReviewInboxItem) => Promise<void>;
  onSelect: (id: string) => void;
}) {
  const [deferredItemIds, setDeferredItemIds] = useState<string[]>([]);
  const items = buildReviewInbox(props.archive);
  const visibleItems = items.filter((item) => !deferredItemIds.includes(item.id));
  const deferredCount = items.length - visibleItems.length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.reviewIntro}>
        <Text style={styles.sectionEyebrow}>Review when you want</Text>
        <Text style={styles.capturePrompt}>
          {visibleItems.length === 0
            ? "No possible details are waiting."
            : `${visibleItems.length} ${visibleItems.length === 1 ? "memory has" : "memories have"} possible details`}
        </Text>
        <Text style={styles.captureNote}>
          Suggestions are optional. Accept what feels right, edit the memory, dismiss a wrong detail, or leave it for later.
        </Text>
        {deferredCount > 0 ? (
          <Text style={styles.metadata}>
            {deferredCount} {deferredCount === 1 ? "suggestion is" : "suggestions are"} tucked away until you come back.
          </Text>
        ) : null}
      </View>
      {visibleItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nothing waiting</Text>
          <Text style={styles.metadata}>
            {deferredCount > 0 ? "Deferred details will return next time you open the app." : "Capture and explore stay open either way."}
          </Text>
          {deferredCount > 0 ? (
            <SecondaryButton label="Bring them back" onPress={() => setDeferredItemIds([])} icon={<RotateCcw size={18} />} />
          ) : null}
        </View>
      ) : (
        visibleItems.map((item) => {
          const memory = props.archive.memories.find((candidate) => candidate.id === item.memoryId);
          return (
            <ReviewCard
              key={item.id}
              item={item}
              memory={memory}
              onOpen={() => props.onSelect(item.memoryId)}
              onAccept={() => void props.onAccept(item)}
              onLater={() => setDeferredItemIds((current) => [...current, item.id])}
              onReject={() => void props.onReject(item)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

function ReviewCard(props: {
  item: ReviewInboxItem;
  memory: Memory | undefined;
  onOpen: () => void;
  onAccept: () => void;
  onLater: () => void;
  onReject: () => void;
}) {
  const sourceText = "sourceText" in props.item ? props.item.sourceText : undefined;
  const explanation = "explanation" in props.item ? props.item.explanation : undefined;
  const dateNeedsContext = props.item.type === "date_suggestion" && !props.item.startDate && !props.item.endDate;

  return (
    <Pressable style={styles.reviewItem} onPress={props.onOpen}>
      <View style={styles.constellationHeader}>
        <View style={styles.detailTitleBlock}>
          <Text style={styles.reviewType}>{reviewTypeLabel(props.item.type)}</Text>
          <Text style={styles.memoryTitle}>{props.item.label}</Text>
        </View>
        <Text style={styles.timelineBadge}>{Math.round(props.item.confidence * 100)}%</Text>
      </View>
      {props.memory ? (
        <Text style={styles.memoryPreview} numberOfLines={2}>
          {props.memory.cleanedText || props.memory.rawText}
        </Text>
      ) : null}
      {sourceText ? (
        <View style={styles.reviewDetail}>
          <Text style={styles.sectionEyebrow}>From the memory</Text>
          <Text style={styles.metadata}>{sourceText}</Text>
        </View>
      ) : null}
      {explanation ? <ConnectionReason label="Why it is here" reason={explanation} /> : null}
      <View style={styles.actionRow}>
        {props.item.type !== "untagged_memory" && !dateNeedsContext ? (
          <PrimaryButton label="Accept" onPress={props.onAccept} icon={<Save size={18} />} />
        ) : null}
        <SecondaryButton label={dateNeedsContext ? "Add date" : "Edit"} onPress={props.onOpen} icon={<Edit3 size={18} />} />
        <SecondaryButton label="Later" onPress={props.onLater} icon={<RotateCcw size={18} />} />
        {props.item.type === "tag_suggestion" ? (
          <SecondaryButton label="Dismiss" onPress={props.onReject} icon={<X size={18} />} />
        ) : null}
      </View>
    </Pressable>
  );
}

function TimelineView(props: {
  archive: MemoryArchive;
  memories: Memory[];
  onArchiveChange: (archive: MemoryArchive) => Promise<void>;
  onBack: () => void;
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
      <PathBackButton onPress={props.onBack} />
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
            <ChapterCard
              key={chapter.id}
              archive={props.archive}
              chapter={chapter}
              {...(index > 0 && chapters[index - 1] ? { previousChapter: chapters[index - 1] } : {})}
              memoriesById={memoriesById}
              onSelect={props.onSelect}
              onAccept={() => props.onArchiveChange(acceptLifeChapterCandidate(props.archive, chapter.id, chapter.name))}
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
    <TagPill label={props.label} selected={props.selected} onPress={props.onPress} />
  );
}

function ChapterCard(props: {
  archive: MemoryArchive;
  chapter: LifeChapterCandidate;
  previousChapter?: LifeChapterCandidate;
  memoriesById: Map<string, Memory>;
  onSelect: (id: string) => void;
  onAccept: () => Promise<void>;
  onRename: (name: string) => Promise<void>;
  onReject: () => Promise<void>;
  onMergeInto: (targetId: string) => Promise<void>;
  onSplit: (memoryIds: string[], name: string) => Promise<void>;
}) {
  const [draftName, setDraftName] = useState(props.chapter.name);
  const splitMemoryId = props.chapter.memoryIds[0];
  const chapterMemories = props.chapter.memoryIds
    .map((memoryId) => props.memoriesById.get(memoryId))
    .filter((memory): memory is Memory => Boolean(memory));
  const recurringDetails = topChapterDetailLabels(props.archive, chapterMemories);
  const chapterPeriod = formatChapterPeriod(chapterMemories);

  useEffect(() => {
    setDraftName(props.chapter.name);
  }, [props.chapter.name]);

  return (
    <View style={styles.chapterCard}>
      <View style={styles.constellationHeader}>
        <View style={styles.detailTitleBlock}>
          <Text style={styles.sectionEyebrow}>{props.chapter.accepted ? "Accepted chapter" : "Possible chapter"}</Text>
          <Text style={styles.memoryTitle}>{props.chapter.name}</Text>
          <View style={styles.constellationStats}>
            <Text style={styles.timelineBadge}>{formatChapterBasis(props.chapter.basis)}</Text>
            {props.chapter.accepted ? <Text style={styles.timelineBadge}>user-confirmed</Text> : null}
            <Text style={styles.metadata}>
              {props.chapter.memoryIds.length} {props.chapter.memoryIds.length === 1 ? "memory" : "memories"}
            </Text>
            {chapterPeriod ? <Text style={styles.metadata}>{chapterPeriod}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.constellationSection}>
        <Text style={styles.sectionEyebrow}>Recurring details</Text>
        {recurringDetails.length > 0 ? (
          <TagRow labels={recurringDetails} />
        ) : (
          <Text style={styles.metadata}>Details will appear as memories overlap.</Text>
        )}
      </View>

      <View style={styles.constellationSection}>
        <Text style={styles.sectionEyebrow}>Memories</Text>
        {chapterMemories.slice(0, 5).map((memory) => (
          <Pressable key={memory.id} style={styles.chapterMemory} onPress={() => props.onSelect(memory.id)}>
            <Text style={styles.memoryPreview} numberOfLines={2}>
              {memory.title ?? memory.rawText}
            </Text>
            <ConnectionReason label="Chapter because" reason={formatChapterBasis(props.chapter.basis)} />
          </Pressable>
        ))}
      </View>

      <View style={styles.constellationSection}>
        <Text style={styles.sectionEyebrow}>Chapter controls</Text>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          placeholder="Chapter name"
          placeholderTextColor="#7b8178"
          style={styles.tagInput}
        />
        <View style={styles.actionRow}>
          {props.chapter.accepted ? (
            <Text style={styles.metadata}>This chapter is part of your chosen structure.</Text>
          ) : (
            <PrimaryButton label="Accept" onPress={props.onAccept} icon={<Save size={18} />} />
          )}
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
          <SecondaryButton label="Hide" onPress={props.onReject} icon={<X size={18} />} />
        </View>
      </View>
    </View>
  );
}

function topChapterDetailLabels(archive: MemoryArchive, memories: Memory[]): string[] {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    for (const tag of tagsForMemory(archive, memory.id)) {
      incrementCount(counts, tag.name);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([name]) => name);
}

function formatChapterPeriod(memories: Memory[]): string | undefined {
  const years = memories
    .flatMap((memory) => [
      parseYearFromDateText(memory.approximateStartDate),
      parseYearFromDateText(memory.approximateEndDate)
    ])
    .filter((year): year is number => year !== undefined);

  if (years.length === 0) return undefined;
  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? `around ${first}` : `roughly ${first}-${last}`;
}

function formatChapterBasis(basis: LifeChapterCandidate["basis"]): string {
  switch (basis) {
    case "timeline":
      return "timeline";
    case "tag_cluster":
      return "shared tags";
    case "life_period":
      return "life period";
  }
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
  const { width } = useWindowDimensions();
  const [fastCaptureText, setFastCaptureText] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const isWideExplore = width >= 900;
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
  const activeMemories = props.archive.memories.filter((memory) => !memory.deletedAt);
  const unknownDateCount = activeMemories.filter((memory) => memory.datePrecision === "unknown").length;
  const selectedTags = props.archive.tags.filter((tag) => props.selectedTagIds.includes(tag.id));
  const selectedTagNames = selectedTags.map((tag) => tag.name);
  const hasActiveSearch = Boolean(props.query.trim() || props.selectedTagIds.length > 0 || props.selectedDatePrecision);
  const searchContext = describeSearchContext({
    query: props.query,
    searchMode: props.searchMode,
    selectedDatePrecision: props.selectedDatePrecision,
    selectedTagNames
  });
  const suggestionGroups = useMemo(
    () =>
      buildExploreFilterSuggestionGroups({
        archive: props.archive,
        query: props.query,
        activeTagIds: props.selectedTagIds,
        includeTextMatches: true,
        limitPerGroup: props.query.trim() ? 4 : 3,
        ...(props.selectedDatePrecision ? { activeDatePrecision: props.selectedDatePrecision } : {})
      }),
    [props.archive, props.query, props.selectedDatePrecision, props.selectedTagIds]
  );

  function applySuggestion(suggestion: ExploreFilterSuggestion) {
    if (suggestion.type === "date") {
      props.onSelectDatePrecision(suggestion.value as DatePrecision);
      return;
    }
    if (suggestion.type === "text") {
      props.onQueryChange(suggestion.value);
      return;
    }
    props.onToggleTag(suggestion.value);
  }

  async function saveFastCapture() {
    const text = fastCaptureText.trim();
    if (!text) return;
    await props.onFastCapture(text);
    setFastCaptureText("");
  }

  const captureSurface = (
    <View style={styles.capturePanel}>
        <Text style={styles.captureEyebrow}>Private notebook</Text>
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
        <Text style={styles.captureNote}>A fragment is enough. Dates and tags can wait.</Text>
        <View style={styles.actionRow}>
          <PrimaryButton label="Save memory" onPress={saveFastCapture} disabled={!fastCaptureText.trim()} icon={<Save size={18} />} />
          <SecondaryButton label="Open capture" onPress={props.onNew} icon={<Plus size={18} />} />
        </View>
      </View>
  );
  const continueSurface = props.prompts.length > 0 ? (
    <View style={styles.promptPanel}>
          <Text style={styles.panelTitle}>Continue from</Text>
          {props.prompts.slice(0, 3).map((prompt) => (
            <Pressable key={prompt.id} style={styles.promptItem} onPress={() => props.onPrompt(prompt)}>
              <Text style={styles.memoryPreview}>{prompt.label}</Text>
            </Pressable>
          ))}
        </View>
  ) : null;
  const searchSurface = (
    <>
      <View style={styles.searchRow}>
        <Search size={20} color="#5f655d" />
        <TextInput
          value={props.query}
          onChangeText={props.onQueryChange}
          placeholder={props.searchMode === "semantic" ? "Nearby memories, people, places..." : "Search memories, people, places, tags..."}
          placeholderTextColor="#7b8178"
          style={styles.searchInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show advanced filters"
          onPress={() => setShowAdvancedFilters((current) => !current)}
          style={[styles.iconButton, showAdvancedFilters ? styles.iconButtonActive : null]}
        >
          <SlidersHorizontal size={18} color={showAdvancedFilters ? "#263323" : "#5f655d"} />
        </Pressable>
      </View>
      {props.query.trim() || selectedTags.length > 0 || props.selectedDatePrecision ? (
        <View style={styles.activeFilterChips}>
          {props.query.trim() ? (
            <Pressable onPress={() => props.onQueryChange("")} style={[styles.tag, styles.tagSelected, styles.removableChip]}>
              <Text numberOfLines={1} style={[styles.tagLabelSelected, styles.removableChipLabel]}>Text: {props.query.trim()}</Text>
              <X size={14} color="#263323" />
            </Pressable>
          ) : null}
          {selectedTags.map((tag) => (
            <Pressable key={tag.id} onPress={() => props.onToggleTag(tag.id)} style={[styles.tag, styles.tagSelected, styles.removableChip]}>
              <Text numberOfLines={1} style={[styles.tagLabelSelected, styles.removableChipLabel]}>{tag.name}</Text>
              <X size={14} color="#263323" />
            </Pressable>
          ))}
          {props.selectedDatePrecision ? (
            <Pressable onPress={() => props.onSelectDatePrecision(props.selectedDatePrecision as DatePrecision)} style={[styles.tag, styles.tagSelected, styles.removableChip]}>
              <Text numberOfLines={1} style={[styles.tagLabelSelected, styles.removableChipLabel]}>{exploreDatePrecisionLabel(props.selectedDatePrecision)}</Text>
              <X size={14} color="#263323" />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {suggestionGroups.length > 0 ? (
        <View style={styles.suggestionPanel}>
          <Text style={styles.sectionEyebrow}>{props.query.trim() ? "Suggestions" : "Suggested filters"}</Text>
          {suggestionGroups.map((group) => (
            <View key={group.label} style={styles.suggestionGroup}>
              <Text style={styles.metadata}>{group.label}</Text>
              <View style={styles.tags}>
                {group.suggestions.map((suggestion) => (
                  <Pressable key={suggestion.id} onPress={() => applySuggestion(suggestion)} style={styles.suggestionChip}>
                    <Text style={styles.tagLabel}>{suggestion.label}</Text>
                    {suggestion.count ? <Text style={styles.suggestionCount}>{suggestion.count}</Text> : null}
                    {suggestion.snippet ? <Text style={styles.suggestionSnippet}>{suggestion.snippet}</Text> : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}
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
      {searchContext ? <Text style={styles.metadata}>{searchContext}</Text> : null}
    </>
  );
  const pathSurface = (
    <>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Ways in</Text>
          <Text style={styles.panelTitle}>Move through the archive</Text>
        </View>
      </View>
      <View style={styles.pathGrid}>
        <PathCard
          label="Timeline"
          detail="By approximate date"
          icon={<CalendarDays size={20} color="#5f655d" />}
          onPress={props.onTimeline}
          tone="sage"
        />
        <PathCard
          label="People & pets"
          detail="Known companions"
          icon={<Users size={20} color="#5f655d" />}
          onPress={props.onContext}
          tone="clay"
        />
        <PathCard
          label="Places"
          detail="Homes and rooms"
          icon={<MapPin size={20} color="#5f655d" />}
          onPress={props.onContext}
          tone="blue"
        />
        <PathCard
          label="Themes"
          detail={`${props.archive.tags.length} tags`}
          icon={<Tags size={20} color="#5f655d" />}
          onPress={props.onTags}
          tone="paper"
        />
        <PathCard
          label="Unknown dates"
          detail={`${unknownDateCount} memories`}
          icon={<CalendarDays size={20} color="#5f655d" />}
          onPress={() => props.onSelectDatePrecision("unknown")}
          tone="stone"
        />
      </View>
    </>
  );
  const filterSurface = (
      <View style={styles.filterPanel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.panelTitle}>Advanced filters</Text>
          <SecondaryButton
            label={showAdvancedFilters ? "Hide" : "Show"}
            onPress={() => setShowAdvancedFilters((current) => !current)}
            icon={<SlidersHorizontal size={18} />}
          />
        </View>
        {showAdvancedFilters ? (
          <>
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
          </>
        ) : (
          <Text style={styles.metadata}>Full tag and date inventory is tucked away until needed.</Text>
        )}
        {hasActiveSearch ? (
          <SecondaryButton label="Clear filters" onPress={props.onClearFilters} icon={<X size={18} />} />
        ) : null}
      </View>
  );
  const memoryListSurface = (
    <>

      <View style={styles.sectionHeader}>
        <Text style={styles.panelTitle}>{resultSectionTitle(props.searchMode, hasActiveSearch)}</Text>
        <Text style={styles.metadata}>{props.memories.length} {props.memories.length === 1 ? "memory" : "memories"}</Text>
      </View>

      {props.memories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{props.query ? "No matching memories" : "No memories yet"}</Text>
          {hasActiveSearch ? <Text style={styles.metadata}>Try fewer tags, a broader date, or the other search mode.</Text> : null}
          {hasActiveSearch ? <SecondaryButton label="Clear filters" onPress={props.onClearFilters} icon={<X size={18} />} /> : null}
          <PrimaryButton label="New memory" onPress={props.onNew} icon={<Plus size={18} />} />
        </View>
      ) : (
        props.memories.map((memory) => {
          const result = searchResultsByMemoryId.get(memory.id);
          const preview = result?.snippet ?? memory.cleanedText ?? memory.rawText;
          return (
            <MemoryCard key={memory.id} memory={memory} onPress={() => props.onSelect(memory.id)}>
              <HighlightedText text={preview} query={props.searchMode === "keyword" ? props.query : ""} />
              {result?.matchedTags.length ? <Text style={styles.metadata}>Matched tags: {result.matchedTags.join(", ")}</Text> : null}
              <TagRow labels={tagsForMemory(props.archive, memory.id).map((tag) => tag.name)} />
            </MemoryCard>
          );
        })
      )}
    </>
  );

  return (
    <ScrollView contentContainerStyle={[styles.content, isWideExplore ? styles.exploreWideContent : null]}>
      {isWideExplore ? (
        <View style={styles.exploreWideGrid}>
          <View style={styles.explorePrimaryPane}>
            {captureSurface}
            {pathSurface}
            {memoryListSurface}
          </View>
          <View style={styles.exploreSecondaryPane}>
            {continueSurface}
            {searchSurface}
            {filterSurface}
          </View>
        </View>
      ) : (
        <>
          {captureSurface}
          {continueSurface}
          {searchSurface}
          {pathSurface}
          {filterSurface}
          {memoryListSurface}
        </>
      )}
    </ScrollView>
  );
}

function describeSearchContext(input: {
  query: string;
  searchMode: SearchMode;
  selectedDatePrecision: DatePrecision | undefined;
  selectedTagNames: string[];
}): string | undefined {
  const pieces: string[] = [];
  if (input.query.trim()) {
    pieces.push(input.searchMode === "semantic" ? `near "${input.query.trim()}"` : `"${input.query.trim()}"`);
  }
  if (input.selectedTagNames.length > 0) {
    pieces.push(`tagged ${input.selectedTagNames.join(", ")}`);
  }
  if (input.selectedDatePrecision) {
    pieces.push(`${input.selectedDatePrecision} dates`);
  }
  if (pieces.length === 0) return undefined;
  return `Showing memories ${pieces.join(" and ")}.`;
}

function exploreDatePrecisionLabel(precision: DatePrecision): string {
  const labels: Record<DatePrecision, string> = {
    exact: "Exact dates",
    day: "Day dates",
    month: "Month dates",
    year: "Year-only dates",
    range: "Date ranges",
    age: "Age memories",
    grade: "School-grade memories",
    decade: "Decade memories",
    unknown: "Unknown dates"
  };
  return labels[precision];
}

function resultSectionTitle(searchMode: SearchMode, hasActiveSearch: boolean): string {
  if (!hasActiveSearch) return "Recently added";
  return searchMode === "semantic" ? "Nearby memories" : "Matching memories";
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

function PathCard(props: { label: string; detail: string; icon: ReactNode; onPress: () => void; tone: "sage" | "clay" | "blue" | "paper" | "stone" }) {
  return (
    <Pressable onPress={props.onPress} style={[styles.pathCard, pathToneStyle(props.tone)]}>
      <View style={[styles.pathIcon, pathIconToneStyle(props.tone)]}>{props.icon}</View>
      <View style={styles.pathText}>
        <Text style={styles.memoryTitle}>{props.label}</Text>
        <Text style={styles.metadata}>{props.detail}</Text>
      </View>
    </Pressable>
  );
}

function lifeContextSingularLabel(kind: LifeContextKind): string {
  switch (kind) {
    case "person":
      return "Person";
    case "pet":
      return "Pet";
    case "place":
      return "Place";
    case "life_period":
      return "Life period";
  }
}

function pathToneStyle(tone: "sage" | "clay" | "blue" | "paper" | "stone") {
  switch (tone) {
    case "sage":
      return styles.pathCardSage;
    case "clay":
      return styles.pathCardClay;
    case "blue":
      return styles.pathCardBlue;
    case "stone":
      return styles.pathCardStone;
    case "paper":
      return styles.pathCardPaper;
  }
}

function pathIconToneStyle(tone: "sage" | "clay" | "blue" | "paper" | "stone") {
  switch (tone) {
    case "sage":
      return styles.pathIconSage;
    case "clay":
      return styles.pathIconClay;
    case "blue":
      return styles.pathIconBlue;
    case "stone":
      return styles.pathIconStone;
    case "paper":
      return styles.pathIconPaper;
  }
}

function TagManagement(props: {
  archive: MemoryArchive;
  onOpenTag: (tagId: string) => void;
  onRename: (tagId: string, name: string) => Promise<void>;
  onTypeChange: (tagId: string, type: TagType) => Promise<void>;
  onMerge: (sourceTagId: string, targetTagId: string) => Promise<void>;
  onDelete: (tagId: string) => Promise<void>;
  onBack: () => void;
}) {
  const [editingTagId, setEditingTagId] = useState<string | undefined>();
  const [mergingTagId, setMergingTagId] = useState<string | undefined>();
  const [draftName, setDraftName] = useState("");
  const tagTypes: TagType[] = ["custom", "person", "pet", "place", "time", "emotion", "theme", "activity", "life_period"];
  const themeShelves = buildThemeShelves(props.archive);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PathBackButton onPress={props.onBack} />
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Themes</Text>
          <Text style={styles.panelTitle}>Readable shelves</Text>
        </View>
        <Text style={styles.metadata}>{themeShelves.length} {themeShelves.length === 1 ? "theme" : "themes"}</Text>
      </View>
      {props.archive.tags.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No tags yet</Text>
        </View>
      ) : (
        <>
          {themeShelves.map((shelf) => (
            <ThemeClusterCard key={shelf.tag.id} shelf={shelf} onOpen={() => props.onOpenTag(shelf.tag.id)} />
          ))}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Manage</Text>
              <Text style={styles.panelTitle}>Rename, type, merge, or delete tags</Text>
            </View>
          </View>

          {props.archive.tags.map((tag) => {
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
        })}
        </>
      )}
    </ScrollView>
  );
}

type ThemeShelf = {
  tag: MemoryArchive["tags"][number];
  memories: Memory[];
  relatedTags: string[];
};

function buildThemeShelves(archive: MemoryArchive): ThemeShelf[] {
  return archive.tags
    .map((tag) => {
      const memories = archive.memories
        .filter((memory) => !memory.deletedAt)
        .filter((memory) => tagsForMemory(archive, memory.id).some((candidate) => candidate.id === tag.id));
      return {
        tag,
        memories,
        relatedTags: topRelatedTagNames(archive, tag.id, memories)
      };
    })
    .filter((shelf) => shelf.memories.length > 0)
    .sort((left, right) => right.memories.length - left.memories.length || left.tag.name.localeCompare(right.tag.name));
}

function topRelatedTagNames(archive: MemoryArchive, tagId: string, memories: Memory[]): string[] {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    for (const tag of tagsForMemory(archive, memory.id)) {
      if (tag.id === tagId) continue;
      incrementCount(counts, tag.name);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([name]) => name);
}

function themeTypeLabel(type: TagType): string {
  switch (type) {
    case "person":
      return "Person theme";
    case "pet":
      return "Pet theme";
    case "place":
      return "Place theme";
    case "time":
      return "Time theme";
    case "emotion":
      return "Feeling theme";
    case "activity":
      return "Activity theme";
    case "life_period":
      return "Life-period theme";
    case "object":
      return "Object theme";
    case "theme":
      return "Theme";
    case "custom":
      return "Theme";
  }
}

function NewMemoryCapture(props: {
  onVoice: () => void;
  onCancel: () => void;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatNotice, setFormatNotice] = useState<string | undefined>();
  const [textEntryVisible, setTextEntryVisible] = useState(false);
  const textRef = useRef(text);
  const canSave = text.trim().length > 0 && !isSaving && !isFormatting;

  useEffect(() => {
    let isCurrent = true;
    void AsyncStorage.getItem(NEW_MEMORY_DRAFT_KEY).then((draft) => {
      if (!isCurrent) return;
      if (draft) {
        setText(draft);
        setTextEntryVisible(true);
      }
      setDraftLoaded(true);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!draftLoaded || isSaving) return;
    const nextDraft = text.trim() ? AsyncStorage.setItem(NEW_MEMORY_DRAFT_KEY, text) : AsyncStorage.removeItem(NEW_MEMORY_DRAFT_KEY);
    void nextDraft;
  }, [draftLoaded, isSaving, text]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  async function save() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await props.onSave(text.trim());
    } finally {
      setIsSaving(false);
    }
  }

  async function formatDraftText() {
    const source = text.trim();
    if (!source || isFormatting) return;

    setIsFormatting(true);
    setFormatNotice(undefined);
    try {
      const formatted = await formatTranscriptDraftWithQwen(source);
      if (!formatted) {
        setFormatNotice(QWEN_TRANSCRIPT_FORMATTING_UNAVAILABLE_MESSAGE);
        return;
      }

      if (textRef.current.trim() !== source) {
        setFormatNotice("Draft changed while Qwen was formatting. Current text was not changed.");
        return;
      }

      textRef.current = formatted;
      setText(formatted);
      setTextEntryVisible(true);
      setFormatNotice("Transcript formatted. Review it before saving.");
    } catch (error) {
      setFormatNotice(
        error instanceof QwenTranscriptRewriteError
          ? "Qwen tried to rewrite the transcript, so your draft was not changed."
          : "Qwen transcript formatting failed. Your draft was not changed."
      );
    } finally {
      setIsFormatting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, styles.newMemoryContent]}>
      <View style={styles.capturePanel}>
        <Text style={styles.capturePrompt}>What came back?</Text>
        <PrimaryButton label="Record by voice" onPress={props.onVoice} icon={<Mic size={18} />} />
        {!textEntryVisible ? (
          <SecondaryButton label="Type instead" onPress={() => setTextEntryVisible(true)} icon={<Edit3 size={18} />} />
        ) : (
          <TextInput
            value={text}
            onChangeText={(nextText) => {
              setText(nextText);
              textRef.current = nextText;
              setFormatNotice(undefined);
            }}
            placeholder="A fragment, a sentence, a scene"
            placeholderTextColor="#7b8178"
            multiline
            textAlignVertical="top"
            style={styles.newMemoryInput}
          />
        )}
        {textEntryVisible ? (
          <SecondaryButton
            label={isFormatting ? "Formatting..." : "Format transcript"}
            onPress={() => void formatDraftText()}
            disabled={isFormatting || !text.trim()}
            icon={<Wand2 size={18} />}
          />
        ) : null}
        <Text style={styles.captureNote}>A fragment is enough. Dates and tags can wait.</Text>
        {formatNotice ? <Text style={styles.metadata}>{formatNotice}</Text> : null}
        <View style={styles.captureActions}>
          <SecondaryButton label="Cancel" onPress={props.onCancel} icon={<X size={18} />} />
          <PrimaryButton label="Save" onPress={save} disabled={!canSave} icon={<Save size={18} />} />
        </View>
      </View>
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
  const [suggestionsPending, setSuggestionsPending] = useState(false);
  const [suggestionStatus, setSuggestionStatus] = useState<string | undefined>();

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

  async function generateSuggestions() {
    if (props.structuredExtractionMode === "none") {
      setTagSuggestions([]);
      setDateSuggestions([]);
      setSuggestionStatus("Suggestions are off.");
      return;
    }

    setSuggestionsPending(true);
    setSuggestionStatus(undefined);
    const rejectedTagNames = props.memory
      ? props.archive.memoryTags
          .filter((link) => link.memoryId === props.memory?.id && link.rejected)
          .map((link) => props.archive.tags.find((tag) => tag.id === link.tagId)?.normalizedName)
          .filter((name): name is string => Boolean(name))
      : [];
    try {
      const result = await extractStructuredSuggestionsForMode(props.structuredExtractionMode, text, props.archive.userProfile);
      const nextTagSuggestions = result.tags.filter((tag) => !rejectedTagNames.includes(tag.name.toLocaleLowerCase()));
      const nextDateSuggestions = result.dates;
      setTagSuggestions(nextTagSuggestions);
      setDateSuggestions(nextDateSuggestions);
      setSuggestionStatus(
        result.engineId === "local-model-structured-qwen2.5-0.5b-instruct" ? "Suggested with Qwen local model." : "Suggested with local rules."
      );

      const existingTags = new Set(parseTagNames(tagText));
      const mergedTags = [
        ...parseTagNames(tagText),
        ...nextTagSuggestions.filter((tag) => !existingTags.has(tag.name.toLocaleLowerCase())).map((tag) => tag.name)
      ];
      setTagText(mergedTags.join(", "));

      const preferredDate = nextDateSuggestions[0];
      if (preferredDate) {
        setDatePrecision(preferredDate.precision);
        setStartDate(preferredDate.startDate ?? "");
        setEndDate(preferredDate.endDate ?? "");
      }
    } finally {
      setSuggestionsPending(false);
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
          <Text style={styles.metadata}>Dates, tags, and title can wait. memory palace will suggest possible details after saving.</Text>
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
      {suggestionStatus ? <Text style={styles.metadata}>{suggestionStatus}</Text> : null}
      <View style={styles.actionRow}>
        <SecondaryButton label="Cancel" onPress={props.onCancel} icon={<X size={18} />} />
        {isEditing ? (
          <SecondaryButton
            label={suggestionsPending ? "Suggesting..." : "Suggest"}
            onPress={() => void generateSuggestions()}
            disabled={suggestionsPending}
            icon={<Wand2 size={18} />}
          />
        ) : null}
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
  onBack: () => void;
  onDelete: () => Promise<void>;
  onSelect: (id: string) => void;
  onReviewPostSave: () => void;
  onDismissPostSave: () => void;
  onAddendum: (text: string) => Promise<void>;
  onUpdateSafety: (safety: Pick<Memory, "isSensitive" | "excludeFromResurfacing" | "showLessLikeThis">) => Promise<void>;
  onSavePrivateNotes: (notes: string) => Promise<void>;
  onSplit: (splitIndex: number) => Promise<void>;
  onMergeRelated: (sourceMemoryId: string) => Promise<void>;
}) {
  const [relatedMemories, setRelatedMemories] = useState<RelatedMemoryResult[]>([]);
  const [addendumText, setAddendumText] = useState("");
  const [privateNotes, setPrivateNotes] = useState(props.memory.privateNotes ?? "");
  const [splitMarker, setSplitMarker] = useState("");
  const memoryText = props.memory.cleanedText || props.memory.rawText;
  const trimmedSplitMarker = splitMarker.trim();
  const splitMarkerIndex = trimmedSplitMarker ? memoryText.indexOf(trimmedSplitMarker) : -1;
  const splitIndex = splitMarkerIndex >= 0 ? splitMarkerIndex + trimmedSplitMarker.length : -1;

  useEffect(() => {
    setPrivateNotes(props.memory.privateNotes ?? "");
  }, [props.memory.id, props.memory.privateNotes]);

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
      <PathBackButton onPress={props.onBack} />
      {props.postSaveActive ? (
        <PostSaveSuggestionSheet
          items={props.postSaveItems}
          onReviewNow={props.onReviewPostSave}
          onLater={props.onDismissPostSave}
        />
      ) : null}
      <View style={styles.memoryPlaque}>
        <View style={styles.detailHeader}>
          <View style={styles.detailTitleBlock}>
            <Text style={styles.sectionEyebrow}>Memory label</Text>
            <Text style={styles.detailTitle}>{props.memory.title}</Text>
          </View>
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
        <View style={styles.dateSummary}>
          <DateCertaintyLabel memory={props.memory} />
          <Text style={styles.metadata}>{formatMemoryDate(props.memory)}</Text>
        </View>
        <TagRow labels={tagsForMemory(props.archive, props.memory.id).map((tag) => tag.name)} />
      </View>

      <View style={styles.memoryTextPanel}>
        <Text style={styles.sectionEyebrow}>Original memory</Text>
        <Text style={styles.memoryBody}>{memoryText}</Text>
        <Text style={styles.metadata}>Created {new Date(props.memory.createdAt).toLocaleString()}</Text>
      </View>

      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Resurfacing</Text>
        <Text style={styles.metadata}>These controls keep this memory from appearing unexpectedly.</Text>
        <View style={styles.tags}>
          <FilterChip
            label="sensitive"
            selected={Boolean(props.memory.isSensitive)}
            onPress={() =>
              void props.onUpdateSafety({
                isSensitive: !props.memory.isSensitive,
                excludeFromResurfacing: Boolean(props.memory.excludeFromResurfacing),
                showLessLikeThis: Boolean(props.memory.showLessLikeThis)
              })
            }
          />
          <FilterChip
            label="exclude from resurfacing"
            selected={Boolean(props.memory.excludeFromResurfacing)}
            onPress={() =>
              void props.onUpdateSafety({
                isSensitive: Boolean(props.memory.isSensitive),
                excludeFromResurfacing: !props.memory.excludeFromResurfacing,
                showLessLikeThis: Boolean(props.memory.showLessLikeThis)
              })
            }
          />
          <FilterChip
            label="show less like this"
            selected={Boolean(props.memory.showLessLikeThis)}
            onPress={() =>
              void props.onUpdateSafety({
                isSensitive: Boolean(props.memory.isSensitive),
                excludeFromResurfacing: true,
                showLessLikeThis: !props.memory.showLessLikeThis
              })
            }
          />
        </View>
      </View>
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
        <Text style={styles.panelTitle}>Private note</Text>
        <TextInput
          value={privateNotes}
          onChangeText={setPrivateNotes}
          placeholder="A note for later context"
          placeholderTextColor="#7b8178"
          multiline
          textAlignVertical="top"
          style={styles.addendumInput}
        />
        <SecondaryButton
          label="Save private note"
          disabled={privateNotes.trim() === (props.memory.privateNotes ?? "")}
          onPress={() => void props.onSavePrivateNotes(privateNotes)}
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
          <Text style={styles.panelTitle}>Nearby memories</Text>
          {relatedMemories.map((result) => (
            <View key={result.memory.id} style={styles.relatedItem}>
              <Pressable onPress={() => props.onSelect(result.memory.id)}>
                <Text style={styles.memoryTitle}>{result.memory.title}</Text>
                <Text style={styles.memoryPreview} numberOfLines={2}>
                  {result.memory.cleanedText || result.memory.rawText}
                </Text>
                <ConnectionReason label="Nearby because" reason={formatRelatedReasons(result)} />
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
  onReviewNow: () => void;
  onLater: () => void;
}) {
  const suggestedDate = props.items.find((item) => item.type === "date_suggestion");
  const suggestedTags = props.items.filter((item) => item.type === "tag_suggestion").map((item) => item.label);

  return (
    <View style={styles.postSaveSheet}>
      <Text style={styles.panelTitle}>Saved privately</Text>
      {props.items.length > 0 ? (
        <>
          <Text style={styles.memoryPreview}>I found a few possible details.</Text>
          {suggestedDate ? (
            <View style={styles.postSaveItem}>
              <Text style={styles.reviewType}>Suggested date</Text>
              <Text style={styles.memoryTitle}>{suggestedDate.label}</Text>
              {"explanation" in suggestedDate && suggestedDate.explanation ? (
                <Text style={styles.metadata}>{suggestedDate.explanation}</Text>
              ) : null}
            </View>
          ) : null}
          {suggestedTags.length > 0 ? (
            <View style={styles.postSaveItem}>
              <Text style={styles.reviewType}>Suggested tags</Text>
              <TagRow labels={suggestedTags} />
            </View>
          ) : null}
          <View style={styles.actionRow}>
            <PrimaryButton label="Review now" onPress={props.onReviewNow} icon={<ClipboardList size={18} />} />
            <SecondaryButton label="Later" onPress={props.onLater} icon={<X size={18} />} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.memoryPreview}>No possible details need review right now.</Text>
          <SecondaryButton label="Later" onPress={props.onLater} icon={<X size={18} />} />
        </>
      )}
    </View>
  );
}

function structuredExtractionModeLabel(mode: StructuredExtractionMode): string {
  switch (mode) {
    case "none":
      return "off";
    case "qwen2.5-0.5b":
      return "Qwen local";
    case "rules":
      return "local rules";
  }
}

function embeddingEngineModeLabel(mode: EmbeddingEngineMode): string {
  return mode === "bge-small-en-v1.5" ? "BGE local" : "hash local";
}

function localModelModeStatus(availability: LocalModelAvailability[], manifestId: string, fallbackReason?: string): string {
  const model = availability.find((candidate) => candidate.manifest.id === manifestId);
  if (!model) return "Model files have not been checked yet; current fallback stays active.";
  if (model.available && fallbackReason) return `Files are present in ${localModelDirectoryHint(model.manifest)}. ${fallbackReason}`;
  if (model.invalidAssetIds.length > 0) {
    return `Found ${model.invalidAssetIds.length} required file(s) with unexpected size in ${localModelDirectoryHint(
      model.manifest
    )}; current fallback stays active.`;
  }
  return model.available
    ? `Ready in ${localModelDirectoryHint(model.manifest)}.`
    : `Missing ${model.missingAssetIds.length} required file(s) in ${localModelDirectoryHint(model.manifest)}; current fallback stays active.`;
}

function missingLocalModelFileNames(model: LocalModelAvailability): string[] {
  return model.manifest.assets.filter((asset) => model.missingAssetIds.includes(asset.id)).map((asset) => asset.fileName);
}

function Settings(props: {
  archive: MemoryArchive;
  appLockSettings: AppLockSettings;
  encryptionSettings: EncryptionSettings;
  structuredExtractionMode: StructuredExtractionMode;
  embeddingEngineMode: EmbeddingEngineMode;
  embeddingMaintenanceMode: EmbeddingMaintenanceMode;
  localModelAvailability: LocalModelAvailability[];
  appearanceMode: AppearanceMode;
  onArchiveChange: (archive: MemoryArchive) => Promise<void>;
  onImport: (preview: ArchiveImportWorkflowPreview, options: ArchiveMergeOptions) => Promise<void>;
  onClearProcessingRuns: () => Promise<void>;
  onClearRetainedAudio: () => Promise<void>;
  onClearDeletedArtifacts: () => Promise<void>;
  onRegenerateEmbeddings: () => Promise<void>;
  onEnableBiometricLock: () => Promise<void>;
  onSavePin: (pin: string) => Promise<void>;
  onDisableAppLock: () => Promise<void>;
  onLockNow: () => Promise<void>;
  onSaveEncryptionSettings: (settings: EncryptionSettings, passphrase?: string) => Promise<void>;
  onStructuredExtractionModeChange: (mode: StructuredExtractionMode) => Promise<void>;
  onEmbeddingEngineModeChange: (mode: EmbeddingEngineMode) => Promise<void>;
  onEmbeddingMaintenanceModeChange: (mode: EmbeddingMaintenanceMode) => Promise<void>;
  onRefreshLocalModels: () => Promise<void>;
  onImportLocalModels: () => Promise<{ imported: Array<{ manifestId: string; fileName: string }>; ignoredFileNames: string[] }>;
  onAppearanceModeChange: (mode: AppearanceMode) => Promise<void>;
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
  const [archivePassphrase, setArchivePassphrase] = useState("");
  const [archivePassphraseDialogVisible, setArchivePassphraseDialogVisible] = useState(false);
  const [encryptionStatusMessage, setEncryptionStatusMessage] = useState<string | undefined>();
  const [encryptionSaving, setEncryptionSaving] = useState(false);
  const encryptionSavingRef = useRef(false);
  const archiveAutoSavePassphraseRef = useRef<string | undefined>(undefined);
  const archiveAutoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [backupStatus, setBackupStatus] = useState<string | undefined>();
  const [webDavUrl, setWebDavUrl] = useState("");
  const [webDavUsername, setWebDavUsername] = useState("");
  const [webDavPassword, setWebDavPassword] = useState("");
  const [webDavPassphrase, setWebDavPassphrase] = useState("");
  const [webDavStatus, setWebDavStatus] = useState<string | undefined>();
  const [qwenProbeStatus, setQwenProbeStatus] = useState<string | undefined>();
  const [qwenProbeRunning, setQwenProbeRunning] = useState(false);
  const [bgeProbeStatus, setBgeProbeStatus] = useState<string | undefined>();
  const [bgeProbeRunning, setBgeProbeRunning] = useState(false);
  const [localModelImportStatus, setLocalModelImportStatus] = useState<string | undefined>();
  const [localModelImportRunning, setLocalModelImportRunning] = useState(false);
  const [birthYearDraft, setBirthYearDraft] = useState(formatOptionalNumber(props.archive.userProfile?.birthYear));
  const [birthMonthDraft, setBirthMonthDraft] = useState(formatOptionalNumber(props.archive.userProfile?.birthMonth));
  const [birthDayDraft, setBirthDayDraft] = useState(formatOptionalNumber(props.archive.userProfile?.birthDay));
  const [schoolYearStartMonthDraft, setSchoolYearStartMonthDraft] = useState(
    formatOptionalNumber(props.archive.userProfile?.schoolYearStartMonth ?? DEFAULT_SCHOOL_YEAR_START_MONTH)
  );
  const [kindergartenStartAgeDraft, setKindergartenStartAgeDraft] = useState(
    formatOptionalNumber(props.archive.userProfile?.kindergartenStartAge ?? DEFAULT_KINDERGARTEN_START_AGE)
  );
  const [lifeCalendarStatus, setLifeCalendarStatus] = useState<string | undefined>();
  const encryptionProvider = useMemo(() => createMobileEncryptionProvider(), []);
  const encryptedExportsEnabled = props.encryptionSettings.scope !== "disabled";
  const exportBlocked = encryptedExportsEnabled && !exportPassphrase.trim();
  const archiveAtRestRequested = encryptionDraft.scope === "archive" && encryptionDraft.keySource === "user_passphrase";
  const archiveSaveDisabled = !archivePassphrase.trim() || encryptionSaving;
  const lifeCalendarPreview = formatLifeCalendarPreview(buildLifeCalendarDraftProfile({
    existingProfile: props.archive.userProfile,
    birthYearDraft,
    birthMonthDraft,
    birthDayDraft,
    schoolYearStartMonthDraft,
    kindergartenStartAgeDraft
  }));

  useEffect(() => {
    setBirthYearDraft(formatOptionalNumber(props.archive.userProfile?.birthYear));
    setBirthMonthDraft(formatOptionalNumber(props.archive.userProfile?.birthMonth));
    setBirthDayDraft(formatOptionalNumber(props.archive.userProfile?.birthDay));
    setSchoolYearStartMonthDraft(formatOptionalNumber(props.archive.userProfile?.schoolYearStartMonth ?? DEFAULT_SCHOOL_YEAR_START_MONTH));
    setKindergartenStartAgeDraft(formatOptionalNumber(props.archive.userProfile?.kindergartenStartAge ?? DEFAULT_KINDERGARTEN_START_AGE));
  }, [
    props.archive.userProfile?.birthDay,
    props.archive.userProfile?.birthMonth,
    props.archive.userProfile?.birthYear,
    props.archive.userProfile?.kindergartenStartAge,
    props.archive.userProfile?.schoolYearStartMonth
  ]);

  async function saveLifeCalendarSettings() {
    const parsed = parseLifeCalendarDraft({
      existingProfile: props.archive.userProfile,
      birthYearDraft,
      birthMonthDraft,
      birthDayDraft,
      schoolYearStartMonthDraft,
      kindergartenStartAgeDraft
    });
    if ("error" in parsed) {
      setLifeCalendarStatus(parsed.error);
      return;
    }

    const nextArchive: MemoryArchive = { ...props.archive, exportedAt: new Date().toISOString() };
    if (parsed.userProfile) {
      nextArchive.userProfile = parsed.userProfile;
    } else {
      delete nextArchive.userProfile;
    }
    await props.onArchiveChange(nextArchive);
    setLifeCalendarStatus(parsed.userProfile?.birthYear ? "Life calendar saved." : "Life calendar saved without a birth year.");
  }

  async function clearLifeCalendarSettings() {
    const existing = props.archive.userProfile;
    const nextArchive: MemoryArchive = { ...props.archive, exportedAt: new Date().toISOString() };
    if (existing) {
      const { birthYear, birthMonth, birthDay, schoolYearStartMonth, kindergartenStartAge, ...remainingProfile } = existing;
      if (hasUserProfileValues(remainingProfile)) {
        nextArchive.userProfile = remainingProfile;
      } else {
        delete nextArchive.userProfile;
      }
    } else {
      delete nextArchive.userProfile;
    }
    await props.onArchiveChange(nextArchive);
    setLifeCalendarStatus("Life calendar cleared.");
  }

  async function saveEncryptionOptions(passphraseOverride = archivePassphrase) {
    if (encryptionSavingRef.current) return;
    encryptionSavingRef.current = true;
    Keyboard.dismiss();
    setPortabilityError(undefined);
    setEncryptionStatusMessage("Saving encryption options...");
    setEncryptionSaving(true);

    try {
      await props.onSaveEncryptionSettings(encryptionDraft, passphraseOverride);
      if (archiveAtRestRequested) {
        setEncryptionStatusMessage("Archive-at-rest encryption is on. Plaintext primary storage was cleared after the encrypted archive was written.");
        archiveAutoSavePassphraseRef.current = undefined;
        setArchivePassphrase("");
        setArchivePassphraseDialogVisible(false);
        return;
      }
      setEncryptionStatusMessage("Encryption options saved. Archive-at-rest encryption is off, so the local archive remains in primary storage.");
    } catch (error) {
      setEncryptionStatusMessage(undefined);
      setPortabilityError(error instanceof Error ? error.message : "Encryption settings could not be saved.");
    } finally {
      encryptionSavingRef.current = false;
      setEncryptionSaving(false);
    }
  }

  async function saveArchiveEncryption(passphraseOverride = archivePassphrase) {
    if (encryptionSavingRef.current) return;
    encryptionSavingRef.current = true;
    Keyboard.dismiss();
    const archiveSettings: EncryptionSettings = {
      ...encryptionDraft,
      scope: "archive",
      keySource: "user_passphrase"
    };
    setEncryptionDraft(archiveSettings);
    setPortabilityError(undefined);
    setEncryptionStatusMessage("Saving archive-at-rest encryption...");
    setEncryptionSaving(true);

    try {
      await props.onSaveEncryptionSettings(archiveSettings, passphraseOverride);
      setEncryptionStatusMessage("Archive-at-rest encryption is on. Plaintext primary storage was cleared after the encrypted archive was written.");
      archiveAutoSavePassphraseRef.current = undefined;
      clearArchiveAutoSaveTimer();
      setArchivePassphrase("");
      setArchivePassphraseDialogVisible(false);
    } catch (error) {
      setEncryptionStatusMessage(undefined);
      setPortabilityError(error instanceof Error ? error.message : "Archive-at-rest encryption could not be saved.");
    } finally {
      encryptionSavingRef.current = false;
      setEncryptionSaving(false);
    }
  }

  function saveArchivePassphraseFromEditing(passphrase: string) {
    if (encryptionDraft.scope === "archive" && passphrase.trim()) {
      void saveArchiveEncryption(passphrase);
    }
  }

  async function probeQwenModel() {
    setQwenProbeRunning(true);
    setQwenProbeStatus("Checking Qwen local model...");

    try {
      const store = new ExpoDocumentLocalModelAssetStore(QWEN_2_5_0_5B_ASSET_MANIFEST);
      const availability = await checkLocalModelAvailability(QWEN_2_5_0_5B_ASSET_MANIFEST, store);
      if (!availability.available) {
        const missing = missingLocalModelFileNames(availability).join(", ");
        setQwenProbeStatus(`Qwen fallback is active. Missing required file(s): ${missing}.`);
        return;
      }

      const startedAt = Date.now();
      const engine = await createQwenStructuredExtractionEngineFromAssets(store, loadQwenNativeRuntimeFromAssets);
      if (!engine) {
        setQwenProbeStatus("Qwen fallback is active. Required files were not resolved.");
        return;
      }

      const result = await engine.extract({ text: "In 2004 I visited Grandma in Queens." });
      const elapsedMs = Date.now() - startedAt;
      setQwenProbeStatus(
        `Qwen probe passed in ${elapsedMs} ms with ${result.dates.length} date(s), ${result.tags.length} tag(s), and ${result.emotionalTone.length} tone label(s).`
      );
    } catch (error) {
      setQwenProbeStatus(error instanceof Error ? `Qwen probe failed: ${error.message}` : "Qwen probe failed.");
    } finally {
      setQwenProbeRunning(false);
    }
  }

  async function probeBgeModel() {
    setBgeProbeRunning(true);
    setBgeProbeStatus("Checking BGE local model...");

    try {
      const store = new ExpoDocumentLocalModelAssetStore(BGE_SMALL_EN_V15_ASSET_MANIFEST);
      const availability = await checkLocalModelAvailability(BGE_SMALL_EN_V15_ASSET_MANIFEST, store);
      if (!availability.available) {
        const missing = missingLocalModelFileNames(availability).join(", ");
        setBgeProbeStatus(`BGE hash fallback is active. Missing required file(s): ${missing}.`);
        return;
      }

      const startedAt = Date.now();
      const engine = await createBgeEmbeddingEngineFromAssets(store, loadBgeRuntimeOptionsFromAssets);
      if (!engine) {
        setBgeProbeStatus("BGE hash fallback is active. Required files were not resolved.");
        return;
      }

      const embedding = await engine.embedText("Grandma's apartment in Queens");
      if (!embedding) {
        setBgeProbeStatus("BGE probe failed: no embedding vector was returned.");
        return;
      }
      const elapsedMs = Date.now() - startedAt;
      const magnitude = Math.sqrt(embedding.values.reduce((total, value) => total + value * value, 0));
      setBgeProbeStatus(
        `BGE probe passed in ${elapsedMs} ms with ${embedding.values.length} dimensions and vector norm ${magnitude.toFixed(3)}.`
      );
    } catch (error) {
      setBgeProbeStatus(error instanceof Error ? `BGE probe failed: ${error.message}` : "BGE probe failed.");
    } finally {
      setBgeProbeRunning(false);
    }
  }

  async function importLocalModels() {
    setLocalModelImportRunning(true);
    setLocalModelImportStatus(undefined);
    try {
      const result = await props.onImportLocalModels();
      if (result.imported.length === 0 && result.ignoredFileNames.length === 0) {
        setLocalModelImportStatus("No model files selected.");
        return;
      }
      const importedText =
        result.imported.length > 0
          ? `Imported ${result.imported.length} file(s): ${result.imported.map((file) => file.fileName).join(", ")}.`
          : "No recognized model files were imported.";
      const ignoredText =
        result.ignoredFileNames.length > 0 ? ` Ignored unrecognized file(s): ${result.ignoredFileNames.join(", ")}.` : "";
      setLocalModelImportStatus(`${importedText}${ignoredText}`);
    } catch (error) {
      setLocalModelImportStatus(error instanceof Error ? `Model import failed: ${error.message}` : "Model import failed.");
    } finally {
      setLocalModelImportRunning(false);
    }
  }

  function clearArchiveAutoSaveTimer() {
    if (archiveAutoSaveTimerRef.current) {
      clearTimeout(archiveAutoSaveTimerRef.current);
      archiveAutoSaveTimerRef.current = undefined;
    }
  }

  function updateArchivePassphrase(passphrase: string) {
    setArchivePassphrase(passphrase);
    clearArchiveAutoSaveTimer();
    const trimmedPassphrase = passphrase.trim();
    if (!trimmedPassphrase || archiveAutoSavePassphraseRef.current === trimmedPassphrase) return;
    archiveAutoSaveTimerRef.current = setTimeout(() => {
      archiveAutoSavePassphraseRef.current = trimmedPassphrase;
      void saveArchiveEncryption(passphrase);
    }, 900);
  }

  function selectEncryptionScope(scope: EncryptionScope) {
    if (scope !== "archive") {
      setArchivePassphrase("");
      archiveAutoSavePassphraseRef.current = undefined;
      clearArchiveAutoSaveTimer();
      setArchivePassphraseDialogVisible(false);
    }
    setEncryptionDraft((current) => ({
      ...current,
      scope,
      keySource: scope === "disabled" ? "none" : current.keySource === "none" ? "user_passphrase" : current.keySource
    }));
    if (scope === "archive") {
      archiveAutoSavePassphraseRef.current = undefined;
      clearArchiveAutoSaveTimer();
      setArchivePassphraseDialogVisible(true);
    }
  }

  function selectEncryptionKeySource(keySource: EncryptionKeySource) {
    if (keySource !== "user_passphrase") {
      setArchivePassphrase("");
      archiveAutoSavePassphraseRef.current = undefined;
      clearArchiveAutoSaveTimer();
      setArchivePassphraseDialogVisible(false);
    }
    setEncryptionDraft((current) => ({ ...current, keySource }));
    if (encryptionDraft.scope === "archive" && keySource === "user_passphrase") {
      archiveAutoSavePassphraseRef.current = undefined;
      clearArchiveAutoSaveTimer();
      setArchivePassphraseDialogVisible(true);
    }
  }

  function cancelArchivePassphraseDialog() {
    if (encryptionSaving) return;
    archiveAutoSavePassphraseRef.current = undefined;
    clearArchiveAutoSaveTimer();
    setArchivePassphrase("");
    setArchivePassphraseDialogVisible(false);
  }

  async function sharePossiblyEncrypted(artifact: ExportArtifact) {
    try {
      if (!encryptedExportsEnabled) {
        await shareExportArtifact(artifact);
        return;
      }

      if (props.encryptionSettings.keySource !== "user_passphrase") {
        setPortabilityError("Encrypted export requires a user passphrase key source.");
        return;
      }

      const envelope = await encryptionProvider.encryptText(artifact.content, exportPassphrase, {
        fileName: artifact.fileName,
        mediaType: artifact.mediaType
      });
      await shareExportArtifact({
        fileName: `${artifact.fileName}.encrypted.json`,
        mediaType: "application/json",
        content: JSON.stringify(envelope, null, 2)
      });
    } catch (error) {
      setPortabilityError(error instanceof Error ? error.message : "Encrypted export failed.");
    }
  }

  async function syncEncryptedBackup() {
    setPortabilityError(undefined);
    setBackupStatus(undefined);
    if (!backupPassphrase.trim()) {
      setPortabilityError("A backup passphrase is required.");
      return;
    }

    try {
      const provider = createMobileEncryptionProvider();
      await provider.saveSettings({
        scope: "archive",
        keySource: "user_passphrase",
        requireUnlockForExport: true
      });
      const backupArchive = new EncryptedArchiveAtRestAdapter(new AsyncStorageArchiveAtRestRecordStore(), provider, {
        async getPassphrase() {
          return backupPassphrase;
        }
      });
      const sync = new EncryptedBackupSyncProvider({
        async getLocalArchive() {
          return props.archive;
        },
        saveLocalArchive: props.onArchiveChange,
        backupArchive
      });
      const result = await sync.sync();
      if (result.conflicts.length > 0) {
        setPortabilityError(result.conflicts.map((conflict) => conflict.summary).join(" "));
        return;
      }
      setBackupStatus(`Encrypted backup synced. Pushed ${result.pushedCount}, pulled ${result.pulledCount}.`);
      setBackupPassphrase("");
    } catch (error) {
      setPortabilityError(error instanceof Error ? error.message : "Encrypted backup sync failed.");
    }
  }

  async function syncWebDav() {
    setPortabilityError(undefined);
    setWebDavStatus(undefined);
    if (!webDavUrl.trim() || !webDavPassphrase.trim()) {
      setPortabilityError("WebDAV URL and sync passphrase are required.");
      return;
    }

    try {
      const provider = createMobileEncryptionProvider();
      await provider.saveSettings({
        scope: "archive",
        keySource: "user_passphrase",
        requireUnlockForExport: true
      });
      const sync = new WebDAVSyncProvider({
        async getLocalArchive() {
          return props.archive;
        },
        saveLocalArchive: props.onArchiveChange,
        encryptionProvider: provider,
        url: webDavUrl.trim(),
        username: webDavUsername,
        password: webDavPassword,
        passphrase: webDavPassphrase
      });
      const result = await sync.sync();
      if (result.conflicts.length > 0) {
        setPortabilityError(result.conflicts.map((conflict) => conflict.summary).join(" "));
        return;
      }
      setWebDavStatus(`WebDAV sync complete. Pushed ${result.pushedCount}, pulled ${result.pulledCount}.`);
      setWebDavPassword("");
      setWebDavPassphrase("");
    } catch (error) {
      setPortabilityError(error instanceof Error ? error.message : "WebDAV sync failed.");
    }
  }

  async function shareJson() {
    setPortabilityError(undefined);
    const [artifact] = await new JsonExportProvider().exportArchive(props.archive);
    if (artifact) await sharePossiblyEncrypted(artifact);
  }

  async function shareMarkdown() {
    setPortabilityError(undefined);
    const artifacts = await new MarkdownExportProvider().exportArchive(props.archive);
    await sharePossiblyEncrypted(combineMarkdownArtifacts(artifacts));
  }

  async function shareMarkdownBundle() {
    setPortabilityError(undefined);
    const artifacts = await new MarkdownBundleExportProvider().exportArchive(props.archive);
    await sharePossiblyEncrypted(combineBundleArtifacts(artifacts));
  }

  async function shareSqlite() {
    setPortabilityError(undefined);
    const [artifact] = await new SqliteExportProvider().exportArchive(props.archive);
    if (artifact) await sharePossiblyEncrypted(artifact);
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
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
      <SettingsSection title="Privacy" description="Memory text stays local unless you explicitly export it.">
        <Text style={styles.panelTitle}>Local state</Text>
        <Text style={styles.metadata}>A quick map of what can leave this device.</Text>
        <View style={styles.trustGrid}>
          <TrustItem label="Storage" value="this device" />
          <TrustItem label="Cloud sync" value="off" />
          <TrustItem label="Cloud AI" value="off" />
          <TrustItem label="Suggestions" value={structuredExtractionModeLabel(props.structuredExtractionMode)} />
          <TrustItem label="Nearby search" value={embeddingEngineModeLabel(props.embeddingEngineMode)} />
          <TrustItem label="Audio" value="optional" />
        </View>
      </SettingsSection>

      <SettingsSection title="Appearance" description="Choose the archive light you want around the memories.">
        <Text style={styles.panelTitle}>Archive light</Text>
        <Text style={styles.metadata}>Mode: {props.appearanceMode}</Text>
        <View style={styles.tags}>
          {(["light", "dark"] as AppearanceMode[]).map((mode) => (
            <FilterChip
              key={mode}
              label={mode}
              selected={props.appearanceMode === mode}
              onPress={() => void props.onAppearanceModeChange(mode)}
            />
          ))}
        </View>
      </SettingsSection>

      <SettingsSection title="Life Calendar" description="Local context for age, grade, and year suggestions.">
        <Text style={styles.panelTitle}>Birthday and school years</Text>
        <Text style={styles.metadata}>
          Age, grade, and calendar year stay interchangeable as suggestions. Memory text is not rewritten.
        </Text>
        <View style={styles.dateInputs}>
          <LabeledSettingsInput label="Your birth year" hint="Example: 1985">
            <TextInput
              value={birthYearDraft}
              onChangeText={setBirthYearDraft}
              placeholder="YYYY"
              placeholderTextColor="#7b8178"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Your birth year"
              style={[styles.dateInput, styles.labeledDateInput]}
            />
          </LabeledSettingsInput>
          <LabeledSettingsInput label="Your birth month" hint="1 through 12">
            <TextInput
              value={birthMonthDraft}
              onChangeText={setBirthMonthDraft}
              placeholder="MM"
              placeholderTextColor="#7b8178"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Your birth month"
              style={[styles.dateInput, styles.labeledDateInput]}
            />
          </LabeledSettingsInput>
          <LabeledSettingsInput label="Your birth day" hint="Day of month">
            <TextInput
              value={birthDayDraft}
              onChangeText={setBirthDayDraft}
              placeholder="DD"
              placeholderTextColor="#7b8178"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Your birth day"
              style={[styles.dateInput, styles.labeledDateInput]}
            />
          </LabeledSettingsInput>
        </View>
        <View style={styles.dateInputs}>
          <LabeledSettingsInput label="Month school year starts" hint="8 = August, 9 = September">
            <TextInput
              value={schoolYearStartMonthDraft}
              onChangeText={setSchoolYearStartMonthDraft}
              placeholder="1-12"
              placeholderTextColor="#7b8178"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Month school year starts"
              style={[styles.dateInput, styles.labeledDateInput]}
            />
          </LabeledSettingsInput>
          <LabeledSettingsInput label="Age at kindergarten start" hint="Usually 5 or 6">
            <TextInput
              value={kindergartenStartAgeDraft}
              onChangeText={setKindergartenStartAgeDraft}
              placeholder="Age"
              placeholderTextColor="#7b8178"
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Age at kindergarten start"
              style={[styles.dateInput, styles.labeledDateInput]}
            />
          </LabeledSettingsInput>
        </View>
        <Text style={styles.metadata}>{lifeCalendarPreview}</Text>
        <View style={styles.actionRow}>
          <PrimaryButton label="Save life calendar" onPress={saveLifeCalendarSettings} icon={<Save size={18} />} />
          <SecondaryButton label="Clear" onPress={clearLifeCalendarSettings} icon={<X size={18} />} />
        </View>
        {lifeCalendarStatus ? <Text style={styles.metadata}>{lifeCalendarStatus}</Text> : null}
      </SettingsSection>

      <SettingsSection title="Storage" description="Counts and estimates for the local archive.">
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
      </SettingsSection>

      <SettingsSection title="Local Processing" description="Rules, nearby search, and diagnostics that run on this device.">
        <Text style={styles.panelTitle}>Structured extraction</Text>
        <Text style={styles.metadata}>Mode: {structuredExtractionModeLabel(props.structuredExtractionMode)}</Text>
        <View style={styles.tags}>
          {(["none", "rules", "qwen2.5-0.5b"] as StructuredExtractionMode[]).map((mode) => (
            <FilterChip
              key={mode}
              label={structuredExtractionModeLabel(mode)}
              selected={props.structuredExtractionMode === mode}
              onPress={() => void props.onStructuredExtractionModeChange(mode)}
            />
          ))}
        </View>
        {props.structuredExtractionMode === "qwen2.5-0.5b" ? (
          <Text style={styles.metadata}>{localModelModeStatus(props.localModelAvailability, QWEN_2_5_0_5B_ASSET_MANIFEST.id)}</Text>
        ) : null}
        <View style={styles.actionRow}>
          <SecondaryButton
            label={qwenProbeRunning ? "Testing Qwen..." : "Test Qwen"}
            onPress={probeQwenModel}
            disabled={qwenProbeRunning}
            icon={<Wand2 size={18} />}
          />
        </View>
        {qwenProbeStatus ? <Text style={styles.metadata}>{qwenProbeStatus}</Text> : null}
        <View style={styles.settingsDivider} />
        <Text style={styles.panelTitle}>Embedding engine</Text>
        <Text style={styles.metadata}>Mode: {embeddingEngineModeLabel(props.embeddingEngineMode)}</Text>
        <View style={styles.tags}>
          {(["hash", "bge-small-en-v1.5"] as EmbeddingEngineMode[]).map((mode) => (
            <FilterChip
              key={mode}
              label={embeddingEngineModeLabel(mode)}
              selected={props.embeddingEngineMode === mode}
              onPress={() => void props.onEmbeddingEngineModeChange(mode)}
            />
          ))}
        </View>
        {props.embeddingEngineMode === "bge-small-en-v1.5" ? (
          <Text style={styles.metadata}>
            {localModelModeStatus(
              props.localModelAvailability,
              BGE_SMALL_EN_V15_ASSET_MANIFEST.id,
              "BGE will use the local ONNX engine when runtime loading succeeds; hash fallback remains available."
            )}
          </Text>
        ) : null}
        <View style={styles.actionRow}>
          <SecondaryButton
            label={bgeProbeRunning ? "Testing BGE..." : "Test BGE"}
            onPress={probeBgeModel}
            disabled={bgeProbeRunning}
            icon={<Search size={18} />}
          />
        </View>
        {bgeProbeStatus ? <Text style={styles.metadata}>{bgeProbeStatus}</Text> : null}
        <View style={styles.settingsDivider} />
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
        <View style={styles.settingsDivider} />
        <Text style={styles.panelTitle}>Local model assets</Text>
        <Text style={styles.metadata}>
          Model files are optional, app-data scoped, and never downloaded automatically. Import them again after clearing app data.
        </Text>
        <View style={styles.modelAssetList}>
          {props.localModelAvailability.map((availability) => (
            <View key={availability.manifest.id} style={styles.modelAssetRow}>
              <View style={styles.modelAssetText}>
                <Text style={styles.modelAssetTitle}>{availability.manifest.displayName}</Text>
                <Text style={styles.metadata}>
                  {availability.available
                    ? `ready in ${localModelDirectoryHint(availability.manifest)}`
                    : availability.invalidAssetIds.length > 0
                      ? `unexpected file size in ${localModelDirectoryHint(availability.manifest)}`
                    : `missing ${availability.missingAssetIds.length} required file(s) in ${localModelDirectoryHint(
                        availability.manifest
                      )}`}
                </Text>
                {availability.assetProblems.map((problem) => (
                  <Text key={`${availability.manifest.id}-${problem.assetId}`} style={styles.metadata}>
                    {problem.fileName}: {problem.problem}
                  </Text>
                ))}
              </View>
              <Text style={[styles.statusPill, availability.available ? styles.statusPillSuccess : styles.statusPillMuted]}>
                {availability.available ? "ready" : "fallback"}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.actionRow}>
          <SecondaryButton
            label={localModelImportRunning ? "Importing..." : "Import model files"}
            onPress={() => void importLocalModels()}
            disabled={localModelImportRunning}
            icon={<Download size={18} />}
          />
          <SecondaryButton label="Refresh model files" onPress={props.onRefreshLocalModels} icon={<RotateCcw size={18} />} />
        </View>
        {localModelImportStatus ? <Text style={styles.metadata}>{localModelImportStatus}</Text> : null}
      </SettingsSection>
      <View style={styles.diagnosticsPanel}>
        <Text style={styles.sectionEyebrow}>Advanced diagnostics</Text>
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

      <SettingsSection title="Security" description="App lock and encryption controls.">
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
                autoCapitalize="none"
                autoCorrect={false}
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
        <View style={styles.settingsDivider} />
        <Text style={styles.panelTitle}>Encryption</Text>
        <Text style={styles.metadata}>Provider: Web Crypto encrypted exports and archive adapter</Text>
        <Text style={styles.metadata}>
          Status: encrypted exports are available when scope is exports or archive and key source is user passphrase. Archive-at-rest
          encryption now writes an encrypted local archive, clears plaintext primary storage, and requires the archive passphrase after restart.
        </Text>
        <View style={styles.filterSection}>
          <Text style={styles.metadata}>Scope</Text>
          <View style={styles.tags}>
            {(["disabled", "exports", "archive"] as EncryptionScope[]).map((scope) => (
              <FilterChip
                key={scope}
                label={scope}
                selected={encryptionDraft.scope === scope}
                onPress={() => selectEncryptionScope(scope)}
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
                onPress={() => selectEncryptionKeySource(keySource)}
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
        {archiveAtRestRequested ? (
          <>
            <SecondaryButton
              label="Enter archive passphrase"
              onPress={() => setArchivePassphraseDialogVisible(true)}
              disabled={encryptionSaving}
              icon={<Lock size={18} />}
            />
            <Text style={styles.metadata}>The passphrase is used now to migrate the current archive and is not stored.</Text>
          </>
        ) : (
          <SecondaryButton
            label={encryptionSaving ? "Saving encryption options" : "Save encryption options"}
            onPress={saveEncryptionOptions}
            disabled={encryptionSaving}
            icon={<Save size={18} />}
          />
        )}
        {encryptionStatusMessage ? <Text style={styles.metadata}>{encryptionStatusMessage}</Text> : null}
      </SettingsSection>

      <SettingsSectionHeader title="Export and Import" description="Portable archive files you control." />
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Encrypted local backup</Text>
        <Text style={styles.metadata}>
          Stores an encrypted archive snapshot in this app's local storage. The passphrase is used for this backup and is not stored.
        </Text>
        <TextInput
          value={backupPassphrase}
          onChangeText={setBackupPassphrase}
          placeholder="Backup passphrase"
          placeholderTextColor="#7b8178"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.tagInput}
        />
        <SecondaryButton label="Sync encrypted backup" onPress={syncEncryptedBackup} disabled={!backupPassphrase.trim()} icon={<Lock size={18} />} />
        {backupStatus ? <Text style={styles.metadata}>{backupStatus}</Text> : null}
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>WebDAV encrypted sync</Text>
        <Text style={styles.metadata}>
          Sends an encrypted archive record to a WebDAV URL you control. URL, credentials, and passphrase are used for this sync and are not stored.
        </Text>
        <TextInput
          value={webDavUrl}
          onChangeText={setWebDavUrl}
          placeholder="https://server.example/path/memory-palace.json"
          placeholderTextColor="#7b8178"
          autoCapitalize="none"
          style={styles.tagInput}
        />
        <View style={styles.dateInputs}>
          <TextInput
            value={webDavUsername}
            onChangeText={setWebDavUsername}
            placeholder="Username"
            placeholderTextColor="#7b8178"
            autoCapitalize="none"
            style={styles.dateInput}
          />
          <TextInput
            value={webDavPassword}
            onChangeText={setWebDavPassword}
            placeholder="Password"
            placeholderTextColor="#7b8178"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.dateInput}
          />
        </View>
        <TextInput
          value={webDavPassphrase}
          onChangeText={setWebDavPassphrase}
          placeholder="Sync encryption passphrase"
          placeholderTextColor="#7b8178"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.tagInput}
        />
        <SecondaryButton
          label="Sync WebDAV"
          onPress={syncWebDav}
          disabled={!webDavUrl.trim() || !webDavPassphrase.trim()}
          icon={<Lock size={18} />}
        />
        {webDavStatus ? <Text style={styles.metadata}>{webDavStatus}</Text> : null}
      </View>
      <View style={styles.filterPanel}>
        <Text style={styles.panelTitle}>Export archive</Text>
        {encryptedExportsEnabled ? (
          <>
            <Text style={styles.metadata}>Encrypted exports are on. The passphrase is used only for this export and is not stored.</Text>
            <TextInput
              value={exportPassphrase}
              onChangeText={setExportPassphrase}
              placeholder="Export passphrase"
              placeholderTextColor="#7b8178"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.tagInput}
            />
          </>
        ) : (
          <Text style={styles.metadata}>Exports are shared as plain JSON, Markdown, or SQL files.</Text>
        )}
        <View style={styles.actionRow}>
          <PrimaryButton label="JSON" onPress={shareJson} disabled={exportBlocked} icon={<Download size={18} />} />
          <SecondaryButton label="Markdown" onPress={shareMarkdown} disabled={exportBlocked} icon={<Download size={18} />} />
          <SecondaryButton label="Markdown bundle" onPress={shareMarkdownBundle} disabled={exportBlocked} icon={<Download size={18} />} />
          <SecondaryButton label="SQLite SQL" onPress={shareSqlite} disabled={exportBlocked} icon={<Download size={18} />} />
          <SecondaryButton label="Import" onPress={previewImport} icon={<Download size={18} />} />
        </View>
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
      <SettingsSectionHeader title="Storage Cleanup" description="Deleted memories and retained artifacts." />
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
      <Modal
        animationType="fade"
        transparent
        visible={archivePassphraseDialogVisible}
        onRequestClose={cancelArchivePassphraseDialog}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.panelTitle}>Archive passphrase</Text>
            <Text style={styles.metadata}>
              This passphrase encrypts the local archive now and is required after relaunch.
            </Text>
            <TextInput
              value={archivePassphrase}
              onChangeText={updateArchivePassphrase}
              placeholder="Archive passphrase"
              placeholderTextColor="#7b8178"
              secureTextEntry={Platform.OS !== "android"}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={(event) => void saveArchiveEncryption(event.nativeEvent.text)}
              onEndEditing={(event) => {
                saveArchivePassphraseFromEditing(event.nativeEvent.text);
              }}
              style={styles.tagInput}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={cancelArchivePassphraseDialog} disabled={encryptionSaving} />
              <Button
                title={encryptionSaving ? "Saving..." : "Save archive encryption"}
                onPress={() => void saveArchiveEncryption()}
                disabled={archiveSaveDisabled}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

type LifeCalendarDraftFields = {
  existingProfile: UserProfile | undefined;
  birthYearDraft: string;
  birthMonthDraft: string;
  birthDayDraft: string;
  schoolYearStartMonthDraft: string;
  kindergartenStartAgeDraft: string;
};

function buildLifeCalendarDraftProfile(fields: LifeCalendarDraftFields): UserProfile | undefined {
  const parsed = parseLifeCalendarDraft(fields, { allowIncompleteBirthday: true });
  return "error" in parsed ? fields.existingProfile : parsed.userProfile;
}

function parseLifeCalendarDraft(
  fields: LifeCalendarDraftFields,
  options: { allowIncompleteBirthday?: boolean } = {}
): { userProfile: UserProfile | undefined } | { error: string } {
  const birthYear = parseOptionalNumber(fields.birthYearDraft);
  const birthMonth = parseOptionalNumber(fields.birthMonthDraft);
  const birthDay = parseOptionalNumber(fields.birthDayDraft);
  const schoolYearStartMonth = parseOptionalNumber(fields.schoolYearStartMonthDraft);
  const kindergartenStartAge = parseOptionalNumber(fields.kindergartenStartAgeDraft);
  const currentYear = new Date().getFullYear();

  if ([birthYear, birthMonth, birthDay, schoolYearStartMonth, kindergartenStartAge].some((value) => Number.isNaN(value))) {
    return { error: "Life calendar fields must use whole numbers." };
  }
  if (birthYear !== undefined && (birthYear < 1900 || birthYear > currentYear)) {
    return { error: `Birth year must be between 1900 and ${currentYear}.` };
  }
  if (birthMonth !== undefined && (birthMonth < 1 || birthMonth > 12)) return { error: "Birth month must be 1 through 12." };
  if (birthDay !== undefined && (birthDay < 1 || birthDay > 31)) return { error: "Birth day must be 1 through 31." };
  if (!options.allowIncompleteBirthday && ((birthMonth === undefined) !== (birthDay === undefined))) {
    return { error: "Birth month and birth day must be saved together, or both left blank." };
  }
  if (birthYear !== undefined && birthMonth !== undefined && birthDay !== undefined) {
    const maxDay = new Date(Date.UTC(birthYear, birthMonth, 0)).getUTCDate();
    if (birthDay > maxDay) return { error: "Birth day does not exist in that birth month." };
  }
  if (schoolYearStartMonth !== undefined && (schoolYearStartMonth < 1 || schoolYearStartMonth > 12)) {
    return { error: "School start month must be 1 through 12." };
  }
  if (kindergartenStartAge !== undefined && (kindergartenStartAge < 4 || kindergartenStartAge > 7)) {
    return { error: "Kindergarten start age must be 4 through 7." };
  }

  const userProfile: UserProfile = { id: fields.existingProfile?.id ?? "default" };
  if (fields.existingProfile?.preferredDatePrecision) userProfile.preferredDatePrecision = fields.existingProfile.preferredDatePrecision;
  if (fields.existingProfile?.allowInferredDates !== undefined) userProfile.allowInferredDates = fields.existingProfile.allowInferredDates;
  if (fields.existingProfile?.allowEmotionDetection !== undefined) {
    userProfile.allowEmotionDetection = fields.existingProfile.allowEmotionDetection;
  }
  if (fields.existingProfile?.allowAudioRetention !== undefined) userProfile.allowAudioRetention = fields.existingProfile.allowAudioRetention;
  if (birthYear !== undefined) userProfile.birthYear = birthYear;
  if (birthMonth !== undefined) userProfile.birthMonth = birthMonth;
  if (birthDay !== undefined) userProfile.birthDay = birthDay;
  if (schoolYearStartMonth !== undefined) userProfile.schoolYearStartMonth = schoolYearStartMonth;
  if (kindergartenStartAge !== undefined) userProfile.kindergartenStartAge = kindergartenStartAge;

  return { userProfile: hasUserProfileValues(userProfile) ? userProfile : undefined };
}

function hasUserProfileValues(profile?: UserProfile): boolean {
  return Boolean(
    profile?.birthYear ||
      profile?.birthMonth ||
      profile?.birthDay ||
      profile?.schoolYearStartMonth ||
      profile?.kindergartenStartAge ||
      profile?.preferredDatePrecision ||
      profile?.allowInferredDates !== undefined ||
      profile?.allowEmotionDetection !== undefined ||
      profile?.allowAudioRetention !== undefined
  );
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function formatOptionalNumber(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function Stat(props: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{props.value}</Text>
      <Text style={styles.statLabel}>{props.label}</Text>
    </View>
  );
}

function TrustItem(props: { label: string; value: string }) {
  return (
    <View style={styles.trustItem}>
      <Text style={styles.sectionEyebrow}>{props.label}</Text>
      <Text style={styles.trustValue}>{props.value}</Text>
    </View>
  );
}

function SettingsSectionHeader(props: { title: string; description: string }) {
  return (
    <View style={styles.settingsSectionHeader}>
      <Text style={styles.settingsSectionTitle}>{props.title}</Text>
      <Text style={styles.metadata}>{props.description}</Text>
    </View>
  );
}

function SettingsSection(props: { title: string; description: string; children: ReactNode }) {
  return (
    <View style={styles.settingsSection}>
      <SettingsSectionHeader title={props.title} description={props.description} />
      <View style={styles.settingsSectionBody}>{props.children}</View>
    </View>
  );
}

function LabeledSettingsInput(props: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.labeledInput}>
      <Text style={styles.inputLabel}>{props.label}</Text>
      {props.children}
      {props.hint ? <Text style={styles.inputHint}>{props.hint}</Text> : null}
    </View>
  );
}

function TagRow(props: { labels: string[] }) {
  if (props.labels.length === 0) return null;
  return (
    <View style={styles.tags}>
      {props.labels.map((label) => <TagPill key={label} label={label} />)}
    </View>
  );
}

function ThemeClusterCard(props: { shelf: ThemeShelf; onOpen: () => void }) {
  return (
    <View style={styles.themeShelf}>
      <View style={styles.constellationHeader}>
        <View style={styles.detailTitleBlock}>
          <Text style={styles.sectionEyebrow}>{themeTypeLabel(props.shelf.tag.type)}</Text>
          <Text style={styles.memoryTitle}>{props.shelf.tag.name}</Text>
          <Text style={styles.metadata}>
            {props.shelf.memories.length} {props.shelf.memories.length === 1 ? "memory" : "memories"}
          </Text>
        </View>
        <SecondaryButton label="Open" onPress={props.onOpen} icon={<Search size={18} />} />
      </View>
      <View style={styles.constellationSection}>
        <Text style={styles.sectionEyebrow}>Appears with</Text>
        {props.shelf.relatedTags.length > 0 ? <TagRow labels={props.shelf.relatedTags} /> : <Text style={styles.metadata}>No nearby tags yet.</Text>}
      </View>
      <View style={styles.constellationSection}>
        <Text style={styles.sectionEyebrow}>Memories</Text>
        {props.shelf.memories.slice(0, 3).map((memory) => (
          <Pressable key={memory.id} style={styles.themeMemory} onPress={props.onOpen}>
            <Text style={styles.memoryPreview} numberOfLines={2}>
              {memory.title ?? memory.rawText}
            </Text>
            <ConnectionReason label="Connected by" reason={props.shelf.tag.name} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TagPill(props: { label: string; selected?: boolean; onPress?: () => void }) {
  const label = <Text style={[styles.tagLabel, props.selected ? styles.tagLabelSelected : null]}>{props.label}</Text>;
  if (props.onPress) {
    return (
      <Pressable onPress={props.onPress} style={[styles.tag, props.selected ? styles.tagSelected : null]}>
        {label}
      </Pressable>
    );
  }
  return <View style={styles.tag}>{label}</View>;
}

function Card(props: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (props.onPress) {
    return (
      <Pressable style={[styles.card, props.style]} onPress={props.onPress}>
        {props.children}
      </Pressable>
    );
  }
  return <View style={[styles.card, props.style]}>{props.children}</View>;
}

function MemoryCard(props: { memory: Memory; onPress: () => void; children: ReactNode }) {
  return (
    <Card style={styles.memoryCard} onPress={props.onPress}>
      <View style={styles.memoryCardHeader}>
        <Text style={styles.memoryCardTitle}>{props.memory.title}</Text>
        <DateCertaintyLabel memory={props.memory} />
      </View>
      {props.children}
    </Card>
  );
}

function DateCertaintyLabel(props: { memory: Memory }) {
  return <Text style={styles.timelineBadge}>{formatDateCertaintyLabel(props.memory)}</Text>;
}

function ConnectionReason(props: { label: string; reason: string }) {
  return (
    <Text style={styles.connectionReason}>
      {props.label}: {props.reason}
    </Text>
  );
}

function IconButton(props: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  const iconColor = props.danger ? "#9a3d2f" : props.active ? styles.iconButtonActiveIcon.color : styles.iconButtonIcon.color;
  return (
    <Pressable
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={[styles.iconButton, props.active ? styles.iconButtonActive : null, props.danger ? styles.iconButtonDanger : null]}
    >
      {renderIcon(props.icon, iconColor)}
    </Pressable>
  );
}

function PrimaryButton(props: { label: string; icon: ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={props.onPress} disabled={props.disabled} style={[styles.primaryButton, props.disabled ? styles.disabled : null]}>
      {renderIcon(props.icon, styles.primaryButtonIcon.color)}
      <Text style={styles.primaryButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function SecondaryButton(props: { label: string; icon: ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={props.onPress} disabled={props.disabled} style={[styles.secondaryButton, props.disabled ? styles.disabled : null]}>
      {renderIcon(props.icon, styles.secondaryButtonIcon.color)}
      <Text style={styles.secondaryButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function renderIcon(icon: ReactNode, color: string): ReactNode {
  return isValidElement(icon) ? cloneElement(icon as ReactElement<{ color?: string }>, { color }) : icon;
}

function PathBackButton(props: { onPress: () => void }) {
  return <BreadcrumbTrail trail={["Explore"]} actionLabel="Back to Explore" onPress={props.onPress} />;
}

function BreadcrumbTrail(props: { trail: string[]; actionLabel: string; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={styles.pathBackButton}>
      <ArrowLeft size={18} color={styles.pathBackText.color} />
      <Text style={styles.pathBackText}>{props.trail.length > 1 ? props.trail.join(" / ") : props.actionLabel}</Text>
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

function formatDateCertaintyLabel(memory: Memory): string {
  if (!memory.approximateStartDate && !memory.approximateEndDate) return "unknown date";
  if (memory.approximateStartDate && memory.approximateEndDate) {
    return memory.userDateConfirmed ? "confirmed range" : "possible range";
  }
  return memory.userDateConfirmed ? "confirmed date" : "possible date";
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

const theme = lightTheme;

const lightStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 960,
    alignSelf: "center"
  },
  shellWide: {
    maxWidth: 1120
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  loadingText: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.body.fontSize
  },
  lockScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xxl,
    gap: theme.spacing.lg - 2
  },
  header: {
    minHeight: 76,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.navBorder,
    backgroundColor: theme.colors.shellSurface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  bottomNav: {
    minHeight: 74,
    borderTopWidth: 1,
    borderTopColor: theme.colors.navBorder,
    backgroundColor: theme.colors.shellSurface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 10
  },
  navButton: {
    minWidth: 72,
    minHeight: 50,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  navButtonActive: {
    backgroundColor: theme.colors.accentSoft
  },
  navIcon: {
    color: theme.colors.mutedText
  },
  navIconActive: {
    color: theme.colors.primaryText
  },
  navLabel: {
    color: theme.colors.mutedText,
    ...theme.typography.nav
  },
  navLabelActive: {
    color: theme.colors.primaryText
  },
  captureButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primaryText,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
  },
  captureButtonIcon: {
    color: theme.colors.accentText
  },
  pathBackButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.shellSurface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 9,
    gap: 7
  },
  pathBackText: {
    color: theme.colors.connectionText,
    fontSize: theme.typography.metadata.fontSize,
    fontWeight: "700"
  },
  brand: {
    color: theme.colors.primaryText,
    ...theme.typography.brand
  },
  subtle: {
    marginTop: 2,
    color: theme.colors.mutedText,
    fontSize: theme.typography.metadata.fontSize
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  content: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg
  },
  exploreWideContent: {
    paddingHorizontal: 22
  },
  exploreWideGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18
  },
  explorePrimaryPane: {
    flex: 1.6,
    minWidth: 0,
    gap: 16
  },
  exploreSecondaryPane: {
    flex: 1,
    minWidth: 280,
    gap: 16
  },
  capturePanel: {
    borderWidth: 1,
    borderColor: theme.colors.warmBorder,
    backgroundColor: theme.colors.paper,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    shadowColor: "#4a3d2f",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }
  },
  saveNotice: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "#cfd8c8",
    backgroundColor: "#f4f8f0",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  saveNoticeText: {
    color: "#263323",
    fontSize: 14,
    fontWeight: "800"
  },
  captureEyebrow: {
    color: "#7b604f",
    ...theme.typography.label,
    textTransform: "uppercase"
  },
  capturePrompt: {
    color: theme.colors.primaryText,
    ...theme.typography.screenTitle
  },
  captureNote: {
    color: "#6c6257",
    fontSize: 14,
    lineHeight: 21
  },
  newMemoryContent: {
    justifyContent: "center",
    minHeight: 560
  },
  newMemoryInput: {
    minHeight: 300,
    borderWidth: 1,
    borderColor: "#dacbb8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    color: "#252925",
    fontSize: 17,
    lineHeight: 26,
    outlineStyle: "none" as never
  },
  captureActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10
  },
  voicePanel: {
    minHeight: 320,
    borderWidth: 1,
    borderColor: "#d4c7b4",
    backgroundColor: "#fffaf1",
    borderRadius: 8,
    padding: 20,
    gap: 14,
    alignItems: "center"
  },
  holdToSpeakButton: {
    minHeight: 54,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSage,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm
  },
  holdToSpeakButtonActive: {
    backgroundColor: "#6f8f65"
  },
  voiceTimer: {
    color: "#30352f",
    fontSize: 32,
    fontWeight: "800"
  },
  waveform: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 8
  },
  waveformBar: {
    width: 8,
    borderRadius: 8,
    backgroundColor: "#9fb28f"
  },
  transcriptPanel: {
    borderWidth: 1,
    borderColor: "#d4c7b4",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 16,
    gap: 12
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
  activeFilterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  removableChip: {
    minHeight: 34,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  removableChipLabel: {
    maxWidth: 260,
    flexShrink: 1
  },
  suggestionGroup: {
    gap: 7
  },
  suggestionChip: {
    minHeight: 36,
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "#d3d9ca",
    borderRadius: 8,
    backgroundColor: "#fffdf8",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6
  },
  suggestionCount: {
    color: "#6c7467",
    fontSize: 12,
    fontWeight: "800"
  },
  suggestionSnippet: {
    width: "100%",
    color: "#6c7467",
    fontSize: 12,
    lineHeight: 16
  },
  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  emptyTitle: {
    color: theme.colors.secondaryText,
    fontSize: 20,
    fontWeight: "700"
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14
  },
  memoryCard: {
    gap: theme.spacing.sm
  },
  memoryCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  memoryTitle: {
    color: theme.colors.primaryText,
    ...theme.typography.title
  },
  memoryCardTitle: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.primaryText,
    ...theme.typography.title
  },
  memoryPreview: {
    color: theme.colors.secondaryText,
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
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#dacbb8",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(21, 24, 20, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  modalPanel: {
    width: "100%",
    maxWidth: 440,
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 18,
    gap: 12
  },
  modalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 12
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
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  pathCardSage: {
    backgroundColor: "#f2f7ed",
    borderColor: "#cbd9c1"
  },
  pathCardClay: {
    backgroundColor: "#fbf1ea",
    borderColor: "#e4cdbd"
  },
  pathCardBlue: {
    backgroundColor: "#eef4f5",
    borderColor: "#c8d8dc"
  },
  pathCardPaper: {
    backgroundColor: "#fffdf8",
    borderColor: "#d8d4c8"
  },
  pathCardStone: {
    backgroundColor: "#f1f0eb",
    borderColor: "#d7d4cb"
  },
  pathIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  pathIconSage: {
    backgroundColor: "#dce8d4"
  },
  pathIconClay: {
    backgroundColor: "#efd8ca"
  },
  pathIconBlue: {
    backgroundColor: "#d8e5e8"
  },
  pathIconPaper: {
    backgroundColor: "#ece8dd"
  },
  pathIconStone: {
    backgroundColor: "#e2dfd5"
  },
  pathText: {
    flex: 1,
    minWidth: 0,
    gap: 2
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  constellationCard: {
    borderWidth: 1,
    borderColor: "#d7d0c1",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 16,
    gap: 14
  },
  chapterCard: {
    borderWidth: 1,
    borderColor: "#d7d0c1",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 16,
    gap: 14
  },
  constellationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  constellationStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8
  },
  constellationSection: {
    borderTopWidth: 1,
    borderTopColor: "#e6e0d3",
    paddingTop: 12,
    gap: 8
  },
  constellationMemory: {
    borderWidth: 1,
    borderColor: "#e0d8c9",
    backgroundColor: "#fffaf1",
    borderRadius: 8,
    padding: 12,
    gap: 5
  },
  chapterMemory: {
    borderWidth: 1,
    borderColor: "#e0d8c9",
    backgroundColor: "#fffaf1",
    borderRadius: 8,
    padding: 12,
    gap: 5
  },
  themeShelf: {
    borderWidth: 1,
    borderColor: "#d6d9c8",
    backgroundColor: "#f9fbf5",
    borderRadius: 8,
    padding: 16,
    gap: 14
  },
  themeMemory: {
    borderWidth: 1,
    borderColor: "#dfe5d5",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 12,
    gap: 5
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
  diagnosticsPanel: {
    borderWidth: 1,
    borderColor: "#cfd5ca",
    backgroundColor: "#f2f5ef",
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
  sectionEyebrow: {
    color: "#7b8178",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
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
  labeledInput: {
    minWidth: 180,
    flex: 1,
    gap: 6
  },
  inputLabel: {
    color: "#30352f",
    fontSize: 13,
    fontWeight: "800"
  },
  inputHint: {
    color: "#6f766c",
    fontSize: 12,
    lineHeight: 16
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
  labeledDateInput: {
    width: "100%",
    minWidth: 0,
    flex: 0
  },
  memoryPlaque: {
    borderWidth: 1,
    borderColor: "#d8d1c2",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 16,
    gap: 12
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  detailTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6
  },
  dateSummary: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8
  },
  detailTitle: {
    color: theme.colors.primaryText,
    fontSize: 26,
    fontWeight: "800"
  },
  memoryTextPanel: {
    borderWidth: 1,
    borderColor: "#d4c7b4",
    backgroundColor: "#fffaf1",
    borderRadius: 8,
    padding: 18,
    gap: 14
  },
  memoryBody: {
    color: theme.colors.primaryText,
    fontSize: theme.typography.title.fontSize,
    lineHeight: 30
  },
  metadata: {
    color: theme.colors.metadataText,
    fontSize: theme.typography.metadata.fontSize
  },
  mutedMetadata: {
    color: theme.colors.metadataText,
    ...theme.typography.metadata
  },
  connectionReason: {
    color: theme.colors.connectionText,
    fontSize: theme.typography.metadata.fontSize,
    fontWeight: "700",
    lineHeight: theme.typography.metadata.lineHeight
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  tag: {
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.tagBackground,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  tagSelected: {
    backgroundColor: theme.colors.tagSelectedBackground
  },
  tagLabel: {
    color: theme.colors.tagText,
    fontSize: theme.typography.metadata.fontSize,
    fontWeight: "600"
  },
  tagLabelSelected: {
    color: theme.colors.tagSelectedText
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
    color: theme.colors.dateBadgeText,
    backgroundColor: theme.colors.dateBadgeBackground,
    borderRadius: theme.radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...theme.typography.label,
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
  reviewIntro: {
    borderWidth: 1,
    borderColor: "#d4dccb",
    backgroundColor: "#f7faf3",
    borderRadius: 8,
    padding: 16,
    gap: 10
  },
  reviewItem: {
    borderWidth: 1,
    borderColor: "#d6d9c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 16,
    gap: 10
  },
  reviewDetail: {
    borderLeftWidth: 3,
    borderLeftColor: "#d4dccb",
    paddingLeft: 10,
    gap: 4
  },
  reviewType: {
    color: "#5d6b58",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  errorText: {
    color: theme.colors.dangerText,
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
  iconButtonIcon: {
    color: "#30352f"
  },
  iconButtonActiveIcon: {
    color: "#263323"
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSage,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm
  },
  primaryButtonText: {
    color: theme.colors.accentSageText,
    ...theme.typography.button
  },
  primaryButtonIcon: {
    color: theme.colors.accentSageText
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.strongBorder,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm
  },
  secondaryButtonText: {
    color: theme.colors.secondaryText,
    ...theme.typography.button
  },
  secondaryButtonIcon: {
    color: theme.colors.secondaryText
  },
  disabled: {
    opacity: 0.45
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  trustGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  trustItem: {
    minWidth: 132,
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2ddcf",
    backgroundColor: "#fffaf1",
    borderRadius: 8,
    padding: 12,
    gap: 5
  },
  trustValue: {
    color: "#252925",
    fontSize: 15,
    fontWeight: "800"
  },
  modelAssetList: {
    gap: 8
  },
  modelAssetRow: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: "#e2ddcf",
    backgroundColor: "#fffaf1",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  modelAssetText: {
    flex: 1,
    minWidth: 0,
    gap: 4
  },
  modelAssetTitle: {
    color: "#252925",
    fontSize: 14,
    fontWeight: "800"
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden"
  },
  statusPillSuccess: {
    color: "#263323",
    backgroundColor: "#dae7d3"
  },
  statusPillMuted: {
    color: "#596057",
    backgroundColor: "#ece8de"
  },
  settingsSectionHeader: {
    marginTop: 8,
    gap: 3
  },
  settingsSectionTitle: {
    color: "#252925",
    fontSize: 20,
    fontWeight: "800"
  },
  settingsSection: {
    borderWidth: 1,
    borderColor: "#d8d4c8",
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: 14,
    gap: 12
  },
  settingsSectionBody: {
    gap: 10
  },
  settingsDivider: {
    height: 1,
    backgroundColor: "#e6e0d3",
    marginVertical: 4
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

type AppStyle = ViewStyle | TextStyle | ImageStyle;
type AppStyleKey = keyof typeof lightStyles;

const darkColors = darkTheme.colors;

const darkStyleOverrides: Partial<Record<AppStyleKey, AppStyle>> = {
  safeArea: { backgroundColor: darkColors.background },
  header: { backgroundColor: darkColors.shellSurface, borderBottomColor: darkColors.navBorder },
  bottomNav: { backgroundColor: darkColors.shellSurface, borderTopColor: darkColors.navBorder },
  navButtonActive: { backgroundColor: darkColors.accentSoft },
  navIcon: { color: darkColors.mutedText },
  navIconActive: { color: darkColors.primaryText },
  navLabel: { color: darkColors.mutedText },
  navLabelActive: { color: darkColors.primaryText },
  captureButton: { backgroundColor: darkColors.accent, shadowColor: "#000000" },
  captureButtonIcon: { color: darkColors.accentText },
  pathBackButton: { backgroundColor: "#222821", borderColor: "#3a4338" },
  pathBackText: { color: "#cbd8c2" },
  brand: { color: darkColors.primaryText },
  subtle: { color: darkColors.mutedText },
  loadingText: { color: darkColors.secondaryText },
  capturePanel: { backgroundColor: darkColors.paper, borderColor: darkColors.warmBorder, shadowColor: "#000000" },
  saveNotice: { backgroundColor: "#20301f", borderColor: "#40513d" },
  saveNoticeText: { color: "#f3efe7" },
  captureEyebrow: { color: "#d7bca9" },
  capturePrompt: { color: "#f3efe7" },
  captureNote: { color: "#c2b8aa" },
  newMemoryInput: { backgroundColor: "#20251f", borderColor: "#534235", color: "#f3efe7" },
  voicePanel: { backgroundColor: "#251f1b", borderColor: "#534235" },
  holdToSpeakButton: { backgroundColor: darkColors.accentSage },
  holdToSpeakButtonActive: { backgroundColor: "#48633f" },
  voiceTimer: { color: "#f3efe7" },
  waveformBar: { backgroundColor: "#8fa984" },
  transcriptPanel: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  searchRow: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  searchInput: { color: "#f3efe7" },
  emptyTitle: { color: "#f3efe7" },
  card: { backgroundColor: darkColors.surface, borderColor: darkColors.border },
  memoryCard: { backgroundColor: darkColors.surface, borderColor: darkColors.border },
  memoryTitle: { color: darkColors.primaryText },
  memoryCardTitle: { color: darkColors.primaryText },
  memoryPreview: { color: darkColors.secondaryText },
  highlightText: { color: "#f3efe7", backgroundColor: "#3f563b" },
  titleInput: { backgroundColor: "#20251f", borderColor: "#3a4338", color: "#f3efe7" },
  bodyInput: { backgroundColor: "#20251f", borderColor: "#3a4338", color: "#f3efe7" },
  addendumInput: { backgroundColor: "#20251f", borderColor: "#3a4338", color: "#f3efe7" },
  fastCaptureInput: { backgroundColor: "#20251f", borderColor: "#3a4338", color: "#f3efe7" },
  tagInput: { backgroundColor: "#20251f", borderColor: "#3a4338", color: "#f3efe7" },
  inputLabel: { color: darkColors.primaryText },
  inputHint: { color: darkColors.secondaryText },
  dateInput: { backgroundColor: "#20251f", borderColor: "#3a4338", color: "#f3efe7" },
  datePanel: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  suggestionPanel: { backgroundColor: "#20301f", borderColor: "#40513d" },
  postSaveSheet: { backgroundColor: "#20301f", borderColor: "#40513d" },
  postSaveItem: { borderTopColor: "#40513d" },
  promptPanel: { backgroundColor: "#202a1f", borderColor: "#3f4b39" },
  promptItem: { borderTopColor: "#3f4b39" },
  pathCard: { borderColor: "#3a4338" },
  pathCardSage: { backgroundColor: "#202a1f", borderColor: "#3d5038" },
  pathCardClay: { backgroundColor: "#2d241f", borderColor: "#5a4032" },
  pathCardBlue: { backgroundColor: "#1f2a2c", borderColor: "#3d5054" },
  pathCardPaper: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  pathCardStone: { backgroundColor: "#252822", borderColor: "#46483f" },
  pathIconSage: { backgroundColor: "#31402e" },
  pathIconClay: { backgroundColor: "#473327" },
  pathIconBlue: { backgroundColor: "#2e3f43" },
  pathIconPaper: { backgroundColor: "#393a32" },
  pathIconStone: { backgroundColor: "#3d3f38" },
  relatedPanel: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  relatedItem: { borderTopColor: "#3a4338" },
  constellationCard: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  chapterCard: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  constellationSection: { borderTopColor: "#3a4338" },
  constellationMemory: { backgroundColor: "#251f1b", borderColor: "#4b3d32" },
  chapterMemory: { backgroundColor: "#251f1b", borderColor: "#4b3d32" },
  themeShelf: { backgroundColor: "#202a1f", borderColor: "#3f4b39" },
  themeMemory: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  graphRow: { borderTopColor: "#3a4338" },
  filterPanel: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  diagnosticsPanel: { backgroundColor: "#232823", borderColor: "#414941" },
  panelTitle: { color: "#f3efe7" },
  sectionEyebrow: { color: "#9ea69a" },
  segment: { borderColor: "#485244" },
  segmentActive: { backgroundColor: "#334832", borderColor: "#71906b" },
  segmentText: { color: "#cbd2c6" },
  segmentTextActive: { color: "#f3efe7" },
  memoryPlaque: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  detailTitle: { color: "#f3efe7" },
  memoryTextPanel: { backgroundColor: "#251f1b", borderColor: "#534235" },
  memoryBody: { color: "#f3efe7" },
  metadata: { color: darkColors.metadataText },
  mutedMetadata: { color: darkColors.metadataText },
  connectionReason: { color: darkColors.connectionText },
  tag: { backgroundColor: darkColors.tagBackground },
  tagSelected: { backgroundColor: darkColors.tagSelectedBackground },
  tagLabel: { color: darkColors.tagText },
  tagLabelSelected: { color: darkColors.tagSelectedText },
  suggestionChip: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  suggestionCount: { color: "#aab1a6" },
  suggestionSnippet: { color: "#aab1a6" },
  tagCard: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  timelineYear: { color: "#f3efe7" },
  timelineItem: { backgroundColor: "#20251f", borderLeftColor: "#8fa984" },
  timelineItemInferred: { backgroundColor: "#28251d", borderLeftColor: "#c1aa63" },
  timelineItemUnknown: { backgroundColor: "#252822", borderLeftColor: "#80877d" },
  timelineBadge: { color: darkColors.dateBadgeText, backgroundColor: darkColors.dateBadgeBackground },
  deletedRow: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  reviewIntro: { backgroundColor: "#202a1f", borderColor: "#3f4b39" },
  reviewItem: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  reviewDetail: { borderLeftColor: "#53624f" },
  reviewType: { color: "#b8c9b1" },
  errorText: { color: darkColors.dangerText },
  iconButton: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  iconButtonActive: { backgroundColor: "#334832", borderColor: "#71906b" },
  iconButtonDanger: { backgroundColor: "#3b251f", borderColor: "#89513f" },
  iconButtonIcon: { color: "#d8d2c5" },
  iconButtonActiveIcon: { color: "#f3efe7" },
  primaryButton: { backgroundColor: darkColors.accentSage },
  primaryButtonText: { color: darkColors.accentSageText },
  primaryButtonIcon: { color: darkColors.accentSageText },
  secondaryButton: { backgroundColor: darkColors.surface, borderColor: darkColors.strongBorder },
  secondaryButtonText: { color: darkColors.primaryText },
  secondaryButtonIcon: { color: darkColors.primaryText },
  trustItem: { backgroundColor: "#251f1b", borderColor: "#4b3d32" },
  trustValue: { color: "#f3efe7" },
  modelAssetRow: { backgroundColor: "#251f1b", borderColor: "#4b3d32" },
  modelAssetTitle: { color: "#f3efe7" },
  statusPillSuccess: { color: "#f3efe7", backgroundColor: "#334832" },
  statusPillMuted: { color: "#c7c1b5", backgroundColor: "#393a32" },
  settingsSectionTitle: { color: "#f3efe7" },
  settingsSection: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  settingsDivider: { backgroundColor: "#3a4338" },
  stat: { backgroundColor: "#20251f", borderColor: "#3a4338" },
  statValue: { color: "#f3efe7" },
  statLabel: { color: "#aab1a6" },
  privacy: { color: "#d8d2c5" }
};

const darkStyles = Object.fromEntries(
  (Object.keys(lightStyles) as AppStyleKey[]).map((key) => [
    key,
    StyleSheet.flatten([lightStyles[key], darkStyleOverrides[key]])
  ])
) as typeof lightStyles;

let styles = lightStyles;
