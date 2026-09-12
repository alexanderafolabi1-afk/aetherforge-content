# Automation Guide: Content Queue → X (via OpenTweet)

This guide connects the Command Deck's **Launch queue** (the content schedule you stage in the app) to an external posting service, using [n8n](https://n8n.io) and [`n8n-workflow-template.json`](./n8n-workflow-template.json). There is no manual file export/upload step anymore — the app commits directly to this repo.

## How data flows today

The Command Deck is a **local-first PWA**: everything you queue is stored in your browser's `localStorage` under the key `aetherforge-command-deck` (see `src/lib/store.ts`). To hand posts to an external automation, that data needs to exist somewhere n8n can read it — this repo, at `data/content-queue.json`.

**GitHub Sync** (in the **Connectors** dialog) closes that gap directly: once configured, the Command Deck commits the queue straight to `data/content-queue.json` in this repo via the GitHub Contents API — no download, no manual upload, no copy-pasting.

```
Command Deck (browser)  --[GitHub Contents API, direct commit]-->  data/content-queue.json
                                                                            |
                                                                    [n8n, every 15 min]
                                                                            v
                                                                    Post due items to X
                                                                            |
                                                                    [commit status back]
                                                                            v
                                                                    data/content-queue.json
```

Each item matches the `ScheduledPost` shape from `src/lib/types.ts`:

```json
{
  "id": "queue-1",
  "title": "The algorithm rewards frequency...",
  "body": "Optional dispatch notes, supports **bold**, *italic*, `code`, [links](url).",
  "vertical": "Threads",
  "language": "en",
  "scheduledFor": "2026-09-14T09:00:00.000Z",
  "status": "queued",
  "createdAt": "2026-09-12T00:00:00.000Z"
}
```

`status` is one of `"queued" | "posted" | "skipped"`. The automation only ever touches `"queued"` items whose `scheduledFor` has passed.

## Setup (one time)

### 1. Create a GitHub token — read this before anything else

GitHub Sync needs a token that can write to this repo, and it lives in your browser's `localStorage`. That is a real credential, not a screen-lock hash — treat it with real care:

- Create a **fine-grained personal access token**: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
- Scope it to **this one repository only** (`aetherforge-content`, or your fork) — never "all repositories"
- Grant only **Contents: Read and write** — nothing else
- Set a reasonable expiry and rotate it periodically

Never paste a classic PAT or one with account-wide scope here. Anyone with access to this browser or its devtools can read it.

### 2. Configure GitHub Sync in the app

Open **Connectors** in the Command Deck → **GitHub Sync** → fill in:

