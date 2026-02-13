import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MessageData {
    id: string;
    name: string;
    email: string;
    message: string;
    timestamp: string;
    read: boolean;
}

// ---------------------------------------------------------------------------
// In-memory storage for local development
// ---------------------------------------------------------------------------
const localMessages: MessageData[] = [];

// ---------------------------------------------------------------------------
// Redis setup
// ---------------------------------------------------------------------------
const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

const ADMIN_PASSWORD = process.env.ANALYTICS_PASSWORD || 'mftel2024admin';

// Redis keys
const HASH_KEY = 'mftel:messages';          // Hash: { [id]: JSON }
const TOTAL_KEY = 'mftel:total_messages';
const UNREAD_KEY = 'mftel:unread_messages';
const MIGRATED_KEY = 'mftel:messages_migrated'; // flag: "1" after migration

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a value that may already be an object (Upstash auto-deserializes). */
function parseMessage(raw: string | object): MessageData {
    if (typeof raw === 'string') {
        return JSON.parse(raw);
    }
    return raw as MessageData;
}

/**
 * One-time migration: if the old List key still exists, convert every entry
 * into the new Hash layout and flip the migrated flag.
 *
 * Because the old List and the new Hash share the same Redis key name
 * (`mftel:messages`), we need to:
 *   1. Read all entries from the List.
 *   2. Delete the List key.
 *   3. Write them back as Hash fields.
 */
async function migrateIfNeeded(r: Redis): Promise<void> {
    const alreadyMigrated = await r.get(MIGRATED_KEY);
    if (alreadyMigrated === '1' || alreadyMigrated === 1) return;

    // Check if the key is a list (TYPE returns "list" / "hash" / "none")
    const keyType = await r.type(HASH_KEY);

    if (keyType === 'list') {
        // Read all entries from the old list
        const entries: (string | object)[] = await r.lrange(HASH_KEY, 0, -1) || [];
        // Delete the old list
        await r.del(HASH_KEY);

        if (entries.length > 0) {
            // Upstash hset accepts an object: { field: value, ... }
            const obj: Record<string, string> = {};
            for (const entry of entries) {
                const msg = parseMessage(entry);
                obj[msg.id] = JSON.stringify(msg);
            }
            await r.hset(HASH_KEY, obj);
        }

        // Recompute counters from the actual data
        const all = await r.hgetall(HASH_KEY) as Record<string, string | object> | null;
        if (all) {
            let total = 0;
            let unread = 0;
            for (const val of Object.values(all)) {
                const msg = parseMessage(val);
                total++;
                if (!msg.read) unread++;
            }
            await r.set(TOTAL_KEY, total);
            await r.set(UNREAD_KEY, unread);
        }
    }

    // Mark migration complete (also covers the "none" / fresh-start case)
    await r.set(MIGRATED_KEY, '1');
}

/** Get all messages from the Hash, sorted newest-first by timestamp. */
async function getAllMessages(r: Redis): Promise<MessageData[]> {
    await migrateIfNeeded(r);

    const raw = await r.hgetall(HASH_KEY) as Record<string, string | object> | null;
    if (!raw) return [];

    const messages: MessageData[] = [];
    for (const val of Object.values(raw)) {
        messages.push(parseMessage(val));
    }

    // Sort newest first (descending timestamp)
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return messages;
}

// ---------------------------------------------------------------------------
// POST - Save new message
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        const { name, email, message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const messageData: MessageData = {
            id: Date.now().toString(),
            name: name || 'Anonymous',
            email: email || 'Not provided',
            message,
            timestamp: new Date().toISOString(),
            read: false
        };

        if (redis) {
            await migrateIfNeeded(redis);
            await redis.hset(HASH_KEY, { [messageData.id]: JSON.stringify(messageData) });
            await redis.incr(TOTAL_KEY);
            await redis.incr(UNREAD_KEY);
        } else {
            localMessages.unshift(messageData);
        }

        return NextResponse.json({ success: true, id: messageData.id });
    } catch (error) {
        console.error('Message save error:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}

// ---------------------------------------------------------------------------
// GET - Retrieve messages (admin only)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (redis) {
            const messages = await getAllMessages(redis);

            const totalMessages = await redis.get(TOTAL_KEY) || 0;
            const unreadMessages = await redis.get(UNREAD_KEY) || 0;

            return NextResponse.json({
                messages,
                totalMessages: Number(totalMessages),
                unreadMessages: Number(unreadMessages)
            });
        } else {
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

// ---------------------------------------------------------------------------
// PATCH - Mark message as read
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { messageId } = await request.json();

        if (redis) {
            await migrateIfNeeded(redis);

            // Read only the single message field from the hash
            const raw = await redis.hget(HASH_KEY, messageId) as string | object | null;

            if (raw) {
                const msg = parseMessage(raw);
                if (!msg.read) {
                    msg.read = true;
                    await redis.hset(HASH_KEY, { [messageId]: JSON.stringify(msg) });
                    await redis.decr(UNREAD_KEY);
                }
            }
        } else {
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

// ---------------------------------------------------------------------------
// DELETE - Delete a single message
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
    const password = request.headers.get('x-admin-password');
    if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { messageId } = await request.json();

        if (redis) {
            await migrateIfNeeded(redis);

            // Read the message first so we can adjust counters
            const raw = await redis.hget(HASH_KEY, messageId) as string | object | null;

            if (raw) {
                const msg = parseMessage(raw);
                await redis.hdel(HASH_KEY, messageId);
                await redis.decr(TOTAL_KEY);
                if (!msg.read) {
                    await redis.decr(UNREAD_KEY);
                }
            }
        } else {
            const idx = localMessages.findIndex(m => m.id === messageId);
            if (idx !== -1) {
                localMessages.splice(idx, 1);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message delete error:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
