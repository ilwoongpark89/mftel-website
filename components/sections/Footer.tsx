"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { NAV_ROUTES, JOIN_ID } from "@/lib/sections";

/**
 * v3 footer — compact, quiet close. No heading block, no icons, one address
 * line per locale, sitemap as a single wrapped row, dark-graded map.
 */

const MAP_EMBED_SRC =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3166.5!2d126.6544!3d37.4507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357b78a27fba4c35%3A0x6e1b9e7b2e8b1c2a!2sInha%20University!5e0!3m2!1sen!2skr!4v1700000000000!5m2!1sen!2skr";

const CONTACT = {
    addressKR: "인천 미추홀구 인하로 100, 인하대학교 2N687",
    addressEN: "Inha University 2N687, 100 Inha-ro, Michuhol-gu, Incheon 22212, Korea",
    tel: "+82-32-860-7335",
    email: "ilwoongpark@inha.ac.kr",
};

// Sitemap derives from the shared route manifest — links can never drift.
const SITEMAP = [
    ...NAV_ROUTES,
    { href: "/lecture", labelKey: "nav.lecture" },
    { href: `/#${JOIN_ID}`, labelKey: "nav.joinUs" },
];

export default function Footer() {
    const { t, language } = useLanguage();
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
                            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2.5"
                        >
                            {SITEMAP.map((s) => (
                                <Link
                                    key={s.href}
                                    href={s.href}
                                    className="text-sm text-stone-400 transition-colors duration-150 hover:text-paper"
                                >
                                    {t(s.labelKey)}
                                </Link>
                            ))}
                            <a
                                href="https://mftel-db.vercel.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-stone-500 transition-colors duration-150 hover:text-paper"
                            >
                                Lab DB ↗
                            </a>
                        </nav>

                        <div className="mt-7 space-y-1.5 text-sm text-stone-400">
                            <p className="break-keep">{isKR ? CONTACT.addressKR : CONTACT.addressEN}</p>
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
                        <div className="aspect-[16/9] overflow-hidden rounded-xl border border-white/10">
                            <iframe
                                src={MAP_EMBED_SRC}
                                className="h-full w-full border-0"
                                style={{
                                    filter: "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(0.88)",
                                }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="MFTEL Location — Inha University"
                            />
                        </div>
                        <p className="mt-2.5 text-[13px]">
                            <a
                                href="https://maps.google.com/?q=Inha+University"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stone-500 transition-colors duration-150 hover:text-paper"
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
                                className="text-stone-500 transition-colors duration-150 hover:text-paper"
                            >
                                {isKR ? "네이버 지도 ↗" : "Naver Map ↗"}
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-10 border-t border-white/10 pt-5">
                    <p className="text-[13px] text-stone-500">
                        {t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}
                    </p>
                </div>
            </div>
        </footer>
    );
}
