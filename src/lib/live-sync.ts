/**
 * Read-only pull of what n8n commits to this repo — the other half of
 * GitHub Sync. That module pushes the content queue browser -> GitHub; this
 * one pulls data/live-metrics.json and data/x-automation-state.json back
 * GitHub -> browser, so the deck shows what n8n actually did on X instead
 * of hand-entered or seeded numbers.
 *
 * Deliberately NOT the GitHub Contents API (that needs a token): these are
 * public files in a public repo, so a plain raw.githubusercontent.com GET
 * is enough, needs no credential, and can't be used to write anything.
 */
import { getGithubSyncConfig } from "./github-sync";
import type { LiveMetricsFile, ReplyCandidate, XAutomationStateFile } from "./types";

const FALLBACK_OWNER = "alexanderafolabi1-afk";
const FALLBACK_REPO = "aetherforge-content";
const FALLBACK_BRANCH = "main";

function rawUrl(path: string): string {
  const config = getGithubSyncConfig();
  const owner = config?.owner || FALLBACK_OWNER;
  const repo = config?.repo || FALLBACK_REPO;
  const branch = config?.branch || FALLBACK_BRANCH;
  // Cache-bust: raw.githubusercontent.com caches aggressively, and a manual
  // Refresh should always show what's actually on GitHub right now.
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}?t=${Date.now()}`;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(rawUrl(path), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchLiveMetrics(): Promise<LiveMetricsFile | null> {
  return fetchJson<LiveMetricsFile>("data/live-metrics.json");
}

export function fetchXAutomationState(): Promise<XAutomationStateFile | null> {
  return fetchJson<XAutomationStateFile>("data/x-automation-state.json");
}

export function fetchReplyCandidates(): Promise<ReplyCandidate[] | null> {
  return fetchJson<ReplyCandidate[]>("data/reply-candidates.json");
}
