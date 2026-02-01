"use client";

import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Cpu, Atom } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function About() {
    const { t } = useLanguage();

    const cards = [
        { icon: Flame, titleKey: "about.tes.title", descKey: "about.tes.description" },
        { icon: Cpu, titleKey: "about.thermal.title", descKey: "about.thermal.description" },
        { icon: Atom, titleKey: "about.smr.title", descKey: "about.smr.description" },
    ];

    return (
        <Section id="about" className="bg-slate-50/50">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("about.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t("about.title")}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                    {t("about.description")}
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.12 }}
                    >
                        <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white h-full">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
                                    <card.icon className="h-6 w-6 text-rose-600" />
                                </div>
                                <CardTitle>{t(card.titleKey)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {t(card.descKey)}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
