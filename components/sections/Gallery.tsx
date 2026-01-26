"use client";

import Image from "next/image";
import Section from "@/components/ui/section";
import { galleryImages } from "@/app/data";
import { Card } from "@/components/ui/card";

export default function Gallery() {
    return (
        <Section id="gallery" className="bg-slate-900 text-white">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-3">Moments</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-white">Lab Life</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {galleryImages.map((item, i) => (
                    <Card key={i} className="group bg-slate-800 border-none overflow-hidden">
                        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
                            <Image
                                src={`/images/${item.image}`}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-0 left-0 p-6">
                                <p className="text-rose-400 text-sm font-medium mb-1">{item.date}</p>
                                <h4 className="text-xl font-bold text-white leading-tight">{item.title}</h4>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </Section>
    );
}
