"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { publications } from "@/app/data";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Publications() {
    const [showAll, setShowAll] = useState(false);
    const displayedPubs = showAll ? publications : publications.slice(0, 6);
    const totalPubs = publications.length;
    const { t } = useLanguage();

    return (
        <Section id="publications" className="bg-slate-50/50">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("publications.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("publications.title")}</h3>
                <p className="text-gray-500">
                    {t("publications.count").replace("{count}", String(publications.length))}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
                {displayedPubs.map((pub, i) => (
                    <motion.a
                        key={i}
                        id={`pub-${totalPubs - pub.number + 1}`}
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group h-full scroll-mt-24"
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
                                    <h4 className="text-base font-semibold text-gray-900 group-hover:text-rose-600 transition-colors mb-2 leading-snug line-clamp-2">
                                        {pub.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{pub.authors}</p>
                                    <div className="flex items-center text-xs text-gray-400 gap-2 mt-auto">
                                        <span className="font-medium text-gray-600">{pub.journal}</span>
                                        <span className="text-gray-300">·</span>
                                        <span>{pub.year}</span>
                                        <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-rose-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.a>
                ))}
            </div>

            <div className="text-center mt-10">
                <Button
                    onClick={() => setShowAll(!showAll)}
                    variant="outline"
                    className="rounded-full px-8"
                >
                    {showAll ? t("publications.showLess") : t("publications.viewAll").replace("{count}", String(publications.length))}
                </Button>
            </div>
        </Section>
    );
}
