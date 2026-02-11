"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!visible) return; // Don't start animation until visible

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        class Particle {
            x: number; y: number; r: number; dx: number; dy: number; opacity: number;
            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.r = Math.random() * 2 + 1;
                this.dx = (Math.random() - 0.5) * 0.4;
                this.dy = (Math.random() - 0.5) * 0.4;
                this.opacity = Math.random() * 0.5 + 0.15;
            }
            update() {
                this.x += this.dx;
                this.y += this.dy;
                if (this.x < 0 || this.x > canvas!.width) this.dx *= -1;
                if (this.y < 0 || this.y > canvas!.height) this.dy *= -1;
            }
            draw() {
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx!.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx!.fill();
            }
        }

        const particles = Array.from({ length: 40 }, () => new Particle());
        let animationId: number;
        const animate = () => {
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
            particles.forEach((p) => { p.update(); p.draw(); });
            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, [visible]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full transition-opacity duration-[2000ms] ${visible ? "opacity-100" : "opacity-0"}`}
        />
    );
}

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

function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);
    useEffect(() => {
        const mql = window.matchMedia("(max-width: 768px), (prefers-reduced-motion: reduce)");
        setIsMobile(mql.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, []);
    return isMobile;
}

export default function Hero() {
    const [showContent, setShowContent] = useState(false);
    const [showGradient, setShowGradient] = useState(false);
    const { t, language } = useLanguage();
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isMobile === null) return; // Wait for detection
        if (isMobile) {
            setShowContent(true);
            setShowGradient(true);
            return;
        }
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 800);

        return () => {
            clearTimeout(timer);
        };
    }, [isMobile]);

    const line1 = t("hero.line1");
    const line2a = t("hero.line2a");
    const line2b = t("hero.line2b");
    const line3 = t("hero.line3");

    /* ── Not yet determined: dark placeholder (no flash) ── */
    if (isMobile === null) {
        return <section id="home" className="min-h-screen bg-slate-900" />;
    }

    /* ── Mobile: static background, no animations ── */
    if (isMobile) {
        return (
            <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 pb-16">
                <div className="container relative mx-auto px-6 z-[10]">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2 leading-[1.15]">
                            {line1}
                        </h1>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 leading-[1.15] text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-300">
                            {line2a} {line2b}
                        </h1>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6 leading-[1.15]">
                            {line3}
                        </h1>
                        <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                            {t("hero.description")}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" variant="outline" className="rounded-full text-base border-white/20 text-white hover:bg-white/10 backdrop-blur-sm w-[200px] justify-center" asChild>
                                <a href="#publications">{t("hero.publications")}</a>
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full text-base border-white/20 text-white hover:bg-white/10 backdrop-blur-sm w-[200px] justify-center" asChild>
                                <a href="#projects">{t("hero.projects")}</a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    /* ── Desktop: full animations ── */
    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
            {/* Expanding circle */}
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

            {/* Star field */}
            <div className="absolute inset-0 z-[1]">
                <FloatingParticles />
            </div>

            {/* Subtle gradient accent */}
            <div className="absolute inset-0 z-[2]">
                <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-slate-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 z-[10]">
                <div className="max-w-4xl mx-auto text-center">
                    {showContent && (
                        <div key={language}>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-2 leading-[1.1]">
                                <AnimatedText text={line1} delay={0} />
                            </h1>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-2 leading-[1.1] relative">
                                <span className="invisible">
                                    {line2a.split("").map((char, index) => (
                                        <span key={index} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                    <br className="md:hidden" />
                                    <span className="hidden md:inline" style={{ display: "inline-block" }}>{"\u00A0"}</span>
                                    {line2b.split("").map((char, index) => (
                                        <span key={`e-${index}`} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                </span>
                                <span className={`absolute inset-0 text-white transition-opacity duration-700 ${showGradient ? "opacity-0" : "opacity-100"}`}>
                                    <AnimatedText text={line2a} delay={0.35} />
                                    <br className="md:hidden" />
                                    <span className="hidden md:inline">{"\u00A0"}</span>
                                    <AnimatedText text={line2b} delay={0.65} />
                                </span>
                                <span
                                    className={`absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-300 transition-opacity duration-700 ${showGradient ? "opacity-100" : "opacity-0"}`}
                                >
                                    {line2a.split("").map((char, index) => (
                                        <span key={index} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                    <br className="md:hidden" />
                                    <span className="hidden md:inline" style={{ display: "inline-block" }}>{"\u00A0"}</span>
                                    {line2b.split("").map((char, index) => (
                                        <span key={`e-${index}`} style={{ display: "inline-block" }}>{char}</span>
                                    ))}
                                </span>
                            </h1>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
                                <AnimatedText text={line3} delay={0.95} onComplete={() => setShowGradient(true)} />
                            </h1>

                            <motion.p
                                className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.19, ease: "easeOut" }}
                            >
                                {t("hero.description")}
                            </motion.p>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.27, ease: "easeOut" }}
                            >
                                <Button size="lg" variant="outline" className="rounded-full text-base border-white/20 text-white hover:bg-white/10 backdrop-blur-sm w-[200px] justify-center" asChild>
                                    <a href="#publications">{t("hero.publications")}</a>
                                </Button>
                                <Button size="lg" variant="outline" className="rounded-full text-base border-white/20 text-white hover:bg-white/10 backdrop-blur-sm w-[200px] justify-center" asChild>
                                    <a href="#projects">{t("hero.projects")}</a>
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
