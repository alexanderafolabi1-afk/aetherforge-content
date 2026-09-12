import { CalendarClock, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatScheduled } from "@/lib/format";
import { nextQueuedPost, useDeckStore } from "@/lib/store";
import { POST_LANGUAGE_LABEL } from "@/lib/types";

export function UpcomingPostCard() {
  const queue = useDeckStore((s) => s.contentQueue);
  const next = nextQueuedPost(queue);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
            <Radio className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Next up
            </p>
            {next ? (
              <p className="truncate text-sm font-medium leading-snug">{next.title}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Queue is empty. Nothing scheduled.</p>
            )}
          </div>
        </div>
        {next ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{POST_LANGUAGE_LABEL[next.language]}</Badge>
            <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {formatScheduled(next.scheduledFor)}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
