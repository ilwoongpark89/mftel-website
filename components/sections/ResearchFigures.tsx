import Image from "next/image";

type Figure = { file: string; kr: string; en: string; detailKR: string; detailEN: string; width: number; height: number; photo?: boolean; wide?: boolean };
type Group = { kr: string; en: string; noteKR?: string; noteEN?: string; items: Figure[] };
const groups: Record<"tes" | "cooling" | "smr", Group[]> = {
    tes: [
        { kr: "모래 배터리 · 장치와 계통 설계", en: "Sand storage · apparatus and system design", items: [
            { file: "sand-test", kr: "열저장 시제품", en: "Thermal storage prototype", detailKR: "축열조·배관·수조를 연결한 실험 장치", detailEN: "A storage unit connected to piping and a water bath", width: 470, height: 624, photo: true },
            { file: "tube-design", kr: "열교환 배관 형상", en: "Heat exchanger configurations", detailKR: "직관·U자관·나선관의 열 회수 특성 비교", detailEN: "Comparing straight, U-shaped, and helical tubes", width: 1500, height: 643 },
            { file: "tes-system", kr: "열저장 계통 모델", en: "Thermal storage system model", detailKR: "MARS-KS로 배관과 계통의 응답 해석", detailEN: "Analysing tube and system response with MARS-KS", width: 872, height: 509 },
            { file: "tes-temperature", kr: "축열조 온도 측정", en: "Storage temperature measurements", detailKR: "위치와 시간에 따른 온도 변화", detailEN: "Temperature changes across locations and time", width: 390, height: 290 },
        ] },
        { kr: "다른 축열 매체 · PCM과 용융염", en: "Other storage media · PCM and molten salt", noteKR: "PCM의 용융·응고와 용융염의 자연대류를 연구합니다. 모래 배터리와 별개의 실험·해석 자료입니다.", noteEN: "PCM studies examine melting and solidification. Molten-salt simulations examine natural convection. These are separate from the sand system.", items: [
            { file: "pcm-test", kr: "PCM 축열 시험부", en: "PCM test section", detailKR: "상변화물질과 열매체의 직접접촉 실험", detailEN: "Direct-contact tests with PCM and heat transfer fluid", width: 400, height: 523, photo: true },
            { file: "tes-cfd", kr: "용융염 자연대류 해석", en: "Molten-salt convection", detailKR: "축열·방열 과정의 온도장과 유동장", detailEN: "Temperature and flow fields during charging and discharge", width: 358, height: 218 },
        ] },
    ],
    cooling: [{ kr: "실험 장치에서 기포와 표면으로", en: "From test facilities to bubbles and surfaces", items: [
        { file: "pool-rig", kr: "풀 비등 실험 장치", en: "Pool boiling facility", detailKR: "열부하에 따른 비등 성능 측정", detailEN: "Measuring boiling performance under changing heat loads", width: 346, height: 296, photo: true },
        { file: "dielectric-test", kr: "절연유체 비등 시험부", en: "Dielectric-fluid test section", detailKR: "전열면과 기포를 직접 관찰", detailEN: "Observing the heated surface and bubbles", width: 480, height: 640, photo: true },
        { file: "surface", kr: "전열면의 미세구조", en: "Surface microstructure", detailKR: "표면 형상과 비등 특성의 관계 분석", detailEN: "Relating surface structure to boiling behaviour", width: 580, height: 422 },
        { file: "copper-foam", kr: "구리 폼 시편", en: "Copper foam specimens", detailKR: "기공 구조와 표면 젖음성 비교", detailEN: "Comparing pore structure and surface wettability", width: 1030, height: 646 },
        { file: "bubbles", kr: "기포 거동 관찰", en: "Bubble dynamics", detailKR: "고속 영상으로 성장과 이탈 분석", detailEN: "High-speed imaging of growth and departure", width: 580, height: 438 },
        { file: "boiling-curve", kr: "비등 성능과 냉각 한계", en: "Boiling performance and cooling limits", detailKR: "벽면 과열도에 따른 열유속 평가", detailEN: "Evaluating heat flux against wall superheat", width: 589, height: 469, wide: true },
    ] }],
    smr: [{ kr: "실험 계통과 유동 진동", en: "The test loop and flow oscillations", items: [
        { file: "flow-rig", kr: "이상유동 불안정성 실험 장치", en: "Two-phase flow instability facility", detailKR: "가열·유동 조건에 따른 계통 응답 측정", detailEN: "Measuring responses to heating and flow conditions", width: 1200, height: 900, photo: true },
        { file: "flow-loop", kr: "열수력 실험 계통", en: "Thermal-hydraulic test loop", detailKR: "시험부와 압력·온도·유량 계측의 연결", detailEN: "Connecting the test section to pressure, temperature, and flow measurements", width: 1159, height: 685 },
        { file: "flow-response", kr: "압력과 유량의 진동", en: "Pressure and flow oscillations", detailKR: "시간 지연과 유로 간 상호작용 분석", detailEN: "Analysing delays and interactions between flow channels", width: 733, height: 330, wide: true },
        { file: "density-wave", kr: "밀도파 진동", en: "Density-wave oscillations", detailKR: "운전 조건에 따른 유량 진동 특성", detailEN: "Flow oscillations under different operating conditions", width: 733, height: 290, wide: true },
    ] }],
};

export default function ResearchFigures({ kind, isKR }: { kind: "tes" | "cooling" | "smr"; isKR: boolean }) {
    return <section className={`research-evidence-section evidence-${kind}`} aria-label={isKR ? "실험·해석 자료" : "Experiments and analysis"}>
        {groups[kind].map(group => <div className="evidence-group" key={group.en}>
            <h4 className="text-base font-semibold text-ink">{isKR ? group.kr : group.en}</h4>
            {group.noteKR && <p className="mt-2 max-w-3xl break-keep text-sm leading-relaxed text-ink-3">{isKR ? group.noteKR : group.noteEN}</p>}
            <div className="research-evidence">
                {group.items.map(item => <figure key={item.file} className={item.wide ? "evidence-wide" : ""} data-evidence-kind={item.photo ? "apparatus" : "analysis"}>
                    <div className="research-evidence-image">
                        <Image unoptimized src={`/images/research/evidence/${item.file}.webp`} alt={isKR ? item.kr : item.en} width={item.width} height={item.height} className="h-full w-full object-contain" />
                    </div>
                    <figcaption>{isKR ? item.kr : item.en}<p>{isKR ? item.detailKR : item.detailEN}</p></figcaption>
                </figure>)}
            </div>
        </div>)}
    </section>;
}
