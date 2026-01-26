"use client";

import { useState } from "react";
import Section from "@/components/ui/section";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

interface NewsItem {
    date: string;
    title: string;
    description: string;
    images?: string[];
}

const newsItems: NewsItem[] = [
    {
        date: "2025. 01. 25.",
        title: "Visiting Researchers at Th2FLAB",
        description: "Sungjin Kim, Hyeon Geun Shin, and Sangmin Song will stay at NTNU for a year to conduct collaborative research with Professor Carlos Dorao. It was a hard working weekend!",
        images: [
            "/images/news/250125-hard-work-ntnu-2.jpg",
            "/images/news/250125-hard-work-ntnu-1.jpg",
        ],
    },
    {
        date: "2026. 01. 22.",
        title: "EPT Day 2026",
        description: "Prof. Il Woong Park participated in EPT Day 2026, showcasing the latest research developments in multiphase flow and thermal engineering.",
        images: [
            "/images/news/ept-day-2026-1.jpg",
            "/images/news/ept-day-2026-2.png",
        ],
    },
    {
        date: "2025. 12. 19.",
        title: "Th2FLAB Visited MFTEL",
        description: "Team Th2FLAB: Prof. Il Woong Park, Prof. Carlos Alberto Dorao, Dr. Julio Pacio from SCK CEN, and Karim Mohammed Abdalwaged Yassin.",
        images: [
            "/images/news/251219-carlos-maria-visit-1.jpeg",
            "/images/news/251219-carlos-maria-visit-2.jpeg",
        ],
    },
    {
        date: "2025. 11. 17.",
        title: "Blue Pill CEO Visited Inha University",
        description: "CEO Kwang Ho Park of Blue Pill visited Inha University and presented the future of coding using vibe coding.",
        images: [
            "/images/news/251117-vibe-coding-ceo-visit.jpeg",
            "/images/news/251117-vibe-coding-ceo-visit-2.png",
        ],
    },
    {
        date: "2025. 10. 21.",
        title: "UTFORSK 2024 at Inha University",
        description: "NTNU students visited Inha University through the UTFORSK program.",
        images: [
            "/images/news/251021-visiting-inha-utforsk-2.png",
            "/images/news/251021-visiting-inha-utforsk-1.jpeg",
        ],
    },
    {
        date: "2025. 09. 03.",
        title: "NURETH-21",
        description: "MFTEL members participated in the 21st International Topical Meeting on Nuclear Reactor Thermal Hydraulics (NURETH-21) and presented the latest research findings.",
        images: [
            "/images/news/250903-nureth.jpeg",
        ],
    },
    {
        date: "2025. 08. 14.",
        title: "MFTEL Visited Th2FLAB",
        description: "MFTEL visited Th2FLAB to discuss future collaboration on multiphase flow research.",
        images: [
            "/images/news/250814-visiting-ntnu-1.jpeg",
            "/images/news/250814-visiting-ntnu-2.jpeg",
        ],
    },
    {
        date: "2025. 08. 11.",
        title: "UTFORSK 2024 at NTNU",
        description: "MFTEL visited Prof. Hyun Joo Kim as part of the UTFORSK 2025 program.",
        images: [
            "/images/news/250811-utforsk-ntnu.jpeg",
            "/images/news/250811-utforsk-ntnu-visiting.jpeg",
        ],
    },
    {
        date: "2025. 05. 11.",
        title: "11th WORTH in China",
        description: "Hyeon Geun Shin presented research findings at the 11th WORTH conference in China.",
        images: [
            "/images/news/250505-hyeongeun-shin-worth.jpg",
        ],
    },
    {
        date: "2025. 03. 02.",
        title: "Visiting Research at HZDR and UPC",
        description: "Hyun Jin Yong conducted visiting research at HZDR, Germany, and Kyeong Ju Ko at UPC, Spain.",
        images: [
            "/images/news/250309-hyunjin-yong-hzdr.jpg",
            "/images/news/250309-kyeongju-ko-upc.jpg",
        ],
    },
];

function NewsCard({ item }: { item: NewsItem }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasImages = item.images && item.images.length > 0;

    return (
        <div
            className="border-b border-gray-200 last:border-b-0 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="py-3 px-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm text-rose-600 w-[130px] shrink-0">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-medium">{item.date}</span>
                        </div>
                        <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{item.title}</h4>
                    </div>
                    <div className="text-gray-400 shrink-0">
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4">
                    <p className="text-gray-600 text-sm mb-4 md:ml-[146px]">{item.description}</p>
                    {hasImages && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:ml-[146px]">
                            {item.images!.map((src, idx) => (
                                <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                        src={src}
                                        alt={`${item.title} - Image ${idx + 1}`}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function News() {
    return (
        <Section id="news" className="bg-white">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">News</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Latest Updates</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Stay updated with our latest research activities, conferences, and achievements.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {newsItems.map((item, index) => (
                    <NewsCard key={index} item={item} />
                ))}
            </div>
        </Section>
    );
}
