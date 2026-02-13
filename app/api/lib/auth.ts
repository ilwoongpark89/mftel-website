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

// ─── In-memory session cache (avoids Redis read on every API call) ──────────
let cachedSessions: Sessions | null = null;
let sessionsCacheTime = 0;
const SESSION_CACHE_TTL = 60_000; // 60 seconds

async function getSessions(): Promise<Sessions> {
    const now = Date.now();
    if (cachedSessions && now - sessionsCacheTime < SESSION_CACHE_TTL) {
        return cachedSessions;
    }
    if (!redis) return {};
    const raw = await redis.get(SESSION_KEY);
    cachedSessions = raw
        ? (typeof raw === 'string' ? JSON.parse(raw) : raw as unknown as Sessions)
        : {};
    sessionsCacheTime = now;
    return cachedSessions!;
}

// Call this after writing sessions to invalidate cache
export function invalidateSessionCache() {
    cachedSessions = null;
    sessionsCacheTime = 0;
}

export async function validateToken(req: NextRequest): Promise<{ valid: boolean; userName?: string }> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return { valid: false };
    const token = authHeader.slice(7);
    if (!token) return { valid: false };

    if (!redis) return { valid: true, userName: 'dev' };

    const sessions = await getSessions();
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
