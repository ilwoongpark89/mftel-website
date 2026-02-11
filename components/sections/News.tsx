"use client";

import { useState } from "react";
import Section from "@/components/ui/section";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

interface NewsItem {
    date: string;
    title: { EN: string; KR: string };
    description: { EN: string; KR: string };
    images?: string[];
}

const newsItems: NewsItem[] = [
    {
        date: "2026. 01. 25.",
        title: {
            EN: "Visiting Researchers at Th2FLAB",
            KR: "NTNU Th2FLAB 방문연구 시작"
        },
        description: {
            EN: "Sungjin Kim, Hyeon Geun Shin, and Sangmin Song will stay at NTNU for a year to conduct collaborative research with Professor Carlos Dorao. It was a hard working weekend!",
            KR: "김성진, 신현근, 송상민 학생이 Carlos Dorao 교수님과 공동연구를 위해 NTNU에서 1년간 방문연구를 시작합니다. 주말임에도 Carlos 교수님께서 실험장치 세팅을 도와주셨습니다!"
        },
        images: [
            "/images/news/250125-hard-work-ntnu-2.jpg",
            "/images/news/250125-hard-work-ntnu-1.jpg",
        ],
    },
    {
        date: "2026. 01. 22.",
        title: {
            EN: "EPT Day 2026",
            KR: "EPT Day 2026"
        },
        description: {
            EN: "Prof. Il Woong Park participated in EPT Day 2026, showcasing the latest research developments in multiphase flow and thermal engineering.",
            KR: "박일웅 교수님이 EPT Day 2026에 참가하여 다상유동 및 열공학 분야 최신 연구 성과를 소개하였습니다."
        },
        images: [
            "/images/news/ept-day-2026-1.jpg",
            "/images/news/ept-day-2026-2.png",
        ],
    },
    {
        date: "2025. 12. 19.",
        title: {
            EN: "MFTEL Visited Th2FLAB",
            KR: "MFTEL의 NTNU Th2FLAB 방문"
        },
        description: {
            EN: "MFTEL students visited NTNU Th2FLAB in Norway for research collaboration and exchange.",
            KR: "MFTEL 학생들이 노르웨이 NTNU의 Th2FLAB을 방문하여 공동연구 및 학술교류를 진행하였습니다."
        },
        images: [
            "/images/news/251219-carlos-maria-visit-1.jpeg",
            "/images/news/251219-carlos-maria-visit-2.jpeg",
        ],
    },
    {
        date: "2025. 11. 17.",
        title: {
            EN: "Buildersgate CEO Visited Inha University",
            KR: "빌더스게이트 대표님 특강"
        },
        description: {
            EN: "CEO Kwang Ho Park of Buildersgate visited Inha University and presented the future of coding using vibe coding.",
            KR: "빌더스게이트 박광호 대표님이 인하대를 방문하여 '바이브 코딩으로 보는 코딩의 미래'를 주제로 특강을 진행해주셨습니다."
        },
        images: [
            "/images/news/251117-vibe-coding-ceo-visit.jpeg",
            "/images/news/251117-vibe-coding-ceo-visit-2.png",
        ],
    },
    {
        date: "2025. 10. 21.",
        title: {
            EN: "UTFORSK 2024 at Inha University",
            KR: "UTFORSK - NTNU 학생들 인하대 방문"
        },
        description: {
            EN: "NTNU students visited Inha University through the UTFORSK program.",
            KR: "UTFORSK 프로그램으로 NTNU 학생들이 인하대학교를 방문하였습니다."
        },
        images: [
            "/images/news/251021-visiting-inha-utforsk-2.png",
            "/images/news/251021-visiting-inha-utforsk-1.jpeg",
        ],
    },
    {
        date: "2025. 09. 03.",
        title: {
            EN: "NURETH-21",
            KR: "NURETH-21 국제학회"
        },
        description: {
            EN: "MFTEL participated in NURETH-21 with NTNU Th2FLAB members: Prof. Carlos Dorao, Th2FLAB alumni Dr. Julio Pacio, and PhD student Karim.",
            KR: "MFTEL이 NTNU Th2FLAB과 함께 NURETH-21에 참가하였습니다. Carlos Dorao 교수님, Th2FLAB 졸업생 Julio Pacio 박사님, 박사과정 Karim과 함께했습니다."
        },
        images: [
            "/images/news/250903-nureth.jpeg",
        ],
    },
    {
        date: "2025. 08. 14.",
        title: {
            EN: "MFTEL Visited Th2FLAB",
            KR: "NTNU Th2FLAB 방문"
        },
        description: {
            EN: "MFTEL visited Th2FLAB to discuss future collaboration on multiphase flow research.",
            KR: "다상유동 공동연구 논의를 위해 노르웨이 NTNU의 Th2FLAB을 방문하였습니다."
        },
        images: [
            "/images/news/250814-visiting-ntnu-1.jpeg",
            "/images/news/250814-visiting-ntnu-2.jpeg",
        ],
    },
    {
        date: "2025. 08. 11.",
        title: {
            EN: "UTFORSK 2024 at NTNU",
            KR: "UTFORSK - NTNU 방문"
        },
        description: {
            EN: "MFTEL visited Prof. Hyun Joo Kim as part of the UTFORSK 2025 program.",
            KR: "UTFORSK 프로그램으로 NTNU 김현주 교수님 연구실을 방문하였습니다."
        },
        images: [
            "/images/news/250811-utforsk-ntnu.jpeg",
            "/images/news/250811-utforsk-ntnu-visiting.jpeg",
        ],
    },
    {
        date: "2025. 05. 11.",
        title: {
            EN: "11th WORTH in China",
            KR: "WORTH-11 학회 (중국)"
        },
        description: {
            EN: "Hyeon Geun Shin presented research findings at the 11th WORTH conference in China.",
            KR: "신현근 학생이 중국에서 열린 제11회 WORTH 학회에서 연구 결과를 발표하였습니다."
        },
        images: [
            "/images/news/250505-hyeongeun-shin-worth.jpg",
        ],
    },
    {
        date: "2025. 03. 02.",
        title: {
            EN: "Visiting Research at HZDR and UPC",
            KR: "독일 HZDR, 스페인 UPC 방문연구"
        },
        description: {
            EN: "Hyun Jin Yong conducted visiting research at HZDR, Germany, and Kyeong Ju Ko at UPC, Spain.",
            KR: "용현진 학생은 독일 HZDR에서, 고경주 학생은 스페인 UPC에서 방문연구를 수행하였습니다."
        },
        images: [
            "/images/news/250309-hyunjin-yong-hzdr.jpg",
            "/images/news/250309-kyeongju-ko-upc.jpg",
        ],
    },
];

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasImages = item.images && item.images.length > 0;
    const { language } = useLanguage();

    return (
        <div
            className="border-b border-gray-100 last:border-b-0 cursor-pointer group"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="py-3 px-5 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Thumbnail preview */}
                        {hasImages && (
                            <div className="hidden sm:block relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                <Image
                                    src={item.images![0]}
                                    alt=""
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-sm text-rose-600 w-[130px] shrink-0">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-medium">{item.date}</span>
                        </div>
                        <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{item.title[language]}</h4>
                    </div>
                    <div className="shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors">
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5">
                            <p className="text-gray-600 text-sm mb-4 sm:ml-[154px]">{item.description[language]}</p>
                            {hasImages && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:ml-[154px]">
                                    {item.images!.map((src, idx) => (
                                        <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                                            <Image
                                                src={src}
                                                alt={`${item.title[language]} - Image ${idx + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 400px"
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function News() {
    const { t } = useLanguage();

    return (
        <Section id="news" className="bg-white">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("news.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t("news.title")}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                    {t("news.description")}
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                {newsItems.map((item, index) => (
                    <NewsCard key={index} item={item} index={index} />
                ))}
            </div>
        </Section>
    );
}
