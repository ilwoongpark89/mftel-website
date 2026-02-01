"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/ui/section";
import { useLanguage } from "@/lib/LanguageContext";
import { Cpu, Zap, Server, ArrowRight, ArrowDown, Atom, Battery, Droplets, Flame, Snowflake, ThermometerSun, Wind, Factory, Sun, ChevronRight, FlaskConical, Microscope, Shield, Waves, Beaker, Target } from "lucide-react";

// ─── Pillar Data ───

const pillarsEN = [
    {
        icon: Flame,
        label: "Pillar 1",
        title: "TES & Carnot Batteries",
        subtitle: "Grid Stability via Thermal Energy Storage",
        description: "Thermal energy storage bridges the gap between intermittent renewable supply and constant data center demand. By storing excess energy as heat and converting it back to electricity on demand, Carnot batteries ensure grid stability without fossil backup.",
        color: "rose",
        stats: "24/7",
        statsLabel: "stable supply",
    },
    {
        icon: Droplets,
        label: "Pillar 2",
        title: "Immersion Cooling",
        subtitle: "Reducing Cooling Energy Consumption",
        description: "Two-phase immersion cooling eliminates the need for traditional air cooling infrastructure, reducing cooling energy by up to 90%. Direct contact with dielectric fluid enables higher chip densities and removes the thermal bottleneck at the processor level.",
        color: "sky",
        stats: "~90%",
        statsLabel: "cooling energy saved",
    },
    {
        icon: Atom,
        label: "Pillar 3",
        title: "Small Modular Reactors",
        subtitle: "Sustainable Power Generation",
        description: "SMRs offer compact, reliable baseload power for hyperscale data centers. Microsoft (835 MW), Google (500 MW), and Meta (1 GW) demand concentrated power that renewables alone cannot supply—three compact SMRs vs. 4,175 hectares of solar panels.",
        color: "amber",
        stats: "500 MW+",
        statsLabel: "per campus",
    },
];

const pillarsKR = [
    {
        icon: Flame,
        label: "Pillar 1",
        title: "TES & 카르노 배터리",
        subtitle: "열에너지 저장을 통한 전력망 안정화",
        description: "열에너지 저장 기술은 간헐적인 재생에너지 공급과 데이터센터의 상시 전력 수요 사이의 격차를 해소합니다. 잉여 에너지를 열로 저장하고 필요 시 전기로 변환하여 화석연료 없이 전력망 안정성을 보장합니다.",
        color: "rose",
        stats: "24/7",
        statsLabel: "안정적 공급",
    },
    {
        icon: Droplets,
        label: "Pillar 2",
        title: "이머전 쿨링",
        subtitle: "냉각 에너지 소비 절감",
        description: "이상(二相) 이머전 쿨링은 기존 공냉 인프라를 대체하여 냉각 에너지를 최대 90%까지 절감합니다. 절연 유체와의 직접 접촉으로 칩 밀도를 높이고, 프로세서 단에서의 열적 병목을 제거합니다.",
        color: "sky",
        stats: "~90%",
        statsLabel: "냉각 에너지 절감",
    },
    {
        icon: Atom,
        label: "Pillar 3",
        title: "소형 모듈 원자로 (SMR)",
        subtitle: "지속가능한 전력 생산",
        description: "SMR은 하이퍼스케일 데이터센터에 안정적인 기저 전력을 공급합니다. Microsoft (835 MW), Google (500 MW), Meta (1 GW) 수준의 집중 전력은 재생에너지만으로는 불가능하며, SMR 3기면 태양광 패널 4,175 헥타르를 대체할 수 있습니다.",
        color: "amber",
        stats: "500 MW+",
        statsLabel: "캠퍼스당",
    },
];

// ─── Pillar Detail Components ───

