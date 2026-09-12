/**
 * Direct browser -> GitHub Contents API sync for the content queue.
 *
 * This replaces the manual export-a-file / upload-it-yourself bridge: once
 * configured, the Launch queue commits straight to data/content-queue.json
 * in this repo, and the n8n workflow reads it from there like normal.
 *
 * SECURITY — read this before wiring it up:
 * This requires a GitHub token capable of writing to this repo, stored in
 * this browser's localStorage. That is a real credential, unlike the admin
 * PIN (a local hash used only for a screen lock) — anyone who can read this
 * browser's storage can use it to push commits to this repo. Only ever use
 * a FINE-GRAINED personal access token scoped to:
 *   - This one repository only (not "all repositories")
 *   - "Contents: Read and write" permission, nothing else
 * Never paste a classic PAT or one with broader account access here.
 */

const CONFIG_KEY = "aetherforge-github-sync";

export interface GithubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}

export function getGithubSyncConfig(): GithubSyncConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GithubSyncConfig;
  } catch {
    return null;
  }
}

export function hasGithubSyncConfig(): boolean {
  const c = getGithubSyncConfig();
  return Boolean(c?.owner && c?.repo && c?.token);
}

export function saveGithubSyncConfig(config: GithubSyncConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearGithubSyncConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function githubRequest(url: string, token: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

export interface SyncResult {
  ok: boolean;
  message: string;
  commitUrl?: string;
}

/** Commits `queue` to the configured repo/path, creating or updating the file as needed. */
export async function syncQueueToGithub(queue: unknown): Promise<SyncResult> {
  const config = getGithubSyncConfig();
  if (!config) {
    return { ok: false, message: "GitHub Sync isn't set up yet — configure it in Connectors." };
  }
  const { owner, repo, branch, path, token } = config;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  let sha: string | undefined;
  try {
    const getRes = await githubRequest(`${apiUrl}?ref=${encodeURIComponent(branch)}`, token);
    if (getRes.ok) {
      const data = (await getRes.json()) as { sha?: string };
      sha = data.sha;
    } else if (getRes.status === 401 || getRes.status === 403) {
      return { ok: false, message: `GitHub rejected the token (${getRes.status}). Check its scope and expiry.` };
    } else if (getRes.status !== 404) {
      return { ok: false, message: `Couldn't read the file (${getRes.status}). Check owner/repo/path.` };
    }
  } catch {
    return { ok: false, message: "Network error reaching GitHub. Check your connection and try again." };
  }

  const content = utf8ToBase64(JSON.stringify(queue, null, 2));
  const buildBody = (withSha?: string) => ({
    message: `chore: sync content queue (${new Date().toISOString()})`,
    content,
    branch,
    ...(withSha ? { sha: withSha } : {}),
  });

  const put = (withSha?: string) =>
    githubRequest(apiUrl, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(withSha)),
    });

  try {
    let res = await put(sha);

    if (res.status === 409) {
      // sha went stale between GET and PUT (e.g. n8n wrote back in between) — refetch once and retry.
      const retryGet = await githubRequest(`${apiUrl}?ref=${encodeURIComponent(branch)}`, token);
      if (!retryGet.ok) {
        return { ok: false, message: "GitHub rejected the write (conflicting update) and the retry read also failed." };
      }
      const retryData = (await retryGet.json()) as { sha?: string };
      res = await put(retryData.sha);
    }

    if (!res.ok) {
      const errBody = (await res.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false,
        message: `GitHub rejected the write (${res.status}${errBody?.message ? `: ${errBody.message}` : ""}).`,
      };
    }

    const json = (await res.json()) as { commit?: { html_url?: string } };
    return { ok: true, message: "Synced to GitHub.", commitUrl: json.commit?.html_url };
  } catch {
    return { ok: false, message: "Network error writing to GitHub. Check your connection and try again." };
  }
}
