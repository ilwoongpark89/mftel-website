"use client";

import { useState, useEffect, useMemo, useContext, memo } from "react";
import { MEMBERS, EMOJI_OPTIONS } from "../lib/constants";
import { MembersContext } from "../lib/contexts";

function PasswordChangeSection({ currentUser }: { currentUser: string }) {
    const [open, setOpen] = useState(false);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const submit = async () => {
        if (!currentPw || !newPw || !confirmPw) { setMsg({ type: "error", text: "모든 항목을 입력하세요" }); return; }
        if (newPw !== confirmPw) { setMsg({ type: "error", text: "새 비밀번호가 일치하지 않습니다" }); return; }
        if (newPw.length < 4) { setMsg({ type: "error", text: "비밀번호는 4자 이상이어야 합니다" }); return; }
        setLoading(true); setMsg(null);
        try {
            const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "changePassword", userName: currentUser, currentPassword: currentPw, newPassword: newPw }) });
            const data = await res.json();
            if (res.ok) { setMsg({ type: "success", text: "비밀번호가 변경되었습니다" }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
            else setMsg({ type: "error", text: data.error || "변경 실패" });
        } catch { setMsg({ type: "error", text: "서버 연결 실패" }); }
        setLoading(false);
    };
    return (
        <div className="bg-white border border-slate-200 rounded-lg">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors rounded-lg">
                <h3 className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>비밀번호 변경</h3>
                <span className={`text-slate-400 text-[13px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
            </button>
            {open && <div className="px-5 pb-5 space-y-3 max-w-[360px]">
                <div><label className="text-[12px] text-slate-500 block mb-1">현재 비밀번호</label><input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setMsg(null); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" /></div>
                <div><label className="text-[12px] text-slate-500 block mb-1">새 비밀번호</label><input type="password" value={newPw} onChange={e => { setNewPw(e.target.value); setMsg(null); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" /></div>
                <div><label className="text-[12px] text-slate-500 block mb-1">새 비밀번호 확인</label><input type="password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setMsg(null); }} onKeyDown={e => e.key === "Enter" && !loading && submit()} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" /></div>
                {msg && <p className={`text-[13px] ${msg.type === "success" ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
                <button onClick={submit} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 disabled:opacity-60">{loading ? "변경 중..." : "비밀번호 변경"}</button>
            </div>}
        </div>
    );
}

function AdminLogSection() {
    const MEMBERS = useContext(MembersContext);
    const [logs, setLogs] = useState<{ userName: string; section: string; action: string; timestamp: number }[]>([]);
    const [filterUser, setFilterUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/dashboard?section=logs");
                const data = await res.json();
                setLogs(data.data || []);
            } catch (e) { console.warn("로그 조회 실패:", e); }
            setLoading(false);
        })();
    }, []);

    const SECTION_LABELS: Record<string, string> = { announcements: "공지사항", papers: "논문", experiments: "실험", todos: "To-do", conferences: "학회/출장", lectures: "수업", patents: "지식재산권", vacations: "휴가", schedule: "일정", timetable: "시간표", reports: "계획서/보고서", teams: "팀", dailyTargets: "오늘 목표", philosophy: "연구실 철학", resources: "자료", ideas: "아이디어", analyses: "해석", chatPosts: "잡담", customEmojis: "이모지", statusMessages: "한마디", equipmentList: "장비", personalMemos: "개인 메모", teamMemos: "팀 메모", labChat: "연구실 채팅", labFiles: "파일", meetings: "회의록", analysisToolList: "해석 도구", paperTagList: "태그", members: "멤버", dispatches: "출장" };

    const uniqueUsers = useMemo(() => [...new Set(logs.map(l => l.userName))].sort(), [logs]);
    const filtered = filterUser ? logs.filter(l => l.userName === filterUser) : logs;

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">수정 로그</h3>
            {loading ? <p className="text-[13px] text-slate-400">로딩 중...</p> : (
                <>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        <button onClick={() => setFilterUser(null)} className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${!filterUser ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>전체</button>
                        {uniqueUsers.map(u => (
                            <button key={u} onClick={() => setFilterUser(filterUser === u ? null : u)}
                                className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${filterUser === u ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                {MEMBERS[u]?.emoji || "👤"}{u}
                            </button>
                        ))}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-1">
                        {filtered.length === 0 && <p className="text-[13px] text-slate-400 py-4 text-center">로그가 없습니다</p>}
                        {filtered.slice(0, 200).map((l, i) => (
                            <div key={i} className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded text-[13px]">
                                <span className="text-slate-400 text-[11px] font-mono shrink-0 w-[120px]">{new Date(l.timestamp).toLocaleString("ko-KR")}</span>
                                <button onClick={() => setFilterUser(filterUser === l.userName ? null : l.userName)} className="text-slate-700 font-medium shrink-0 hover:text-blue-600 transition-colors">{MEMBERS[l.userName]?.emoji || "👤"}{l.userName}</button>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-600">{SECTION_LABELS[l.section] || l.section}</span>
                            </div>
                        ))}
                        {filtered.length > 200 && <p className="text-[11px] text-slate-400 text-center py-2">최근 200건만 표시</p>}
                    </div>
                </>
            )}
        </div>
    );
}

