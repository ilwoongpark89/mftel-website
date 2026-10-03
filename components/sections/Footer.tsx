"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { NAV_ROUTES } from "@/lib/sections";

/**
 * v3 footer — compact, quiet close. No heading block, no icons, one address
 * line per locale, sitemap as a single wrapped row, direct map links.
 */

const CONTACT = {
    addressKR: "인천 미추홀구 인하로 100, 인하대학교 2N687",
    addressEN: "Inha University 2N687, 100 Inha-ro, Michuhol-gu, Incheon 22212, Korea",
    tel: "+82-32-860-7335",
    email: "ilwoongpark@inha.ac.kr",
};

// Sitemap derives from the shared route manifest — links can never drift.
const SITEMAP = [
    ...NAV_ROUTES,
    { href: "/join", labelKey: "nav.joinUs" },
    { href: "/privacy", labelKey: "nav.privacy" },
];

export default function Footer() {
    const { t, language, lp } = useLanguage();
    const isKR = language === "KR";

    return (
        <footer id="footer" data-nav-dark className="relative z-[1] border-t border-white/10 bg-coal py-14 text-paper md:py-16">
            <div className="mx-auto max-w-[1120px] px-6 md:px-8">
                <div className="grid gap-10 md:grid-cols-12 md:gap-8">
                    <div className="md:col-span-7">
                        <p className="text-xl font-bold tracking-tight">MFTEL</p>
                        <p className="mt-1.5 text-sm text-stone-400">
                            {isKR
                                ? "인하대학교 다상유동열공학연구실"
                                : "Multiphase Flow & Thermal Engineering Lab, Inha University"}
                        </p>

                        <nav
                            aria-label={isKR ? "사이트맵" : "Sitemap"}
                            className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2.5"
                        >
                            {SITEMAP.map((s) => {
                                const scls = "text-sm text-stone-400 transition-colors duration-150 hover:text-paper";
                                // /lecture 특례 제거(2026-08-08) — bare /lecture = 사이트 자신의 강의 페이지, 전 항목 로케일 <Link> (Navbar 동형).
                                return (
                                    <Link key={s.href} href={lp(s.href)} className={scls}>
                                        {t(s.labelKey)}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-7 space-y-1.5 text-sm text-stone-400">
                            <p>
                                <a
                                    href={`tel:${CONTACT.tel}`}
                                    className="transition-colors duration-150 hover:text-paper"
                                >
                                    {CONTACT.tel}
                                </a>
                                <span aria-hidden className="mx-2 text-stone-600">
                                    ·
                                </span>
                                <a
                                    href={`mailto:${CONTACT.email}`}
                                    className="transition-colors duration-150 hover:text-paper"
                                >
                                    {CONTACT.email}
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <p className="text-sm font-semibold text-paper">{isKR ? "찾아오시는 길" : "Visit the lab"}</p>
                        <p className="mt-3 max-w-sm break-keep text-sm leading-relaxed text-stone-400">{isKR ? CONTACT.addressKR : CONTACT.addressEN}</p>
                        <p className="mt-2.5 text-[13px]">
                            <a
                                href="https://maps.google.com/?q=Inha+University"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center text-stone-400 transition-colors duration-150 hover:text-paper"
                            >
                                Google Maps ↗
                            </a>
                            <span aria-hidden className="mx-2 text-stone-600">
                                ·
                            </span>
                            <a
                                href="https://map.naver.com/p/search/인하대학교"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center text-stone-400 transition-colors duration-150 hover:text-paper"
                            >
                                {isKR ? "네이버 지도 ↗" : "Naver Map ↗"}
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-10 border-t border-white/10 pt-5">
                    <p className="text-[13px] text-stone-400">
                        {t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}
                    </p>
                </div>
            </div>
        </footer>
    );
}
