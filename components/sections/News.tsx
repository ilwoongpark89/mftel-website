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
        date: "2026. 05. 21.",
        title: {
            EN: "2026 New Industry Global HR Development Program — Call for Overseas Dispatch Students",
            KR: "2026 신산업 글로벌 인력양성사업 해외파견 학생 모집 공고"
        },
        description: {
            EN: `「Development of a Korean-style Energy Island Based on Wind Power — New Industry Global HR Development Program」 (Project No. RS-2026-25540249)

Sponsored by the Ministry of Climate, Energy and Environment. We are recruiting graduate students to participate in overseas education and research programs.

1. Program Overview
- Title: Development of a Korean-style Energy Island Based on Wind Power — New Industry Global HR Development Program
- Project No.: RS-2026-25540249
- Period: 2026. 4. 1. – 2027. 3. 31. (12 months)
- Scope: Overseas education, research, and field training to strengthen global competence in wind power and energy island fields.

2. Recruitment
- Eligibility: Graduate students in participating departments
- Destination country: To be announced individually
- Dispatch period: At least 6 months within the project period
- Support: Airfare, living expenses, tuition, etc. (partial or full; varies by country/program)

3. Qualifications
- Master's / PhD students with research outputs in the dispatch field and active conference participation
- Able to conduct on-site research for at least 6 months
- Sufficient foreign-language proficiency for research communication
- Holds related research experience and capabilities
- Holds a valid passport (no expiry during dispatch) and meets visa requirements

4. Application
- Posting period: From the announcement date
- Deadline: 2026. 5. 31. (Sun) 18:00
- Documents: Application form, dispatch research plan, enrollment certificate, language proficiency proof or advisor's confirmation, passport copy (or issuance plan)
- Submission: Email to ilwoongpark@inha.ac.kr

5. Selection
- Document and interview review
- Criteria: foreign-language ability, research-field fit, related performance, study-abroad plan, academic plan, and motivation

6. Notes
- Submitted documents will not be returned.
- Selection may be cancelled if false information is provided.
- Schedule and program details may change.
- A SCIE-class paper Accept within 1 year after dispatch is required. Failure may require partial or full return of the support.
- Other matters follow the program operating standards.

7. Contact
- Inha University, Department of Mechanical Engineering
- Prof. Il Woong Park
- Email: ilwoongpark@inha.ac.kr`,
            KR: `「풍력발전 기반 한국형 에너지 아일랜드 개발을 위한 신산업 글로벌 인력양성사업」
(과제번호: RS-2026-25540249)

본 사업단에서는 기후에너지환경부 지원 「풍력발전 기반 한국형 에너지 아일랜드 개발을 위한 신산업 글로벌 인력양성사업」의 일환으로 해외 교육 및 연구 프로그램에 참여할 학생을 아래와 같이 모집하오니 관심 있는 학생들의 많은 지원 바랍니다.

1. 사업 개요
- 사업명: 풍력발전 기반 한국형 에너지 아일랜드 개발을 위한 신산업 글로벌 인력양성사업
- 과제번호: RS-2026-25540249
- 사업기간: 2026. 4. 1. ~ 2027. 3. 31. (12개월)
- 주요내용: 풍력발전 및 에너지 아일랜드 분야 글로벌 역량 강화를 위한 해외 교육·연구·현장연수 프로그램 운영

2. 모집 개요
- 모집대상: 본 사업 참여 학과 대학원생
- 파견국가: 추후 개별 안내
- 파견기간: 사업기간 내 최소 6개월
- 지원내용: 항공료, 체재비, 교육비 등 일부 또는 전액 지원 ※ 파견 국가 및 프로그램에 따라 지원 비용은 상이할 수 있음

3. 지원 자격
- 파견연구 분야 연구 결과물이 있으며 활발하게 학회 참여 중인 석·박사과정 학생
- 최소 6개월 이상 현지에서 파견연구 활동을 수행할 수 있는 석·박사 과정 학생
- 파견연구를 위한 소통이 가능하도록 충분한 외국어 능력을 겸비한 학생
- 파견연구 주제와 직·간접적 관련 연구를 수행하였으며, 해당 역량을 보유한 학생
- 여권 소지, 파견기간 중 만료일 도래 여부 및 비자발급 조건에 결함이 없는 학생

4. 신청 방법
- 공고 시작일: 공고일로부터
- 접수 마감일: 2026년 5월 31일(일) 18:00까지
- 제출서류: 참가 지원서 1부 / 파견 연구계획서 1부 / 재학증명서 또는 과정확인 서류 1부 / 어학능력 증빙서류 또는 지도교수 확인서 / 여권 사본 또는 여권 발급 예정 확인 자료
- 접수방법: 이메일 접수 (ilwoongpark@inha.ac.kr)

5. 선발 방법
- 서류심사 및 면접심사 진행
- 평가 기준: 외국어 능력, 연구 분야 적합성, 지원연구 관련 실적, 국외수학 계획서, 학업계획 및 참여 의지 등

6. 유의사항
- 제출된 서류는 반환하지 않음
- 허위 사실 기재 시 선발이 취소될 수 있음
- 해외 파견 일정 및 세부 프로그램은 사정에 따라 변경될 수 있음
- 파견 후 1년 안에 SCIE급 논문 Accept이 필수임. 조건을 만족하지 못할 경우 지원 경비 일부 또는 전액 반환이 요구됨
- 기타 사항은 사업단 운영 기준에 따름

7. 문의처
- 인하대학교 기계공학과 박일웅 교수
- 이메일: ilwoongpark@inha.ac.kr`
        },
    },
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
                            <p className="text-gray-600 text-sm mb-4 sm:ml-[154px] whitespace-pre-line">{item.description[language]}</p>
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