const SettingsView = memo(function SettingsView({ currentUser, customEmojis, onSaveEmoji, statusMessages, onSaveStatusMsg }: { currentUser: string; customEmojis: Record<string, string>; onSaveEmoji: (name: string, emoji: string) => void; statusMessages: Record<string, string>; onSaveStatusMsg: (name: string, msg: string) => void }) {
    const MEMBERS = useContext(MembersContext);
    const savedEmoji = customEmojis[currentUser] || MEMBERS[currentUser]?.emoji || "👤";
    const [selectedEmoji, setSelectedEmoji] = useState(savedEmoji);
    const [msg, setMsg] = useState(statusMessages[currentUser] || "");
    const emojiChanged = selectedEmoji !== savedEmoji;
    return (
        <div className="space-y-4">
            {/* 비밀번호 변경 */}
            <PasswordChangeSection currentUser={currentUser} />
            {/* 한마디 */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">하고 싶은 말 한마디</h3>
                <p className="text-[12px] text-slate-400 mb-3">팀 Overview에 표시됩니다</p>
                {statusMessages[currentUser] && (
                    <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-[13px] text-blue-700 italic">&ldquo;{statusMessages[currentUser]}&rdquo;</div>
                )}
                <div className="flex gap-2">
                    <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="오늘의 한마디를 남겨보세요..." maxLength={50} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { onSaveStatusMsg(currentUser, msg.trim()); } }} />
                    <button onClick={() => { if (msg.trim()) onSaveStatusMsg(currentUser, msg.trim()); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 shrink-0">저장</button>
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 text-right">{msg.length}/50</div>
            </div>
            {/* 이모지 */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">내 이모지 설정</h3>
                <div className="flex items-center gap-3 mb-3">
                    <div>
                        <span className="text-[13px] text-slate-500">현재: </span>
                        <span className="text-[20px]">{selectedEmoji}</span>
                        <span className="text-[14px] text-slate-700 ml-2 font-medium">{currentUser}</span>
                    </div>
                    <button onClick={() => { onSaveEmoji(currentUser, selectedEmoji); }}
                        disabled={!emojiChanged}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${emojiChanged ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}>
                        저장
                    </button>
                    {emojiChanged && <span className="text-[12px] text-amber-500 font-medium">변경됨 — 저장을 눌러주세요</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setSelectedEmoji(e)}
                            className={`w-9 h-9 rounded-lg text-[18px] flex items-center justify-center transition-all ${selectedEmoji === e ? "bg-blue-100 ring-2 ring-blue-500 scale-110" : "bg-slate-50 hover:bg-slate-100 hover:scale-105"}`}>
                            {e}
                        </button>
                    ))}
                </div>
            </div>
            {/* 푸시 알림 설정 */}
            <PushNotificationSettings currentUser={currentUser} />
            {/* Admin Log */}
            {currentUser === "박일웅" && <AdminLogSection />}
        </div>
    );
});

function PushNotificationSettings({ currentUser }: { currentUser: string }) {
    const [pushSupported] = useState(() => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window);
    const [permission, setPermission] = useState<string>(() => typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default');
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!pushSupported) return;
        navigator.serviceWorker.ready.then(reg => {
            reg.pushManager.getSubscription().then(sub => { setSubscribed(!!sub); });
        });
    }, [pushSupported]);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') { setLoading(false); return; }
            const reg = await navigator.serviceWorker.ready;
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) { setLoading(false); return; }
            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                const raw = atob(base64);
                return Uint8Array.from(raw, c => c.charCodeAt(0));
            };
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
            await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName: currentUser, subscription: sub.toJSON() }) });
            setSubscribed(true);
        } catch (e) { console.warn("푸시 알림 구독 실패:", e); alert("알림 구독에 실패했습니다."); }
        setLoading(false);
    };

    const handleUnsubscribe = async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) await sub.unsubscribe();
            setSubscribed(false);
        } catch (e) { console.warn("푸시 알림 해제 실패:", e); alert("알림 해제에 실패했습니다."); }
        setLoading(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">푸시 알림</h3>
            {!pushSupported ? (
                <p className="text-[13px] text-slate-400">이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
            ) : permission === 'denied' ? (
                <div>
                    <p className="text-[13px] text-red-500 mb-2">알림 권한이 차단되었습니다.</p>
                    <p className="text-[12px] text-slate-400">브라우저 설정에서 알림 권한을 허용해주세요.</p>
                </div>
            ) : subscribed ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[13px] text-slate-700 font-medium">푸시 알림 활성화됨</span>
                    </div>
                    <button onClick={handleUnsubscribe} disabled={loading} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed">
                        {loading ? "처리 중..." : "알림 끄기"}
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[13px] text-slate-700">새 메시지, 공지사항 알림을 받을 수 있습니다.</p>
                        <p className="text-[12px] text-slate-400 mt-0.5">채팅, 팀 메모, 공지 알림</p>
                    </div>
                    <button onClick={handleSubscribe} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
                        {loading ? "처리 중..." : "알림 켜기"}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Login ───────────────────────────────────────────────────────────────────

// ─── Personal Memo View ──────────────────────────────────────────────────────


export { PasswordChangeSection, AdminLogSection, SettingsView, PushNotificationSettings };
