"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import Band from "@/components/ui/band";
import { Meta, SectionHeader } from "@/components/ui/typo";
import { publications, teamMembers } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";

type Publication = (typeof publications)[number];

/**
 * CALORIMETER 03 — PUBLICATIONS. Year-grouped single-column citation list
 * (year rail left, hairline-separated entries). Frame-0: the default list
 * is fully present in server HTML; filters are additive client state.
 * Pills are DERIVED from data with counts — a dead pill (e.g. the old TES
 * pill with 0 entries) is representation-impossible.
 */

/** KR/EN display labels for category keys that exist in app/data. */
const CATEGORY_LABELS: Record<string, { en: string; kr: string }> = {
    boiling: { en: "Boiling", kr: "비등" },
    condensation: { en: "Condensation", kr: "응축" },
    smr: { en: "SMR", kr: "SMR" },
    wettability: { en: "Wettability", kr: "표면 젖음 특성" },
};

const VISIBLE_DEFAULT = 8;

/** `special` exists only on some data entries — safe union access. */
const specialOf = (pub: Publication): string | undefined =>
    "special" in pub ? pub.special : undefined;

/** "239, 116852, 2026" → "239 · 116852 · 2026" (vol · article/pages · year). */
const detailsLine = (details: string) =>
    details
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" · ");

