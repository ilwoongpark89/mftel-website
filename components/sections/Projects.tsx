"use client";

import { useState } from "react";
import Section from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { projects, patents } from "@/app/data";
import { Rocket, Lightbulb } from "lucide-react";

export default function Projects() {
    const [showAllProjects, setShowAllProjects] = useState(false);
    const displayedProjects = showAllProjects ? projects : projects.slice(0, 4);

    return (
        <Section id="projects">
            {/* Projects */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">Funding & Patents</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Research Projects</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
                {displayedProjects.map((proj, i) => (
                    <Card key={i} className="bg-rose-50 border-none hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <Rocket className="w-6 h-6 text-rose-500" />
                                <span className="text-xs font-mono bg-white px-2 py-1 rounded text-gray-600">
                                    {proj.year}
                                </span>
                            </div>
                            <CardTitle className="text-lg leading-tight">{proj.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{proj.sponsor}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center mb-24">
                <Button
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    variant="outline"
                >
                    {showAllProjects ? "Show Less" : `View All Projects (${projects.length})`}
                </Button>
            </div>

            {/* Patents */}
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h3 className="text-2xl font-bold text-gray-900">Patents</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                {patents.map((patent, i) => (
                    <Card key={i} className="bg-slate-50 border-none">
                        <CardHeader>
                            <Lightbulb className="w-6 h-6 text-yellow-500 mb-2" />
                            <CardTitle className="text-lg">{patent.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-mono text-gray-500">{patent.number}</p>
                            {patent.date && <p className="text-xs text-gray-400 mt-1">{patent.date}</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Section>
    );
}
