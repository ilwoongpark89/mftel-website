"use client";

import { useEffect, useRef } from "react";

/**
 * Frame-0-safe scroll reveal. Server HTML is always fully visible; on mount,
 * elements still below the fold get .reveal-pending and one shared
 * IntersectionObserver adds a brief opacity accent without hiding content. Reduced motion
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
            { rootMargin: "0px 0px -4% 0px", threshold: 0.05 }
        );
    }
    sharedObserver.observe(el);
}

export default function Reveal({
    as: Tag = "div",
    className,
    children,
}: {
    as?: "div" | "ul";
    className?: string;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (el.getBoundingClientRect().top <= window.innerHeight) return; // already on screen — never hide
        el.classList.add("reveal-pending");
        observe(el);
        return () => {
            sharedObserver?.unobserve(el);
        };
    }, []);

    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Tag ref={ref as any} className={className}>
            {children}
        </Tag>
    );
}
