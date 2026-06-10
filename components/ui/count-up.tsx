"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Frame-0-safe count-up: server HTML carries the final value; once the
 * element scrolls into view, JS replays 0 → value (1.2s ease-out). Reduced
 * motion keeps the static number.
 */
export default function CountUp({ to, className }: { to: number; className?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setArmed(true);
                    io.disconnect();
                }
            },
            { threshold: 0.6 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        if (!armed) return;
        const el = ref.current;
        if (!el) return;
        const dur = 1200;
        const t0 = performance.now();
        let raf = 0;
        const step = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.round(to * eased));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [armed, to]);

    return (
        <span ref={ref} className={className}>
            {to}
        </span>
    );
}
