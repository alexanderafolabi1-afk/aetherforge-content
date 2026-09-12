import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

type Star = {
  x: number;
  y: number;
  z: number;
  r: number;
  tw: number;
  sp: number;
};

type Shot = { x: number; y: number; vx: number; vy: number; life: number };

export function Starfield({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let stars: Star[] = [];
    let shots: Shot[] = [];
    let t = 0;
    const mouse = { x: 0.5, y: 0.5 };
    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(220, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 1.4,
      }));
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
    };

    const spawnShot = () => {
      shots.push({
        x: Math.random() * w * 0.7,
        y: Math.random() * h * 0.45,
        vx: 4 + Math.random() * 5,
        vy: 1.4 + Math.random() * 2,
        life: 1,
      });
    };

    const paintNebula = () => {
      const n1 = ctx.createRadialGradient(
        w * 0.22,
        h * 0.3,
        0,
        w * 0.22,
        h * 0.3,
        Math.max(w, h) * 0.55,
      );
      n1.addColorStop(0, "rgba(107, 76, 255, 0.28)");
      n1.addColorStop(1, "rgba(107, 76, 255, 0)");
      ctx.fillStyle = n1;
      ctx.fillRect(0, 0, w, h);

      const n2 = ctx.createRadialGradient(
        w * 0.82,
        h * 0.7,
        0,
        w * 0.82,
        h * 0.7,
        Math.max(w, h) * 0.5,
      );
      n2.addColorStop(0, "rgba(77, 232, 255, 0.16)");
      n2.addColorStop(1, "rgba(77, 232, 255, 0)");
      ctx.fillStyle = n2;
      ctx.fillRect(0, 0, w, h);

      const n3 = ctx.createRadialGradient(
        w * 0.55,
        h * 0.15,
        0,
        w * 0.55,
        h * 0.15,
        Math.max(w, h) * 0.4,
      );
      n3.addColorStop(0, "rgba(228, 193, 122, 0.08)");
      n3.addColorStop(1, "rgba(228, 193, 122, 0)");
      ctx.fillStyle = n3;
      ctx.fillRect(0, 0, w, h);
    };

    const draw = () => {
      if (!running) return;
      t += 1;
      ctx.clearRect(0, 0, w, h);
      paintNebula();

      const px = reduced ? 0 : (mouse.x - 0.5) * 18;
      const py = reduced ? 0 : (mouse.y - 0.5) * 12;

      for (const s of stars) {
        const depth = 0.35 + s.z * 0.65;
        const tw = reduced ? 0.7 : 0.45 + 0.55 * Math.sin(t * 0.02 * s.sp + s.tw);
        ctx.beginPath();
        ctx.fillStyle = `rgba(244, 240, 234, ${0.25 + tw * 0.75})`;
        ctx.arc(s.x + px * depth, s.y + py * depth, s.r * depth, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) {
        if (t % 280 === 40) spawnShot();
        shots = shots.filter((sh) => sh.life > 0);
        for (const sh of shots) {
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life -= 0.012;
          ctx.strokeStyle = `rgba(77, 232, 255, ${Math.max(0, sh.life)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.x - sh.vx * 6, sh.y - sh.vy * 6);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });

    const onVis = () => {
      running = document.visibilityState !== "hidden";
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
