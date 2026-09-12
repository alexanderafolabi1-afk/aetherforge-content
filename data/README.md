# data/

Bridge files that let external automation (n8n, etc.) read this repo's data without touching the browser app directly.

- `content-queue.json` (not committed yet) — a JSON array of `ScheduledPost` objects exported from the Command Deck's Launch queue. See [`AUTOMATION_GUIDE.md`](../AUTOMATION_GUIDE.md) for how to create and sync it.
- `automation-status.json` (generated, not committed by default) — the latest snapshot from `npm run check-queue`: counts by status/language, the next queued item, and any overdue items. Overwritten on every run.
- `automation-status.log` (generated, not committed by default) — one line appended per `npm run check-queue` run, for a history of queue/pipeline health over time.

Run `npm run check-queue` (see [`scripts/check-queue-telemetry.mjs`](../scripts/check-queue-telemetry.mjs)) after committing a fresh `content-queue.json`, or any time you want to confirm the n8n pipeline is actually keeping up with it.
