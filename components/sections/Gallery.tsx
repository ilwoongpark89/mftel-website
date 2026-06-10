"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import Band from "@/components/ui/band";
import Reveal from "@/components/ui/reveal";
import { Meta, SectionHeader } from "@/components/ui/typo";
import { galleryImages } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * 07 MOMENTS — coal band. Curated bento: explicit `span` field in data
 * (no index-parity sizing), caption BARS below each tile (never hover-gated,
 * never scrim-over-photo), frame-0 grid, ~40 LOC lightbox (Esc + click-outside).
 */
export default function Gallery() {
    const { t, language } = useLanguage();
    const [selected, setSelected] = useState<number | null>(null);

    // Esc to close + scroll lock while the lightbox is open
    useEffect(() => {
        if (selected === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelected(null);
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [selected]);

    const open = selected !== null ? galleryImages[selected] : null;

    return (
        <Band id="gallery" surface="coal">
            <SectionHeader
                index="07"
                kicker={t("gallery.label")}
                title={t("gallery.title")}
                dark
                isKorean={language === "KR"}
            />

            {/* bento — 2-col mobile / 3-col desktop; dense flow backfills span-2 holes */}
            <Reveal className="reveal-stagger grid grid-flow-dense grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {galleryImages.map((item, i) => (
                    <button
                        key={item.image}
                        type="button"
                        onClick={() => setSelected(i)}
                        className={`group flex flex-col overflow-hidden rounded-lg border border-white/10 bg-coal-raised text-left transition-colors duration-150 hover:border-white/25 ${
                            item.span === 2 ? "col-span-2" : ""
                        }`}
                    >
                        <div
                            className={`relative w-full ${
                                item.span === 2 ? "aspect-[2/1] md:aspect-[8/3]" : "aspect-[4/3]"
                            }`}
                        >
                            <Image
                                src={`/images/${item.image}`}
                                alt={item.title}
                                fill
                                sizes={
                                    item.span === 2
                                        ? "(max-width: 768px) 100vw, 50vw"
                                        : "(max-width: 768px) 50vw, 33vw"
                                }
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                            />
                        </div>
                        {/* caption bar — always visible, below the photo */}
                        <div className="flex-1 border-t border-white/10 px-3 py-2.5 md:px-4 md:py-3">
                            <p className="text-[13px] font-medium leading-snug text-paper">{item.title}</p>
                            <Meta dark className="mt-1 block text-[11px]">
                                {item.date}
                            </Meta>
                        </div>
                    </button>
                ))}
            </Reveal>

            {/* lightbox — Esc + click-outside close, caption anchored to the image */}
            {open ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={open.title}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-8"
                    onClick={() => setSelected(null)}
                >
                    <button
                        type="button"
                        aria-label={language === "KR" ? "닫기" : "Close"}
                        onClick={() => setSelected(null)}
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:text-white"
                    >
                        <X className="h-7 w-7" />
                    </button>
                    <figure className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        <div className="relative h-[60vh] md:h-[72vh]">
                            <Image
                                src={`/images/${open.image}`}
                                alt={open.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 896px"
                                className="object-contain"
                            />
                        </div>
                        <figcaption className="mt-4 text-center">
                            <p className="text-base font-medium text-paper">{open.title}</p>
                            <Meta dark className="mt-1 block">
                                {open.date}
                            </Meta>
                        </figcaption>
                    </figure>
                </div>
            ) : null}
        </Band>
    );
}
