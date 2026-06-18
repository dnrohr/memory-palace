# Agent Instructions

## Temporary Screenshots

- Put disposable screenshots created during local app, browser, or device testing under `.codex-screenshots/<task-name>/`.
- Before finishing, delete screenshots you created with `npm run screenshots:cleanup -- --dir .codex-screenshots/<task-name> --yes`.
- Keep screenshots that are meant to be durable QA evidence in `docs/` and mention them in your final notes. Do not delete existing screenshots unless the user explicitly asks.
- If you are unsure whether a screenshot is yours, leave it in place and list it for the user instead of deleting it.

The cleanup script is intentionally conservative: it defaults to `.codex-screenshots`, performs a dry run unless `--yes` is passed, deletes only common image files, refuses repository-root cleanup, and will not follow symlinks.
