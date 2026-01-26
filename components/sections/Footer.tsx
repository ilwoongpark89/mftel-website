"use client";

import { MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
    return (
        <footer id="footer" className="bg-slate-950 text-white py-16">
            <div className="container mx-auto px-4">
                {/* Contact Info */}
                <div className="text-center mb-12">
                    <h2 className="text-sm font-semibold text-rose-400 tracking-widest uppercase mb-3">Contact</h2>
                    <h3 className="text-2xl font-bold mb-4">Let's Collaborate</h3>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        We are always open to new research opportunities, collaborations, and talented students.
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
                        <span className="text-sm text-gray-500">© {new Date().getFullYear()} MFTEL, Inha University. All rights reserved.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
