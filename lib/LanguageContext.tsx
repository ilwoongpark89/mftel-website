"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export type Language = "EN" | "KR";

interface LanguageContextType {
    language: Language;
    /** navigates between the / (KR) and /en (EN) trees — URL is the SoT */
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    /** locale-aware internal path: lp("/research") → "/research" | "/en/research" */
    lp: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 번역 데이터
const translations: Record<Language, Record<string, string>> = {
    EN: {
        // Navbar
        "nav.news": "News",
        "nav.team": "Team",
        "nav.joinUs": "Join Us",
        "nav.research": "Research",
        "nav.publications": "Publications",
        "nav.projects": "Projects",
        "nav.gallery": "Gallery",
        "nav.lecture": "Lecture",

        // Hero
        "hero.line1": "Engineering a",
        "hero.line2a": "Sustainable",
        "hero.line2b": "Energy",
        "hero.line3": "Future",
        "hero.description": "Multiphase Flow and Thermal Engineering Laboratory (MFTEL) at Inha University works on thermal energy storage, AI semiconductor cooling, and small modular reactor safety.",
        "hero.kicker": "Inha University · Multiphase Flow & Thermal Engineering Lab",
        "hero.join": "Join Our Lab",
        "hero.research": "Explore Research",
        "hero.stat.publications": "Publications",
        "hero.stat.projects": "Funded Projects",
        "hero.stat.patents": "Patents · Granted + Filed",
        "hero.stat.partners": "Collaborators",

        // Home story (v3)
        "home.numbers.label": "Our Record",
        "home.numbers.title": "A record we build together",
        "home.numbers.sub": "Every paper, project, and patent here was written with our students. The next line is yours.",
        "home.research.label": "Research",
        "home.research.title": "Three research fields, one thermal bottleneck",
        "home.pubs.label": "Publications",
        "home.pubs.title": "Published where it matters",
        "home.pubs.cta": "All publications",
        "home.people.label": "People",
        "home.people.cta": "Meet the team",
        "home.partners.label": "Global Network",

        // About
        "about.tes.title": "TES and Carnot Battery",
        "about.tes.description": "Developing high-efficiency thermal energy storage systems and Carnot batteries for sustainable grid stability.",
        "about.thermal.title": "AI Semiconductor Cooling",
        "about.thermal.description": "Two-phase immersion cooling technology that reduces cooling energy by up to 90% for data centers and high-performance computing systems.",
        "about.smr.title": "Small Modular Reactor",
        "about.smr.description": "Enhancing the safety and efficiency of small modular reactors with thermal-hydraulic analysis.",

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

        // Gallery
        "gallery.label": "Moments",
        "gallery.title": "Lab Life",

        // Contact (Join Us)
        "contact.label": "Join Us",
        "contact.title1": "Shape the Future of",
        "contact.title2": "Thermal Engineering",
        "contact.description": "We are recruiting M.S./Ph.D. students, postdocs, and researchers in multiphase flow and heat transfer.",
        "contact.apply": "Apply Now",
        "contact.emailCopied": "Email copied to clipboard!",

        // Footer
        "footer.copyright": "© {year} MFTEL, Inha University. All rights reserved.",
    },
    KR: {
        // Navbar
        "nav.news": "소식",
        "nav.team": "구성원",
        "nav.joinUs": "연구실 모집",
        "nav.research": "연구",
        "nav.publications": "논문",
        "nav.projects": "과제",
        "nav.gallery": "갤러리",
        "nav.lecture": "강의",

        // Hero
        "hero.line1": "지속가능한",
        "hero.line2a": "에너지",
        "hero.line2b": "미래를",
        "hero.line3": "설계하다",
        "hero.description": "인하대학교 다상유동열공학연구실(MFTEL)은 열에너지 저장, AI 반도체 냉각, 소형모듈원자로 안전을 연구합니다.",
        "hero.kicker": "인하대학교 다상유동열공학연구실 · MFTEL",
        "hero.join": "연구실 지원",
        "hero.research": "연구 분야 보기",
        "hero.stat.publications": "국제 학술 논문",
        "hero.stat.projects": "연구 과제",
        "hero.stat.patents": "특허 등록·출원",
        "hero.stat.partners": "협력 기관",

        // Home story (v3)
        "home.numbers.label": "쌓아온 기록",
        "home.numbers.title": "함께 쌓아가는 기록",
        "home.numbers.sub": "이 숫자들은 전부 학생들과 함께 쓴 기록입니다. 다음 줄은 여러분의 몫입니다.",
        "home.research.label": "연구 분야",
        "home.research.title": "열 병목을 푸는 세 가지 연구",
        "home.pubs.label": "논문",
        "home.pubs.title": "주요 국제 학술지에 게재합니다",
        "home.pubs.cta": "논문 전체 보기",
        "home.people.label": "구성원",
        "home.people.cta": "팀 전체 보기",
        "home.partners.label": "협력 네트워크",

        // About
        "about.tes.title": "열에너지 저장",
        "about.tes.description": "고효율 열에너지 저장 시스템과 카르노 배터리로 안정적인 전력망 구축에 기여합니다.",
        "about.thermal.title": "AI 반도체 냉각",
        "about.thermal.description": "이상 이머전 쿨링 기술로 데이터센터 및 고성능 컴퓨팅 시스템의 냉각 에너지를 최대 90% 절감합니다.",
        "about.smr.title": "소형모듈원자로",
        "about.smr.description": "열수력 해석으로 소형모듈원자로(SMR)의 안전성과 효율을 높입니다.",

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
        "publications.count": "국제 학술지에 {count}편의 논문을 게재했습니다.",
        "publications.showLess": "접기",
        "publications.viewAll": "전체 보기 ({count}편)",

        // Projects
        "projects.label": "과제",
        "projects.title": "연구 과제",
        "projects.patents": "특허",

        // Gallery
        "gallery.label": "갤러리",
        "gallery.title": "연구실 일상",

        // Contact (Join Us)
        "contact.label": "연구실 모집",
        "contact.title1": "MFTEL과",
        "contact.title2": "함께 성장하세요",
        "contact.description": "몰입을 아는 석·박사 과정생, 박사후연구원, 연구원을 모집합니다. 다상유동과 열전달 연구에 관심 있는 분들의 지원을 기다립니다.",
        "contact.apply": "지원 문의",
        "contact.emailCopied": "이메일 주소가 복사되었습니다!",

        // Footer
        "footer.copyright": "© {year} MFTEL, 인하대학교. All rights reserved.",
    },
};

export function LanguageProvider({
    children,
    initialLanguage = "KR",
}: {
    children: ReactNode;
    initialLanguage?: Language;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const language = initialLanguage;

    // URL is the SoT: switching language navigates between the / and /en trees
    const setLanguage = (lang: Language) => {
        if (lang === language) return;
        const bare = pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
        router.push(lang === "EN" ? (bare === "/" ? "/en" : `/en${bare}`) : bare);
    };

    const lp = (path: string) =>
        language === "EN" ? (path === "/" ? "/en" : `/en${path}`) : path;

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, lp }}>
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
