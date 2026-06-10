"use client";

import { Flame, Droplets, Atom } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import Reveal from "@/components/ui/reveal";
import { SectionHeader, Meta } from "@/components/ui/typo";

/**
 * CALORIMETER §01 ABOUT — the lab's elevator pitch.
 * Split 5/7: sticky mission rail (left) + 3 pillar rows (right), journal-list
 * style instead of equal-width cards. Frame-0: every string is server HTML;
 * the only entrance motion is the SectionHeader reveal. Pillar rows are
 * honest links into the Research section. The 90% claim is promoted into a
 * stat callout under row 02 (the band's single saturated ember element).
 */

const PILLARS = [
    {
        index: "01",
        icon: Flame,
        titleKey: "about.tes.title",
        descKey: "about.tes.description",
        stat: false,
    },
    {
        index: "02",
        icon: Droplets,
        titleKey: "about.thermal.title",
        descKey: "about.thermal.description",
        stat: true,
    },
    {
        index: "03",
        icon: Atom,
        titleKey: "about.smr.title",
        descKey: "about.smr.description",
        stat: false,
    },
] as const;

export default function About() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";

    return (
        <Band id="about" surface="white">
            <SectionHeader
                index="01"
                kicker={t("about.label")}
                title={t("about.title")}
                isKorean={isKR}
            />

            <div className="grid gap-10 md:grid-cols-12 md:gap-12">
                {/* mission rail — sticky on md+ so it accompanies the pillar list */}
                <div className="md:col-span-5">
                    <div className="md:sticky md:top-24">
                        <p
                            className={`break-keep text-lg text-ink-2 ${
                                isKR ? "leading-[1.75]" : "leading-[1.7]"
                            }`}
                        >
                            {t("about.description")}
                        </p>
                        <a
                            href="#research"
                            className="mt-5 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-ember-700 transition-colors duration-150 hover:text-ember-800"
                        >
                            {isKR ? "전체 연구 분야 보기" : "Full research overview"}
                            <span aria-hidden>→</span>
                        </a>
                    </div>
                </div>

                {/* 3 pillar rows — hairline-divided list, each row links to Research */}
                <Reveal as="ul" className="reveal-stagger border-t border-hairline md:col-span-7">
                    {PILLARS.map((pillar) => {
                        const Icon = pillar.icon;
                        return (
                            <li key={pillar.index} className="border-b border-hairline">
                                <a
                                    href="#research"
                                    className="group -mx-3 flex items-start gap-4 rounded-lg px-3 py-6 transition-colors duration-150 hover:bg-well sm:-mx-4 sm:px-4 md:gap-5 md:py-7"
                                >
                                    <div className="pt-[5px]">
                                        <Meta className="text-ember-700">{pillar.index}</Meta>
                                    </div>
                                    <Icon
                                        aria-hidden
                                        strokeWidth={1.75}
                                        className="mt-1 h-5 w-5 flex-shrink-0 text-ink"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h3 className="break-keep text-[17px] font-semibold leading-[1.4] text-ink">
                                            {t(pillar.titleKey)}
                                        </h3>
                                        <p
                                            className={`mt-1.5 break-keep text-[15px] text-ink-2 ${
                                                isKR ? "leading-[1.75]" : "leading-[1.6]"
                                            }`}
                                        >
                                            {t(pillar.descKey)}
                                        </p>
                                        {pillar.stat ? (
                                            <div className="mt-5">
                                                <p className="text-[40px] font-semibold leading-none tracking-tight text-ember-600 tabular-nums md:text-5xl">
                                                    −90%
                                                </p>
                                                <Meta className="mt-2 block text-xs uppercase tracking-[0.08em]">
                                                    {isKR
                                                        ? "공랭 대비 냉각 에너지"
                                                        : "COOLING ENERGY VS AIR-COOLING"}
                                                </Meta>
                                            </div>
                                        ) : null}
                                    </div>
                                    <span
                                        aria-hidden
                                        className="self-center text-ink-3 transition-colors duration-150 group-hover:text-ink"
                                    >
                                        →
                                    </span>
                                </a>
                            </li>
                        );
                    })}
                </Reveal>
            </div>
        </Band>
    );
}
