"use client";

import Image from "next/image";
import AnimatedResearchFigure from "@/components/sections/AnimatedResearchFigure";
import ResearchFigures from "@/components/sections/ResearchFigures";
import { useLanguage } from "@/lib/LanguageContext";
import { collaborators } from "@/app/data";
import Band from "@/components/ui/band";
import { Kicker, Meta, SectionHeader } from "@/components/ui/typo";

/**
 * 02 — RESEARCH. Three stacked chapters (TES / Immersion Cooling / SMR)
 * under one section header. Frame-0: every string below is in the server
 * HTML; no tabs, no random landing pillar, no hover-switch, no motion lib.
 * Single {EN,KR} content shape — one i18n mechanism for the whole section.
 */

type Step = { label: string; sub: string };
type Metric = { value: string; label: string };
type Activity = { title: string; desc: string; tag: string };


type ChapterBase = {
    kicker: string;
    title: string;
    subtitle: string;
    description: string;
    stat: Metric;
    activities: Activity[];
};

type ResearchContent = {
    activitiesLabel: string;
    tes: ChapterBase & {
        processLabel: string;
        steps: Step[];
        metricsLabel: string;
        metrics: Metric[];
    };
    immersion: ChapterBase & {
        processLabel: string;
        steps: Step[];
    };
    smr: ChapterBase;
    methodsKicker: string;
    experimentsLabel: string;
    experiments: string[];
    computationalLabel: string;
    computational: string[];
    collabKicker: string;
};

