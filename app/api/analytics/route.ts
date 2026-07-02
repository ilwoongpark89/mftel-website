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
        // Scalar counters (one round trip)
        const scalars = await redis.mget('mftel:total_visits', 'mftel:total_pageviews', 'mftel:total_dwell_ms') as (number | string | null)[];
        const totalVisits = Number(scalars?.[0] || 0);
        const totalPageViews = Number(scalars?.[1] || 0);
        const totalDwellMs = Number(scalars?.[2] || 0);

        // Country + page-view + dwell hashes
        const countries = await redis.hgetall('mftel:countries') || {};
        const pageViews = (await redis.hgetall('mftel:pageviews')) as Record<string, number> || {};
        const dwellMsByPath = (await redis.hgetall('mftel:dwell_ms')) as Record<string, number> || {};

        // Get recent visits (up to 1000 for detailed breakdowns)
        const recentVisits = await redis.lrange('mftel:recent_visits', 0, 999) || [];
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

        // Daily counts for this period + the preceding one, in a single mget.
        const dates: string[] = [];
        for (let i = 0; i < period * 2; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        const dayKeys = dates.map(d => `mftel:daily:${d}`) as [string, ...string[]];
        const dayCounts = dayKeys.length ? (await redis.mget(...dayKeys) as (number | string | null)[]) : [];
        const dailyStats: Record<string, number> = {};
        let periodTotal = 0;
        let prevPeriodTotal = 0;
        for (let i = 0; i < dates.length; i++) {
            const n = Number(dayCounts?.[i] || 0);
            if (i < period) { dailyStats[dates[i]] = n; periodTotal += n; }
            else { prevPeriodTotal += n; }
        }

        // Unique visitors via HyperLogLog (accurate all-time + period + per-day).
        let uniqueTotal = 0;
        let uniquePeriod = 0;
        const dailyUnique: Record<string, number> = {};
        try {
            uniqueTotal = await redis.pfcount('mftel:uniq:all');
            const periodUniqKeys = dates.slice(0, period).map(d => `mftel:uniq:day:${d}`) as [string, ...string[]];
            if (periodUniqKeys.length) uniquePeriod = await redis.pfcount(...periodUniqKeys);
            if (period <= 30) {
                for (let i = 0; i < period; i++) {
                    dailyUnique[dates[i]] = await redis.pfcount(`mftel:uniq:day:${dates[i]}`);
                }
            }
        } catch { /* HLL keys may not exist yet */ }

        // Per-page average engaged time (seconds) + global average.
        const pageDwell: Record<string, number> = {};
        for (const [p, count] of Object.entries(pageViews)) {
            const c = Number(count) || 0;
            const ms = Number(dwellMsByPath[p]) || 0;
            if (c > 0 && ms > 0) pageDwell[p] = Math.round(ms / c / 1000);
        }
        const avgDwellSec = totalPageViews > 0 ? Math.round(totalDwellMs / totalPageViews / 1000) : 0;

        // Recent session journeys (ordered page sequences).
        const sessions: Array<{ paths: string[]; country: string; device: string; ms: number; start: string }> = [];
        try {
            const sids = (await redis.lrange('mftel:recent_sessions', 0, 29)) as string[];
            const uniqSids = Array.from(new Set(sids)).slice(0, 25);
            if (uniqSids.length) {
                const pipe = redis.pipeline();
                uniqSids.forEach(sid => { pipe.lrange(`mftel:sess:${sid}`, 0, -1); pipe.hgetall(`mftel:sess:${sid}:m`); });
                const res = await pipe.exec();
                for (let i = 0; i < uniqSids.length; i++) {
                    const paths = (res[i * 2] as string[]) || [];
                    const meta = (res[i * 2 + 1] as Record<string, string> | null) || {};
                    if (!paths || !paths.length) continue;
                    sessions.push({ paths, country: meta?.c || 'Unknown', device: meta?.d || '', ms: Number(meta?.ms) || 0, start: meta?.t || '' });
                }
            }
        } catch { /* session keys may be absent */ }

        return NextResponse.json({
            totalVisits,
            totalPageViews,
            pageViews,
            pageDwell,
            avgDwellSec,
            sessions,
            periodTotal,
            prevPeriodTotal,
            uniqueTotal,
            uniquePeriod,
            dailyUnique,
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
