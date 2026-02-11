import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '../lib/auth';

const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = isRedisConfigured ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}) : null;

// In-memory fallback for local dev
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

async function delKey(key: string): Promise<void> {
    if (redis) {
        await redis.del(key);
    } else {
        delete localStore[key];
    }
}

const PREFIX = 'mftel:dashboard:';
const LOG_PREFIX = 'mftel:log:';
const BACKUP_PREFIX = 'mftel:backup:';

const ALL_SECTIONS = [
    "announcements", "papers", "experiments", "todos", "conferences",
    "lectures", "patents", "vacations", "schedule", "timetable",
    "reports", "teams", "dailyTargets", "philosophy", "resources",
    "ideas", "analyses", "chatPosts", "customEmojis", "statusMessages",
    "equipmentList", "personalMemos", "analysisToolList", "paperTagList", "members",
    "dispatches"
];

const MAX_LOG_ENTRIES = 5000;

// GET - Retrieve admin dashboard data
export async function GET(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        // 1. Access Logs
        if (action === 'accessLogs') {
            const days = parseInt(searchParams.get('days') || '7', 10);
            const raw = await getKey(`${LOG_PREFIX}access`);
            const allLogs: Array<{ userName: string; action: "login" | "logout"; timestamp: number; duration?: number }> = raw ? JSON.parse(raw) : [];

            const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
            const logs = allLogs.filter(log => log.timestamp >= cutoff);

            return NextResponse.json({ logs });
        }

        // 2. Modification Logs
        if (action === 'modLogs') {
            const days = parseInt(searchParams.get('days') || '7', 10);
            const raw = await getKey(`${LOG_PREFIX}modifications`);
            const allLogs: Array<{ userName: string; section: string; action: string; timestamp: number; detail?: string }> = raw ? JSON.parse(raw) : [];

            const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
            const logs = allLogs.filter(log => log.timestamp >= cutoff);

            return NextResponse.json({ logs });
        }

        // 3. Backups list
        if (action === 'backups') {
            const raw = await getKey(`${BACKUP_PREFIX}list`);
            const backups: Array<{ date: string; size: number; auto: boolean }> = raw ? JSON.parse(raw) : [];

            return NextResponse.json({ backups });
        }

        // 4. Members
        if (action === 'members') {
            const raw = await getKey(`${PREFIX}members`);
            const members: Record<string, { team: string; role: string; emoji: string }> = raw ? JSON.parse(raw) : {};

            return NextResponse.json({ members });
        }

        return NextResponse.json({ error: 'Invalid action parameter. Use: accessLogs, modLogs, backups, members' }, { status: 400 });
    } catch (error) {
        console.error('Dashboard Admin GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// POST - Admin operations
export async function POST(request: NextRequest) {
    const auth = await validateToken(request);
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { action } = body;

        // 1. Log access event
        if (action === 'logAccess') {
            const { userName, type, duration } = body as {
                userName: string;
                type: "login" | "logout";
                duration?: number;
                action: string;
            };

            if (!userName || !type) {
                return NextResponse.json({ error: 'userName and type are required' }, { status: 400 });
            }

            const raw = await getKey(`${LOG_PREFIX}access`);
            const logs: Array<{ userName: string; action: "login" | "logout"; timestamp: number; duration?: number }> = raw ? JSON.parse(raw) : [];

            const entry: { userName: string; action: "login" | "logout"; timestamp: number; duration?: number } = {
                userName,
                action: type,
                timestamp: Date.now(),
            };
            if (duration !== undefined) {
                entry.duration = duration;
            }

            logs.push(entry);

            // Trim to max entries
            const trimmed = logs.length > MAX_LOG_ENTRIES ? logs.slice(logs.length - MAX_LOG_ENTRIES) : logs;

            await setKey(`${LOG_PREFIX}access`, JSON.stringify(trimmed));
            return NextResponse.json({ success: true });
        }

        // 2. Log modification event
        if (action === 'logMod') {
            const { userName, section, modAction, detail } = body as {
                userName: string;
                section: string;
                modAction: string;
                detail?: string;
                action: string;
            };

            if (!userName || !section || !modAction) {
                return NextResponse.json({ error: 'userName, section, and modAction are required' }, { status: 400 });
            }

            const raw = await getKey(`${LOG_PREFIX}modifications`);
            const logs: Array<{ userName: string; section: string; action: string; timestamp: number; detail?: string }> = raw ? JSON.parse(raw) : [];

            const entry: { userName: string; section: string; action: string; timestamp: number; detail?: string } = {
                userName,
                section,
                action: modAction,
                timestamp: Date.now(),
            };
            if (detail !== undefined) {
                entry.detail = detail;
            }

            logs.push(entry);

            // Trim to max entries
            const trimmed = logs.length > MAX_LOG_ENTRIES ? logs.slice(logs.length - MAX_LOG_ENTRIES) : logs;

            await setKey(`${LOG_PREFIX}modifications`, JSON.stringify(trimmed));
            return NextResponse.json({ success: true });
        }

        // 3. Create backup
        if (action === 'backup') {
            const { auto } = body as { auto?: boolean; action: string };

            // Read all dashboard sections
            const results = await Promise.all(ALL_SECTIONS.map(k => getKey(`${PREFIX}${k}`)));
            const backupData: Record<string, unknown> = {};
            ALL_SECTIONS.forEach((k, i) => {
                backupData[k] = results[i] ? JSON.parse(results[i] as string) : null;
            });

            const now = new Date();
            const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
            const dateStr = kst.toISOString().slice(0, 10); // YYYY-MM-DD (KST)

            // Store the backup data
            const backupJson = JSON.stringify(backupData);
            await setKey(`${BACKUP_PREFIX}${dateStr}`, backupJson);

            // Update backup list
            const listRaw = await getKey(`${BACKUP_PREFIX}list`);
            const backupList: Array<{ date: string; size: number; auto: boolean }> = listRaw ? JSON.parse(listRaw) : [];

            // Remove existing entry for the same date if any
            const filtered = backupList.filter(b => b.date !== dateStr);
            filtered.push({
                date: dateStr,
                size: backupJson.length,
                auto: !!auto,
            });

            // Sort by date descending
            filtered.sort((a, b) => b.date.localeCompare(a.date));

            // If auto backup, cleanup old backups (older than 7 days)
            if (auto) {
                const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const cutoffStr = cutoffDate.toISOString().slice(0, 10);

                const toDelete = filtered.filter(b => b.date < cutoffStr);
                const remaining = filtered.filter(b => b.date >= cutoffStr);

                // Delete old backup data keys
                await Promise.all(toDelete.map(b => delKey(`${BACKUP_PREFIX}${b.date}`)));

                await setKey(`${BACKUP_PREFIX}list`, JSON.stringify(remaining));
            } else {
                await setKey(`${BACKUP_PREFIX}list`, JSON.stringify(filtered));
            }

            return NextResponse.json({ success: true, date: dateStr, size: backupJson.length });
        }

        // 4. Delete a specific backup (admin only)
        if (action === 'deleteBackup') {
            if (auth.userName !== '박일웅') return NextResponse.json({ error: '관리자만 백업을 삭제할 수 있습니다' }, { status: 403 });
            const { date } = body as { date: string; action: string };

            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 });
            }

            // Delete the backup data
            await delKey(`${BACKUP_PREFIX}${date}`);

            // Remove from backup list
            const listRaw = await getKey(`${BACKUP_PREFIX}list`);
            const backupList: Array<{ date: string; size: number; auto: boolean }> = listRaw ? JSON.parse(listRaw) : [];
            const updated = backupList.filter(b => b.date !== date);
            await setKey(`${BACKUP_PREFIX}list`, JSON.stringify(updated));

            return NextResponse.json({ success: true });
        }

        // 5. Restore backup (destructive - admin only)
        if (action === 'restore') {
            if (auth.userName !== '박일웅') return NextResponse.json({ error: '관리자만 백업을 복원할 수 있습니다' }, { status: 403 });
            const { date } = body as { date: string; action: string };
            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required for restore' }, { status: 400 });
            }

            const backupRaw = await getKey(`${BACKUP_PREFIX}${date}`);
            if (!backupRaw) {
                return NextResponse.json({ error: `Backup not found for date: ${date}` }, { status: 404 });
            }

            const backupData: Record<string, unknown> = JSON.parse(backupRaw);

            // Only restore known sections
            await Promise.all(
                ALL_SECTIONS.filter(section => section in backupData).map(section =>
                    setKey(`${PREFIX}${section}`, JSON.stringify(backupData[section]))
                )
            );

            return NextResponse.json({ success: true, message: `Backup from ${date} restored successfully` });
        }

        // 6. Save members
        if (action === 'saveMembers') {
            const { members } = body as {
                members: Record<string, { team: string; role: string; emoji: string }>;
                action: string;
            };

            if (!members) {
                return NextResponse.json({ error: 'Members data is required' }, { status: 400 });
            }

            await setKey(`${PREFIX}members`, JSON.stringify(members));
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action. Use: logAccess, logMod, backup, deleteBackup, saveMembers, restore' }, { status: 400 });
    } catch (error) {
        console.error('Dashboard Admin POST error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
