import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for local development
const localMessages: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    timestamp: string;
    read: boolean;
}> = [];

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

const ADMIN_PASSWORD = process.env.ANALYTICS_PASSWORD || 'mftel2024admin';

// POST - Save new message
export async function POST(request: NextRequest) {
    try {
        const { name, email, message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const messageData = {
            id: Date.now().toString(),
            name: name || 'Anonymous',
            email: email || 'Not provided',
            message,
            timestamp: new Date().toISOString(),
            read: false
        };

        if (redis) {
            // Production: Use Redis
            await redis.lpush('mftel:messages', JSON.stringify(messageData));
            await redis.incr('mftel:total_messages');
            await redis.incr('mftel:unread_messages');
        } else {
            // Local development: Use in-memory storage
            localMessages.unshift(messageData);
        }

        return NextResponse.json({ success: true, id: messageData.id });
    } catch (error) {
        console.error('Message save error:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}

// GET - Retrieve messages (admin only)
export async function GET(request: NextRequest) {
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (redis) {
            // Production: Use Redis
            const messages = await redis.lrange('mftel:messages', 0, -1) || [];
            const parsedMessages = messages.map((m: string | object) => {
                if (typeof m === 'string') {
                    try {
                        return JSON.parse(m);
                    } catch {
                        return m;
                    }
                }
                return m;
            });

            const totalMessages = await redis.get('mftel:total_messages') || 0;
            const unreadMessages = await redis.get('mftel:unread_messages') || 0;

            return NextResponse.json({
                messages: parsedMessages,
                totalMessages: Number(totalMessages),
                unreadMessages: Number(unreadMessages)
            });
        } else {
            // Local development: Use in-memory storage
            const unreadCount = localMessages.filter(m => !m.read).length;

            return NextResponse.json({
                messages: localMessages,
                totalMessages: localMessages.length,
                unreadMessages: unreadCount
            });
        }
    } catch (error) {
        console.error('Message fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// PATCH - Mark message as read
export async function PATCH(request: NextRequest) {
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { messageId } = await request.json();

        if (redis) {
            // Production: Use Redis
            const messages = await redis.lrange('mftel:messages', 0, -1) || [];

            let updated = false;
            const updatedMessages = messages.map((m: string | object) => {
                const msg = typeof m === 'string' ? JSON.parse(m) : m;
                if (msg.id === messageId && !msg.read) {
                    msg.read = true;
                    updated = true;
                }
                return JSON.stringify(msg);
            });

            if (updated) {
                await redis.del('mftel:messages');
                if (updatedMessages.length > 0) {
                    await redis.rpush('mftel:messages', ...updatedMessages);
                }
                await redis.decr('mftel:unread_messages');
            }
        } else {
            // Local development: Use in-memory storage
            const msg = localMessages.find(m => m.id === messageId);
            if (msg && !msg.read) {
                msg.read = true;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message update error:', error);
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
}
