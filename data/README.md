# data/

Bridge files that let external automation (n8n, etc.) read this repo's data without touching the browser app directly.

- `content-queue.json` (not committed yet) — a JSON array of `ScheduledPost` objects exported from the Command Deck's Launch queue. See [`AUTOMATION_GUIDE.md`](../AUTOMATION_GUIDE.md) for how to create and sync it.
