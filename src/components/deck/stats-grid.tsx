import {
  Activity,
  Coins,
  Eye,
  Flame,
  Radio,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { CountUp } from "./count-up";
import { formatCompact, formatCurrency, formatInt, formatPct } from "@/lib/format";
import { monthlyRevenue, useDeckStore } from "@/lib/store";
import type { LucideIcon } from "lucide-react";

type CardDef = {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  value: number;
  format: (n: number) => string;
  gold?: boolean;
  spark?: { v: number }[];
};

export function StatsGrid() {
  const stats = useDeckStore((s) => s.stats);
  const revenue = monthlyRevenue(stats);
  const spark = stats.sparkline.map((v) => ({ v }));

  const cards: CardDef[] = [
    {
      key: "followers",
      label: "Followers",
      hint: "Souls in the wake",
      icon: Users,
      value: stats.followers,
      format: formatInt,
    },
    {
      key: "i24",
      label: "24h impressions",
      hint: "Last rotation",
      icon: Eye,
      value: stats.impressions24h,
      format: formatCompact,
      spark,
    },
    {
      key: "i7",
      label: "7d impressions",
      hint: "Week-side burn",
      icon: Radio,
      value: stats.impressions7d,
      format: formatCompact,
    },
    {
      key: "eng",
      label: "Engagement",
      hint: "Signal vs noise",
      icon: Activity,
      value: stats.engagement,
      format: formatPct,
    },
    {
      key: "rev",
      label: "Est. monthly revenue",
      hint: "X + tips + other",
      icon: Coins,
      value: revenue,
      format: formatCurrency,
      gold: true,
    },
    {
      key: "posts",
      label: "Posts this week",
      hint: "Ships out of bay",
      icon: Flame,
      value: stats.postsWeek,
      format: (n) => `${Math.round(n)}`,
    },
  ];

  return (
    <section aria-label="Live telemetry" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => (
        <Card
          key={c.key}
          className={`enter-up stagger-${(i % 6) + 1} relative overflow-hidden p-4 transition-[box-shadow] duration-150`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {c.label}
            </p>
            <c.icon className={c.gold ? "size-4 text-accent" : "size-4 text-primary"} />
          </div>
          <p
            className={`mt-3 font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${c.gold ? "text-accent" : ""}`}
          >
            <CountUp value={c.value} format={c.format} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          {c.spark ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={c.spark} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.18}
                    strokeWidth={1.4}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </Card>
      ))}
    </section>
  );
}
