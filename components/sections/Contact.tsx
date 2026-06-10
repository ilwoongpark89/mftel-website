"use client";

import { useRef, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { Meta, SectionHeader } from "@/components/ui/typo";

const EMAIL = "ilwoongpark@inha.ac.kr";
const OFFICE = "INHA UNIV. · 2N687";
const TOAST_MS = 2500;

/**
 * 09 — JOIN US. Compact coal CTA band: header + quiet 4-cell proof row
 * (left) and the contact block (right rail) — mailto shown immediately,
 * copy-to-clipboard with a styled 2.5s toast. Frame-0: every string is in
 * the server HTML; the only entrance motion is the SectionHeader reveal.
 */
export default function Contact() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<number | null>(null);

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL);
        } catch {
            return; // clipboard unavailable — the mailto link beside it still works
        }
        setCopied(true);
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), TOAST_MS);
    };

    const benefits = [
        { title: t("contact.benefit1.title"), description: t("contact.benefit1.description") },
        { title: t("contact.benefit2.title"), description: t("contact.benefit2.description") },
        { title: t("contact.benefit3.title"), description: t("contact.benefit3.description") },
        { title: t("contact.benefit4.title"), description: t("contact.benefit4.description") },
    ];

    return (
        <Band id="contact" surface="coal" compact>
            <SectionHeader
                index="09"
                kicker={t("contact.label")}
                title={
                    <span className="break-keep">
                        {t("contact.title1")} {t("contact.title2")}
                    </span>
                }
                sub={
                    <span className={isKR ? "leading-[1.75]" : undefined}>
                        {t("contact.description")}
                    </span>
                }
                dark
                isKorean={isKR}
            />

            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                {/* quiet 4-cell hairline proof row */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10 lg:col-span-7">
                    {benefits.map((b) => (
                        <div key={b.title} className="border-t border-white/10 py-5">
                            <dt>
                                <Meta dark className="text-xs uppercase tracking-[0.08em]">
                                    {b.title}
                                </Meta>
                            </dt>
                            <dd
                                className={`mt-2 text-sm text-paper ${
                                    isKR ? "leading-[1.75]" : "leading-[1.6]"
                                }`}
                            >
                                {b.description}
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* contact block — zero reveal steps */}
                <div className="lg:col-span-5">
                    <div className="relative rounded-lg border border-white/10 bg-coal-raised p-6 md:p-7">
                        <p
                            role="status"
                            aria-live="polite"
                            className={`pointer-events-none absolute -top-3 right-4 rounded-lg border border-white/10 bg-coal px-3 py-1.5 text-xs text-paper transition-opacity duration-150 ${
                                copied ? "opacity-100" : "opacity-0"
                            }`}
                        >
                            {copied ? t("contact.emailCopied") : ""}
                        </p>

                        <p className="text-[15px] font-medium text-paper">{t("contact.cta")}</p>

                        <div className="mt-4 flex items-center gap-3">
                            <a href={`mailto:${EMAIL}`} className="group min-w-0">
                                <Meta
                                    dark
                                    className="break-all text-[15px] text-paper transition-colors duration-150 group-hover:text-ember-400 md:text-base"
                                >
                                    {EMAIL}
                                </Meta>
                            </a>
                            <button
                                type="button"
                                onClick={copyEmail}
                                aria-label={isKR ? "이메일 주소 복사" : "Copy email address"}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 text-ink-4 transition-colors duration-150 hover:border-white/25 hover:text-paper"
                            >
                                {copied ? (
                                    <Check aria-hidden className="h-4 w-4" />
                                ) : (
                                    <Copy aria-hidden className="h-4 w-4" />
                                )}
                            </button>
                        </div>

                        <div className="mt-3">
                            <Meta dark className="text-xs uppercase tracking-[0.08em]">
                                {OFFICE}
                            </Meta>
                        </div>

                        {/* the band's single filled ember element */}
                        <a
                            href={`mailto:${EMAIL}`}
                            className="glow-ember mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ember-600 px-6 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-ember-500 sm:w-auto"
                        >
                            <Mail aria-hidden className="h-4 w-4" />
                            {t("contact.apply")}
                        </a>
                    </div>
                </div>
            </div>
        </Band>
    );
}
