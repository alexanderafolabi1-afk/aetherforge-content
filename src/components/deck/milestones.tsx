import { Flag, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatCompact } from "@/lib/format";
import { METRIC_LABEL } from "@/lib/seed";
import { metricValue, useDeckStore } from "@/lib/store";
import type { MetricKey } from "@/lib/types";

const METRICS = Object.keys(METRIC_LABEL) as MetricKey[];

export function MilestonesPanel() {
  const milestones = useDeckStore((s) => s.milestones);
  const stats = useDeckStore((s) => s.stats);
  const streak = useDeckStore((s) => s.streak);
  const replay = useDeckStore((s) => s.replayMilestone);
  const addMilestone = useDeckStore((s) => s.addMilestone);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [metric, setMetric] = useState<MetricKey>("followers");
  const [target, setTarget] = useState("100000");

  const ordered = [...milestones].sort((a, b) => Number(Boolean(a.hitAt)) - Number(Boolean(b.hitAt)));

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Monuments. Hit one and the observatory loses its mind.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plant a flag</DialogTitle>
              <DialogDescription>
                Name the monument. When telemetry crosses the line, we throw a supernova.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(target);
                if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
                addMilestone({
                  title: title.trim(),
                  blurb: blurb.trim() || "A private treaty with the future.",
                  metric,
                  target: n,
                  winLine: `${title.trim()} is no longer a wish. It's a coordinate.`,
                });
                setTitle("");
                setBlurb("");
                setOpen(false);
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="ms-title">Callsign</Label>
                <Input
                  id="ms-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="100K nation-state"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ms-blurb">Why it matters</Label>
                <Input
                  id="ms-blurb"
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  placeholder="The day the void starts taking notes."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ms-metric">Instrument</Label>
                  <select
                    id="ms-metric"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as MetricKey)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {METRICS.map((m) => (
                      <option key={m} value={m}>
                        {METRIC_LABEL[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ms-target">Target</Label>
                  <Input
                    id="ms-target"
                    type="number"
                    min={1}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="mt-1">
                Lock the monument
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No monuments yet. Plant a flag. The void loves a dare.</p>
        ) : (
          ordered.map((m) => {
            const current = metricValue({ stats, streak }, m.metric);
            const pct = Math.min(100, (current / m.target) * 100);
            const hit = Boolean(m.hitAt);
            return (
              <article key={m.id} className="rounded-xl bg-secondary/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.blurb}</p>
                  </div>
                  {hit ? (
                    <Badge variant="gold">Captured</Badge>
                  ) : (
                    <Badge variant="outline">{formatCompact(m.target)}</Badge>
                  )}
                </div>
                <Progress value={hit ? 100 : pct} className="mt-3" />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {formatCompact(current)} / {formatCompact(m.target)} · {METRIC_LABEL[m.metric]}
                  </span>
                  {hit ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-accent hover:text-accent/80"
                      onClick={() => replay(m.id)}
                    >
                      <RotateCcw className="size-3" />
                      Replay
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Flag className="size-3" />
                      {pct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
