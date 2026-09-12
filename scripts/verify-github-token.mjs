#!/usr/bin/env node
/**
 * Pre-flight check for a GitHub Sync token — verify it works BEFORE pasting
 * it into the Command Deck's Connectors -> GitHub Sync form. Runs entirely
 * outside the browser (the token in Connectors lives in localStorage, which
 * this script has no access to and never touches).
 *
 * Performs the same real read + write round trip the in-app "Verify
 * connection" button does, against a dedicated marker file
 * (.aetherforge-sync-check.json, next to the queue path) — it never reads
 * or writes the real content-queue.json.
 *
 * Usage:
 *   GITHUB_TOKEN=github_pat_xxx node scripts/verify-github-token.mjs
 *   GITHUB_TOKEN=github_pat_xxx node scripts/verify-github-token.mjs --owner someone --repo somerepo
 *
 * Flags (all optional, default to this repo):
 *   --owner   default: alexanderafolabi1-afk
 *   --repo    default: aetherforge-content
 *   --branch  default: main
 *   --path    default: data/content-queue.json
 *   --token   alternative to the GITHUB_TOKEN env var (prefer the env var —
 *             a CLI flag can leak into shell history / process listings)
 */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      out[arg.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const token = args.token || process.env.GITHUB_TOKEN;
const owner = args.owner || "alexanderafolabi1-afk";
const repo = args.repo || "aetherforge-content";
const branch = args.branch || "main";
const path = args.path || "data/content-queue.json";

function checkFilePath(queuePath) {
  const idx = queuePath.lastIndexOf("/");
  const dir = idx === -1 ? "" : queuePath.slice(0, idx + 1);
  return `${dir}.aetherforge-sync-check.json`;
}

function githubRequest(url, init) {
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

async function main() {
  if (!token) {
    console.error("✖ No token provided. Set GITHUB_TOKEN or pass --token.");
    process.exitCode = 1;
    return;
  }

  console.log(`Verifying GitHub Sync token against ${owner}/${repo} (branch: ${branch})...\n`);

  const repoRes = await githubRequest(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoRes.ok) {
    const reason =
      repoRes.status === 401 || repoRes.status === 403
        ? "token rejected — check its scope and expiry"
        : `repo not reachable (${repoRes.status})`;
    console.error(`✖ Repo check failed: ${reason}`);
    process.exitCode = 1;
    return;
  }
  console.log("✔ Token can read the repo");

  const queueUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const queueRes = await githubRequest(queueUrl);
  if (!queueRes.ok && queueRes.status !== 404) {
    console.error(`✖ Can't read ${path} (${queueRes.status}). Check the path/branch.`);
    process.exitCode = 1;
    return;
  }
  console.log(
    queueRes.ok
      ? `✔ ${path} exists and is readable`
      : `✔ ${path} doesn't exist yet (fine — the first sync creates it)`,
  );

  const checkPath = checkFilePath(path);
  const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${checkPath}`;

  let sha;
  const getRes = await githubRequest(checkUrl);
  if (getRes.ok) {
    sha = (await getRes.json()).sha;
  } else if (getRes.status !== 404) {
    console.error(`✖ Write check failed reading ${checkPath} (${getRes.status}).`);
    process.exitCode = 1;
    return;
  }

  const payload = {
    ok: true,
    checkedAt: new Date().toISOString(),
    note: "Written by scripts/verify-github-token.mjs. Safe to delete.",
  };
  const content = Buffer.from(JSON.stringify(payload, null, 2), "utf-8").toString("base64");

  const putRes = await githubRequest(checkUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "chore: verify GitHub Sync token (safe to delete)",
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errBody = await putRes.json().catch(() => null);
    console.error(`✖ Write check failed (${putRes.status}${errBody?.message ? `: ${errBody.message}` : ""}).`);
    process.exitCode = 1;
    return;
  }
  console.log(`✔ Write round-trip succeeded (committed ${checkPath})`);

  console.log(`\n✔ This token is safe to paste into Connectors -> GitHub Sync.`);
  console.log(`  (${checkPath} was just committed as proof — delete it from the repo whenever you like.)`);
}

main();
