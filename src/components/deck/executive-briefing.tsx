import { Activity, ArrowUpRight, Coins, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact, formatCurrency, formatInt, formatPct } from "@/lib/format";
import { monthlyRevenue, useDeckStore } from "@/lib/store";
import { daysBetween, todayKey } from "@/lib/utils";

/** All numbers below are derived from real store data — no fabricated placeholders. */
export function ExecutiveBriefing() {
  const stats = useDeckStore((s) => s.stats);
  const posts = useDeckStore((s) => s.posts);
  const milestones = useDeckStore((s) => s.milestones);
  const commanderName = useDeckStore((s) => s.commanderName);

  const revenue = monthlyRevenue(stats);

  const spark = stats.sparkline;
  const prev = spark[spark.length - 2];
  const last = spark[spark.length - 1];
  const momentumPct = prev ? ((last - prev) / prev) * 100 : 0;

  const lastFollowerHit = milestones
    .filter((m) => m.metric === "followers" && m.hitAt)
    .sort((a, b) => Date.parse(b.hitAt as string) - Date.parse(a.hitAt as string))[0];
  const daysSinceHit = lastFollowerHit
    ? Math.max(1, daysBetween(lastFollowerHit.hitAt as string, todayKey()))
    : null;
  const followerPacePerDay =
    lastFollowerHit && daysSinceHit
      ? (stats.followers - lastFollowerHit.target) / daysSinceHit
      : null;

  const nextFollowerMilestone = milestones
    .filter((m) => m.metric === "followers" && !m.hitAt)
    .sort((a, b) => a.target - b.target)[0];
  const daysToNextMilestone =
    nextFollowerMilestone && followerPacePerDay && followerPacePerDay > 0
      ? Math.ceil((nextFollowerMilestone.target - stats.followers) / followerPacePerDay)
      : null;

  const verticalTotals = new Map<
    string,
    { impressions: number; engagementSum: number; engagementCount: number; revenue: number }
  >();
  for (const p of posts) {
    const cur = verticalTotals.get(p.vertical) ?? {
      impressions: 0,
      engagementSum: 0,
      engagementCount: 0,
      revenue: 0,
    };
    cur.impressions += p.impressions;
    cur.engagementSum += p.engagement;
    cur.engagementCount += 1;
    cur.revenue += p.revenue;
    verticalTotals.set(p.vertical, cur);
  }
  const topVerticals = Array.from(verticalTotals.entries())
    .map(([vertical, v]) => ({
      vertical,
      impressions: v.impressions,
      engagement: v.engagementSum / v.engagementCount,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 3);

  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-primary">
                Executive Briefing
              </p>
              <CardTitle className="mt-1">Morning performance summary</CardTitle>
            </div>
            <Badge variant="outline" className="tabular-nums">
              {now.toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Badge>
          </div>
          <CardDescription>
            {commanderName}, here's the state of the deck at a glance — engagement velocity,
            follower pace, estimated revenue, and this cycle's leading verticals.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Activity className="size-3.5 text-primary" />
              Engagement velocity
            </div>
            <p className="font-display mt-2 text-2xl font-bold tabular-nums">
              {formatPct(stats.engagement)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {momentumPct >= 0 ? "+" : ""}
              {momentumPct.toFixed(1)}% impressions momentum vs. the prior rotation
            </p>
          </div>

          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Users className="size-3.5 text-primary" />
              Follower growth
            </div>
            <p className="font-display mt-2 text-2xl font-bold tabular-nums">
              {formatCompact(stats.followers)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {followerPacePerDay
                ? `~${formatInt(Math.round(followerPacePerDay))}/day since the last gravity well`
                : "Hit a follower milestone to unlock pace tracking"}
            </p>
          </div>

          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Coins className="size-3.5 text-accent" />
              Estimated revenue
            </div>
            <p className="font-display mt-2 text-2xl font-bold tabular-nums text-accent">
              {formatCurrency(revenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">X + tips + other, this month</p>
          </div>

          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <TrendingUp className="size-3.5 text-primary" />
              Top verticals
            </div>
            {topVerticals.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No post data logged yet.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {topVerticals.map((v, i) => (
                  <li key={v.vertical} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      <span className="tabular-nums text-muted-foreground">{i + 1}.</span> {v.vertical}
                    </span>
                    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                      {formatCompact(v.impressions)} · {formatPct(v.engagement)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm leading-relaxed">
          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p>
            Engagement is running at {formatPct(stats.engagement)} with{" "}
            {momentumPct >= 0 ? "rising" : "cooling"} momentum ({momentumPct >= 0 ? "+" : ""}
            {momentumPct.toFixed(1)}% vs. the prior rotation).{" "}
            {followerPacePerDay
              ? `Followers are pacing ~${formatInt(Math.round(followerPacePerDay))}/day`
              : "Follower pace has no baseline yet"}
            {nextFollowerMilestone && daysToNextMilestone
              ? ` — at that rate, ${nextFollowerMilestone.title} lands in about ${daysToNextMilestone} day${daysToNextMilestone === 1 ? "" : "s"}.`
              : "."}{" "}
            Estimated monthly revenue sits at {formatCurrency(revenue)}.{" "}
            {topVerticals[0]
              ? `${topVerticals[0].vertical} is leading the field this cycle.`
              : "No vertical data logged yet."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
