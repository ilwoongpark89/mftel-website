"use client";

import { useEffect, useRef } from "react";

/**
 * Pool-boiling bubble field — the lab's own physics as the hero visual.
 * Bubbles nucleate at the heated bottom (ember-tinted), rise with wobble,
 * and fade out. Canvas pauses offscreen / hidden tab; prefers-reduced-motion
 * renders nothing (the static CSS glow underneath carries the scene).
 */

type Bubble = {
    x: number;
    y: number;
    r: number;
    vy: number;
    amp: number;
    phase: number;
    seed: number;
};

export default function HeroCanvas({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf = 0;
        let running = false;
        let W = 0;
        let H = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            W = canvas.offsetWidth;
            H = canvas.offsetHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();

        const COUNT = Math.max(36, Math.min(90, Math.floor(W / 16)));
        const spawn = (b?: Bubble): Bubble => {
            const big = Math.random() < 0.12;
            const nb: Bubble = b ?? ({} as Bubble);
            nb.x = Math.random() * W;
            nb.y = H + Math.random() * H * 0.4;
            nb.r = big ? 4 + Math.random() * 4 : 1 + Math.random() * 2.6;
            nb.vy = 24 + Math.random() * 46;
            nb.amp = 6 + Math.random() * 16;
            nb.phase = Math.random() * Math.PI * 2;
            nb.seed = Math.random();
            return nb;
        };
        const bubbles: Bubble[] = Array.from({ length: COUNT }, () => {
            const b = spawn();
            b.y = Math.random() * H; // initial fill
            return b;
        });

        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            ctx.clearRect(0, 0, W, H);
            for (const b of bubbles) {
                b.y -= b.vy * dt;
                if (b.y < -10) spawn(b);
                const x = b.x + Math.sin(b.y * 0.02 + b.phase) * b.amp;
                const lifecycle = 1 - b.y / H; // 0 bottom → 1 top
                const alpha =
                    lifecycle < 0.1
                        ? lifecycle / 0.1
                        : lifecycle > 0.78
                          ? Math.max(0, (1 - lifecycle) / 0.22)
                          : 1;
                // heated zone tint: ember near the bottom, cool white above
                const warm = b.y > H * 0.62;
                ctx.beginPath();
                ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
                ctx.fillStyle = warm
                    ? `rgba(255, 150, 80, ${alpha * (0.16 + b.seed * 0.22)})`
                    : `rgba(250, 250, 249, ${alpha * (0.1 + b.seed * 0.2)})`;
                ctx.fill();
                if (b.r > 4) {
                    ctx.strokeStyle = warm
                        ? `rgba(255, 150, 80, ${alpha * 0.35})`
                        : `rgba(250, 250, 249, ${alpha * 0.28})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            raf = requestAnimationFrame(tick);
        };

        const start = () => {
            if (running) return;
            running = true;
            last = performance.now();
            raf = requestAnimationFrame(tick);
        };
        const stop = () => {
            running = false;
            cancelAnimationFrame(raf);
        };

        const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), {
            threshold: 0.05,
        });
        io.observe(canvas);
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener("visibilitychange", onVis);
        window.addEventListener("resize", resize);

        return () => {
            stop();
            io.disconnect();
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
