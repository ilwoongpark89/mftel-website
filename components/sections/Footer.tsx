"use client";

import { MapPin, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { SECTIONS } from "@/lib/sections";
import { SectionHeader, Meta } from "@/components/ui/typo";

/**
 * CALORIMETER footer — the site's "Contact / 오시는 길" anchor target.
 * Coal ground, 3-col anatomy (wordmark / sitemap / contact + map), hairline
 * bottom bar. Single ember accent on this band = the kicker (ember-400).
 */

const MAP_EMBED_SRC =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3166.5!2d126.6544!3d37.4507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357b78a27fba4c35%3A0x6e1b9e7b2e8b1c2a!2sInha%20University!5e0!3m2!1sen!2skr!4v1700000000000!5m2!1sen!2skr";

// Single contact constant (audit P1: previously hardcoded inline + duplicated in Contact.tsx)
const CONTACT = {
    addressKR: "인천 미추홀구 인하로 100, 인하대학교 2N687",
    addressEN: "Inha University 2N687, 100 Inha-ro, Michuhol-gu, Incheon 22212, Korea",
    tel: "+82-32-860-7335",
    email: "ilwoongpark@inha.ac.kr",
};

// Sitemap derives from the shared section manifest — anchors can never drift.
const SITEMAP = SECTIONS.filter((s) => s.id !== "footer");
const FOOTER_INDEX = SECTIONS.find((s) => s.id === "footer")?.index;

export default function Footer() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const addressLines = isKR
        ? [CONTACT.addressKR, CONTACT.addressEN]
        : [CONTACT.addressEN, CONTACT.addressKR];

    return (
        <footer id="footer" className="bg-coal py-16 text-paper md:py-20">
            <div className="mx-auto max-w-6xl px-6 md:px-8">
                <SectionHeader
                    index={FOOTER_INDEX}
                    kicker={t("footer.label")}
                    title={t("footer.title")}
                    sub={t("footer.description")}
                    dark
                    isKorean={isKR}
                />

                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
                    {/* wordmark + one-line lab description */}
                    <div className="md:col-span-2 lg:col-span-4">
                        <p className="text-2xl font-semibold tracking-tight text-paper">MFTEL</p>
                        <p
                            className={`mt-3 max-w-xs break-keep text-sm text-ink-4 ${
                                isKR ? "leading-[1.75]" : "leading-[1.6]"
                            }`}
                        >
                            {isKR
                                ? "인하대학교 다상유동열공학연구실"
                                : "Multiphase Flow & Thermal Engineering Lab, Inha University"}
                        </p>
                    </div>

                    {/* sitemap quick links */}
                    <nav aria-label={isKR ? "사이트맵" : "Sitemap"} className="lg:col-span-3">
                        <ul>
                            {SITEMAP.map((s) => (
                                <li key={s.id}>
                                    <a
                                        href={`#${s.id}`}
                                        className="flex min-h-11 items-center text-sm text-ink-4 transition-colors duration-150 hover:text-paper"
                                    >
                                        {t(s.labelKey)}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <a
                            href="https://mftel-db.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group mt-1 inline-flex min-h-11 items-center"
                        >
                            <Meta dark className="transition-colors duration-150 group-hover:text-paper">
                                LAB DB ↗
                            </Meta>
                        </a>
                    </nav>

                    {/* contact block + map */}
                    <div className="lg:col-span-5">
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-ink-4" aria-hidden />
                            <div
                                className={`text-sm text-ink-4 ${
                                    isKR ? "leading-[1.75]" : "leading-[1.6]"
                                }`}
                            >
                                {addressLines.map((line) => (
                                    <p key={line} className="break-keep">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <a
                            href={`tel:${CONTACT.tel}`}
                            className="group mt-2 flex min-h-11 items-center gap-3"
                        >
                            <Phone
                                className="h-4 w-4 shrink-0 text-ink-4 transition-colors duration-150 group-hover:text-paper"
                                aria-hidden
                            />
                            <Meta dark className="transition-colors duration-150 group-hover:text-paper">
                                {CONTACT.tel}
                            </Meta>
                        </a>
                        <a
                            href={`mailto:${CONTACT.email}`}
                            className="group flex min-h-11 items-center gap-3 text-sm text-ink-4 transition-colors duration-150 hover:text-paper"
                        >
                            <Mail className="h-4 w-4 shrink-0" aria-hidden />
                            {CONTACT.email}
                        </a>

                        <div className="mt-5 aspect-[16/9] overflow-hidden rounded-lg border border-white/10">
                            <iframe
                                src={MAP_EMBED_SRC}
                                className="h-full w-full border-0"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="MFTEL Location — Inha University"
                            />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-5">
                            <a
                                href="https://maps.google.com/?q=Inha+University"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex min-h-11 items-center"
                            >
                                <Meta dark className="transition-colors duration-150 group-hover:text-paper">
                                    GOOGLE MAPS ↗
                                </Meta>
                            </a>
                            <a
                                href="https://map.naver.com/p/search/인하대학교"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex min-h-11 items-center"
                            >
                                <Meta dark className="transition-colors duration-150 group-hover:text-paper">
                                    NAVER 지도 ↗
                                </Meta>
                            </a>
                        </div>
                    </div>
                </div>

                {/* bottom bar */}
                <div className="mt-12 border-t border-white/10 pt-6 md:mt-16">
                    <Meta dark>
                        {t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}
                    </Meta>
                </div>
            </div>
        </footer>
    );
}
