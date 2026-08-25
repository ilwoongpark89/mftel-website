"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame, Droplets, Atom } from "lucide-react";
import { teamMembers, alumni, publications } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";
import Band from "@/components/ui/band";
import { SectionHeader, Meta, FigCaption } from "@/components/ui/typo";

/**
 * CALORIMETER §05 TEAM — PI profile header + static student photo grid +
 * single alumni hairline row. Frame-0: all member photos are in the server HTML
 * (flip cards / checker backs / easter egg / mobile photo-less accordion
 * deleted). The only entrance motion is the SectionHeader reveal. The pillar
 * taxonomy is surfaced as a mono legend instead of hidden card-back colors.
 */

/** Pub count derived from publications author strings — spacing-insensitive,
 *  romanization aliases included (e.g., Hyun Jin Yong ↔ Hyeon Jin Yong). */
const getStudentPubCount = (member: { name: string; aliases?: string[] }) => {
    const compacts = [member.name, ...(member.aliases ?? [])].map((n) =>
        n.toLowerCase().replace(/\s+/g, "")
    );
    return publications.filter((pub) => {
        const authors = pub.authors.toLowerCase().replace(/\s+/g, "");
        return compacts.some((c) => authors.includes(c));
    }).length;
};

type PillarKey = "tes" | "immersion" | "smr";

/** member → research pillar (assignments preserved from the legacy color map) */
const memberPillar: Record<string, PillarKey> = {
    "Hyun Jin Yong": "immersion",
    "Jun Beom Song": "tes",
    "Sang Min Song": "tes",
    "Jae Hyeok Yang": "smr",
    "Hyeon Geun Shin": "tes",
    "Sung Jin Kim": "immersion",
    "Kyeong Ju Ko": "smr",
    "Chaeyeon Kim": "immersion",
    "Eunbin Park": "smr",
    "Manho Kim": "smr",
    "Yeongjun Jung": "immersion",
};

const PILLARS: { key: PillarKey; icon: typeof Flame; label: string; labelKR: string }[] = [
    { key: "tes", icon: Flame, label: "TES", labelKR: "열에너지 저장" },
    { key: "immersion", icon: Droplets, label: "AI CHIP COOLING", labelKR: "AI 반도체 냉각" },
    { key: "smr", icon: Atom, label: "SMR", labelKR: "소형모듈원자로" },
];

const pillarCount = (key: PillarKey) =>
    teamMembers.filter((m) => memberPillar[m.name] === key).length;

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

