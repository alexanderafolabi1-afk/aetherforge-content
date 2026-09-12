import { useState } from "react";
import { CalendarClock, Check, Plus, Trash2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatScheduled } from "@/lib/format";
import { useDeckStore } from "@/lib/store";
import type { QueuedPostStatus } from "@/lib/types";

const STATUS_LABEL: Record<QueuedPostStatus, string> = {
  queued: "Queued",
  posted: "Posted",
  skipped: "Skipped",
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function defaultScheduleValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalInputValue(d);
}

export function ContentQueuePanel() {
  const queue = useDeckStore((s) => s.contentQueue);
  const verticals = useDeckStore((s) => s.verticals);
  const queuePost = useDeckStore((s) => s.queuePost);
  const removeQueuedPost = useDeckStore((s) => s.removeQueuedPost);
  const markQueuePosted = useDeckStore((s) => s.markQueuePosted);
  const skipQueuedPost = useDeckStore((s) => s.skipQueuedPost);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [vertical, setVertical] = useState(verticals[0]?.name ?? "Threads");
  const [scheduledFor, setScheduledFor] = useState(defaultScheduleValue());

  const ordered = [...queue].sort(
    (a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor),
  );

  return (
    <Card className="h-full" id="content-queue">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Launch queue</CardTitle>
          <CardDescription>Transmissions staged for the automation layer to fire.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Queue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stage a transmission</DialogTitle>
              <DialogDescription>
                Drops into the queue. The automation layer picks up whatever's earliest.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim() || !scheduledFor) return;
                queuePost({
                  title: title.trim(),
                  body: body.trim(),
                  vertical,
                  scheduledFor: new Date(scheduledFor).toISOString(),
                });
                setTitle("");
                setBody("");
                setScheduledFor(defaultScheduleValue());
                setOpen(false);
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="q-title">Headline</Label>
                <Input
                  id="q-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The 2am post outperformed noon. Again."
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="q-body">Dispatch</Label>
                <Textarea
                  id="q-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Optional notes for whoever (or whatever) fires this."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="q-vertical">Vertical</Label>
                  <select
                    id="q-vertical"
                    value={vertical}
                    onChange={(e) => setVertical(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {verticals.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="q-time">Fires at</Label>
                  <Input
                    id="q-time"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="mt-1">
                Add to queue
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Queue is empty. Stage a transmission and the automation layer will have something to fire.
          </p>
        ) : (
          ordered.map((p) => (
            <article key={p.id} className="rounded-xl bg-secondary/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{p.title}</p>
                  {p.body ? <p className="mt-0.5 text-xs text-muted-foreground">{p.body}</p> : null}
                </div>
                <Badge
                  variant={
                    p.status === "posted" ? "gold" : p.status === "skipped" ? "outline" : "primary"
                  }
                >
                  {STATUS_LABEL[p.status]}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{p.vertical}</Badge>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <CalendarClock className="size-3" />
                    {formatScheduled(p.scheduledFor)}
                  </span>
                </span>
                {p.status === "queued" ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md p-1.5 text-success hover:bg-success/10"
                      aria-label="Mark posted"
                      onClick={() => markQueuePosted(p.id)}
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                      aria-label="Skip"
                      onClick={() => skipQueuedPost(p.id)}
                    >
                      <X className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                      aria-label="Remove"
                      onClick={() => removeQueuedPost(p.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-destructive hover:text-destructive/80"
                    onClick={() => removeQueuedPost(p.id)}
                  >
                    <Trash2 className="size-3" />
                    Remove
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
