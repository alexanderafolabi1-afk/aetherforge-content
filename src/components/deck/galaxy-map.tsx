import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useDeckStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function GalaxyMap() {
  const verticals = useDeckStore((s) => s.verticals);
  const setExploration = useDeckStore((s) => s.setVerticalExploration);
  const [active, setActive] = useState(verticals[0]?.id ?? "threads");
  const current = verticals.find((v) => v.id === active) ?? verticals[0];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Progress galaxy</CardTitle>
        <CardDescription>Each planet is a content vertical. Explore them like a cartographer with an ego.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-xl bg-[#07060d] p-4">
          <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_20%_20%,rgb(107_76_255/0.18),transparent_42%),radial-gradient(circle_at_80%_80%,rgb(77_232_255/0.12),transparent_46%)]" />
          <div className="relative grid grid-cols-3 gap-2 sm:gap-3">
            {verticals.map((v) => {
              const selected = v.id === active;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActive(v.id)}
                  className={cn(
                    "group relative flex flex-col items-center rounded-xl p-2 text-center transition-[box-shadow,transform] duration-150",
                    selected ? "shadow-[var(--shadow-glow)]" : "opacity-80 hover:opacity-100",
                  )}
                >
                  <span className="relative block size-[72px] sm:size-[88px]">
                    <img
                      src={v.planet}
                      alt=""
                      width={160}
                      height={160}
                      className="size-full rounded-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
                    />
                    <span className="absolute inset-x-1 bottom-1 rounded-full bg-background/70 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary tabular-nums backdrop-blur-sm">
                      {v.exploration}%
                    </span>
                  </span>
                  <span className="mt-2 text-xs font-medium">{v.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {v.callsign}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {current ? (
          <div className="mt-4 rounded-xl bg-secondary/50 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {current.name} · {current.callsign}
                </p>
                <p className="text-xs text-muted-foreground">{current.brief}</p>
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">{current.posts} launches</p>
            </div>
            <Progress value={current.exploration} className="mt-3" />
            <div className="mt-3 grid gap-1.5">
              <Label htmlFor="explore-range">Charted territory</Label>
              <input
                id="explore-range"
                type="range"
                min={0}
                max={100}
                value={current.exploration}
                onChange={(e) => setExploration(current.id, Number(e.target.value))}
                className="h-11 w-full accent-primary"
              />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
