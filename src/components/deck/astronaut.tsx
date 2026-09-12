import { cn } from "@/lib/utils";
import type { AstronautMood } from "@/lib/types";

const FLOAT: Record<AstronautMood, string> = {
  idle: "[animation:float-y_7s_ease-in-out_infinite]",
  steady: "[animation:float-y_5.5s_ease-in-out_infinite]",
  thriving: "[animation:float-y_4.2s_ease-in-out_infinite]",
  blazing: "[animation:float-y-fast_3.2s_ease-in-out_infinite]",
};

export function Astronaut({
  mood,
  celebrating,
}: {
  mood: AstronautMood;
  celebrating: boolean;
}) {
  return (
    <div className="relative mx-auto aspect-square w-[min(58vw,280px)] sm:w-[300px] lg:w-[340px]">
      <div
        className={cn(
          "absolute left-1/2 top-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl",
          celebrating
            ? "bg-accent/35"
            : mood === "blazing"
              ? "bg-primary/30"
              : "bg-primary/18",
        )}
        aria-hidden
      />
      <img
        src={`${import.meta.env.BASE_URL}brand/astronaut.png`}
        alt="AetherForge astronaut, visor reflecting a nebula"
        width={720}
        height={720}
        className={cn(
          "relative z-10 h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(77,232,255,0.18)] transition-transform duration-500",
          celebrating ? "[animation:float-y-fast_1.6s_ease-in-out_infinite]" : FLOAT[mood],
        )}
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-[28%] z-20 rounded-full bg-primary/20 blur-2xl [animation:visor-pulse_2.8s_ease-in-out_infinite]"
        aria-hidden
      />
    </div>
  );
}
