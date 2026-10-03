"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { memberAnchor, memberForAuthor } from "@/lib/member-links";
import Band from "@/components/ui/band";
import ArchiveYear from "@/components/ui/archive-year";
import { Meta, SectionHeader } from "@/components/ui/typo";
import { publications, teamMembers } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";

type Publication = (typeof publications)[number];

/**
 * CALORIMETER 03 — PUBLICATIONS. Year-grouped single-column citation list
 * (shared year headings, hairline-separated entries). Frame-0: the default list
 * is fully present in server HTML; filters are additive client state.
 * Pills are DERIVED from data with counts — a dead pill (e.g. the old TES
 * pill with 0 entries) is representation-impossible.
 */

/** KR/EN display labels for category keys that exist in app/data. */
const CATEGORY_LABELS: Record<string, { en: string; kr: string }> = {
    boiling: { en: "Boiling", kr: "비등" },
    condensation: { en: "Condensation", kr: "응축" },
    smr: { en: "Nuclear thermal hydraulics", kr: "원자력 열수력" },
    tes: { en: "Melting & thermal storage", kr: "융해·열저장" },
    wettability: { en: "Wettability", kr: "젖음성" },
};

/** Link only exact known names and recorded romanization aliases. */
const renderAuthors = (authors: string, lp: (path: string) => string, isKR: boolean) =>
    authors.split(",").map((raw, i, arr) => {
        const name = raw.trim();
        const member = memberForAuthor(name);
        return <span key={i}>
            {member ? <Link className="publication-author whitespace-nowrap font-medium text-ink" href={lp(`/team#${memberAnchor(member.name)}`)} title={isKR ? `${member.nameKR} · 구성원 보기` : `${member.name} · View profile`}>{name}</Link> : <span className="whitespace-nowrap">{name}</span>}
            {i < arr.length - 1 ? ", " : ""}
        </span>;
    });

/** `special` exists only on some data entries — safe union access. */
const specialOf = (pub: Publication): string | undefined =>
    "special" in pub ? pub.special : undefined;

/** "239, 116852, 2026" → "239 · 116852 · 2026" (vol · article/pages · year). */
const detailsLine = (details: string, year?: string) => {
    const parts = details.split(",").map((part) => part.trim()).filter(Boolean);
    // 권 번호가 연도와 같은 학술지(IJER 등)는 «2025 · … · 2025» 로 보이므로 앞의 중복만 뺀다
    return parts.filter((part, i) => !(year && part === year && i < parts.length - 1)).join(" · ");
};

export default function Publications({
    citations,
}: {
    /** OpenAlex cited-by counts (bare-DOI keyed) — optional, server-fetched */
    citations?: { byDoi: Record<string, number>; total: number };
}) {
    const { t, language, lp } = useLanguage();
    const isKR = language === "KR";

    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [search, setSearch] = useState("");

    // deep link from team cards: /publications?q=<member name> pre-fills search
    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get("q");
        if (q) setSearch(q);
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

    const displayedPubs = filteredPubs;

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

    const latestYear = years[0];

    return (
        <Band id="publications" surface="white">
            <div className="publication-heading">
                <SectionHeader index="03" kicker={t("publications.label")} title={t("publications.title")} isKorean={isKR} className="mb-0 md:mb-0"
                    sub={<span className="publication-summary">{isKR ? `국제 학술지 ${totalPubs}편` : `${totalPubs} journal articles`}{citations && citations.total > 0 ? <span>{isKR ? `피인용 ${citations.total.toLocaleString()}회` : `${citations.total.toLocaleString()} citations`} <span className="text-ink-3">(OpenAlex)</span></span> : null}</span>} />
            </div>
            <div className="publication-tools">
                <select aria-label={isKR ? "주제 필터 (중복 분류)" : "Topic filter (overlapping topics)"} value={activeCategory} onChange={e => setActiveCategory(e.target.value)}>
                    <option value="all">{isKR ? "모든 주제" : "All topics"}</option>
                    {categories.map(([key,count]) => <option key={key} value={key}>{categoryLabel(key)} · {count}</option>)}
                </select>
                <select aria-label={isKR ? "연도 필터" : "Filter by year"} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                    <option value="all">{isKR ? "전체 연도" : "All years"}</option>
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <label className="publication-search"><Search aria-hidden size={16}/><input aria-label={isKR ? "논문 검색" : "Search publications"} placeholder={isKR ? "제목·저자로 검색" : "Search title or author"} value={search} onChange={e => setSearch(e.target.value)} /></label>
            </div>
            {hasFilters ? <div className="publication-filter-state">{activeCategory !== "all" ? <span>{isKR ? "주제 간 중복 포함" : "Topics may overlap"}</span> : null}<span>{isKR ? `${filteredPubs.length}편 / 전체 ${totalPubs}편` : `${filteredPubs.length} of ${totalPubs} articles`}</span><button type="button" onClick={clearFilters}>{isKR ? "필터 초기화" : "Clear filters"}</button></div> : null}

            {/* year-grouped citation list — frame-0, no entrance animation */}
            <div className="archive-years mt-8">
                {yearGroups.map(({ year, items }) => (
                    <ArchiveYear key={year} year={year} id={`publications-year-${year}`} current={year === latestYear}>
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
                                            className="break-keep text-base font-semibold leading-snug text-ink transition-colors duration-150 hover:text-ember-700 [text-wrap:pretty]"
                                        >
                                            {pub.title}
                                        </a>
                                        <p className="mt-1.5 text-sm leading-relaxed text-ink-3">
                                            {renderAuthors(pub.authors, lp, isKR)}
                                        </p>
                                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                                            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                                            <span className="text-sm font-medium text-ink">
                                                {pub.journal}
                                            </span>
                                            <Meta>{detailsLine(pub.details, pub.year)}</Meta>
                                            {(() => {
                                                const d = pub.link.match(/doi\.org\/(.+)$/i)?.[1]?.toLowerCase();
                                                const n = d ? citations?.byDoi[d] : undefined;
                                                return n ? (
                                                    <Meta className="text-xs">
                                                        {isKR ? `피인용 ${n}` : `Cited by ${n}`}
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
                                                            {isKR ? (/cover/i.test(tag) ? "표지 논문" : /top viewed/i.test(tag) ? "많이 본 논문" : tag) : tag}
                                                        </Meta>
                                                    </span>
                                                ))}
                                            </div>
                                            <a
                                                href={pub.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`${isDoi ? "DOI" : "PDF"} — ${pub.title}`}
                                                className="inline-flex min-h-11 items-center rounded-lg border border-hairline px-2.5 transition-colors duration-150 hover:border-hairline-2 md:min-h-8"
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
                    </ArchiveYear>
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

        </Band>
    );
}
