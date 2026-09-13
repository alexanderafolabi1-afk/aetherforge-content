/**
 * Live telemetry connectors.
 *
 * This deck stores everything in localStorage (`aetherforge-command-deck`),
 * with one live exception: X analytics. n8n (running on your own machine,
 * holding your X API credentials — never this browser) fetches followers,
 * impressions, engagement, and recent posts on a schedule and commits them
 * to data/live-metrics.json in this repo. The PWA just reads that file —
 * see live-sync.ts and AUTOMATION_GUIDE.md. Nothing else below is live yet:
 *
 * 1. Google Sheets
 *    - Keep a tab with date, followers, impressions, revenue columns
 *    - Publish as CSV or hit Sheets API from a tiny server function
 *    - Merge rows into sparkline + revenue logs
 *
 * 2. Stripe / Ko-fi / Tips
 *    - Webhook → append `addRevenue('tips' | 'other', amount, note)`
 *
 * 3. Do not put API secrets in the browser. GitHub Sync (a narrowly-scoped
 *    exception, see github-sync.ts) is the only credential this app itself
 *    ever holds — X credentials live in n8n, not here.
 *
 * Until Sheets/tips are wired, log hauls by hand from the Command Deck.
 */
export const CONNECTORS = [
  {
    id: "x",
    name: "X analytics",
    status: "live" as const,
    hook: "Followers, impressions, engagement, post list — synced from n8n",
  },
  {
    id: "sheets",
    name: "Sheets ledger",
    status: "standby" as const,
    hook: "Daily snapshot + revenue journal",
  },
  {
    id: "tips",
    name: "Tips & payouts",
    status: "standby" as const,
    hook: "Stripe / Ko-fi / Superthanks style inflows",
  },
] as const;
