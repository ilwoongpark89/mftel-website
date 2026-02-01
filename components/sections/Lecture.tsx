"use client";

import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { BookOpen, Calculator, Code } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const lectures = [
    {
        icon: BookOpen,
        title: "Heat Transfer",
        titleKR: "열전달",
        color: "bg-rose-50 text-rose-500",
        href: "https://mftel-lecture-heattransfer.vercel.app/",
        disabled: true,
    },
    {
        icon: Calculator,
        title: "Numerical Analysis",
        titleKR: "수치해석",
        color: "bg-sky-50 text-sky-500",
        href: "https://mftel-lecture-numericalanalyis.vercel.app/",
        disabled: true,
    },
    {
        icon: Code,
        title: "Vibe Coding",
        titleKR: "바이브 코딩",
        color: "bg-amber-50 text-amber-500",
        href: "https://mftel-lecture-vibecoding.vercel.app/",
        disabled: false,
    },
];

export default function Lecture() {
    const { t, language } = useLanguage();

    return (
        <Section id="lecture">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">
                    {language === "KR" ? "강의" : "Lecture"}
                </h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {language === "KR" ? "교과목 안내" : "Course Materials"}
                </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
                {lectures.map((lec, i) => {
                    const Tag = lec.disabled ? "div" : "a";
                    const linkProps = lec.disabled ? {} : { href: lec.href, target: "_blank", rel: "noopener noreferrer" };
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12 }}
                        >
                            <Tag {...linkProps} className={`block ${lec.disabled ? "cursor-default" : ""}`}>
                                <div className={`rounded-2xl border-2 border-gray-100 p-5 transition-all duration-300 flex items-start gap-3 ${lec.disabled ? "bg-gray-50 opacity-50" : "bg-white hover:shadow-lg hover:-translate-y-1 cursor-pointer"}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${lec.disabled ? "bg-gray-100 text-gray-400" : lec.color}`}>
                                        <lec.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className={`text-base font-bold ${lec.disabled ? "text-gray-400" : "text-gray-900"}`}>{language === "KR" ? lec.titleKR : lec.title}</h4>
                                        {lec.disabled && <span className="text-xs text-gray-400">{language === "KR" ? "준비중" : "Coming soon"}</span>}
                                    </div>
                                </div>
                            </Tag>
                        </motion.div>
                    );
                })}
            </div>
        </Section>
    );
}
