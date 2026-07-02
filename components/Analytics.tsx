"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Site-wide analytics beacon (mounted once in the root layout).
 * - First page of a session → a full visit (geo/IP/UA/referrer/device).
 * - Every subsequent route change → a lightweight page view.
 */
export default function Analytics() {
    const pathname = usePathname();
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (lastPath.current === pathname) return;
        lastPath.current = pathname;

        const firstVisit = !sessionStorage.getItem('mftel_tracked');
        if (firstVisit) sessionStorage.setItem('mftel_tracked', 'true');

        const body = {
            referrer: document.referrer || '',
            path: pathname || window.location.pathname || '/',
            language: navigator.language || '',
            screen: typeof window.screen !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
            pageviewOnly: !firstVisit,
        };

        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }).catch(() => { /* silently fail */ });
    }, [pathname]);

    return null;
}
