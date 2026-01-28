"use client";

import { MapPin, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer id="footer" className="bg-slate-950 text-white py-16">
            <div className="container mx-auto px-4">
                {/* Contact Info */}
                <div className="text-center mb-12">
                    <h2 className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-3">{t("footer.label")}</h2>
                    <h3 className="text-2xl font-bold mb-4">{t("footer.title")}</h3>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        {t("footer.description")}
                    </p>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-gray-300">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-rose-400" />
                            <span>Inha University 2N687, 100 Inha-ro, Michuhol-gu, Incheon 22212, Korea</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-rose-400" />
                            <a href="tel:+82-32-860-7335" className="hover:text-white transition-colors">
                                +82-32-860-7335
                            </a>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-rose-400" />
                            <a href="mailto:ilwoongpark@inha.ac.kr" className="hover:text-white transition-colors">
                                ilwoongpark@inha.ac.kr
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider & Copyright */}
                <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <span className="text-2xl font-bold tracking-tighter">MFTEL</span>
                        <span className="text-sm text-gray-500">{t("footer.copyright").replace("{year}", String(new Date().getFullYear()))}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
