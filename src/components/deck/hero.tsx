import { Radio } from "lucide-react";
import { Astronaut } from "./astronaut";
import { APP_CALLSIGN, greetingForHour, MOOD_STATUS } from "@/lib/copy";
import { astronautMood } from "@/lib/store";
import { useDeckStore } from "@/lib/store";

export function Hero({ celebrating }: { celebrating: boolean }) {
  const commanderName = useDeckStore((s) => s.commanderName);
  const stats = useDeckStore((s) => s.stats);
  const streak = useDeckStore((s) => s.streak);
  const mood = astronautMood({ stats, streak });
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-background/25">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(107_76_255/0.18),transparent_42%),radial-gradient(circle_at_88%_80%,rgb(77_232_255/0.12),transparent_46%)]" />
      <div className="relative z-10 grid items-center gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-4 lg:py-6">
        <div className="enter-up max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-primary">
            {APP_CALLSIGN}
          </p>
          <h1 className="font-display mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            {greeting}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            {commanderName}, your influence is achieving escape velocity. {MOOD_STATUS[mood]}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <Radio className="size-3.5 text-primary" />
            <span>Uplink live · visor {mood}</span>
          </div>
        </div>
        <div className="enter-up stagger-3">
          <Astronaut mood={mood} celebrating={celebrating} />
        </div>
      </div>
    </section>
  );
}
