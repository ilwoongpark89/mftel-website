import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest } from 'next/server';

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

const SESSION_KEY = 'mftel:dashboard:sessions';

type Sessions = Record<string, { userName: string; expiresAt: number }>;

export async function validateToken(req: NextRequest): Promise<{ valid: boolean; userName?: string }> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return { valid: false };
    const token = authHeader.slice(7);
    if (!token) return { valid: false };

    // Local dev fallback (no Redis)
    if (!redis) return { valid: true, userName: 'dev' };

    const raw = await redis.get(SESSION_KEY);
    const sessions: Sessions = raw
        ? (typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Sessions)
        : {};
    const session = sessions[token];

    if (!session || session.expiresAt < Date.now()) return { valid: false };
    return { valid: true, userName: session.userName };
}

export const loginLimiter = redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1m'), prefix: 'ratelimit:login' })
    : null;

export const dashboardLimiter = redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1m'), prefix: 'ratelimit:dashboard' })
    : null;

export function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    return forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown');
}
