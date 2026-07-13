import { NextRequest, NextResponse } from "next/server";

/**
 * Locale routing — URL is the language SoT.
 *   /            → Korean  (rewritten internally to /ko/*, prefix never shown)
 *   /en/*        → English (visible prefix)
 *   /ko/*        → 308 redirect to the canonical unprefixed URL
 * API routes, Next internals, and static assets are excluded by the matcher.
 */
export default function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 통합 강의 앱(2026-07-12): /lecture/* 는 로케일 처리에서 제외 → next.config beforeFiles 리라이트가
    //   강의 프로젝트(basePath /lecture)로 프록시. proxy(middleware) 가 /ko rewrite 로 먼저 먹으면 프록시 무력화되므로 여기서 next() passthrough.
    if (pathname === "/lecture" || pathname.startsWith("/lecture/")) {
        return NextResponse.next();
    }

    // canonicalize: explicit /ko prefix collapses to the bare URL
    if (pathname === "/ko" || pathname.startsWith("/ko/")) {
        const url = req.nextUrl.clone();
        url.pathname = pathname.slice(3) || "/";
        return NextResponse.redirect(url, 308);
    }

    // English tree passes through — [locale] captures "en"
    if (pathname === "/en" || pathname.startsWith("/en/")) {
        return NextResponse.next();
    }

    // everything else serves Korean
    const url = req.nextUrl.clone();
    url.pathname = `/ko${pathname}`;
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ["/((?!api|_next|.*\\..*).*)"],
};
