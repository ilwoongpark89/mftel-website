// Shared section manifest — single SoT for home-page order, navbar links, and scroll-spy.
// Navbar and page sections both import from here so anchors can never drift.

export type SectionDef = {
    id: string;
    labelKey: string; // LanguageContext key
    nav: boolean; // appears as a navbar link
    index: string; // folio index used by kickers ("01" …)
};

export const SECTIONS: SectionDef[] = [
    { id: "about", labelKey: "nav.about", nav: false, index: "01" },
    { id: "research", labelKey: "nav.research", nav: true, index: "02" },
    { id: "publications", labelKey: "nav.publications", nav: true, index: "03" },
    { id: "projects", labelKey: "nav.projects", nav: false, index: "04" },
    { id: "team", labelKey: "nav.team", nav: true, index: "05" },
    { id: "news", labelKey: "nav.news", nav: true, index: "06" },
    { id: "gallery", labelKey: "nav.gallery", nav: false, index: "07" },
    { id: "lecture", labelKey: "nav.lecture", nav: true, index: "08" },
    { id: "contact", labelKey: "nav.joinUs", nav: false, index: "09" },
    { id: "footer", labelKey: "nav.contact", nav: false, index: "10" },
];

// The recruiting CTA target (Join Us scene on the home story).
export const JOIN_ID = "join";

export const NAV_SECTIONS = SECTIONS.filter((s) => s.nav);

// v3 — the home page is a story; archives live on routes. Navbar uses these.
export const NAV_ROUTES = [
    { href: "/research", labelKey: "nav.research" },
    { href: "/publications", labelKey: "nav.publications" },
    { href: "/projects", labelKey: "nav.projects" },
    { href: "/team", labelKey: "nav.team" },
    { href: "/news", labelKey: "nav.news" },
    { href: "/gallery", labelKey: "nav.gallery" },
] as const;
