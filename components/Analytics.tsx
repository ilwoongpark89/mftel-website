"use client";

import { useEffect } from 'react';

export default function Analytics() {
    useEffect(() => {
        // Track visit on page load
        const trackVisit = async () => {
            try {
                await fetch('/api/track', {
                    method: 'POST',
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
