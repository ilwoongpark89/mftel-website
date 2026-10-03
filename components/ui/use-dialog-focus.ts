"use client";

import { useEffect, useRef } from "react";

/** Keep keyboard and scrolling inside a modal, then restore the opening control. */
export function useDialogFocus(open: boolean) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const controls = () => Array.from(ref.current?.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea") ?? []);
        controls()[0]?.focus({ preventScroll: true });
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Tab") return;
            const items = controls(), first = items[0], last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = overflow;
            window.removeEventListener("keydown", onKey);
            if (previous?.isConnected) previous.focus({ preventScroll: true });
        };
    }, [open]);
    return ref;
}
