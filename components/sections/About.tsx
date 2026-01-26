"use client";

import Section from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Cpu, Atom } from "lucide-react";

export default function About() {
    return (
        <Section id="about" className="bg-slate-50/50">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">About Us</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Pioneering Thermal Engineering</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                    MFTEL focuses on solving critical energy challenges through advanced research in multiphase flow and heat transfer.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-t-4 border-t-rose-600">
                    <CardHeader>
                        <Flame className="h-10 w-10 text-rose-600 mb-4" />
                        <CardTitle>TES and Carnot Battery</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Developing high-efficiency thermal energy storage systems and Carnot batteries for sustainable grid stability.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-rose-600">
                    <CardHeader>
                        <Cpu className="h-10 w-10 text-rose-600 mb-4" />
                        <CardTitle>Thermal Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Advanced cooling solutions for electronic devices, batteries, and high-performance computing systems.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-rose-600">
                    <CardHeader>
                        <Atom className="h-10 w-10 text-rose-600 mb-4" />
                        <CardTitle>Small Modular Reactor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Enhancing the safety and efficiency of Small Modular Reactors through advanced thermal-hydraulic analysis.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </Section>
    );
}
