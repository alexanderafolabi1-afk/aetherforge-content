import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact, formatCurrency, formatPct } from "@/lib/format";
import { monthlyRevenue, useDeckStore } from "@/lib/store";

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;

function OrbitRings({
  rings,
}: {
  rings: { r: number; pct: number; color: string; duration: string }[];
}) {
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
      {rings.map((ring) => {
        const c = 2 * Math.PI * ring.r;
        const dash = Math.max(0.06, Math.min(1, ring.pct / 100)) * c;
        return (
          <g key={ring.color}>
            <circle cx={CX} cy={CY} r={ring.r} fill="none" stroke="rgb(244 240 234 / 0.08)" strokeWidth="2.5" />
            <circle
              cx={CX}
              cy={CY}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
            <g
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                animation: `orbit-spin ${ring.duration} linear infinite`,
              }}
            >
              <circle cx={CX} cy={CY - ring.r} r="4" fill={ring.color} />
            </g>
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r="28" fill="var(--color-accent)" />
      <text
        x={CX}
        y={CY + 4}
        textAnchor="middle"
        fill="var(--color-accent-foreground)"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.08em"
      >
        YOU
      </text>
    </svg>
  );
}

export function OrbitVisual() {
  const stats = useDeckStore((s) => s.stats);
  const revenue = monthlyRevenue(stats);
  const data = [
    {
      label: "Followers",
      sub: "to 100K nation",
      value: formatCompact(stats.followers),
      pct: (stats.followers / 100_000) * 100,
      color: "#4de8ff",
      r: 92,
      duration: "28s",
    },
    {
      label: "Engagement",
      sub: "to 10% climate",
      value: formatPct(stats.engagement),
      pct: (stats.engagement / 10) * 100,
      color: "#6b4cff",
      r: 68,
      duration: "18s",
    },
    {
      label: "Revenue",
      sub: "to $10K apogee",
      value: formatCurrency(revenue),
      pct: (revenue / 10_000) * 100,
      color: "#e4c17a",
      r: 44,
      duration: "12s",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Growth orbit</CardTitle>
        <CardDescription>Three bodies. One commander. Watch the rings fill.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <OrbitRings rings={data} />
        <ul className="w-full min-w-0 flex-1 space-y-3">
          {data.map((r) => (
            <li key={r.label} className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: r.color }} />
                  {r.label}
                </p>
                <p className="text-xs text-muted-foreground">{r.sub}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-semibold tabular-nums">{r.value}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {Math.min(100, r.pct).toFixed(0)}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
