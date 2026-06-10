"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Check } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { publications, projects, patents, collaborators, collaboratorCount, teamMembers } from "@/app/data";
import { JOIN_ID } from "@/lib/sections";
import { cn } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import CountUp from "@/components/ui/count-up";
import HeroCanvas from "@/components/sections/HeroCanvas";
import { Scene, Label, display, title, lead, AmbientField } from "@/components/home/primitives";

/**
 * v3 DEEP FIELD — the home page is one immersive dark story, composed by a
 * single hand. Discipline:
 *   surface  : coal only (no alternation)
 *   type     : Pretendard only · 5 sizes (display/title/lead/body/label)
 *   color    : paper / stone-300 / stone-500 + ember-400 text · ember-600 fill
 *   motion   : one reveal pattern + the hero bubble field. Nothing else moves.
 * One idea per screen. Archives live on routes, not here.
 */

/* ── S1 hero ───────────────────────────────────────────────────────────── */

function SceneHero() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    return (
        <section id="home" data-nav-dark className="relative isolate flex min-h-[100svh] items-center overflow-hidden">
            <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                    background:
                        "radial-gradient(ellipse 95% 45% at 50% 110%, rgba(234,88,12,0.26), rgba(234,88,12,0.06) 55%, transparent 75%)",
                }}
            />
            <HeroCanvas className="absolute inset-0 -z-10 h-full w-full" />

            <div className="mx-auto w-full max-w-[1120px] px-6 md:px-8">
                <div className="cal-rise max-w-3xl">
                    <Label className="mb-6">{t("hero.kicker")}</Label>
                    <h1 className={display(isKR)}>
                        {t("hero.line1")}
                        <br className="hidden md:inline" />{" "}
                        <span className="whitespace-nowrap bg-gradient-to-r from-ember-300 to-ember-500 bg-clip-text text-transparent max-md:whitespace-normal">
                            {t("hero.line2a")} {t("hero.line2b")}
                        </span>{" "}
                        {t("hero.line3")}
                    </h1>
                    <p className={cn("mt-7 max-w-xl", lead(isKR))}>{t("hero.description")}</p>
                    <div className="mt-10 flex flex-wrap gap-3">
                        <a
                            href={`#${JOIN_ID}`}
                            className="glow-ember inline-flex h-13 items-center rounded-full bg-ember-600 px-8 text-[16px] font-semibold text-white transition-colors duration-150 hover:bg-ember-500"
                        >
                            {t("hero.join")}
                        </a>
                        <Link
                            href="/research"
                            className="inline-flex h-13 items-center rounded-full border border-white/15 px-8 text-[16px] font-medium text-paper transition-colors duration-150 hover:border-white/35 hover:bg-white/5"
                        >
                            {t("hero.research")}
                        </Link>
                    </div>
                </div>
            </div>

            {/* scroll cue */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <svg
                    className="cal-nudge h-5 w-5 text-stone-500"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                >
                    <path d="M4 8l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </section>
    );
}

/* ── S2 numbers ────────────────────────────────────────────────────────── */

function SceneNumbers() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const stats = [
        { value: publications.length, label: t("hero.stat.publications") },
        { value: projects.length, label: t("hero.stat.projects") },
        { value: patents.length, label: t("hero.stat.patents") },
        { value: collaboratorCount, label: t("hero.stat.partners") },
    ];
    return (
        <Scene>
            <Reveal>
                <Label>{t("home.numbers.label")}</Label>
                <h2 className={cn("mt-5", title(isKR))}>{t("home.numbers.title")}</h2>
                <p className={cn("mt-4 max-w-xl", lead(isKR))}>{t("home.numbers.sub")}</p>
            </Reveal>
            <Reveal className="reveal-stagger mt-14 grid grid-cols-2 gap-y-12 border-t border-white/8 pt-12 md:mt-20 md:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label}>
                        <div className="text-[56px] font-bold leading-none tracking-[-0.03em] text-paper tabular-nums md:text-[72px]">
                            <CountUp to={s.value} />
                        </div>
                        <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                            {s.label}
                        </p>
                    </div>
                ))}
            </Reveal>
        </Scene>
    );
}

