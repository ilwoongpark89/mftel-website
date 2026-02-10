import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

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

// Lazy VAPID initialization (avoid module-level execution during build)
let vapidConfigured = false;
function ensureVapid(): boolean {
    if (vapidConfigured) return true;
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) return false;
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:ilwoongpark@inha.ac.kr',
        pub,
        priv,
    );
    vapidConfigured = true;
    return true;
}

// POST: Send push notification to target users
export async function POST(request: NextRequest) {
    try {
        const { targetUsers, title, body, tag, url, excludeUser } = await request.json();
        if (!targetUsers || !title) {
            return NextResponse.json({ error: 'targetUsers and title required' }, { status: 400 });
        }

        if (!ensureVapid()) {
            return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 });
        }

        const raw = await getKey(SUBS_KEY);
        const subs: Record<string, unknown[]> = raw ? JSON.parse(raw) : {};

        const payload = JSON.stringify({ title, body: body || '', tag: tag || 'mftel', url: url || '/team-dashboard' });
        const expiredEndpoints: { user: string; endpoint: string }[] = [];
        let sent = 0;

        for (const user of targetUsers as string[]) {
            if (user === excludeUser) continue;
            const userSubs = subs[user];
            if (!userSubs || userSubs.length === 0) continue;

            for (const sub of userSubs) {
                try {
                    await webpush.sendNotification(sub as webpush.PushSubscription, payload);
                    sent++;
                } catch (err: unknown) {
                    const statusCode = (err as { statusCode?: number })?.statusCode;
                    if (statusCode === 410 || statusCode === 404) {
                        expiredEndpoints.push({ user, endpoint: (sub as { endpoint: string }).endpoint });
                    }
                }
            }
        }

        // Clean up expired subscriptions
        if (expiredEndpoints.length > 0) {
            for (const { user, endpoint } of expiredEndpoints) {
                if (subs[user]) {
                    subs[user] = subs[user].filter((s: unknown) => (s as { endpoint: string }).endpoint !== endpoint);
                    if (subs[user].length === 0) delete subs[user];
                }
            }
            await setKey(SUBS_KEY, JSON.stringify(subs));
        }

        return NextResponse.json({ success: true, sent });
    } catch (error) {
        console.error('Push send error:', error);
        return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
    }
}
