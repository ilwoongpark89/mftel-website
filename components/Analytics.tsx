"use client";

import { useEffect } from 'react';

export default function Analytics() {
    useEffect(() => {
        // Track visit on page load. Client-only signals (referrer/path/lang/screen)
        // ride along in the body — server headers cover geo/IP/UA.
        const trackVisit = async () => {
            try {
                await fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        referrer: document.referrer || '',
                        path: window.location.pathname || '/',
                        language: navigator.language || '',
                        screen: typeof window.screen !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
                    }),
                });
            } catch (error) {
                // Silently fail
                console.error('Failed to track visit:', error);
            }
        };

        // Only track once per session
        if (!sessionStorage.getItem('mftel_tracked')) {
            trackVisit();
            sessionStorage.setItem('mftel_tracked', 'true');
        }
    }, []);

    return null;
}
