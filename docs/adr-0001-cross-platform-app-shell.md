# ADR 0001: Cross-Platform App Shell

## Status

Accepted for prototype.

## Decision

Use a TypeScript-first cross-platform app shell, with React Native and Expo as the intended mobile framework for the first prototype.

Keep domain logic, processing, export, import, and tests in platform-neutral TypeScript modules so the app can later move native performance-sensitive features behind stable interfaces.

## Rationale

- Shared iOS and Android UI supports fast product iteration.
- TypeScript matches the current portable core and contract tests.
- Expo gives a practical path to iOS, Android, and web previews during early validation.
- Native modules can still be added for speech, local model inference, secure storage, and background indexing.

## Consequences

- On-device speech and local AI integrations may need native bridges.
- Core data and processing code should avoid React Native dependencies.
- SQLite, file export, permissions, and audio capture should be wrapped behind app-level adapters.
- The portable test suite remains the first line of defense for extraction, tagging, schema, and export behavior.
- Native platforms use `expo-sqlite`; web currently uses the same archive contract over AsyncStorage because the Expo SQLite web worker requires additional WASM bundler handling.
