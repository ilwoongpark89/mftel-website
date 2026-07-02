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
        let clientMeta: { referrer?: string; path?: string; language?: string; screen?: string; pageviewOnly?: boolean; durationOnly?: boolean; ms?: number; sid?: string; goalOnly?: boolean; goal?: string } = {};
        try { clientMeta = await request.json(); } catch { clientMeta = {}; }

        const pvPath = (clientMeta.path || '/').substring(0, 80);
        const sid = (clientMeta.sid || '').substring(0, 64);

        // Named goal micro-conversion (a recruiting-relevant click). Event names
        // only — no per-user identity, no PII.
        if (clientMeta.goalOnly) {
            const g = String(clientMeta.goal || '');
            if (['join', 'pdf', 'contact'].includes(g)) {
                const day = new Date().toISOString().split('T')[0];
                await redis.incr(`mftel:goal:${g}:total`);
                await redis.incr(`mftel:goal:${g}:${day}`);
            }
            return NextResponse.json({ success: true, goal: true });
        }

        // Engaged-time beacon: accumulate dwell (not a new page view).
        if (clientMeta.durationOnly) {
            const ms = Math.min(Math.max(Number(clientMeta.ms) || 0, 0), 30 * 60 * 1000); // clamp 0..30min
            if (ms > 0) {
                await redis.hincrby('mftel:dwell_ms', pvPath, ms);
                await redis.incrby('mftel:total_dwell_ms', ms);
                if (sid) await redis.hincrby(`mftel:sess:${sid}:m`, 'ms', ms);
            }
            return NextResponse.json({ success: true, duration: true });
        }

        // Every navigation is a page view (separate from once-per-session visits).
        await redis.hincrby('mftel:pageviews', pvPath, 1);
        await redis.incr('mftel:total_pageviews');
        // Append to the session journey (ordered path list, 1h TTL).
        if (sid) {
            await redis.rpush(`mftel:sess:${sid}`, pvPath);
            await redis.ltrim(`mftel:sess:${sid}`, 0, 49);
            await redis.expire(`mftel:sess:${sid}`, 3600);
        }
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

        // Session start bookkeeping (first page of the session): meta + recent list.
        if (sid) {
            const uaLow = (visit.userAgent || '').toLowerCase();
            const device = (/ipad|tablet/.test(uaLow) || (/android/.test(uaLow) && !/mobile/.test(uaLow)))
                ? 'Tablet'
                : (/mobi|iphone|ipod|windows phone/.test(uaLow) ? 'Mobile' : 'Desktop');
            await redis.hset(`mftel:sess:${sid}:m`, { c: location.country, d: device, t: visit.timestamp });
            await redis.expire(`mftel:sess:${sid}:m`, 3600);
            await redis.lpush('mftel:recent_sessions', sid);
            await redis.ltrim('mftel:recent_sessions', 0, 199);
        }

        // Store recent visits (keep last 1000 for detailed breakdowns)
        await redis.lpush('mftel:recent_visits', JSON.stringify(visit));
        await redis.ltrim('mftel:recent_visits', 0, 999);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
