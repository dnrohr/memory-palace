export const schemaVersion = "0.1.0";

export const initialSchemaSql = `
CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL,
  cleaned_text TEXT,
  title TEXT,
  summary TEXT,
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

CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
  title,
  raw_text,
  cleaned_text,
  content='memory',
  content_rowid='rowid'
);
`;

