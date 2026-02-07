import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

// In-memory fallback for local dev
const localStore: Record<string, string> = {};

async function getKey(key: string): Promise<string | null> {
    if (redis) {
        return await redis.get(key);
    }
    return localStore[key] || null;
}

async function setKey(key: string, value: string): Promise<void> {
    if (redis) {
        await redis.set(key, value);
    } else {
        localStore[key] = value;
    }
}

const DASHBOARD_PREFIX = 'mftel:dashboard:';
const LOG_PREFIX = 'mftel:log:';
const MAX_LOG_ENTRIES = 5000;

async function appendLog(logKey: string, entry: Record<string, unknown>) {
    const raw = await getKey(logKey);
    let logs: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
    logs.unshift({ ...entry, timestamp: Date.now() });
    if (logs.length > MAX_LOG_ENTRIES) logs = logs.slice(0, MAX_LOG_ENTRIES);
    await setKey(logKey, JSON.stringify(logs));
}

// GET - Retrieve dashboard data
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    try {
        if (section === 'online') {
            // Get online users
            const raw = await getKey(`${DASHBOARD_PREFIX}online`);
            const users = raw ? JSON.parse(raw) : [];
            // Filter to only users active in last 30s
            const now = Date.now();
            const active = users.filter((u: { name: string; timestamp: number }) => now - u.timestamp < 30000);
            return NextResponse.json({ users: active });
        }

        if (section === 'all') {
            // Return all dashboard data at once
            const keys = ["announcements","papers","experiments","todos","conferences","lectures","patents","vacations","schedule","timetable","reports","teams","dailyTargets","philosophy","resources","ideas","analyses","chatPosts","customEmojis","statusMessages","equipmentList","personalMemos","analysisToolList","paperTagList","members"];
            const results = await Promise.all(keys.map(k => getKey(`${DASHBOARD_PREFIX}${k}`)));
            const out: Record<string, unknown> = {};
            keys.forEach((k, i) => { out[k] = results[i] ? JSON.parse(results[i] as string) : null; });
            return NextResponse.json(out);
        }

        if (section) {
            const data = await getKey(`${DASHBOARD_PREFIX}${section}`);
            return NextResponse.json({ data: data ? JSON.parse(data) : null });
        }

        return NextResponse.json({ error: 'Section parameter required' }, { status: 400 });
    } catch (error) {
        console.error('Dashboard GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// POST - Update dashboard data
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { section, data, action, userName } = body;

        if (!section) {
            return NextResponse.json({ error: 'Section required' }, { status: 400 });
        }

        // Handle online presence
        if (section === 'online') {
            const raw = await getKey(`${DASHBOARD_PREFIX}online`);
            let users = raw ? JSON.parse(raw) : [];

            // Extract client IP for logging
            const forwarded = request.headers.get('x-forwarded-for');
            const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'unknown');

            if (action === 'join') {
                users = users.filter((u: { name: string }) => u.name !== userName);
                users.push({ name: userName, timestamp: Date.now() });
                await appendLog(`${LOG_PREFIX}access`, { userName, action: 'login', ip });
            } else if (action === 'leave') {
                const found = users.find((u: { name: string }) => u.name === userName);
                const duration = found ? Date.now() - found.timestamp : undefined;
                users = users.filter((u: { name: string }) => u.name !== userName);
                await appendLog(`${LOG_PREFIX}access`, { userName, action: 'logout', duration, ip });
            } else {
                // heartbeat
                users = users.map((u: { name: string; timestamp: number }) =>
                    u.name === userName ? { ...u, timestamp: Date.now() } : u
                );
            }

            await setKey(`${DASHBOARD_PREFIX}online`, JSON.stringify(users));
            return NextResponse.json({ success: true });
        }

        // Save section data
        await setKey(`${DASHBOARD_PREFIX}${section}`, JSON.stringify(data));
        // Log modification (skip frequent/noisy sections)
        if (userName && !['online'].includes(section)) {
            await appendLog(`${LOG_PREFIX}modifications`, { userName, section, action: 'update' });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Dashboard POST error:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
