import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

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

const DASHBOARD_PREFIX = 'mftel:dashboard:';
const LOG_PREFIX = 'mftel:log:';
const MAX_LOG_ENTRIES = 5000;

const ALLOWED_SECTIONS = new Set([
    "announcements", "papers", "experiments", "todos", "conferences",
    "lectures", "patents", "vacations", "schedule", "timetable",
    "reports", "teams", "dailyTargets", "philosophy", "resources",
    "ideas", "analyses", "chatPosts", "customEmojis", "statusMessages",
    "equipmentList", "personalMemos", "personalFiles", "piChat", "teamMemos", "labChat", "labBoard", "labFiles", "meetings", "analysisToolList", "paperTagList",
    "members", "online", "dispatches", "readReceipts", "pushPrefs", "experimentLogs", "analysisLogs", "experimentLogCategories", "analysisLogCategories",
]);

async function appendLog(logKey: string, entry: Record<string, unknown>) {
    const raw = await getKey(logKey);
    let logs: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
    logs.unshift({ ...entry, timestamp: Date.now() });
    if (logs.length > MAX_LOG_ENTRIES) logs = logs.slice(0, MAX_LOG_ENTRIES);
    await setKey(logKey, JSON.stringify(logs));
}

// GET - Retrieve dashboard data
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    try {
        if (section === 'online') {
            // Get online users
            const raw = await getKey(`${DASHBOARD_PREFIX}online`);
            const users = raw ? JSON.parse(raw) : [];
            // Filter to only users active in last 30s
            const now = Date.now();
            const active = users.filter((u: { name: string; timestamp: number }) => now - u.timestamp < 30000);
            return NextResponse.json({ users: active });
        }

        if (section === 'logs') {
            const raw = await getKey(`${LOG_PREFIX}modifications`);
            return NextResponse.json({ data: raw ? JSON.parse(raw) : [] });
        }

        if (section === 'all') {
            // Return all dashboard data at once
            const keys = ["announcements","papers","experiments","todos","conferences","lectures","patents","vacations","schedule","timetable","reports","teams","dailyTargets","philosophy","resources","ideas","analyses","chatPosts","customEmojis","statusMessages","equipmentList","personalMemos","personalFiles","piChat","teamMemos","labChat","labBoard","labFiles","meetings","analysisToolList","paperTagList","members","dispatches","readReceipts","pushPrefs","experimentLogs","analysisLogs","experimentLogCategories","analysisLogCategories"];
            const results = await Promise.all(keys.map(k => getKey(`${DASHBOARD_PREFIX}${k}`)));
            const out: Record<string, unknown> = {};
            keys.forEach((k, i) => { out[k] = results[i] ? JSON.parse(results[i] as string) : null; });
            return NextResponse.json(out);
        }

        if (section) {
            const data = await getKey(`${DASHBOARD_PREFIX}${section}`);
            return NextResponse.json({ data: data ? JSON.parse(data) : null });
        }

        return NextResponse.json({ error: 'Section parameter required' }, { status: 400 });
    } catch (error) {
        console.error('Dashboard GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// POST - Update dashboard data
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { section, data, action, userName } = body;

        if (!section) {
            return NextResponse.json({ error: 'Section required' }, { status: 400 });
        }

        if (!ALLOWED_SECTIONS.has(section)) {
            return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }

        // Handle online presence
        if (section === 'online') {
            const raw = await getKey(`${DASHBOARD_PREFIX}online`);
            let users = raw ? JSON.parse(raw) : [];

            // Extract client IP, User-Agent, and geolocation for logging
            const forwarded = request.headers.get('x-forwarded-for');
            const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'unknown');
            const ua = request.headers.get('user-agent') || '';
            const geoCountry = request.headers.get('x-vercel-ip-country') || '';
            const geoCity = request.headers.get('x-vercel-ip-city') || '';
            const location = geoCity ? `${decodeURIComponent(geoCity)}, ${geoCountry}` : geoCountry || '';

            if (action === 'join') {
                users = users.filter((u: { name: string }) => u.name !== userName);
                const now = Date.now();
                users.push({ name: userName, timestamp: now, joinedAt: now });
                await appendLog(`${LOG_PREFIX}access`, { userName, action: 'login', ip, ua, location });
            } else if (action === 'leave') {
                const found = users.find((u: { name: string }) => u.name === userName);
                const duration = found?.joinedAt ? Date.now() - found.joinedAt : (found ? Date.now() - found.timestamp : undefined);
                users = users.filter((u: { name: string }) => u.name !== userName);
                await appendLog(`${LOG_PREFIX}access`, { userName, action: 'logout', duration, ip, ua, location });
            } else {
                // heartbeat — only update timestamp (for freshness check), preserve joinedAt
                users = users.map((u: { name: string; timestamp: number; joinedAt?: number }) =>
                    u.name === userName ? { ...u, timestamp: Date.now() } : u
                );
            }

            await setKey(`${DASHBOARD_PREFIX}online`, JSON.stringify(users));
            return NextResponse.json({ success: true });
        }

        // Save section data
        await setKey(`${DASHBOARD_PREFIX}${section}`, JSON.stringify(data));
        // Log modification (skip frequent/noisy sections)
        if (userName && !['online', 'readReceipts'].includes(section)) {
            await appendLog(`${LOG_PREFIX}modifications`, { userName, section, action: 'update' });
        }

        // Fire-and-forget push notifications for all meaningful sections
        const PUSH_SILENT = new Set(['online', 'readReceipts', 'statusMessages', 'customEmojis', 'members', 'pushPrefs']);
        if (userName && !PUSH_SILENT.has(section)) {
            const pushUrl = new URL('/api/push/send', request.url);
            try {
                const membersRaw = await getKey(`${DASHBOARD_PREFIX}members`);
                const membersData = membersRaw ? JSON.parse(membersRaw) : {};
                const allMembers = Object.keys(membersData);

                // Load per-user push preferences
                const prefsRaw = await getKey(`${DASHBOARD_PREFIX}pushPrefs`);
                const pushPrefs: Record<string, Record<string, boolean>> = prefsRaw ? JSON.parse(prefsRaw) : {};

                // Map section → push category
                const PUSH_CATEGORY: Record<string, string> = {
                    labChat: 'chat', teamMemos: 'chat', piChat: 'chat',
                    announcements: 'announcement',
                    labBoard: 'board', labFiles: 'board',
                    papers: 'research', reports: 'research', experiments: 'research', analyses: 'research', patents: 'research',
                };
                const category = PUSH_CATEGORY[section] || 'other';

                // Filter users who have this category enabled (default: all on)
                const filterByPrefs = (users: string[]) =>
                    users.filter(u => {
                        const prefs = pushPrefs[u];
                        if (!prefs) return true; // no prefs = all enabled
                        return prefs[category] !== false; // explicit false = disabled
                    });

                const SECTION_LABELS: Record<string, string> = {
                    labChat: '연구실 채팅에 새 메시지',
                    announcements: '공지사항을 등록했습니다',
                    teamMemos: '팀 메모에 새 메시지',
                    piChat: '1:1 메시지가 도착했습니다',
                    papers: '논문을 업데이트했습니다',
                    reports: '보고서를 업데이트했습니다',
                    experiments: '실험을 업데이트했습니다',
                    analyses: '해석을 업데이트했습니다',
                    patents: '특허를 업데이트했습니다',
                    todos: '할일을 업데이트했습니다',
                    schedule: '일정을 업데이트했습니다',
                    timetable: '시간표를 업데이트했습니다',
                    conferences: '학회 정보를 업데이트했습니다',
                    lectures: '강의를 업데이트했습니다',
                    vacations: '휴가를 업데이트했습니다',
                    dailyTargets: '일일 목표를 업데이트했습니다',
                    ideas: '아이디어를 업데이트했습니다',
                    resources: '자료를 업데이트했습니다',
                    equipmentList: '장비 목록을 업데이트했습니다',
                    meetings: '회의를 업데이트했습니다',
                    labBoard: '게시판에 새 글을 작성했습니다',
                    labFiles: '파일을 업데이트했습니다',
                    dispatches: '파견을 업데이트했습니다',
                    philosophy: '연구 철학을 업데이트했습니다',
                    teams: '팀 구성을 업데이트했습니다',
                    personalMemos: '개인 메모를 업데이트했습니다',
                    personalFiles: '개인 파일을 업데이트했습니다',
                    chatPosts: '게시물을 업데이트했습니다',
                    analysisToolList: '해석 도구를 업데이트했습니다',
                    paperTagList: '논문 태그를 업데이트했습니다',
                };

                if (section === 'piChat') {
                    const piChatData = data as Record<string, unknown[]>;
                    const targetPeople = Object.keys(piChatData);
                    const targets = filterByPrefs([...new Set([...targetPeople, '박일웅'])]);
                    fetch(pushUrl.toString(), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targetUsers: targets,
                            excludeUser: userName,
                            title: `${userName}`,
                            body: SECTION_LABELS.piChat,
                            tag: 'piChat',
                        }),
                    }).catch(() => {});
                } else {
                    const filteredMembers = filterByPrefs(allMembers);
                    const body = SECTION_LABELS[section] || `${section}을(를) 업데이트했습니다`;
                    fetch(pushUrl.toString(), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targetUsers: filteredMembers,
                            excludeUser: userName,
                            title: `${userName}`,
                            body,
                            tag: section,
                        }),
                    }).catch(() => {});
                }
            } catch {} // push is best-effort
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Dashboard POST error:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