const CONTENT: Record<"EN" | "KR", ResearchContent> = {
    EN: {
        activitiesLabel: "MFTEL Research Activities",
        tes: {
            kicker: "THERMAL ENERGY STORAGE",
            title: "TES & Carnot Batteries",
            subtitle: "Grid Stability via Thermal Energy Storage",
            description:
                "We develop charging and discharging solutions for thermal energy storage systems using sand, molten salt and other media. Experiments and system analysis evaluate heat transfer and heat exchange across materials and operating conditions.",
            stat: { value: "24/7", label: "supply target" },
            processLabel: "Energy Conversion Process",
            steps: [
                { label: "Excess Renewable", sub: "Solar / Wind surplus" },
                { label: "Store as Heat", sub: "High-temp thermal tank" },
                { label: "Heat → Electricity", sub: "Heat engine cycle" },
                { label: "Stable Power", sub: "24/7 data center supply" },
            ],
            metricsLabel: "Carnot battery system targets",
            metrics: [
                { value: "10+h", label: "Storage duration" },
                { value: "60%+", label: "Round-trip efficiency" },
                { value: "30+yr", label: "Plant lifetime" },
            ],
            activities: [
                {
                    title: "Direct-Contact Latent Heat Storage System",
                    desc: "We study heat exchange through direct contact between PCM and heat transfer fluid. Experiments track melting and solidification during charging and discharge.",
                    tag: "NRF, 2023–2025",
                },
                {
                    title: "Sand Battery Thermal Energy Storage",
                    desc: "We study sand as a high-temperature storage medium. Tube design and system analysis connect heat storage to steam production.",
                    tag: "PATENT 10-2906225",
                },
                {
                    title: "Sustainable Energy Process Innovation",
                    desc: "The convergence graduate programme trains researchers in thermal storage and digital energy process analysis.",
                    tag: "KETEP, 2023–2027",
                },
                {
                    title: "Lab-to-Startup TES Development",
                    desc: "Prototype development and performance tests evaluate the commercial potential of laboratory thermal storage technology.",
                    tag: "MSIT STARTUP, 2025",
                },
            ],
        },
        immersion: {
            kicker: "AI SEMICONDUCTOR COOLING",
            title: "AI Semiconductor Cooling",
            subtitle: "Reducing Cooling Energy Consumption",
            description:
                "Two-phase immersion cooling removes chip heat through boiling in a dielectric fluid. We study how surface structure and orientation affect bubble dynamics and critical heat flux (CHF).",
            stat: { value: "~90%", label: "potential savings¹" },
            processLabel: "How It Works",
            steps: [
                { label: "Fluid Submersion", sub: "Servers submerged in dielectric fluid" },
                { label: "Two-Phase Boiling", sub: "Fluid boils, absorbing massive heat via latent heat" },
                { label: "Condense & Recirculate", sub: "Vapor condenses, natural circulation loop" },
            ],
            activities: [
                {
                    title: "EV Battery Immersion Cooling via Boiling",
                    desc: "We study boiling in dielectric fluids for battery cooling. Tests evaluate heat removal and temperature uniformity.",
                    tag: "INHA UNIV., 2025",
                },
                {
                    title: "Metal Foam-Enhanced Boiling Heat Transfer",
                    desc: "We compare boiling across copper foam pore sizes, thicknesses, and orientations. Tests evaluate heat transfer coefficients and critical heat flux.",
                    tag: "PUB. #20, #21, #23",
                },
                {
                    title: "CHF Dependence on Surface Orientation",
                    desc: "We examine how surface orientation and bubble dynamics affect critical heat flux on silicon and silicon dioxide.",
                    tag: "PUB. #22",
                },
                {
                    title: "Gas-Liquid Flow Path Separation Patent",
                    desc: "The patented design separates gas and liquid flow paths. It aims to reduce bubble interference during battery immersion cooling.",
                    tag: "PATENT 10-2855737",
                },
            ],
        },
        smr: {
            kicker: "SMALL MODULAR REACTORS",
            title: "Small Modular Reactors",
            subtitle: "Sustainable Power Generation",
            description:
                "We study two-phase flow instabilities in SMR steam generators and natural circulation systems. Experiments and one-dimensional system analysis evaluate how flow and pressure oscillations affect heat transfer and system stability.",
            stat: { value: "1D", label: "system analysis" },
            activities: [
                {
                    title: "Core Safety Validation for Multiple-Failure Accidents",
                    desc: "Validating core safety issues against strengthened technical criteria and developing technology to improve core safety during multiple-failure accidents. A long-term flagship project covering natural circulation cooling, two-phase flow instability, and accident progression analysis.",
                    tag: "NRF, 2022–2029",
                },
                {
                    title: "Next-Gen SMR Safety Enhancement Design",
                    desc: "Global human resources training project for securing key design technologies for next-generation SMR safety. Training specialists in passive safety systems, helical steam generator thermal-hydraulics, and containment cooling, all SMR-specific multiphase flow phenomena.",
                    tag: "KETEP, 2024–2025",
                },
                {
                    title: "Containment Condensation Heat Transfer",
                    desc: "Characterizing the effect of noncondensable gases on condensation heat transfer in steam-air mixtures. Experimentally analyzed heat transfer degradation mechanisms by light noncondensable gas (hydrogen) and gas stratification phenomena.",
                    tag: "PUB. #12, #16, #19",
                },
                {
                    title: "External Reactor Vessel Cooling (ERVC)",
                    desc: "Numerically evaluating thermal-hydraulic characteristics of ERVC in high-power reactors. Developed CFD-aided natural circulation flow rate estimation to quantitatively assess ERVC coolability limits.",
                    tag: "PUB. #15, #17",
                },
            ],
        },
        methodsKicker: "METHODS",
        experimentsLabel: "EXPERIMENTS",
        experiments: [
            "Two-Phase Flow Instability",
            "Pool Boiling Heat Transfer",
            "Flow Boiling Heat Transfer",
            "Thermal Margin Test",
            "Dielectric Fluid",
            "Leidenfrost Effect",
            "Wettability",
            "Condensation",
        ],
        computationalLabel: "COMPUTATIONAL ANALYSIS",
        computational: [
            "Nuclear Safety",
            "NSK System",
            "Code Coupling",
            "OpenFOAM",
            "MARS-KS",
            "CUPID",
            "GAMMA+",
            "ANSYS CFD",
            "Fluent",
            "STAR-CCM+",
        ],
        collabKicker: "RESEARCH COLLABORATORS",
    },
    KR: {
        activitiesLabel: "연구 활동",
        tes: {
            kicker: "열에너지 저장",
            title: "카르노 배터리와 열에너지 저장",
            subtitle: "전력망 안정화를 위한 열에너지 저장",
            description:
                "모래와 용융염 등 다양한 축열 매체를 활용하는 열에너지 저장 시스템을 연구합니다. 매체와 운전 조건에 맞는 열전달·열교환 기술로 축열과 방열 성능을 높이고, 실험과 계통 해석으로 평가합니다.",
            stat: { value: "24/7", label: "상시 공급 목표" },
            processLabel: "에너지 변환 과정",
            steps: [
                { label: "남는 재생에너지 전력", sub: "태양광·풍력" },
                { label: "열에너지로 저장", sub: "고온 축열조" },
                { label: "열을 전기로 변환", sub: "열기관 사이클" },
                { label: "데이터센터에 상시 공급", sub: "24시간 안정 전력" },
            ],
            metricsLabel: "카르노 배터리 시스템 설계 목표",
            metrics: [
                { value: "10+h", label: "저장 시간" },
                { value: "60%+", label: "왕복 효율" },
                { value: "30+yr", label: "설비 수명" },
            ],
            activities: [
                {
                    title: "직접접촉 잠열 축열 시스템 개발",
                    desc: "상변화물질과 열매체의 직접접촉 열전달을 연구합니다. 충전·방전 중 용융과 응고를 실험으로 분석합니다.",
                    tag: "NRF, 2023–2025",
                },
                {
                    title: "모래 배터리 기반 열에너지 저장",
                    desc: "모래를 고온 축열 매체로 활용하는 열저장 기술입니다. 축열과 증기 생산을 연결하는 시스템을 개발하고, 열전달과 열 회수 특성을 평가합니다.",
                    tag: "특허 10-2906225",
                },
                {
                    title: "에너지 공정혁신 융합대학원",
                    desc: "디지털 기반 에너지 공정혁신 융합대학원에서 열저장 기술과 계통 해석 인력을 양성합니다.",
                    tag: "KETEP, 2023–2027",
                },
                {
                    title: "연구소기업 열에너지 저장 개발",
                    desc: "시제품 제작과 성능 시험으로 열에너지 저장 기술의 사업화 가능성을 검증합니다.",
                    tag: "과학기술정보통신부 창업 과제, 2025",
                },
            ],
        },
        immersion: {
            kicker: "AI 반도체 냉각",
            title: "2상 액침 냉각",
            subtitle: "냉각에 드는 에너지를 줄입니다",
            description:
                "2상 액침 냉각은 절연유체의 비등을 이용해 반도체에서 발생하는 열을 제거합니다. 칩 표면의 구조와 방향에 따른 기포 거동을 분석하고, 냉각 한계인 임계열유속(CHF)을 평가합니다.",
            stat: { value: "~90%", label: "절감 잠재치¹" },
            processLabel: "작동 원리",
            steps: [
                { label: "절연유체 침지", sub: "서버를 절연유체에 직접 담가 열을 전달" },
                { label: "비등 열전달", sub: "유체가 끓으면서 잠열로 많은 열을 흡수" },
                { label: "응축과 순환", sub: "증기가 응축되어 유체가 자연 순환" },
            ],
            activities: [
                {
                    title: "전기차 배터리 절연유체 비등 냉각",
                    desc: "절연유체의 비등 열전달로 전기차 배터리를 냉각하는 기초 연구입니다. 수냉 방식보다 냉각 성능을 높이고 배터리 팩 전체의 온도를 고르게 유지하는 것이 목표입니다.",
                    tag: "인하대학교, 2025",
                },
                {
                    title: "메탈 폼 기반 비등 열전달 강화",
                    desc: "구리 폼의 기공 크기·두께·방향에 따른 비등 성능을 비교합니다. 임계열유속과 열전달계수를 함께 평가합니다.",
                    tag: "관련 논문 4편",
                },
                {
                    title: "표면 방향별 임계열유속 의존성",
                    desc: "실리콘과 이산화규소 표면에서 방향과 기포 거동이 임계열유속에 미치는 영향을 분석합니다.",
                    tag: "관련 논문 1편",
                },
                {
                    title: "기체·액체 유로 분리 액침 냉각",
                    desc: "비등할 때 생기는 기체와 액체의 유로를 분리해 기포 간섭을 줄이고 열전달 성능을 높이는 배터리 액침 냉각 특허 기술입니다.",
                    tag: "특허 10-2855737",
                },
            ],
        },
        smr: {
            kicker: "소형모듈원자로",
            title: "SMR 안전",
            subtitle: "열수력 안전과 유동 안정성",
            description:
                "소형모듈원자로의 증기발생기와 자연순환 계통에서 이상유동 불안정성이 발생하는 조건을 연구합니다. 실험과 1차원 계통 해석으로 유량·압력의 진동이 열전달과 계통 안정성에 미치는 영향을 평가합니다.",
            stat: { value: "1D", label: "계통 해석" },
            activities: [
                {
                    title: "노심 안전성 검증 및 다중고장 사고 대응",
                    desc: "강화된 기술기준에 맞춰 노심 안전성을 검증하고, 다중고장 사고에서 안전성을 높이는 기술을 개발합니다. 자연순환 냉각, 이상유동 불안정성, 사고 진행 시나리오 분석을 포함하는 장기 과제입니다.",
                    tag: "NRF, 2022–2029",
                },
                {
                    title: "차세대 SMR 안전 강화 핵심 설계기술",
                    desc: "피동안전계통, 나선관 증기발생기, 격납용기 냉각을 연구할 전문 인력을 양성하는 국제 협력 사업입니다.",
                    tag: "KETEP, 2024–2025",
                },
                {
                    title: "격납용기 내 응축 열전달 연구",
                    desc: "증기·공기 혼합물에서 비응축성 기체가 응축 열전달과 기체 분포에 미치는 영향을 실험으로 분석합니다.",
                    tag: "관련 논문 3편",
                },
                {
                    title: "원자로 외벽 냉각(ERVC) 해석",
                    desc: "고출력 원자로의 외벽 냉각 열수력을 수치해석하고, CFD 기반 자연순환 유량 추정법으로 ERVC 냉각 한계를 정량 평가했습니다.",
                    tag: "관련 논문 2편",
                },
            ],
        },
        methodsKicker: "연구 방법",
        experimentsLabel: "실험 연구",
        experiments: [
            "이상유동 불안정성",
            "풀 비등 열전달",
            "유동 비등 열전달",
            "열적 마진 시험",
            "절연유체",
            "Leidenfrost 효과",
            "젖음성",
            "응축",
        ],
        computationalLabel: "전산 해석",
        computational: [
            "원자력 안전",
            "NSK System",
            "코드 커플링",
            "OpenFOAM",
            "MARS-KS",
            "CUPID",
            "GAMMA+",
            "ANSYS CFD",
            "Fluent",
            "STAR-CCM+",
        ],
        collabKicker: "협력 기관",
    },
};

