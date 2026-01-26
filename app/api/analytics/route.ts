import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ADMIN_PASSWORD = process.env.ANALYTICS_PASSWORD || 'mftel2024admin';

export async function GET(request: NextRequest) {
    // Check password
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL) {
        return NextResponse.json({
            error: 'Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.',
            totalVisits: 0,
            countries: {},
            recentVisits: [],
            dailyStats: {}
        });
    }

    // Get period from query params (default 7 days)
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '7');

    try {
        // Get total visits
        const totalVisits = await redis.get('mftel:total_visits') || 0;

        // Get country stats
        const countries = await redis.hgetall('mftel:countries') || {};

        // Get recent visits
        const recentVisits = await redis.lrange('mftel:recent_visits', 0, 99) || [];
        const parsedVisits = recentVisits.map((v: string | object) => {
            if (typeof v === 'string') {
                try {
                    return JSON.parse(v);
                } catch {
                    return v;
                }
            }
            return v;
        });

        // Filter visits by period
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - period);
        periodStart.setHours(0, 0, 0, 0);

        const filteredVisits = parsedVisits.filter((visit: { timestamp?: string }) => {
            if (!visit.timestamp) return false;
            const visitDate = new Date(visit.timestamp);
            return visitDate >= periodStart;
        });

        // Calculate country stats for the period
        const periodCountries: Record<string, number> = {};
        filteredVisits.forEach((visit: { country?: string }) => {
            if (visit.country) {
                periodCountries[visit.country] = (periodCountries[visit.country] || 0) + 1;
            }
        });

        // Get daily stats for the period
        const dailyStats: Record<string, number> = {};
        for (let i = 0; i < period; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = await redis.get(`mftel:daily:${dateStr}`) || 0;
            dailyStats[dateStr] = Number(count);
        }

        // Calculate period total
        const periodTotal = Object.values(dailyStats).reduce((sum, count) => sum + count, 0);

        return NextResponse.json({
            totalVisits: Number(totalVisits),
            periodTotal,
            countries: periodCountries,
            allCountries: countries,
            recentVisits: filteredVisits,
            dailyStats,
            period
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
