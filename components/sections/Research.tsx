"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { collaborators } from "@/app/data";
import Band from "@/components/ui/band";
import { Kicker, Meta, FigCaption, SectionHeader } from "@/components/ui/typo";

/**
 * 02 — RESEARCH. Three stacked chapters (TES / Immersion Cooling / SMR)
 * under one section header. Frame-0: every string below is in the server
 * HTML; no tabs, no random landing pillar, no hover-switch, no motion lib.
 * Single {EN,KR} content shape — one i18n mechanism for the whole section.
 */

type Step = { label: string; sub: string };
type Metric = { value: string; label: string };
type Activity = { title: string; desc: string; tag: string };
type CompareRow = { label: string; air: string; immersion: string };
type EnergySource = { name: string; sub: string; highlight: boolean };

const COMPANIES = [
    { name: "MICROSOFT", power: "835 MW" },
    { name: "GOOGLE", power: "500 MW" },
    { name: "META", power: "1 GW" },
    { name: "AMAZON", power: "1+ GW" },
] as const;

type ChapterBase = {
    kicker: string;
    title: string;
    subtitle: string;
    description: string;
    stat: Metric;
    why: string;
    activities: Activity[];
    fig: string;
    figAlt: string;
};

type ResearchContent = {
    paradox: { title: string; body: string };
    activitiesLabel: string;
    metricSr: string;
    tes: ChapterBase & {
        processLabel: string;
        steps: Step[];
        metricsLabel: string;
        metrics: Metric[];
    };
    immersion: ChapterBase & {
        processLabel: string;
        steps: Step[];
        comparisonLabel: string;
        colAir: string;
        colImmersion: string;
        comparison: CompareRow[];
    };
    smr: ChapterBase & {
        sourcesLabel: string;
        sources: EnergySource[];
        advantagesLabel: string;
        advantages: { title: string; desc: string }[];
        demandLabel: string;
    };
    methodsKicker: string;
    experimentsLabel: string;
    experiments: string[];
    computationalLabel: string;
    computational: string[];
    collabKicker: string;
};