// ─── Local building blocks (mono only via typo.tsx) ───

function SubLabel({ children }: { children: React.ReactNode }) {
    return (
        <h4 className="mb-4">
            <Meta className="text-xs font-medium uppercase tracking-[0.08em]">{children}</Meta>
        </h4>
    );
}

function ChapterHead({
    index,
    kicker,
    title,
    subtitle,
    stat,
    isKR,
}: {
    index: string;
    kicker: string;
    title: string;
    subtitle: string;
    stat: Metric;
    isKR: boolean;
}) {
    return (
        <div>
            <Kicker index={index}>{kicker}</Kicker>
            <div className="mt-5 flex items-start justify-between gap-5 md:items-end md:gap-8">
                <div className="min-w-0 max-w-2xl">
                    <h3
                        className={`break-keep text-xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere] md:text-2xl ${
                            isKR ? "leading-[1.3]" : "leading-[1.2]"
                        }`}
                    >
                        {title}
                    </h3>
                    <p className="mt-1.5 text-base text-ink-2">{subtitle}</p>
                </div>
                <div className="w-20 shrink-0 pt-1 text-right md:w-auto">
                    <p className="text-xl font-semibold leading-none tracking-tight text-ink tabular-nums md:text-2xl">
                        {stat.value}
                    </p>
                    <p className="mt-1.5">
                        <Meta className="text-xs uppercase tracking-[0.08em]">{stat.label}</Meta>
                    </p>
                </div>
            </div>
        </div>
    );
}

