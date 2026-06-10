"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { publications, projects, patents, collaboratorCount } from "@/app/data";
import { JOIN_ID } from "@/lib/sections";
import { Kicker, Meta } from "@/components/ui/typo";
import CountUp from "@/components/ui/count-up";
import HeroCanvas from "@/components/sections/HeroCanvas";

/**
 * CALORIMETER v2 hero — dark, alive, domain-true. Pool-boiling bubble canvas
 * (the lab's actual physics) over an ember heat-glow, gradient headline
 * accent, floating instrument annotations, count-up stat strip. All text is
 * server-rendered (frame-0); motion is additive on top.
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

    const annotations = [
        { text: "IMMERSION · PUE 1.02", cls: "cal-float right-[8%] top-[24%]" },
        { text: "TES · 10+ H STORAGE", cls: "cal-float-2 right-[20%] top-[44%]" },
        { text: "SMR · 500 MW+", cls: "cal-float-3 right-[6%] top-[62%]" },
    ];

    return (
        <section id="home" data-nav-dark className="relative isolate overflow-hidden bg-coal">
            {/* heated-wall glow (static CSS — carries the scene without JS) */}
            <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                    background:
                        "radial-gradient(ellipse 90% 42% at 50% 108%, rgba(234,88,12,0.28), rgba(234,88,12,0.07) 55%, transparent 75%), radial-gradient(ellipse 60% 50% at 82% -10%, rgba(68,64,60,0.5), transparent 70%)",
                }}
            />
            {/* rising bubble field */}
            <HeroCanvas className="absolute inset-0 -z-10 h-full w-full" />

            {/* floating instrument annotations */}
            <div aria-hidden className="absolute inset-0 -z-[5] hidden lg:block">
                {annotations.map((a) => (
                    <div
                        key={a.text}
                        className={`absolute flex items-center gap-2 ${a.cls}`}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-ember-400/80" />
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-stone-400">
                            {a.text}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center px-6 pb-10 pt-28 md:px-8 md:pt-32">
                <div className="cal-rise max-w-3xl">
                    <Kicker dark>{t("hero.kicker")}</Kicker>
                    <h1
                        className={`mt-7 break-keep text-[42px] font-semibold tracking-tight text-paper md:text-[64px] ${
                            isKR ? "leading-[1.25]" : "leading-[1.06]"
                        }`}
                    >
                        {t("hero.line1")}{" "}
                        <span className="bg-gradient-to-r from-ember-300 via-ember-400 to-ember-600 bg-clip-text text-transparent">
                            {t("hero.line2a")} {t("hero.line2b")}
                        </span>{" "}
                        {t("hero.line3")}
                    </h1>
                    <p
                        className={`mt-6 max-w-xl text-lg text-stone-300 ${
                            isKR ? "leading-[1.75]" : "leading-[1.7]"
                        }`}
                    >
                        {t("hero.description")}
                    </p>
                    <div className="mt-9 flex flex-wrap gap-3">
                        <a
                            href={`#${JOIN_ID}`}
                            className="glow-ember inline-flex h-12 items-center rounded-lg bg-ember-600 px-7 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-ember-500"
                        >
                            {t("hero.join")}
                        </a>
                        <a
                            href="#research"
                            className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-7 text-[15px] font-medium text-paper backdrop-blur-sm transition-colors duration-150 hover:bg-white/10"
                        >
                            {t("hero.research")}
                            <span aria-hidden className="text-stone-400">
                                ↓
                            </span>
                        </a>
                    </div>
                </div>

                {/* instrument stat strip — values derived from data, count-up on view */}
                <dl className="cal-rise-3 mt-16 grid grid-cols-2 border-y border-white/10 md:mt-24 md:grid-cols-4">
                    {stats.map((s, i) => (
                        <div
                            key={s.label}
                            className={`px-4 py-6 md:px-6 ${i > 0 ? "border-l border-white/10" : ""} ${
                                i === 2 ? "max-md:border-l-0 max-md:border-t" : ""
                            } ${i === 3 ? "max-md:border-t" : ""}`}
                        >
                            <dd className="text-4xl font-semibold leading-none tracking-tight text-paper tabular-nums md:text-[44px]">
                                <CountUp to={s.value} />
                            </dd>
                            <dt className="mt-2">
                                <Meta dark className="text-xs uppercase tracking-[0.08em]">
                                    {s.label}
                                </Meta>
                            </dt>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
