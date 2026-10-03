"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function ResearchExperience({ kind }: { kind: "tes" | "cooling" | "smr" }) {
    const { language } = useLanguage();
    const iframe = useRef<HTMLIFrameElement>(null);
    const visible = useRef(false);
    const [height, setHeight] = useState(510);
    const isKR = language === "KR";
    const title = {
        tes: isKR ? "다양한 열저장 시스템의 축열과 방열" : "Charging and discharging across thermal storage systems",
        cooling: isKR ? "반도체 비등 냉각과 임계열유속" : "Chip boiling and critical heat flux",
        smr: isKR ? "SMR 이상유동 불안정성과 계통 해석" : "SMR flow instability and system analysis",
    }[kind];
    useEffect(() => {
        const frame = iframe.current;
        if (!frame) return;
        let contentObserver: ResizeObserver | undefined;
        const measure = () => {
            const measured = frame.contentDocument?.querySelector(".study")?.getBoundingClientRect().height;
            if (measured && measured > 100 && measured < 1600) setHeight(Math.ceil(measured));
        };
        const connect = () => {
            contentObserver?.disconnect();
            const study = frame.contentDocument?.querySelector(".study");
            if (study) {
                contentObserver = new ResizeObserver(measure);
                contentObserver.observe(study);
                measure();
            }
            frame.contentWindow?.postMessage({ type: "lab-visibility", visible: visible.current }, window.location.origin);
        };
        // Native load + immediate inspection covers frames loaded before React hydration.
        frame.addEventListener("load", connect);
        connect();
        const io = new IntersectionObserver(([entry]) => {
            visible.current = entry.isIntersecting;
            frame.contentWindow?.postMessage({ type: "lab-visibility", visible: visible.current }, window.location.origin);
        }, { threshold: 0.08 });
        io.observe(frame);
        const resize = (event: MessageEvent) => {
            if (event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
            if (event.data?.type !== "lab-height" || event.data.kind !== kind) return;
            const next = Number(event.data.height);
            if (Number.isFinite(next) && next > 100 && next < 1600) setHeight(Math.ceil(next));
        };
        window.addEventListener("message", resize);
        return () => { io.disconnect(); contentObserver?.disconnect(); frame.removeEventListener("load", connect); window.removeEventListener("message", resize); };
    }, [kind]);
    return <div className="research-experience">
        <iframe ref={iframe} src={`/experiences/${kind}.html?lang=${isKR ? "ko" : "en"}`} title={title} loading="lazy" style={{ height }} />
    </div>;
}