/* ── S3 research ───────────────────────────────────────────────────────── */

function SceneResearch() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    // 수치는 설명문 안에서만 — 근거 없는 대형 숫자 금지 (상세 근거는 /research)
    const rows = [
        { index: "01", title: t("about.tes.title"), desc: t("about.tes.description") },
        { index: "02", title: t("about.thermal.title"), desc: t("about.thermal.description") },
        { index: "03", title: t("about.smr.title"), desc: t("about.smr.description") },
    ];
    return (
        <Scene>
            <Reveal>
                <Label>{t("home.research.label")}</Label>
                <h2 className={cn("mt-5 max-w-2xl", title(isKR))}>{t("home.research.title")}</h2>
            </Reveal>
            <Reveal as="ul" className="reveal-stagger mt-14 border-t border-white/8 md:mt-20">
                {rows.map((row) => (
                    <li key={row.index} className="border-b border-white/8">
                        <Link
                            href="/research"
                            className="group grid grid-cols-12 items-center gap-x-4 rounded-xl px-2 py-9 transition-colors duration-150 hover:bg-white/[0.04] md:px-4 md:py-11"
                        >
                            <span className="col-span-12 mb-3 text-[15px] font-semibold text-ember-400 md:col-span-1 md:mb-0">
                                {row.index}
                            </span>
                            <span className="col-span-11 md:col-span-10">
                                <span
                                    className={cn(
                                        "block break-keep text-[24px] font-bold tracking-[-0.02em] text-paper md:text-[28px]",
                                        isKR ? "leading-[1.35]" : "leading-[1.2]"
                                    )}
                                >
                                    {row.title}
                                </span>
                                <span
                                    className={cn(
                                        "mt-2.5 block max-w-2xl text-[16px] text-stone-400",
                                        isKR ? "leading-[1.7]" : "leading-[1.6]"
                                    )}
                                >
                                    {row.desc}
                                </span>
                            </span>
                            <span
                                aria-hidden
                                className="col-span-1 text-right text-[20px] text-stone-600 transition-all duration-150 group-hover:translate-x-1 group-hover:text-ember-400 max-md:hidden"
                            >
                                →
                            </span>
                        </Link>
                    </li>
                ))}
            </Reveal>
        </Scene>
    );
}

/* ── S4 publications ───────────────────────────────────────────────────── */

function ScenePubs() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const seen = new Set<number>();
    const featured = [publications[0], ...publications.filter((p) => p.special)]
        .filter((p) => (seen.has(p.number) ? false : (seen.add(p.number), true)))
        .slice(0, 3);
    return (
        <Scene>
            <Reveal>
                <Label>{t("home.pubs.label")}</Label>
                <h2 className={cn("mt-5", title(isKR))}>{t("home.pubs.title")}</h2>
            </Reveal>
            <Reveal as="ul" className="reveal-stagger mt-12 border-t border-white/8 md:mt-16">
                {featured.map((pub) => (
                    <li key={pub.number} className="border-b border-white/8">
                        <a
                            href={pub.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block rounded-xl px-2 py-7 transition-colors duration-150 hover:bg-white/[0.04] md:px-4 md:py-8"
                        >
                            <span className="block max-w-3xl break-keep text-[19px] font-semibold leading-[1.45] text-paper transition-colors duration-150 group-hover:text-ember-300 md:text-[21px]">
                                {pub.title}
                            </span>
                            <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-stone-400">
                                <span>{pub.journal}</span>
                                <span aria-hidden className="text-stone-600">
                                    ·
                                </span>
                                <span>{pub.year}</span>
                                {pub.special ? (
                                    <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ember-400">
                                        {pub.special.includes("Cover") ? "Cover Article" : pub.special}
                                    </span>
                                ) : null}
                                <span
                                    aria-hidden
                                    className="text-stone-600 transition-colors duration-150 group-hover:text-ember-400"
                                >
                                    ↗
                                </span>
                            </span>
                        </a>
                    </li>
                ))}
            </Reveal>
            <Reveal className="mt-10">
                <Link
                    href="/publications"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-7 text-[15px] font-medium text-paper transition-colors duration-150 hover:border-white/35 hover:bg-white/5"
                >
                    {t("home.pubs.cta")}
                    <span aria-hidden className="text-stone-500">
                        →
                    </span>
                </Link>
            </Reveal>
        </Scene>
    );
}

