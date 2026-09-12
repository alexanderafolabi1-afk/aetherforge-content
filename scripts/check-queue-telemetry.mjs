#!/usr/bin/env node
/**
 * Telemetry check for the AetherForge content queue <-> n8n automation bridge.
 *
 * Reads data/content-queue.json — the file the Command Deck's Export button
 * produces and the n8n workflow template (n8n-workflow-template.json) polls —
 * validates it matches the ScheduledPost shape n8n's Filter node relies on,
 * and writes a status snapshot so the queue<->pipeline link is observable
 * from the repo instead of only from inside the browser or inside n8n.
 *
 * Writes:
 *   data/automation-status.json  (overwritten each run — current snapshot)
 *   data/automation-status.log   (appended each run — history)
 *
 * Exits non-zero if the file has shape problems, or if any "queued" item's
 * scheduledFor has already passed — the strongest local signal that the n8n
 * pipeline isn't actually firing.
 *
 * Usage: node scripts/check-queue-telemetry.mjs [path-to-content-queue.json]
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const queuePath = resolve(repoRoot, process.argv[2] ?? "data/content-queue.json");
const statusJsonPath = resolve(repoRoot, "data/automation-status.json");
const statusLogPath = resolve(repoRoot, "data/automation-status.log");

const REQUIRED_FIELDS = [
  "id",
  "title",
  "body",
  "vertical",
  "language",
  "scheduledFor",
  "status",
  "createdAt",
];
const VALID_STATUSES = ["queued", "posted", "skipped"];
const VALID_LANGUAGES = ["en", "es", "pt", "ja", "fr"];

function main() {
  if (!existsSync(queuePath)) {
    console.error(`✖ No queue file at ${queuePath}`);
    console.error(
      "  Export it from the Command Deck (Launch queue → Export) and commit it to data/content-queue.json first.",
    );
    console.error("  See AUTOMATION_GUIDE.md.");
    process.exitCode = 1;
    return;
  }

  let queue;
  try {
    queue = JSON.parse(readFileSync(queuePath, "utf8"));
  } catch (err) {
    console.error(`✖ ${queuePath} is not valid JSON: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(queue)) {
    console.error(`✖ ${queuePath} must be a JSON array of ScheduledPost objects.`);
    process.exitCode = 1;
    return;
  }

  const shapeErrors = [];
  queue.forEach((item, i) => {
    const label = item && item.id ? item.id : `index ${i}`;
    for (const field of REQUIRED_FIELDS) {
      if (!item || !(field in item)) shapeErrors.push(`${label}: missing "${field}"`);
    }
    if (item?.status && !VALID_STATUSES.includes(item.status)) {
      shapeErrors.push(`${label}: invalid status "${item.status}"`);
    }
    if (item?.language && !VALID_LANGUAGES.includes(item.language)) {
      shapeErrors.push(`${label}: unrecognized language "${item.language}"`);
    }
    if (item?.scheduledFor && Number.isNaN(Date.parse(item.scheduledFor))) {
      shapeErrors.push(`${label}: unparseable scheduledFor "${item.scheduledFor}"`);
    }
  });

  const now = new Date();
  const byStatus = { queued: 0, posted: 0, skipped: 0 };
  const byLanguage = {};
  const overdueQueued = [];

  for (const item of queue) {
    if (item?.status in byStatus) byStatus[item.status]++;
    if (item?.language) byLanguage[item.language] = (byLanguage[item.language] ?? 0) + 1;
    if (item?.status === "queued" && Date.parse(item.scheduledFor) < now.getTime()) {
      overdueQueued.push({ id: item.id, title: item.title, scheduledFor: item.scheduledFor });
    }
  }

  const nextQueued = queue
    .filter((p) => p?.status === "queued")
    .sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor))
    .map((p) => ({ id: p.id, title: p.title, language: p.language, scheduledFor: p.scheduledFor }))[0] ?? null;

  const healthy = shapeErrors.length === 0 && overdueQueued.length === 0;

  const status = {
    checkedAt: now.toISOString(),
    source: "data/content-queue.json",
    totalItems: queue.length,
    byStatus,
    byLanguage,
    nextQueued,
    overdueQueued,
    shapeErrors,
    healthy,
  };

  writeFileSync(statusJsonPath, `${JSON.stringify(status, null, 2)}\n`);
  appendFileSync(
    statusLogPath,
    `${status.checkedAt}  total=${status.totalItems} queued=${byStatus.queued} posted=${byStatus.posted} ` +
      `skipped=${byStatus.skipped} overdue=${overdueQueued.length} shapeErrors=${shapeErrors.length} ` +
      `next=${nextQueued ? `${nextQueued.id}@${nextQueued.scheduledFor}` : "none"}\n`,
  );

  console.log(`Checked ${queue.length} item(s) in ${queuePath}`);
  console.log(`  queued=${byStatus.queued} posted=${byStatus.posted} skipped=${byStatus.skipped}`);
  console.log(`  languages: ${JSON.stringify(byLanguage)}`);
  console.log(
    nextQueued
      ? `  next up: "${nextQueued.title}" (${nextQueued.language}) at ${nextQueued.scheduledFor}`
      : "  next up: nothing queued",
  );

  if (shapeErrors.length > 0) {
    console.error(`✖ ${shapeErrors.length} shape issue(s):`);
    shapeErrors.forEach((e) => console.error(`  - ${e}`));
  }

  if (overdueQueued.length > 0) {
    console.error(
      `✖ ${overdueQueued.length} item(s) are past their scheduledFor but still "queued" — the n8n pipeline may not be running:`,
    );
    overdueQueued.forEach((o) => console.error(`  - ${o.id} "${o.title}" was due ${o.scheduledFor}`));
  }

  if (healthy) {
    console.log("✔ Queue looks healthy — no shape issues, nothing overdue.");
  } else {
    process.exitCode = 1;
  }

  console.log(`Status written to ${statusJsonPath}`);
  console.log(`Log appended to ${statusLogPath}`);
}

main();
