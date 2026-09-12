import { useState, type ReactNode } from "react";
import { CalendarClock, Check, Download, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatScheduled } from "@/lib/format";
import { useDeckStore } from "@/lib/store";
import {
  POST_LANGUAGE_LABEL,
  type PostLanguage,
  type QueuedPostStatus,
  type ScheduledPost,
} from "@/lib/types";

const STATUS_LABEL: Record<QueuedPostStatus, string> = {
  queued: "Queued",
  posted: "Posted",
  skipped: "Skipped",
};

const LANGUAGES = Object.keys(POST_LANGUAGE_LABEL) as PostLanguage[];

/** Quick-view renderer for **bold**, *italic*, `code`, and [text](url) — no markdown dependency needed for short post copy. */
function renderMarkdownLite(text: string, keyPrefix: string): ReactNode[] {
  const inline = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  return text.split("\n").flatMap((line, li) => {
    const nodes: ReactNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = inline.exec(line))) {
      if (match.index > last) nodes.push(line.slice(last, match.index));
      if (match[1]) {
        nodes.push(<strong key={`${keyPrefix}-${li}-${idx}`}>{match[2]}</strong>);
      } else if (match[3]) {
        nodes.push(<em key={`${keyPrefix}-${li}-${idx}`}>{match[4]}</em>);
      } else if (match[5]) {
        nodes.push(
          <code key={`${keyPrefix}-${li}-${idx}`} className="rounded bg-black/30 px-1 py-0.5 text-[0.9em]">
            {match[6]}
          </code>,
        );
      } else if (match[7]) {
        nodes.push(
          <a
            key={`${keyPrefix}-${li}-${idx}`}
            href={match[9]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {match[8]}
          </a>,
        );
      }
      last = inline.lastIndex;
      idx++;
    }
    if (last < line.length) nodes.push(line.slice(last));
    return li === 0 ? nodes : [<br key={`${keyPrefix}-br-${li}`} />, ...nodes];
  });
}

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

/** Downloads the live queue as content-queue.json, ready to commit into data/ for the automation layer (see AUTOMATION_GUIDE.md). */
function exportQueueJson(queue: ScheduledPost[]) {
  const blob = new Blob([JSON.stringify(queue, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "content-queue.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ContentQueuePanel({
  requestPinConfirm,
}: {
  requestPinConfirm: (actionLabel: string) => Promise<boolean>;
}) {
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
  const [language, setLanguage] = useState<PostLanguage>("en");
  const [scheduledFor, setScheduledFor] = useState(defaultScheduleValue());

  const ordered = [...queue].sort(
    (a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor),
  );
  const previewLanguages = Array.from(new Set(ordered.map((p) => p.language)));

  return (
    <Card className="h-full" id="content-queue">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Launch queue</CardTitle>
          <CardDescription>Transmissions staged for the automation layer to fire.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={queue.length === 0}
            onClick={async () => {
              const ok = await requestPinConfirm("export the content queue");
              if (!ok) return;
              exportQueueJson(queue);
              toast("Queue exported. Commit it to data/content-queue.json — see AUTOMATION_GUIDE.md.");
            }}
          >
            <Download className="size-3.5" />
            Export
          </Button>
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
                    language,
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
                    placeholder="Supports **bold**, *italic*, `code`, and [links](https://x.com)."
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
                    <Label htmlFor="q-language">Language</Label>
                    <select
                      id="q-language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as PostLanguage)}
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {POST_LANGUAGE_LABEL[l]}
                        </option>
                      ))}
                    </select>
                  </div>
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
                <Button type="submit" className="mt-1">
                  Add to queue
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="queue">
          <TabsList>
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
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
                      {p.body ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.body}</p>
                      ) : null}
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
                      <Badge variant="outline">{POST_LANGUAGE_LABEL[p.language]}</Badge>
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
          </TabsContent>

          <TabsContent value="preview" className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {ordered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing to preview yet. Stage a transmission to see the rendered quick-view.
              </p>
            ) : (
              previewLanguages.map((lang) => (
                <div key={lang}>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {POST_LANGUAGE_LABEL[lang]}
                  </p>
                  <div className="space-y-2">
                    {ordered
                      .filter((p) => p.language === lang)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl border-l-2 border-primary/50 bg-secondary/30 p-3"
                        >
                          <p className="font-display text-sm font-semibold leading-snug">
                            {renderMarkdownLite(p.title, `${p.id}-t`)}
                          </p>
                          {p.body ? (
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                              {renderMarkdownLite(p.body, `${p.id}-b`)}
                            </p>
                          ) : null}
                          <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                            {p.vertical} · {formatScheduled(p.scheduledFor)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
