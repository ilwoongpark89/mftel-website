"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";
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
    const dialogRef = useDialogFocus(selected !== null);

    // Esc to close + scroll lock while the lightbox is open
    useEffect(() => {
        if (selected === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelected(null);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
        };
    }, [selected]);

    const open = selected !== null ? galleryImages[selected] : null;

    return (
        <Band id="gallery" surface="paper">
            <SectionHeader
                index="07"
                kicker={t("gallery.label")}
                title={t("gallery.title")}
                isKorean={language === "KR"}
            />

            <Reveal className="gallery-grid">
                        {galleryImages.map(item => <button
                            key={item.image} type="button" onClick={() => setSelected(galleryImages.indexOf(item))}
                            className="gallery-card group">
                            <div className="gallery-photo">
                                <Image src={`/images/${item.image}`} alt={language === "KR" ? item.titleKR : item.title} fill
                                    sizes="(max-width: 639px) calc(100vw - 48px), (max-width: 1023px) calc((100vw - 84px) / 2), 340px"
                                    className={`object-cover ${item.span === 2 ? "object-[50%_70%]" : ""}`} />
                            </div>
                            <div className="gallery-caption">
                                <p className="break-keep text-[15px] font-medium leading-[1.55] text-ink">{language === "KR" ? item.titleKR : item.title}</p>
                                <Meta className="mt-1 block text-xs">{language === "KR" ? item.dateKR : item.date}</Meta>
                            </div>
                        </button>)}
            </Reveal>

            {/* lightbox — Esc + click-outside close, caption anchored to the image */}
            {open ? (
                <div
                    ref={dialogRef}
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
                    <figure className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                            <p className="text-base font-medium text-paper">{language === "KR" ? open.titleKR : open.title}</p>
                            <Meta dark className="mt-1 block">
                                {language === "KR" ? open.dateKR : open.date}
                            </Meta>
                        </figcaption>
                    </figure>
                </div>
            ) : null}
        </Band>
    );
}
