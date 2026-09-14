# Automation Guide: the X Automation Engine

This guide covers **all three** automated flows that run in
[`n8n-workflow-template.json`](./n8n-workflow-template.json) against the real X (Twitter) API —
posting the Launch queue, auto-replying to mentions, and syncing live metrics back into the
Command Deck. There is no manual file export/upload anywhere in this loop; the app and n8n commit
directly to this repo, and the app reads what n8n commits straight back.

## The four flows, at a glance

| Flow | Trigger | Reads | Writes | Cost |
| --- | --- | --- | --- | --- |
| **A — Post the queue** | Every 15 min | `data/content-queue.json` | `data/content-queue.json`, X (new tweet) | Posting is free at every X API tier |
| **B — Auto-reply to mentions** | Every 30 min | `data/x-automation-state.json`, X mentions | `data/x-automation-state.json`, X (reply tweet) | Reading mentions is billed under pay-as-you-go past Free-tier limits |
| **C — Daily metrics sync** | Once/day, 8am | X user + recent tweets | `data/live-metrics.json` | 2 read calls/day, same billing note as above |
| **D — Curated engagement scan** | Twice/day, 10am + 7pm | Recent tweets from a curated account list | `data/reply-candidates.json` | ~33 read calls/day (1 batched ID lookup + 1 per account per run) — the priciest of the four, factor it into your spending cap |

**Flow D is deliberately human-in-the-loop — this is not a missing feature.** A genuinely sharp, non-generic reply to a high-profile account needs real understanding of what they said; that requires an LLM call this template-based workflow doesn't make (no Grok/OpenAI/Anthropic key wired in). Faking it with templated text risks looking exactly like a bot on accounts where that's most damaging. So Flow D only *finds* candidates — recent, substantial (80+ char) posts from your curated list, deduplicated and pruned after 3 days — and the Command Deck's Mission Log → Engage tab shows them with a direct link to reply on X yourself. If you later add a real LLM API key, drafting (still not auto-sending) becomes a reasonable next step; auto-sending to these specific accounts is not recommended regardless.

```
Command Deck (browser)  --[GitHub Sync, direct commit]-->  data/content-queue.json
                                                                    |
                                                            [n8n Flow A, every 15 min]
                                                                    v
                                                            Post due items to X
                                                                    |
                                                            [commit status back]
                                                                    v
                                                            data/content-queue.json

X mentions  --[n8n Flow B, every 30 min]-->  reply, then commit  -->  data/x-automation-state.json
                                                                              |
X user + recent tweets  --[n8n Flow C, daily]-->  commit  -->  data/live-metrics.json
                                                                              |
                                                                    [raw GitHub fetch, read-only]
                                                                              v
                                                                       Command Deck (browser)
```

**Reply flow is fully autonomous, by explicit request — there is no review-before-send step.**
It replies immediately using a small on-brand template bank (no LLM node, so no added API cost or
unreviewed AI-generated text). Everything it sends is logged read-only in the Command Deck's
**Mission Log → Replies** tab so you can audit after the fact. If you'd rather review drafts before
they go out, see [Switching the reply flow to review-before-send](#switching-the-reply-flow-to-review-before-send)
below.

## Cost control — read this before activating Flows B and C

Posting tweets (Flow A, and the reply half of Flow B) is free at every X API access tier. **Reading**
mentions (Flow B) and user/tweet metrics (Flow C) is not — past Free-tier limits, X bills read
calls under its pay-as-you-go pricing. Both read flows are deliberately conservative about this:

- Flow B polls every 30 minutes and uses `since_id` so it only ever fetches mentions it hasn't
  already seen — never re-billed for the same mention twice.
- Flow C runs once a day, not more often, and makes exactly 2 read calls per run.

**The real backstop is a hard spending cap in your X developer billing settings** — set one before
leaving these active for any real stretch of time. n8n has no way to enforce a spend limit on X's
side; only X's own cap can guarantee you never pay more than you intend to.

## Setup (one time)

### 1. Create your X (Twitter) API credential

1. developer.x.com → your app → **Keys and Tokens**
2. Under **Authentication Tokens**, make sure the app's permission is **Read and Write** (not
   Read-only — both posting and replying need write access)
3. Copy the **API Key**, **API Key Secret**, **Access Token**, and **Access Token Secret**
4. In n8n → Credentials → New → search **"Twitter"** → pick the **OAuth1** credential type → paste
   the four values in → Save, name it `X OAuth1 API`

This one credential covers every X node in all three flows.

### 2. Create a GitHub token for n8n

Same kind of token GitHub Sync uses in the app, but a separate one for n8n (or reuse the same PAT
— either is fine):

- **Fine-grained personal access token**, scoped to **this one repository only**
- **Contents: Read and write**, nothing else
- In n8n → Credentials → New → **Header Auth** → Name: `Authorization`, Value: `Bearer <your PAT>`
  → Save, name it `GitHub Contents Token`

### 3. Import the workflow and fill in the two Set nodes

1. n8n → **Workflows → Import from File** → select
   [`n8n-workflow-template.json`](./n8n-workflow-template.json)
