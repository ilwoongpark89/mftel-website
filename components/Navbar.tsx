"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navItems = [
    { name: "About", href: "#about" },
    { name: "News", href: "#news" },
    { name: "Team", href: "#team" },
    { name: "Join Us", href: "#contact", highlight: true },
    { name: "Research", href: "#research" },
    { name: "Publications", href: "#publications" },
    { name: "Projects", href: "#projects" },
    { name: "Gallery", href: "#gallery" },
    { name: "Contact", href: "#footer" },
];

// Sections with dark backgrounds
const darkSections = ["home", "gallery", "contact", "footer"];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [onDarkSection, setOnDarkSection] = useState(true); // Start on Hero (dark)
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
                                key={item.name}
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

                    {/* Right: empty for balance */}
                    <div className="w-[60px]"></div>
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
                            "p-2 transition-colors",
                            useDarkText ? "text-foreground" : "text-white"
                        )}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b shadow-xl">
                    <div className="container mx-auto px-4 py-8 space-y-4">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "block text-lg font-medium",
                                    item.highlight
                                        ? "text-rose-600 hover:text-rose-700"
                                        : "text-foreground hover:text-primary"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
