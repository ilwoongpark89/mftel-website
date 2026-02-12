"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type AccessLog = { userName: string; action: "login" | "logout"; timestamp: number; duration?: number; ip?: string; ua?: string; location?: string };
type BackupInfo = { date: string; size: number; auto: boolean };
type Member = { team: string; role: string; emoji: string };

// ─── Shared utilities ───────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("mftel-auth-token") : null;
    return token ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } : { "Content-Type": "application/json" };
}

const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const fmtDuration = (ms?: number) => {
    if (!ms) return "-";
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}분`;
    return `${Math.floor(mins / 60)}시간 ${mins % 60}분`;
};

const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

// ═══════════════════════════════════════════════════════════════════════════
// 1) 멤버 관리 — Member + Password merged
// ═══════════════════════════════════════════════════════════════════════════

export function AdminMemberView() {
    const [members, setMembers] = useState<Record<string, Member>>({});
    const [loading, setLoading] = useState(true);
    const [pwStatus, setPwStatus] = useState<Record<string, { hasPassword: boolean; isDefault: boolean }>>({});
    const [pwLoading, setPwLoading] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editMode, setEditMode] = useState<"add" | "edit" | null>(null);
    const [editOrigName, setEditOrigName] = useState("");

    const fetchMembers = useCallback(async () => {
        try {
            const r = await fetch("/api/dashboard-admin?action=members", { headers: getAuthHeaders() });
            const d = await r.json();
            const m = d.members || {};
            setMembers(m);
        } catch { /* ignore */ }
    }, []);

    const fetchPasswordStatus = useCallback(async () => {
        try {
            const r = await fetch("/api/dashboard-auth", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "getPasswordStatus" }) });
            const d = await r.json();
            if (d.status) setPwStatus(d.status);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchMembers(), fetchPasswordStatus()]).finally(() => setLoading(false));
    }, [fetchMembers, fetchPasswordStatus]);

    const handleSaveMembers = async (updated: Record<string, Member>) => {
        setMembers(updated);
        await fetch("/api/dashboard-admin", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "saveMembers", members: updated }) });
    };

    const handleAddMember = async () => {
        if (!editName.trim()) return;
        const name = editName.trim();
        const updated = { ...members, [name]: { team: members[name]?.team || "", role: members[name]?.role || "", emoji: members[name]?.emoji || "👤" } };
        await handleSaveMembers(updated);
        try { await fetch("/api/dashboard-auth", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "syncMember", added: [name] }) }); } catch {}
        setEditMode(null); resetEdit();
    };

    const handleEditMember = () => {
        if (!editName.trim()) return;
        const updated = { ...members };
        if (editOrigName !== editName.trim()) delete updated[editOrigName];
        updated[editName.trim()] = { team: members[editOrigName]?.team || "", role: members[editOrigName]?.role || "", emoji: members[editOrigName]?.emoji || "👤" };
        handleSaveMembers(updated);
        setEditMode(null); resetEdit();
    };

    const handleDeleteMember = async (name: string) => {
        if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) return;
        const updated = { ...members };
        delete updated[name];
        await handleSaveMembers(updated);
        try { await fetch("/api/dashboard-auth", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "syncMember", removed: [name] }) }); } catch {}
    };

    const handleResetPassword = async (name: string) => {
        if (!confirm(`${name}의 비밀번호를 초기화(0000)하시겠습니까?`)) return;
        setPwLoading(name);
        try {
            await fetch("/api/dashboard-auth", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "resetPassword", adminPassword: "1009", targetUser: name }) });
            await fetchPasswordStatus();
        } catch { alert("비밀번호 리셋 실패"); }
        setPwLoading(null);
    };

    const handleInitAllPasswords = async () => {
        if (!confirm("비밀번호가 없는 모든 멤버에게 초기 비밀번호(0000)를 부여하시겠습니까?")) return;
        setPwLoading("__all");
        try {
            const res = await fetch("/api/dashboard-auth", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "initPasswords" }) });
            const data = await res.json();
            alert(`${data.initialized || 0}명에게 초기 비밀번호가 부여되었습니다`);
            await fetchPasswordStatus();
        } catch { alert("초기화 실패"); }
        setPwLoading(null);
    };

    const resetEdit = () => { setEditName(""); setEditOrigName(""); };

    if (loading) return <div className="text-center py-12 text-slate-400 text-[13px]">로딩 중...</div>;

    const memberEntries = Object.entries(members);

    return (
        <div className="space-y-6">
            {/* Member Management */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-bold text-slate-800">멤버 목록</h3>
                    <button onClick={() => { setEditMode("add"); resetEdit(); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700">+ 멤버 추가</button>
                </div>
                {editMode && (
                    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                        <h4 className="text-[14px] font-bold mb-3">{editMode === "add" ? "멤버 추가" : "멤버 수정"}</h4>
                        <div>
                            <label className="text-[11px] text-slate-500 block mb-1">이름</label>
                            <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full max-w-[300px] border border-slate-200 rounded-lg px-2 py-1.5 text-[12px]" placeholder="홍길동" onKeyDown={e => e.key === "Enter" && (editMode === "add" ? handleAddMember() : handleEditMember())} autoFocus />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">팀 배정과 역할은 팀 관리에서, 이모지는 설정에서 관리합니다.</p>
                        <div className="flex gap-2 mt-3">
                            <button onClick={editMode === "add" ? handleAddMember : handleEditMember} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700">{editMode === "add" ? "추가" : "저장"}</button>
                            <button onClick={() => { setEditMode(null); resetEdit(); }} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">취소</button>
                        </div>
                    </div>
                )}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px]">
                        <thead><tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-2 text-left font-semibold text-slate-500">이름</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-500">비밀번호</th>
                            <th className="px-4 py-2 text-right font-semibold text-slate-500">작업</th>
                        </tr></thead>
                        <tbody>
                            {memberEntries.map(([name]) => {
                                const st = pwStatus[name];
                                return (
                                    <tr key={name} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium">{name}</td>
                                        <td className="px-4 py-2">
                                            {!st || !st.hasPassword ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">미설정</span>
                                                : st.isDefault ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">초기값(0000)</span>
                                                : <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">변경됨</span>}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => { setEditMode("edit"); setEditOrigName(name); setEditName(name); }} className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded mr-1">수정</button>
                                            <button onClick={() => handleResetPassword(name)} disabled={pwLoading === name} className="px-2 py-1 text-[11px] text-amber-600 hover:bg-amber-50 rounded mr-1 disabled:opacity-50">{pwLoading === name ? "..." : "PW 리셋"}</button>
                                            <button onClick={() => handleDeleteMember(name)} className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded">삭제</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {memberEntries.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">저장된 멤버가 없습니다</div>}
                </div>
            </div>

            {/* Password Bulk Actions */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-bold text-slate-800">비밀번호 일괄 관리</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchPasswordStatus} className="px-3 py-1 bg-slate-100 rounded-lg text-[12px] hover:bg-slate-200">새로고침</button>
                        <button onClick={handleInitAllPasswords} disabled={pwLoading === "__all"} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700 disabled:opacity-60">{pwLoading === "__all" ? "처리 중..." : "전체 초기화"}</button>
                    </div>
                </div>
                <p className="text-[12px] text-slate-400">비밀번호가 없는 멤버에게만 초기 비밀번호(0000)를 부여합니다. 리셋 시 해당 멤버의 세션도 함께 만료됩니다.</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2) 백업 관리
// ═══════════════════════════════════════════════════════════════════════════

export function AdminBackupView() {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBackups = useCallback(async () => {
        try {
            const r = await fetch("/api/dashboard-admin?action=backups", { headers: getAuthHeaders() });
            const d = await r.json();
            setBackups(d.backups || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchBackups().finally(() => setLoading(false));
    }, [fetchBackups]);

    const handleBackup = async () => {
        setLoading(true);
        try {
            await fetch("/api/dashboard-admin", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "backup" }) });
            await fetchBackups();
        } catch { alert("백업 생성 실패"); }
        setLoading(false);
    };

    const handleDeleteBackup = async (date: string) => {
        if (!confirm(`${date} 백업을 삭제하시겠습니까?`)) return;
        try {
            await fetch("/api/dashboard-admin", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "deleteBackup", date }) });
            await fetchBackups();
        } catch { alert("백업 삭제 실패"); }
    };

    const handleRestore = async (date: string) => {
        if (!confirm(`${date} 백업으로 복원하시겠습니까? 현재 데이터가 덮어씌워집니다.`)) return;
        setLoading(true);
        try {
            const res = await fetch("/api/dashboard-admin", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ action: "restore", date }) });
            const data = await res.json();
            if (data.success) alert("복원 완료");
            else alert(`복원 실패: ${data.error || "알 수 없는 오류"}`);
        } catch { alert("복원 실패: 네트워크 오류"); }
        setLoading(false);
    };

    if (loading) return <div className="text-center py-12 text-slate-400 text-[13px]">로딩 중...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[15px] font-bold text-slate-800">백업 목록</h3>
                    <p className="text-[12px] text-slate-400 mt-1">매일 오전 5시(KST) 자동 백업 / 7일 보관</p>
                </div>
                <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700">수동 백업 생성</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2 text-left font-semibold text-slate-500">날짜</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-500">유형</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-500">크기</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-500">작업</th>
                    </tr></thead>
                    <tbody>
                        {backups.map(b => (
                            <tr key={b.date} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium">{b.date}</td>
                                <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.auto ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{b.auto ? "자동" : "수동"}</span></td>
                                <td className="px-4 py-2 text-slate-500">{fmtSize(b.size)}</td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => handleRestore(b.date)} className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded mr-1">복원</button>
                                    <button onClick={() => handleDeleteBackup(b.date)} className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded">삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {backups.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">백업이 없습니다</div>}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3) 접속 로그 — Redesigned: grouped by member with weekly stats
// ═══════════════════════════════════════════════════════════════════════════

type Session = { userName: string; loginTime: number; logoutTime?: number; duration?: number; ip?: string; ua?: string; location?: string; timedOut?: boolean };

function buildSessions(accessLogs: AccessLog[]): Session[] {
    const sessions: Session[] = [];
    const chronoLogs = [...accessLogs].reverse();
    for (const log of chronoLogs) {
        if (log.action === "login") {
            for (let j = sessions.length - 1; j >= 0; j--) {
                if (sessions[j].userName === log.userName && !sessions[j].logoutTime) {
                    sessions[j].logoutTime = sessions[j].loginTime;
                    sessions[j].duration = 0;
                    sessions[j].timedOut = true;
                    break;
                }
            }
            sessions.push({ userName: log.userName, loginTime: log.timestamp, ip: log.ip, ua: log.ua, location: log.location });
        } else {
            for (let j = sessions.length - 1; j >= 0; j--) {
                if (sessions[j].userName === log.userName && !sessions[j].logoutTime) {
                    sessions[j].logoutTime = log.timestamp;
                    sessions[j].duration = log.duration || (log.timestamp - sessions[j].loginTime);
                    break;
                }
            }
        }
    }
    const STALE_MS = 30 * 60 * 1000;
    const now = Date.now();
    for (const s of sessions) {
        if (!s.logoutTime && now - s.loginTime > STALE_MS) {
            s.logoutTime = now;
            s.duration = now - s.loginTime;
            s.timedOut = true;
        }
    }
    sessions.reverse();
    return sessions;
}

export function AdminAccessLogView() {
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(true);
    const [ipLocations, setIpLocations] = useState<Record<string, string>>({});
    const ipLookupDone = useRef<Set<string>>(new Set());
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`/api/dashboard-admin?action=accessLogs&days=${days}`, { headers: getAuthHeaders() });
            const d = await r.json();
            setAccessLogs(d.logs || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, [days]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => {
        if (accessLogs.length === 0) return;
        const ips = [...new Set(accessLogs.map(l => l.ip).filter((ip): ip is string => !!ip && ip !== "unknown"))];
        const newIps = ips.filter(ip => !ipLookupDone.current.has(ip));
        if (newIps.length === 0) return;
        newIps.forEach(ip => ipLookupDone.current.add(ip));
        fetch("/api/ip-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ips: newIps }),
        })
            .then(r => r.json())
            .then(d => { if (d.locations) setIpLocations(prev => ({ ...prev, ...d.locations })); })
            .catch(() => {});
    }, [accessLogs]);

    const sessions = buildSessions(accessLogs);
    const isMobile = (ua?: string) => !ua ? null : /Mobile|Android|iPhone|iPad|iPod/i.test(ua);

    // Group sessions by user
    const byUser: Record<string, Session[]> = {};
    for (const s of sessions) {
        if (!byUser[s.userName]) byUser[s.userName] = [];
        byUser[s.userName].push(s);
    }

    // Weekly stats helper
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    type UserStat = {
        name: string;
        weeklyLogins: number;
        weeklyTime: number;
        totalLogins: number;
        totalTime: number;
        lastLogin: number;
        isOnline: boolean;
        sessions: Session[];
    };

    const userStats: UserStat[] = Object.entries(byUser).map(([name, userSessions]) => {
        const weeklySessions = userSessions.filter(s => s.loginTime >= weekAgo);
        const weeklyTime = weeklySessions.filter(s => s.duration && s.duration > 0 && !s.timedOut).reduce((a, s) => a + (s.duration || 0), 0);
        const totalTime = userSessions.filter(s => s.duration && s.duration > 0 && !s.timedOut).reduce((a, s) => a + (s.duration || 0), 0);
        const lastLogin = userSessions.length > 0 ? userSessions[0].loginTime : 0;
        const isOnline = userSessions.some(s => !s.logoutTime && !s.timedOut);
        return {
            name,
            weeklyLogins: weeklySessions.length,
            weeklyTime,
            totalLogins: userSessions.length,
            totalTime,
            lastLogin,
            isOnline,
            sessions: userSessions,
        };
    }).sort((a, b) => b.weeklyTime - a.weeklyTime);

    // Summary
    const uniqueUsers = userStats.length;
    const totalSessions = sessions.length;
    const durations = sessions.filter(s => s.duration && s.duration > 0 && !s.timedOut).map(s => s.duration!);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const totalTime = durations.reduce((a, b) => a + b, 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-slate-800">접속 현황</h3>
                <div className="flex items-center gap-2">
                    <select value={days} onChange={e => setDays(Number(e.target.value))} className="border border-slate-200 rounded-lg px-2 py-1 text-[12px]">
                        <option value={1}>1일</option><option value={3}>3일</option><option value={7}>7일</option><option value={14}>14일</option><option value={30}>30일</option>
                    </select>
                    <button onClick={fetchLogs} className="px-3 py-1 bg-slate-100 rounded-lg text-[12px] hover:bg-slate-200">새로고침</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400 text-[13px]">로딩 중...</div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-[20px] font-bold text-blue-600">{uniqueUsers}</div><div className="text-[11px] text-slate-400">접속 인원</div></div>
                        <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-[20px] font-bold text-green-600">{totalSessions}</div><div className="text-[11px] text-slate-400">총 세션</div></div>
                        <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-[20px] font-bold text-purple-600">{fmtDuration(avgDuration)}</div><div className="text-[11px] text-slate-400">평균 접속시간</div></div>
                        <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-[20px] font-bold text-amber-600">{fmtDuration(totalTime)}</div><div className="text-[11px] text-slate-400">총 접속시간</div></div>
                    </div>

                    {/* Member cards — grouped by user */}
                    <div className="space-y-2">
                        {userStats.map(u => {
                            const isExpanded = expandedUser === u.name;
                            return (
                                <div key={u.name} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    {/* Summary row */}
                                    <button onClick={() => setExpandedUser(isExpanded ? null : u.name)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {u.isOnline && <span className="relative flex h-2 w-2 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
                                            <span className="text-[13px] font-semibold text-slate-800 truncate">{u.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0 text-[12px]">
                                            <div className="text-center">
                                                <div className="font-bold text-blue-600">{u.weeklyLogins}</div>
                                                <div className="text-[10px] text-slate-400">주간 접속</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-purple-600">{fmtDuration(u.weeklyTime)}</div>
                                                <div className="text-[10px] text-slate-400">주간 시간</div>
                                            </div>
                                            <div className="text-center hidden md:block">
                                                <div className="font-bold text-slate-600">{u.totalLogins}</div>
                                                <div className="text-[10px] text-slate-400">총 접속</div>
                                            </div>
                                            <div className="text-center hidden md:block">
                                                <div className="font-bold text-amber-600">{fmtDuration(u.totalTime)}</div>
                                                <div className="text-[10px] text-slate-400">총 시간</div>
                                            </div>
                                            <span className="text-slate-400 text-[14px]">{isExpanded ? "▾" : "▸"}</span>
                                        </div>
                                    </button>
                                    {/* Expanded detail: individual sessions */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100">
                                            <table className="w-full text-[12px]">
                                                <thead><tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="px-4 py-1.5 text-left font-semibold text-slate-500">기기</th>
                                                    <th className="px-4 py-1.5 text-left font-semibold text-slate-500">로그인</th>
                                                    <th className="px-4 py-1.5 text-left font-semibold text-slate-500">로그아웃</th>
                                                    <th className="px-4 py-1.5 text-left font-semibold text-slate-500">접속시간</th>
                                                    <th className="px-4 py-1.5 text-left font-semibold text-slate-500 hidden md:table-cell">IP</th>
                                                    <th className="px-4 py-1.5 text-left font-semibold text-slate-500 hidden md:table-cell">위치</th>
                                                </tr></thead>
                                                <tbody>
                                                    {u.sessions.slice(0, 50).map((s, i) => (
                                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                                                            <td className="px-4 py-1.5 text-center" title={s.ua || ""}>{isMobile(s.ua) === null ? <span className="text-slate-300">-</span> : isMobile(s.ua) ? <span className="text-[14px]" title="모바일">📱</span> : <span className="text-[14px]" title="PC">💻</span>}</td>
                                                            <td className="px-4 py-1.5 text-slate-500">{fmtTime(s.loginTime)}</td>
                                                            <td className="px-4 py-1.5 text-slate-500">{s.timedOut ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">시간초과</span> : s.logoutTime ? fmtTime(s.logoutTime) : <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">접속중</span>}</td>
                                                            <td className="px-4 py-1.5 text-slate-600 font-medium">{s.timedOut ? <span className="text-slate-300">-</span> : s.duration ? fmtDuration(s.duration) : "-"}</td>
                                                            <td className="px-4 py-1.5 text-slate-400 text-[11px] font-mono hidden md:table-cell">{s.ip || "-"}</td>
                                                            <td className="px-4 py-1.5 text-slate-500 text-[11px] hidden md:table-cell">{s.location ? <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{s.location}</span> : s.ip && ipLocations[s.ip] ? <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{ipLocations[s.ip]}</span> : <span className="text-slate-300">-</span>}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {u.sessions.length > 50 && <div className="text-center py-2 text-slate-400 text-[11px]">최근 50건만 표시</div>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {userStats.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">접속 로그가 없습니다</div>}
                    </div>
                </>
            )}
        </div>
    );
}
