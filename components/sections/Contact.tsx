"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, GraduationCap, Rocket, Users, Globe } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

function StarField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
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

        const getCenterX = () => canvas!.width / 2;
        const getCenterY = () => canvas!.height * 0.4;

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
                const sx = (this.x / this.z) * canvas!.width + centerX;
                const sy = (this.y / this.z) * canvas!.height * 0.5 + centerY;
                const px = (this.x / this.pz) * canvas!.width + centerX;
                const py = (this.y / this.pz) * canvas!.height * 0.5 + centerY;
                const brightness = 1 - this.z / canvas!.width;

                ctx!.beginPath();
                ctx!.moveTo(px, py);
                ctx!.lineTo(sx, sy);
                ctx!.strokeStyle = `rgba(255, 250, 220, ${brightness})`;
                ctx!.lineWidth = brightness * 4;
                ctx!.stroke();
            }
        }

        const stars = Array.from({ length: 600 }, () => new Star());
        const speed = 4;

        let animationId: number;
        const animate = () => {
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
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
    const { t } = useLanguage();

    const benefits = [
        {
            icon: GraduationCap,
            title: t("contact.benefit1.title"),
            description: t("contact.benefit1.description")
        },
        {
            icon: Globe,
            title: t("contact.benefit2.title"),
            description: t("contact.benefit2.description")
        },
        {
            icon: Rocket,
            title: t("contact.benefit3.title"),
            description: t("contact.benefit3.description")
        },
        {
            icon: Users,
            title: t("contact.benefit4.title"),
            description: t("contact.benefit4.description")
        },
    ];

    return (
        <section id="contact" className="relative overflow-hidden">
            <div className="bg-slate-900 text-white py-24 relative">
                <div className="absolute inset-0 overflow-hidden">
                    <StarField />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-4">{t("contact.label")}</h2>
                        <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            {t("contact.title1")}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-300">
                                {t("contact.title2")}
                            </span>
                        </h3>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            {t("contact.description")}
                        </p>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                className="rounded-2xl p-6 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <benefit.icon className="w-10 h-10 text-rose-400 mb-4" />
                                <h4 className="text-lg font-semibold mb-2">{benefit.title}</h4>
                                <p className="text-sm text-gray-400">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <p className="text-gray-400 mb-6">{t("contact.cta")}</p>
                        {showEmail ? (
                            <motion.button
                                onClick={() => {
                                    navigator.clipboard.writeText("ilwoongpark@inha.ac.kr");
                                    alert(t("contact.emailCopied"));
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-all cursor-pointer"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Mail className="w-5 h-5" />
                                ilwoongpark@inha.ac.kr
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={() => setShowEmail(true)}
                                className="relative inline-flex items-center justify-center rounded-full bg-rose-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-rose-500/25 cursor-pointer hover:bg-rose-600 transition-all"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="relative z-10">{t("contact.apply")}</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
