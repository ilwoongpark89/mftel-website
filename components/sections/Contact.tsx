"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, GraduationCap, Rocket, Users, Globe, X } from "lucide-react";
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

// 갤러그 게임 컴포넌트
function GalagaGame({ onClose }: { onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [gameKey, setGameKey] = useState(0); // 게임 리셋용 키
    const highScoreRef = useRef(0);
    const gameStateRef = useRef({
        player: { x: 0, y: 0, width: 40, height: 30 },
        bullets: [] as { x: number; y: number; width: number; height: number }[],
        enemies: [] as { x: number; y: number; width: number; height: number; dx: number }[],
        enemyBullets: [] as { x: number; y: number; width: number; height: number }[],
        keys: {} as Record<string, boolean>,
        score: 0,
        gameOver: false,
        lastEnemySpawn: 0,
        lastEnemyShoot: 0,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 400;
        canvas.height = 600;

        const state = gameStateRef.current;
        state.player.x = canvas.width / 2 - 20;
        state.player.y = canvas.height - 60;
        state.bullets = [];
        state.enemies = [];
        state.enemyBullets = [];
        state.score = 0;
        state.gameOver = false;

        const handleKeyDown = (e: KeyboardEvent) => {
            // 스페이스바, 화살표 기본 동작 방지
            if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            }
            state.keys[e.key] = true;
            if (e.key === " " && !state.gameOver) {
                state.bullets.push({
                    x: state.player.x + state.player.width / 2 - 2,
                    y: state.player.y,
                    width: 4,
                    height: 10
                });
            }
            if (e.key === "Escape") onClose();
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            state.keys[e.key] = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        let animationId: number;
        let lastTime = 0;

        const spawnEnemy = () => {
            const width = 35;
            state.enemies.push({
                x: Math.random() * (canvas.width - width),
                y: -40,
                width,
                height: 30,
                dx: (Math.random() - 0.5) * 3
            });
        };

        const checkCollision = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) => {
            return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        };

        const drawShip = (x: number, y: number, isEnemy: boolean) => {
            ctx.save();
            if (isEnemy) {
                // 적 우주선 (빨간색)
                ctx.fillStyle = "#ef4444";
                ctx.beginPath();
                ctx.moveTo(x + 17, y + 30);
                ctx.lineTo(x, y + 10);
                ctx.lineTo(x + 10, y);
                ctx.lineTo(x + 24, y);
                ctx.lineTo(x + 34, y + 10);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = "#fca5a5";
                ctx.fillRect(x + 12, y + 5, 10, 8);
            } else {
                // 플레이어 우주선 (파란색)
                ctx.fillStyle = "#3b82f6";
                ctx.beginPath();
                ctx.moveTo(x + 20, y);
                ctx.lineTo(x, y + 25);
                ctx.lineTo(x + 10, y + 30);
                ctx.lineTo(x + 30, y + 30);
                ctx.lineTo(x + 40, y + 25);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = "#93c5fd";
                ctx.fillRect(x + 15, y + 10, 10, 12);
                // 불꽃
                ctx.fillStyle = "#fbbf24";
                ctx.beginPath();
                ctx.moveTo(x + 15, y + 30);
                ctx.lineTo(x + 20, y + 38);
                ctx.lineTo(x + 25, y + 30);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        };

        const gameLoop = (time: number) => {
            const delta = time - lastTime;
            lastTime = time;

            if (state.gameOver) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 36px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = "20px sans-serif";
                ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 20);
                ctx.font = "16px sans-serif";
                ctx.fillStyle = "#9ca3af";
                ctx.fillText("Press ESC to close", canvas.width / 2, canvas.height / 2 + 60);
                return;
            }

            // 배경
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 별 배경
            for (let i = 0; i < 50; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`;
                ctx.fillRect(
                    (i * 73 + time * 0.02) % canvas.width,
                    (i * 47 + time * 0.05) % canvas.height,
                    1, 1
                );
            }

            // 플레이어 이동 (속도 조절)
            if (state.keys["ArrowLeft"] || state.keys["a"]) state.player.x -= 3;
            if (state.keys["ArrowRight"] || state.keys["d"]) state.player.x += 3;
            state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x));

            // 총알 업데이트
            state.bullets = state.bullets.filter(b => {
                b.y -= 8;
                return b.y > -10;
            });

            // 적 스폰
            if (time - state.lastEnemySpawn > 1000) {
                spawnEnemy();
                state.lastEnemySpawn = time;
            }

            // 적 이동 및 총알 발사
            state.enemies = state.enemies.filter(enemy => {
                enemy.y += 2;
                enemy.x += enemy.dx;
                if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) enemy.dx *= -1;

                // 적 총알 발사
                if (Math.random() < 0.005) {
                    state.enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 2,
                        y: enemy.y + enemy.height,
                        width: 4,
                        height: 10
                    });
                }

                return enemy.y < canvas.height + 40;
            });

            // 적 총알 업데이트
            state.enemyBullets = state.enemyBullets.filter(b => {
                b.y += 5;
                return b.y < canvas.height + 10;
            });

            // 충돌 체크 - 플레이어 총알 vs 적
            state.bullets.forEach((bullet, bi) => {
                state.enemies.forEach((enemy, ei) => {
                    if (checkCollision(bullet, enemy)) {
                        state.bullets.splice(bi, 1);
                        state.enemies.splice(ei, 1);
                        state.score += 100;
                        setScore(state.score);
                    }
                });
            });

            // 충돌 체크 - 적 총알 vs 플레이어
            state.enemyBullets.forEach(bullet => {
                if (checkCollision(bullet, state.player)) {
                    state.gameOver = true;
                    setGameOver(true);
                    if (state.score > highScoreRef.current) highScoreRef.current = state.score;
                }
            });

            // 충돌 체크 - 적 vs 플레이어
            state.enemies.forEach(enemy => {
                if (checkCollision(enemy, state.player)) {
                    state.gameOver = true;
                    setGameOver(true);
                    if (state.score > highScoreRef.current) highScoreRef.current = state.score;
                }
            });

            // 그리기 - 플레이어
            drawShip(state.player.x, state.player.y, false);

            // 그리기 - 총알
            ctx.fillStyle = "#fbbf24";
            state.bullets.forEach(b => {
                ctx.fillRect(b.x, b.y, b.width, b.height);
            });

            // 그리기 - 적 총알
            ctx.fillStyle = "#ef4444";
            state.enemyBullets.forEach(b => {
                ctx.fillRect(b.x, b.y, b.width, b.height);
            });

            // 그리기 - 적
            state.enemies.forEach(enemy => {
                drawShip(enemy.x, enemy.y, true);
            });

            // 점수 표시
            ctx.fillStyle = "#fff";
            ctx.font = "bold 18px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(`Score: ${state.score}`, 10, 30);

            animationId = requestAnimationFrame(gameLoop);
        };

        animationId = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            cancelAnimationFrame(animationId);
        };
    }, [onClose, gameKey]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white hover:text-rose-400 transition-colors"
                >
                    <X className="w-8 h-8" />
                </button>
                <div className="text-center mb-4">
                    <p className="text-gray-400 text-sm">← → or A D to move | SPACE to shoot | ESC to close</p>
                </div>
                <canvas
                    ref={canvasRef}
                    className="rounded-lg border-2 border-rose-500/50 shadow-2xl shadow-rose-500/20"
                    style={{ imageRendering: "pixelated" }}
                />
                {gameOver && (
                    <div className="text-center mt-4">
                        <button
                            onClick={() => {
                                setGameOver(false);
                                setScore(0);
                                setGameKey(k => k + 1); // 게임 리셋
                            }}
                            className="px-6 py-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export default function Contact() {
    const [showEmail, setShowEmail] = useState(false);
    const [showGame, setShowGame] = useState(false);
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
        <>
        {/* 갤러그 게임 모달 */}
        <AnimatePresence>
            {showGame && <GalagaGame onClose={() => setShowGame(false)} />}
        </AnimatePresence>

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
                        {benefits.map((benefit, i) => {
                            const isRocket = benefit.icon === Rocket;
                            return (
                                <motion.div
                                    key={i}
                                    className={`rounded-2xl p-6 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1 ${isRocket ? 'cursor-pointer' : ''}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={isRocket ? () => setShowGame(true) : undefined}
                                >
                                    <benefit.icon className={`w-10 h-10 text-rose-400 mb-4 ${isRocket ? 'hover:text-rose-300 transition-colors' : ''}`} />
                                    <h4 className="text-lg font-semibold mb-2">{benefit.title}</h4>
                                    <p className="text-sm text-gray-400">{benefit.description}</p>
                                </motion.div>
                            );
                        })}
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
        </>
    );
}