export default function Publications({
    citations,
}: {
    /** OpenAlex cited-by counts (bare-DOI keyed) — optional, server-fetched */
    citations?: { byDoi: Record<string, number>; total: number };
}) {
    const { t, language } = useLanguage();
    const isKR = language === "KR";

    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [search, setSearch] = useState("");
    const [showAll, setShowAll] = useState(false);

    // deep link from team cards: /publications?q=<member name> pre-fills search
    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get("q");
        if (q) {
            setSearch(q);
            setShowAll(true);
        }
    }, []);

    const totalPubs = publications.length;

    /** [key, count] pairs derived from data, largest group first. */
    const categories = useMemo(() => {
        const counts = new Map<string, number>();
        for (const pub of publications) {
            for (const key of pub.category) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }, []);

    const years = useMemo(
        () => [...new Set(publications.map((p) => p.year))].sort((a, b) => b.localeCompare(a)),
        []
    );

    const filteredPubs = useMemo(() => {
        const query = search.trim().toLowerCase();
        // author match is spacing-insensitive ("Hyun Jin Yong" ↔ "Hyunjin Yong")
        // — same semantics as the team-card pub counts, so the numbers agree.
        // If the query IS a member's name, expand to their romanization aliases
        // (e.g., Hyun Jin Yong ↔ Hyeon Jin Yong) so every paper is found.
        const compactQuery = query.replace(/\s+/g, "");
        const aliasGroup = teamMembers
            .map((m) => [m.name, ...(m.aliases ?? [])].map((n) => n.toLowerCase().replace(/\s+/g, "")))
            .find((group) => group.includes(compactQuery));
        const authorNeedles = aliasGroup ?? (compactQuery ? [compactQuery] : []);
        return publications.filter((pub) => {
            const matchCategory = activeCategory === "all" || pub.category.includes(activeCategory);
            const matchYear = selectedYear === "all" || pub.year === selectedYear;
            const compactAuthors = pub.authors.toLowerCase().replace(/\s+/g, "");
            const matchQuery =
                !query ||
                pub.title.toLowerCase().includes(query) ||
                authorNeedles.some((n) => compactAuthors.includes(n));
            return matchCategory && matchYear && matchQuery;
        });
    }, [activeCategory, selectedYear, search]);

    const displayedPubs = showAll ? filteredPubs : filteredPubs.slice(0, VISIBLE_DEFAULT);

    /** Data is ordered newest-first, so consecutive grouping preserves year order. */
    const yearGroups = useMemo(() => {
        const groups: { year: string; items: Publication[] }[] = [];
        for (const pub of displayedPubs) {
            const last = groups[groups.length - 1];
            if (last && last.year === pub.year) last.items.push(pub);
            else groups.push({ year: pub.year, items: [pub] });
        }
        return groups;
    }, [displayedPubs]);

    const hasFilters = activeCategory !== "all" || selectedYear !== "all" || search.trim() !== "";

    const clearFilters = () => {
        setActiveCategory("all");
        setSelectedYear("all");
        setSearch("");
    };

    const categoryLabel = (key: string) => {
        const label = CATEGORY_LABELS[key];
        return label ? (isKR ? label.kr : label.en) : key.toUpperCase();
    };

    const pillClass = (active: boolean) =>
        `inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors duration-150 md:min-h-9 ${
            active
                ? "border-ember-200 bg-ember-50 text-ember-700"
                : "border-hairline bg-white text-ink-2 hover:border-hairline-2"
        }`;

    return (
        <Band id="publications" surface="white">
            <SectionHeader
                index="03"
                kicker={t("publications.label")}
                title={t("publications.title")}
                sub={
                    <>
                        {t("publications.count").replace("{count}", String(totalPubs))}
                        {citations && citations.total > 0 ? (
                            <span className="mt-1 block text-sm text-ink-3">
                                {isKR
                                    ? `총 피인용 ${citations.total.toLocaleString()}회 · 출처 OpenAlex`
                                    : `${citations.total.toLocaleString()} total citations · source: OpenAlex`}
                            </span>
                        ) : null}
                    </>
                }
                isKorean={isKR}
            />

            {/* filter rail — pills derived from data with counts */}
            <div className="space-y-4">
                <div
                    role="group"
                    aria-label={isKR ? "분야 필터" : "Filter by category"}
                    className="flex flex-wrap gap-2"
                >
                    <button
                        type="button"
                        onClick={() => setActiveCategory("all")}
                        aria-pressed={activeCategory === "all"}
                        className={pillClass(activeCategory === "all")}
                    >
                        {isKR ? "전체" : "All"}
                        <Meta className={`text-xs ${activeCategory === "all" ? "text-ember-700" : ""}`}>
                            {totalPubs}
                        </Meta>
                    </button>
                    {categories.map(([key, count]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveCategory(key)}
                            aria-pressed={activeCategory === key}
                            className={pillClass(activeCategory === key)}
                        >
                            {categoryLabel(key)}
                            <Meta className={`text-xs ${activeCategory === key ? "text-ember-700" : ""}`}>
                                {count}
                            </Meta>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-44">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            aria-label={isKR ? "연도 필터" : "Filter by year"}
                            className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-hairline bg-white pl-3 pr-9 text-sm text-ink-2 transition-colors duration-150 hover:border-hairline-2 focus:border-hairline-2 focus:outline-none md:h-9"
                        >
                            <option value="all">{isKR ? "전체 연도" : "All Years"}</option>
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            aria-hidden
                            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4"
                        />
                    </div>
                    <div className="relative w-full sm:max-w-xs sm:flex-1">
                        <Search
                            aria-hidden
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isKR ? "제목·저자 검색..." : "Search title or author..."}
                            aria-label={isKR ? "논문 검색" : "Search publications"}
                            className="h-11 w-full rounded-lg border border-hairline bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink-4 transition-colors duration-150 hover:border-hairline-2 focus:border-hairline-2 focus:outline-none md:h-9"
                        />
                    </div>
                    {hasFilters && (
                        <p className="text-sm text-ink-3">
                            <span className="tabular-nums">
                                {filteredPubs.length} / {totalPubs}
                            </span>{" "}
                            {isKR ? "편" : "papers"}
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="ml-3 font-medium text-ember-700 transition-colors duration-150 hover:text-ember-800"
                            >
                                {isKR ? "필터 초기화" : "Clear filters"}
                            </button>
                        </p>
                    )}
                </div>
            </div>

            {/* year-grouped citation list — frame-0, no entrance animation */}
            <div className="mt-8 md:mt-10">
                {yearGroups.map(({ year, items }) => (
                    <div
                        key={year}
                        className="grid border-t border-hairline py-5 md:grid-cols-[96px_1fr] md:gap-6 md:py-6"
                    >
                        <div className="pb-2 md:pb-0">
                            <p className="text-2xl font-semibold leading-none tracking-tight text-hairline-2 tabular-nums md:sticky md:top-24">
                                {year}
                            </p>
                        </div>
                        <ul className="divide-y divide-hairline">
                            {items.map((pub) => {
                                const special = specialOf(pub);
                                const isDoi = pub.link.includes("doi.org");
                                return (
                                    <li
                                        key={pub.number}
                                        id={`pub-${totalPubs - pub.number + 1}`}
                                        className="scroll-mt-24 py-4 first:pt-0 last:pb-0"
                                    >
                                        <a
                                            href={pub.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="break-keep text-base font-semibold leading-snug text-ink transition-colors duration-150 hover:text-ember-700"
                                        >
                                            {pub.title}
                                        </a>
                                        <p className="mt-1.5 text-sm leading-relaxed text-ink-3">
                                            {pub.authors}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                                            <span className="text-sm font-medium text-ink">
                                                {pub.journal}
                                            </span>
                                            <Meta>{detailsLine(pub.details)}</Meta>
                                            {(() => {
                                                const d = pub.link.match(/doi\.org\/(.+)$/i)?.[1]?.toLowerCase();
                                                const n = d ? citations?.byDoi[d] : undefined;
                                                return n ? (
                                                    <Meta className="text-xs">
                                                        {isKR ? `인용 ${n}` : `Cited by ${n}`}
                                                    </Meta>
                                                ) : null;
                                            })()}
                                            {special
                                                ?.split(",")
                                                .map((tag) => tag.trim())
                                                .filter(Boolean)
                                                .map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center rounded-md border border-ember-200 bg-ember-50 px-1.5 py-0.5"
                                                    >
                                                        <Meta className="text-[11px] uppercase tracking-[0.08em] text-ember-700">
                                                            {tag}
                                                        </Meta>
                                                    </span>
                                                ))}
                                            <a
                                                href={pub.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`${isDoi ? "DOI" : "PDF"} — ${pub.title}`}
                                                className="ml-auto inline-flex min-h-11 items-center rounded-lg border border-hairline px-2.5 transition-colors duration-150 hover:border-hairline-2 md:min-h-8"
                                            >
                                                <Meta className="text-xs text-ink-2">
                                                    {isDoi ? "DOI" : "PDF"} ↗
                                                </Meta>
                                            </a>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}

                {filteredPubs.length === 0 ? (
                    <div className="border-t border-hairline py-12">
                        <p className="text-base text-ink-3">
                            {isKR ? "검색 결과가 없습니다" : "No publications found"}
                        </p>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-2 text-sm font-medium text-ember-700 transition-colors duration-150 hover:text-ember-800"
                        >
                            {isKR ? "필터 초기화" : "Clear filters"}
                        </button>
                    </div>
                ) : (
                    <div aria-hidden className="border-t border-hairline" />
                )}
            </div>

            {filteredPubs.length > VISIBLE_DEFAULT && (
                <div className="mt-8">
                    <button
                        type="button"
                        onClick={() => setShowAll(!showAll)}
                        aria-expanded={showAll}
                        className="inline-flex h-11 items-center rounded-lg border border-hairline-2 px-5 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink-4 hover:bg-well"
                    >
                        {showAll
                            ? t("publications.showLess")
                            : t("publications.viewAll").replace("{count}", String(filteredPubs.length))}
                    </button>
                </div>
            )}
        </Band>
    );
}
