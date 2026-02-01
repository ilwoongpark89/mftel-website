"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { projects, patents } from "@/app/data";
import { Rocket, Lightbulb } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Projects() {
    const [showAllProjects, setShowAllProjects] = useState(false);
    const displayedProjects = showAllProjects ? projects : projects.slice(0, 4);
    const { t } = useLanguage();

    return (
        <Section id="projects">
            {/* Projects */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("projects.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{t("projects.title")}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-12">
                {displayedProjects.map((proj, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <Card className="bg-white border-none shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                                        <Rocket className="w-4.5 h-4.5 text-rose-500" />
                                    </div>
                                    <span className="text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-full text-slate-500">
                                        {proj.year}
                                    </span>
                                </div>
                                <CardTitle className="text-lg leading-tight">{proj.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{proj.sponsor}</p>
                            </CardContent>
                        </Card>
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
                        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all duration-300">
                            <CardHeader>
                                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
                                    <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                                </div>
                                <CardTitle className="text-lg">{patent.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">{patent.number}</p>
                                {patent.date && <p className="text-xs text-gray-400 mt-1">{patent.date}</p>}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
