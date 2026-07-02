import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(request: NextRequest) {
    try {
        // Check if Redis is configured
        if (!process.env.UPSTASH_REDIS_REST_URL) {
            console.log('Redis not configured');
            return NextResponse.json({ success: false, error: 'Redis not configured' });
        }

        // Client-supplied signals (best-effort; body may be absent for old callers).
        let clientMeta: { referrer?: string; path?: string; language?: string; screen?: string; pageviewOnly?: boolean } = {};
        try { clientMeta = await request.json(); } catch { clientMeta = {}; }

        // Every navigation is a page view (separate from once-per-session visits).
        const pvPath = (clientMeta.path || '/').substring(0, 80);
        await redis.hincrby('mftel:pageviews', pvPath, 1);
        await redis.incr('mftel:total_pageviews');
        if (clientMeta.pageviewOnly) {
            return NextResponse.json({ success: true, pageview: true });
        }

        // Get IP address
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

        // Get geolocation from Vercel headers (free, no external API needed)
        const country = request.headers.get('x-vercel-ip-country') || '';
        const city = request.headers.get('x-vercel-ip-city') || '';
        const region = request.headers.get('x-vercel-ip-country-region') || '';

        let location = {
            country: country || 'Unknown',
            city: city ? decodeURIComponent(city) : 'Unknown',
            region: region || 'Unknown'
        };

        // Fallback to ip-api.com if Vercel headers are missing (local dev)
        if (!country) {
            try {
                const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
                const geoData = await geoResponse.json();
                if (geoData.status === 'success') {
                    location = {
                        country: geoData.country || 'Unknown',
                        city: geoData.city || 'Unknown',
                        region: geoData.regionName || 'Unknown'
                    };
                }
            } catch {
                // Geolocation failed, use defaults
            }
        }

        // Normalize a referrer to its host (drop our own domain → treat as direct).
        let referrerHost = '';
        if (clientMeta.referrer) {
            try {
                const host = new URL(clientMeta.referrer).hostname.replace(/^www\./, '');
                if (!host.includes('mftel')) referrerHost = host;
            } catch { /* malformed referrer, ignore */ }
        }

        const visit = {
            ip: ip.substring(0, 10) + '***', // Partial IP for privacy
            country: location.country,
            city: location.city,
            region: location.region,
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent')?.substring(0, 180) || 'Unknown',
            referrer: referrerHost,
            path: (clientMeta.path || '').substring(0, 80),
            language: (clientMeta.language || '').substring(0, 12),
            screen: (clientMeta.screen || '').substring(0, 12),
        };

        // Store visit in Upstash Redis
        const today = new Date().toISOString().split('T')[0];

        // Increment total count
        await redis.incr('mftel:total_visits');

        // Increment daily count
        await redis.incr(`mftel:daily:${today}`);

        // Increment country count
        await redis.hincrby('mftel:countries', location.country, 1);

        // Unique visitors via HyperLogLog (probabilistic; stores no raw IP).
        // Full IP feeds the sketch for accuracy; only a partial IP is persisted above.
        await redis.pfadd('mftel:uniq:all', ip);
        await redis.pfadd(`mftel:uniq:day:${today}`, ip);

        // Store recent visits (keep last 1000 for detailed breakdowns)
        await redis.lpush('mftel:recent_visits', JSON.stringify(visit));
        await redis.ltrim('mftel:recent_visits', 0, 999);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
