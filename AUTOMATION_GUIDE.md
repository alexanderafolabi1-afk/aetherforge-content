# Automation Guide: Content Queue → X (via OpenTweet)

This guide connects the Command Deck's **Launch queue** (the content schedule you stage in the app) to an external posting service, using [n8n](https://n8n.io) and [`n8n-workflow-template.json`](./n8n-workflow-template.json).

## How data actually flows today (read this first)

The Command Deck is a **local-first PWA**. Everything you queue lives in your browser's `localStorage` under the key `aetherforge-command-deck` (see `src/lib/store.ts`) — there is no server, and nothing in the queue reaches GitHub or n8n automatically. To automate posting, you need a bridge: a JSON file committed to this repo that your queue syncs into, and that n8n reads from on a schedule.

That bridge file is `data/content-queue.json`. It does not exist yet — you create it as part of setup below.

Each item in the queue matches the `ScheduledPost` shape from `src/lib/types.ts`:

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

## Setup

### 1. Export the queue from the Command Deck

Until an in-app "sync to GitHub" button exists, export by hand from the browser console (DevTools → Console, on the deployed app):

```js
copy(JSON.stringify(useDeckStore.getState().contentQueue, null, 2));
```

This copies the current queue to your clipboard. (`useDeckStore` is available globally in dev builds; in production, open React DevTools → select any Command Deck component → the store is on its Zustand hook, or simply read `localStorage.getItem("aetherforge-command-deck")` and pull the `state.contentQueue` field from the parsed JSON.)

### 2. Commit the bridge file

Paste the exported array into `data/content-queue.json` in this repo and commit:

```
aetherforge-content/
└── data/
    └── content-queue.json   ← array of ScheduledPost objects
```

This file is what n8n polls — it's the handoff point between "what you staged in the app" and "what the automation is allowed to post."

### 3. Import the n8n workflow

1. Open your n8n instance → **Workflows → Import from File**
2. Select [`n8n-workflow-template.json`](./n8n-workflow-template.json)
3. The template ships with:
   - A **Schedule Trigger** (every 15 minutes) and an optional **Webhook** you can call manually
   - **Fetch Content Queue (GitHub)** — reads `data/content-queue.json` via the GitHub Contents API
   - **Split Out Queue Items** + **Filter - Due & Queued** — keeps only `status: "queued"` items whose `scheduledFor` is in the past
   - **Post to X via OpenTweet** — placeholder HTTP Request node
   - **Mark Posted (GitHub commit)** — writes the updated queue back so posted items don't fire twice

### 4. Configure credentials in n8n

| Credential | Used by | Notes |
| --- | --- | --- |
| `GitHub Contents Token` | Fetch / Mark Posted nodes | A GitHub PAT (fine-grained, scoped to this repo, **Contents: Read and write**) |
| `OpenTweet API Key` | Post to X node | Whatever auth scheme OpenTweet documents (bearer token, header key, etc.) |

Set these as n8n credentials (or environment variables `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`, `OPENTWEET_API_KEY`) — never hardcode secrets into the workflow JSON itself.

### 5. Fill in the placeholders

The template intentionally ships with two things you must edit before activating:

- **GitHub owner/repo** — the `Fetch Content Queue` and `Mark Posted` node URLs reference `{{$env.GITHUB_OWNER}}` / `{{$env.GITHUB_REPO}}`; point these at `alexanderafolabi1-afk/aetherforge-content` (or your fork).
- **OpenTweet endpoint** — the `Post to X via OpenTweet` node's URL (`https://api.opentweet.io/v1/tweets`) is a **placeholder**. Confirm the real endpoint, payload shape, and auth header against OpenTweet's actual API docs before going live, and update the `jsonBody` mapping to match.
- **Mark Posted commit body** — writing back to GitHub's Contents API requires the file's current `sha` and a base64-encoded new body. Add a small **Code** node before "Mark Posted" that re-fetches the file's `sha`, merges the posted item's `status` to `"posted"`, and base64-encodes the result. This is left as a Code node for you to fill in because the exact merge logic depends on how many items you queue per run.

### 6. Test before activating

- Run the workflow manually in n8n (**Execute Workflow**) with a queue file containing one `queued` item scheduled in the past.
- Confirm it posts to OpenTweet (or a mock endpoint first) and commits the status change back to GitHub.
- Only then toggle the workflow **Active**.

### 7. Closing the loop back into the app

After n8n commits `status: "posted"` back to `data/content-queue.json`, the Command Deck itself won't auto-refresh (it's still reading its own `localStorage`, not this repo file). To reflect posted status in the app, either:

- Manually paste the updated file's contents back into `localStorage` (`localStorage.setItem("aetherforge-command-deck", ...)`, merging into the existing `state.contentQueue`), or
- Use the app's own **Mark posted** action (✓ button) in the **Launch queue** panel once you've confirmed it went out — the simplest path for now.

A proper two-way sync (the app reading `data/content-queue.json` directly, or a small API) is a reasonable next step but isn't built yet — this guide reflects what's actually wired up today.

## Reference

- Queue data model: `src/lib/types.ts` (`ScheduledPost`, `PostLanguage`)
- Queue actions: `src/lib/store.ts` (`queuePost`, `markQueuePosted`, `skipQueuedPost`, `removeQueuedPost`, `nextQueuedPost`)
- Queue UI: `src/components/deck/content-queue.tsx` (Launch queue panel, Queue/Preview tabs)
- Workflow template: `n8n-workflow-template.json`