function CarnotDetail({ language }: { language: string }) {
    const isKR = language === "KR";
    const steps = isKR
        ? [
            { icon: Sun, label: "재생에너지 잉여전력", sub: "태양광 / 풍력" },
            { icon: ThermometerSun, label: "열에너지로 저장", sub: "고온 축열조" },
            { icon: Flame, label: "열→전기 변환", sub: "히트엔진 사이클" },
            { icon: Zap, label: "안정적 전력 공급", sub: "24/7 데이터센터" },
        ]
        : [
            { icon: Sun, label: "Excess Renewable", sub: "Solar / Wind surplus" },
            { icon: ThermometerSun, label: "Store as Heat", sub: "High-temp thermal tank" },
            { icon: Flame, label: "Heat → Electricity", sub: "Heat engine cycle" },
            { icon: Zap, label: "Stable Power", sub: "24/7 data center supply" },
        ];

    const metrics = isKR
        ? [
            { value: "10+h", label: "저장 지속시간" },
            { value: "60%+", label: "왕복 효율" },
            { value: "30+yr", label: "설비 수명" },
            { value: "₩↓", label: "kWh당 비용 절감" },
        ]
        : [
            { value: "10+h", label: "Storage duration" },
            { value: "60%+", label: "Round-trip efficiency" },
            { value: "30+yr", label: "Plant lifetime" },
            { value: "↓$/kWh", label: "Cost reduction" },
        ];

    return (
        <div className="space-y-5">
            {/* Process Flow */}
            <div>
                <h5 className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-4">
                    {isKR ? "에너지 변환 프로세스" : "Energy Conversion Process"}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
                    {steps.map((step, i) => (
                        <div key={i} className="bg-rose-50 rounded-xl p-4 text-center border border-rose-100 relative">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                                <step.icon className="w-5 h-5 text-rose-600" />
                            </div>
                            <div className="text-sm font-semibold text-gray-900">{step.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{step.sub}</div>
                            {i < steps.length - 1 && (
                                <ArrowRight className="w-5 h-5 text-rose-400 absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block z-10" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div>
                <h5 className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-4">
                    {isKR ? "핵심 지표" : "Key Metrics"}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 text-center border border-gray-100">
                            <div className="text-2xl font-bold text-rose-600">{m.value}</div>
                            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Why it matters */}
            <div className="bg-rose-50/50 rounded-xl p-5 border border-rose-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                    {isKR
                        ? "재생에너지의 간헐성은 데이터센터 운영의 가장 큰 도전입니다. 카르노 배터리는 리튬이온 배터리 대비 대용량·장기간 저장이 가능하며, 기존 발전소 인프라를 재활용할 수 있어 경제성과 확장성을 동시에 확보합니다."
                        : "Intermittency of renewables is the greatest challenge for data center operations. Carnot batteries enable large-scale, long-duration storage compared to Li-ion, and can repurpose existing power plant infrastructure—achieving both economic viability and scalability."}
                </p>
            </div>

            {/* MFTEL Research */}
            <div>
                <h5 className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    {isKR ? "MFTEL 연구 활동" : "MFTEL Research Activities"}
                </h5>
                <div className="space-y-4">
                    {(isKR ? [
                        { icon: Beaker, title: "직접접촉 잠열 축열 시스템 개발", desc: "상변화물질(PCM)과 열매체의 직접접촉을 통해 기존 간접 방식 대비 열전달 효율을 획기적으로 향상. 충전/방전 시 PCM의 용융·응고 과정에서의 다상유동 현상을 실험적으로 규명합니다.", tag: "NRF, 2023–2025" },
                        { icon: Target, title: "샌드 배터리 기반 열에너지 저장", desc: "모래를 고온 축열 매체로 활용하는 새로운 개념의 샌드 배터리 특허 기술. 저비용 소재로 대규모 열저장이 가능하며, 에너지 추출 방법론까지 포함하는 통합 시스템을 개발합니다.", tag: "특허 10-2906225" },
                        { icon: Waves, title: "지속가능 에너지 프로세스 혁신", desc: "열에너지 저장을 포함한 디지털 기반 에너지 프로세스 혁신 융합 대학원 프로그램을 통해 차세대 열저장 기술 인력을 양성합니다.", tag: "KETEP, 2023–2027" },
                        { icon: Flame, title: "연구소기업 열에너지 저장 개발", desc: "실험실 수준의 열에너지 저장 기술을 스타트업 수준으로 스케일업하여 상용화 가능성을 검증하는 프로젝트를 수행합니다.", tag: "과기부 스타트업, 2025" },
                    ] : [
                        { icon: Beaker, title: "Direct-Contact Latent Heat Storage System", desc: "Dramatically improving heat transfer efficiency over indirect methods through direct contact between PCM and heat transfer fluid. Experimentally characterizing multi-phase flow phenomena during PCM melting and solidification in charge/discharge cycles.", tag: "NRF, 2023–2025" },
                        { icon: Target, title: "Sand Battery Thermal Energy Storage", desc: "A novel patented sand battery concept using sand as a high-temperature thermal storage medium. Enables large-scale heat storage with low-cost materials, with an integrated system including energy extraction methodology.", tag: "Patent 10-2906225" },
                        { icon: Waves, title: "Sustainable Energy Process Innovation", desc: "Cultivating next-generation thermal storage talent through the Digital-Based Sustainable Energy Process Innovation Convergence Graduate School program.", tag: "KETEP, 2023–2027" },
                        { icon: Flame, title: "Lab-to-Startup TES Development", desc: "Scaling up laboratory-level thermal energy storage technology to startup level, validating commercialization potential through prototype development and testing.", tag: "MSIT Startup, 2025" },
                    ]).map((item, i) => (
                        <div key={i} className="flex gap-4 items-start bg-white rounded-xl p-4 border border-gray-100">
                            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <item.icon className="w-4.5 h-4.5 text-rose-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                                    <span className="text-[10px] font-medium bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{item.tag}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Research Visuals */}
            <div>
                <h5 className="text-sm font-semibold text-rose-600 uppercase tracking-wider mb-3">
                    {isKR ? "연구 시각 자료" : "Research Visuals"}
                </h5>
                <div className="rounded-xl overflow-hidden bg-black">
                    <div className="relative w-full" style={{ paddingBottom: "33.4%" }}>
                        <Image
                            src="/images/tes_summary_new.png"
                            alt={isKR ? "열에너지 저장 연구 요약" : "TES Research Summary"}
                            fill
                            className="object-cover object-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ImmersionDetail({ language }: { language: string }) {
    const isKR = language === "KR";

    const comparison = isKR
        ? [
            { label: "에너지 효율 (PUE)", air: "1.3 – 1.5", immersion: "1.02 – 1.05", better: true },
            { label: "냉각 에너지 비중", air: "30 – 40%", immersion: "2 – 5%", better: true },
            { label: "칩 열유속 한계", air: "~10 W/cm²", immersion: "~200 W/cm²", better: true },
            { label: "서버 밀도", air: "6–8 kW/rack", immersion: "50–100 kW/rack", better: true },
        ]
        : [
            { label: "Energy Efficiency (PUE)", air: "1.3 – 1.5", immersion: "1.02 – 1.05", better: true },
            { label: "Cooling Energy Share", air: "30 – 40%", immersion: "2 – 5%", better: true },
            { label: "Chip Heat Flux Limit", air: "~10 W/cm²", immersion: "~200 W/cm²", better: true },
            { label: "Server Density", air: "6–8 kW/rack", immersion: "50–100 kW/rack", better: true },
        ];

    const phases = isKR
        ? [
            { icon: Droplets, title: "절연 유체 침지", desc: "서버를 유전체 유체에 직접 담가 열 전달" },
            { icon: ThermometerSun, title: "이상 비등 열전달", desc: "유체가 끓으면서 잠열로 대량의 열을 흡수" },
            { icon: Snowflake, title: "응축 & 순환", desc: "증기가 응축기에서 냉각, 유체 자연 순환" },
        ]
        : [
            { icon: Droplets, title: "Fluid Submersion", desc: "Servers submerged in dielectric fluid" },
            { icon: ThermometerSun, title: "Two-Phase Boiling", desc: "Fluid boils, absorbing massive heat via latent heat" },
            { icon: Snowflake, title: "Condense & Recirculate", desc: "Vapor condenses, natural circulation loop" },
        ];

    return (
        <div className="space-y-5">
            {/* How it works */}
            <div>
                <h5 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4">
                    {isKR ? "작동 원리" : "How It Works"}
                </h5>
                <div className="grid md:grid-cols-3 gap-4">
                    {phases.map((p, i) => (
                        <div key={i} className="bg-sky-50 rounded-xl p-5 border border-sky-100 relative">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
                                    {i + 1}
                                </div>
                                <p.icon className="w-5 h-5 text-sky-500" />
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mb-1">{p.title}</div>
                            <div className="text-xs text-gray-600">{p.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Table */}
            <div>
                <h5 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4">
                    {isKR ? "공냉 vs 이머전 쿨링" : "Air Cooling vs Immersion Cooling"}
                </h5>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                        <div className="p-3 text-gray-500"></div>
                        <div className="p-3 text-gray-500 text-center flex items-center justify-center gap-1.5">
                            <Wind className="w-3.5 h-3.5" />
                            {isKR ? "공냉" : "Air"}
                        </div>
                        <div className="p-3 text-sky-600 text-center flex items-center justify-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5" />
                            {isKR ? "이머전" : "Immersion"}
                        </div>
                    </div>
                    {comparison.map((row, i) => (
                        <div key={i} className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
                            <div className="p-3 text-sm text-gray-700 font-medium">{row.label}</div>
                            <div className="p-3 text-sm text-gray-400 text-center">{row.air}</div>
                            <div className="p-3 text-sm text-sky-700 text-center font-semibold">{row.immersion}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-sky-50/50 rounded-xl p-5 border border-sky-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                    {isKR
                        ? "AI 가속기(GPU, TPU)의 열설계전력(TDP)이 700W를 넘어서면서 공냉만으로는 냉각이 불가능합니다. 이상 비등 열전달은 같은 면적에서 공냉 대비 20배 이상의 열을 처리하며, 데이터센터의 전력 효율(PUE)을 1.0에 근접시킵니다."
                        : "As AI accelerators (GPUs, TPUs) exceed 700W TDP, air cooling alone cannot keep up. Two-phase boiling heat transfer handles 20x more heat per unit area than air, pushing data center PUE close to 1.0."}
                </p>
            </div>

            {/* MFTEL Research */}
            <div>
                <h5 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    {isKR ? "MFTEL 연구 활동" : "MFTEL Research Activities"}
                </h5>
                <div className="space-y-4">
                    {(isKR ? [
                        { icon: Beaker, title: "전기차 배터리 절연유체 비등 냉각", desc: "절연 유체의 비등 열전달을 이용한 전기차 배터리 냉각 기초 연구. 기존 수냉 방식 대비 냉각 성능을 획기적으로 개선하고, 배터리 팩 레벨에서의 온도 균일성을 확보합니다.", tag: "인하대, 2025" },
                        { icon: Microscope, title: "금속 폼 기반 비등 열전달 강화", desc: "서브밀리미터급 구리 폼의 기공 크기·두께·방향이 비등 열전달에 미치는 영향을 체계적으로 규명. 금속 폼 적용 시 임계열유속(CHF)이 최대 3배 이상 증가함을 실험적으로 입증했습니다.", tag: "논문 #1–#4" },
                        { icon: Target, title: "표면 방향별 임계열유속 의존성", desc: "실리콘 및 이산화실리콘 표면에서 표면 방향과 기포 동역학이 임계열유속에 미치는 영향을 분석. 이머전 쿨링 시스템 설계에 필수적인 CHF 예측 모델링 기반을 구축합니다.", tag: "논문 #2" },
                        { icon: Waves, title: "기-액 유로 분리 이머전 쿨링 특허", desc: "비등 시 발생하는 기체와 액체의 유로를 물리적으로 분리하여 열전달 성능을 극대화하는 배터리 이머전 쿨링 시스템 특허 기술. 기포 간섭을 방지하여 안정적인 냉각을 보장합니다.", tag: "특허 10-2855737" },
                    ] : [
                        { icon: Beaker, title: "EV Battery Immersion Cooling via Boiling", desc: "Fundamental research on electric vehicle battery cooling using insulating fluid boiling heat transfer. Dramatically improving cooling performance over conventional water-cooling while ensuring temperature uniformity at the battery pack level.", tag: "Inha Univ., 2025" },
                        { icon: Microscope, title: "Metal Foam-Enhanced Boiling Heat Transfer", desc: "Systematically characterizing the effects of sub-millimeter copper foam pore size, thickness, and orientation on boiling heat transfer. Experimentally demonstrated that metal foam application increases critical heat flux (CHF) by up to 3x.", tag: "Pub. #1–#4" },
                        { icon: Target, title: "CHF Dependence on Surface Orientation", desc: "Analyzing the influence of surface orientation and bubble dynamics on critical heat flux over silicon and SiO₂ surfaces. Building predictive CHF modeling foundations essential for immersion cooling system design.", tag: "Pub. #2" },
                        { icon: Waves, title: "Gas-Liquid Flow Path Separation Patent", desc: "Patented battery immersion cooling system that physically separates gas and liquid flow paths during boiling, maximizing heat transfer performance. Prevents bubble interference to ensure stable cooling operation.", tag: "Patent 10-2855737" },
                    ]).map((item, i) => (
                        <div key={i} className="flex gap-4 items-start bg-white rounded-xl p-4 border border-gray-100">
                            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <item.icon className="w-4.5 h-4.5 text-sky-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                                    <span className="text-[10px] font-medium bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">{item.tag}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Research Visuals */}
            <div>
                <h5 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-3">
                    {isKR ? "연구 시각 자료" : "Research Visuals"}
                </h5>
                <div className="rounded-xl overflow-hidden bg-black">
                    <div className="relative w-full" style={{ paddingBottom: "30.4%" }}>
                        <Image
                            src="/images/immersion_summary.png"
                            alt={isKR ? "비등 열전달 및 이머전 쿨링 연구" : "Boiling Heat Transfer & Immersion Cooling Research"}
                            fill
                            className="object-cover object-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SMRDetail({ language }: { language: string }) {
    const isKR = language === "KR";

    const scaleItems = isKR
        ? [
            { icon: Sun, value: "태양광", sub: "간헐성 보완 필요", highlight: false },
            { icon: Wind, value: "풍력", sub: "기저부하 한계", highlight: false },
            { icon: Atom, value: "SMR", sub: "24/7 안정적 기저전력", highlight: true },
        ]
        : [
            { icon: Sun, value: "Solar", sub: "Needs intermittency support", highlight: false },
            { icon: Wind, value: "Wind", sub: "Baseload limitations", highlight: false },
            { icon: Atom, value: "SMR", sub: "24/7 reliable baseload", highlight: true },
        ];

    const advantages = isKR
        ? [
            { title: "패시브 안전", desc: "자연순환 냉각으로 외부 전원 없이도 안전 유지" },
            { title: "모듈형 건설", desc: "공장 제작 후 현장 조립, 건설 기간 대폭 단축" },
            { title: "부지 효율", desc: "기존 원전 대비 1/10 부지로 동급 전력 생산" },
            { title: "열병합 가능", desc: "전기 생산과 동시에 열에너지를 직접 활용" },
        ]
        : [
            { title: "Passive Safety", desc: "Natural circulation cooling, no external power needed" },
            { title: "Modular Build", desc: "Factory-fabricated, drastically shorter construction" },
            { title: "Land Efficiency", desc: "1/10 footprint of conventional nuclear for same output" },
            { title: "Cogeneration", desc: "Simultaneous electricity and direct heat utilization" },
        ];

    const companies = [
        { name: "Microsoft", power: "835 MW" },
        { name: "Google", power: "500 MW" },
        { name: "Meta", power: "1 GW" },
        { name: "Amazon", power: "1+ GW" },
    ];

    return (
        <div className="space-y-5">
            {/* Scale Comparison */}
            <div>
                <h5 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-4">
                    {isKR ? "에너지원 상호보완" : "Complementary Energy Sources"}
                </h5>
                <div className="grid md:grid-cols-3 gap-4">
                    {scaleItems.map((item, i) => (
                        <div
                            key={i}
                            className={`rounded-xl p-5 text-center border ${
                                item.highlight
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-gray-50 border-gray-100"
                            }`}
                        >
                            <item.icon className={`w-8 h-8 mx-auto mb-3 ${item.highlight ? "text-amber-500" : "text-gray-400"}`} />
                            <div className={`text-xl font-bold ${item.highlight ? "text-amber-600" : "text-gray-600"}`}>
                                {item.value}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{item.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Advantages Grid */}
            <div>
                <h5 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-4">
                    {isKR ? "SMR 핵심 장점" : "SMR Advantages"}
                </h5>
                <div className="grid grid-cols-2 gap-3">
                    {advantages.map((adv, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                            <div className="text-sm font-semibold text-gray-900 mb-1">{adv.title}</div>
                            <div className="text-xs text-gray-500">{adv.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Big Tech Demand */}
            <div>
                <h5 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-4">
                    {isKR ? "빅테크 데이터센터 전력 수요" : "Big Tech Data Center Power Demand"}
                </h5>
                <div className="flex gap-3 flex-wrap">
                    {companies.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2 border border-amber-100">
                            <Factory className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                            <span className="text-xs text-amber-600 font-bold">{c.power}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                <p className="text-sm text-gray-700 leading-relaxed">
                    {isKR
                        ? "SMR은 다상유동 물리학이 핵심입니다. 헬리컬 코일 증기발생기 내부의 이상(二相) 유동, 자연순환 냉각계통의 단상/이상 유동 안정성, 사고 시 격납용기 내 응축 열전달 등 MFTEL의 핵심 연구역량이 직결됩니다."
                        : "Multi-phase flow physics is at the heart of SMR design. Two-phase flow in helical coil steam generators, natural circulation stability, and condensation heat transfer in containment during accidents—all are core competencies of MFTEL."}
                </p>
            </div>

            {/* MFTEL Research */}
            <div>
                <h5 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    {isKR ? "MFTEL 연구 활동" : "MFTEL Research Activities"}
                </h5>
                <div className="space-y-4">
                    {(isKR ? [
                        { icon: Shield, title: "노심 안전성 검증 및 다중고장 사고 대응", desc: "강화된 기술기준에 대응하여 노심 안전 이슈를 검증하고, 다중고장 사고 시 노심 안전성 향상 기술을 개발합니다. 자연순환 냉각, 이상유동 불안정성, 사고 진행 시나리오 분석을 포함하는 장기 핵심 과제입니다.", tag: "NRF, 2022–2029" },
                        { icon: Atom, title: "차세대 SMR 안전 강화 핵심 설계기술", desc: "차세대 SMR의 주요 설계기술 확보를 위한 글로벌 인력양성 프로젝트. 패시브 안전계통, 헬리컬 증기발생기 열수력, 격납용기 냉각 등 SMR 고유 다상유동 현상에 대한 전문 인력을 양성합니다.", tag: "KETEP, 2024–2025" },
                        { icon: Microscope, title: "격납용기 내 응축 열전달 연구", desc: "증기-공기 혼합물에서 비응축성 기체가 응축 열전달에 미치는 영향을 규명. 경량 비응축성 기체(수소)에 의한 열전달 저하 메커니즘과 기체 층화 현상을 실험적으로 분석했습니다.", tag: "논문 #5, #8, #12" },
                        { icon: Waves, title: "원자로 외벽 냉각(ERVC) 해석", desc: "고출력 원자로의 외부 원자로 용기 냉각 열수력 특성을 수치적으로 해석. CFD 기반 자연순환 유량 추정법을 개발하여 ERVC 냉각 한계를 정량적으로 평가합니다.", tag: "논문 #7, #9" },
                    ] : [
                        { icon: Shield, title: "Core Safety Validation for Multiple-Failure Accidents", desc: "Validating core safety issues against strengthened technical criteria and developing technology to improve core safety during multiple-failure accidents. A long-term flagship project covering natural circulation cooling, two-phase flow instability, and accident progression analysis.", tag: "NRF, 2022–2029" },
                        { icon: Atom, title: "Next-Gen SMR Safety Enhancement Design", desc: "Global human resources training project for securing key design technologies for next-generation SMR safety. Training specialists in passive safety systems, helical steam generator thermal-hydraulics, and containment cooling—all SMR-specific multi-phase flow phenomena.", tag: "KETEP, 2024–2025" },
                        { icon: Microscope, title: "Containment Condensation Heat Transfer", desc: "Characterizing the effect of noncondensable gases on condensation heat transfer in steam-air mixtures. Experimentally analyzed heat transfer degradation mechanisms by light noncondensable gas (hydrogen) and gas stratification phenomena.", tag: "Pub. #5, #8, #12" },
                        { icon: Waves, title: "External Reactor Vessel Cooling (ERVC)", desc: "Numerically evaluating thermal-hydraulic characteristics of ERVC in high-power reactors. Developed CFD-aided natural circulation flow rate estimation to quantitatively assess ERVC coolability limits.", tag: "Pub. #7, #9" },
                    ]).map((item, i) => (
                        <div key={i} className="flex gap-4 items-start bg-white rounded-xl p-4 border border-gray-100">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <item.icon className="w-4.5 h-4.5 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                                    <span className="text-[10px] font-medium bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{item.tag}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Research Visuals */}
            <div>
                <h5 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3">
                    {isKR ? "연구 시각 자료" : "Research Visuals"}
                </h5>
                <div className="rounded-xl overflow-hidden bg-black">
                    <div className="relative w-full" style={{ paddingBottom: "20%" }}>
                        <Image
                            src="/images/smr_summary.png"
                            alt={isKR ? "SMR 및 유동 안정성 연구" : "SMR & Flow Stability Research"}
                            fill
                            className="object-cover object-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Color Map ───

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; statBg: string; detailBorder: string }> = {
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", badge: "bg-rose-100 text-rose-700", statBg: "bg-rose-500", detailBorder: "border-rose-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", statBg: "bg-amber-500", detailBorder: "border-amber-200" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", badge: "bg-sky-100 text-sky-700", statBg: "bg-sky-500", detailBorder: "border-sky-200" },
};

// ─── Main Component ───

function ResearchIntro() {
    const [activePillar, setActivePillar] = useState(() => Math.floor(Math.random() * 3));
    const { language } = useLanguage();
    const pillars = language === "KR" ? pillarsKR : pillarsEN;

    const detailComponents = [
        <CarnotDetail key="carnot" language={language} />,
        <ImmersionDetail key="immersion" language={language} />,
        <SMRDetail key="smr" language={language} />,
    ];

    return (
        <div className="mb-10">
            {/* The AI Energy Paradox */}
            <motion.div
                className="mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 md:p-8">
                    <div className="flex items-start gap-5">
                        <Zap className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                                {language === "KR" ? "AI 에너지 패러독스" : "The AI Energy Paradox"}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {language === "KR"
                                    ? "AI는 효율을 위해 탄생했지만, 역설적으로 최대 에너지 소비원이 되어가고 있습니다. 단일 LLM 학습에 수십 GWh가 소모되고, 추론 한 건은 기존 검색의 10배 전력을 소비합니다. 2030년까지 데이터센터 전력은 전 세계 공급의 8%에 도달할 전망입니다. 이 문제의 본질은 열(熱)—전력의 생산·저장·소비 전 단계에서 다상유동 열전달이 핵심 병목이며, MFTEL은 세 가지 축으로 이 장벽에 도전합니다."
                                    : "AI was built to optimize efficiency—yet it is paradoxically becoming one of the largest energy consumers on earth. Training a single LLM costs tens of GWh; each inference draws 10× the power of a conventional search. By 2030, data centers will consume 8% of global electricity. The root of this challenge is thermal—multi-phase flow heat transfer is the bottleneck at every stage of power generation, storage, and consumption. MFTEL tackles this barrier on three fronts."}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Three Pillars Indicator */}
            <div className="flex items-center justify-center gap-3 mb-5">
                {pillars.map((pillar, i) => {
                    const c = colorMap[pillar.color];
                    return (
                        <motion.button
                            key={i}
                            className={`rounded-full transition-all duration-300 ${c.statBg} ${activePillar === i ? "w-3.5 h-3.5" : "w-2 h-2 opacity-50"}`}
                            onClick={() => setActivePillar(i)}
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: [0, 1.8, 1], opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 + i * 0.18, duration: 0.5, ease: "easeOut" }}
                        />
                    );
                })}
            </div>

            {/* Three Pillars - Tab Selector */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-5 mb-8">
                {pillars.map((pillar, i) => {
                    const c = colorMap[pillar.color];
                    const isActive = activePillar === i;
                    return (
                        <motion.div
                            key={i}
                            className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 origin-top ${
                                isActive
                                    ? `${c.bg} ${c.border} shadow-lg`
                                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                            }`}
                            onMouseEnter={() => setActivePillar(i)}
                            onClick={() => setActivePillar(i)}
                            initial={{ opacity: 0, y: -40, scale: 0.1, borderRadius: "9999px" }}
                            whileInView={{ opacity: 1, y: 0, scale: 1, borderRadius: "16px" }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.2, duration: 0.7, type: "spring", stiffness: 180, damping: 18 }}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isActive ? c.badge : "bg-gray-100 text-gray-500"} transition-colors`}>
                                    <pillar.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? c.text : "text-gray-400"} transition-colors block`}>
                                        {pillar.label}
                                    </span>
                                    <h4 className="text-base font-bold text-gray-900 leading-tight">{pillar.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{pillar.subtitle}</p>
                                    {isActive && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className={`${c.statBg} text-white text-sm font-bold px-2.5 py-0.5 rounded-md`}>
                                                {pillar.stats}
                                            </div>
                                            <span className="text-xs text-gray-500">{pillar.statsLabel}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Pillar Detail Panel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activePillar}
                    className={`rounded-2xl border ${colorMap[pillars[activePillar].color].detailBorder} bg-white p-6 md:p-8`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {detailComponents[activePillar]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default function Research() {
    const { t, language } = useLanguage();

    return (
        <Section id="research">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-600 tracking-widest uppercase mb-3">{t("research.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900">{t("research.title")}</h3>
            </div>

            <ResearchIntro />

            {/* Experiments & Computational Analysis */}
            <div className="grid md:grid-cols-2 gap-5 mb-16">
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                            <FlaskConical className="w-4.5 h-4.5 text-rose-500" />
                        </div>
                        <h4 className="text-base font-bold text-gray-900">{language === "KR" ? "실험 연구" : "Experiments"}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(language === "KR"
                            ? ["이상유동 불안정성", "풀 비등 열전달", "유동 비등 열전달", "열적 마진 시험", "절연유체", "Leidenfrost 효과", "젖음성", "응축"]
                            : ["Two-Phase Flow Instability", "Pool Boiling Heat Transfer", "Flow Boiling Heat Transfer", "Thermal Margin Test", "Dielectric Fluid", "Leidenfrost Effect", "Wettability", "Condensation"]
                        ).map((kw, i) => (
                            <span key={i} className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{kw}</span>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                            <Cpu className="w-4.5 h-4.5 text-sky-500" />
                        </div>
                        <h4 className="text-base font-bold text-gray-900">{language === "KR" ? "전산 해석" : "Computational Analysis"}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(
                            ["Nuclear Safety", "NSK System", "Code Coupling", "OpenFOAM", "MARS-KS", "CUPID", "GAMMA+", "ANSYS CFD", "Fluent", "STAR-CCM+"]
                        ).map((kw, i) => (
                            <span key={i} className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{kw}</span>
                        ))}
                    </div>
                </div>
            </div>

        </Section>
    );
}
