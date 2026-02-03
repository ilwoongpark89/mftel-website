"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Flame, Droplets, Atom, RotateCcw } from "lucide-react";
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
type PillarColor = "rose" | "sky" | "amber";

// 학생별 필라 색상 매핑 (연구 분야 기준)
const pillarColorMap: Record<string, PillarColor> = {
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

const pillarInfo: Record<PillarColor, { icon: typeof Flame; label: string; labelKR: string; bg: string; text: string }> = {
    rose: { icon: Flame, label: "TES & Carnot Batteries", labelKR: "열에너지 저장", bg: "bg-rose-500", text: "text-rose-600" },
    sky: { icon: Droplets, label: "Immersion Cooling", labelKR: "이머전 쿨링", bg: "bg-sky-500", text: "text-sky-600" },
    amber: { icon: Atom, label: "Small Modular Reactors", labelKR: "소형모듈원자로", bg: "bg-amber-500", text: "text-amber-600" },
};

// 플립 카드 컴포넌트 (이스터에그 버전)
function FlipCard({ member, index, isVisible, isManuallyFlipped, onFlip, easterEggMode }: {
    member: TeamMember;
    index: number;
    isVisible: boolean;
    isManuallyFlipped: boolean;
    onFlip: () => void;
    easterEggMode: boolean;
}) {
    const [hasAutoFlipped, setHasAutoFlipped] = useState(false);
    const pubs = getStudentPublications(member.name);
    const { language } = useLanguage();

    const displayName = language === "KR" ? member.nameKR : member.name;
    const displayDegree = language === "KR" ? member.degreeKR : member.degree;
    const displayResearch = language === "KR" ? member.researchKR : member.research;
    const pColor = pillarColorMap[member.name] || "rose";
    const [c1, c2] = checkerColors[pColor];

    // 실제 보여지는 상태: 자동 플립 + 수동 토글
    const showFront = hasAutoFlipped && !isManuallyFlipped;

    useEffect(() => {
        if (isVisible && !hasAutoFlipped) {
            const timer = setTimeout(() => {
                setHasAutoFlipped(true);
            }, index * 200);
            return () => clearTimeout(timer);
        }
    }, [isVisible, index, hasAutoFlipped]);

    // 이스터에그 모드에서는 숨김
    if (easterEggMode) return null;

    return (
        <div
            className="perspective-1000 cursor-pointer"
            style={{ perspective: "1000px" }}
            onClick={onFlip}
        >
            <motion.div
                className="relative w-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: showFront ? 180 : 0 }}
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

// 이스터에그 플립 카드 그리드
function EasterEggFlipCardGrid() {
    const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
    const [easterEggActive, setEasterEggActive] = useState(false);
    const [matchedColor, setMatchedColor] = useState<PillarColor | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasAutoFlipped, setHasAutoFlipped] = useState<Set<number>>(new Set());
    const gridRef = useRef<HTMLDivElement>(null);
    const { language } = useLanguage();

    // 화면에 보이면 카드 자동 플립 시작
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // 순차적으로 카드 플립
                    teamMembers.forEach((_, index) => {
                        setTimeout(() => {
                            setHasAutoFlipped(prev => new Set(prev).add(index));
                        }, index * 150);
                    });
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (gridRef.current) {
            observer.observe(gridRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const toggleFlip = (memberName: string) => {
        if (easterEggActive) return;
        setFlippedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(memberName)) {
                newSet.delete(memberName);
            } else {
                newSet.add(memberName);
            }
            return newSet;
        });
    };

    // 이스터에그 체크
    useEffect(() => {
        if (easterEggActive) return;

        const openCards = teamMembers.filter(m => !flippedCards.has(m.name));

        if (openCards.length >= 2 && openCards.length < teamMembers.length) {
            const colors = openCards.map(m => pillarColorMap[m.name]);
            const uniqueColors = new Set(colors);

            if (uniqueColors.size === 1) {
                const color = colors[0];
                const allOfColor = teamMembers.filter(m => pillarColorMap[m.name] === color);

                if (openCards.length === allOfColor.length) {
                    setMatchedColor(color);
                    setEasterEggActive(true);
                    // 화면을 카드 그리드 중앙으로 스크롤
                    setTimeout(() => {
                        gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            }
        }
    }, [flippedCards, easterEggActive]);

    const resetEasterEgg = () => {
        setEasterEggActive(false);
        setMatchedColor(null);
        setFlippedCards(new Set());
    };

    const PillarIcon = matchedColor ? pillarInfo[matchedColor].icon : Flame;

    const isMatchedCard = (memberName: string) => {
        if (!matchedColor) return false;
        return pillarColorMap[memberName] === matchedColor;
    };

    return (
        <div ref={gridRef} className="hidden sm:block max-w-[93%] mx-auto mb-14">
            {/* 이스터에그 헤더 */}
            <AnimatePresence>
                {easterEggActive && matchedColor && (
                    <motion.div
                        className="text-center mb-8"
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${pillarInfo[matchedColor].bg} text-white shadow-lg`}>
                            <PillarIcon className="w-5 h-5" />
                            <span className="text-lg font-bold">
                                {language === "KR" ? pillarInfo[matchedColor].labelKR : pillarInfo[matchedColor].label}
                            </span>
                            <span className="text-sm opacity-80">Team</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 카드 그리드 - 하나의 컨테이너에서 모든 처리 */}
            <motion.div
                layout
                className={easterEggActive
                    ? "flex justify-center gap-6 flex-wrap"
                    : "grid grid-cols-2 lg:grid-cols-4 gap-6"
                }
                transition={{ layout: { duration: 3, ease: [0.16, 1, 0.3, 1] } }}
            >
                <AnimatePresence mode="popLayout">
                    {teamMembers.map((member, index) => {
                        const shouldShow = !easterEggActive || isMatchedCard(member.name);
                        if (!shouldShow) return null;

                        const isFlipped = flippedCards.has(member.name);
                        const hasFlipped = hasAutoFlipped.has(index);
                        const showFront = hasFlipped && !isFlipped;

                        const displayName = language === "KR" ? member.nameKR : member.name;
                        const displayDegree = language === "KR" ? member.degreeKR : member.degree;
                        const displayResearch = language === "KR" ? member.researchKR : member.research;
                        const pColor = pillarColorMap[member.name] || "rose";
                        const [c1, c2] = checkerColors[pColor];
                        const pubs = getStudentPublications(member.name);

                        return (
                            <motion.div
                                key={member.name}
                                layoutId={`card-${member.name}`}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{
                                    layout: { duration: 3, ease: [0.16, 1, 0.3, 1] },
                                    opacity: { duration: 0.4 },
                                    scale: { duration: 0.4 }
                                }}
                                className={easterEggActive ? "w-[calc(25%-18px)]" : ""}
                            >
                                <div
                                    className="cursor-pointer"
                                    style={{ perspective: "1000px" }}
                                    onClick={() => toggleFlip(member.name)}
                                >
                                    <motion.div
                                        className="relative w-full"
                                        style={{ transformStyle: "preserve-3d" }}
                                        animate={{ rotateY: showFront ? 180 : 0 }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                    >
                                        {/* 뒷면 */}
                                        <div
                                            className="absolute inset-0"
                                            style={{ backfaceVisibility: "hidden" }}
                                        >
                                            <div
                                                className="rounded-xl overflow-hidden shadow-md h-full"
                                                style={{
                                                    backgroundImage: `repeating-conic-gradient(${c1} 0% 25%, ${c2} 0% 50%)`,
                                                    backgroundSize: "20px 20px",
                                                }}
                                            >
                                                <div className="aspect-[3/4]" />
                                                <div className="py-3 px-4" />
                                            </div>
                                        </div>

                                        {/* 앞면 */}
                                        <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                                            <Card className={`overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 ${
                                                easterEggActive && matchedColor
                                                    ? `border-2 ${
                                                        matchedColor === 'rose' ? 'border-rose-300' :
                                                        matchedColor === 'sky' ? 'border-sky-300' :
                                                        'border-amber-300'
                                                    } shadow-xl`
                                                    : 'border-none'
                                            }`}>
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
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* 리셋 버튼 */}
            <AnimatePresence>
                {easterEggActive && (
                    <motion.div
                        className="text-center mt-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ delay: 0.5 }}
                    >
                        <button
                            onClick={resetEasterEgg}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors shadow-lg cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-sm font-medium">Reset</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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
    const pColor = pillarColorMap[member.name] || "rose";

    return (
        <Card
            className={`overflow-hidden cursor-pointer border-l-4 ${
                pColor === 'rose' ? 'border-l-rose-400' :
                pColor === 'sky' ? 'border-l-sky-400' :
                'border-l-amber-400'
            }`}
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

            {/* Desktop: Grid with Flip Cards + Easter Egg */}
            <EasterEggFlipCardGrid />

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
