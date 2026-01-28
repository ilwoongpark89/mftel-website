"use client";

import { useState } from "react";
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

            <div className="grid md:grid-cols-2 gap-6">
                {displayedPubs.map((pub, i) => (
                    <a
                        key={i}
                        id={`pub-${totalPubs - pub.number + 1}`}
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group h-full scroll-mt-24"
                    >
                        <Card className="hover:border-rose-200 transition-colors duration-300 h-full">
                            <CardContent className="p-6 flex gap-4 items-start h-full">
                                <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-rose-100 text-rose-600 rounded-xl items-center justify-center font-bold text-lg">
                                    {totalPubs - pub.number + 1}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-rose-600 transition-colors mb-2 leading-snug line-clamp-2">
                                        {pub.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{pub.authors}</p>
                                    <div className="flex items-center text-xs text-muted-foreground gap-3 mt-auto">
                                        <span className="font-semibold text-gray-700">{pub.journal}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span>{pub.year}</span>
                                        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </a>
                ))}
            </div>

            <div className="text-center mt-8">
                <Button
                    onClick={() => setShowAll(!showAll)}
                    variant="outline"
                >
                    {showAll ? t("publications.showLess") : t("publications.viewAll").replace("{count}", String(publications.length))}
                </Button>
            </div>
        </Section>
    );
}
