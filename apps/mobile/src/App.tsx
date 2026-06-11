import { CalendarDays, Download, Edit3, List, Plus, Save, Search, Tags, Trash2, Wand2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import type { DateCandidate, DatePrecision, Memory, TagSuggestion } from "../../../src/core/types";
import { JsonExportProvider } from "../../../src/export/jsonExport";
import { MarkdownExportProvider } from "../../../src/export/markdownExport";
import { extractDateCandidates } from "../../../src/processing/rules/dateExtraction";
import { suggestTags } from "../../../src/processing/rules/tagSuggestion";
import {
  createMemory,
  loadArchive,
  replaceTags,
  saveArchive,
  softDeleteMemory,
  tagsForMemory,
  upsertMemory
} from "./memoryStore";
import type { MemoryArchive } from "../../../src/core/archive";

type ViewMode = "list" | "editor" | "detail" | "settings";

export default function App() {
  const [archive, setArchive] = useState<MemoryArchive | undefined>();
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadArchive().then(setArchive);
  }, []);

  const memories = useMemo(() => {
    const active = archive?.memories.filter((memory) => !memory.deletedAt) ?? [];
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return active;

    return active.filter((memory) => {
      const tags = archive ? tagsForMemory(archive, memory.id).map((tag) => tag.name).join(" ") : "";
      return `${memory.title ?? ""} ${memory.rawText} ${memory.cleanedText ?? ""} ${tags}`
        .toLocaleLowerCase()
        .includes(normalized);
    });
  }, [archive, query]);

  const selectedMemory = archive?.memories.find((memory) => memory.id === selectedId);

  async function persist(nextArchive: MemoryArchive) {
    setArchive(nextArchive);
    await saveArchive(nextArchive);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <Header
          mode={mode}
          onNew={() => {
            setSelectedId(undefined);
            setMode("editor");
          }}
          onList={() => setMode("list")}
          onSettings={() => setMode("settings")}
        />

        {mode === "list" ? (
          <MemoryList
            archive={archive}
            memories={memories}
            query={query}
            onQueryChange={setQuery}
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
            onDelete={async () => {
              await persist(softDeleteMemory(archive, selectedMemory.id));
              setSelectedId(undefined);
              setMode("list");
            }}
          />
        ) : null}

        {mode === "settings" ? <Settings archive={archive} /> : null}
      </View>
    </SafeAreaView>
  );
}

function Header(props: { mode: ViewMode; onNew: () => void; onList: () => void; onSettings: () => void }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Memory Palace</Text>
        <Text style={styles.subtle}>Local archive</Text>
      </View>
      <View style={styles.headerActions}>
        <IconButton label="List" active={props.mode === "list"} onPress={props.onList} icon={<List size={20} />} />
        <IconButton label="New" active={props.mode === "editor"} onPress={props.onNew} icon={<Plus size={20} />} />
        <IconButton label="Settings" active={props.mode === "settings"} onPress={props.onSettings} icon={<Tags size={20} />} />
      </View>
    </View>
  );
}

function MemoryList(props: {
  archive: MemoryArchive;
  memories: Memory[];
  query: string;
  onQueryChange: (query: string) => void;
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
          placeholder="Search memories or tags"
          placeholderTextColor="#7b8178"
          style={styles.searchInput}
        />
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

function MemoryDetail(props: { archive: MemoryArchive; memory: Memory; onEdit: () => void; onDelete: () => Promise<void> }) {
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
    </ScrollView>
  );
}

function Settings(props: { archive: MemoryArchive }) {
  async function shareJson() {
    const [artifact] = await new JsonExportProvider().exportArchive(props.archive);
    if (artifact) await Share.share({ title: artifact.fileName, message: artifact.content });
  }

  async function shareMarkdown() {
    const artifacts = await new MarkdownExportProvider().exportArchive(props.archive);
    const message = artifacts.map((artifact) => `# ${artifact.fileName}\n\n${artifact.content}`).join("\n\n");
    await Share.share({ title: "Memory Palace Markdown Export", message });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.statsGrid}>
        <Stat label="Memories" value={String(props.archive.memories.filter((memory) => !memory.deletedAt).length)} />
        <Stat label="Tags" value={String(props.archive.tags.length)} />
        <Stat label="Schema" value={props.archive.schemaVersion} />
      </View>
      <View style={styles.actionRow}>
        <PrimaryButton label="JSON" onPress={shareJson} icon={<Download size={18} />} />
        <SecondaryButton label="Markdown" onPress={shareMarkdown} icon={<Download size={18} />} />
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
  tagLabel: {
    color: "#374236",
    fontSize: 13,
    fontWeight: "600"
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
