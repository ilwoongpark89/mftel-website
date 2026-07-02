"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Site-wide analytics beacon (mounted once in the root layout).
 * - First page of a session → a full visit (geo/IP/UA/referrer/device).
 * - Every route change → a page view (with the session id, for journeys).
 * - Engaged time per page (only counted while the tab is visible) is flushed
 *   on navigation and on page hide via sendBeacon (survives unload).
 */
function getSid(): string {
    let sid = sessionStorage.getItem('mftel_sid');
    if (!sid) {
        sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('mftel_sid', sid);
    }
    return sid;
}

export default function Analytics() {
    const pathname = usePathname();
    const st = useRef({ path: null as string | null, active: 0, lastVisible: 0, visible: true });

    // Persist engaged time of the current page (beacon survives unload).
    const flush = () => {
        const s = st.current;
        if (!s.path) return;
        if (s.visible) { s.active += Date.now() - s.lastVisible; s.lastVisible = Date.now(); }
        const ms = s.active;
        s.active = 0;
        if (ms < 250) return; // ignore trivial glances
        const body = JSON.stringify({ durationOnly: true, path: s.path, ms, sid: getSid() });
        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
            } else {
                fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
            }
        } catch { /* ignore */ }
    };

    // Route change → flush previous page, then record a page view.
    useEffect(() => {
        const s = st.current;
        if (s.path && s.path !== pathname) flush();
        s.path = pathname;
        s.active = 0;
        s.visible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
        s.lastVisible = Date.now();

        const firstVisit = !sessionStorage.getItem('mftel_tracked');
        if (firstVisit) sessionStorage.setItem('mftel_tracked', 'true');

        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer: document.referrer || '',
                path: pathname || '/',
                language: navigator.language || '',
                screen: typeof window.screen !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
                sid: getSid(),
                pageviewOnly: !firstVisit,
            }),
        }).catch(() => {});
    }, [pathname]);

    // Visibility + unload → maintain engaged time and flush.
    useEffect(() => {
        const onVis = () => {
            const s = st.current;
            if (document.visibilityState === 'hidden') {
                if (s.visible) { s.active += Date.now() - s.lastVisible; s.visible = false; }
                flush();
            } else {
                s.visible = true;
                s.lastVisible = Date.now();
            }
        };
        const onHide = () => flush();
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('pagehide', onHide);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('pagehide', onHide);
        };
    }, []);

    return null;
}
