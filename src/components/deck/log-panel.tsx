import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRelative } from "@/lib/format";
import { useDeckStore } from "@/lib/store";
import type { RevenueSource, Stats } from "@/lib/types";

const SOURCES: { id: RevenueSource; label: string }[] = [
  { id: "x", label: "X ads" },
  { id: "tips", label: "Tips" },
  { id: "other", label: "Other" },
];

export function LogPanel({
  requestPinConfirm,
}: {
  requestPinConfirm: (actionLabel: string) => Promise<boolean>;
}) {
  const addRevenue = useDeckStore((s) => s.addRevenue);
  const addNote = useDeckStore((s) => s.addNote);
  const patchStats = useDeckStore((s) => s.patchStats);
  const notes = useDeckStore((s) => s.notes);
  const logs = useDeckStore((s) => s.revenueLogs);
  const stats = useDeckStore((s) => s.stats);
  const replyLog = useDeckStore((s) => s.replyLog);
  const replyCandidates = useDeckStore((s) => s.replyCandidates);

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<RevenueSource>("tips");
  const [revNote, setRevNote] = useState("");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<Partial<Stats>>({});
  const [committingTelemetry, setCommittingTelemetry] = useState(false);

  return (
    <Card className="h-full" id="log-panel">
      <CardHeader>
        <CardTitle>Mission log</CardTitle>
        <CardDescription>
          Revenue and notes stay hand-logged (X doesn't expose that data); Telemetry now shows
          what the live sync pulled in, and Replies is a record of what n8n auto-sent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="haul">
          <TabsList>
            <TabsTrigger value="haul">Haul</TabsTrigger>
            <TabsTrigger value="note">Note</TabsTrigger>
            <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="engage">Engage</TabsTrigger>
          </TabsList>

          <TabsContent value="haul" className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="rev-amount">Amount (USD)</Label>
                <Input
                  id="rev-amount"
                  type="number"
                  min={1}
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="180"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rev-source">Source</Label>
                <select
                  id="rev-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as RevenueSource)}
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {SOURCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rev-note">Dispatch</Label>
              <Input
                id="rev-note"
                value={revNote}
                onChange={(e) => setRevNote(e.target.value)}
                placeholder="A stranger tipped like they meant it."
              />
            </div>
            <Button
              type="button"
              variant="gold"
              onClick={() => {
                const n = Number(amount);
                if (!Number.isFinite(n) || n <= 0) {
                  toast("Treasury rejected that number. Try a real haul.");
                  return;
                }
                addRevenue(source, n, revNote);
                setAmount("");
                setRevNote("");
                toast("Haul logged. The vault just got louder.");
              }}
            >
              Log haul
            </Button>
            <ul className="space-y-2">
              {logs.slice(0, 4).map((l) => (
                <li key={l.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {SOURCES.find((s) => s.id === l.source)?.label} · {formatRelative(l.at)}
                  </span>
                  <span className="tabular-nums text-accent">{formatCurrency(l.amount)}</span>
                </li>
              ))}
              {logs.length === 0 ? (
                <li className="text-sm text-muted-foreground">Treasury sensors idle. Log a haul.</li>
              ) : null}
            </ul>
          </TabsContent>

          <TabsContent value="note" className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cmd-note">Transmission</Label>
              <Textarea
                id="cmd-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="The 2am post outperformed noon. Stop negotiating with daytime."
              />
            </div>
            <Button
              type="button"
              onClick={() => {
                if (!note.trim()) return;
                addNote(note);
                setNote("");
                toast("Logged. Future-you will pretend they planned this.");
              }}
            >
              Drop transmission
            </Button>
            <ul className="space-y-3">
              {notes.length === 0 ? (
                <li className="text-sm text-muted-foreground">Mission log is dark. Drop a transmission.</li>
              ) : (
                notes.slice(0, 5).map((n) => (
                  <li key={n.id} className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-sm leading-relaxed">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(n.at)}</p>
                  </li>
                ))
              )}
            </ul>
          </TabsContent>

          <TabsContent value="telemetry" className="grid gap-3">
            <p className="text-xs text-muted-foreground">
              Auto-filled by the live sync from n8n. Edit and commit here only to correct or
              override a value locally — the next sync overwrites it with what's actually on X.
            </p>
            {(
              [
                ["followers", "Followers", stats.followers],
                ["impressions24h", "24h impressions", stats.impressions24h],
                ["impressions7d", "7d impressions", stats.impressions7d],
                ["engagement", "Engagement %", stats.engagement],
                ["postsWeek", "Posts this week", stats.postsWeek],
              ] as const
            ).map(([key, label, current]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={`tel-${key}`}>{label}</Label>
                <Input
                  id={`tel-${key}`}
                  type="number"
                  defaultValue={current}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              disabled={committingTelemetry}
              onClick={async () => {
                setCommittingTelemetry(true);
                const ok = await requestPinConfirm("commit telemetry changes");
                setCommittingTelemetry(false);
                if (!ok) return;
                const clean: Partial<Stats> = {};
                for (const [k, v] of Object.entries(draft) as [keyof Stats, number][]) {
                  if (typeof v === "number" && Number.isFinite(v)) {
                    (clean as Record<string, number>)[k] = v;
                  }
                }
                patchStats(clean);
                toast("Telemetry patched. The visor just recalibrated.");
              }}
            >
              Commit telemetry
            </Button>
          </TabsContent>

          <TabsContent value="replies" className="grid gap-3">
            <p className="text-xs text-muted-foreground">
              Posted automatically by n8n with no review step — this is a read-only record of what
              went out, not a queue. See AUTOMATION_GUIDE.md to switch to review-before-send.
            </p>
            <ul className="space-y-2">
              {replyLog.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No auto-replies logged yet. They'll show up here once the n8n reply flow is active.
                </li>
              ) : (
                [...replyLog]
                  .sort((a, b) => Date.parse(b.repliedAt) - Date.parse(a.repliedAt))
                  .slice(0, 20)
                  .map((r) => (
                    <li key={r.replyTweetId || r.mentionId} className="rounded-xl bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Replying to <span className="text-foreground">@{r.mentionAuthor}</span>:{" "}
                        <span className="italic">"{r.mentionText}"</span>
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed">{r.replyText}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatRelative(r.repliedAt)}
                      </p>
                    </li>
                  ))
              )}
            </ul>
          </TabsContent>

          <TabsContent value="engage" className="grid gap-3">
            <p className="text-xs text-muted-foreground">
              Recent posts from your curated list — n8n finds them, you decide if any earns a
              reply. Aim for 1–2 a day, only when you actually have something sharp to add.
            </p>
            <ul className="space-y-2">
              {replyCandidates.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No candidates yet. The scan runs twice a day — check back after the next run.
                </li>
              ) : (
                [...replyCandidates]
                  .sort((a, b) => Date.parse(b.discoveredAt) - Date.parse(a.discoveredAt))
                  .map((c) => (
                    <li key={c.tweetId} className="rounded-xl bg-secondary/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">@{c.accountUsername}</p>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-xs text-primary underline underline-offset-2"
                        >
                          Reply on X <ExternalLink className="size-3" />
                        </a>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed">{c.text}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatRelative(c.createdAt)}
                      </p>
                    </li>
                  ))
              )}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
