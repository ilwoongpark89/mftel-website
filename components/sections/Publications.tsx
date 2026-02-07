"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { publications } from "@/app/data";
import { ExternalLink, Search, Copy, Check, ChevronDown, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const CATEGORIES = [
    { key: "all", label: "All", labelKR: "전체" },
    { key: "boiling", label: "Boiling", labelKR: "비등" },
    { key: "condensation", label: "Condensation", labelKR: "응축" },
    { key: "smr", label: "SMR", labelKR: "SMR" },
    { key: "tes", label: "TES", labelKR: "TES" },
    { key: "wettability", label: "Wettability", labelKR: "젖음성" },
];

function generateBibTeX(pub: typeof publications[0]) {
    const firstAuthor = pub.authors.split(",")[0].trim().replace("*", "");
    const lastName = firstAuthor.split(" ").pop() || "Author";
    const key = `${lastName.toLowerCase()}${pub.year}`;
    return `@article{${key},
  author = {${pub.authors.replace(/\*/g, "")}},
  title = {${pub.title}},
  journal = {${pub.journal}},
  year = {${pub.year}},
  doi = {${pub.link.replace("https://doi.org/", "")}}
}`;
}

function generateAPA(pub: typeof publications[0]) {
    const authorList = pub.authors.replace(/\*/g, "");
    return `${authorList} (${pub.year}). ${pub.title}. ${pub.journal}. ${pub.link}`;
}

export default function Publications() {
    const [showAll, setShowAll] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [authorSearch, setAuthorSearch] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [citeOpen, setCiteOpen] = useState<number | null>(null);
    const { t, language } = useLanguage();

    const years = useMemo(() => {
        const uniqueYears = [...new Set(publications.map(p => p.year))].sort((a, b) => b.localeCompare(a));
        return uniqueYears;
    }, []);

    const filteredPubs = useMemo(() => {
        return publications.filter(pub => {
            const matchCategory = activeCategory === "all" || (pub.category && pub.category.includes(activeCategory));
            const matchYear = selectedYear === "all" || pub.year === selectedYear;
            const matchAuthor = !authorSearch || pub.authors.toLowerCase().includes(authorSearch.toLowerCase());
            return matchCategory && matchYear && matchAuthor;
        });
    }, [activeCategory, selectedYear, authorSearch]);

    const displayedPubs = showAll ? filteredPubs : filteredPubs.slice(0, 6);
    const totalPubs = publications.length;
    const hasFilters = activeCategory !== "all" || selectedYear !== "all" || authorSearch !== "";

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const clearFilters = () => {
        setActiveCategory("all");
        setSelectedYear("all");
        setAuthorSearch("");
    };

    return (
        <Section id="publications" className="bg-slate-50/50">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("publications.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("publications.title")}</h3>
                <p className="text-gray-500">
                    {t("publications.count").replace("{count}", String(publications.length))}
                </p>
            </div>

            {/* Filters */}
            <div className="mb-8 space-y-4">
                {/* Category Pills */}
                <div className="flex flex-wrap justify-center gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                activeCategory === cat.key
                                    ? "bg-rose-500 text-white shadow-sm"
                                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                            }`}
                        >
                            {language === "KR" ? cat.labelKR : cat.label}
                        </button>
                    ))}
                </div>

                {/* Year + Author Row */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-xl mx-auto">
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(e.target.value)}
                            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 cursor-pointer"
                        >
                            <option value="all">{language === "KR" ? "전체 연도" : "All Years"}</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={language === "KR" ? "저자 검색..." : "Search by author..."}
                            value={authorSearch}
                            onChange={e => setAuthorSearch(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300"
                        />
                    </div>
                </div>

                {/* Filter Results Count */}
                {hasFilters && (
                    <div className="text-center">
                        <span className="text-sm text-gray-500">
                            {filteredPubs.length} / {totalPubs} {language === "KR" ? "편" : "papers"}
                        </span>
                        <button onClick={clearFilters} className="ml-2 text-sm text-rose-500 hover:text-rose-600 font-medium">
                            {language === "KR" ? "필터 초기화" : "Clear filters"}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
                {displayedPubs.map((pub, i) => (
                    <motion.div
                        key={pub.number}
                        id={`pub-${totalPubs - pub.number + 1}`}
                        className="block group h-full scroll-mt-24 relative"
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full border-transparent hover:border-rose-200 bg-white">
                            <CardContent className="p-6 flex gap-4 items-start h-full">
                                <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 text-slate-500 items-center justify-center font-semibold text-sm">
                                    {totalPubs - pub.number + 1}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <a
                                        href={pub.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-base font-semibold text-gray-900 group-hover:text-rose-600 transition-colors mb-2 leading-snug line-clamp-2 hover:underline"
                                    >
                                        {pub.title}
                                    </a>
                                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{pub.authors}</p>
                                    <div className="flex items-center text-xs text-gray-400 gap-2 mt-auto">
                                        <span className="font-medium text-gray-600">{pub.journal}</span>
                                        <span className="text-gray-300">·</span>
                                        <span>{pub.year}</span>
                                        {/* Cite Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCiteOpen(citeOpen === pub.number ? null : pub.number);
                                            }}
                                            className="ml-auto px-2 py-0.5 rounded text-xs font-medium text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Cite
                                        </button>
                                        <a href={pub.link} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400" />
                                        </a>
                                    </div>

                                    {/* Citation Popup */}
                                    <AnimatePresence>
                                        {citeOpen === pub.number && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 overflow-hidden"
                                            >
                                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-slate-600">BibTeX</span>
                                                        <button
                                                            onClick={() => handleCopy(generateBibTeX(pub), `bib-${pub.number}`)}
                                                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition-colors"
                                                        >
                                                            {copiedId === `bib-${pub.number}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                            {copiedId === `bib-${pub.number}` ? "Copied!" : "Copy"}
                                                        </button>
                                                    </div>
                                                    <pre className="text-[10px] text-slate-600 bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                                        {generateBibTeX(pub)}
                                                    </pre>

                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-slate-600">APA</span>
                                                        <button
                                                            onClick={() => handleCopy(generateAPA(pub), `apa-${pub.number}`)}
                                                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition-colors"
                                                        >
                                                            {copiedId === `apa-${pub.number}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                            {copiedId === `apa-${pub.number}` ? "Copied!" : "Copy"}
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border leading-relaxed">
                                                        {generateAPA(pub)}
                                                    </p>
                                                    <button
                                                        onClick={() => setCiteOpen(null)}
                                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-1"
                                                    >
                                                        <X className="w-3 h-3" /> Close
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {filteredPubs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">{language === "KR" ? "검색 결과가 없습니다" : "No publications found"}</p>
                    <button onClick={clearFilters} className="mt-2 text-sm text-rose-500 hover:text-rose-600">
                        {language === "KR" ? "필터 초기화" : "Clear filters"}
                    </button>
                </div>
            )}

            {filteredPubs.length > 6 && (
                <div className="text-center mt-10">
                    <Button
                        onClick={() => setShowAll(!showAll)}
                        variant="outline"
                        className="rounded-full px-8"
                    >
                        {showAll ? t("publications.showLess") : `${language === "KR" ? "전체 보기" : "View All"} (${filteredPubs.length})`}
                    </Button>
                </div>
            )}
        </Section>
    );
}
