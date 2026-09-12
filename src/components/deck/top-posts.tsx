import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompact, formatCurrency, formatPct, formatRelative } from "@/lib/format";
import { useDeckStore } from "@/lib/store";

export function TopPosts() {
  const posts = useDeckStore((s) => s.posts);
  const ranked = [...posts].sort((a, b) => b.impressions - a.impressions);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Content highlights</CardTitle>
        <CardDescription>The transmissions that bent the field this week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The feed is a vacuum. Log a launch and we will put it on the wall.
          </p>
        ) : (
          ranked.map((p, i) => (
            <article key={p.id} className="rounded-xl bg-secondary/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{p.title}</p>
                <span className="font-display text-xs tabular-nums text-muted-foreground">
                  #{i + 1}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{p.vertical}</Badge>
                <span className="tabular-nums">{formatCompact(p.impressions)} eyes</span>
                <span className="tabular-nums">{formatPct(p.engagement)}</span>
                <span className="tabular-nums text-accent">{formatCurrency(p.revenue)}</span>
                <span className="ml-auto">{formatRelative(p.postedAt)}</span>
              </div>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
