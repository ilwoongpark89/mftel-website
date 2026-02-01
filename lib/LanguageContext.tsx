"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "EN" | "KR";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 번역 데이터
const translations: Record<Language, Record<string, string>> = {
    EN: {
        // Navbar
        "nav.about": "About",
        "nav.news": "News",
        "nav.team": "Team",
        "nav.joinUs": "Join Us",
        "nav.research": "Research",
        "nav.publications": "Publications",
        "nav.projects": "Projects",
        "nav.gallery": "Gallery",
        "nav.contact": "Contact",

        // Hero
        "hero.line1": "Engineering",
        "hero.line2a": "Sustainable",
        "hero.line2b": "Energy",
        "hero.line3": "Future",
        "hero.description": "Multiphase Flow and Thermal Engineering Laboratory (MFTEL) at Inha University advances thermal science through thermal energy storage, electronics cooling, and reactor safety research.",
        "hero.publications": "Latest Publications",
        "hero.projects": "Latest Projects",

        // About
        "about.label": "About Us",
        "about.title": "Pioneering Thermal Engineering",
        "about.description": "MFTEL focuses on solving critical energy challenges through advanced research in multiphase flow and heat transfer.",
        "about.tes.title": "TES and Carnot Battery",
        "about.tes.description": "Developing high-efficiency thermal energy storage systems and Carnot batteries for sustainable grid stability.",
        "about.thermal.title": "Immersion Cooling",
        "about.thermal.description": "Two-phase immersion cooling technology that reduces cooling energy by up to 90% for data centers and high-performance computing systems.",
        "about.smr.title": "Small Modular Reactor",
        "about.smr.description": "Enhancing the safety and efficiency of Small Modular Reactors through advanced thermal-hydraulic analysis.",

        // News
        "news.label": "News",
        "news.title": "Latest Updates",
        "news.description": "Stay updated with our latest research activities, conferences, and achievements.",

        // Team
        "team.label": "Our People",
        "team.title": "Meet the Team",
        "team.pi": "Principal Investigator",
        "team.education": "Education & Career",
        "team.activities": "Professional Activities",
        "team.students": "Graduate Students",
        "team.alumni": "Alumni",
        "team.publications": "Publications",

        // Research
        "research.label": "Focus Areas",
        "research.title": "Research Fields",

        // Publications
        "publications.label": "Our Work",
        "publications.title": "Publications",
        "publications.count": "We have published {count} papers in top-tier journals.",
        "publications.showLess": "Show Less",
        "publications.viewAll": "View All Publications ({count})",

        // Projects
        "projects.label": "Funding & Patents",
        "projects.title": "Research Projects",
        "projects.patents": "Patents",
        "projects.showLess": "Show Less",
        "projects.viewAll": "View All Projects ({count})",

        // Gallery
        "gallery.label": "Moments",
        "gallery.title": "Lab Life",

        // Contact (Join Us)
        "contact.label": "Join Us",
        "contact.title1": "Shape the Future of",
        "contact.title2": "Thermal Engineering",
        "contact.description": "We are actively recruiting passionate M.S./Ph.D. students, postdocs, and researchers who want to push the boundaries of multiphase flow and heat transfer research.",
        "contact.benefit1.title": "World-Class Research",
        "contact.benefit1.description": "Publish in top-tier journals and present at international conferences",
        "contact.benefit2.title": "Global Network",
        "contact.benefit2.description": "Collaborate with NTNU (Norway), HZDR (Germany), UPC (Spain), and more",
        "contact.benefit3.title": "Promising Career",
        "contact.benefit3.description": "Our alumni are building careers at leading institutions like KHNP and beyond",
        "contact.benefit4.title": "Grow Your Way",
        "contact.benefit4.description": "We trust you to lead your research and planning",
        "contact.cta": "Ready to start your research journey?",
        "contact.apply": "Apply Now",
        "contact.emailCopied": "Email copied to clipboard!",

        // Footer
        "footer.label": "Contact",
        "footer.title": "Let's Collaborate",
        "footer.description": "We are always open to new research opportunities, collaborations, and talented students.",
        "footer.copyright": "© {year} MFTEL, Inha University. All rights reserved.",
    },
    KR: {
        // Navbar
        "nav.about": "소개",
        "nav.news": "소식",
        "nav.team": "구성원",
        "nav.joinUs": "연구실 모집",
        "nav.research": "연구",
        "nav.publications": "논문",
        "nav.projects": "과제",
        "nav.gallery": "갤러리",
        "nav.contact": "오시는 길",

        // Hero
        "hero.line1": "지속가능한",
        "hero.line2a": "에너지",
        "hero.line2b": "미래를",
        "hero.line3": "설계하다",
        "hero.description": "인하대학교 다상유동열공학연구실(MFTEL)은 열에너지 저장, 전자기기 냉각, 원자로 안전 연구를 통해 열공학의 미래를 만들어갑니다.",
        "hero.publications": "논문 보기",
        "hero.projects": "과제 보기",

        // About
        "about.label": "연구실 소개",
        "about.title": "열공학, 그 다음을 연구합니다",
        "about.description": "MFTEL은 다상유동과 열전달 연구를 통해 에너지 분야의 핵심 문제를 해결합니다.",
        "about.tes.title": "열에너지 저장",
        "about.tes.description": "고효율 열에너지 저장 시스템과 카르노 배터리로 안정적인 전력망 구축에 기여합니다.",
        "about.thermal.title": "이머전 쿨링",
        "about.thermal.description": "이상(二相) 이머전 쿨링 기술로 데이터센터 및 고성능 컴퓨팅 시스템의 냉각 에너지를 최대 90% 절감합니다.",
        "about.smr.title": "소형모듈원자로",
        "about.smr.description": "열수력 해석을 통해 소형모듈원자로(SMR)의 안전성과 효율을 높입니다.",

        // News
        "news.label": "소식",
        "news.title": "연구실 소식",
        "news.description": "MFTEL의 연구 활동과 소식을 전합니다.",

        // Team
        "team.label": "구성원",
        "team.title": "함께하는 사람들",
        "team.pi": "지도교수",
        "team.education": "학력 및 경력",
        "team.activities": "학술 활동",
        "team.students": "대학원생",
        "team.alumni": "졸업생",
        "team.publications": "논문",

        // Research
        "research.label": "연구",
        "research.title": "연구 분야",

        // Publications
        "publications.label": "논문",
        "publications.title": "학술 논문",
        "publications.count": "국제 학술지에 {count}편의 논문을 게재하였습니다.",
        "publications.showLess": "접기",
        "publications.viewAll": "전체 보기 ({count}편)",

        // Projects
        "projects.label": "과제",
        "projects.title": "연구 과제",
        "projects.patents": "특허",
        "projects.showLess": "접기",
        "projects.viewAll": "전체 보기 ({count}건)",

        // Gallery
        "gallery.label": "갤러리",
        "gallery.title": "연구실 일상",

        // Contact (Join Us)
        "contact.label": "연구실 모집",
        "contact.title1": "MFTEL과",
        "contact.title2": "함께 성장하세요",
        "contact.description": "열정 있는 석·박사 과정생, 박사후연구원, 연구원을 모집합니다. 다상유동과 열전달 연구에 관심 있는 분들의 지원을 기다립니다.",
        "contact.benefit1.title": "최고 수준의 연구",
        "contact.benefit1.description": "SCI급 학술지 게재, 국제학회 발표 기회",
        "contact.benefit2.title": "해외 연구 네트워크",
        "contact.benefit2.description": "NTNU, HZDR, UPC 등 해외 유수 기관과 협력",
        "contact.benefit3.title": "탄탄한 커리어",
        "contact.benefit3.description": "한수원 등 주요 기관에서 활약하는 졸업생 배출",
        "contact.benefit4.title": "자율적인 연구 환경",
        "contact.benefit4.description": "본인의 연구를 주도적으로 이끌어갈 수 있는 환경",
        "contact.cta": "MFTEL에서 연구를 시작하세요",
        "contact.apply": "지원 문의",
        "contact.emailCopied": "이메일 주소가 복사되었습니다!",

        // Footer
        "footer.label": "오시는 길",
        "footer.title": "연락처",
        "footer.description": "연구 협력, 대학원 진학 등 문의사항이 있으시면 연락 주세요.",
        "footer.copyright": "© {year} MFTEL, 인하대학교. All rights reserved.",
    },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("EN");

    useEffect(() => {
        const saved = localStorage.getItem("language") as Language;
        if (saved && (saved === "EN" || saved === "KR")) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
