"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

// Sections with dark backgrounds
const darkSections = ["home", "gallery", "contact", "footer"];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [onDarkSection, setOnDarkSection] = useState(true); // Start on Hero (dark)
    const [activeSection, setActiveSection] = useState("home");
    const { language, setLanguage, t } = useLanguage();

    const navItems = [
        { name: t("nav.about"), href: "#about" },
        { name: t("nav.news"), href: "#news" },
        { name: t("nav.team"), href: "#team" },
        { name: t("nav.joinUs"), href: "#contact", highlight: true },
        { name: t("nav.research"), href: "#research" },
        { name: t("nav.publications"), href: "#publications" },
        { name: t("nav.projects"), href: "#projects" },
        { name: t("nav.gallery"), href: "#gallery" },
        { name: t("nav.lecture"), href: "#lecture" },
        { name: t("nav.contact"), href: "#footer" },
    ];

    const toggleLanguage = () => {
        setLanguage(language === "KR" ? "EN" : "KR");
    };

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);

            // Check which section we're on
            const sections = ["home", "about", "news", "team", "contact", "research", "publications", "projects", "gallery", "footer"];
            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Check if section is at the top of viewport
                    if (rect.top <= 100 && rect.bottom >= 100) {
                        setOnDarkSection(darkSections.includes(sectionId));
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Initial check
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Use dark text only when on light section
    const useDarkText = !onDarkSection;

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                onDarkSection
                    ? scrolled
                        ? "bg-slate-900/80 backdrop-blur-md py-4"
                        : "bg-transparent py-6"
                    : scrolled
                        ? "bg-white/90 backdrop-blur-md border-b shadow-sm py-4"
                        : "bg-white/90 backdrop-blur-md py-4"
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="hidden lg:flex justify-between items-center">
                    {/* Left: Logo */}
                    <a href="#" className={cn(
                        "text-2xl font-bold tracking-tighter transition-colors",
                        useDarkText ? "text-foreground" : "text-white"
                    )}>
                        MFTEL
                    </a>

                    {/* Center: Nav items */}
                    <div className="flex items-center space-x-8">
                        {navItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-base font-medium transition-colors",
                                    item.highlight
                                        ? useDarkText
                                            ? "text-rose-600 hover:text-rose-700"
                                            : "text-rose-400 hover:text-rose-300"
                                        : useDarkText
                                            ? "text-muted-foreground hover:text-primary"
                                            : "text-white/80 hover:text-white"
                                )}
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.querySelector(item.href)?.scrollIntoView({
                                        behavior: "smooth",
                                    });
                                }}
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>

                    {/* Right: Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className={cn(
                            "flex items-center text-sm font-medium transition-colors",
                            useDarkText ? "text-muted-foreground" : "text-white/80"
                        )}
                    >
                        <span className={cn(
                            "transition-colors",
                            language === "EN"
                                ? useDarkText ? "text-foreground font-semibold" : "text-white font-semibold"
                                : ""
                        )}>
                            EN
                        </span>
                        <span className="mx-1.5">|</span>
                        <span className={cn(
                            "transition-colors",
                            language === "KR"
                                ? useDarkText ? "text-foreground font-semibold" : "text-white font-semibold"
                                : ""
                        )}>
                            KR
                        </span>
                    </button>
                </div>

                <div className="lg:hidden flex justify-between items-center w-full">
                    <a href="#" className={cn(
                        "text-2xl font-bold tracking-tighter transition-colors",
                        useDarkText ? "text-foreground" : "text-white"
                    )}>
                        MFTEL
                    </a>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "p-2 transition-colors z-[60]",
                            isOpen ? "text-white" : useDarkText ? "text-foreground" : "text-white"
                        )}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Fullscreen Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden fixed inset-0 z-50 bg-slate-900"
                    >
                        <div className="flex flex-col items-center justify-center h-full space-y-5">
                            {navItems.map((item, i) => {
                                const sectionId = item.href.replace("#", "");
                                const isActive = activeSection === sectionId;
                                return (
                                    <motion.a
                                        key={item.href}
                                        href={item.href}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            "text-2xl font-medium transition-colors",
                                            item.highlight
                                                ? "text-rose-400"
                                                : isActive
                                                    ? "text-white"
                                                    : "text-gray-400 hover:text-white"
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsOpen(false);
                                            setTimeout(() => {
                                                document.querySelector(item.href)?.scrollIntoView({
                                                    behavior: "smooth",
                                                });
                                            }, 200);
                                        }}
                                    >
                                        {isActive && <span className="mr-2 text-rose-400">-</span>}
                                        {item.name}
                                    </motion.a>
                                );
                            })}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="pt-6 border-t border-gray-700"
                            >
                                <button
                                    onClick={toggleLanguage}
                                    className="flex items-center text-lg font-medium text-gray-400"
                                >
                                    <span className={language === "EN" ? "text-white font-semibold" : ""}>EN</span>
                                    <span className="mx-2">|</span>
                                    <span className={language === "KR" ? "text-white font-semibold" : ""}>KR</span>
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
