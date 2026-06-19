export const schemaVersion = "0.1.0";

export const initialSchemaSql = `
CREATE TABLE IF NOT EXISTS schema_migration (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL,
  cleaned_text TEXT,
  title TEXT,
  summary TEXT,
  private_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  captured_at TEXT,
  source_type TEXT NOT NULL DEFAULT 'typed',
  audio_uri TEXT,
  is_audio_retained INTEGER NOT NULL DEFAULT 0,
  approximate_start_date TEXT,
  approximate_end_date TEXT,
  date_precision TEXT NOT NULL DEFAULT 'unknown',
  date_confidence REAL,
  date_explanation TEXT,
  user_date_confirmed INTEGER NOT NULL DEFAULT 0,
  is_sensitive INTEGER NOT NULL DEFAULT 0,
  exclude_from_resurfacing INTEGER NOT NULL DEFAULT 0,
  show_less_like_this INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS tag (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'custom',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_user_created INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS memory_tag (
  memory_id TEXT NOT NULL REFERENCES memory(id),
  tag_id TEXT NOT NULL REFERENCES tag(id),
  source TEXT NOT NULL,
  confidence REAL,
  user_confirmed INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (memory_id, tag_id)
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  birth_year INTEGER,
  birth_month INTEGER,
  birth_day INTEGER,
  school_year_start_month INTEGER,
  kindergarten_start_age INTEGER,
  preferred_date_precision TEXT,
  allow_inferred_dates INTEGER NOT NULL DEFAULT 1,
  allow_emotion_detection INTEGER NOT NULL DEFAULT 1,
  allow_audio_retention INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS processing_run (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memory(id),
  processor_name TEXT NOT NULL,
  processor_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS person (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  relationship TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pet (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  approximate_start_date TEXT,
  approximate_end_date TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS place (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  approximate_start_date TEXT,
  approximate_end_date TEXT,
  latitude REAL,
  longitude REAL,
  privacy_level TEXT NOT NULL DEFAULT 'vague',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS life_period (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  date_precision TEXT NOT NULL DEFAULT 'unknown',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS life_context_relationship (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  label TEXT,
  confidence REAL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS life_chapter_decision (
  candidate_id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  name TEXT,
  target_candidate_id TEXT,
  memory_ids_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_embedding (
  memory_id TEXT PRIMARY KEY REFERENCES memory(id),
  vector BLOB NOT NULL,
  dimension INTEGER NOT NULL,
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
  title,
  raw_text,
  cleaned_text,
  content='memory',
  content_rowid='rowid'
);
`;
