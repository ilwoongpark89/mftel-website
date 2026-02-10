import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

const localStore: Record<string, string> = {};

async function getKey(key: string): Promise<string | null> {
    if (redis) {
        const val = await redis.get(key);
        if (val === null || val === undefined) return null;
        return typeof val === 'string' ? val : JSON.stringify(val);
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

const SUBS_KEY = 'mftel:push:subscriptions';

// POST: Save push subscription for a user
export async function POST(request: NextRequest) {
    try {
        const { userName, subscription } = await request.json();
        if (!userName || !subscription) {
            return NextResponse.json({ error: 'userName and subscription required' }, { status: 400 });
        }

        const raw = await getKey(SUBS_KEY);
        const subs: Record<string, unknown[]> = raw ? JSON.parse(raw) : {};

        // Store subscription per user (allow multiple devices)
        if (!subs[userName]) subs[userName] = [];
        // Deduplicate by endpoint
        const endpoint = subscription.endpoint;
        subs[userName] = subs[userName].filter((s: unknown) => (s as { endpoint: string }).endpoint !== endpoint);
        subs[userName].push(subscription);

        await setKey(SUBS_KEY, JSON.stringify(subs));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push subscribe error:', error);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
}
