"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// 한 글자씩 흐린 상태에서 오른쪽 아래 → 원래 위치로 툭툭 올라오는 컴포넌트
// 왼쪽 글자부터 순서대로
function AnimatedText({ text, delay, onComplete }: { text: string; delay: number; onComplete?: () => void }) {
    const lastIndex = text.length - 1;
    return (
        <span>
            {text.split("").map((char, index) => (
                <motion.span
                    key={index}
                    initial={{
                        opacity: 0.35,
                        y: 25,
                        x: 18,
                        filter: "blur(5px)"
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        x: 0,
                        filter: "blur(0px)"
                    }}
                    transition={{
                        duration: 0.3,
                        delay: delay + index * 0.023,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    onAnimationComplete={index === lastIndex ? onComplete : undefined}
                    style={{ display: "inline-block" }}
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </span>
    );
}

export default function Hero() {
    const [showContent, setShowContent] = useState(false);
    const [showGradient, setShowGradient] = useState(false);

    useEffect(() => {
        // 원이 화면 채우면 바로 글씨 시작
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 800);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
            {/* 흰 배경 위에 slate-900 원이 가운데서 커지면서 배경색 전환 */}
            <motion.div
                className="absolute rounded-full z-0 bg-slate-900"
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%",
                }}
                initial={{ width: 0, height: 0 }}
                animate={{ width: "250vmax", height: "250vmax" }}
                transition={{
                    duration: 5,
                    ease: [0.22, 1, 0.36, 1],
                }}
            />

            {/* Background Elements - Dark Mode */}
            <div className="absolute inset-0 z-[1]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/20 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
            </div>

            <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {showContent && (
                        <>
                            {/* Title Line 1 */}
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-2 leading-[1.1]">
                                <AnimatedText text="Engineering" delay={0} />
                            </h1>

                            {/* Title Line 2 */}
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-2 leading-[1.1] relative">
                                {/* 그라데이션 텍스트 (항상 존재, 나중에 보임) - 레이아웃 기준 */}
                                <span className="invisible">
                                    {"Sustainable".split("").map((char, index) => (
                                        <span key={index} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                    <br className="md:hidden" />
                                    <span className="hidden md:inline" style={{ display: "inline-block" }}>{"\u00A0"}</span>
                                    {"Energy".split("").map((char, index) => (
                                        <span key={`e-${index}`} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                </span>
                                {/* 흰색 텍스트 (기본) */}
                                <span className={`absolute inset-0 text-white transition-opacity duration-700 ${showGradient ? "opacity-0" : "opacity-100"}`}>
                                    <AnimatedText text="Sustainable" delay={0.35} />
                                    <br className="md:hidden" />
                                    <span className="hidden md:inline">{"\u00A0"}</span>
                                    <AnimatedText text="Energy" delay={0.65} />
                                </span>
                                {/* 그라데이션 텍스트 (나중에 나타남) */}
                                <span
                                    className={`absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-500 transition-opacity duration-700 ${showGradient ? "opacity-100" : "opacity-0"}`}
                                >
                                    {"Sustainable".split("").map((char, index) => (
                                        <span key={index} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                    <br className="md:hidden" />
                                    <span className="hidden md:inline" style={{ display: "inline-block" }}>{"\u00A0"}</span>
                                    {"Energy".split("").map((char, index) => (
                                        <span key={`e-${index}`} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                </span>
                            </h1>

                            {/* Title Line 3 */}
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
                                <AnimatedText text="Future" delay={0.95} onComplete={() => setShowGradient(true)} />
                            </h1>

                            {/* Description */}
                            <motion.p
                                className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.19, ease: "easeOut" }}
                            >
                                Multiphase Flow and Thermal Engineering Laboratory (MFTEL) at Inha University advances thermal science through thermal energy storage, electronics cooling, and reactor safety research.
                            </motion.p>

                            {/* Buttons */}
                            <motion.div
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.27, ease: "easeOut" }}
                            >
                                <Button size="lg" variant="outline" className="rounded-full text-base border-white/30 text-white hover:bg-white/10 w-[200px] justify-center" asChild>
                                    <a href="#publications">Latest Publications</a>
                                </Button>
                                <Button size="lg" variant="outline" className="rounded-full text-base border-white/30 text-white hover:bg-white/10 w-[200px] justify-center" asChild>
                                    <a href="#projects">Latest Projects</a>
                                </Button>
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
