"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { publications, projects, patents, collaboratorCount } from "@/app/data";
import { JOIN_ID } from "@/lib/sections";
import { Kicker, FigCaption, Meta } from "@/components/ui/typo";
import HeroFigure from "@/components/sections/HeroFigure";

/**
 * CALORIMETER hero — frame-0 doctrine: every string is in the server HTML;
 * the only motion is a one-shot 450ms CSS rise on the already-painted blocks.
 * No hydration gates, no expanding circle, no starfield, no per-char timing.
 */
export default function Hero() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";

    const stats = [
        { value: publications.length, label: t("hero.stat.publications") },
        { value: projects.length, label: t("hero.stat.projects") },
        { value: patents.length, label: t("hero.stat.patents") },
        { value: collaboratorCount, label: t("hero.stat.partners") },
    ];

    return (
        <section id="home" className="bg-paper">
            <div className="mx-auto max-w-6xl px-6 pt-28 pb-12 md:px-8 md:pt-40 md:pb-16">
                <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* copy column */}
                    <div className="cal-rise lg:col-span-7">
                        <Kicker>{t("hero.kicker")}</Kicker>
                        <h1
                            className={`mt-6 break-keep text-[40px] font-semibold tracking-tight text-ink md:text-[56px] ${
                                isKR ? "leading-[1.28]" : "leading-[1.08]"
                            }`}
                        >
                            {t("hero.line1")}{" "}
                            <span className="text-ember-700">
                                {t("hero.line2a")} {t("hero.line2b")}
                            </span>{" "}
                            {t("hero.line3")}
                        </h1>
                        <p className={`mt-5 max-w-xl text-lg text-ink-2 ${isKR ? "leading-[1.75]" : "leading-[1.7]"}`}>
                            {t("hero.description")}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a
                                href={`#${JOIN_ID}`}
                                className="inline-flex h-12 items-center rounded-lg bg-ember-700 px-6 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-ember-800"
                            >
                                {t("hero.join")}
                            </a>
                            <a
                                href="#research"
                                className="inline-flex h-12 items-center gap-2 rounded-lg border border-hairline-2 px-6 text-[15px] font-medium text-ink transition-colors duration-150 hover:border-ink-4 hover:bg-white"
                            >
                                {t("hero.research")}
                                <span aria-hidden className="text-ink-3">
                                    ↓
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* FIG. 1 — isotherm field */}
                    <div className="cal-rise-2 lg:col-span-5">
                        <div className="rounded-lg border border-hairline bg-white p-4 md:p-5">
                            <HeroFigure />
                            <FigCaption className="mt-3">{t("hero.fig")}</FigCaption>
                        </div>
                    </div>
                </div>

                {/* instrument stat strip — values derived from data, never hardcoded */}
                <dl className="cal-rise-3 mt-14 grid grid-cols-2 border-y border-hairline md:mt-20 md:grid-cols-4">
                    {stats.map((s, i) => (
                        <div
                            key={s.label}
                            className={`px-4 py-6 md:px-6 ${i > 0 ? "border-l border-hairline" : ""} ${
                                i === 2 ? "max-md:border-l-0 max-md:border-t" : ""
                            } ${i === 3 ? "max-md:border-t" : ""}`}
                        >
                            <dd className="text-4xl font-semibold leading-none tracking-tight text-ink tabular-nums md:text-[40px]">
                                {s.value}
                            </dd>
                            <dt className="mt-2">
                                <Meta className="text-xs uppercase tracking-[0.08em]">{s.label}</Meta>
                            </dt>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
