# Android Archive Migration and Unlock QA - 2026-06-18

## Scope

This pass used the standalone APK on the attached Pixel 8a and exercised archive-at-rest migration, restart unlock, and cleanup back to a non-locked startup state.

## Device Gate

- Starting state: app launched without requiring an archive passphrase after the prior import/app-lock QA.
- Archive migration: passed. In Settings > Security, selecting archive scope and entering the temporary passphrase `ArchiveQa20260618` triggered the archive-at-rest save path.
- Save status: passed. The app showed `Archive-at-rest encryption is on. Plaintext primary storage was cleared after the encrypted archive was written.`
- Restart lock: passed. After force-stopping and relaunching the app, the dedicated `Encrypted archive` unlock screen appeared.
- Correct-passphrase unlock: passed. Entering `ArchiveQa20260618` unlocked the archive and returned to the app.
- Cleanup: passed. Encryption scope was restored to disabled, the app showed `Encryption options saved. Archive-at-rest encryption is off, so the local archive remains in primary storage.`, and a final force-stop/relaunch opened the app without the archive unlock screen.

## Notes

- The passphrase was only a temporary QA value and was not stored as a durable secret.
- Disposable UIAutomator XML dumps were removed after the run.
