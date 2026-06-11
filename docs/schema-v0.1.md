# Data Schema v0.1

The database is canonical. Model and rules output are suggestions until the user confirms them.

## Tables

```sql
CREATE TABLE memory (
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

CREATE TABLE tag (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'custom',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_user_created INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE memory_tag (
  memory_id TEXT NOT NULL REFERENCES memory(id),
  tag_id TEXT NOT NULL REFERENCES tag(id),
  source TEXT NOT NULL,
  confidence REAL,
  user_confirmed INTEGER NOT NULL DEFAULT 0,
  rejected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (memory_id, tag_id)
);

CREATE TABLE user_profile (
  id TEXT PRIMARY KEY,
  birth_year INTEGER,
  birth_month INTEGER,
  birth_day INTEGER,
  preferred_date_precision TEXT,
  allow_inferred_dates INTEGER NOT NULL DEFAULT 1,
  allow_emotion_detection INTEGER NOT NULL DEFAULT 1,
  allow_audio_retention INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE processing_run (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memory(id),
  processor_name TEXT NOT NULL,
  processor_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

## FTS Index

```sql
CREATE VIRTUAL TABLE memory_fts USING fts5(
  title,
  raw_text,
  cleaned_text,
  content='memory',
  content_rowid='rowid'
);
```

## Metadata Precedence

1. User-confirmed metadata
2. User-entered metadata
3. Imported explicit metadata
4. Explicit text extraction
5. Known context inference
6. Rules-based inference
7. Local model suggestion
8. Cloud model suggestion

