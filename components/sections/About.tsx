"use client";

import Section from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Cpu, Atom } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function About() {
    const { t } = useLanguage();

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
                <Card className="border-t-4 border-t-rose-600">
                    <CardHeader>
                        <Flame className="h-10 w-10 text-rose-600 mb-4" />
                        <CardTitle>{t("about.tes.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {t("about.tes.description")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-rose-600">
                    <CardHeader>
                        <Cpu className="h-10 w-10 text-rose-600 mb-4" />
                        <CardTitle>{t("about.thermal.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {t("about.thermal.description")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-rose-600">
                    <CardHeader>
                        <Atom className="h-10 w-10 text-rose-600 mb-4" />
                        <CardTitle>{t("about.smr.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {t("about.smr.description")}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </Section>
    );
}
