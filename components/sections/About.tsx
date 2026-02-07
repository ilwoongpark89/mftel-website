"use client";

import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { Flame, Droplets, Atom } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";

export default function About() {
    const { t, language } = useLanguage();

    const cards = [
        {
            icon: Flame,
            titleKey: "about.tes.title",
            descKey: "about.tes.description",
            iconBg: "bg-rose-100 text-rose-700",
            color: "text-rose-600",
        },
        {
            icon: Droplets,
            titleKey: "about.thermal.title",
            descKey: "about.thermal.description",
            iconBg: "bg-sky-100 text-sky-700",
            color: "text-sky-600",
        },
        {
            icon: Atom,
            titleKey: "about.smr.title",
            descKey: "about.smr.description",
            iconBg: "bg-amber-100 text-amber-700",
            color: "text-amber-600",
        },
    ];

    // Split "About Us" / "연구실 소개" so "Us" is a clickable easter egg
    const label = t("about.label");
    const renderLabel = () => {
        if (language === "EN") {
            // "About Us" → "About " + clickable "Us"
            return (
                <>
                    About{" "}
                    <Link href="/team-dashboard" className="hover:text-rose-800 transition-colors cursor-pointer">
                        Us
                    </Link>
                </>
            );
        }
        // Korean: "연구실 소개" - no easter egg in KR
        return label;
    };

    return (
        <Section id="about" className="bg-slate-50/50">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{renderLabel()}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t("about.title")}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                    {t("about.description")}
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        className="rounded-2xl border-2 border-gray-100 bg-white p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.12 }}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${card.iconBg}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-900 leading-tight">{t(card.titleKey)}</h4>
                                <p className="text-sm text-gray-500 mt-1">{t(card.descKey)}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
