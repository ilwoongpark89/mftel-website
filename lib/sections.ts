// Shared route manifest — single SoT for navbar and footer links.

// The recruiting CTA target (Join Us scene on the home story).
export const JOIN_ID = "join";

// v3 — the home page is a story; archives live on routes. Navbar uses these.
export const NAV_ROUTES = [
    { href: "/research", labelKey: "nav.research" },
    { href: "/publications", labelKey: "nav.publications" },
    { href: "/projects", labelKey: "nav.projects" },
    { href: "/team", labelKey: "nav.team" },
    { href: "/news", labelKey: "nav.news" },
    { href: "/gallery", labelKey: "nav.gallery" },
    { href: "/lecture", labelKey: "nav.lecture" },
] as const;