/** Numbered process flow — horizontal with mono arrows on md+, vertical rail with dots on mobile (direction preserved). */
function StepFlow({ steps, isKR }: { steps: Step[]; isKR: boolean }) {
    return (
        <ol className="md:flex md:items-stretch">
            {steps.map((s, i) => {
                const last = i === steps.length - 1;
                return (
                    <li
                        key={s.label}
                        className={`relative border-l border-hairline pl-5 md:flex-1 md:border-l-0 md:border-t md:pl-0 md:pt-4 ${
                            last ? "" : "pb-6 md:pb-0 md:pr-10"
                        }`}
                    >
                        <span
                            aria-hidden
                            className="absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full bg-ink-4 md:-top-[3.5px] md:left-0"
                        />
                        <Meta className="text-xs">{String(i + 1).padStart(2, "0")}</Meta>
                        <p className="mt-1 break-keep text-[15px] font-semibold leading-snug text-ink">{s.label}</p>
                        <p className={`mt-0.5 break-keep text-sm text-ink-3 ${isKR ? "leading-[1.75]" : "leading-relaxed"}`}>
                            {s.sub}
                        </p>
                        {!last && (
                            <span aria-hidden className="absolute right-4 top-4 hidden md:block">
                                <Meta className="text-ink-4">→</Meta>
                            </span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/** Instrument stat cells — hairline-divided, tabular numerals (Hero strip pattern). */
function MetricRow({ metrics }: { metrics: Metric[] }) {
    return (
        <div
            className={`grid border-y border-hairline ${
                metrics.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"
            }`}
        >
            {metrics.map((m, i) => (
                <div
                    key={m.label}
                    className={`px-4 py-5 md:px-5 ${i > 0 ? "border-l border-hairline" : ""} ${
                        metrics.length !== 3 && i === 2 ? "max-md:border-l-0 max-md:border-t" : ""
                    } ${metrics.length !== 3 && i === 3 ? "max-md:border-t" : ""}`}
                >
                    <p className="text-2xl font-semibold leading-none tracking-tight text-ink tabular-nums md:text-[30px]">
                        {m.value}
                    </p>
                    <p className="mt-2">
                        <Meta className="text-xs">{m.label}</Meta>
                    </p>
                </div>
            ))}
        </div>
    );
}

/** Activity rows — hairline list, evidence tag (grant / patent / pub) as mono chip. */
function ActivityList({ label, items, isKR }: { label: string; items: Activity[]; isKR: boolean }) {
    return (
        <div>
            <SubLabel>{label}</SubLabel>
            <ul className="research-activities">
                {items.map((a) => (
                    <li
                        key={a.title}
                        className="border-t border-hairline py-5"
                    >
                        <div>
                            <h5 className="break-keep text-base font-semibold leading-relaxed text-ink">{a.title}</h5>
                            <p
                                className={`mt-2 max-w-3xl break-keep text-[15px] text-ink-2 ${
                                    isKR ? "leading-[1.75]" : "leading-relaxed"
                                }`}
                            >
                                {a.desc}
                            </p>
                        </div>
                        <span className="mt-3 block">
                            <Meta className="text-xs whitespace-nowrap">{a.tag}</Meta>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Grouped plain-text row: mono group label left, names right. */
function LabeledRow({
    label,
    isKR,
    children,
}: {
    label: string;
    isKR: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid border-t border-hairline py-4 first:border-t-0 md:grid-cols-[200px_1fr] md:gap-6">
            <div>
                <Meta className="text-xs font-medium uppercase tracking-[0.08em]">{label}</Meta>
            </div>
            <p className={`mt-1.5 break-keep text-[15px] text-ink-2 md:mt-0 ${isKR ? "leading-[1.75]" : "leading-relaxed"}`}>
                {children}
            </p>
        </div>
    );
}

// ─── Section ───

export default function Research() {
    const { t, language } = useLanguage();
    const isKR = language === "KR";
    const c = isKR ? CONTENT.KR : CONTENT.EN;
    const lead = isKR ? "leading-[1.75]" : "leading-[1.7]";

    return (
        <Band id="research" surface="paper">
            <SectionHeader
                index="02"
                kicker={t("research.label")}
                title={t("research.title")}
                isKorean={isKR}
            />



            <div className="space-y-14 md:space-y-18">
                {/* ── 02.1 TES & Carnot Batteries ── */}
                <article id="tes" className="research-chapter">
                    <ChapterHead
                        index="02.1"
                        kicker={c.tes.kicker}
                        title={c.tes.title}
                        subtitle={c.tes.subtitle}
                        stat={c.tes.stat}
                        isKR={isKR}
                    />
                    <div className="research-overview research-overview-pair">
                        <div className="research-premise">
                            <h4>{isKR ? "축열재와 배관 사이의 열전달을 규명합니다." : "Understanding heat recovery from the storage material to the tube."}</h4>
                            <p className={`mt-4 break-keep text-base text-ink-2 ${lead}`}>{c.tes.description}</p>
                        </div>
                        <div className="research-topic-pair">
                        <figure>
                            <AnimatedResearchFigure kind="tes" index={0} title={isKR ? "모래 배터리와 관내 증발을 이용한 열 회수" : "Sand battery with in-tube evaporation"} isKR={isKR} />
                            <figcaption><strong>{isKR ? "모래 배터리의 열 회수" : "Heat recovery from sand storage"}</strong><span>{isKR ? "관내 증발과 열전달을 분석해 증기 생산 조건을 평가합니다." : "Evaluating steam production through in-tube evaporation and heat transfer."}</span></figcaption>
                        </figure>
                        <figure>
                            <AnimatedResearchFigure kind="tes" index={1} title={isKR ? "용융염 열저장" : "Molten-salt heat storage"} isKR={isKR} />
                            <figcaption><strong>{isKR ? "용융염 열저장" : "Molten-salt heat storage"}</strong><span>{isKR ? "저장한 열을 필요한 때 안정적으로 공급하는 방법을 연구합니다." : "Storing heat and delivering it when needed."}</span></figcaption>
                        </figure>
                        </div>
                    </div>

                    <div className="mt-8">
                        <ResearchFigures kind="tes" isKR={isKR} />
                    </div>

                    <div className="mt-8">
                        <SubLabel>{c.tes.processLabel}</SubLabel>
                        <StepFlow steps={c.tes.steps} isKR={isKR} />
                    </div>

                    <div className="mt-8">
                        <SubLabel>{c.tes.metricsLabel}</SubLabel>
                        <MetricRow metrics={c.tes.metrics} />
                        <p className="mt-3 text-sm leading-relaxed text-ink-3">{isKR ? "기존 연구 소개의 시스템 목표입니다. 60%는 전력→열→전력의 왕복 효율 목표이며, 모래 축열조의 실측 효율과 구분합니다." : "These targets come from the existing research overview. The 60% value refers to electricity-to-electricity round-trip efficiency, not measured sand-store efficiency."}</p>
                    </div>



                    <div className="mt-8">
                        <ActivityList label={c.activitiesLabel} items={c.tes.activities} isKR={isKR} />
                    </div>
                    <div className="research-references"><a href="https://www.dlr.de/en/sf/research-and-transfer/topics/heat-transition/systems-with-heat-storage" target="_blank" rel="noopener noreferrer">{isKR ? "열저장 시스템 개념 · DLR" : "Thermal storage concepts · DLR"} ↗</a></div>


                </article>

                {/* ── 02.2 Immersion Cooling ── */}
                <article id="cooling" className="research-chapter">
                    <ChapterHead
                        index="02.2"
                        kicker={c.immersion.kicker}
                        title={c.immersion.title}
                        subtitle={c.immersion.subtitle}
                        stat={c.immersion.stat}
                        isKR={isKR}
                    />
                    <div className="research-overview research-overview-pair">
                        <div className="research-premise">
                            <h4>{isKR ? "기포 거동과 표면 구조로 냉각 한계를 설명합니다." : "Connecting bubble dynamics and surface structure to cooling limits."}</h4>
                            <p className={`mt-4 break-keep text-base text-ink-2 ${lead}`}>{c.immersion.description}</p>
                        </div>
                        <div className="research-topic-pair">
                        <figure>
                            <AnimatedResearchFigure kind="cooling" index={0} title={isKR ? "반도체 칩의 비등과 2상 액침 냉각" : "Chip boiling and two-phase immersion cooling"} isKR={isKR} />
                            <figcaption><strong>{isKR ? "2상 액침 냉각" : "Two-phase immersion cooling"}</strong><span>{isKR ? "칩의 발열을 제거하는 비등 현상과 냉각 한계를 연구합니다." : "Studying boiling heat removal and chip cooling limits."}</span></figcaption>
                        </figure>
                        <figure>
                            <AnimatedResearchFigure kind="cooling" index={1} title={isKR ? "칩 표면의 비등과 재젖음" : "Boiling and rewetting on a chip"} isKR={isKR} />
                            <figcaption><strong>{isKR ? "칩 표면의 비등과 재젖음" : "Boiling and rewetting on a chip"}</strong><span>{isKR ? "기포의 성장·이탈과 액체의 재공급을 살펴 냉각 한계를 연구합니다." : "Studying bubble growth, departure and liquid replenishment to understand cooling limits."}</span></figcaption>
                        </figure>
                        </div>
                    </div>

                    <div className="mt-8">
                        <ResearchFigures kind="cooling" isKR={isKR} />
                    </div>

                    <div className="mt-8">
                        <SubLabel>{c.immersion.processLabel}</SubLabel>
                        <StepFlow steps={c.immersion.steps} isKR={isKR} />
                    </div>

                    <div className="research-source-note">
                        <p>{isKR ? "최대 90% 절감과 PUE 1.02는 GIGABYTE가 소개한 액침 냉각의 잠재 성능입니다. 연구실의 실측 결과가 아니며, 설계와 운전 조건에 따라 달라집니다." : "GIGABYTE lists potential energy savings up to 90% and PUE as low as 1.02. These are not MFTEL measurements. Results depend on system design and operation."}</p>
                        <a href="https://www.gigabyte.com/Solutions/immersion-cooling?lan=en-US" target="_blank" rel="noopener noreferrer">{isKR ? "수치 출처 · GIGABYTE" : "Source · GIGABYTE"} ↗</a>
                    </div>

                    <div className="mt-8">
                        <ActivityList label={c.activitiesLabel} items={c.immersion.activities} isKR={isKR} />
                    </div>
                    <div className="research-references"><a href="https://doi.org/10.1155/er/6413134" target="_blank" rel="noopener noreferrer">{isKR ? "표면 방향과 CHF · 2025" : "Surface orientation and CHF · 2025"} ↗</a><a href="https://doi.org/10.1016/j.icheatmasstransfer.2024.108318" target="_blank" rel="noopener noreferrer">{isKR ? "구리 폼의 비등 성능 · 2024" : "Copper foam boiling · 2024"} ↗</a></div>


                </article>

                {/* ── 02.3 Small Modular Reactors ── */}
                <article id="smr" className="research-chapter">
                    <ChapterHead
                        index="02.3"
                        kicker={c.smr.kicker}
                        title={c.smr.title}
                        subtitle={c.smr.subtitle}
                        stat={c.smr.stat}
                        isKR={isKR}
                    />
                    <div className="research-overview research-overview-pair">
                        <div className="research-premise">
                            <h4>{isKR ? "유량과 압력의 진동이 시작되는 조건을 밝힙니다." : "Identifying when flow and pressure begin to oscillate."}</h4>
                            <p className={`mt-4 break-keep text-base text-ink-2 ${lead}`}>{c.smr.description}</p>
                        </div>
                        <div className="research-topic-pair">
                        <figure>
                            <AnimatedResearchFigure kind="smr" index={0} title={isKR ? "원자로와 증기발생기, 터빈을 연결한 발전 계통" : "Reactor, steam generator, and turbine system"} isKR={isKR} />
                            <figcaption><strong>{isKR ? "SMR의 열수력 계통" : "SMR thermal-hydraulic systems"}</strong><span>{isKR ? "증기발생기에서 시작된 유동 변화가 계통에 미치는 영향을 연구합니다." : "Studying system responses to changes in steam-generator flow."}</span></figcaption>
                        </figure>
                        <figure>
                            <AnimatedResearchFigure kind="smr" index={1} title={isKR ? "얇은 공통 헤더에 연결된 다섯 개 평행 유로의 이상유동" : "Two-phase flow in five parallel channels connected by slim common headers"} isKR={isKR} />
                            <figcaption><strong>{isKR ? "유로 사이의 유동 불안정성" : "Flow instability between channels"}</strong><span>{isKR ? "나란한 유로의 흐름이 서로 달라지고 진동하는 원인을 밝힙니다." : "Understanding why parallel flows diverge and oscillate."}</span></figcaption>
                        </figure>
                        </div>
                    </div>

                    <div className="mt-8">
                        <ResearchFigures kind="smr" isKR={isKR} />
                    </div>

                    <div className="mt-8">
                        <SubLabel>{isKR ? "현상에서 계통으로" : "From local phenomena to the system"}</SubLabel>
                        <StepFlow isKR={isKR} steps={isKR ? [
                            { label: "비등 구간 확인", sub: "증기발생기 2차측의 밀도·압력강하 변화" },
                            { label: "유동 진동 측정", sub: "유량·압력·온도의 시간 지연과 상호작용" },
                            { label: "계통 응답 해석", sub: "1D 코드로 운전 조건에 따른 안정성 평가" },
                        ] : [
                            { label: "Locate boiling", sub: "Density and pressure-drop changes on the secondary side" },
                            { label: "Measure oscillations", sub: "Delays between flow, pressure, and temperature responses" },
                            { label: "Analyse the system", sub: "Evaluate operating stability with a one-dimensional code" },
                        ]} />
                    </div>

                    <div className="mt-8">
                        <ActivityList label={c.activitiesLabel} items={c.smr.activities} isKR={isKR} />
                    </div>
                    <div className="research-references"><a href="https://doi.org/10.1016/j.ijheatmasstransfer.2021.121711" target="_blank" rel="noopener noreferrer">{isKR ? "기포 거동과 유동 불안정성 · 2021" : "Bubble dynamics and flow instability · 2021"} ↗</a><a href="https://doi.org/10.1016/j.net.2021.07.037" target="_blank" rel="noopener noreferrer">{isKR ? "자연순환 계통 해석 · 2022" : "Natural circulation analysis · 2022"} ↗</a></div>


                </article>

                {/* ── Methods + Collaborators close the section ── */}
                <div className="space-y-12 md:space-y-16">
                    <div>
                        <Kicker index="02.4">{c.methodsKicker}</Kicker>
                        <div className="mt-6 border-b border-hairline">
                            <LabeledRow label={c.experimentsLabel} isKR={isKR}>
                                {c.experiments.map((x, i) => (<span key={x}><span className="whitespace-nowrap">{x}</span>{i < c.experiments.length - 1 ? " · " : ""}</span>))}
                            </LabeledRow>
                            <LabeledRow label={c.computationalLabel} isKR={isKR}>
                                {c.computational.map((x, i) => (<span key={x}><span className="whitespace-nowrap">{x}</span>{i < c.computational.length - 1 ? " · " : ""}</span>))}
                            </LabeledRow>
                        </div>
                    </div>

                    <div>
                        <Kicker index="02.5">{c.collabKicker}</Kicker>
                        <div className="mt-6 border-b border-hairline">
                            {collaborators.map((g) => {
                                const links = g.links as Partial<Record<string, string>>;
                                return (
                                    <LabeledRow key={g.group} label={isKR ? g.groupKR : g.group.toUpperCase()} isKR={isKR}>
                                        {g.names.map((name, i) => (
                                            <span key={name}>
                                                {i > 0 && <span className="text-ink-4"> · </span>}
                                                {links[name] ? (
                                                    <a
                                                        href={links[name]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="-my-3 inline-flex min-h-11 items-center gap-1 rounded-lg px-1 font-medium text-ember-700 transition-colors duration-150 hover:text-ember-800"
                                                    >
                                                        {name}
                                                        <span aria-hidden>↗</span>
                                                    </a>
                                                ) : (
                                                    name
                                                )}
                                            </span>
                                        ))}
                                    </LabeledRow>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Band>
    );
}
