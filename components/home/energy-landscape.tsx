"use client";

import { useEffect, useRef, useState } from "react";

/** A small supporting illustration. Device silhouettes stay still. */
export default function EnergyLandscape({ isKR }: { isKR: boolean }) {
    const ref = useRef<HTMLElement>(null);
    const [paused, setPaused] = useState(false);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return <figure ref={ref} className="energy-landscape quiet-energy" data-running={visible && !paused}>
        <svg viewBox="0 0 360 200" role="img" aria-label={isKR ? "원자로, 열저장, 발전기와 데이터센터" : "Reactor, heat storage, generator and data centre"}>
            <defs>
                <linearGradient id="quiet-shell" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#536b73"/><stop offset="1" stopColor="#293d48"/>
                </linearGradient>
                <linearGradient id="quiet-silver" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#c1d0c6"/><stop offset="1" stopColor="#829e97"/>
                </linearGradient>
                <linearGradient id="quiet-warm" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#FFB98A" stopOpacity=".88"/><stop offset="1" stopColor="#C48359" stopOpacity=".88"/>
                </linearGradient>
            </defs>
            {/* Four small, rounded objects. Detail belongs to the studies below. */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M73 103 H96 Q102 103 102 99 V96 H112 M172 104 H191 Q197 104 197 99 V96 H214 V105 M258 121 H278" stroke="#637d80" strokeOpacity=".65" strokeWidth="2"/>
                <path className="quiet-flow" d="M73 103 H96 Q102 103 102 99 V96 H112 M172 104 H191 Q197 104 197 99 V96 H214 V105" stroke="#FFB98A" strokeOpacity=".62" strokeWidth="2" strokeDasharray="2 34"/>
                <path className="quiet-flow" d="M258 121 H278" stroke="#c1c8aa" strokeOpacity=".75" strokeWidth="2" strokeDasharray="2 34"/>
            </g>
            {/* A domed containment with a small pressure-vessel cutaway. */}
            <path d="M24 128 V83 C24 54 78 54 78 83 V128 Q78 139 65 139 H37 Q24 139 24 128Z" fill="url(#quiet-shell)"/>
            <path d="M28 81 C30 61 72 61 75 81 C63 85 40 85 28 81Z" fill="url(#quiet-silver)"/>
            <path d="M33 93 Q33 88 39 87 H65 Q70 88 70 94 V128 Q70 133 65 133 H39 Q33 133 33 127Z" fill="#203641"/>
            <rect x="40" y="92" width="23" height="36" rx="9" fill="#76928f"/>
            <path d="M43 102 Q51 94 60 102 V120 Q51 126 43 120Z" fill="#365763"/>
            <path d="M47 115 V122 M51 115 V123 M55 115 V122" stroke="#EBAA7D" strokeWidth="2" strokeLinecap="round"/>
            <path d="M57 103 C64 102 64 107 57 106 C52 105 52 110 59 109" fill="none" stroke="#CF9A75" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M47 93 V88 M54 93 V88" stroke="#b3c5bc" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M27 130 Q50 141 75 130" fill="none" stroke="#7d9696" strokeOpacity=".5" strokeWidth="2"/>
            {/* Storage vessels: broad liquid sections, rimmed heads and one shared pipe. */}
            <path d="M112 98 H137 V132 Q137 140 124.5 140 Q112 140 112 132Z" fill="url(#quiet-shell)"/>
            <ellipse cx="124.5" cy="98" rx="12.5" ry="5" fill="#8aa5a3"/>
            <path d="M118 111 H131 V131 Q124.5 135 118 131Z" fill="#72989c"/>
            <ellipse cx="124.5" cy="111" rx="6.5" ry="2.5" fill="#9cbab5"/>
            <path d="M114 133 Q124.5 140 135 133" fill="none" stroke="#789392" strokeWidth="1.4"/>
            <path d="M144 86 H175 V131 Q175 140 159.5 140 Q144 140 144 131Z" fill="url(#quiet-shell)"/>
            <ellipse cx="159.5" cy="86" rx="15.5" ry="5.5" fill="#a4b8ad"/>
            <path d="M151 103 H168 V131 Q159.5 136 151 131Z" fill="url(#quiet-warm)"/>
            <ellipse cx="159.5" cy="103" rx="8.5" ry="3" fill="#EBAA7D"/>
            <path d="M147 134 Q159.5 141 172 134" fill="none" stroke="#81988f" strokeWidth="1.4"/>
            <path d="M124 93 V80 Q124 77 127 77 H157 Q160 77 160 80 V81" fill="none" stroke="#7d9999" strokeWidth="1.6" strokeLinecap="round"/>
            {/* A turbine and generator joined by an actual shaft on a shared bed. */}
            <rect x="201" y="137" width="62" height="4" rx="2" fill="#435c64"/>
            <path d="M211 132 V138 M247 131 V138" stroke="#718d8d" strokeWidth="3"/>
            <rect x="206" y="103" width="24" height="32" rx="10" fill="url(#quiet-shell)"/>
            <ellipse cx="214" cy="119" rx="12" ry="16" fill="#66817f"/>
            <ellipse cx="214" cy="119" rx="9" ry="12" fill="#263e48"/>
            <g className="quiet-rotor" fill="#a9beb3">
                <path d="M214 110 C220 110 220 116 214 119Z M222 119 C222 126 217 126 214 119Z M214 128 C208 128 208 122 214 119Z M206 119 C206 112 211 112 214 119Z"/>
            </g>
            <circle cx="214" cy="119" r="2.4" fill="#cad6c9"/>
            <path d="M230 119 H239" stroke="#b1c4b9" strokeWidth="3"/>
            <rect x="237" y="107" width="23" height="26" rx="8" fill="url(#quiet-silver)"/>
            <path d="M254 108 Q261 111 261 120 Q261 129 254 133" fill="#7c9892"/>
            <path d="M248 113 L243 121 H248 L245 127 L253 118 H248Z" fill="#405a5e"/>
            {/* Server: three trays in one small cabinet, with a single cooled chip. */}
            <path d="M332 76 L339 71 V128 Q339 134 332 139Z" fill="#283e49"/>
            <path d="M280 77 Q280 72 286 69 H330 Q338 69 339 75 L332 81Z" fill="#7c9696"/>
            <rect x="278" y="76" width="54" height="63" rx="9" fill="url(#quiet-shell)"/>
            {[85, 101].map((y, i) => <g key={y}>
                <rect x="286" y={y} width="38" height="11" rx="4" fill="#233943"/>
                {[291, 298, 305].map(x => <rect key={x} x={x} y={y+3} width="4.5" height="5" rx="1" fill="#658185"/>)}
                <circle className={`quiet-led quiet-led-${i}`} cx="317" cy={y+5.5} r="1.6" fill="#b9cdbf"/>
            </g>)}
            <rect x="286" y="117" width="38" height="14" rx="4" fill="#233943"/>
            <rect x="298" y="120" width="14" height="8" rx="2.5" fill="url(#quiet-silver)"/>
            {[300, 306, 312].map((x,i) => <circle key={x} className={`quiet-bubble quiet-bubble-${i}`} cx={x} cy="118" r="1.2" fill="none" stroke="#b5ccc4" strokeOpacity=".65" strokeWidth=".7"/>)}
        </svg>
        <button type="button" className="motion-access" onClick={() => setPaused(p => !p)} aria-pressed={paused} aria-label={isKR ? (paused ? "애니메이션 재생" : "애니메이션 멈추기") : (paused ? "Play animation" : "Pause animation")}>{paused ? "▷" : "Ⅱ"}</button>
    </figure>;
}
