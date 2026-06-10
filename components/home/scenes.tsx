"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { publications, projects, patents, collaborators, collaboratorCount, teamMembers } from "@/app/data";
import { JOIN_ID } from "@/lib/sections";
import { cn } from "@/lib/utils";
import Reveal from "@/components/ui/reveal";
import CountUp from "@/components/ui/count-up";
import HeroCanvas from "@/components/sections/HeroCanvas";

/**
 * v3 DEEP FIELD — the home page is one immersive dark story, composed by a
 * single hand. Discipline:
 *   surface  : coal only (no alternation)
 *   type     : Pretendard only · 5 sizes (display/title/lead/body/label)
 *   color    : paper / stone-300 / stone-500 + ember-400 text · ember-600 fill
 *   motion   : one reveal pattern + the hero bubble field. Nothing else moves.
 * One idea per screen. Archives live on routes, not here.
 */

/* ── shared scene primitives ───────────────────────────────────────────── */

function Scene({
    id,
    full = true,
    center = false,
    className,
    children,
}: {
    id?: string;
    full?: boolean;
    center?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            id={id}
            data-nav-dark
            className={cn(
                "relative z-[1] flex",
                full ? "min-h-[80svh] items-center py-20" : "py-16 md:py-24",
                className
            )}
        >
            <div className={cn("mx-auto w-full max-w-[1120px] px-6 md:px-8", center && "text-center")}>
                {children}
            </div>
        </section>
    );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <p
            className={cn(
                "text-[13px] font-semibold uppercase tracking-[0.18em] text-ember-400",
                className
            )}
        >
            {children}
        </p>
    );
}

const display = (isKR: boolean) =>
    cn(
        "break-keep text-[42px] font-bold tracking-[-0.03em] text-paper [text-wrap:balance] md:text-[64px]",
        isKR ? "leading-[1.22]" : "leading-[1.05]"
    );

const title = (isKR: boolean) =>
    cn(
        "break-keep text-[30px] font-bold tracking-[-0.02em] text-paper [text-wrap:balance] md:text-[42px]",
        isKR ? "leading-[1.3]" : "leading-[1.12]"
    );

const lead = (isKR: boolean) =>
    cn(
        "break-keep text-[18px] text-stone-300 md:text-[20px]",
        isKR ? "leading-[1.75]" : "leading-[1.65]"
    );

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
            </Reveal>
            <Reveal className="reveal-stagger mt-16 grid grid-cols-2 gap-y-16 md:mt-24 md:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label}>
                        <div className="text-[88px] font-bold leading-none tracking-[-0.04em] text-paper tabular-nums md:text-[140px]">
                            <CountUp to={s.value} />
                        </div>
                        <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-stone-400">
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
    const rows = [
        {
            index: "01",
            title: t("about.tes.title"),
            desc: t("about.tes.description"),
            metric: "60%+",
            metricLabel: t("home.research.metric.tes"),
        },
        {
            index: "02",
            title: t("about.thermal.title"),
            desc: t("about.thermal.description"),
            metric: "−90%",
            metricLabel: t("home.research.metric.cooling"),
        },
        {
            index: "03",
            title: t("about.smr.title"),
            desc: t("about.smr.description"),
            // evidence over industry claims — derived from our own publication record
            metric: String(publications.filter((p) => (p.category as readonly string[]).includes("smr")).length),
            metricLabel: t("home.research.metric.smr"),
        },
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
                            className="group grid grid-cols-12 items-center gap-x-4 rounded-xl px-2 py-9 transition-colors duration-150 hover:bg-white/[0.04] md:px-4 md:py-12"
                        >
                            <span className="col-span-12 mb-3 text-[15px] font-semibold text-ember-400 md:col-span-1 md:mb-0">
                                {row.index}
                            </span>
                            <span className="col-span-12 md:col-span-7">
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
                                        "mt-2.5 block max-w-lg text-[16px] text-stone-400",
                                        isKR ? "leading-[1.7]" : "leading-[1.6]"
                                    )}
                                >
                                    {row.desc}
                                </span>
                            </span>
                            <span className="col-span-12 mt-6 md:col-span-4 md:mt-0 md:text-right">
                                <span className="block text-[36px] font-bold leading-none tracking-[-0.02em] text-paper tabular-nums md:text-[44px]">
                                    {row.metric}
                                </span>
                                <span className="mt-2 block text-[13px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                                    {row.metricLabel}
                                </span>
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
                <div className="mx-auto mt-10 flex max-w-5xl flex-wrap items-baseline justify-center gap-x-10 gap-y-5">
                    {names.map((n) => (
                        <span
                            key={n}
                            className="whitespace-nowrap text-[24px] font-bold tracking-[-0.02em] text-stone-600 transition-colors duration-200 hover:text-stone-300 md:text-[32px]"
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

function SceneJoin() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    return (
        <Scene id={JOIN_ID} center className="min-h-[100svh]">
            <Reveal>
                <Label>{t("contact.label")}</Label>
                <h2 className={cn("mx-auto mt-6 max-w-3xl", display(isKR))}>
                    {t("contact.title1")} <span className="text-ember-400">{t("contact.title2")}</span>
                </h2>
                <p className={cn("mx-auto mt-7 max-w-xl", lead(isKR))}>{t("contact.description")}</p>
                <div className="mt-10 flex flex-col items-center gap-5">
                    <a
                        href="mailto:ilwoongpark@inha.ac.kr"
                        className="glow-ember inline-flex h-13 items-center gap-2.5 rounded-full bg-ember-600 px-9 text-[16px] font-semibold text-white transition-colors duration-150 hover:bg-ember-500"
                    >
                        <Mail aria-hidden className="h-4.5 w-4.5" />
                        {t("contact.apply")}
                    </a>
                    <p className="text-[15px] text-stone-400">
                        ilwoongpark@inha.ac.kr · Inha Univ. 2N687
                    </p>
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
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        "radial-gradient(ellipse 110% 50% at 50% 115%, rgba(234,88,12,0.10), rgba(234,88,12,0.03) 55%, transparent 78%), radial-gradient(ellipse 80% 60% at 85% -15%, rgba(68,64,60,0.35), transparent 70%)",
                }}
            />
            <SceneHero />
            <SceneNumbers />
            <SceneResearch />
            <ScenePubs />
            <ScenePeople />
            <ScenePartners />
            <SceneJoin />
        </div>
    );
}
