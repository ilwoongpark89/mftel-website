"use client";

import Band from "@/components/ui/band";
import { Kicker, Meta, SectionHeader } from "@/components/ui/typo";
import { projects, patents } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * CALORIMETER 04 — PROJECTS & IP. One plain list of grants (period, status,
 * title, sponsor), active-first then most recent. No chart: the period text
 * already says what a bar would.
 * Patents (intellectual property) follow as a sub-block. Frame-0 doctrine:
 * zero animation, zero state, every row in the server HTML.
 */

function parseYearRange(yearStr: string): { start: number; end: number } {
    const parts = yearStr.split("~").map((s) => parseInt(s.trim(), 10));
    if (parts.length === 2) return { start: parts[0], end: parts[1] };
    return { start: parts[0], end: parts[0] };
}

const CURRENT_YEAR = new Date().getFullYear();

/** Grants with derived status, active-first then most recent start. */
const grants = projects
    .map((p) => {
        const { start, end } = parseYearRange(p.year);
        return { ...p, start, end, active: start <= CURRENT_YEAR && CURRENT_YEAR <= end };
    })
    .sort((a, b) => Number(b.active) - Number(a.active) || b.start - a.start || b.end - a.end);


const rangeLabel = (g: { start: number; end: number }) =>
    g.start === g.end ? `${g.start}` : `${g.start}–${g.end}`;

/** 지원기관 한글 표기 — 영문 원문(교수 저작)은 데이터에 그대로 두고 표시만 바꾼다. */
const SPONSOR_KR: Record<string, string> = {
    KETEP: "한국에너지기술평가원(KETEP)",
    "Hyundai Engineering & Construction": "현대건설",
    "SMR Regulation Research Foundation": "SMR 규제연구재단",
    "HD Hyundai Heavy Industries": "HD현대중공업",
    "Laboratory-Specialized Startup Leading University, Ministry of Science and ICT":
        "과학기술정보통신부 실험실 특화형 창업선도대학 사업",
    "Inha University": "인하대학교",
    "UTFORSK, Direktoratet for høyere utdanning og kompetanse (HK-dir), Norway":
        "노르웨이 고등교육·역량국(HK-dir) UTFORSK 프로그램",
    "National Research Foundation of Korea": "한국연구재단",
    "ROK-Nordic R&D Cooperation Program, National Research Foundation of Korea":
        "한국연구재단 한–북유럽 연구협력 프로그램",
};


export default function Projects() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";

    return (
        <Band id="projects" surface="paper">
            <SectionHeader
                index="04"
                kicker={t("projects.label")}
                title={t("projects.title")}
                isKorean={isKR}
            />

            {/* grants — active first, then most recent */}
            <div className="mt-2">
                <ul className="border-b border-hairline">
                    {grants.map((g) => (
                        <li
                            key={g.title}
                            className="border-t border-hairline py-4 md:py-5"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <Meta>{rangeLabel(g)}</Meta>
                                    {g.active ? (
                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ember-700">
                                            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ember-600" />
                                            {isKR ? "진행 중" : "Active"}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
                                            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink-4" />
                                            {isKR ? "완료" : "Completed"}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1.5 break-keep text-[15px] font-medium leading-snug text-ink md:text-base">
                                    {isKR ? g.titleKR : g.title}
                                </p>
                                {isKR ? (
                                    <p className="mt-1 break-keep text-[13px] leading-snug text-ink-3">{g.title}</p>
                                ) : null}
                                <Meta className="mt-1.5 block text-xs leading-normal text-ink-3">
                                    {isKR ? (SPONSOR_KR[g.sponsor] ?? g.sponsor) : g.sponsor}
                                </Meta>
                            </div>

                        </li>
                    ))}
                </ul>
            </div>

            {/* 04.B — intellectual property (인하대 IPMS 동기: 등록 + 출원) */}
            <div className="mt-16 md:mt-24">
                <Kicker index="04.B">{isKR ? "지식재산권" : "Intellectual Property"}</Kicker>
                <h3 className="mt-5 break-keep text-2xl font-semibold tracking-tight text-ink">
                    {t("projects.patents")}
                    <span className="ml-3 text-base font-medium text-ink-3">
                        {isKR
                            ? `등록 ${patents.filter((p) => p.status === "registered").length} · 출원 ${patents.filter((p) => p.status === "filed").length}`
                            : `${patents.filter((p) => p.status === "registered").length} registered · ${patents.filter((p) => p.status === "filed").length} filed`}
                    </span>
                </h3>
                <ul className="mt-6 border-b border-hairline">
                    {patents.map((p) => (
                        <li
                            key={p.appNumber}
                            className="flex flex-col gap-1.5 border-t border-hairline py-4 md:flex-row md:items-baseline md:justify-between md:gap-8"
                        >
                            <p className="break-keep text-[15px] font-medium leading-snug text-ink md:text-base">
                                {isKR ? p.titleKR : p.title}
                            </p>
                            <span className="flex shrink-0 items-baseline gap-3">
                                {p.status === "registered" ? (
                                    <span className="inline-block w-20 text-right text-[12px] font-semibold uppercase tracking-[0.1em] text-ember-700">
                                        {isKR ? "등록" : "Registered"}
                                    </span>
                                ) : (
                                    <span className="inline-block w-20 text-right text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                                        {isKR ? "출원" : "Filed"}
                                    </span>
                                )}
                                <Meta className="inline-block min-w-[17ch] tabular-nums">
                                    {p.status === "registered" && p.regNumber && p.regDate
                                        ? `KR ${p.regNumber} · ${p.regDate.slice(0, 7).replace("-", ".")}`
                                        : `KR ${p.appNumber} · ${p.appDate.slice(0, 7).replace("-", ".")}`}
                                </Meta>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </Band>
    );
}
