"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/ui/section";
import { galleryImages } from "@/app/data";
import { useLanguage } from "@/lib/LanguageContext";
import { X } from "lucide-react";

export default function Gallery() {
    const { t } = useLanguage();
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    return (
        <Section id="gallery" className="bg-slate-900 text-white">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-3">{t("gallery.label")}</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-white">{t("gallery.title")}</h3>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[220px]">
                {galleryImages.map((item, i) => {
                    // Alternate large and small tiles
                    const isLarge = i % 3 === 0;
                    return (
                        <motion.div
                            key={i}
                            className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
                                isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                            }`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => setSelectedImage(i)}
                        >
                            <Image
                                src={`/images/${item.image}`}
                                alt={item.title}
                                fill
                                sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <p className="text-rose-300 text-xs font-medium mb-0.5">{item.date}</p>
                                <h4 className="text-sm md:text-base font-semibold text-white leading-tight">{item.title}</h4>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage !== null && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.div
                            className="relative w-full max-w-4xl aspect-[16/10] rounded-xl overflow-hidden"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={`/images/${galleryImages[selectedImage].image}`}
                                alt={galleryImages[selectedImage].title}
                                fill
                                sizes="(max-width: 768px) 100vw, 896px"
                                className="object-contain"
                            />
                        </motion.div>
                        <div className="absolute bottom-8 text-center">
                            <p className="text-rose-300 text-sm mb-1">{galleryImages[selectedImage].date}</p>
                            <h4 className="text-white text-lg font-semibold">{galleryImages[selectedImage].title}</h4>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Section>
    );
}
