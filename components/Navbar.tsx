"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { SECTIONS, NAV_SECTIONS, JOIN_ID } from "@/lib/sections";

/**
 * CALORIMETER navbar — always light-on-paper (the dark-section detection
 * state machine is gone with the dark hero). 5 links from the shared section
 * manifest + EN|KR segmented control + one ember Join CTA. Scroll-spy = one
 * IntersectionObserver over the manifest, not per-scroll measurement.
 */
export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [navDark, setNavDark] = useState(true); // hero is dark — start dark
    const [activeId, setActiveId] = useState<string>("");
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    const { language, setLanguage, t } = useLanguage();
    const pathname = usePathname();
    const onHome = pathname === "/";

    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    // lock body scroll while the mobile sheet is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // hairline + tint after threshold
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // scroll-spy over the shared manifest (home only)
    useEffect(() => {
        if (!onHome) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                }
            },
            { rootMargin: "-20% 0px -70% 0px" }
        );
        for (const s of SECTIONS) {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, [onHome]);

    // dark-band awareness: any [data-nav-dark] element under the 64px top bar
    // flips the nav to its dark skin. Deterministic rect check per scroll frame
    // (IntersectionObserver edge-touch/jump-scroll cases are spec traps); the
    // elements are re-queried each pass so late-mounted dynamic bands count.
    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            let dark = false;
            document.querySelectorAll("[data-nav-dark]").forEach((el) => {
                const r = el.getBoundingClientRect();
                if (r.top < 64 && r.bottom > 0) dark = true;
            });
            setNavDark(dark);
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        update();
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [pathname]);

    const hrefFor = (id: string) => (onHome ? `#${id}` : `/#${id}`);
    const dk = navDark && !isOpen;

    const langToggle = (cls?: string) => (
        <div
            className={cn(
                "flex items-center rounded-lg border p-0.5 font-mono text-[13px] transition-colors duration-200",
                dk ? "border-white/15" : "border-hairline",
                cls
            )}
            role="group"
            aria-label="Language"
        >
            {(["EN", "KR"] as const).map((lang) => (
                <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    aria-pressed={language === lang}
                    className={cn(
                        "rounded-md px-2 py-0.5 transition-colors duration-150",
                        language === lang
                            ? dk
                                ? "bg-white/10 text-paper"
                                : "bg-well text-ink"
                            : dk
                              ? "text-stone-400 hover:text-paper"
                              : "text-ink-3 hover:text-ink"
                    )}
                >
                    {lang}
                </button>
            ))}
        </div>
    );

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 z-40 w-full transition-[background-color,border-color,box-shadow] duration-200",
                    isOpen
                        ? "bg-transparent"
                        : dk
                          ? scrolled
                              ? "border-b border-white/10 bg-coal/75 backdrop-blur-md"
                              : "border-b border-transparent bg-transparent"
                          : scrolled
                            ? "border-b border-hairline bg-paper/90 backdrop-blur-md"
                            : "border-b border-transparent bg-paper/90 backdrop-blur-md"
                )}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-8">
                    {/* wordmark */}
                    <a href={onHome ? "#home" : "/"} className="flex items-baseline gap-3">
                        <span
                            className={cn(
                                "text-lg font-bold tracking-tight transition-colors duration-200",
                                dk ? "text-paper" : "text-ink"
                            )}
                        >
                            MFTEL
                        </span>
                        <span
                            className={cn(
                                "hidden font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-200 xl:block",
                                dk ? "text-stone-400" : "text-ink-3"
                            )}
                        >
                            Multiphase Flow &amp; Thermal Engineering Lab
                        </span>
                    </a>

                    {/* desktop links */}
                    <div className="hidden items-center gap-7 lg:flex">
                        {NAV_SECTIONS.map((s) => (
                            <a
                                key={s.id}
                                href={hrefFor(s.id)}
                                className={cn(
                                    "text-sm font-medium underline-offset-[10px] transition-colors duration-150",
                                    activeId === s.id
                                        ? dk
                                            ? "text-paper underline decoration-ember-400 decoration-2"
                                            : "text-ink underline decoration-ember-600 decoration-2"
                                        : dk
                                          ? "text-stone-300 hover:text-paper"
                                          : "text-ink-2 hover:text-ink"
                                )}
                            >
                                {t(s.labelKey)}
                            </a>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 lg:flex">
                        {langToggle()}
                        <a
                            href={hrefFor(JOIN_ID)}
                            className={cn(
                                "inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors duration-150",
                                dk
                                    ? "bg-ember-600 hover:bg-ember-500"
                                    : "bg-ember-700 hover:bg-ember-800"
                            )}
                        >
                            {t("nav.joinUs")}
                        </a>
                    </div>

                    {/* mobile trigger */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "relative z-[60] -mr-2 flex h-11 w-11 items-center justify-center transition-colors duration-200 lg:hidden",
                            dk ? "text-paper" : "text-ink"
                        )}
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </nav>

            {/* mobile full-screen sheet */}
            {portalTarget &&
                isOpen &&
                createPortal(
                    <div className="fixed inset-0 z-50 bg-paper lg:hidden">
                        <div className="flex h-full flex-col justify-between px-8 pb-10 pt-24">
                            <nav className="flex flex-col gap-1">
                                {SECTIONS.filter((s) => s.nav || s.id === JOIN_ID).map((s) => (
                                    <a
                                        key={s.id}
                                        href={hrefFor(s.id)}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-baseline gap-4 border-b border-hairline py-4",
                                            s.id === JOIN_ID ? "text-ember-700" : "text-ink"
                                        )}
                                    >
                                        <span className="font-mono text-xs text-ink-3">{s.index}</span>
                                        <span className="text-2xl font-semibold tracking-tight">
                                            {t(s.labelKey)}
                                        </span>
                                    </a>
                                ))}
                            </nav>
                            {langToggle("self-start")}
                        </div>
                    </div>,
                    portalTarget
                )}
        </>
    );
}
