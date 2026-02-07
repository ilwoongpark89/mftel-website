"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { projects, patents } from "@/app/data";
import { Rocket, Lightbulb, LayoutGrid, GanttChart } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const COLORS = [
    "bg-rose-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500",
    "bg-violet-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
    "bg-teal-500", "bg-indigo-500", "bg-lime-500", "bg-fuchsia-500",
];

function parseYearRange(yearStr: string): { start: number; end: number } {
    const parts = yearStr.split("~").map(s => parseInt(s.trim()));
    if (parts.length === 2) return { start: parts[0], end: parts[1] };
    return { start: parts[0], end: parts[0] };
}

function Timeline() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const { language } = useLanguage();

    const parsed = useMemo(() =>
        projects.map((proj, i) => ({
            ...proj,
            ...parseYearRange(proj.year),
            color: COLORS[i % COLORS.length],
        }))
    , []);

    const minYear = Math.min(...parsed.map(p => p.start));
    const maxYear = Math.max(...parsed.map(p => p.end)) + 1;
    const yearRange = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

    return (
        <div className="mb-12">
            {/* Desktop Timeline */}
            <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[700px]">
                    {/* Year headers */}
                    <div className="flex border-b border-gray-200 mb-2">
                        <div className="w-[200px] flex-shrink-0" />
                        {yearRange.map(y => (
                            <div key={y} className="flex-1 text-center text-xs font-medium text-gray-400 pb-2">
                                {y}
                            </div>
                        ))}
                    </div>

                    {/* Bars */}
                    <div className="space-y-1.5">
                        {parsed.map((proj, i) => {
                            const startOffset = ((proj.start - minYear) / (maxYear - minYear + 1)) * 100;
                            const width = proj.start === proj.end
                                ? (0.8 / (maxYear - minYear + 1)) * 100
                                : ((proj.end - proj.start + 1) / (maxYear - minYear + 1)) * 100;

                            return (
                                <div
                                    key={i}
                                    className="flex items-center group"
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                >
                                    <div className="w-[200px] flex-shrink-0 pr-3">
                                        <p className="text-xs text-gray-600 truncate font-medium leading-tight">
                                            {proj.title.length > 40 ? proj.title.slice(0, 40) + "..." : proj.title}
                                        </p>
                                    </div>
                                    <div className="flex-1 relative h-7">
                                        <motion.div
                                            className={`absolute top-0.5 h-6 rounded-md ${proj.color} cursor-pointer transition-all`}
                                            style={{
                                                left: `${startOffset}%`,
                                                width: `${width}%`,
                                                minWidth: proj.start === proj.end ? "12px" : undefined,
                                            }}
                                            initial={{ scaleX: 0, originX: 0 }}
                                            whileInView={{ scaleX: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.05, duration: 0.4 }}
                                            whileHover={{ scale: 1.03 }}
                                        >
                                            {proj.start === proj.end && (
                                                <div className={`w-3 h-3 rounded-full ${proj.color} absolute top-1.5 left-0 ring-2 ring-white`} />
                                            )}
                                        </motion.div>

                                        {/* Tooltip */}
                                        {hoveredIdx === i && (
                                            <div
                                                className="absolute z-20 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs max-w-xs"
                                                style={{
                                                    left: `${startOffset}%`,
                                                    top: "32px",
                                                }}
                                            >
                                                <p className="font-semibold mb-1 leading-tight">{proj.title}</p>
                                                <p className="text-slate-300 text-[11px]">{proj.sponsor}</p>
                                                <p className="text-slate-400 mt-1">{proj.year}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Vertical Timeline */}
            <div className="md:hidden space-y-3">
                {parsed.map((proj, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-3"
                    >
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${proj.color} flex-shrink-0`} />
                            {i < parsed.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-4">
                            <span className="text-xs font-medium text-gray-400">{proj.year}</span>
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{proj.title}</p>
                            <p className="text-xs text-gray-500">{proj.sponsor}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default function Projects() {
    const [showAllProjects, setShowAllProjects] = useState(false);
    const [view, setView] = useState<"grid" | "timeline">("grid");
    const displayedProjects = showAllProjects ? projects : projects.slice(0, 4);
    const { t, language } = useLanguage();

    return (
        <Section id="projects">
            {/* Projects */}
            <div className="text-center max-w-3xl mx-auto mb-8">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("projects.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{t("projects.title")}</h3>
            </div>

            {/* View Toggle */}
            <div className="flex justify-center gap-2 mb-8">
                <button
                    onClick={() => setView("grid")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        view === "grid"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Grid
                </button>
                <button
                    onClick={() => setView("timeline")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        view === "timeline"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                >
                    <GanttChart className="w-4 h-4" />
                    Timeline
                </button>
            </div>

            {view === "timeline" ? (
                <Timeline />
            ) : (
                <>
                    <div className="grid md:grid-cols-2 gap-5 mb-12">
                        {displayedProjects.map((proj, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <div className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full p-5 flex gap-4 items-start">
                                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Rocket className="w-4.5 h-4.5 text-rose-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h4 className="text-base font-semibold leading-tight">{proj.title}</h4>
                                            <span className="text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-full text-slate-500 flex-shrink-0">
                                                {proj.year}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{proj.sponsor}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mb-24">
                        <Button
                            onClick={() => setShowAllProjects(!showAllProjects)}
                            variant="outline"
                            className="rounded-full px-8"
                        >
                            {showAllProjects ? t("projects.showLess") : t("projects.viewAll").replace("{count}", String(projects.length))}
                        </Button>
                    </div>
                </>
            )}

            {/* Patents */}
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h3 className="text-2xl font-bold text-gray-900">{t("projects.patents")}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
                {patents.map((patent, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 flex gap-4 items-start">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base font-semibold leading-tight mb-1">{patent.title}</h4>
                                <p className="text-sm text-gray-500">{patent.number}</p>
                                {patent.date && <p className="text-xs text-gray-400 mt-1">{patent.date}</p>}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
