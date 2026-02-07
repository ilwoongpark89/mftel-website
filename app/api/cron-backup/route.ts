import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

const localStore: Record<string, string> = {};
async function getKey(key: string): Promise<string | null> {
    if (redis) return await redis.get(key);
    return localStore[key] || null;
}
async function setKey(key: string, value: string): Promise<void> {
    if (redis) await redis.set(key, value);
    else localStore[key] = value;
}
async function delKey(key: string): Promise<void> {
    if (redis) await redis.del(key);
    else delete localStore[key];
}

const PREFIX = 'mftel:dashboard:';
const BACKUP_PREFIX = 'mftel:backup:';
const ALL_KEYS = ["announcements","papers","experiments","todos","conferences","lectures","patents","vacations","schedule","timetable","reports","teams","dailyTargets","philosophy","resources","ideas","analyses","chatPosts","customEmojis","statusMessages","equipmentList","personalMemos","analysisToolList","paperTagList","members"];

export async function GET() {
    try {
        // Check authorization via cron secret (optional - for Vercel cron)
        // Read all sections
        const results = await Promise.all(ALL_KEYS.map(k => getKey(`${PREFIX}${k}`)));
        const snapshot: Record<string, unknown> = {};
        ALL_KEYS.forEach((k, i) => { snapshot[k] = results[i] ? JSON.parse(results[i] as string) : null; });

        // Save backup with today's date (KST)
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const dateStr = kst.toISOString().slice(0, 10);

        await setKey(`${BACKUP_PREFIX}${dateStr}`, JSON.stringify(snapshot));

        // Update backup list
        const listRaw = await getKey(`${BACKUP_PREFIX}list`);
        let list: Array<{ date: string; size: number; auto: boolean }> = listRaw ? JSON.parse(listRaw) : [];
        list = list.filter(b => b.date !== dateStr);
        list.unshift({ date: dateStr, size: JSON.stringify(snapshot).length, auto: true });

        // Cleanup backups older than 7 days
        const cutoff = new Date(kst.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const expired = list.filter(b => b.date < cutoff);
        for (const b of expired) {
            await delKey(`${BACKUP_PREFIX}${b.date}`);
        }
        list = list.filter(b => b.date >= cutoff);

        await setKey(`${BACKUP_PREFIX}list`, JSON.stringify(list));

        return NextResponse.json({ success: true, date: dateStr, expiredCount: expired.length });
    } catch (error) {
        console.error('Cron backup error:', error);
        return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
    }
}