2. Assign `X OAuth1 API` and `GitHub Contents Token` to their matching nodes (pre-named to make
   this obvious)
3. Open **Set - Your X Account (Replies)** and **Set - Your X Account (Metrics)** — fill in your
   numeric X user ID and handle. Find your numeric ID once via a site like tweeterid.com, or by
   calling `GET https://api.twitter.com/2/users/by/username/<handle>` yourself with the same
   credential in any REST client.
4. Click **Test step** on each node once, top to bottom in each flow, before activating — confirms
   every credential and field actually works.

### 4. Test before activating

- Stage one post in the Launch queue with a `scheduledFor` in the past, run Flow A's **Execute
  workflow**, confirm it posts and marks the item `posted`.
- Run Flow C's **Execute workflow** once and confirm `data/live-metrics.json` appears in the repo
  with real numbers — the Command Deck picks it up on its next load or a tap of the header Refresh
  button.
- Only reply-test Flow B against an account you don't mind test-replying from — remember, there's
  no review step. Toggle the whole workflow **Active** once you're confident in all three.

## How the Command Deck reads this back

`src/lib/live-sync.ts` fetches `data/live-metrics.json` and `data/x-automation-state.json` straight
from `raw.githubusercontent.com` — a plain public read, no token, no GitHub API rate limit shared
with your write traffic. This happens automatically on app load and whenever you tap the header
Refresh button (`src/components/deck/command-bar.tsx`). `useDeckStore.getState().syncLiveData()` is
the entry point if you want to trigger it from anywhere else in the code.

`data/live-metrics.json` shape (`LiveMetricsFile` in `src/lib/types.ts`):

```json
{
  "updatedAt": "2026-09-14T08:00:00.000Z",
  "stats": {
    "followers": 4820,
    "impressions24h": 12400,
    "impressions7d": 68900,
    "engagement": 4.2,
    "revenueX": 0,
    "revenueTips": 0,
    "revenueOther": 0,
    "postsWeek": 6,
    "sparkline": [1200, 1800, 900, ...]
  },
  "posts": [
    { "id": "...", "title": "...", "vertical": "Threads", "impressions": 1800, "engagement": 5.1, "revenue": 0, "postedAt": "..." }
  ]
}
```

Revenue fields always stay `0` from the live sync — **X's API doesn't expose ad revenue or tips at
any access level.** Log those by hand in Mission Log → Haul, same as before this automation
existed; the live sync will never overwrite what you hand-log there.

`data/x-automation-state.json` shape (`XAutomationStateFile`):

```json
{
  "sinceMentionId": "1950000000000000002",
  "replyLog": [
    {
      "mentionId": "1950000000000000002",
      "mentionAuthor": "alice",
      "mentionText": "@you nice thread",
      "replyText": "Noted, @alice. Building beats talking about building.",
      "replyTweetId": "1950000000000000010",
      "repliedAt": "2026-09-14T08:03:00.000Z"
    }
  ]
}
```

`sinceMentionId` is n8n's own pagination cursor — the PWA ignores it and only ever displays
`replyLog`, most recent 20, in Mission Log → Replies.

## Switching the reply flow to review-before-send

Flow B was built fully autonomous on request. To add a review step instead: remove the connection
from **Build Reply Text** straight to **Post Reply**, and instead have **Build Reply Text** write
its drafts to a new `data/reply-drafts.json` file (same GitHub-commit pattern as the other two
flows) rather than posting immediately. The Command Deck would then need a small new panel to list
pending drafts with approve/edit/skip actions, similar to the existing Launch queue — that's a
follow-up piece of work, not something this template does today.

## Reference

- Live metrics fetch: `src/lib/live-sync.ts`, applied via `syncLiveData()` in `src/lib/store.ts`
- Live data types: `src/lib/types.ts` (`LiveMetricsFile`, `XAutomationStateFile`, `ReplyLogEntry`)
- Replies display: `src/components/deck/log-panel.tsx` (Mission Log → Replies and Engage tabs, both read-only)
- Curated account list: edit the `handles` array in the "Set - Curated Accounts" node (Flow D) directly in n8n — no redeploy needed
- Queue data model: `src/lib/types.ts` (`ScheduledPost`, `PostLanguage`)
- Queue actions: `src/lib/store.ts` (`queuePost`, `markQueuePosted`, `skipQueuedPost`, `removeQueuedPost`, `nextQueuedPost`)
- Queue UI: `src/components/deck/content-queue.tsx` (Launch queue panel, Queue/Preview tabs, Sync to GitHub)
- GitHub Sync (browser → GitHub, for the queue): `src/lib/github-sync.ts`, settings UI in `src/components/deck/connectors.tsx`
- Token pre-flight check: `scripts/verify-github-token.mjs` (`npm run verify-github-token`)
- Telemetry check script: `scripts/check-queue-telemetry.mjs` (`npm run check-queue`) — validates `data/content-queue.json` shape and flags overdue items, independent of n8n
- Workflow template: `n8n-workflow-template.json`
