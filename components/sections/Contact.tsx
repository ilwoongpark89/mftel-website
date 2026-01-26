"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, GraduationCap, Rocket, Users, Globe } from "lucide-react";

const benefits = [
    {
        icon: GraduationCap,
        title: "World-Class Research",
        description: "Publish in top-tier journals and present at international conferences"
    },
    {
        icon: Globe,
        title: "Global Network",
        description: "Collaborate with NTNU (Norway), HZDR (Germany), UPC (Spain), and more"
    },
    {
        icon: Rocket,
        title: "Promising Career",
        description: "Our alumni are building careers at leading institutions like KHNP and beyond"
    },
    {
        icon: Users,
        title: "Grow Your Way",
        description: "We trust you to lead your research and planning"
    },
];

function StarField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 캔버스 크기 설정
        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // 소실점 (중앙 약간 위)
        const getCenterX = () => canvas!.width / 2;
        const getCenterY = () => canvas!.height * 0.4;

        // 별 클래스
        class Star {
            x: number;
            y: number;
            z: number;
            pz: number;

            constructor() {
                this.x = (Math.random() - 0.5) * canvas!.width;
                this.y = (Math.random() - 0.5) * canvas!.height;
                this.z = Math.random() * canvas!.width;
                this.pz = this.z;
            }

            update(speed: number) {
                this.pz = this.z;
                this.z -= speed;
                if (this.z < 1) {
                    this.x = (Math.random() - 0.5) * canvas!.width;
                    this.y = (Math.random() - 0.5) * canvas!.height;
                    this.z = canvas!.width;
                    this.pz = this.z;
                }
            }

            draw() {
                const centerX = getCenterX();
                const centerY = getCenterY();

                // 현재 위치 (원근 투영)
                const sx = (this.x / this.z) * canvas!.width + centerX;
                const sy = (this.y / this.z) * canvas!.height * 0.5 + centerY;

                // 이전 위치 (꼬리)
                const px = (this.x / this.pz) * canvas!.width + centerX;
                const py = (this.y / this.pz) * canvas!.height * 0.5 + centerY;

                // 밝기 (가까울수록 밝게)
                const brightness = 1 - this.z / canvas!.width;

                ctx!.beginPath();
                ctx!.moveTo(px, py);
                ctx!.lineTo(sx, sy);
                // 롤백: ctx!.strokeStyle = `rgba(255, 255, 255, ${brightness})`;
                ctx!.strokeStyle = `rgba(255, 250, 220, ${brightness})`; // 크림/연노랑
                ctx!.lineWidth = brightness * 4;
                ctx!.stroke();
            }
        }

        // 별 150개 생성
        const stars = Array.from({ length: 600 }, () => new Star());
        const speed = 4;

        // 애니메이션 루프
        let animationId: number;
        const animate = () => {
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height); // 투명하게 클리어

            stars.forEach((star) => {
                star.update(speed);
                star.draw();
            });

            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function Contact() {
    const [showEmail, setShowEmail] = useState(false);

    return (
        <section id="contact" className="relative overflow-hidden">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-24 relative">
                {/* Starfield Warp Effect - 별이 중앙에서 앞으로 날아오는 효과 */}
                <div className="absolute inset-0 overflow-hidden" style={{ perspective: "500px" }}>
                    <StarField />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-4">Join Us</h2>
                        <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Shape the Future of<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300">
                                Thermal Engineering
                            </span>
                        </h3>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            We are actively recruiting passionate M.S./Ph.D. students, postdocs, and researchers who want to push the boundaries of multiphase flow and heat transfer research.
                        </p>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
                                <benefit.icon className="w-10 h-10 text-rose-400 mb-4" />
                                <h4 className="text-lg font-semibold mb-2">{benefit.title}</h4>
                                <p className="text-sm text-gray-400">{benefit.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <p className="text-gray-400 mb-6">Ready to start your research journey?</p>
                        {showEmail ? (
                            <motion.button
                                onClick={() => {
                                    navigator.clipboard.writeText("ilwoongpark@inha.ac.kr");
                                    alert("Email copied to clipboard!");
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-10 py-4 text-lg font-semibold text-white shadow-lg hover:from-rose-600 hover:to-orange-500 transition-all cursor-pointer"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Mail className="w-5 h-5" />
                                ilwoongpark@inha.ac.kr
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={() => setShowEmail(true)}
                                className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-10 py-4 text-lg font-semibold text-white shadow-lg cursor-pointer overflow-hidden"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {/* Shimmer effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{
                                        x: ["-100%", "100%"],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        ease: "easeInOut"
                                    }}
                                />
                                {/* Pulse ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-white/50"
                                    animate={{
                                        scale: [1, 1.2],
                                        opacity: [0.5, 0],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeOut"
                                    }}
                                />
                                <span className="relative z-10">Apply Now</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
