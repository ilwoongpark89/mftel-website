"use client";

import Image from "next/image";
import Section from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Professor() {
    return (
        <Section id="professor">
            <div className="grid md:grid-cols-12 gap-12 items-start">
                {/* Image Column */}
                <div className="md:col-span-5 relative">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-2xl">
                        <Image
                            src="/images/Professor_Il Woong Park.png"
                            alt="Prof. Il Woong Park"
                            fill
                            className="object-cover"
                        />
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-100 rounded-full -z-10" />
                    <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-50 rounded-full -z-10" />
                </div>

                {/* Content Column */}
                <div className="md:col-span-7 space-y-8">
                    <div>
                        <Badge variant="secondary" className="mb-4">Laboratory Director</Badge>
                        <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Prof. Il Woong Park</h2>
                        <p className="text-xl text-rose-600 font-medium">Assistant Professor, Inha University</p>
                    </div>

                    <div className="prose prose-lg text-gray-600">
                        <p>
                            Leading the Multiphase Flow and Thermal Engineering Laboratory, Prof. Park is dedicated to advancing the understanding of complex thermal phenomena. His research bridges fundamental science and practical applications in energy systems.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card className="bg-slate-50 border-none shadow-sm">
                            <CardContent className="pt-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Education</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Ph.D. NTNU, Norway (2018)</li>
                                    <li>• M.S. Seoul National University (2013)</li>
                                    <li>• B.S. Seoul National University (2011)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-50 border-none shadow-sm">
                            <CardContent className="pt-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Career</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Asst. Prof, Inha Univ (2022-)</li>
                                    <li>• Res. Prof, Seoul Nat&apos;l Univ (2022)</li>
                                    <li>• Res. Prof, Jeju Nat&apos;l Univ (2018 ~ 21)</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Section>
    );
}