/** "Role, Place (2014 ~ 2018)" → body + mono period column. */
function CredentialList({
    label,
    items,
    isKR,
}: {
    label: string;
    items: string[];
    isKR: boolean;
}) {
    return (
        <div>
            <Meta className="block text-xs uppercase tracking-[0.08em]">{label}</Meta>
            <ul className="mt-3 border-t border-hairline">
                {items.map((item) => {
                    const match = item.match(/^(.*?)\s*\(([^)]+)\)$/);
                    const body = match ? match[1] : item;
                    const period = match ? match[2] : null;
                    return (
                        <li
                            key={item}
                            className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5"
                        >
                            <span
                                className={`break-keep text-sm text-ink-2 ${
                                    isKR ? "leading-[1.75]" : "leading-[1.6]"
                                }`}
                            >
                                {body}
                            </span>
                            {period ? (
                                <Meta className="shrink-0 whitespace-nowrap text-xs">{period}</Meta>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default function Team() {
    const { language, t, lp } = useLanguage();
    const isKR = language === "KR";

    const educationCareer = isKR ? educationCareerKR : educationCareerEN;
    const professionalActivities = isKR ? professionalActivitiesKR : professionalActivitiesEN;
    const professorName = isKR ? "박일웅 교수" : "Prof. Il Woong Park";
    const professorTitle = isKR
        ? "인하대학교 기계공학과 조교수"
        : "Assistant Professor · Mechanical Engineering, Inha University";

    return (
        <Band id="team" surface="paper">
            <SectionHeader
                index="05"
                kicker={t("team.label")}
                title={t("team.title")}
                isKorean={isKR}
            />

            {/* ── Principal Investigator ───────────────────────────────── */}
            <div className="border-t border-hairline pt-8 md:pt-10">
                <h3 className="break-keep text-xl font-semibold tracking-tight text-ink md:text-2xl">
                    {t("team.pi")}
                </h3>

                <div className="mt-6 flex flex-col gap-8 md:mt-8 md:flex-row md:gap-12">
                    <figure className="w-full max-w-[280px] shrink-0">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-hairline bg-well">
                            <Image
                                src="/images/Professor_Il Woong Park.png"
                                alt={professorName}
                                fill
                                sizes="(max-width: 768px) 80vw, 280px"
                                className="object-cover"
                            />
                        </div>
                    </figure>

                    <div className="min-w-0 flex-1">
                        <h4 className="break-keep text-[28px] font-semibold leading-[1.25] tracking-tight text-ink">
                            {professorName}
                        </h4>
                        <p
                            className={`mt-1.5 break-keep text-[15px] text-ink-2 ${
                                isKR ? "leading-[1.75]" : "leading-[1.6]"
                            }`}
                        >
                            {professorTitle}
                        </p>

                        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-10">
                            <CredentialList
                                label={t("team.education")}
                                items={educationCareer}
                                isKR={isKR}
                            />
                            <CredentialList
                                label={t("team.activities")}
                                items={professionalActivities}
                                isKR={isKR}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Graduate Students ────────────────────────────────────── */}
            <div className="mt-14 border-t border-hairline pt-8 md:mt-20 md:pt-10">
                <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
                    <h3 className="break-keep text-xl font-semibold tracking-tight text-ink md:text-2xl">
                        {t("team.students")}{" "}
                        <Meta className="ml-1">· {teamMembers.length}</Meta>
                    </h3>

                    {/* pillar legend — taxonomy surfaced, counts derived from the map */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        {PILLARS.map((pillar) => {
                            const Icon = pillar.icon;
                            return (
                                <span key={pillar.key} className="flex items-center gap-1.5">
                                    <Icon
                                        aria-hidden
                                        strokeWidth={1.75}
                                        className="h-4 w-4 text-ink-3"
                                    />
                                    <Meta className="text-xs uppercase tracking-[0.08em]">
                                        {isKR ? pillar.labelKR : pillar.label} ·{" "}
                                        {pillarCount(pillar.key)}
                                    </Meta>
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                    {teamMembers.map((member) => {
                        const primaryName = isKR ? member.nameKR : member.name;
                        const secondaryName = isKR ? member.name : member.nameKR;
                        const degree = isKR ? member.degreeKR : member.degree;
                        const research = isKR ? member.researchKR : member.research;
                        const pubCount = getStudentPubCount(member);

                        return (
                            <article
                                key={member.name}
                                className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-white"
                            >
                                <div className="relative aspect-[3/4] bg-well">
                                    <Image
                                        src={`/images/${member.name}.jpg`}
                                        alt={primaryName}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col border-t border-hairline p-4">
                                    <FigCaption>{degree}</FigCaption>
                                    <h4 className="mt-1.5 break-keep text-[15px] font-semibold leading-[1.4] text-ink">
                                        {primaryName}{" "}
                                        <span className="font-normal text-ink-3">
                                            {secondaryName}
                                        </span>
                                    </h4>
                                    <p className="mt-1 break-keep text-xs leading-[1.6] text-ink-3">
                                        {research
                                            .split(",")
                                            .map((r) => `#${r.trim()}`)
                                            .join(" ")}
                                    </p>
                                    {pubCount > 0 ? (
                                        // 멤버 이름이 검색어로 채워진 논문 목록으로 이동
                                        <Link
                                            href={lp(`/publications?q=${encodeURIComponent(member.name)}`)}
                                            className="mt-auto inline-flex min-h-11 items-center gap-1 self-start pt-2 text-ember-700 transition-colors duration-150 hover:text-ember-800"
                                        >
                                            <Meta className="text-xs uppercase tracking-[0.08em] text-inherit">
                                                {isKR ? t("team.publications") : "PUBS"} ·{" "}
                                                {pubCount}
                                            </Meta>
                                            <span aria-hidden className="text-[11px]">
                                                →
                                            </span>
                                        </Link>
                                    ) : null}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            {/* ── Alumni — single hairline row, destination is the signal ─ */}
            <div className="mt-14 border-t border-hairline pt-8 md:mt-20 md:pt-10">
                <h3 className="break-keep text-xl font-semibold tracking-tight text-ink md:text-2xl">
                    {t("team.alumni")}
                </h3>

                <ul className="mt-6">
                    {alumni.map((alum) => (
                        <li
                            key={alum.name}
                            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hairline py-5 first:border-t"
                        >
                            <span className="break-keep text-[15px] font-medium text-ink">
                                {isKR
                                    ? `${alum.nameKR} ${alum.name}`
                                    : `${alum.name} ${alum.nameKR}`}
                            </span>
                            <Meta>{isKR ? alum.yearKR : alum.year}</Meta>
                            <Meta aria-hidden>→</Meta>
                            <span className="break-keep text-[15px] font-semibold text-ink">
                                {isKR ? alum.positionKR : alum.position}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </Band>
    );
}
