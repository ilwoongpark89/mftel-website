"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { teamMembers, alumni, publications } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";

// 학생 이름과 논문 저자 매칭 (띄어쓰기/스펠링 변형 처리)
const getStudentPublications = (studentName: string) => {
    const nameVariants = studentName.toLowerCase().replace(/\s+/g, '');
    const totalPubs = publications.length;

    return publications
        .filter(pub => {
            const authorsNormalized = pub.authors.toLowerCase().replace(/\s+/g, '');
            return authorsNormalized.includes(nameVariants);
        })
        .map(pub => totalPubs - pub.number + 1)
        .sort((a, b) => a - b);
};

type TeamMember = typeof teamMembers[0];

// 학생별 필라 색상 매핑 (연구 분야 기준)
const pillarColorMap: Record<string, "rose" | "sky" | "amber"> = {
    "Hyun Jin Yong": "sky",       // Boiling → Immersion
    "Jun Beom Song": "rose",      // TES
    "Sang Min Song": "rose",      // Condensation → TES
    "Jae Hyeok Yang": "amber",    // Thermal-hydraulic → SMR
    "Hyeon Geun Shin": "rose",    // TES
    "Sung Jin Kim": "sky",        // Boiling, Dielectric fluid → Immersion
    "Kyeong Ju Ko": "amber",     // CFD → SMR
    "Chaeyeon Kim": "sky",        // Immersion
    "Eunbin Park": "amber",       // Two-phase flow instability → SMR
    "Manho Kim": "amber",         // CFD → SMR
    "Joonhwan Hyun": "rose",     // TES
    "Yeongjun Jung": "sky",       // Boiling → Immersion
};

const checkerColors: Record<string, [string, string]> = {
    rose:  ["rgba(120,30,50,0.3)", "rgba(100,25,42,0.2)"],
    sky:   ["rgba(20,100,160,0.4)", "rgba(15,82,135,0.3)"],
    amber: ["rgba(160,90,20,0.35)", "rgba(135,75,15,0.25)"],
};

