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

        // Get IP address
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

        // Get geolocation from IP (using free service)
        let location = { country: 'Unknown', city: 'Unknown', region: 'Unknown' };

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

        const visit = {
            ip: ip.substring(0, 10) + '***', // Partial IP for privacy
            country: location.country,
            city: location.city,
            region: location.region,
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'Unknown'
        };

        // Store visit in Upstash Redis
        const today = new Date().toISOString().split('T')[0];

        // Increment total count
        await redis.incr('mftel:total_visits');

        // Increment daily count
        await redis.incr(`mftel:daily:${today}`);

        // Increment country count
        await redis.hincrby('mftel:countries', location.country, 1);

        // Store recent visits (keep last 100)
        await redis.lpush('mftel:recent_visits', JSON.stringify(visit));
        await redis.ltrim('mftel:recent_visits', 0, 99);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