/* ── S5 people ─────────────────────────────────────────────────────────── */

// face-forward crops for photos where the subject is small in the frame —
// zoom anchored on the face position (measured per photo). Members not listed
// render at natural crop.
const FACE_CROPS: Record<string, { scale: number; origin: string }> = {
    "Chaeyeon Kim": { scale: 2.1, origin: "47% 40%" },
    "Manho Kim": { scale: 2.0, origin: "48% 28%" },
    "Eunbin Park": { scale: 2.2, origin: "58% 40%" },
};
const PI_CROP = { scale: 1.55, origin: "51% 30%" };

function ScenePeople() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    return (
        <Scene>
            <Reveal>
                <Label>{t("home.people.label")}</Label>
                <h2 className={cn("mt-5", title(isKR))}>{t("team.title")}</h2>
            </Reveal>
            <Reveal className="reveal-stagger mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-20 md:grid-cols-6 md:gap-4">
                {/* PI tile — double size anchors the grid */}
                <Link
                    href="/team"
                    className="group col-span-2 row-span-2 overflow-hidden rounded-xl border border-white/8"
                >
                    <div className="relative h-full min-h-[200px] w-full">
                        <Image
                            src="/images/Professor_Il Woong Park.png"
                            alt="Prof. Il Woong Park"
                            fill
                            sizes="(max-width: 768px) 66vw, 33vw"
                            className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                            style={{ transform: `scale(${PI_CROP.scale})`, transformOrigin: PI_CROP.origin }}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-coal/90 to-transparent px-4 pb-3 pt-10">
                            <p className="text-[15px] font-semibold text-paper">
                                {isKR ? "박일웅 교수" : "Prof. Il Woong Park"}
                            </p>
                            <p className="text-[13px] text-stone-400">{t("team.pi")}</p>
                        </div>
                    </div>
                </Link>
                {teamMembers.map((m) => (
                    <Link
                        key={m.name}
                        href="/team"
                        className="group overflow-hidden rounded-xl border border-white/8"
                    >
                        <div className="relative aspect-[3/4] w-full">
                            <Image
                                src={`/images/${m.name}.jpg`}
                                alt={isKR ? m.nameKR : m.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 16vw"
                                className={cn(
                                    "object-cover grayscale transition-all duration-500 group-hover:grayscale-0",
                                    !FACE_CROPS[m.name] && "group-hover:scale-[1.03]"
                                )}
                                style={
                                    FACE_CROPS[m.name]
                                        ? {
                                              transform: `scale(${FACE_CROPS[m.name].scale})`,
                                              transformOrigin: FACE_CROPS[m.name].origin,
                                          }
                                        : undefined
                                }
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-coal/90 to-transparent px-3 pb-2.5 pt-8">
                                <p className="break-keep text-[13px] font-medium leading-snug text-paper">
                                    {isKR ? m.nameKR : m.name}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </Reveal>
            <Reveal className="mt-10">
                <Link
                    href="/team"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-7 text-[15px] font-medium text-paper transition-colors duration-150 hover:border-white/35 hover:bg-white/5"
                >
                    {t("home.people.cta")}
                    <span aria-hidden className="text-stone-500">
                        →
                    </span>
                </Link>
            </Reveal>
        </Scene>
    );
}

/* ── S6 partners (slim) ────────────────────────────────────────────────── */

function ScenePartners() {
    const { t } = useLanguage();
    const names = collaborators.flatMap((g) => [...g.names]);
    return (
        <Scene full={false} center>
            <Reveal>
                <Label>{t("home.partners.label")}</Label>
                <div className="mx-auto mt-9 flex max-w-4xl flex-wrap items-baseline justify-center gap-x-8 gap-y-3">
                    {names.map((n) => (
                        <span
                            key={n}
                            className="whitespace-nowrap text-[16px] font-semibold text-stone-400 transition-colors duration-200 hover:text-stone-200 md:text-[18px]"
                        >
                            {n}
                        </span>
                    ))}
                </div>
            </Reveal>
        </Scene>
    );
}

/* ── S7 join ───────────────────────────────────────────────────────────── */

const JOIN_EMAIL = "ilwoongpark@inha.ac.kr";

function SceneJoin() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const [copied, setCopied] = useState(false);

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(JOIN_EMAIL);
        } catch {
            // clipboard unavailable — the address is shown either way
        }
        setCopied(true);
    };

    return (
        <Scene id={JOIN_ID} center className="min-h-[100svh]">
            <Reveal>
                <Label>{t("contact.label")}</Label>
                <h2 className={cn("mx-auto mt-6 max-w-3xl", display(isKR))}>
                    {t("contact.title1")} <span className="text-ember-400">{t("contact.title2")}</span>
                </h2>
                <p className={cn("mx-auto mt-7 max-w-xl", lead(isKR))}>{t("contact.description")}</p>
                <p
                    className={cn(
                        "mx-auto mt-6 max-w-xl break-keep text-[16px] text-stone-400",
                        isKR ? "leading-[1.8]" : "leading-[1.65]"
                    )}
                >
                    {isKR
                        ? "정답을 빨리 맞히는 사람보다, 물어야 할 것을 새로 찾아내는 사람을 찾습니다."
                        : "We look for those who find what to ask — not those who answer fastest."}
                </p>
                <div className="mt-10 flex flex-col items-center gap-4">
                    {/* 클릭 = 메일앱 실행 ❌ — 주소 표시 + 클립보드 복사 */}
                    <button
                        type="button"
                        onClick={copyEmail}
                        className="glow-ember inline-flex h-13 items-center gap-2.5 rounded-full bg-ember-600 px-9 text-[16px] font-semibold text-white transition-colors duration-150 hover:bg-ember-500"
                    >
                        {copied ? (
                            <>
                                <Check aria-hidden className="h-4.5 w-4.5" />
                                {JOIN_EMAIL}
                            </>
                        ) : (
                            <>
                                <Mail aria-hidden className="h-4.5 w-4.5" />
                                {t("contact.apply")}
                            </>
                        )}
                    </button>
                    <p
                        aria-live="polite"
                        className={cn(
                            "text-[15px] transition-colors duration-200",
                            copied ? "text-ember-400" : "text-stone-400"
                        )}
                    >
                        {copied ? t("contact.emailCopied") : "Inha Univ. 2N687"}
                    </p>
                    <Link
                        href="/join"
                        className="mt-2 inline-flex h-11 items-center gap-2 text-[15px] font-medium text-stone-300 transition-colors duration-150 hover:text-paper"
                    >
                        {isKR ? "지원 안내 전체 보기" : "Full application guide"}
                        <span aria-hidden className="text-stone-500">
                            →
                        </span>
                    </Link>
                </div>
            </Reveal>
        </Scene>
    );
}

/* ── composition ───────────────────────────────────────────────────────── */

export default function HomeStory() {
    return (
        <div className="relative bg-coal">
            {/* continuous environment — one ember space behind every scene,
                so scene boundaries never hard-cut the illusion */}
            <AmbientField />
            <SceneHero />
            <SceneResearch />
            <ScenePubs />
            <ScenePeople />
            <ScenePartners />
            {/* the record sits last — a bridge into Join: "다음 줄은 당신의 몫" */}
            <SceneNumbers />
            <SceneJoin />
        </div>
    );
}
