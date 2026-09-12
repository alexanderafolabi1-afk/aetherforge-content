import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Celebration } from "@/lib/store";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

export function CelebrationOverlay({
  event,
  onDismiss,
}: {
  event: Celebration;
  onDismiss: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#4de8ff", "#e4c17a", "#f4f0ea", "#6b4cff", "#5ee0a0"];
    const parts = Array.from({ length: 90 }, () => {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 7;
      return {
        x: w / 2,
        y: h / 2.2,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2,
        life: 1,
        c: colors[Math.floor(Math.random() * colors.length)] ?? "#4de8ff",
        r: 1.4 + Math.random() * 2.4,
      };
    });

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of parts) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life -= 0.01;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [event, reduced]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebrate-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        aria-label="Dismiss celebration"
        onClick={onDismiss}
      />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-glow)]">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40 [animation:shockwave_1.1s_ease-out_forwards]"
          aria-hidden
        />
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
          {event.kind === "checkin" ? "Cycle locked" : "Supernova"}
        </p>
        <h2 id="celebrate-title" className="font-display mt-2 text-2xl font-bold tracking-tight">
          {event.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{event.body}</p>
        <Button className="mt-5" onClick={onDismiss}>
          Resume the watch
        </Button>
        <button
          type="button"
          className="absolute right-2 top-2 rounded-md p-2 text-muted-foreground"
          onClick={onDismiss}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
