"use client";

import Image from "next/image";
import Section from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { researchAreas } from "@/app/data";

export default function Research() {
    return (
        <Section id="research">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">Focus Areas</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Research Fields</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {researchAreas.map((area, i) => (
                    <Card key={i} className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                        <div className="relative h-64 sm:h-96 bg-white p-2 sm:p-4 flex items-center justify-center">
                            <div className="relative w-full h-full">
                                <Image
                                    src={`/images/${area.image}`}
                                    alt={area.title}
                                    fill
                                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                        </div>
                    </Card>
                ))}
                {/* Network Image */}
                <Card className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative h-64 sm:h-96 bg-white p-2 sm:p-4 flex items-center justify-center">
                        <div className="relative w-full h-full">
                            <Image
                                src={`/images/Research Network.png`}
                                alt="Research Network"
                                fill
                                className="object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </Section>
    );
}
