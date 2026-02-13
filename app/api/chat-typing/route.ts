import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '../lib/auth';

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

// In-memory fallback for local dev
const localTyping: Record<string, number> = {};

// Use a single Redis hash instead of individual keys + SCAN
// Hash: mftel:dashboard:typing → { "section:user": timestamp, ... }
const TYPING_HASH = 'mftel:dashboard:typing';
const TYPING_TTL_MS = 5000; // 5 seconds (slightly longer than poll interval)

// POST - Report that user is typing
export async function POST(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { section, user } = await request.json();
        if (!section || !user) {
            return NextResponse.json({ error: 'section and user required' }, { status: 400 });
        }

        const field = `${section}:${user}`;

        if (redis) {
            await redis.hset(TYPING_HASH, { [field]: Date.now() });
        } else {
            localTyping[field] = Date.now();
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Chat typing POST error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// GET - Check who's typing in a section
export async function GET(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const currentUser = searchParams.get('user');

    if (!section) {
        return NextResponse.json({ error: 'section required' }, { status: 400 });
    }

    try {
        const typingUsers: string[] = [];
        const now = Date.now();
        const prefix = `${section}:`;

        if (redis) {
            // 1 hgetall instead of SCAN — O(1) command count
            const all = await redis.hgetall(TYPING_HASH) as Record<string, string | number> | null;
            if (all) {
                const staleFields: string[] = [];
                for (const [field, ts] of Object.entries(all)) {
                    const timestamp = typeof ts === 'number' ? ts : parseInt(String(ts), 10);
                    if (now - timestamp > TYPING_TTL_MS) {
                        staleFields.push(field); // collect stale entries for cleanup
                        continue;
                    }
                    if (field.startsWith(prefix)) {
                        const userName = field.slice(prefix.length);
                        if (userName && userName !== currentUser) {
                            typingUsers.push(userName);
                        }
                    }
                }
                // Lazy cleanup of stale entries (fire-and-forget)
                if (staleFields.length > 0) {
                    redis.hdel(TYPING_HASH, ...staleFields).catch(() => {});
                }
            }
        } else {
            // Local dev fallback
            for (const [field, ts] of Object.entries(localTyping)) {
                if (now - ts > TYPING_TTL_MS) { delete localTyping[field]; continue; }
                if (field.startsWith(prefix)) {
                    const userName = field.slice(prefix.length);
                    if (userName && userName !== currentUser) {
                        typingUsers.push(userName);
                    }
                }
            }
        }

        return NextResponse.json({ typing: typingUsers });
    } catch (error) {
        console.error('Chat typing GET error:', error);
        return NextResponse.json({ typing: [] });
    }
}