const CONTENT: Record<"EN" | "KR", ResearchContent> = {
    EN: {
        paradox: {
            title: "The AI Energy Paradox",
            body: "AI now drives some of the fastest-growing electricity demand on earth. Training a single LLM costs tens of GWh, and each inference draws roughly 10× the power of a conventional search. By 2030, data centers could consume close to 9% of U.S. electricity, about 3% of global supply. In the end, the problem is heat: multiphase heat transfer sets the limit at every stage of generating, storing, and using power. MFTEL studies this problem in three research fields.",
        },
        activitiesLabel: "MFTEL Research Activities",
        metricSr: "Metric",
        tes: {
            kicker: "THERMAL ENERGY STORAGE",
            title: "TES & Carnot Batteries",
            subtitle: "Grid Stability via Thermal Energy Storage",
            description:
                "Thermal energy storage bridges the gap between intermittent renewable supply and constant data center demand. By storing excess energy as heat and converting it back to electricity on demand, Carnot batteries ensure grid stability without fossil backup.",
            stat: { value: "24/7", label: "stable supply" },
            processLabel: "Energy Conversion Process",
            steps: [
                { label: "Excess Renewable", sub: "Solar / Wind surplus" },
                { label: "Store as Heat", sub: "High-temp thermal tank" },
                { label: "Heat → Electricity", sub: "Heat engine cycle" },
                { label: "Stable Power", sub: "24/7 data center supply" },
            ],
            metricsLabel: "Key Metrics",
            metrics: [
                { value: "10+h", label: "Storage duration" },
                { value: "60%+", label: "Round-trip efficiency" },
                { value: "30+yr", label: "Plant lifetime" },
            ],
            why: "Intermittency of renewables is the greatest challenge for data center operations. Carnot batteries enable large-scale, long-duration storage compared to Li-ion, and can repurpose existing power plant infrastructure, achieving both economic viability and scalability.",
            activities: [
                {
                    title: "Direct-Contact Latent Heat Storage System",
                    desc: "Significantly improving heat transfer efficiency over indirect methods through direct contact between PCM and heat transfer fluid. Experimentally characterizing multi-phase flow phenomena during PCM melting and solidification in charge/discharge cycles.",
                    tag: "NRF, 2023–2025",
                },
                {
                    title: "Sand Battery Thermal Energy Storage",
                    desc: "A novel patented sand battery concept using sand as a high-temperature thermal storage medium. Enables large-scale heat storage with low-cost materials, with an integrated system including energy extraction methodology.",
                    tag: "PATENT 10-2906225",
                },
                {
                    title: "Sustainable Energy Process Innovation",
                    desc: "Cultivating next-generation thermal storage talent through the Digital-Based Sustainable Energy Process Innovation Convergence Graduate School program.",
                    tag: "KETEP, 2023–2027",
                },
                {
                    title: "Lab-to-Startup TES Development",
                    desc: "Scaling up laboratory-level thermal energy storage technology to startup level, validating commercialization potential through prototype development and testing.",
                    tag: "MSIT STARTUP, 2025",
                },
            ],
            fig: "FIG. 2.1 — THERMAL ENERGY STORAGE RESEARCH SUMMARY",
            figAlt: "TES Research Summary",
        },
        immersion: {
            kicker: "AI SEMICONDUCTOR COOLING",
            title: "AI Semiconductor Cooling",
            subtitle: "Reducing Cooling Energy Consumption",
            description:
                "Two-phase immersion cooling eliminates the need for traditional air cooling infrastructure, reducing cooling energy by up to 90%. Direct contact with dielectric fluid enables higher chip densities and removes the thermal bottleneck at the processor level.",
            stat: { value: "~90%", label: "cooling energy saved" },
            processLabel: "How It Works",
            steps: [
                { label: "Fluid Submersion", sub: "Servers submerged in dielectric fluid" },
                { label: "Two-Phase Boiling", sub: "Fluid boils, absorbing massive heat via latent heat" },
                { label: "Condense & Recirculate", sub: "Vapor condenses, natural circulation loop" },
            ],
            comparisonLabel: "Air Cooling vs Immersion Cooling",
            colAir: "Air",
            colImmersion: "Immersion",
            comparison: [
                { label: "Energy Efficiency (PUE)", air: "1.3 – 1.5", immersion: "1.02 – 1.05" },
                { label: "Cooling Energy Share", air: "30 – 40%", immersion: "2 – 5%" },
                { label: "Chip Heat Flux Limit", air: "~10 W/cm²", immersion: "~200 W/cm²" },
                { label: "Server Density", air: "6–8 kW/rack", immersion: "50–100 kW/rack" },
            ],
            why: "As AI accelerators (GPUs, TPUs) exceed 700W TDP, air cooling alone cannot keep up. Two-phase boiling heat transfer handles 20× more heat per unit area than air, pushing data center PUE close to 1.0.",
            activities: [
                {
                    title: "EV Battery Immersion Cooling via Boiling",
                    desc: "Fundamental research on electric vehicle battery cooling using insulating fluid boiling heat transfer. Significantly improving cooling performance over conventional water-cooling while ensuring temperature uniformity at the battery pack level.",
                    tag: "INHA UNIV., 2025",
                },
                {
                    title: "Metal Foam-Enhanced Boiling Heat Transfer",
                    desc: "Systematically characterizing the effects of sub-millimeter copper foam pore size, thickness, and orientation on boiling heat transfer. Experimentally demonstrated that metal foam application increases critical heat flux (CHF) by up to 3×.",
                    tag: "PUB. #20, #21, #23",
                },
                {
                    title: "CHF Dependence on Surface Orientation",
                    desc: "Analyzing the influence of surface orientation and bubble dynamics on critical heat flux over silicon and SiO₂ surfaces. Building predictive CHF modeling foundations essential for immersion cooling system design.",
                    tag: "PUB. #22",
                },
                {
                    title: "Gas-Liquid Flow Path Separation Patent",
                    desc: "Patented battery immersion cooling system that physically separates gas and liquid flow paths during boiling, maximizing heat transfer performance. Prevents bubble interference to ensure stable cooling operation.",
                    tag: "PATENT 10-2855737",
                },
            ],
            fig: "FIG. 2.2 — BOILING HEAT TRANSFER & IMMERSION COOLING RESEARCH",
            figAlt: "Boiling Heat Transfer & Immersion Cooling Research",
        },
        smr: {
            kicker: "SMALL MODULAR REACTORS",
            title: "Small Modular Reactors",
            subtitle: "Sustainable Power Generation",
            description:
                "SMRs offer compact, reliable baseload power for hyperscale data centers. Microsoft (835 MW), Google (500 MW), and Meta (1 GW) demand concentrated power that renewables alone cannot supply: three compact SMRs vs. 4,175 hectares of solar panels.",
            stat: { value: "500 MW+", label: "per campus" },
            sourcesLabel: "Complementary Energy Sources",
            sources: [
                { name: "Solar", sub: "Needs intermittency support", highlight: false },
                { name: "Wind", sub: "Baseload limitations", highlight: false },
                { name: "SMR", sub: "24/7 reliable baseload", highlight: true },
            ],
            advantagesLabel: "SMR Advantages",
            advantages: [
                { title: "Passive Safety", desc: "Natural circulation cooling, no external power needed" },
                { title: "Modular Build", desc: "Factory-fabricated, drastically shorter construction" },
                { title: "Land Efficiency", desc: "1/10 footprint of conventional nuclear for same output" },
                { title: "Cogeneration", desc: "Simultaneous electricity and direct heat utilization" },
            ],
            demandLabel: "Big Tech Data Center Power Demand",
            why: "Multiphase flow physics is at the heart of SMR design. Two-phase flow in helical coil steam generators, natural circulation stability, and condensation heat transfer in containment during accidents are all core competencies of MFTEL.",
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
            fig: "FIG. 2.3 — SMR & FLOW STABILITY RESEARCH",
            figAlt: "SMR & Flow Stability Research",
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
        paradox: {
            title: "AI 에너지 패러독스",
            body: "AI 데이터센터의 전력 수요가 빠르게 늘고 있습니다. 대형 언어모델 하나를 학습하는 데 수십 GWh가 들고, 추론 한 건은 기존 검색의 약 10배 전력을 씁니다. 2030년에는 데이터센터가 미국 전력의 9% 가까이, 전 세계 전력의 약 3%를 쓸 것으로 전망됩니다. 전력을 만들고 저장하고 쓰는 모든 단계에서 열이 성능을 좌우합니다. 저희 연구실은 세 연구 분야에서 이 문제를 다룹니다.",
        },
        activitiesLabel: "연구 활동",
        metricSr: "지표",
        tes: {
            kicker: "열에너지 저장",
            title: "카르노 배터리와 열에너지 저장",
            subtitle: "전력망 안정화를 위한 열에너지 저장",
            description:
                "재생에너지 공급은 간헐적이고 데이터센터의 수요는 상시적입니다. 남는 전력을 열로 저장했다가 필요할 때 다시 전기로 바꾸면 화석연료 없이 전력망을 안정시킬 수 있습니다.",
            stat: { value: "24/7", label: "안정적 공급" },
            processLabel: "에너지 변환 과정",
            steps: [
                { label: "남는 재생에너지 전력", sub: "태양광·풍력" },
                { label: "열에너지로 저장", sub: "고온 축열조" },
                { label: "열을 전기로 변환", sub: "열기관 사이클" },
                { label: "데이터센터에 상시 공급", sub: "24시간 안정 전력" },
            ],
            metricsLabel: "핵심 지표",
            metrics: [
                { value: "10+h", label: "저장 시간" },
                { value: "60%+", label: "왕복 효율" },
                { value: "30+yr", label: "설비 수명" },
            ],
            why: "재생에너지의 간헐성은 데이터센터 운영의 큰 과제입니다. 카르노 배터리는 리튬이온 배터리보다 대용량·장기간 저장에 유리하고, 기존 발전소 설비를 다시 쓸 수 있어 경제성과 확장성을 함께 갖춥니다.",
            activities: [
                {
                    title: "직접접촉 잠열 축열 시스템 개발",
                    desc: "상변화물질(PCM)과 열매체를 직접 접촉시켜 간접 방식보다 열전달 효율을 높입니다. 충전·방전 중 PCM이 녹고 굳는 다상유동 현상을 실험으로 규명합니다.",
                    tag: "NRF, 2023–2025",
                },
                {
                    title: "모래 배터리 기반 열에너지 저장",
                    desc: "모래를 고온 축열 매체로 쓰는 특허 기술입니다. 저비용 소재로 대규모 열저장이 가능하며, 저장한 에너지를 꺼내 쓰는 방법까지 포함한 통합 시스템을 개발합니다.",
                    tag: "특허 10-2906225",
                },
                {
                    title: "에너지 공정혁신 융합대학원",
                    desc: "열에너지 저장을 포함한 디지털 기반 에너지 공정혁신 융합대학원 사업에서 열저장 기술 인력을 양성합니다.",
                    tag: "KETEP, 2023–2027",
                },
                {
                    title: "연구소기업 열에너지 저장 개발",
                    desc: "실험실 수준의 열에너지 저장 기술을 창업 기업 수준으로 키워 상용화 가능성을 검증합니다.",
                    tag: "과학기술정보통신부 창업 과제, 2025",
                },
            ],
            fig: "그림 2.1 — 열에너지 저장 연구 요약",
            figAlt: "열에너지 저장 연구 요약",
        },
        immersion: {
            kicker: "AI 반도체 냉각",
            title: "2상 액침 냉각",
            subtitle: "냉각에 드는 에너지를 줄입니다",
            description:
                "2상 액침 냉각은 서버를 절연유체에 직접 담가 식히는 기술입니다. 공냉 설비를 대체하면 냉각 에너지를 최대 90% 줄이고 칩을 더 촘촘히 배치할 수 있습니다.",
            stat: { value: "~90%", label: "냉각 에너지 절감" },
            processLabel: "작동 원리",
            steps: [
                { label: "절연유체 침지", sub: "서버를 절연유체에 직접 담가 열을 전달" },
                { label: "비등 열전달", sub: "유체가 끓으면서 잠열로 많은 열을 흡수" },
                { label: "응축과 순환", sub: "증기가 응축되어 유체가 자연 순환" },
            ],
            comparisonLabel: "공냉과 액침 냉각 비교",
            colAir: "공냉",
            colImmersion: "액침",
            comparison: [
                { label: "전력 효율(PUE)", air: "1.3 – 1.5", immersion: "1.02 – 1.05" },
                { label: "냉각 에너지 비중", air: "30 – 40%", immersion: "2 – 5%" },
                { label: "칩 열유속 한계", air: "~10 W/cm²", immersion: "~200 W/cm²" },
                { label: "서버 밀도", air: "6–8 kW/rack", immersion: "50–100 kW/rack" },
            ],
            why: "AI 가속기(GPU, TPU)의 열설계전력(TDP)이 700 W를 넘으면서 공냉만으로는 식히기 어려워졌습니다. 비등 열전달은 같은 면적에서 공냉의 20배 이상 열을 처리하고, 데이터센터 전력 효율(PUE)을 1.0에 가깝게 낮춥니다.",
            activities: [
                {
                    title: "전기차 배터리 절연유체 비등 냉각",
                    desc: "절연유체의 비등 열전달로 전기차 배터리를 냉각하는 기초 연구입니다. 수냉 방식보다 냉각 성능을 높이고 배터리 팩 전체의 온도를 고르게 유지하는 것이 목표입니다.",
                    tag: "인하대학교, 2025",
                },
                {
                    title: "메탈 폼 기반 비등 열전달 강화",
                    desc: "서브밀리미터급 구리 폼의 기공 크기, 두께, 방향이 비등 열전달에 미치는 영향을 실험으로 규명했습니다. 메탈 폼을 적용하면 임계열유속(CHF)이 최대 3배 이상 높아집니다.",
                    tag: "관련 논문 4편",
                },
                {
                    title: "표면 방향별 임계열유속 의존성",
                    desc: "실리콘과 이산화규소 표면에서 표면 방향과 기포 거동이 임계열유속에 미치는 영향을 분석해, 액침 냉각 설계에 필요한 CHF 예측 모델의 기반을 만들었습니다.",
                    tag: "관련 논문 1편",
                },
                {
                    title: "기체·액체 유로 분리 액침 냉각",
                    desc: "비등할 때 생기는 기체와 액체의 유로를 분리해 기포 간섭을 줄이고 열전달 성능을 높이는 배터리 액침 냉각 특허 기술입니다.",
                    tag: "특허 10-2855737",
                },
            ],
            fig: "그림 2.2 — 비등 열전달 · 액침 냉각 연구",
            figAlt: "비등 열전달 및 액침 냉각 연구",
        },
        smr: {
            kicker: "소형모듈원자로",
            title: "SMR 안전",
            subtitle: "열수력 안전과 유동 안정성",
            description:
                "SMR은 데이터센터처럼 전력 수요가 집중된 곳에 안정적인 기저 전력을 공급할 수 있습니다. Microsoft 835 MW, Google 500 MW, Meta 1 GW 규모의 집중 수요는 재생에너지만으로 감당하기 어렵고, SMR 3기면 태양광 패널 4,175 헥타르를 대체할 수 있습니다.",
            stat: { value: "500 MW+", label: "데이터센터당" },
            sourcesLabel: "에너지원 비교",
            sources: [
                { name: "태양광", sub: "공급이 간헐적", highlight: false },
                { name: "풍력", sub: "기저부하로는 부족", highlight: false },
                { name: "SMR", sub: "24시간 안정적 기저전력", highlight: true },
            ],
            advantagesLabel: "SMR의 장점",
            advantages: [
                { title: "피동안전", desc: "자연순환 냉각으로 외부 전원 없이도 안전 유지" },
                { title: "모듈형 건설", desc: "공장 제작 후 현장 조립으로 건설 기간 단축" },
                { title: "부지 효율", desc: "기존 원전 대비 1/10 부지로 동급 전력 생산" },
                { title: "열병합 가능", desc: "전기 생산과 동시에 열에너지를 직접 활용" },
            ],
            demandLabel: "빅테크 데이터센터의 전력 수요",
            why: "SMR 안전은 다상유동 물리가 핵심입니다. 헬리컬 코일 증기발생기 안의 이상유동, 자연순환 냉각계통의 유동 안정성, 사고 시 격납용기 안의 응축 열전달이 저희 연구실의 핵심 역량과 바로 이어집니다.",
            activities: [
                {
                    title: "노심 안전성 검증 및 다중고장 사고 대응",
                    desc: "강화된 기술기준에 맞춰 노심 안전성을 검증하고, 다중고장 사고에서 안전성을 높이는 기술을 개발합니다. 자연순환 냉각, 이상유동 불안정성, 사고 진행 시나리오 분석을 포함하는 장기 과제입니다.",
                    tag: "NRF, 2022–2029",
                },
                {
                    title: "차세대 SMR 안전 강화 핵심 설계기술",
                    desc: "차세대 SMR의 핵심 설계기술 확보를 위한 글로벌 인력양성 사업입니다. 피동안전계통, 헬리컬 증기발생기 열수력, 격납용기 냉각 등 SMR 고유의 다상유동 현상을 다룰 전문 인력을 양성합니다.",
                    tag: "KETEP, 2024–2025",
                },
                {
                    title: "격납용기 내 응축 열전달 연구",
                    desc: "증기·공기 혼합물에서 비응축성 기체가 응축 열전달에 미치는 영향을 규명했습니다. 수소처럼 가벼운 기체가 열전달을 떨어뜨리는 원리와 기체 층화 현상을 실험으로 분석했습니다.",
                    tag: "관련 논문 3편",
                },
                {
                    title: "원자로 외벽 냉각(ERVC) 해석",
                    desc: "고출력 원자로의 외벽 냉각 열수력을 수치해석하고, CFD 기반 자연순환 유량 추정법으로 ERVC 냉각 한계를 정량 평가했습니다.",
                    tag: "관련 논문 2편",
                },
            ],
            fig: "그림 2.3 — SMR · 유동 안정성 연구",
            figAlt: "SMR 및 유동 안정성 연구",
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
            <div className="mt-6 md:flex md:items-end md:justify-between md:gap-8">
                <div className="max-w-2xl">
                    <h3
                        className={`break-keep text-2xl font-semibold tracking-tight text-ink ${
                            isKR ? "leading-[1.3]" : "leading-[1.2]"
                        }`}
                    >
                        {title}
                    </h3>
                    <p className="mt-1.5 text-base text-ink-2">{subtitle}</p>
                </div>
                <div className="mt-5 shrink-0 md:mt-0 md:text-right">
                    <p className="text-4xl font-semibold leading-none tracking-tight text-ink tabular-nums">
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
                    <p className="text-3xl font-semibold leading-none tracking-tight text-ink tabular-nums md:text-4xl">
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
            <ul className="border-b border-hairline">
                {items.map((a) => (
                    <li
                        key={a.title}
                        className="border-t border-hairline py-4 md:grid md:grid-cols-[1fr_auto] md:items-start md:gap-6"
                    >
                        <div>
                            <h5 className="break-keep text-[15px] font-semibold text-ink">{a.title}</h5>
                            <p
                                className={`mt-1 max-w-3xl break-keep text-sm text-ink-3 ${
                                    isKR ? "leading-[1.75]" : "leading-relaxed"
                                }`}
                            >
                                {a.desc}
                            </p>
                        </div>
                        <span className="mt-2 inline-flex shrink-0 items-center rounded-lg border border-hairline bg-white px-2.5 py-1 md:mt-0.5">
                            <Meta className="text-xs whitespace-nowrap">{a.tag}</Meta>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Figure: intrinsic-ratio collage on white, mono caption. Mobile gets a horizontal scroll floor for legibility. */
function ChapterFigure({
    src,
    alt,
    caption,
    width,
    height,
}: {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
}) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [open]);
    return (
        <figure className="rounded-lg border border-hairline bg-white p-3 md:p-4">
            {/* 그림은 본문 폭으로 보여주고, 클릭하면 화면 폭으로 확대 */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="block w-full cursor-zoom-in overflow-x-auto"
                aria-label={`${caption} — 확대`}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    sizes="(max-width: 768px) 560px, 1056px"
                    className="h-auto w-full min-w-[560px] object-contain md:min-w-0"
                />
            </button>
            <FigCaption className="mt-3 break-keep">{caption}</FigCaption>
            {open ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={caption}
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-coal/95 p-4 md:p-8"
                >
                    <Image
                        src={src}
                        alt={alt}
                        width={width}
                        height={height}
                        sizes="100vw"
                        className="max-h-[92vh] w-auto max-w-[96vw] object-contain"
                    />
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-paper"
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>
            ) : null}
        </figure>
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

            {/* 페이지 리드 — 세 분야를 묶는 문제 제기. 특정 챕터 안이 아니라 섹션 머리에 둔다 */}
            <p className={`max-w-3xl break-keep text-lg text-ink-2 ${lead}`}>
                <span className="font-semibold text-ink">{c.paradox.title} — </span>
                {c.paradox.body}
            </p>

            <div className="mt-14 space-y-16 md:mt-20 md:space-y-24">
                {/* ── 02.1 TES & Carnot Batteries ── */}
                <article>
                    <ChapterHead
                        index="02.1"
                        kicker={c.tes.kicker}
                        title={c.tes.title}
                        subtitle={c.tes.subtitle}
                        stat={c.tes.stat}
                        isKR={isKR}
                    />
                    <p className={`mt-6 max-w-3xl break-keep text-base text-ink-2 ${lead}`}>{c.tes.description}</p>

                    <div className="mt-10">
                        <SubLabel>{c.tes.processLabel}</SubLabel>
                        <StepFlow steps={c.tes.steps} isKR={isKR} />
                    </div>

                    <div className="mt-10">
                        <SubLabel>{c.tes.metricsLabel}</SubLabel>
                        <MetricRow metrics={c.tes.metrics} />
                    </div>

                    <p className={`mt-10 max-w-3xl break-keep border-l-2 border-hairline-2 pl-5 text-base text-ink-2 ${lead}`}>
                        {c.tes.why}
                    </p>

                    <div className="mt-10">
                        <ActivityList label={c.activitiesLabel} items={c.tes.activities} isKR={isKR} />
                    </div>

                    <div className="mt-8">
                        <ChapterFigure
                            src="/images/tes_summary_new.png"
                            alt={c.tes.figAlt}
                            caption={c.tes.fig}
                            width={3466}
                            height={1158}
                        />
                    </div>
                </article>

                {/* ── 02.2 Immersion Cooling ── */}
                <article>
                    <ChapterHead
                        index="02.2"
                        kicker={c.immersion.kicker}
                        title={c.immersion.title}
                        subtitle={c.immersion.subtitle}
                        stat={c.immersion.stat}
                        isKR={isKR}
                    />
                    <p className={`mt-6 max-w-3xl break-keep text-base text-ink-2 ${lead}`}>{c.immersion.description}</p>

                    <div className="mt-10">
                        <SubLabel>{c.immersion.processLabel}</SubLabel>
                        <StepFlow steps={c.immersion.steps} isKR={isKR} />
                    </div>

                    {/* Centerpiece — air vs immersion comparison table */}
                    <div className="mt-10">
                        <SubLabel>{c.immersion.comparisonLabel}</SubLabel>
                        <div className="overflow-x-auto rounded-lg border border-hairline bg-white">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-well">
                                        <th scope="col" className="px-4 py-3 text-left md:px-5">
                                            <span className="sr-only">{c.metricSr}</span>
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right md:px-5">
                                            <Meta className="text-xs font-medium uppercase tracking-[0.08em]">
                                                {c.immersion.colAir}
                                            </Meta>
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right md:px-5">
                                            <Meta className="text-xs font-medium uppercase tracking-[0.08em] text-ember-700">
                                                {c.immersion.colImmersion}
                                            </Meta>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {c.immersion.comparison.map((row) => (
                                        <tr key={row.label} className="border-t border-hairline">
                                            <th
                                                scope="row"
                                                className="break-keep px-4 py-3 text-left text-sm font-medium text-ink-2 md:px-5"
                                            >
                                                {row.label}
                                            </th>
                                            <td className="px-4 py-3 text-right md:px-5">
                                                <Meta className="whitespace-nowrap">{row.air}</Meta>
                                            </td>
                                            <td className="px-4 py-3 text-right md:px-5">
                                                <Meta className="whitespace-nowrap font-medium text-ink">{row.immersion}</Meta>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className={`mt-10 max-w-3xl break-keep border-l-2 border-hairline-2 pl-5 text-base text-ink-2 ${lead}`}>
                        {c.immersion.why}
                    </p>

                    <div className="mt-10">
                        <ActivityList label={c.activitiesLabel} items={c.immersion.activities} isKR={isKR} />
                    </div>

                    <div className="mt-8">
                        <ChapterFigure
                            src="/images/immersion_summary.png"
                            alt={c.immersion.figAlt}
                            caption={c.immersion.fig}
                            width={3468}
                            height={1054}
                        />
                    </div>
                </article>

                {/* ── 02.3 Small Modular Reactors ── */}
                <article>
                    <ChapterHead
                        index="02.3"
                        kicker={c.smr.kicker}
                        title={c.smr.title}
                        subtitle={c.smr.subtitle}
                        stat={c.smr.stat}
                        isKR={isKR}
                    />
                    <p className={`mt-6 max-w-3xl break-keep text-base text-ink-2 ${lead}`}>{c.smr.description}</p>

                    <div className="mt-10">
                        <SubLabel>{c.smr.sourcesLabel}</SubLabel>
                        <div className="grid border-y border-hairline md:grid-cols-3">
                            {c.smr.sources.map((s, i) => (
                                <div
                                    key={s.name}
                                    className={`px-4 py-4 md:px-5 ${
                                        i > 0 ? "border-hairline max-md:border-t md:border-l" : ""
                                    }`}
                                >
                                    <p className={`text-base font-semibold ${s.highlight ? "text-ink" : "text-ink-3"}`}>
                                        {s.name}
                                    </p>
                                    <p className={`mt-0.5 break-keep text-sm ${s.highlight ? "text-ink-2" : "text-ink-3"}`}>
                                        {s.sub}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-10">
                        <SubLabel>{c.smr.advantagesLabel}</SubLabel>
                        <ul className="grid border-b border-hairline md:grid-cols-2 md:gap-x-10">
                            {c.smr.advantages.map((a) => (
                                <li key={a.title} className="border-t border-hairline py-3.5">
                                    <p className="break-keep text-[15px] font-semibold text-ink">{a.title}</p>
                                    <p
                                        className={`mt-0.5 break-keep text-sm text-ink-3 ${
                                            isKR ? "leading-[1.75]" : "leading-relaxed"
                                        }`}
                                    >
                                        {a.desc}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-10">
                        <SubLabel>{c.smr.demandLabel}</SubLabel>
                        <div className="flex flex-wrap gap-2">
                            {COMPANIES.map((co) => (
                                <span
                                    key={co.name}
                                    className="inline-flex items-center rounded-lg border border-hairline bg-white px-3 py-2"
                                >
                                    <Meta className="text-xs uppercase tracking-[0.08em] text-ink-2">
                                        {co.name} · {co.power}
                                    </Meta>
                                </span>
                            ))}
                        </div>
                    </div>

                    <p className={`mt-10 max-w-3xl break-keep border-l-2 border-hairline-2 pl-5 text-base text-ink-2 ${lead}`}>
                        {c.smr.why}
                    </p>

                    <div className="mt-10">
                        <ActivityList label={c.activitiesLabel} items={c.smr.activities} isKR={isKR} />
                    </div>

                    <div className="mt-8">
                        <ChapterFigure
                            src="/images/smr_summary.png"
                            alt={c.smr.figAlt}
                            caption={c.smr.fig}
                            width={3794}
                            height={680}
                        />
                    </div>
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
