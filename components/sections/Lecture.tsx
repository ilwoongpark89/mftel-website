"use client";

import { BookOpen, Calculator, Code, Flame, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { SectionHeader, Meta } from "@/components/ui/typo";

/**
 * CALORIMETER §08 TEACHING — compact light band, a 3-col row of honest
 * external link cards (the three live course-material sites). Frame-0: every
 * card is server HTML; the only entrance motion is the SectionHeader reveal.
 * Monochrome ink icons, single hairline card chrome, mono host row with ↗
 * as the explicit external affordance. The kicker is the band's one ember
 * element — cards stay pure ink. Dead disabled-state machinery deleted
 * (all three courses are live).
 */

const COURSES = [
    {
        icon: BookOpen,
        title: "Heat Transfer",
        titleKR: "열전달",
        scope: "Conduction, convection, and radiation fundamentals",
        scopeKR: "전도·대류·복사 기초",
        href: "https://mftel-ht.vercel.app/",
    },
    {
        icon: Calculator,
        title: "Numerical Analysis",
        titleKR: "수치해석",
        scope: "Numerical methods for engineering computation",
        scopeKR: "공학 계산을 위한 수치 기법",
        href: "https://mftel-na.vercel.app/",
    },
    {
        icon: Code,
        title: "Vibe Coding",
        titleKR: "바이브 코딩",
        scope: "AI-assisted programming practice",
        scopeKR: "AI 활용 프로그래밍 실습",
        href: "https://mftel-vc.vercel.app/",
    },
    {
        icon: Flame,
        title: "Phase-Change Heat Transfer",
        titleKR: "상변화열전달",
        scope: "Boiling — nucleation, CHF, film & flow boiling",
        scopeKR: "비등 — 핵생성·CHF·막비등·유동비등",
        href: "https://mftel-pc.vercel.app/",
    },
    {
        icon: Sparkles,
        title: "Advanced Prompt Engineering",
        titleKR: "프롬프트 엔지니어링 심화",
        scope: "LLM internals, evidence-based prompting, agents, evals",
        scopeKR: "LLM 원리·근거 기반 프롬프트·에이전트·평가",
        href: "https://mftel-vca.vercel.app/",
    },
] as const;

export default function Lecture() {
    const { language } = useLanguage();
    const isKR = language === "KR";

    return (
        <Band id="lecture" surface="well" compact>
            <SectionHeader
                index="08"
                kicker={isKR ? "강의" : "Teaching"}
                title={isKR ? "교과목 안내" : "Course Materials"}
                isKorean={isKR}
            />

            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
                {COURSES.map((course) => {
                    const Icon = course.icon;
                    const host = new URL(course.href).hostname;
                    return (
                        <a
                            key={course.href}
                            href={course.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex min-h-11 flex-col rounded-lg border border-hairline bg-white p-5 transition-colors duration-150 hover:border-hairline-2"
                        >
                            <div className="flex items-start gap-3">
                                <Icon
                                    aria-hidden
                                    strokeWidth={1.75}
                                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink"
                                />
                                <div className="min-w-0 flex-1">
                                    <h3 className="break-keep text-base font-semibold leading-[1.4] text-ink">
                                        {isKR ? course.titleKR : course.title}{" "}
                                        <span className="font-normal text-ink-3">
                                            {isKR ? course.title : course.titleKR}
                                        </span>
                                    </h3>
                                    <p
                                        className={`mt-1 break-keep text-[13px] text-ink-3 ${
                                            isKR ? "leading-[1.75]" : "leading-[1.6]"
                                        }`}
                                    >
                                        {isKR ? course.scopeKR : course.scope}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 border-t border-hairline pt-3">
                                <Meta className="text-xs">{host} ↗</Meta>
                            </div>
                        </a>
                    );
                })}
            </div>
        </Band>
    );
}
