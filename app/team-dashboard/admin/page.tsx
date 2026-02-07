"use client";

import { useState, useEffect, useCallback } from "react";

type AccessLog = { userName: string; action: "login" | "logout"; timestamp: number; duration?: number; ip?: string };
type ModLog = { userName: string; section: string; action: string; timestamp: number; detail?: string };
type BackupInfo = { date: string; size: number; auto: boolean };
type Member = { team: string; role: string; emoji: string };

const ADMIN_PW = "1009";

const DEFAULT_MEMBERS: Record<string, Member> = {
    "박일웅": { team: "PI", role: "교수", emoji: "👨‍🏫" },
    "용현진": { team: "액침냉각", role: "팀장", emoji: "💧" },
    "양재혁": { team: "시스템코드", role: "", emoji: "⚙️" },
    "송준범": { team: "TES", role: "팀장", emoji: "🔥" },
    "송상민": { team: "액침냉각", role: "", emoji: "🧪" },
    "김성진": { team: "액침냉각", role: "", emoji: "🔬" },
    "신현근": { team: "이상유동", role: "팀장", emoji: "🌊" },
    "고경주": { team: "시스템코드", role: "", emoji: "📐" },
    "김채연": { team: "액침냉각", role: "", emoji: "❄️" },
    "박은빈": { team: "이상유동", role: "", emoji: "🔄" },
    "김만호": { team: "액침냉각", role: "", emoji: "💻" },
    "정영준": { team: "액침냉각", role: "", emoji: "📊" },
    "현준환": { team: "TES", role: "", emoji: "🌡️" },
};

