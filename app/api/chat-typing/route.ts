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

const TYPING_TTL = 4; // seconds
const KEY_PREFIX = 'mftel:dashboard:typing:';

// POST - Report that user is typing
export async function POST(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { section, user } = await request.json();
        if (!section || !user) {
            return NextResponse.json({ error: 'section and user required' }, { status: 400 });
        }

        const key = `${KEY_PREFIX}${section}:${user}`;

        if (redis) {
            await redis.set(key, '1', { ex: TYPING_TTL });
        } else {
            // Local dev fallback with manual TTL tracking
            localTyping[key] = Date.now() + TYPING_TTL * 1000;
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

        if (redis) {
            // Scan for keys matching the section pattern
            const pattern = `${KEY_PREFIX}${section}:*`;
            let cursor = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 50 });
                cursor = typeof nextCursor === 'number' ? nextCursor : Number(nextCursor);
                for (const key of keys) {
                    const userName = (key as string).replace(`${KEY_PREFIX}${section}:`, '');
                    if (userName && userName !== currentUser) {
                        typingUsers.push(userName);
                    }
                }
            } while (cursor !== 0);
        } else {
            // Local dev fallback
            const now = Date.now();
            const prefix = `${KEY_PREFIX}${section}:`;
            for (const [key, expiry] of Object.entries(localTyping)) {
                if (key.startsWith(prefix) && expiry > now) {
                    const userName = key.replace(prefix, '');
                    if (userName && userName !== currentUser) {
                        typingUsers.push(userName);
                    }
                } else if (expiry <= now) {
                    delete localTyping[key];
                }
            }
        }

        return NextResponse.json({ typing: typingUsers });
    } catch (error) {
        console.error('Chat typing GET error:', error);
        return NextResponse.json({ typing: [] });
    }
}
