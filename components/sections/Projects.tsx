"use client";

import Band from "@/components/ui/band";
import { Kicker, Meta, FigCaption, SectionHeader } from "@/components/ui/typo";
import { projects, patents } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * CALORIMETER 04 — PROJECTS & IP. Funding Gantt as the hero artifact
 * (pure CSS bars derived from the grant year ranges — ember-600 active,
 * hairline-2 completed), an editorial grants table sorted active-first,
 * and a patents (intellectual property) sub-block. Frame-0 doctrine:
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

const MIN_YEAR = Math.min(...grants.map((g) => g.start));
const MAX_YEAR = Math.max(...grants.map((g) => g.end));
const SPAN = MAX_YEAR - MIN_YEAR + 1;
const YEARS = Array.from({ length: SPAN }, (_, i) => MIN_YEAR + i);

const pct = (v: number) => ((v - MIN_YEAR) / SPAN) * 100;
const TODAY_PCT =
    CURRENT_YEAR >= MIN_YEAR && CURRENT_YEAR <= MAX_YEAR ? pct(CURRENT_YEAR + 0.5) : null;

const rangeLabel = (g: { start: number; end: number }) =>
    g.start === g.end ? `${g.start}` : `${g.start}–${g.end}`;

export default function Projects() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const activeLabel = isKR ? "진행 중" : "ACTIVE";

    return (
        <Band id="projects" surface="paper">
            <SectionHeader
                index="04"
                kicker={t("projects.label")}
                title={t("projects.title")}
                isKorean={isKR}
            />

            {/* FIG. 04 — funding Gantt, data-derived pure CSS bars */}
            <figure className="rounded-lg border border-hairline bg-white p-4 md:p-6">
                <FigCaption>
                    FIG. 04 — {isKR ? "연구 과제 기간" : "FUNDED PROJECTS"} · {MIN_YEAR}–{MAX_YEAR}
                </FigCaption>

                <div aria-hidden className="relative mt-4">
                    {/* year gridlines + dashed today marker */}
                    <div className="absolute inset-0">
                        {YEARS.map((y) => (
                            <span
                                key={y}
                                className="absolute inset-y-0 w-px bg-hairline"
                                style={{ left: `${pct(y)}%` }}
                            />
                        ))}
                        <span className="absolute inset-y-0 right-0 w-px bg-hairline" />
                        {TODAY_PCT !== null && (
                            <span
                                className="absolute inset-y-0 w-px border-l border-dashed border-ink-3/50"
                                style={{ left: `${TODAY_PCT}%` }}
                            />
                        )}
                    </div>

                    {/* mono year axis */}
                    <div className="relative h-5">
                        {YEARS.map((y, i) => (
                            <span
                                key={y}
                                className={`absolute top-0 pl-1 ${i % 2 ? "hidden md:block" : ""}`}
                                style={{ left: `${pct(y)}%` }}
                            >
                                <Meta className="text-[11px]">{y}</Meta>
                            </span>
                        ))}
                    </div>

                    {/* bars — 8px tall, same order as the table below */}
                    <div className="mt-2 space-y-1.5 pb-1">
                        {grants.map((g) => (
                            <div key={g.title} className="relative h-2">
                                <span
                                    title={`${g.title} (${g.year})`}
                                    className={`absolute inset-y-0 rounded-sm ${
                                        g.active ? "bg-ember-600" : "bg-hairline-2"
                                    }`}
                                    style={{
                                        left: `${pct(g.start)}%`,
                                        width: `${((g.end - g.start + 1) / SPAN) * 100}%`,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* legend */}
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-3">
                    <span className="inline-flex items-center gap-2">
                        <span aria-hidden className="h-2 w-6 rounded-sm bg-ember-600" />
                        <Meta className="text-xs uppercase tracking-[0.08em]">{activeLabel}</Meta>
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span aria-hidden className="h-2 w-6 rounded-sm bg-hairline-2" />
                        <Meta className="text-xs uppercase tracking-[0.08em]">
                            {isKR ? "완료" : "COMPLETED"}
                        </Meta>
                    </span>
                </div>
            </figure>

            {/* grants table — active first, titles wrap free */}
            <div className="mt-10 md:mt-12">
                <div className="hidden rounded-t-lg bg-well px-5 py-2.5 md:grid md:grid-cols-[120px_1fr] md:gap-x-8">
                    <Meta className="text-right text-xs uppercase tracking-[0.08em]">
                        {isKR ? "기간" : "Years"}
                    </Meta>
                    <Meta className="text-xs uppercase tracking-[0.08em]">
                        {isKR ? "과제명 · 지원기관" : "Project · Sponsor"}
                    </Meta>
                </div>
                <ul className="border-b border-hairline">
                    {grants.map((g) => (
                        <li
                            key={g.title}
                            className="border-t border-hairline py-4 md:grid md:grid-cols-[120px_1fr] md:gap-x-8 md:px-5"
                        >
                            <div className="flex items-baseline gap-3 md:flex-col md:items-end md:gap-0.5">
                                <Meta>{rangeLabel(g)}</Meta>
                                {g.active && (
                                    <Meta className="text-xs font-medium text-ember-700">
                                        {activeLabel}
                                    </Meta>
                                )}
                            </div>
                            <div className="mt-1.5 md:mt-0">
                                <p className="break-keep text-[15px] font-medium leading-snug text-ink md:text-base">
                                    {g.title}
                                </p>
                                <Meta className="mt-1 block text-xs leading-normal">{g.sponsor}</Meta>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 04.B — intellectual property */}
            <div className="mt-16 md:mt-24">
                <Kicker index="04.B">{isKR ? "지식재산권" : "Intellectual Property"}</Kicker>
                <h3 className="mt-5 break-keep text-2xl font-semibold tracking-tight text-ink">
                    {t("projects.patents")}
                </h3>
                <ul className="mt-6 border-b border-hairline">
                    {patents.map((p) => (
                        <li
                            key={p.number}
                            className="flex flex-col gap-1.5 border-t border-hairline py-4 md:flex-row md:items-baseline md:justify-between md:gap-8"
                        >
                            <p className="break-keep text-[15px] font-medium leading-snug text-ink md:text-base">
                                {p.title}
                            </p>
                            <Meta className="shrink-0">
                                KR {p.number} · {p.date.slice(0, 7).replace("-", ".")}
                            </Meta>
                        </li>
                    ))}
                </ul>
            </div>
        </Band>
    );
}
