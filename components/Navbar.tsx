"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { NAV_ROUTES } from "@/lib/sections";

/**
 * v3 navbar — the home page is a story, archives are routes. 5 route links +
 * EN|KR + one ember Join CTA. Dark/light skin follows [data-nav-dark] bands
 * under the 64px bar via a deterministic rect check per scroll frame
 * (IntersectionObserver edge-touch/jump-scroll cases are spec traps).
 */
export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [navDark, setNavDark] = useState(true);
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    const { language, setLanguage, t, lp } = useLanguage();
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

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // dark-band awareness — re-queried each pass so late-mounted bands count
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

    const dk = navDark && !isOpen;
    const joinHref = lp("/join");

    const langToggle = (forceDark?: boolean) => {
        const d = forceDark ?? dk;
        return (
            <div
                className={cn(
                    "flex items-center rounded-full border p-0.5 text-[13px] font-semibold transition-colors duration-200",
                    d ? "border-white/15" : "border-hairline"
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
                            "rounded-full px-2.5 py-0.5 transition-colors duration-150",
                            language === lang
                                ? d
                                    ? "bg-white/10 text-paper"
                                    : "bg-well text-ink"
                                : d
                                  ? "text-stone-400 hover:text-paper"
                                  : "text-ink-3 hover:text-ink"
                        )}
                    >
                        {lang}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 z-40 w-full transition-[background-color,border-color] duration-200",
                    isOpen
                        ? "bg-transparent"
                        : dk
                          ? scrolled
                              ? "border-b border-white/10 bg-coal/80 backdrop-blur-md"
                              : "border-b border-transparent bg-transparent"
                          : scrolled
                            ? "border-b border-hairline bg-paper/90 backdrop-blur-md"
                            : "border-b border-transparent bg-paper/90 backdrop-blur-md"
                )}
            >
                <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6 md:px-8">
                    <Link href={lp("/")} className="flex items-baseline gap-3">
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
                                "hidden text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 xl:block",
                                dk ? "text-stone-500" : "text-ink-3"
                            )}
                        >
                            Multiphase Flow &amp; Thermal Engineering Lab
                        </span>
                    </Link>

                    <div className="hidden items-center gap-7 lg:flex">
                        {NAV_ROUTES.map((r) => (
                            <Link
                                key={r.href}
                                href={lp(r.href)}
                                className={cn(
                                    "text-sm font-medium underline-offset-[10px] transition-colors duration-150",
                                    pathname === lp(r.href)
                                        ? dk
                                            ? "text-paper underline decoration-ember-400 decoration-2"
                                            : "text-ink underline decoration-ember-600 decoration-2"
                                        : dk
                                          ? "text-stone-300 hover:text-paper"
                                          : "text-ink-2 hover:text-ink"
                                )}
                            >
                                {t(r.labelKey)}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 lg:flex">
                        {langToggle()}
                        <a
                            href={joinHref}
                            className={cn(
                                "inline-flex h-9 items-center rounded-full px-4.5 text-sm font-semibold transition-colors duration-150",
                                // ghost on dark — the hero's filled CTA stays the only solid ember per viewport
                                dk
                                    ? "border border-ember-500/50 text-ember-300 hover:border-ember-400 hover:bg-ember-600/10"
                                    : "bg-ember-700 text-white hover:bg-ember-800"
                            )}
                        >
                            {t("nav.joinUs")}
                        </a>
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "relative z-[60] -mr-2 flex h-11 w-11 items-center justify-center transition-colors duration-200 lg:hidden",
                            isOpen ? "text-paper" : dk ? "text-paper" : "text-ink"
                        )}
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </nav>

            {/* mobile full-screen sheet — coal, matching the story */}
            {portalTarget &&
                isOpen &&
                createPortal(
                    <div className="fixed inset-0 z-50 bg-coal lg:hidden">
                        <div className="flex h-full flex-col justify-between px-8 pb-10 pt-24">
                            <nav className="flex flex-col">
                                {NAV_ROUTES.map((r, i) => (
                                    <Link
                                        key={r.href}
                                        href={lp(r.href)}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-baseline gap-4 border-b border-white/10 py-4"
                                    >
                                        <span className="text-[13px] font-semibold text-stone-500">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className="text-2xl font-bold tracking-tight text-paper">
                                            {t(r.labelKey)}
                                        </span>
                                    </Link>
                                ))}
                                <a
                                    href={joinHref}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-baseline gap-4 border-b border-white/10 py-4"
                                >
                                    <span className="text-[13px] font-semibold text-stone-500">
                                        {String(NAV_ROUTES.length + 1).padStart(2, "0")}
                                    </span>
                                    <span className="text-2xl font-bold tracking-tight text-ember-400">
                                        {t("nav.joinUs")}
                                    </span>
                                </a>
                            </nav>
                            {langToggle(true)}
                        </div>
                    </div>,
                    portalTarget
                )}
        </>
    );
}
