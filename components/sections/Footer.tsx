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

                {/* Map */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="rounded-xl overflow-hidden border border-gray-800" style={{ height: 250 }}>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3166.5!2d126.6544!3d37.4507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357b78a27fba4c35%3A0x6e1b9e7b2e8b1c2a!2sInha%20University!5e0!3m2!1sen!2skr!4v1700000000000!5m2!1sen!2skr"
                            width="100%"
                            height="250"
                            style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)" }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="MFTEL Location - Inha University"
                        />
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
