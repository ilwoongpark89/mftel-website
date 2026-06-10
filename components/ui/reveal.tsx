"use client";

import { useEffect, useRef } from "react";

/**
 * Frame-0-safe scroll reveal. Server HTML is always fully visible; on mount,
 * elements still below the fold get .reveal-pending and one shared
 * IntersectionObserver lifts them in (12px rise, 500ms, once). Reduced motion
 * and no-JS render static content by construction.
 */
let sharedObserver: IntersectionObserver | null = null;

function observe(el: Element) {
    if (!sharedObserver) {
        sharedObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("reveal-in");
                        sharedObserver?.unobserve(entry.target);
                    }
                }
            },
            { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
        );
    }
    sharedObserver.observe(el);
}

export default function Reveal({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (el.getBoundingClientRect().top <= window.innerHeight) return; // already on screen — never hide
        el.classList.add("reveal-pending");
        observe(el);
        // failsafe: content may never stay hidden (jump-scrolls, bots, print, odd
        // IntersectionObserver timing) — force-reveal after 2s regardless.
        const failsafe = window.setTimeout(() => {
            el.classList.add("reveal-in");
            sharedObserver?.unobserve(el);
        }, 2000);
        return () => {
            window.clearTimeout(failsafe);
            sharedObserver?.unobserve(el);
        };
    }, []);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}