| Field | Value |
| --- | --- |
| Owner | `alexanderafolabi1-afk` (or your fork's owner) |
| Repo | `aetherforge-content` |
| Branch | `main` |
| Path | `data/content-queue.json` |
| Token | the fine-grained PAT from step 1 |

Click **Save** (PIN-confirmed, same as every restricted action here). From this point on, every change to the Launch queue — adding a post, marking one posted, skipping, removing — auto-commits to GitHub a couple of seconds later. There's also a manual **Sync to GitHub** button in the Launch queue header for an on-demand push.

The panel shows a live status line ("Synced to GitHub · 2:14 PM" or "Sync failed") so you always know whether the bridge is actually working — it isn't a silent fire-and-forget.

**Before relying on it, click Verify connection** (next to Save/Clear). It performs a real read *and* write test — reading the repo, reading the configured queue path, then writing to a small dedicated marker file (`.aetherforge-sync-check.json`, next to the queue path) so the check can never touch or corrupt your real queue data. It reports token/repo/path/write status individually, so a failure tells you exactly which part is wrong. Prefer to check a token before it ever touches the browser? `npm run verify-github-token` (with `GITHUB_TOKEN=...` set) runs the identical check from the command line.

### 3. Import the n8n workflow

1. Open your n8n instance → **Workflows → Import from File**
2. Select [`n8n-workflow-template.json`](./n8n-workflow-template.json)
3. Add two credentials (n8n → Credentials → New):
   - **GitHub Contents Token** — the same kind of fine-grained PAT as above (a separate token is fine, or reuse the one from step 1)
   - **OpenTweet API Key** — whatever OpenTweet's docs specify (bearer token, header key, etc.)
4. Assign each credential to the matching HTTP Request nodes (they're pre-named to make this obvious)
5. The Fetch / Mark Posted node URLs already point at this exact repo — only edit them if you're running this against a fork

The template ships fully wired, not a skeleton:
- **Schedule Trigger** (every 15 minutes) — n8n's own "Execute workflow" button covers manual testing, so there's no separate webhook trigger to configure
- **Fetch Content Queue (GitHub)** — one GET that returns both the file content and its `sha`. Auto-retries 3x on transient failures (rate limits, blips) — this call is read-only, so retrying is always safe.
- **Decode & Filter Due Posts** (Code node) — decodes the file, keeps only `queued` items whose `scheduledFor` has passed
- **Post to X via OpenTweet** — the one placeholder left: OpenTweet's real endpoint/auth isn't something this guide can verify, so update the URL and auth against their actual docs before activating. Deliberately does **not** auto-retry: retrying a create-tweet call on a lost response could double-post to X, so a genuine failure here just waits for the next scheduled run instead.
- **Build Updated Queue** (Code node) — merges `status: "posted"` back into the full queue and base64-encodes it; if nothing was due, it outputs nothing and skips the commit entirely
- **Mark Posted (GitHub commit)** — writes the result back, using the real `sha`/`content`/`message` from the previous node. Also auto-retries 3x — this write is idempotent, and X already has the post regardless of whether the commit lands on the first try.

No Code node is left as an exercise — both are implemented and tested (see the repo's own verification in the commit that introduced this template). No manual intervention is needed for a normal run: the only human steps are the one-time credential setup above and confirming OpenTweet's real endpoint.

### 4. Test before activating

- **Execute workflow** in n8n with at least one `queued` item scheduled in the past (stage one from the Command Deck, or hand-edit `data/content-queue.json` for a dry run)
- Confirm it posts to OpenTweet (or a mock endpoint first) and commits `status: "posted"` back
- Only then toggle the workflow **Active**

## Daily use

Once both sides are set up, this is the entire loop:

1. **Check what's next.** The **Next up** card on the main screen shows the earliest queued item's language and publish time at a glance.
2. **Stage or adjust posts** in the **Launch queue** panel — headline, dispatch, vertical, language, fire time. Use the **Preview** tab to markdown-check each language variant.
3. That's it. The queue auto-syncs to GitHub a couple of seconds after any change (watch the status line), and n8n picks up anything due on its next 15-minute run.
4. **Reconcile in-app status.** n8n commits `status: "posted"` back to `data/content-queue.json`, but the Command Deck still reads its own `localStorage` — it doesn't pull that file back down automatically. Mark the same items posted with the ✓ button in the Launch queue panel once you've confirmed they went out, so the in-app view matches reality.
5. **Verify with the telemetry check script** (optional, `npm run check-queue` — see below) any time you want a repo-side health check independent of the app's own status line.

There's no export/upload step left to remember — steps 1–3 are the only ones that repeat daily, and step 3 requires no action beyond the edit itself.

### Verifying with the telemetry check script

Run `npm run check-queue` (or `node scripts/check-queue-telemetry.mjs`) against your local checkout of this repo (after pulling the latest commit GitHub Sync or n8n made). It validates `data/content-queue.json` against the exact shape the n8n workflow expects, and flags any `queued` item whose `scheduledFor` has already passed — the clearest sign the n8n side has stalled:

```
$ npm run check-queue

Checked 4 item(s) in data/content-queue.json
  queued=3 posted=1 skipped=0
  languages: {"en":1,"es":1,"ja":1,"pt":1}
  next up: "The algorithm rewards frequency..." (en) at 2026-09-14T09:00:00.000Z
✔ Queue looks healthy — no shape issues, nothing overdue.
Status written to data/automation-status.json
Log appended to data/automation-status.log
```

A non-zero exit code means either a shape problem or something overdue — treat it as "go check the n8n execution log," not an in-app problem. Its output files are gitignored by default; commit them yourself, or wire a scheduled job, if you want that history tracked.

## Reference

- Queue data model: `src/lib/types.ts` (`ScheduledPost`, `PostLanguage`)
- Queue actions: `src/lib/store.ts` (`queuePost`, `markQueuePosted`, `skipQueuedPost`, `removeQueuedPost`, `nextQueuedPost`)
- Queue UI: `src/components/deck/content-queue.tsx` (Launch queue panel, Queue/Preview tabs, Sync to GitHub)
- GitHub Sync: `src/lib/github-sync.ts` (config storage, the direct commit flow, `verifyGithubSyncConnection`), settings UI in `src/components/deck/connectors.tsx`
- Token pre-flight check: `scripts/verify-github-token.mjs` (`npm run verify-github-token`)
- Next-up preview: `src/components/deck/upcoming-post.tsx`
- Automation status toggle: `src/components/deck/command-bar.tsx` (`automationActive` / `toggleAutomation`) — manual flag, not a live n8n health check
- Telemetry check script: `scripts/check-queue-telemetry.mjs` (`npm run check-queue`)
- Workflow template: `n8n-workflow-template.json`
