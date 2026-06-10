"use client";

import Image from "next/image";
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
            body: "AI was built to optimize efficiency—yet it is paradoxically becoming one of the largest energy consumers on earth. Training a single LLM costs tens of GWh; each inference draws 10× the power of a conventional search. By 2030, data centers will consume 8% of global electricity. The root of this challenge is thermal—multi-phase flow heat transfer is the bottleneck at every stage of power generation, storage, and consumption. MFTEL tackles this barrier on three fronts.",
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
                { value: "↓$/kWh", label: "Cost reduction" },
            ],
            why: "Intermittency of renewables is the greatest challenge for data center operations. Carnot batteries enable large-scale, long-duration storage compared to Li-ion, and can repurpose existing power plant infrastructure—achieving both economic viability and scalability.",
            activities: [
                {
                    title: "Direct-Contact Latent Heat Storage System",
                    desc: "Dramatically improving heat transfer efficiency over indirect methods through direct contact between PCM and heat transfer fluid. Experimentally characterizing multi-phase flow phenomena during PCM melting and solidification in charge/discharge cycles.",
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
            kicker: "IMMERSION COOLING",
            title: "Immersion Cooling",
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
            why: "As AI accelerators (GPUs, TPUs) exceed 700W TDP, air cooling alone cannot keep up. Two-phase boiling heat transfer handles 20x more heat per unit area than air, pushing data center PUE close to 1.0.",
            activities: [
                {
                    title: "EV Battery Immersion Cooling via Boiling",
                    desc: "Fundamental research on electric vehicle battery cooling using insulating fluid boiling heat transfer. Dramatically improving cooling performance over conventional water-cooling while ensuring temperature uniformity at the battery pack level.",
                    tag: "INHA UNIV., 2025",
                },
                {
                    title: "Metal Foam-Enhanced Boiling Heat Transfer",
                    desc: "Systematically characterizing the effects of sub-millimeter copper foam pore size, thickness, and orientation on boiling heat transfer. Experimentally demonstrated that metal foam application increases critical heat flux (CHF) by up to 3x.",
                    tag: "PUB. #1–#4",
                },
                {
                    title: "CHF Dependence on Surface Orientation",
                    desc: "Analyzing the influence of surface orientation and bubble dynamics on critical heat flux over silicon and SiO₂ surfaces. Building predictive CHF modeling foundations essential for immersion cooling system design.",
                    tag: "PUB. #2",
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
                "SMRs offer compact, reliable baseload power for hyperscale data centers. Microsoft (835 MW), Google (500 MW), and Meta (1 GW) demand concentrated power that renewables alone cannot supply—three compact SMRs vs. 4,175 hectares of solar panels.",
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
            why: "Multi-phase flow physics is at the heart of SMR design. Two-phase flow in helical coil steam generators, natural circulation stability, and condensation heat transfer in containment during accidents—all are core competencies of MFTEL.",
            activities: [
                {
                    title: "Core Safety Validation for Multiple-Failure Accidents",
                    desc: "Validating core safety issues against strengthened technical criteria and developing technology to improve core safety during multiple-failure accidents. A long-term flagship project covering natural circulation cooling, two-phase flow instability, and accident progression analysis.",
                    tag: "NRF, 2022–2029",
                },
                {
                    title: "Next-Gen SMR Safety Enhancement Design",
                    desc: "Global human resources training project for securing key design technologies for next-generation SMR safety. Training specialists in passive safety systems, helical steam generator thermal-hydraulics, and containment cooling—all SMR-specific multi-phase flow phenomena.",
                    tag: "KETEP, 2024–2025",
                },
                {
                    title: "Containment Condensation Heat Transfer",
                    desc: "Characterizing the effect of noncondensable gases on condensation heat transfer in steam-air mixtures. Experimentally analyzed heat transfer degradation mechanisms by light noncondensable gas (hydrogen) and gas stratification phenomena.",
                    tag: "PUB. #5, #8, #12",
                },
                {
                    title: "External Reactor Vessel Cooling (ERVC)",
                    desc: "Numerically evaluating thermal-hydraulic characteristics of ERVC in high-power reactors. Developed CFD-aided natural circulation flow rate estimation to quantitatively assess ERVC coolability limits.",
                    tag: "PUB. #7, #9",
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
            title: "AI 에너지 패러독스",
            body: "AI는 효율을 위해 탄생했지만, 역설적으로 최대 에너지 소비원이 되어가고 있습니다. 단일 LLM 학습에 수십 GWh가 소모되고, 추론 한 건은 기존 검색의 10배 전력을 소비합니다. 2030년까지 데이터센터 전력은 전 세계 공급의 8%에 도달할 전망입니다. 이 문제의 본질은 열(熱)—전력의 생산·저장·소비 전 단계에서 다상유동 열전달이 핵심 병목이며, MFTEL은 세 가지 축으로 이 장벽에 도전합니다.",
        },
        activitiesLabel: "MFTEL 연구 활동",
        metricSr: "지표",
        tes: {
            kicker: "열에너지 저장",
            title: "TES & 카르노 배터리",
            subtitle: "열에너지 저장을 통한 전력망 안정화",
            description:
                "열에너지 저장 기술은 간헐적인 재생에너지 공급과 데이터센터의 상시 전력 수요 사이의 격차를 해소합니다. 잉여 에너지를 열로 저장하고 필요 시 전기로 변환하여 화석연료 없이 전력망 안정성을 보장합니다.",
            stat: { value: "24/7", label: "안정적 공급" },
            processLabel: "에너지 변환 프로세스",
            steps: [
                { label: "재생에너지 잉여전력", sub: "태양광 / 풍력" },
                { label: "열에너지로 저장", sub: "고온 축열조" },
                { label: "열→전기 변환", sub: "히트엔진 사이클" },
                { label: "안정적 전력 공급", sub: "24/7 데이터센터" },
            ],
            metricsLabel: "핵심 지표",
            metrics: [
                { value: "10+h", label: "저장 지속시간" },
                { value: "60%+", label: "왕복 효율" },
                { value: "30+yr", label: "설비 수명" },
                { value: "₩↓", label: "kWh당 비용 절감" },
            ],
            why: "재생에너지의 간헐성은 데이터센터 운영의 가장 큰 도전입니다. 카르노 배터리는 리튬이온 배터리 대비 대용량·장기간 저장이 가능하며, 기존 발전소 인프라를 재활용할 수 있어 경제성과 확장성을 동시에 확보합니다.",
            activities: [
                {
                    title: "직접접촉 잠열 축열 시스템 개발",
                    desc: "상변화물질(PCM)과 열매체의 직접접촉을 통해 기존 간접 방식 대비 열전달 효율을 획기적으로 향상. 충전/방전 시 PCM의 용융·응고 과정에서의 다상유동 현상을 실험적으로 규명합니다.",
                    tag: "NRF, 2023–2025",
                },
                {
                    title: "샌드 배터리 기반 열에너지 저장",
                    desc: "모래를 고온 축열 매체로 활용하는 새로운 개념의 샌드 배터리 특허 기술. 저비용 소재로 대규모 열저장이 가능하며, 에너지 추출 방법론까지 포함하는 통합 시스템을 개발합니다.",
                    tag: "특허 10-2906225",
                },
                {
                    title: "지속가능 에너지 프로세스 혁신",
                    desc: "열에너지 저장을 포함한 디지털 기반 에너지 프로세스 혁신 융합 대학원 프로그램을 통해 차세대 열저장 기술 인력을 양성합니다.",
                    tag: "KETEP, 2023–2027",
                },
                {
                    title: "연구소기업 열에너지 저장 개발",
                    desc: "실험실 수준의 열에너지 저장 기술을 스타트업 수준으로 스케일업하여 상용화 가능성을 검증하는 프로젝트를 수행합니다.",
                    tag: "과기부 스타트업, 2025",
                },
            ],
            fig: "FIG. 2.1 — 열에너지 저장 연구 요약",
            figAlt: "열에너지 저장 연구 요약",
        },
        immersion: {
            kicker: "이머전 쿨링",
            title: "이머전 쿨링",
            subtitle: "냉각 에너지 소비 절감",
            description:
                "이상(二相) 이머전 쿨링은 기존 공냉 인프라를 대체하여 냉각 에너지를 최대 90%까지 절감합니다. 절연 유체와의 직접 접촉으로 칩 밀도를 높이고, 프로세서 단에서의 열적 병목을 제거합니다.",
            stat: { value: "~90%", label: "냉각 에너지 절감" },
            processLabel: "작동 원리",
            steps: [
                { label: "절연 유체 침지", sub: "서버를 유전체 유체에 직접 담가 열 전달" },
                { label: "이상 비등 열전달", sub: "유체가 끓으면서 잠열로 대량의 열을 흡수" },
                { label: "응축 & 순환", sub: "증기가 응축기에서 냉각, 유체 자연 순환" },
            ],
            comparisonLabel: "공냉 vs 이머전 쿨링",
            colAir: "공냉",
            colImmersion: "이머전",
            comparison: [
                { label: "에너지 효율 (PUE)", air: "1.3 – 1.5", immersion: "1.02 – 1.05" },
                { label: "냉각 에너지 비중", air: "30 – 40%", immersion: "2 – 5%" },
                { label: "칩 열유속 한계", air: "~10 W/cm²", immersion: "~200 W/cm²" },
                { label: "서버 밀도", air: "6–8 kW/rack", immersion: "50–100 kW/rack" },
            ],
            why: "AI 가속기(GPU, TPU)의 열설계전력(TDP)이 700W를 넘어서면서 공냉만으로는 냉각이 불가능합니다. 이상 비등 열전달은 같은 면적에서 공냉 대비 20배 이상의 열을 처리하며, 데이터센터의 전력 효율(PUE)을 1.0에 근접시킵니다.",
            activities: [
                {
                    title: "전기차 배터리 절연유체 비등 냉각",
                    desc: "절연 유체의 비등 열전달을 이용한 전기차 배터리 냉각 기초 연구. 기존 수냉 방식 대비 냉각 성능을 획기적으로 개선하고, 배터리 팩 레벨에서의 온도 균일성을 확보합니다.",
                    tag: "인하대, 2025",
                },
                {
                    title: "금속 폼 기반 비등 열전달 강화",
                    desc: "서브밀리미터급 구리 폼의 기공 크기·두께·방향이 비등 열전달에 미치는 영향을 체계적으로 규명. 금속 폼 적용 시 임계열유속(CHF)이 최대 3배 이상 증가함을 실험적으로 입증했습니다.",
                    tag: "논문 #1–#4",
                },
                {
                    title: "표면 방향별 임계열유속 의존성",
                    desc: "실리콘 및 이산화실리콘 표면에서 표면 방향과 기포 동역학이 임계열유속에 미치는 영향을 분석. 이머전 쿨링 시스템 설계에 필수적인 CHF 예측 모델링 기반을 구축합니다.",
                    tag: "논문 #2",
                },
                {
                    title: "기-액 유로 분리 이머전 쿨링 특허",
                    desc: "비등 시 발생하는 기체와 액체의 유로를 물리적으로 분리하여 열전달 성능을 극대화하는 배터리 이머전 쿨링 시스템 특허 기술. 기포 간섭을 방지하여 안정적인 냉각을 보장합니다.",
                    tag: "특허 10-2855737",
                },
            ],
            fig: "FIG. 2.2 — 비등 열전달 · 이머전 쿨링 연구",
            figAlt: "비등 열전달 및 이머전 쿨링 연구",
        },
        smr: {
            kicker: "소형 모듈 원자로",
            title: "소형 모듈 원자로 (SMR)",
            subtitle: "지속가능한 전력 생산",
            description:
                "SMR은 하이퍼스케일 데이터센터에 안정적인 기저 전력을 공급합니다. Microsoft (835 MW), Google (500 MW), Meta (1 GW) 수준의 집중 전력은 재생에너지만으로는 불가능하며, SMR 3기면 태양광 패널 4,175 헥타르를 대체할 수 있습니다.",
            stat: { value: "500 MW+", label: "캠퍼스당" },
            sourcesLabel: "에너지원 상호보완",
            sources: [
                { name: "태양광", sub: "간헐성 보완 필요", highlight: false },
                { name: "풍력", sub: "기저부하 한계", highlight: false },
                { name: "SMR", sub: "24/7 안정적 기저전력", highlight: true },
            ],
            advantagesLabel: "SMR 핵심 장점",
            advantages: [
                { title: "패시브 안전", desc: "자연순환 냉각으로 외부 전원 없이도 안전 유지" },
                { title: "모듈형 건설", desc: "공장 제작 후 현장 조립, 건설 기간 대폭 단축" },
                { title: "부지 효율", desc: "기존 원전 대비 1/10 부지로 동급 전력 생산" },
                { title: "열병합 가능", desc: "전기 생산과 동시에 열에너지를 직접 활용" },
            ],
            demandLabel: "빅테크 데이터센터 전력 수요",
            why: "SMR은 다상유동 물리학이 핵심입니다. 헬리컬 코일 증기발생기 내부의 이상(二相) 유동, 자연순환 냉각계통의 단상/이상 유동 안정성, 사고 시 격납용기 내 응축 열전달 등 MFTEL의 핵심 연구역량이 직결됩니다.",
            activities: [
                {
                    title: "노심 안전성 검증 및 다중고장 사고 대응",
                    desc: "강화된 기술기준에 대응하여 노심 안전 이슈를 검증하고, 다중고장 사고 시 노심 안전성 향상 기술을 개발합니다. 자연순환 냉각, 이상유동 불안정성, 사고 진행 시나리오 분석을 포함하는 장기 핵심 과제입니다.",
                    tag: "NRF, 2022–2029",
                },
                {
                    title: "차세대 SMR 안전 강화 핵심 설계기술",
                    desc: "차세대 SMR의 주요 설계기술 확보를 위한 글로벌 인력양성 프로젝트. 패시브 안전계통, 헬리컬 증기발생기 열수력, 격납용기 냉각 등 SMR 고유 다상유동 현상에 대한 전문 인력을 양성합니다.",
                    tag: "KETEP, 2024–2025",
                },
                {
                    title: "격납용기 내 응축 열전달 연구",
                    desc: "증기-공기 혼합물에서 비응축성 기체가 응축 열전달에 미치는 영향을 규명. 경량 비응축성 기체(수소)에 의한 열전달 저하 메커니즘과 기체 층화 현상을 실험적으로 분석했습니다.",
                    tag: "논문 #5, #8, #12",
                },
                {
                    title: "원자로 외벽 냉각(ERVC) 해석",
                    desc: "고출력 원자로의 외부 원자로 용기 냉각 열수력 특성을 수치적으로 해석. CFD 기반 자연순환 유량 추정법을 개발하여 ERVC 냉각 한계를 정량적으로 평가합니다.",
                    tag: "논문 #7, #9",
                },
            ],
            fig: "FIG. 2.3 — SMR · 유동 안정성 연구",
            figAlt: "SMR 및 유동 안정성 연구",
        },
        methodsKicker: "연구 방법",
        experimentsLabel: "실험 연구",
        experiments: [
            "이상유동 불안정성",
            "풀 비등 열전달",
            "유동 비등 열전달",
            "열적 마진 시험",
            "절연유체",
            "Leidenfrost 효과",
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
        collabKicker: "공동 연구 기관",
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
        <div className="grid grid-cols-2 border-y border-hairline md:grid-cols-4">
            {metrics.map((m, i) => (
                <div
                    key={m.label}
                    className={`px-4 py-5 md:px-5 ${i > 0 ? "border-l border-hairline" : ""} ${
                        i === 2 ? "max-md:border-l-0 max-md:border-t" : ""
                    } ${i === 3 ? "max-md:border-t" : ""}`}
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
    return (
        <figure className="rounded-lg border border-hairline bg-white p-3 md:p-4">
            <div className="overflow-x-auto">
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    sizes="(max-width: 768px) 560px, 1056px"
                    className="h-auto w-full min-w-[560px] object-contain md:min-w-0"
                />
            </div>
            <FigCaption className="mt-3">{caption}</FigCaption>
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
        <div className="grid border-t border-hairline py-4 md:grid-cols-[200px_1fr] md:gap-6">
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

            <div className="space-y-16 md:space-y-24">
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
                    {/* AI Energy Paradox — chapter 01 lead-in, body-lg */}
                    <p className={`mt-6 max-w-3xl break-keep text-lg text-ink-2 ${lead}`}>
                        <span className="font-semibold text-ink">{c.paradox.title} — </span>
                        {c.paradox.body}
                    </p>
                    <p className={`mt-4 max-w-3xl break-keep text-base text-ink-2 ${lead}`}>{c.tes.description}</p>

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
                                {c.experiments.join(" · ")}
                            </LabeledRow>
                            <LabeledRow label={c.computationalLabel} isKR={isKR}>
                                {c.computational.join(" · ")}
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
