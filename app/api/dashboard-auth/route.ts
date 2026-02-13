import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { loginLimiter, getClientIp, validateToken } from '../lib/auth';

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
    if (redis) { await redis.set(key, value); } else { localStore[key] = value; }
}

const PW_KEY = 'mftel:dashboard:passwords';
const SESSION_KEY = 'mftel:dashboard:sessions';
const MEMBERS_KEY = 'mftel:dashboard:members';
const SALT = 'mftel-lab-2024-salt';

async function hashPassword(pw: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(SALT + pw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

type Passwords = Record<string, string>; // { name: hashedPw }
type Sessions = Record<string, { userName: string; expiresAt: number }>; // { token: {...} }

async function getPasswords(): Promise<Passwords> {
    const raw = await getKey(PW_KEY);
    return raw ? JSON.parse(raw) : {};
}

async function setPasswords(pw: Passwords): Promise<void> {
    await setKey(PW_KEY, JSON.stringify(pw));
}

async function getSessions(): Promise<Sessions> {
    const raw = await getKey(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
}

async function setSessions(s: Sessions): Promise<void> {
    await setKey(SESSION_KEY, JSON.stringify(s));
    // Invalidate the in-memory session cache used by validateToken
    try { const { invalidateSessionCache } = await import('../lib/auth'); invalidateSessionCache(); } catch {}
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // --- login ---
        if (action === 'login') {
            if (loginLimiter) {
                const ip = getClientIp(request);
                const { success } = await loginLimiter.limit(ip);
                if (!success) return NextResponse.json({ error: '로그인 시도가 너무 많습니다. 1분 후 다시 시도해주세요.' }, { status: 429 });
            }

            const { userName, password } = body as { userName: string; password: string; action: string };
            if (!userName || password === undefined) {
                return NextResponse.json({ error: '이름과 비밀번호가 필요합니다' }, { status: 400 });
            }
            let passwords = await getPasswords();

            // Auto-initialize passwords if none exist yet
            if (Object.keys(passwords).length === 0) {
                const membersRaw = await getKey(MEMBERS_KEY);
                const members: Record<string, unknown> = membersRaw ? JSON.parse(membersRaw) : {};
                const defaultHash = await hashPassword('0000');
                for (const name of Object.keys(members)) {
                    passwords[name] = defaultHash;
                }
                await setPasswords(passwords);
            }

            // If user still has no password (not in members list), create one on the fly
            if (!passwords[userName]) {
                const defaultHash = await hashPassword('0000');
                passwords[userName] = defaultHash;
                await setPasswords(passwords);
            }

            const hashed = await hashPassword(password);
            if (passwords[userName] !== hashed) {
                return NextResponse.json({ error: '비밀번호가 틀렸습니다' }, { status: 401 });
            }

            const defaultHash = await hashPassword('0000');
            const isDefaultPassword = passwords[userName] === defaultHash;

            const token = generateToken();
            const sessions = await getSessions();
            sessions[token] = { userName, expiresAt: Date.now() + THIRTY_DAYS };
            await setSessions(sessions);

            return NextResponse.json({ success: true, token, userName, isDefaultPassword });
        }

        // --- validateSession ---
        if (action === 'validateSession') {
            const { token } = body as { token: string; action: string };
            if (!token) return NextResponse.json({ error: '토큰이 필요합니다' }, { status: 400 });

            const sessions = await getSessions();
            const session = sessions[token];

            if (!session || session.expiresAt < Date.now()) {
                if (session) { delete sessions[token]; await setSessions(sessions); }
                return NextResponse.json({ valid: false });
            }

            const passwords = await getPasswords();
            const defaultHash = await hashPassword('0000');
            const isDefaultPassword = passwords[session.userName] === defaultHash;

            return NextResponse.json({ valid: true, userName: session.userName, isDefaultPassword });
        }

        // --- logout ---
        if (action === 'logout') {
            const { token } = body as { token: string; action: string };
            if (token) {
                const sessions = await getSessions();
                delete sessions[token];
                await setSessions(sessions);
            }
            return NextResponse.json({ success: true });
        }

        // --- changePassword ---
        if (action === 'changePassword') {
            const { userName, currentPassword, newPassword } = body as { userName: string; currentPassword: string; newPassword: string; action: string };
            if (!userName || !currentPassword || !newPassword) {
                return NextResponse.json({ error: '모든 필드가 필요합니다' }, { status: 400 });
            }
            if (newPassword.length < 4) {
                return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다' }, { status: 400 });
            }

            const passwords = await getPasswords();
            const currentHash = await hashPassword(currentPassword);

            if (!passwords[userName] || passwords[userName] !== currentHash) {
                return NextResponse.json({ error: '현재 비밀번호가 틀렸습니다' }, { status: 401 });
            }

            passwords[userName] = await hashPassword(newPassword);
            await setPasswords(passwords);

            return NextResponse.json({ success: true });
        }

        // --- resetPassword (admin) ---
        if (action === 'resetPassword') {
            const { adminPassword, targetUser } = body as { adminPassword: string; targetUser: string; action: string };
            if (adminPassword !== (process.env.DASHBOARD_ADMIN_PASSWORD || '1009')) {
                return NextResponse.json({ error: '관리자 비밀번호가 틀렸습니다' }, { status: 401 });
            }
            if (!targetUser) {
                return NextResponse.json({ error: '대상 사용자가 필요합니다' }, { status: 400 });
            }

            const passwords = await getPasswords();
            passwords[targetUser] = await hashPassword('0000');
            await setPasswords(passwords);

            // Remove user sessions
            const sessions = await getSessions();
            const updated: Sessions = {};
            for (const [t, s] of Object.entries(sessions)) {
                if (s.userName !== targetUser) updated[t] = s;
            }
            await setSessions(updated);

            return NextResponse.json({ success: true });
        }

        // --- initPasswords (bulk init for members without passwords) ---
        if (action === 'initPasswords') {
            const auth = await validateToken(request);
            if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const membersRaw = await getKey(MEMBERS_KEY);
            const members: Record<string, unknown> = membersRaw ? JSON.parse(membersRaw) : {};
            const passwords = await getPasswords();
            const defaultHash = await hashPassword('0000');
            let count = 0;

            for (const name of Object.keys(members)) {
                if (!passwords[name]) {
                    passwords[name] = defaultHash;
                    count++;
                }
            }
            await setPasswords(passwords);

            return NextResponse.json({ success: true, initialized: count });
        }

        // --- syncMember (called by admin when adding/removing members) ---
        if (action === 'syncMember') {
            const auth = await validateToken(request);
            if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const { added, removed } = body as { added?: string[]; removed?: string[]; action: string };
            const passwords = await getPasswords();
            const sessions = await getSessions();
            const defaultHash = await hashPassword('0000');

            if (added) {
                for (const name of added) {
                    if (!passwords[name]) passwords[name] = defaultHash;
                }
            }

            if (removed) {
                for (const name of removed) {
                    delete passwords[name];
                }
                // Clean up sessions for removed users
                for (const [token, session] of Object.entries(sessions)) {
                    if (removed.includes(session.userName)) delete sessions[token];
                }
            }

            await setPasswords(passwords);
            await setSessions(sessions);
            return NextResponse.json({ success: true });
        }

        // --- getPasswordStatus (admin: check which members have passwords) ---
        if (action === 'getPasswordStatus') {
            const auth = await validateToken(request);
            if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const membersRaw = await getKey(MEMBERS_KEY);
            const members: Record<string, unknown> = membersRaw ? JSON.parse(membersRaw) : {};
            const passwords = await getPasswords();
            const defaultHash = await hashPassword('0000');

            const status: Record<string, { hasPassword: boolean; isDefault: boolean }> = {};
            for (const name of Object.keys(members)) {
                status[name] = {
                    hasPassword: !!passwords[name],
                    isDefault: passwords[name] === defaultHash,
                };
            }

            return NextResponse.json({ status });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Dashboard Auth error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
