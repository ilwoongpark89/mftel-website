"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Section from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { teamMembers, alumni, publications } from "@/app/data";

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

// 플립 카드 컴포넌트
function FlipCard({ member, index, isVisible }: {
    member: { name: string; degree: string; research: string };
    index: number;
    isVisible: boolean;
}) {
    const [isFlipped, setIsFlipped] = useState(false);
    const pubs = getStudentPublications(member.name);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setIsFlipped(true);
            }, index * 200); // 순차적으로 플립
            return () => clearTimeout(timer);
        }
    }, [isVisible, index]);

    return (
        <div className="perspective-1000" style={{ perspective: "1000px" }}>
            <motion.div
                className="relative w-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                {/* 뒷면 (처음에 보이는 면) - 포커카드 느낌 */}
                <div
                    className="absolute inset-0 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <Card className="overflow-hidden border-none shadow-md h-full">
                        <div
                            className="relative aspect-[3/4] bg-slate-800"
                            style={{
                                backgroundImage: `
                                    linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
                                    linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
                                    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%),
                                    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)
                                `,
                                backgroundSize: "20px 20px",
                                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
                            }}
                        >
                            <div className="absolute inset-3 border border-rose-400/30 rounded-lg" />
                            <div className="absolute inset-6 border border-rose-400/20 rounded" />
                        </div>
                        <CardContent className="text-center pt-3 pb-3 bg-slate-800">
                            <div className="h-6 w-24 bg-slate-700 rounded mx-auto mb-2" />
                            <div className="h-4 w-16 bg-slate-700 rounded mx-auto" />
                        </CardContent>
                    </Card>
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
                                alt={member.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-0 left-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                <p className="text-xs font-medium uppercase tracking-wider text-rose-200">{member.degree}</p>
                            </div>
                        </div>
                        <CardContent className="text-center pt-3 pb-3">
                            <h4 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h4>
                            <p className="text-base text-gray-500">{member.degree}</p>
                            <p className="text-sm text-rose-600 mt-2 font-medium">{member.research.split(',').map(r => `#${r.trim()}`).join(' ')}</p>
                            {pubs.length > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {pubs.map((n, idx) => (
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
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}

// 플립 카드 그리드 (IntersectionObserver로 뷰에 들어오면 애니메이션)
function FlipCardGrid() {
    const [isVisible, setIsVisible] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (gridRef.current) {
            observer.observe(gridRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={gridRef} className="hidden sm:block max-w-[93%] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                {teamMembers.map((member, i) => (
                    <FlipCard key={i} member={member} index={i} isVisible={isVisible} />
                ))}
            </div>
        </div>
    );
}

const educationCareer = [
    "Assistant Professor, Inha University (2022 ~)",
    "Research Professor, Seoul National University (2022)",
    "Research Professor, Jeju National University (2018 ~ 2021)",
    "Ph.D., Norwegian University of Science and Technology (2014 ~ 2018)",
    "M.S., Seoul National University (2011 ~ 2013)",
    "B.S., Seoul National University (2008 ~ 2011)",
];

const professionalActivities = [
    "Visiting Professor, Norwegian University of Science and Technology (2026)",
    "Editor, The Korean Hydrogen and New Energy Society (2024 ~)",
    "Editor, The Korean Society for New and Renewable Energy (2025 ~)",
    "Chief Technology Officer, PIOST (2025 ~)",
];

function MobileMemberCard({ member }: { member: { name: string; degree: string; research: string } }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const pubs = getStudentPublications(member.name);

    return (
        <Card
            className="overflow-hidden cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-500">{member.degree}</p>
                        <p className="text-xs text-rose-600 mt-1 font-medium">
                            {member.research.split(',').map(r => `#${r.trim()}`).join(' ')}
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
                                alt={member.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        {pubs.length > 0 && (
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                Publications: {pubs.map((n, idx) => (
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
    return (
        <Section id="team" className="bg-slate-50/50">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">Our People</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Meet the Team</h3>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Principal Investigator</h3>

            {/* Professor Section */}
            <div className="max-w-5xl mx-auto mb-20">
                <div className="flex flex-col md:flex-row gap-10 items-stretch">
                    <div className="w-full md:w-1/3 flex flex-col">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl flex-1">
                            <Image
                                src="/images/Professor_Il Woong Park.png"
                                alt="Prof. Il Woong Park"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="text-center mt-4">
                            <h4 className="text-2xl font-bold text-gray-900">Prof. Il Woong Park</h4>
                        </div>
                    </div>
                    <div className="w-full md:w-2/3 flex flex-col justify-between">
                        <div>
                            <h5 className="text-lg font-bold text-gray-900 mb-4 border-b border-rose-200 pb-2">Education & Career</h5>
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
                            <h5 className="text-lg font-bold text-gray-900 mb-4 border-b border-rose-200 pb-2">Professional Activities</h5>
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
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Graduate Students</h3>

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
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Alumni</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {alumni.map((alum, i) => (
                        <Card key={i} className="flex items-center p-4 hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{alum.name}</h4>
                                    <span className="text-sm text-gray-500">{alum.year}</span>
                                </div>
                                <p className="text-sm text-gray-600">{alum.position}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </Section>
    );
}
