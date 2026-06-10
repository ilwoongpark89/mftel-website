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

// The recruiting CTA target (Join Us band). Currently the legacy Contact section id.
export const JOIN_ID = "contact";

export const NAV_SECTIONS = SECTIONS.filter((s) => s.nav);
