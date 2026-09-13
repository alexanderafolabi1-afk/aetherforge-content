# data/

Bridge files between n8n and the Command Deck — n8n and GitHub Sync write these, the PWA and n8n
read them. Nobody edits any of these by hand — see [`AUTOMATION_GUIDE.md`](../AUTOMATION_GUIDE.md).

- `content-queue.json` — a JSON array of `ScheduledPost` objects. Written by the Command Deck's **GitHub Sync** (Connectors → GitHub Sync) via the GitHub Contents API; read and status-updated by n8n's queue-posting flow.
- `live-metrics.json` — written once a day by n8n's metrics-sync flow from real X API data (followers, impressions, engagement, recent posts). Read read-only by the PWA (`src/lib/live-sync.ts`) to populate Overview/Growth/Briefing — revenue stays `0` here always, since X's API doesn't expose it at any tier; that's hand-logged in Mission Log instead.
- `x-automation-state.json` — written by n8n's auto-reply flow after every run: `sinceMentionId` (its own pagination cursor) plus `replyLog`, the last 200 autonomous replies sent. Read read-only by the PWA to populate Mission Log → Replies.
- `reply-candidates.json` — written twice a day by n8n's curated-account scan (Flow D): up to 40 recent, substantial tweets from a hand-picked list of high-signal accounts, pruned after 3 days. Deliberately not auto-replied to — read read-only by the PWA to populate Mission Log → Engage, where a human decides whether any of them earn an actual reply.
- `automation-status.json` (generated, not committed by default) — the latest snapshot from `npm run check-queue`: counts by status/language, the next queued item, and any overdue items. Overwritten on every run.
- `automation-status.log` (generated, not committed by default) — one line appended per `npm run check-queue` run, for a history of queue/pipeline health over time.

Run `npm run check-queue` (see [`scripts/check-queue-telemetry.mjs`](../scripts/check-queue-telemetry.mjs)) any time you want to confirm the n8n pipeline is actually keeping up with what GitHub Sync committed.