export default function AdminPage() {
    const [auth, setAuth] = useState(false);
    const [pw, setPw] = useState("");
    const [err, setErr] = useState("");
    const [tab, setTab] = useState<"access" | "mods" | "backups" | "members">("access");
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [modLogs, setModLogs] = useState<ModLog[]>([]);
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [members, setMembers] = useState<Record<string, Member>>({});
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);

    // Member editing state
    const [editName, setEditName] = useState("");
    const [editMode, setEditMode] = useState<"add" | "edit" | null>(null);
    const [editOrigName, setEditOrigName] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const [ar, mr] = await Promise.all([
                fetch(`/api/dashboard-admin?action=accessLogs&days=${days}`),
                fetch(`/api/dashboard-admin?action=modLogs&days=${days}`),
            ]);
            const ad = await ar.json();
            const md = await mr.json();
            setAccessLogs(ad.logs || []);
            setModLogs(md.logs || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, [days]);

    const fetchBackups = useCallback(async () => {
        try {
            const r = await fetch("/api/dashboard-admin?action=backups");
            const d = await r.json();
            setBackups(d.backups || []);
        } catch { /* ignore */ }
    }, []);

    const fetchMembers = useCallback(async () => {
        try {
            const r = await fetch("/api/dashboard-admin?action=members");
            const d = await r.json();
            const m = d.members || {};
            if (Object.keys(m).length === 0) {
                // Seed default members if none exist
                setMembers(DEFAULT_MEMBERS);
                await fetch("/api/dashboard-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveMembers", members: DEFAULT_MEMBERS }) });
            } else {
                setMembers(m);
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!auth) return;
        const t = setTimeout(() => {
            fetchLogs();
            fetchBackups();
            fetchMembers();
        }, 0);
        return () => clearTimeout(t);
    }, [auth, fetchLogs, fetchBackups, fetchMembers]);

    const handleBackup = async () => {
        setLoading(true);
        try {
            await fetch("/api/dashboard-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backup" }) });
            await fetchBackups();
        } catch { alert("백업 생성 실패"); }
        setLoading(false);
    };

    const handleDeleteBackup = async (date: string) => {
        if (!confirm(`${date} 백업을 삭제하시겠습니까?`)) return;
        try {
            await fetch("/api/dashboard-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteBackup", date }) });
            await fetchBackups();
        } catch { alert("백업 삭제 실패"); }
    };

    const handleRestore = async (date: string) => {
        if (!confirm(`${date} 백업으로 복원하시겠습니까? 현재 데이터가 덮어씌워집니다.`)) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard-admin?action=restore&date=${date}`);
            const data = await res.json();
            if (data.success) alert("복원 완료");
            else alert(`복원 실패: ${data.error || "알 수 없는 오류"}`);
        } catch { alert("복원 실패: 네트워크 오류"); }
        setLoading(false);
    };

    const handleSaveMembers = async (updated: Record<string, Member>) => {
        setMembers(updated);
        await fetch("/api/dashboard-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveMembers", members: updated }) });
    };

    const handleAddMember = () => {
        if (!editName.trim()) return;
        const updated = { ...members, [editName.trim()]: { team: members[editName.trim()]?.team || "", role: members[editName.trim()]?.role || "", emoji: members[editName.trim()]?.emoji || "👤" } };
        handleSaveMembers(updated);
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

    const handleDeleteMember = (name: string) => {
        if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) return;
        const updated = { ...members };
        delete updated[name];
        handleSaveMembers(updated);
    };

    const resetEdit = () => { setEditName(""); setEditOrigName(""); };

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

    const SECTION_LABELS: Record<string, string> = {
        papers: "논문", reports: "보고서", experiments: "실험", analyses: "해석",
        todos: "To-do", patents: "지재권", announcements: "공지", vacations: "휴가",
        schedule: "일정", timetable: "시간표", teams: "팀", dailyTargets: "오늘 목표",
        philosophy: "연구철학", resources: "자료", ideas: "아이디어", chatPosts: "잡담",
        customEmojis: "이모지", equipmentList: "장비", personalMemos: "개인메모",
        analysisToolList: "해석도구", paperTagList: "논문태그",
    };

    if (!auth) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>A</div>
                        <h1 className="text-xl font-bold text-slate-800">MFTEL Admin</h1>
                        <p className="text-[12px] text-slate-400 mt-1">관리자 전용</p>
                    </div>
                    <div className="space-y-3">
                        <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} placeholder="관리자 비밀번호" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-500/20" onKeyDown={e => { if (e.key === "Enter") { if (pw === ADMIN_PW) setAuth(true); else setErr("비밀번호가 틀렸습니다"); } }} />
                        {err && <p className="text-[12px] text-red-500">{err}</p>}
                        <button onClick={() => { if (pw === ADMIN_PW) setAuth(true); else setErr("비밀번호가 틀렸습니다"); }} className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>입장</button>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "access" as const, label: "접속 로그", icon: "🔐" },
        { id: "mods" as const, label: "수정 로그", icon: "📝" },
        { id: "backups" as const, label: "백업 관리", icon: "💾" },
        { id: "members" as const, label: "멤버 관리", icon: "👥" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            {/* Header */}
            <div className="bg-slate-900 px-4 md:px-7 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] font-extrabold text-white shadow-lg" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>A</div>
                    <div>
                        <div className="text-[16px] font-bold text-white tracking-tight">MFTEL Admin</div>
                        <div className="text-[10px] text-slate-500 tracking-wide">Dashboard Administration</div>
                    </div>
                </div>
                <a href="/team-dashboard" className="text-[12px] text-slate-400 hover:text-white transition-colors">← 대시보드로</a>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 px-4 md:px-7">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-all whitespace-nowrap ${tab === t.id ? "border-red-500 text-red-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                            <span>{t.icon}</span>{t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-6">
                {loading && <div className="text-center py-8 text-slate-400 text-[13px]">로딩 중...</div>}

                {/* Access Logs */}
                {tab === "access" && !loading && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[16px] font-bold">🔐 접속 로그</h2>
                            <div className="flex items-center gap-2">
                                <select value={days} onChange={e => setDays(Number(e.target.value))} className="border border-slate-200 rounded-lg px-2 py-1 text-[12px]">
                                    <option value={1}>1일</option><option value={3}>3일</option><option value={7}>7일</option><option value={14}>14일</option><option value={30}>30일</option>
                                </select>
                                <button onClick={fetchLogs} className="px-3 py-1 bg-slate-100 rounded-lg text-[12px] hover:bg-slate-200">새로고침</button>
                            </div>
                        </div>
                        {/* Summary cards */}
                        {(() => {
                            const uniqueUsers = [...new Set(accessLogs.filter(l => l.action === "login").map(l => l.userName))];
                            const totalLogins = accessLogs.filter(l => l.action === "login").length;
                            const avgDuration = (() => {
                                const durations = accessLogs.filter(l => l.duration && l.duration > 0).map(l => l.duration!);
                                return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
                            })();
                            return (
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-[20px] font-bold text-blue-600">{uniqueUsers.length}</div><div className="text-[11px] text-slate-400">접속 인원</div></div>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-[20px] font-bold text-green-600">{totalLogins}</div><div className="text-[11px] text-slate-400">총 로그인</div></div>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-[20px] font-bold text-purple-600">{fmtDuration(avgDuration)}</div><div className="text-[11px] text-slate-400">평균 접속시간</div></div>
                                </div>
                            );
                        })()}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-[12px]">
                                <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2 text-left font-semibold text-slate-500">이름</th><th className="px-4 py-2 text-left font-semibold text-slate-500">상태</th><th className="px-4 py-2 text-left font-semibold text-slate-500">시간</th><th className="px-4 py-2 text-left font-semibold text-slate-500">접속시간</th><th className="px-4 py-2 text-left font-semibold text-slate-500">IP</th></tr></thead>
                                <tbody>
                                    {accessLogs.slice(0, 200).map((log, i) => (
                                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium">{log.userName}</td>
                                            <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${log.action === "login" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{log.action === "login" ? "로그인" : "로그아웃"}</span></td>
                                            <td className="px-4 py-2 text-slate-500">{fmtTime(log.timestamp)}</td>
                                            <td className="px-4 py-2 text-slate-500">{fmtDuration(log.duration)}</td>
                                            <td className="px-4 py-2 text-slate-400 text-[11px] font-mono">{log.ip || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {accessLogs.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">접속 로그가 없습니다</div>}
                        </div>
                    </div>
                )}

                {/* Modification Logs */}
                {tab === "mods" && !loading && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[16px] font-bold">📝 수정 로그</h2>
                            <div className="flex items-center gap-2">
                                <select value={days} onChange={e => setDays(Number(e.target.value))} className="border border-slate-200 rounded-lg px-2 py-1 text-[12px]">
                                    <option value={1}>1일</option><option value={3}>3일</option><option value={7}>7일</option><option value={14}>14일</option><option value={30}>30일</option>
                                </select>
                                <button onClick={fetchLogs} className="px-3 py-1 bg-slate-100 rounded-lg text-[12px] hover:bg-slate-200">새로고침</button>
                            </div>
                        </div>
                        {/* Summary: modifications by user */}
                        {(() => {
                            const byUser: Record<string, number> = {};
                            modLogs.forEach(l => { byUser[l.userName] = (byUser[l.userName] || 0) + 1; });
                            const sorted = Object.entries(byUser).sort((a, b) => b[1] - a[1]);
                            return sorted.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {sorted.map(([name, count]) => (
                                        <div key={name} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12px]">
                                            <span className="font-medium">{name}</span> <span className="text-blue-600 font-bold">{count}</span>건
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-[12px]">
                                <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2 text-left font-semibold text-slate-500">이름</th><th className="px-4 py-2 text-left font-semibold text-slate-500">섹션</th><th className="px-4 py-2 text-left font-semibold text-slate-500">작업</th><th className="px-4 py-2 text-left font-semibold text-slate-500">시간</th></tr></thead>
                                <tbody>
                                    {modLogs.slice(0, 200).map((log, i) => (
                                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium">{log.userName}</td>
                                            <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">{SECTION_LABELS[log.section] || log.section}</span></td>
                                            <td className="px-4 py-2 text-slate-500">{log.action}</td>
                                            <td className="px-4 py-2 text-slate-500">{fmtTime(log.timestamp)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {modLogs.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">수정 로그가 없습니다</div>}
                        </div>
                    </div>
                )}

                {/* Backups */}
                {tab === "backups" && !loading && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[16px] font-bold">💾 백업 관리</h2>
                            <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700">수동 백업 생성</button>
                        </div>
                        <p className="text-[12px] text-slate-400 mb-4">매일 오전 5시(KST) 자동 백업 / 7일 보관</p>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-[12px]">
                                <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2 text-left font-semibold text-slate-500">날짜</th><th className="px-4 py-2 text-left font-semibold text-slate-500">유형</th><th className="px-4 py-2 text-left font-semibold text-slate-500">크기</th><th className="px-4 py-2 text-right font-semibold text-slate-500">작업</th></tr></thead>
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
                )}

                {/* Members */}
                {tab === "members" && !loading && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[16px] font-bold">👥 멤버 관리</h2>
                            <button onClick={() => { setEditMode("add"); resetEdit(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700">+ 멤버 추가</button>
                        </div>
                        {/* Edit/Add form */}
                        {editMode && (
                            <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                                <h3 className="text-[14px] font-bold mb-3">{editMode === "add" ? "멤버 추가" : "멤버 수정"}</h3>
                                <div>
                                    <label className="text-[11px] text-slate-500 block mb-1">이름</label>
                                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full max-w-[300px] border border-slate-200 rounded-lg px-2 py-1.5 text-[12px]" placeholder="홍길동" onKeyDown={e => e.key === "Enter" && (editMode === "add" ? handleAddMember() : handleEditMember())} autoFocus />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">팀 배정과 역할은 대시보드 &gt; 팀 현황에서, 이모지는 대시보드 &gt; 설정에서 관리합니다.</p>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={editMode === "add" ? handleAddMember : handleEditMember} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-medium hover:bg-blue-700">{editMode === "add" ? "추가" : "저장"}</button>
                                    <button onClick={() => { setEditMode(null); resetEdit(); }} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">취소</button>
                                </div>
                            </div>
                        )}
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-[12px]">
                                <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2 text-left font-semibold text-slate-500">이름</th><th className="px-4 py-2 text-right font-semibold text-slate-500">작업</th></tr></thead>
                                <tbody>
                                    {Object.entries(members).map(([name]) => (
                                        <tr key={name} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-2 font-medium">{name}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button onClick={() => { setEditMode("edit"); setEditOrigName(name); setEditName(name); }} className="px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded mr-1">수정</button>
                                                <button onClick={() => handleDeleteMember(name)} className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded">삭제</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {Object.keys(members).length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">저장된 멤버가 없습니다. 대시보드에서 하드코딩된 MEMBERS를 사용중입니다.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
