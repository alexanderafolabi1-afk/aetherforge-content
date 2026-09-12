/**
 * Live telemetry connectors — swap placeholder stats for real feeds later.
 *
 * This deck stores everything in localStorage (`aetherforge-command-deck`).
 * When you're ready to fly live:
 *
 * 1. X (Twitter)
 *    - Create an app at https://developer.x.com
 *    - Read user metrics + recent posts (impressions, engagements, followers)
 *    - Map into `Stats` + `Post[]` and call `useDeckStore.getState().patchStats(...)`
 *    - Suggested fields: public_metrics, organic_metrics, promoted_metrics
 *
 * 2. Google Sheets
 *    - Keep a tab with date, followers, impressions, revenue columns
 *    - Publish as CSV or hit Sheets API from a tiny server function
 *    - Merge rows into sparkline + revenue logs
 *
 * 3. Stripe / Ko-fi / Tips
 *    - Webhook → append `addRevenue('tips' | 'other', amount, note)`
 *
 * 4. Do not put API secrets in the browser. Server routes belong in `src/routes/`.
 *
 * Until then, log hauls by hand from the Command Deck. The universe still counts.
 */
export const CONNECTORS = [
  {
    id: "x",
    name: "X analytics",
    status: "standby" as const,
    hook: "Followers, impressions, engagement, post list",
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
