"use client";

import { useState, useEffect, useRef } from "react";
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
export default function Navbar({ tone = "light" }: { tone?: "light" | "dark" }) {
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [navDark, setNavDark] = useState(false);
    const { language, setLanguage, t, lp } = useLanguage();
    // 현재 경로 정규화 — 프록시가 /ko/* 로 다시 쓴 경로나 끝 슬래시가 섞여도 같은 페이지로 본다
    const current = (pathname || "/").replace(/^\/ko(?=\/|$)/, "").replace(/\/+$/, "") || "/";

    // Keep the sheet scrollable on short screens and return keyboard focus on close.
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.activeElement as HTMLElement | null;
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const focusable = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []);
        focusable()[0]?.focus({ preventScroll: true });
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") { event.preventDefault(); setIsOpen(false); }
            if (event.key !== "Tab") return;
            const items = focusable(), first = items[0], last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        const onResize = () => { if (window.innerWidth >= 1024) setIsOpen(false); };
        window.addEventListener("keydown", onKey);
        window.addEventListener("resize", onResize);
        return () => {
            document.body.style.overflow = oldOverflow;
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", onResize);
            if (previous?.isConnected) previous.focus({ preventScroll: true });
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
                if (r.top <= 64 && r.bottom > 0) dark = true;
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

    const dk = (tone === "dark" || navDark) && !isOpen;
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
                aria-label={language === "KR" ? "언어 선택" : "Language"}
            >
                {(["EN", "KR"] as const).map((lang) => (
                    <button
                        key={lang}
                        onClick={() => { setLanguage(lang); setIsOpen(false); }}
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
                              : "border-b border-transparent bg-coal/90"
                          : scrolled
                            ? "border-b border-hairline bg-paper/90 backdrop-blur-md"
                            : "border-b border-transparent bg-paper/90 backdrop-blur-md"
                )}
            >
                <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6 md:px-8">
                    <Link href={lp("/")} className="flex shrink-0 items-baseline">
                        <span
                            className={cn(
                                "text-lg font-bold tracking-tight transition-colors duration-200",
                                dk ? "text-paper" : "text-ink"
                            )}
                        >
                            MFTEL
                        </span>
                    </Link>

                    <div className="hidden items-center gap-5 lg:flex xl:gap-7">
                        {NAV_ROUTES.map((r) => {
                            const cls = cn(
                                "whitespace-nowrap text-sm font-medium underline-offset-[10px] transition-colors duration-150",
                                current === lp(r.href)
                                    ? dk
                                        ? "text-paper underline decoration-ember-400 decoration-2"
                                        : "text-ink underline decoration-ember-600 decoration-2"
                                    : dk
                                      ? "text-stone-300 hover:text-paper"
                                      : "text-ink-2 hover:text-ink"
                            );
                            // /lecture 특례 제거(2026-08-08): bare /lecture 는 이제 사이트 자신의 강의 페이지 —
                            //   전 항목이 같은 로케일 <Link> 문법. 플랫폼 프록시는 /lecture/{home,…} 하위만.
                            return (
                                <Link key={r.href} href={lp(r.href)} aria-current={current === lp(r.href) ? "page" : undefined} className={cls}>
                                    {t(r.labelKey)}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden shrink-0 items-center gap-3 lg:flex">
                        {langToggle()}
                        <Link
                            href={joinHref}
                            className={cn(
                                "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-4.5 text-sm font-semibold transition-colors duration-150",
                                // ghost on dark — the hero's filled CTA stays the only solid ember per viewport
                                dk
                                    ? "border border-ember-500/50 text-ember-300 hover:border-ember-400 hover:bg-ember-600/10"
                                    : "bg-ember-700 text-white hover:bg-ember-800"
                            )}
                        >
                            {t("nav.joinUs")}
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "relative z-[60] -mr-2 flex h-11 w-11 items-center justify-center transition-colors duration-200 lg:hidden",
                            isOpen ? "text-paper" : dk ? "text-paper" : "text-ink"
                        )}
                        aria-label={language === "KR" ? "메뉴 열기/닫기" : "Toggle menu"}
                        aria-expanded={isOpen}
                        aria-controls="mobile-navigation"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </nav>

            {/* mobile full-screen sheet — coal, matching the story */}
            {isOpen &&
                createPortal(
                    <div ref={menuRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label={language === "KR" ? "전체 메뉴" : "Navigation"} className="fixed inset-0 z-50 flex flex-col bg-coal lg:hidden">
                        <div className="flex h-16 shrink-0 items-center justify-between px-6">
                            <span className="text-lg font-bold tracking-tight text-paper">MFTEL</span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="-mr-2 flex h-11 w-11 items-center justify-center text-paper"
                                aria-label={language === "KR" ? "메뉴 닫기" : "Close menu"}
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto overscroll-contain px-8 pb-8 pt-4">
                            <nav className="flex flex-col">
                                {NAV_ROUTES.map((r, i) => {
                                    const inner = (
                                        <>
                                            <span className="text-[13px] font-semibold text-stone-500">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <span className="text-2xl font-bold tracking-tight text-paper">
                                                {t(r.labelKey)}
                                            </span>
                                        </>
                                    );
                                    const mcls = "flex items-baseline gap-4 border-b border-white/10 py-4";
                                    // /lecture 특례 제거(2026-08-08) — 데스크톱과 동일, 전 항목 로케일 <Link>.
                                    return (
                                        <Link key={r.href} href={lp(r.href)} aria-current={current === lp(r.href) ? "page" : undefined} onClick={() => setIsOpen(false)} className={mcls}>
                                            {inner}
                                        </Link>
                                    );
                                })}
                                <Link
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
                                </Link>
                            </nav>
                            {langToggle(true)}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
