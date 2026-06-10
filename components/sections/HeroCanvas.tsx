"use client";

import { useEffect, useRef } from "react";

/**
 * Pool-boiling bubble field v2 — bubbles NUCLEATE at the heated bottom
 * (ember-bright), rise with wobble and depth variance, cool toward gray, and
 * dissolve before mid-height — so the physics of the lab reads at a glance
 * and nothing floats as dust in the top corners. Pauses offscreen / hidden
 * tab; prefers-reduced-motion renders nothing (CSS glow carries the scene).
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

        const DISSOLVE_Y = 0.32; // bubbles are gone above this fraction of height
        const COUNT = Math.max(30, Math.min(72, Math.floor(W / 22)));

        const spawn = (b?: Bubble, initial = false): Bubble => {
            const nb: Bubble = b ?? ({} as Bubble);
            const big = Math.random() < 0.1;
            // nucleation sites cluster toward the center of the heated wall
            nb.x = W * (0.5 + (Math.random() - 0.5) * 0.92);
            nb.y = initial ? H * (0.45 + Math.random() * 0.6) : H * (0.96 + Math.random() * 0.12);
            nb.r = big ? 3.5 + Math.random() * 3.5 : 1 + Math.random() * 2.2;
            nb.vy = 16 + nb.r * 7 + Math.random() * 18; // bigger = faster (buoyancy)
            nb.amp = 5 + Math.random() * 14;
            nb.phase = Math.random() * Math.PI * 2;
            nb.seed = Math.random();
            return nb;
        };
        const bubbles: Bubble[] = Array.from({ length: COUNT }, () => spawn(undefined, true));

        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            ctx.clearRect(0, 0, W, H);
            for (const b of bubbles) {
                b.y -= b.vy * dt;
                const frac = b.y / H; // 1 bottom → 0 top
                if (frac < DISSOLVE_Y - 0.06) {
                    spawn(b);
                    continue;
                }
                const x = b.x + Math.sin(b.y * 0.018 + b.phase) * b.amp;
                // fade in just above the wall, dissolve approaching DISSOLVE_Y
                const fadeIn = Math.min(1, Math.max(0, (1.02 - frac) / 0.07));
                const fadeOut = Math.min(1, Math.max(0, (frac - DISSOLVE_Y) / 0.18));
                const alpha = fadeIn * fadeOut;
                if (alpha <= 0.01) continue;
                // heat: ember at the wall, cooling to gray as it climbs
                const heat = Math.min(1, Math.max(0, (frac - 0.45) / 0.5));
                const cr = Math.round(180 + 75 * heat);
                const cg = Math.round(185 - 45 * heat);
                const cb = Math.round(190 - 110 * heat);
                const baseA = (0.1 + b.seed * 0.18 + heat * 0.2) * alpha;
                ctx.beginPath();
                ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${baseA})`;
                if (b.r > 3.5) {
                    ctx.shadowColor = `rgba(255, 140, 66, ${0.5 * heat * alpha})`;
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
                ctx.shadowBlur = 0;
                if (b.r > 3.5) {
                    ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(0.5, baseA * 1.6)})`;
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
