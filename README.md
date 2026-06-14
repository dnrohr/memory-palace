# Memory Palace

Memory Palace is an offline-first, cross-platform app for capturing, organizing, searching, and exporting personal memories.

The durable product is the user-owned archive: local text, structured metadata, confirmed tags, searchable indexes, approximate dates, and exportable data. AI features should remain optional, modular, and unable to corrupt canonical user data.

## Current Status

This repository is at the first prototype stage. Implemented pieces include:

- Data schema v0.1
- Processing pipeline contract v0.1
- Golden test memory set v0.1
- Rules-based date extraction and tag suggestion prototypes
- Expo app shell for iOS, Android, and web
- Manual memory create, edit, soft-delete, list, detail, and search
- Manual tags and rules-based suggested metadata
- JSON and Markdown export providers
- Native SQLite persistence path with web storage fallback

The full product plan lives in [ROADMAP.md](ROADMAP.md).

## Development

Requirements:

- Node.js 22 or newer
- npm

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd`.

```bash
npm install
npm test
```

For physical Pixel 8a testing and away-from-computer Android installs, see [docs/pixel-8-run-install-guide.md](docs/pixel-8-run-install-guide.md).

## Repository Layout

```text
docs/                 Product and architecture docs
src/core/             Platform-neutral domain schema and types
src/processing/       Processing contracts and rules engines
src/fixtures/         Golden memory fixtures
apps/mobile/          Expo app shell
test/                 Unit tests for portable core behavior
ROADMAP.md            Full product roadmap and milestone plan
```

## Product Principles

- Offline-first
- Private by default
- No required cloud inference
- User-confirmed metadata wins
- Raw memory text is preserved
- Plain JSON and Markdown export are first-class