// 플립 카드 컴포넌트
function FlipCard({ member, index, isVisible }: {
    member: TeamMember;
    index: number;
    isVisible: boolean;
}) {
    const [isFlipped, setIsFlipped] = useState(false);
    const pubs = getStudentPublications(member.name);
    const { language } = useLanguage();

    const displayName = language === "KR" ? member.nameKR : member.name;
    const displayDegree = language === "KR" ? member.degreeKR : member.degree;
    const displayResearch = language === "KR" ? member.researchKR : member.research;
    const pColor = pillarColorMap[member.name] || "rose";
    const [c1, c2] = checkerColors[pColor];

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsFlipped(true);
            }, index * 200);
            return () => clearTimeout(timer);
        }
    }, [isVisible, index]);

    return (
        <div className="perspective-1000 cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
                className="relative w-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            >
                {/* 뒷면 (처음에 보이는 면) */}
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="rounded-xl overflow-hidden shadow-md h-full"
                        style={{
                            backgroundImage: `repeating-conic-gradient(${c1} 0% 25%, ${c2} 0% 50%)`,
                            backgroundSize: "20px 20px",
                        }}
                    >
                        <div className="aspect-[3/4]" />
                        <div className="py-3 px-4" />
                    </div>
                </div>

                {/* 앞면 (플립 후 보이는 면) */}
                <div
                    className="backface-hidden"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <Card className="overflow-hidden group border-none shadow-md hover:shadow-xl transition-all duration-300">
                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                            <Image
                                src={`/images/${member.name}.jpg`}
                                alt={displayName}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-0 left-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                <p className="text-xs font-medium uppercase tracking-wider text-rose-200">{displayDegree}</p>
                            </div>
                        </div>
                        <CardContent className="text-center pt-3 pb-3">
                            <h4 className="text-xl font-bold text-gray-900 mb-1">{displayName}</h4>
                            <p className="text-base text-gray-500">{displayDegree}</p>
                            <p className="text-sm text-gray-500 mt-2 font-medium">{displayResearch.split(',').map(r => `#${r.trim()}`).join(' ')}</p>
                            <p className="text-xs text-gray-400 mt-1 min-h-[1rem]">
                                {pubs.length > 0 ? pubs.map((n, idx) => (
                                    <a
                                        key={idx}
                                        href={`#pub-${n}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const pubElement = document.getElementById(`pub-${n}`);
                                            if (!pubElement) {
                                                const viewAllBtn = document.querySelector('#publications button');
                                                if (viewAllBtn) (viewAllBtn as HTMLButtonElement).click();
                                                setTimeout(() => {
                                                    document.getElementById(`pub-${n}`)?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            } else {
                                                pubElement.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                        className="hover:text-rose-600 transition-colors mr-1"
                                    >
                                        #{n}
                                    </a>
                                )) : <span className="invisible">-</span>}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}

// 한 줄 (4장) 단위 플립 카드 Row
function FlipCardRow({ members, rowIndex }: { members: TeamMember[]; rowIndex: number }) {
    const [isVisible, setIsVisible] = useState(false);
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (rowRef.current) {
            observer.observe(rowRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={rowRef} className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {members.map((member, i) => (
                <FlipCard key={i} member={member} index={i} isVisible={isVisible} />
            ))}
        </div>
    );
}

// 플립 카드 그리드 (한 줄씩 IntersectionObserver)
function FlipCardGrid() {
    const rows: TeamMember[][] = [];
    for (let i = 0; i < teamMembers.length; i += 4) {
        rows.push(teamMembers.slice(i, i + 4));
    }

    return (
        <div className="hidden sm:block max-w-[93%] mx-auto mb-14">
            {rows.map((rowMembers, rowIndex) => (
                <FlipCardRow key={rowIndex} members={rowMembers} rowIndex={rowIndex} />
            ))}
        </div>
    );
}

const educationCareerEN = [
    "Assistant Professor, Inha University (2022 ~)",
    "Research Professor, Seoul National University (2022)",
    "Research Professor, Jeju National University (2018 ~ 2021)",
    "Ph.D., Norwegian University of Science and Technology (2014 ~ 2018)",
    "M.S., Seoul National University (2011 ~ 2013)",
    "B.S., Seoul National University (2008 ~ 2011)",
];

const educationCareerKR = [
    "인하대학교 기계공학과 조교수 (2022 ~)",
    "서울대학교 연구교수 (2022)",
    "제주대학교 연구교수 (2018 ~ 2021)",
    "노르웨이과학기술대학교 공학박사 (2014 ~ 2018)",
    "서울대학교 공학석사 (2011 ~ 2013)",
    "서울대학교 공학사 (2008 ~ 2011)",
];

const professionalActivitiesEN = [
    "Visiting Professor, Norwegian University of Science and Technology (2026)",
    "Editor, The Korean Hydrogen and New Energy Society (2024 ~)",
    "Editor, The Korean Society for New and Renewable Energy (2025 ~)",
    "Chief Technology Officer, PIOST (2025 ~)",
];

const professionalActivitiesKR = [
    "노르웨이과학기술대학교 방문교수 (2026)",
    "한국수소및신에너지학회 편집위원 (2024 ~)",
    "한국신재생에너지학회 편집위원 (2025 ~)",
    "PIOST CTO (2025 ~)",
];

function MobileMemberCard({ member }: { member: TeamMember }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const pubs = getStudentPublications(member.name);
    const { language, t } = useLanguage();

    const displayName = language === "KR" ? member.nameKR : member.name;
    const displayDegree = language === "KR" ? member.degreeKR : member.degree;
    const displayResearch = language === "KR" ? member.researchKR : member.research;

    return (
        <Card
            className="overflow-hidden cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900">{displayName}</h4>
                        <p className="text-sm text-gray-500">{displayDegree}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            {displayResearch.split(',').map(r => `#${r.trim()}`).join(' ')}
                        </p>
                    </div>
                    <div className="text-gray-400 ml-2">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                            <Image
                                src={`/images/${member.name}.jpg`}
                                alt={displayName}
                                fill
                                className="object-cover"
                            />
                        </div>
                        {pubs.length > 0 && (
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                {t("team.publications")}: {pubs.map((n, idx) => (
                                    <a
                                        key={idx}
                                        href={`#pub-${n}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const pubElement = document.getElementById(`pub-${n}`);
                                            if (!pubElement) {
                                                const viewAllBtn = document.querySelector('#publications button');
                                                if (viewAllBtn) (viewAllBtn as HTMLButtonElement).click();
                                                setTimeout(() => {
                                                    document.getElementById(`pub-${n}`)?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            } else {
                                                pubElement.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                        className="hover:text-rose-600 transition-colors mr-1"
                                    >
                                        #{n}
                                    </a>
                                ))}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

export default function Team() {
    const { language, t } = useLanguage();

    const educationCareer = language === "KR" ? educationCareerKR : educationCareerEN;
    const professionalActivities = language === "KR" ? professionalActivitiesKR : professionalActivitiesEN;
    const professorName = language === "KR" ? "박일웅 교수" : "Prof. Il Woong Park";

    return (
        <Section id="team" className="bg-slate-50/50">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("team.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{t("team.title")}</h3>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">{t("team.pi")}</h3>

            {/* Professor Section */}
            <div className="max-w-5xl mx-auto mb-20">
                <div className="flex flex-col md:flex-row gap-10 items-stretch">
                    <div className="w-full md:w-1/3 flex flex-col">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl flex-1">
                            <Image
                                src="/images/Professor_Il Woong Park.png"
                                alt={professorName}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="text-center mt-4">
                            <h4 className="text-2xl font-bold text-gray-900">{professorName}</h4>
                        </div>
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col justify-between">
                        <div>
                            <h5 className="text-lg font-bold text-gray-900 mb-4 border-b border-rose-200 pb-2">{t("team.education")}</h5>
                            <ul className="space-y-2">
                                {educationCareer.map((item, i) => (
                                    <li key={i} className="text-gray-600 flex items-start">
                                        <span className="text-rose-600 mr-2">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-6">
                            <h5 className="text-lg font-bold text-gray-900 mb-4 border-b border-rose-200 pb-2">{t("team.activities")}</h5>
                            <ul className="space-y-2">
                                {professionalActivities.map((item, i) => (
                                    <li key={i} className="text-gray-600 flex items-start">
                                        <span className="text-rose-600 mr-2">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Members */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">{t("team.students")}</h3>

            {/* Mobile: Expandable List */}
            <div className="sm:hidden space-y-3 mb-20">
                {teamMembers.map((member, i) => (
                    <MobileMemberCard key={i} member={member} />
                ))}
            </div>

            {/* Desktop: Grid with Flip Cards */}
            <FlipCardGrid />

            {/* Alumni */}
            <div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">{t("team.alumni")}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {alumni.map((alum, i) => (
                        <Card key={i} className="flex items-center p-4 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{language === "KR" ? alum.nameKR : alum.name}</h4>
                                    <span className="text-sm text-gray-500">{language === "KR" ? alum.yearKR : alum.year}</span>
                                </div>
                                <p className="text-sm text-gray-600">{language === "KR" ? alum.positionKR : alum.position}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </Section>
    );
}
