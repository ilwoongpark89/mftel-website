"use client";

import { useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import type { Comment, ConferenceTrip, DailyTarget, IdeaPost, Resource, Announcement, LabFile } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, DEFAULT_TEAMS, MEMO_COLORS } from "../lib/constants";
import { genId, chatKeyDown, renderChatMessage, saveDraft, loadDraft, clearDraft, hasDraft } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useCommentImg } from "../lib/hooks";
import { ColorPicker, SavingBadge, DetailModal3Col } from "./shared";
import type { ChatMessage } from "./shared";

const DailyTargetView = memo(function DailyTargetView({ targets, onSave, currentUser }: { targets: DailyTarget[]; onSave: (t: DailyTarget[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const [centerDate, setCenterDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
    const [editCell, setEditCell] = useState<{ name: string; date: string } | null>(null);
    const [editText, setEditText] = useState("");
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();

    // Report state
    const [showReport, setShowReport] = useState(false);
    const [reportStart, setReportStart] = useState("");
    const [reportEnd, setReportEnd] = useState("");
    const [reportMembers, setReportMembers] = useState<string[]>([]);
    const [reportData, setReportData] = useState<{ dates: string[]; members: string[]; rows: string[][] } | null>(null);

    const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayL = ["일", "월", "화", "수", "목", "금", "토"];

    // Helper: move by N weekdays
    const moveWeekdays = (from: Date, n: number): Date => {
        const d = new Date(from);
        let count = 0;
        while (count < Math.abs(n)) {
            d.setDate(d.getDate() + (n > 0 ? 1 : -1));
            if (d.getDay() !== 0 && d.getDay() !== 6) count++;
        }
        return d;
    };

    // 3 days: prev weekday | centerDate | next weekday
    const days = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const prev = moveWeekdays(centerDate, -1);
        const next = moveWeekdays(centerDate, 1);
        return [prev, new Date(centerDate), next].map(d => {
            const str = fmtDate(d);
            return { date: d, str, label: `${d.getMonth() + 1}/${d.getDate()} (${dayL[d.getDay()]})`, isToday: d.getTime() === today.getTime() };
        });
    }, [centerDate]);

    const shiftCenter = (dir: number) => setCenterDate(prev => moveWeekdays(prev, dir));
    const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCenterDate(d); };
    const isCenterToday = centerDate.getTime() === new Date(new Date().setHours(0, 0, 0, 0)).getTime();

    const getTarget = (name: string, dateStr: string) => targets.find(t => t.name === name && t.date === dateStr);
    const SCHEDULE_MARKER = "[일정]";
    const renderTargetText = (text: string) => {
        const lines = text.split("\n");
        return lines.map((line, i) => {
            const isSchedule = line.startsWith(SCHEDULE_MARKER);
            return (
                <div key={i} className={isSchedule ? "px-1.5 py-0.5 rounded bg-blue-50/70 text-blue-700 text-[12px] italic inline-block mb-0.5" : ""}>
                    {isSchedule ? line.replace(SCHEDULE_MARKER + " ", "") : line}
                </div>
            );
        });
    };

    const handleSave = () => {
        if (!editCell) return;
        const filtered = targets.filter(t => !(t.name === editCell.name && t.date === editCell.date));
        if (editText.trim()) {
            filtered.push({ name: editCell.name, date: editCell.date, text: editText.trim() });
        }
        onSave(filtered);
        setEditCell(null);
    };

    // Report generation
    const generateReport = () => {
        if (!reportStart || !reportEnd || reportMembers.length === 0) return;
        const start = new Date(reportStart + "T00:00:00");
        const end = new Date(reportEnd + "T00:00:00");
        if (start > end) return;
        const dates: string[] = [];
        const d = new Date(start);
        while (d <= end) {
            if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(fmtDate(d));
            d.setDate(d.getDate() + 1);
        }
        const rows = dates.map(date => reportMembers.map(name => {
            const t = targets.find(x => x.name === name && x.date === date);
            return t?.text || "";
        }));
        setReportData({ dates, members: reportMembers, rows });
    };

    const reportCsvText = () => {
        if (!reportData) return "";
        const header = ["날짜", ...reportData.members].join(",");
        const lines = reportData.dates.map((date, i) => [date, ...reportData.rows[i].map(c => `"${c.replace(/"/g, '""')}"`)].join(","));
        return [header, ...lines].join("\n");
    };

    const downloadCsv = () => {
        const csv = reportCsvText();
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `daily-targets-${reportStart}-${reportEnd}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyReport = () => {
        if (!reportData) return;
        // Tab-separated for Excel/Sheets paste
        const header = ["날짜", ...reportData.members].join("\t");
        const lines = reportData.dates.map((date, i) => [date, ...reportData.rows[i]].join("\t"));
        navigator.clipboard.writeText([header, ...lines].join("\n"));
    };

    // Mobile single-day view
    const mobileDateStr = fmtDate(centerDate);
    const mobileDow = centerDate.getDay();
    const mobileWritten = MEMBER_NAMES.filter(n => getTarget(n, mobileDateStr));
    const mobileUnwritten = MEMBER_NAMES.filter(n => !getTarget(n, mobileDateStr));

    return (
        <div>
            {/* Mobile single-day view */}
            <div className="md:hidden">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => shiftCenter(-1)} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[16px]">◀</button>
                    <div className="text-center">
                        <div className="text-[16px] font-bold text-slate-800">
                            {centerDate.getMonth() + 1}월 {centerDate.getDate()}일 ({dayL[mobileDow]})
                            {isCenterToday && <span className="ml-1.5 text-[11px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded align-middle">TODAY</span>}
                        </div>
                        {!isCenterToday && <button onClick={goToday} className="text-[12px] text-blue-500 mt-0.5">오늘로 이동</button>}
                    </div>
                    <button onClick={() => shiftCenter(1)} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[16px]">▶</button>
                </div>
                <div className="space-y-2">
                    {mobileWritten.map(name => {
                        const target = getTarget(name, mobileDateStr)!;
                        const isMe = name === currentUser;
                        const canEdit = isMe || currentUser === "박일웅";
                        return (
                            <div key={name} className={`rounded-xl p-3 ${isMe ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200"}`}
                                onClick={() => { if (canEdit) { setEditCell({ name, date: mobileDateStr }); setEditText(target.text); } }}>
                                <div className="text-[13px] font-bold text-slate-700 mb-1">{MEMBERS[name]?.emoji} {name}</div>
                                <div className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{renderTargetText(target.text)}</div>
                            </div>
                        );
                    })}
                </div>
                {mobileUnwritten.length > 0 && (
                    <div className="mt-4">
                        <div className="text-[12px] font-semibold text-slate-400 mb-2">미작성</div>
                        <div className="flex flex-wrap gap-1.5">
                            {mobileUnwritten.map(name => {
                                const canEdit = name === currentUser || currentUser === "박일웅";
                                return (
                                    <span key={name} className={`text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-400 ${canEdit ? "cursor-pointer hover:bg-slate-200" : ""}`}
                                        onClick={() => { if (canEdit) { setEditCell({ name, date: mobileDateStr }); setEditText(""); } }}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop 3-day table view */}
            <div className="hidden md:block">
            {/* Navigation bar */}
            <div className="flex items-center justify-center gap-3 mb-3">
                <button onClick={() => shiftCenter(-1)} className="px-2.5 py-1 rounded-md text-[14px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">&lt;</button>
                <button onClick={goToday} className={`px-3 py-1 rounded-md text-[14px] font-medium transition-colors ${isCenterToday ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>오늘</button>
                <button onClick={() => shiftCenter(1)} className="px-2.5 py-1 rounded-md text-[14px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">&gt;</button>
            </div>
            </div>
            <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 border-b border-r border-slate-200 px-2 py-2 text-left text-[13px] font-semibold w-[72px]" style={{background:"#FAFBFC", color:"#94A3B8"}}>이름</th>
                            {days.map(d => (
                                <th key={d.str} className={`border-b border-l border-slate-200 px-2 py-2 text-center ${d.isToday ? "bg-blue-50" : "bg-white"}`}>
                                    <div className={`text-[13px] font-semibold ${d.isToday ? "text-blue-600" : "text-slate-700"}`}>{d.label}</div>
                                    {d.isToday && <div className="text-[11px] text-blue-400 font-medium">TODAY</div>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {MEMBER_NAMES.map(name => {
                            const isMe = name === currentUser;
                            const canEdit = isMe || currentUser === "박일웅";
                            return (
                                <tr key={name} className={`${isMe ? "bg-blue-50/30" : "hover:bg-[#F8FAFC]"} transition-colors`}>
                                    <td className={`sticky left-0 z-10 border-r border-b border-slate-100 px-2 py-2.5 text-[13px] whitespace-nowrap overflow-hidden ${isMe ? "font-semibold text-slate-800" : "text-slate-600"}`} style={{background: isMe ? "#EFF6FF" : "#FAFBFC"}}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </td>
                                    {days.map(d => {
                                        const target = getTarget(name, d.str);
                                        return (
                                            <td key={d.str} className={`border-b border-l border-slate-200 px-2.5 py-2.5 align-top ${d.isToday ? "bg-[#EFF6FF]/50" : ""} ${canEdit ? "cursor-pointer hover:bg-slate-50" : ""}`}
                                                onClick={() => { if (canEdit) { setEditCell({ name, date: d.str }); setEditText(target?.text || ""); } }}>
                                                {target ? (
                                                    <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{renderTargetText(target.text)}</div>
                                                ) : canEdit ? (
                                                    <div className="text-[12px] text-slate-300 opacity-0 hover:opacity-100 transition-opacity">+ 작성</div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Report section */}
            <div className="mt-4">
                <button onClick={() => setShowReport(v => !v)} className="text-[13px] font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    <span className={`transition-transform ${showReport ? "rotate-90" : ""}`}>&#9654;</span> 리포트
                </button>
                {showReport && (
                    <div className="mt-2 border border-slate-200 rounded-lg bg-white p-4">
                        <div className="flex flex-wrap items-end gap-3 mb-3">
                            <div>
                                <label className="block text-[12px] text-slate-500 mb-0.5">시작일</label>
                                <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-[13px]" />
                            </div>
                            <div>
                                <label className="block text-[12px] text-slate-500 mb-0.5">종료일</label>
                                <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-[13px]" />
                            </div>
                            <button onClick={generateReport} disabled={!reportStart || !reportEnd || reportMembers.length === 0}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-[13px] font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">리포트 생성</button>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <label className="text-[12px] text-slate-500">멤버 선택</label>
                                <button onClick={() => setReportMembers(prev => prev.length === MEMBER_NAMES.length ? [] : [...MEMBER_NAMES])}
                                    className="text-[11px] text-blue-500 hover:underline">{reportMembers.length === MEMBER_NAMES.length ? "전체 해제" : "전체 선택"}</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {MEMBER_NAMES.map(name => (
                                    <label key={name} className="flex items-center gap-1 text-[12px] text-slate-600 cursor-pointer">
                                        <input type="checkbox" checked={reportMembers.includes(name)}
                                            onChange={e => setReportMembers(prev => e.target.checked ? [...prev, name] : prev.filter(n => n !== name))}
                                            className="w-3 h-3 rounded border-slate-300" />
                                        {MEMBERS[name]?.emoji} {name}
                                    </label>
                                ))}
                            </div>
                        </div>
                        {reportData && (
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <button onClick={downloadCsv} className="px-2.5 py-1 bg-green-500 text-white rounded text-[12px] font-medium hover:bg-green-600">CSV 다운로드</button>
                                    <button onClick={copyReport} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[12px] font-medium hover:bg-slate-200">복사</button>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded">
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr>
                                                <th className="bg-slate-50 border-b border-r border-slate-200 px-2 py-1 text-left text-slate-600 font-semibold">날짜</th>
                                                {reportData.members.map(m => (
                                                    <th key={m} className="bg-slate-50 border-b border-l border-slate-200 px-2 py-1 text-center text-slate-600 font-semibold">{m}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.dates.map((date, ri) => (
                                                <tr key={date}>
                                                    <td className="border-b border-r border-slate-100 px-2 py-1 text-slate-500 whitespace-nowrap">{date}</td>
                                                    {reportData.rows[ri].map((cell, ci) => (
                                                        <td key={ci} className="border-b border-l border-slate-100 px-2 py-1 text-slate-700 whitespace-pre-wrap">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit modal */}
            {editCell && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setEditCell(null)}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[14px] mb-1" style={{fontWeight:650, color:"#334155"}}>{editCell.date === todayStr ? "오늘 목표" : `${editCell.date} 목표`}</h4>
                        <p className="text-[12px] text-slate-400 mb-3">{editCell.name}</p>
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="오늘의 목표를 작성하세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40" autoFocus />
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditCell(null)} className="px-3 py-1.5 text-[13px] text-slate-500">취소</button>
                            {editText.trim() === "" && getTarget(editCell.name, editCell.date) && (
                                <button onClick={handleSave} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[13px] font-medium">삭제</button>
                            )}
                            <button onClick={handleSave} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// ─── Conference / Trip View ──────────────────────────────────────────────────

const CONF_STATUSES = ["관심", "준비중", "완료"] as const;
const CONF_COL_COLORS: Record<string, { bg: string; border: string; header: string; count: string }> = {
    "관심": { bg: "bg-amber-50/50", border: "border-amber-200", header: "text-amber-700", count: "bg-amber-100 text-amber-600" },
    "준비중": { bg: "bg-blue-50/50", border: "border-blue-200", header: "text-blue-700", count: "bg-blue-100 text-blue-600" },
    "완료": { bg: "bg-green-50/50", border: "border-green-200", header: "text-green-700", count: "bg-green-100 text-green-600" },
};


const ConferenceTripView = memo(function ConferenceTripView({ items, onSave, onDelete, onReorder, currentUser }: { items: ConferenceTrip[]; onSave: (c: ConferenceTrip) => void; onDelete: (id: number) => void; onReorder: (list: ConferenceTrip[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [editing, setEditing] = useState<ConferenceTrip | null>(null);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [homepage, setHomepage] = useState("");
    const [fee, setFee] = useState("");
    const [location, setLocation] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [formStatus, setFormStatus] = useState<string>("관심");
    const [dateError, setDateError] = useState("");
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [selected, setSelected] = useState<ConferenceTrip | null>(null);

    const handleChatAdd = (msg: ChatMessage) => { if (!selected) return; const u = { ...selected, comments: [...(selected.comments || []), msg] }; onSave(u); setSelected(u); };
    const handleChatDelete = (id: number) => { if (!selected) return; const u = { ...selected, comments: (selected.comments || []).filter(c => c.id !== id) }; onSave(u); setSelected(u); };
    const handleFileAdd = (f: LabFile) => { if (!selected) return; const u = { ...selected, files: [...(selected.files || []), f] }; onSave(u); setSelected(u); };
    const handleFileDelete = async (id: number) => { if (!selected) return; const fl = (selected.files || []).find(x => x.id === id); if (fl?.url?.startsWith("https://")) { try { const tk = typeof window !== "undefined" ? localStorage.getItem("mftel-auth-token") || "" : ""; await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: fl.url }), headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {} as Record<string, string>) } }); } catch (e) { console.warn("파일 삭제 실패:", e); } } const u = { ...selected, files: (selected.files || []).filter(x => x.id !== id) }; onSave(u); setSelected(u); };

    const modal = adding || editing !== null;
    const isEdit = !!editing;

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const cImg = useCommentImg();
    const [confDraftLoaded, setConfDraftLoaded] = useState(false);

    const openAdd = (status?: string) => {
        setEditing(null); setParticipants([]); setFormStatus(status || "관심"); setComments([]); setNewComment(""); setDateError("");
        const d = loadDraft("conf_add");
        if (d) { try { const p = JSON.parse(d); setTitle(p.title || ""); setStartDate(p.startDate || ""); setEndDate(p.endDate || ""); setHomepage(p.homepage || ""); setFee(p.fee || ""); setLocation(p.location || ""); setConfDraftLoaded(true); } catch { setTitle(""); setStartDate(""); setEndDate(""); setHomepage(""); setFee(""); setLocation(""); setConfDraftLoaded(false); } }
        else { setTitle(""); setStartDate(""); setEndDate(""); setHomepage(""); setFee(""); setLocation(""); setConfDraftLoaded(false); }
        setAdding(true);
    };
    const openEdit = (c: ConferenceTrip) => { setEditing(c); setAdding(false); setTitle(c.title); setStartDate(c.startDate); setEndDate(c.endDate); setHomepage(c.homepage); setFee(c.fee); setLocation(c.location || ""); setParticipants(c.participants); setFormStatus(c.status || "관심"); setComments(c.comments || []); setNewComment(""); setConfDraftLoaded(false); setDateError(""); };
    const closeModal = () => { if (adding && (title.trim() || homepage.trim() || fee.trim())) saveDraft("conf_add", JSON.stringify({ title, startDate, endDate, homepage, fee, location })); setAdding(false); setEditing(null); setConfDraftLoaded(false); };

    // Draft auto-save for add form
    useEffect(() => { if (adding && !editing) saveDraft("conf_add", JSON.stringify({ title, startDate, endDate, homepage, fee, location })); }, [title, startDate, endDate, homepage, fee, location, adding, editing]);

    const [tried, setTried] = useState(false);
    const handleSave = () => {
        setTried(true);
        if (!title.trim()) return false;
        if (startDate && endDate && endDate < startDate) { setDateError("종료일은 시작일 이후여야 합니다"); return false; }
        clearDraft("conf_add");
        onSave({ id: editing?.id ?? genId(), title: title.trim(), startDate, endDate, homepage: homepage.trim(), fee: fee.trim(), location: location.trim() || undefined, participants, creator: editing?.creator || currentUser, createdAt: editing?.createdAt || new Date().toISOString(), status: formStatus, comments, needsDiscussion: editing?.needsDiscussion });
        setConfDraftLoaded(false);
        return true;
    };

    const toggleParticipant = (name: string) => {
        setParticipants(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    };

    const formatPeriod = (s: string, e: string) => {
        if (!s && !e) return "";
        if (s && !e) return s;
        if (!s && e) return `~ ${e}`;
        return `${s} ~ ${e}`;
    };

    const handleColumnDrop = (targetStatus: string, e: React.DragEvent) => {
        e.preventDefault();
        if (draggedId === null) return;
        const item = items.find(c => c.id === draggedId);
        if (item && (item.status || "관심") !== targetStatus) {
            onSave({ ...item, status: targetStatus });
        }
        setDraggedId(null);
    };

    // Sort by startDate ascending and group by month
    const sorted = useMemo(() => [...items].sort((a, b) => {
        const da = a.startDate || "9999-12-31";
        const db = b.startDate || "9999-12-31";
        return da.localeCompare(db);
    }), [items]);

    const monthGroups = useMemo(() => {
        const groups: { label: string; key: string; items: ConferenceTrip[] }[] = [];
        for (const c of sorted) {
            const d = c.startDate ? new Date(c.startDate) : null;
            const key = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "no-date";
            const label = d ? `📅 ${d.getFullYear()}년 ${d.getMonth() + 1}월` : "📅 날짜 미정";
            let group = groups.find(g => g.key === key);
            if (!group) { group = { label, key, items: [] }; groups.push(group); }
            group.items.push(c);
        }
        return groups;
    }, [sorted]);

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => openAdd()} className="flex items-center gap-1 px-3 py-1.5 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"><span className="text-[14px]">+</span> 학회/출장 추가</button>
            </div>
            {items.length === 0 && <div className="text-center py-12"><div className="text-3xl mb-2 opacity-40">✈️</div><div className="text-slate-400 text-[14px]">등록된 학회/출장이 없습니다</div></div>}
            {monthGroups.map(group => (
                <div key={group.key} className="mb-6">
                    <h3 className="text-[15px] font-bold text-slate-700 mb-3 pb-2 border-b border-slate-200">{group.label}</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {group.items.map(c => {
                            const cmt = c.comments || [];
                            return (
                            <div key={c.id} onClick={() => setSelected(c)}
                                className={`bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${c.needsDiscussion ? "border border-slate-200 border-l-[3px] border-l-red-400" : "border border-slate-200 hover:border-slate-300"}`}>
                                <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!c.needsDiscussion} onChange={() => onSave({ ...c, needsDiscussion: !c.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                    <span className={`text-[11px] font-medium ${c.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                </label>
                                <div className="text-[14px] font-semibold text-slate-800 mb-1">{c.title}<SavingBadge id={c.id} /></div>
                                {(c.startDate || c.endDate) && <div className="text-[12px] text-slate-500 mb-0.5">📅 {formatPeriod(c.startDate, c.endDate)}</div>}
                                {c.homepage && <div className="text-[11px] text-blue-500 mb-0.5 truncate" onClick={e => { e.stopPropagation(); try { const u = new URL(c.homepage); if (["http:", "https:"].includes(u.protocol)) window.open(c.homepage, "_blank", "noopener"); else alert("유효하지 않은 URL입니다."); } catch { alert("유효하지 않은 URL입니다."); } }}>🔗 {c.homepage}</div>}
                                {c.location && <div className="text-[12px] text-slate-500 mb-0.5">📍 {c.location}</div>}
                                {c.fee && <div className="text-[12px] text-slate-500 mb-0.5">💰 {c.fee}</div>}
                                {c.participants.length > 0 && (
                                    <div className="flex flex-wrap gap-0.5 mt-1.5">
                                        {c.participants.map(p => <span key={p} className="text-[11px] px-1 py-0.5 rounded bg-blue-50 text-blue-600">{MEMBERS[p]?.emoji || "👤"}{p}</span>)}
                                    </div>
                                )}
                                <div className="border-t border-slate-100 pt-1.5 mt-2">
                                    {cmt.length > 0 ? (
                                        <div className="text-[11px] text-slate-500 truncate">
                                            <span className="font-medium text-slate-600">{MEMBERS[cmt.slice(-1)[0]?.author]?.emoji}{cmt.slice(-1)[0]?.author}</span> {cmt.slice(-1)[0]?.text}
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {modal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={closeModal}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "학회/출장 수정" : "학회/출장 추가"}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {confDraftLoaded && !isEdit && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                                    <span>임시저장된 글이 있습니다</span>
                                    <button onClick={() => { setTitle(""); setStartDate(""); setEndDate(""); setHomepage(""); setFee(""); setLocation(""); clearDraft("conf_add"); setConfDraftLoaded(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                                </div>
                            )}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">학회/출장 이름 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: NURETH-21" className={`w-full border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${tried && !title.trim() ? "border-red-400 ring-2 ring-red-200" : "border-slate-200"}`} />
                                {tried && !title.trim() && <p className="text-[11px] text-red-500 mt-0.5">이름을 입력하세요</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 block mb-1">시작일</label>
                                    <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setDateError(""); }} className={`w-full border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${dateError ? "border-red-400" : "border-slate-200"}`} />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 block mb-1">종료일</label>
                                    <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setDateError(""); }} min={startDate || undefined} className={`w-full border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${dateError ? "border-red-400" : "border-slate-200"}`} />
                                </div>
                            </div>
                            {dateError && <p className="text-[11px] text-red-500 -mt-1.5">{dateError}</p>}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">장소</label>
                                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="예: 부산 BEXCO, Orlando FL USA" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">홈페이지</label>
                                <input value={homepage} onChange={e => setHomepage(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">등록비</label>
                                <input value={fee} onChange={e => setFee(e.target.value)} placeholder="예: Early bird $500 / Regular $700" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">참가자</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {MEMBER_NAMES.map(name => (
                                        <button key={name} onClick={() => toggleParticipant(name)}
                                            className={`px-2 py-1 rounded-lg text-[13px] transition-colors ${participants.includes(name) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                            {MEMBERS[name]?.emoji || "👤"} {name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Comments */}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">댓글 ({comments.length})</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                                    {comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                            <button onClick={() => { if (!confirm("댓글을 삭제하시겠습니까?")) return; setComments(comments.filter(x => x.id !== c.id)); }}
                                                className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{renderChatMessage(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="rounded-md mt-1" style={{ maxWidth: '100%', height: 'auto' }} />}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && <div className="text-[12px] text-slate-300 py-2">댓글 없음</div>}
                                </div>
                                {cImg.preview}
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성... (Ctrl+V 이미지)"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onPaste={cImg.onPaste} onKeyDown={e => { if (e.key === "Enter" && (newComment.trim() || cImg.img)) { setComments([...comments, { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }]); setNewComment(""); cImg.clear(); } }} />
                                    <button onClick={() => { if (newComment.trim() || cImg.img) { setComments([...comments, { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }]); setNewComment(""); cImg.clear(); } }}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">{cImg.uploading ? "⏳" : "전송"}</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={() => { if (handleSave()) { setAdding(false); setEditing(null); setConfDraftLoaded(false); } }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            {isEdit && <button onClick={() => confirmDel(() => { onDelete(editing!.id); closeModal(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                        </div>
                    </div>
                </div>
            )}
            {selected && !modal && (
                <DetailModal3Col
                    onClose={() => setSelected(null)}
                    onEdit={() => { openEdit(selected); setSelected(null); }}
                    onDelete={(currentUser === selected.creator || currentUser === "박일웅") ? () => { onDelete(selected.id); setSelected(null); } : undefined}
                    files={selected.files || []}
                    currentUser={currentUser}
                    onAddFile={handleFileAdd}
                    onDeleteFile={handleFileDelete}
                    chatMessages={selected.comments || []}
                    onAddChat={handleChatAdd}
                    onDeleteChat={handleChatDelete}
                    chatDraftKey={`comment_conf_${selected.id}`}
                >
                    <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selected.title}</h2>
                    {(selected.startDate || selected.endDate) && (
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-500">기간</span>
                            <span className="text-[13px] text-slate-700">{formatPeriod(selected.startDate, selected.endDate)}</span>
                        </div>
                    )}
                    {selected.homepage && (
                        <div className="flex items-start gap-2 min-w-0">
                            <span className="text-[12px] font-semibold text-slate-500 flex-shrink-0">홈페이지</span>
                            <a href={selected.homepage} target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-500 hover:underline min-w-0" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }} onClick={e => { try { const u = new URL(selected.homepage); if (!["http:", "https:"].includes(u.protocol)) { e.preventDefault(); alert("유효하지 않은 URL입니다."); } } catch { e.preventDefault(); alert("유효하지 않은 URL입니다."); } }}>{selected.homepage}</a>
                        </div>
                    )}
                    {selected.location && (
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-500">장소</span>
                            <span className="text-[13px] text-slate-700">📍 {selected.location}</span>
                        </div>
                    )}
                    {selected.fee && (
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-500">등록비</span>
                            <span className="text-[13px] text-slate-700">{selected.fee}</span>
                        </div>
                    )}
                    {selected.status && (
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-500">상태</span>
                            <span className="text-[12px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{selected.status}</span>
                        </div>
                    )}
                    {selected.participants.length > 0 && (
                        <div>
                            <span className="text-[12px] font-semibold text-slate-500 block mb-1.5">참가자</span>
                            <div className="flex flex-wrap gap-1.5">
                                {selected.participants.map(p => <span key={p} className="text-[12px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[p]?.emoji || "👤"} {p}</span>)}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-500">논의 필요</span>
                        <span className={`text-[12px] font-medium ${selected.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>{selected.needsDiscussion ? "예" : "—"}</span>
                    </div>
                    {selected.creator && <div className="text-[11px] text-slate-400">작성: {MEMBERS[selected.creator]?.emoji || ""}{selected.creator}{selected.createdAt ? ` · ${new Date(selected.createdAt).toLocaleDateString("ko-KR")}` : ""}</div>}
                </DetailModal3Col>
            )}
        </div>
    );
});

// ─── Resource View ──────────────────────────────────────────────────────────


const ResourceView = memo(function ResourceView({ resources, onSave, onDelete, onReorder, currentUser }: { resources: Resource[]; onSave: (r: Resource) => void; onDelete: (id: number) => void; onReorder: (list: Resource[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [editing, setEditing] = useState<Resource | null>(null);
    const [adding, setAdding] = useState(false);
    const [selectedRes, setSelectedRes] = useState<Resource | null>(null);
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [nasPath, setNasPath] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const cImg = useCommentImg();
    const [resDraftLoaded, setResDraftLoaded] = useState(false);

    const handleResChatAdd = (msg: ChatMessage) => { if (!selectedRes) return; const u = { ...selectedRes, comments: [...(selectedRes.comments || []), msg] }; onSave(u); setSelectedRes(u); };
    const handleResChatDelete = (id: number) => { if (!selectedRes) return; const u = { ...selectedRes, comments: (selectedRes.comments || []).filter(c => c.id !== id) }; onSave(u); setSelectedRes(u); };
    const handleResFileAdd = (f: LabFile) => { if (!selectedRes) return; const u = { ...selectedRes, files: [...(selectedRes.files || []), f] }; onSave(u); setSelectedRes(u); };
    const handleResFileDelete = async (id: number) => { if (!selectedRes) return; const fl = (selectedRes.files || []).find(x => x.id === id); if (fl?.url?.startsWith("https://")) { try { const tk = typeof window !== "undefined" ? localStorage.getItem("mftel-auth-token") || "" : ""; await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: fl.url }), headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {} as Record<string, string>) } }); } catch (e) { console.warn("파일 삭제 실패:", e); } } const u = { ...selectedRes, files: (selectedRes.files || []).filter(x => x.id !== id) }; onSave(u); setSelectedRes(u); };

    const dragRes = useRef<number | null>(null);
    const [dragOverRes, setDragOverRes] = useState<number | null>(null);

    const openAdd = () => {
        setEditing(null); setComments([]); setNewComment("");
        const d = loadDraft("resource_add");
        if (d) { try { const p = JSON.parse(d); setTitle(p.title || ""); setLink(p.link || ""); setNasPath(p.nasPath || ""); setResDraftLoaded(true); } catch { setTitle(""); setLink(""); setNasPath(""); setResDraftLoaded(false); } }
        else { setTitle(""); setLink(""); setNasPath(""); setResDraftLoaded(false); }
        setAdding(true);
    };
    const openEdit = (r: Resource) => { setEditing(r); setAdding(false); setTitle(r.title); setLink(r.link); setNasPath(r.nasPath); setComments(r.comments || []); setNewComment(""); setResDraftLoaded(false); };
    const closeModal = () => { if (adding && (title.trim() || link.trim() || nasPath.trim())) saveDraft("resource_add", JSON.stringify({ title, link, nasPath })); setAdding(false); setEditing(null); setResDraftLoaded(false); };
    const modal = adding || editing !== null;
    const isEdit = !!editing;

    // Draft auto-save for add form
    useEffect(() => { if (adding && !editing) saveDraft("resource_add", JSON.stringify({ title, link, nasPath })); }, [title, link, nasPath, adding, editing]);

    const handleSave = () => {
        if (!title.trim()) return;
        clearDraft("resource_add");
        onSave({ id: editing?.id ?? genId(), title, link, nasPath, author: editing?.author || currentUser, date: editing?.date || new Date().toLocaleDateString("ko-KR"), comments, needsDiscussion: editing?.needsDiscussion });
        setResDraftLoaded(false);
        setAdding(false); setEditing(null); // close without re-saving draft
    };
    const addComment = () => {
        if (!newComment.trim() && !cImg.img) return;
        setComments([...comments, { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }]);
        setNewComment(""); cImg.clear();
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <button onClick={openAdd} className="flex items-center gap-1 px-3 py-1.5 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"><span className="text-[14px]">+</span> 자료 추가</button>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3"
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragRes.current !== null && dragOverRes !== null && dragRes.current !== dragOverRes) { const reordered = [...resources]; const [moved] = reordered.splice(dragRes.current, 1); reordered.splice(dragOverRes, 0, moved); onReorder(reordered); } dragRes.current = null; setDragOverRes(null); }}>
                {resources.map((r, idx) => {
                    const cmt = r.comments || [];
                    return (
                        <div key={r.id} draggable
                            onDragStart={() => { dragRes.current = idx; }}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverRes(idx); }}
                            onDragEnd={() => { dragRes.current = null; setDragOverRes(null); }}
                            onDrop={e => { e.stopPropagation(); if (dragRes.current !== null && dragRes.current !== idx) { const reordered = [...resources]; const [moved] = reordered.splice(dragRes.current, 1); reordered.splice(idx, 0, moved); onReorder(reordered); } dragRes.current = null; setDragOverRes(null); }}
                            onClick={() => setSelectedRes(r)} className={`bg-white rounded-xl p-4 cursor-grab transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${dragOverRes === idx ? "ring-2 ring-blue-300" : ""} ${r.needsDiscussion ? "border border-slate-200 border-l-[3px] border-l-red-400" : "border border-slate-200 hover:border-slate-300"}`}>
                            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onSave({ ...r, needsDiscussion: !r.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                <span className={`text-[11px] font-medium ${r.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                            </label>
                            <div className="text-[14px] font-semibold text-slate-800 mb-2 break-words">{r.title}<SavingBadge id={r.id} /></div>
                            {r.link && (
                                <div className="text-[12px] text-blue-500 mb-1 truncate" onClick={e => { e.stopPropagation(); try { const u = new URL(r.link); if (["http:", "https:"].includes(u.protocol)) window.open(r.link, "_blank", "noopener"); else alert("유효하지 않은 URL입니다."); } catch { alert("유효하지 않은 URL입니다."); } }}>
                                    🔗 {r.link}
                                </div>
                            )}
                            {r.nasPath && <div className="text-[12px] text-slate-500 mb-1 truncate">📂 {r.nasPath}</div>}
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-[11px] text-slate-400">{MEMBERS[r.author]?.emoji || ""} {r.author} · {r.date}</div>
                                {cmt.length > 0 && <span className="text-[11px] text-slate-400">💬{cmt.length}</span>}
                            </div>
                            <div className="border-t border-slate-100 pt-1.5 mt-2">
                                {cmt.length > 0 ? (
                                    cmt.slice(-1).map(c => (
                                        <div key={c.id} className="text-[12px] text-slate-500 truncate">
                                            <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {renderChatMessage(c.text)}{c.imageUrl && " 📷"}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {resources.length === 0 && <div className="text-center py-12 col-span-full"><div className="text-3xl mb-2 opacity-40">📁</div><div className="text-slate-400 text-[14px]">등록된 자료가 없습니다</div></div>}
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={closeModal}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "자료 수정" : "자료 추가"}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {resDraftLoaded && !isEdit && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                                    <span>임시저장된 글이 있습니다</span>
                                    <button onClick={() => { setTitle(""); setLink(""); setNasPath(""); clearDraft("resource_add"); setResDraftLoaded(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                                </div>
                            )}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">자료 이름 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">링크 (URL)</label>
                                <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">NAS 경로</label>
                                <input value={nasPath} onChange={e => setNasPath(e.target.value)} placeholder="예: \\NAS\연구자료\..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            {/* Comments */}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                                    {comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                            <button onClick={() => { if (!confirm("댓글을 삭제하시겠습니까?")) return; setComments(comments.filter(x => x.id !== c.id)); }}
                                                className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{renderChatMessage(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="rounded-md mt-1" style={{ maxWidth: '100%', height: 'auto' }} />}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && <div className="text-[12px] text-slate-300 py-2">코멘트 없음</div>}
                                </div>
                                {cImg.preview}
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성... (Ctrl+V 이미지)"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onPaste={cImg.onPaste} onKeyDown={e => chatKeyDown(e, addComment)} />
                                    <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">{cImg.uploading ? "⏳" : "전송"}</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            {isEdit && <button onClick={() => confirmDel(() => { onDelete(editing!.id); closeModal(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                        </div>
                    </div>
                </div>
            )}
            {selectedRes && !modal && (
                <DetailModal3Col
                    onClose={() => setSelectedRes(null)}
                    onEdit={() => { openEdit(selectedRes); setSelectedRes(null); }}
                    onDelete={(currentUser === selectedRes.author || currentUser === "박일웅") ? () => { onDelete(selectedRes.id); setSelectedRes(null); } : undefined}
                    files={selectedRes.files || []}
                    currentUser={currentUser}
                    onAddFile={handleResFileAdd}
                    onDeleteFile={handleResFileDelete}
                    chatMessages={selectedRes.comments || []}
                    onAddChat={handleResChatAdd}
                    onDeleteChat={handleResChatDelete}
                    chatDraftKey={`comment_resource_${selectedRes.id}`}
                >
                    <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selectedRes.title}</h2>
                    {selectedRes.link && (
                        <div className="flex items-start gap-2 min-w-0">
                            <span className="text-[12px] font-semibold text-slate-500 flex-shrink-0">링크</span>
                            <a href={selectedRes.link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-500 hover:underline min-w-0" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }} onClick={e => { try { const u = new URL(selectedRes.link); if (!["http:", "https:"].includes(u.protocol)) { e.preventDefault(); alert("유효하지 않은 URL입니다."); } } catch { e.preventDefault(); alert("유효하지 않은 URL입니다."); } }}>{selectedRes.link}</a>
                        </div>
                    )}
                    {selectedRes.nasPath && (
                        <div className="flex items-start gap-2 min-w-0">
                            <span className="text-[12px] font-semibold text-slate-500 flex-shrink-0">NAS 경로</span>
                            <span className="text-[13px] text-slate-700 font-mono min-w-0" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{selectedRes.nasPath}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-500">논의 필요</span>
                        <span className={`text-[12px] font-medium ${selectedRes.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>{selectedRes.needsDiscussion ? "예" : "—"}</span>
                    </div>
                    {selectedRes.author && <div className="text-[11px] text-slate-400">작성: {MEMBERS[selectedRes.author]?.emoji || ""}{selectedRes.author}{selectedRes.date ? ` · ${selectedRes.date}` : ""}</div>}
                </DetailModal3Col>
            )}
        </div>
    );
});

// ─── Simple Chat Panel (used by 잡담 tab) ─────────────────────────────────────


const IdeasView = memo(function IdeasView({ ideas, onSave, onDelete, onReorder, currentUser, columns }: { ideas: IdeaPost[]; onSave: (i: IdeaPost) => void; onDelete: (id: number) => void; onReorder: (list: IdeaPost[]) => void; currentUser: string; columns?: number }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [selected, setSelected] = useState<IdeaPost | null>(null);
    const [adding, setAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [ideaColor, setIdeaColor] = useState(MEMO_COLORS[0]);
    const [ideaBorder, setIdeaBorder] = useState("");
    const [newComment, setNewComment] = useState("");
    const cImg = useCommentImg();
    const boardImg = useCommentImg();
    const composingRef = useRef(false);
    const dragIdea = useRef<number | null>(null);
    const [dragOverIdea, setDragOverIdea] = useState<number | null>(null);
    const [draftLoaded, setDraftLoaded] = useState(false);

    const openDetail = (idea: IdeaPost) => { setSelected(idea); setNewComment(loadDraft(`comment_ideas_${idea.id}`)); setIsEditing(false); };
    const closeDetail = () => { setSelected(null); setIsEditing(false); };
    const openAdd = () => {
        setIdeaColor(MEMO_COLORS[0]); setIdeaBorder("");
        const d = loadDraft("ideas_add");
        if (d) { try { const p = JSON.parse(d); setTitle(p.title || ""); setBody(p.content || ""); setDraftLoaded(true); } catch { setTitle(""); setBody(""); setDraftLoaded(false); } }
        else { setTitle(""); setBody(""); setDraftLoaded(false); }
        setAdding(true);
    };
    const closeAdd = () => { if (title.trim() || body.trim()) saveDraft("ideas_add", JSON.stringify({ title, content: body })); setAdding(false); setDraftLoaded(false); boardImg.clear(); };
    const startEdit = () => { if (!selected) return; setTitle(selected.title); setBody(selected.body); setIdeaColor(selected.color || MEMO_COLORS[0]); setIdeaBorder(selected.borderColor || ""); setIsEditing(true); };
    const saveEdit = () => {
        if (!selected || !title.trim()) return;
        const updated = { ...selected, title: title.trim(), body: body.trim(), color: ideaColor, borderColor: ideaBorder, imageUrl: boardImg.img || selected.imageUrl };
        onSave(updated); setSelected(updated); setIsEditing(false); boardImg.clear();
    };

    // Draft auto-save for add form
    useEffect(() => { if (adding) saveDraft("ideas_add", JSON.stringify({ title, content: body })); }, [title, body, adding]);

    const handleCreate = () => {
        if (!title.trim()) return;
        clearDraft("ideas_add");
        onSave({ id: genId(), title: title.trim(), body: body.trim(), author: currentUser, date: new Date().toLocaleDateString("ko-KR"), comments: [], color: ideaColor, borderColor: ideaBorder, imageUrl: boardImg.img || undefined });
        setDraftLoaded(false); setAdding(false); boardImg.clear();
    };

    // Comment draft for ideas detail
    useEffect(() => { if (selected) saveDraft(`comment_ideas_${selected.id}`, newComment); }, [newComment, selected?.id]);

    const addComment = () => {
        if (!selected || (!newComment.trim() && !cImg.img)) return;
        clearDraft(`comment_ideas_${selected.id}`);
        const updated = { ...selected, comments: [...selected.comments, { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }] };
        onSave(updated);
        setSelected(updated);
        setNewComment(""); cImg.clear();
    };

    const deleteComment = (cid: number) => {
        if (!selected) return;
        const updated = { ...selected, comments: selected.comments.filter(c => c.id !== cid) };
        onSave(updated);
        setSelected(updated);
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <button onClick={openAdd} className="flex items-center gap-1 px-3 py-1.5 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"><span className="text-[14px]">+</span> 새 글 작성</button>
            </div>
            <div className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragIdea.current !== null && dragOverIdea !== null && dragIdea.current !== dragOverIdea) { const reordered = [...ideas]; const [moved] = reordered.splice(dragIdea.current, 1); reordered.splice(dragOverIdea, 0, moved); onReorder(reordered); } dragIdea.current = null; setDragOverIdea(null); }}>
                {ideas.map((idea, idx) => (
                    <div key={idea.id} draggable
                        onDragStart={() => { dragIdea.current = idx; }}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIdea(idx); }}
                        onDragEnd={() => { dragIdea.current = null; setDragOverIdea(null); }}
                        onDrop={e => { e.stopPropagation(); if (dragIdea.current !== null && dragIdea.current !== idx) { const reordered = [...ideas]; const [moved] = reordered.splice(dragIdea.current, 1); reordered.splice(idx, 0, moved); onReorder(reordered); } dragIdea.current = null; setDragOverIdea(null); }}
                        onClick={() => openDetail(idea)}
                        className={`rounded-xl p-4 cursor-grab transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col ${dragOverIdea === idx ? "ring-2 ring-blue-300" : ""}`}
                        style={{ background: idea.color || "#fff", border: idea.borderColor ? `2px solid ${idea.borderColor}` : "1px solid #E2E8F0", borderLeft: idea.needsDiscussion && !idea.borderColor ? "3px solid #EF4444" : undefined }}>
                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!idea.needsDiscussion} onChange={() => onSave({ ...idea, needsDiscussion: !idea.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                            <span className={`text-[11px] font-medium ${idea.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-[14px] font-semibold text-slate-800 break-words flex-1">{idea.title}<SavingBadge id={idea.id} /></div>
                            <span className="text-[11px] text-slate-400 ml-2 whitespace-nowrap">{idea.date}</span>
                        </div>
                        {idea.body && <div className="text-[13px] text-slate-600 mb-3 line-clamp-3 break-words">{idea.body}</div>}
                        {idea.imageUrl && <img src={idea.imageUrl} alt="" className="w-full rounded-lg mt-2 mb-2" style={{ maxHeight: 300, objectFit: 'cover' }} />}
                        <div className="text-[12px] text-slate-400 mb-2">{MEMBERS[idea.author]?.emoji || "👤"} {idea.author}</div>
                        {/* Comment preview */}
                        {idea.comments.length > 0 && (
                            <div className="border-t border-slate-100 pt-2 mt-auto space-y-1">
                                <div className="text-[11px] font-semibold text-slate-400 mb-1">💬 댓글 {idea.comments.length}개</div>
                                {idea.comments.slice(-2).map(c => (
                                    <div key={c.id} className="text-[12px] text-slate-500 truncate">
                                        <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {renderChatMessage(c.text)}{c.imageUrl && " 📷"}
                                    </div>
                                ))}
                            </div>
                        )}
                        {idea.comments.length === 0 && (
                            <div className="border-t border-slate-100 pt-2 mt-auto">
                                <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                            </div>
                        )}
                    </div>
                ))}
                {ideas.length === 0 && <div className="text-center py-12 col-span-full"><div className="text-3xl mb-2 opacity-40">💡</div><div className="text-slate-400 text-[14px]">아직 글이 없습니다. 자유롭게 아이디어를 공유해 보세요!</div></div>}
            </div>

            {/* Add modal */}
            {adding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={closeAdd}>
                    <div className="bg-white rounded-xl w-full shadow-2xl" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">새 글 작성</h3>
                            <button onClick={closeAdd} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {draftLoaded && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                                    <span>임시저장된 글이 있습니다</span>
                                    <button onClick={() => { setTitle(""); setBody(""); clearDraft("ideas_add"); setDraftLoaded(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                                </div>
                            )}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" style={{height:48}} onPaste={boardImg.onPaste} />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <textarea value={body} onChange={e => setBody(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" style={{minHeight:200}} onPaste={boardImg.onPaste} onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.max(200, t.scrollHeight) + "px"; }} />
                            </div>
                            {boardImg.preview}
                            <ColorPicker color={ideaColor} onColor={setIdeaColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={closeAdd} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={handleCreate} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardImg.uploading ? "⏳" : "게시"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail modal */}
            {selected && !isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={closeDetail}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selected.title}</h3>
                            <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="text-[12px] text-slate-400 mb-3">{MEMBERS[selected.author]?.emoji || "👤"} {selected.author} · {selected.date}</div>
                            {selected.body && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{selected.body}</div>}
                            {selected.imageUrl && <img src={selected.imageUrl} alt="" className="rounded-lg mb-4 cursor-pointer" style={{ maxWidth: '100%', height: 'auto' }} onClick={() => window.open(selected.imageUrl!, '_blank')} />}

                            {/* Comments section */}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({selected.comments.length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {selected.comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group relative">
                                            <button onClick={() => deleteComment(c.id)}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{renderChatMessage(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="rounded-md mt-1" style={{ maxWidth: '100%', height: 'auto' }} />}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {selected.comments.length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                {cImg.preview}
                                <div className="flex gap-2 items-center">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성... (Ctrl+V 이미지)"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onCompositionStart={() => { composingRef.current = true; }}
                                        onCompositionEnd={() => { composingRef.current = false; }}
                                        onPaste={cImg.onPaste} onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                                    <button onClick={addComment} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{cImg.uploading ? "⏳" : "전송"}</button>
                                </div>
                                {newComment && hasDraft(`comment_ideas_${selected.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            {(currentUser === selected.author || currentUser === "박일웅") && (
                                <button onClick={startEdit} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                            )}
                            <div className="flex items-center gap-3">
                                {(currentUser === selected.author || currentUser === "박일웅") && (
                                    <button onClick={() => confirmDel(() => { onDelete(selected.id); closeDetail(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={closeDetail} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {selected && isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setIsEditing(false); boardImg.clear(); }}>
                    <div className="bg-white rounded-xl w-full shadow-2xl" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">글 수정</h3>
                            <button onClick={() => { setIsEditing(false); boardImg.clear(); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" style={{height:48}} onPaste={boardImg.onPaste} />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <textarea value={body} onChange={e => setBody(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" style={{minHeight:200}} onPaste={boardImg.onPaste} onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.max(200, t.scrollHeight) + "px"; }} />
                            </div>
                            {boardImg.preview}
                            <ColorPicker color={ideaColor} onColor={setIdeaColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => { setIsEditing(false); boardImg.clear(); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveEdit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardImg.uploading ? "⏳" : "저장"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

const AnnouncementView = memo(function AnnouncementView({ announcements, onAdd, onDelete, onUpdate, onReorder, philosophy, onAddPhilosophy, onDeletePhilosophy, onUpdatePhilosophy, onReorderPhilosophy, currentUser }: {
    announcements: Announcement[]; onAdd: (text: string, pinned?: boolean, imageUrl?: string) => void; onDelete: (id: number) => void; onUpdate: (ann: Announcement) => void; onReorder: (list: Announcement[]) => void;
    philosophy: Announcement[]; onAddPhilosophy: (text: string, imageUrl?: string) => void; onDeletePhilosophy: (id: number) => void; onUpdatePhilosophy: (p: Announcement) => void; onReorderPhilosophy: (list: Announcement[]) => void;
    currentUser: string;
}) {
    const confirmDel = useContext(ConfirmDeleteContext);
    const COLS = [
        { key: "urgent", label: "🚨 긴급", color: "#EF4444", accent: "#FEE2E2" },
        { key: "general", label: "📌 일반", color: "#3B82F6", accent: "#DBEAFE" },
        { key: "culture", label: "🎯 문화", color: "#8B5CF6", accent: "#EDE9FE" },
    ] as const;
    type ColKey = typeof COLS[number]["key"];

    const [addingCol, setAddingCol] = useState<ColKey | null>(null);
    const [newText, setNewText] = useState("");
    const [selected, setSelected] = useState<(Announcement & { _col: ColKey }) | null>(null);
    const [editing, setEditing] = useState<(Announcement & { _col: ColKey }) | null>(null);
    const [editText, setEditText] = useState("");
    const [editImgUrl, setEditImgUrl] = useState<string>("");
    const [draggedItem, setDraggedItem] = useState<{ id: number; col: ColKey } | null>(null);
    const [dropCol, setDropCol] = useState<ColKey | null>(null);
    const [dropIdx, setDropIdx] = useState<number>(-1);

    const annImg = useCommentImg();
    const editImg = useCommentImg();

    const isLeader = currentUser === "박일웅" || Object.values(DEFAULT_TEAMS).some(t => t.lead === currentUser);
    const isPI = currentUser === "박일웅";

    // Draft
    useEffect(() => { const d = loadDraft("ann_board"); if (d) setNewText(d); }, []);
    useEffect(() => { if (addingCol) saveDraft("ann_board", newText); }, [newText, addingCol]);

    // Build column data
    const colData: Record<ColKey, (Announcement & { _col: ColKey })[]> = {
        urgent: announcements.filter(a => a.pinned).map(a => ({ ...a, _col: "urgent" as ColKey })),
        general: announcements.filter(a => !a.pinned).map(a => ({ ...a, _col: "general" as ColKey })),
        culture: philosophy.map(p => ({ ...p, _col: "culture" as ColKey })),
    };

    const openAdd = (col: ColKey) => { setAddingCol(col); setNewText(""); annImg.clear(); };
    const submitAdd = () => {
        if (!newText.trim() || !addingCol) return;
        const imgUrl = annImg.img || undefined;
        if (addingCol === "urgent") onAdd(newText.trim(), true, imgUrl);
        else if (addingCol === "general") onAdd(newText.trim(), false, imgUrl);
        else onAddPhilosophy(newText.trim(), imgUrl);
        setNewText(""); setAddingCol(null); clearDraft("ann_board"); annImg.clear();
    };
    const openEdit = (item: Announcement & { _col: ColKey }) => { setEditing(item); setEditText(item.text); setEditImgUrl(item.imageUrl || ""); editImg.clear(); };
    const saveEdit = () => {
        if (!editing || !editText.trim()) return;
        const finalImg = editImg.img || editImgUrl || undefined;
        const { _col, ...rest } = editing;
        const updated = { ...rest, text: editText.trim(), imageUrl: finalImg };
        if (_col === "culture") onUpdatePhilosophy(updated);
        else onUpdate(updated);
        setEditing(null); editImg.clear();
    };
    const deleteItem = (item: Announcement & { _col: ColKey }) => {
        if (item._col === "culture") onDeletePhilosophy(item.id);
        else onDelete(item.id);
    };

    const calcAnnDropIdx = (e: React.DragEvent, colEl: HTMLElement): number => {
        const cards = Array.from(colEl.querySelectorAll("[data-ann-card]"));
        for (let i = 0; i < cards.length; i++) {
            const rect = cards[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) return i;
        }
        return cards.length;
    };

    const handleDrop = (targetCol: ColKey, e: React.DragEvent) => {
        if (!draggedItem) { setDraggedItem(null); setDropCol(null); setDropIdx(-1); return; }
        const targetItems = colData[targetCol];
        const idx = dropIdx >= 0 ? dropIdx : targetItems.length;
        if (draggedItem.col === targetCol) {
            // Same-column reorder
            const oldIdx = targetItems.findIndex(it => it.id === draggedItem.id);
            if (oldIdx < 0 || oldIdx === idx || oldIdx === idx - 1) { setDraggedItem(null); setDropCol(null); setDropIdx(-1); return; }
            const arr = [...targetItems];
            const [moved] = arr.splice(oldIdx, 1);
            const insertAt = idx > oldIdx ? idx - 1 : idx;
            arr.splice(insertAt, 0, moved);
            if (targetCol === "culture") {
                onReorderPhilosophy(arr.map(({ _col, ...rest }) => rest));
            } else {
                // Rebuild full announcements: replace items of this column type while keeping the other type intact
                const otherPinned = targetCol === "urgent" ? false : true;
                const others = announcements.filter(a => a.pinned === otherPinned);
                const reordered = arr.map(({ _col, ...rest }) => rest);
                onReorder([...reordered, ...others]);
            }
        } else {
            // Cross-column move
            const srcCol = draggedItem.col;
            if (srcCol === "urgent" && targetCol === "general") {
                const ann = announcements.find(a => a.id === draggedItem.id);
                if (ann) onUpdate({ ...ann, pinned: false });
            } else if (srcCol === "general" && targetCol === "urgent") {
                const ann = announcements.find(a => a.id === draggedItem.id);
                if (ann) onUpdate({ ...ann, pinned: true });
            } else if ((srcCol === "urgent" || srcCol === "general") && targetCol === "culture") {
                const ann = announcements.find(a => a.id === draggedItem.id);
                if (ann) { onDelete(ann.id); onAddPhilosophy(ann.text, ann.imageUrl); }
            } else if (srcCol === "culture" && (targetCol === "urgent" || targetCol === "general")) {
                const phil = philosophy.find(p => p.id === draggedItem.id);
                if (phil) { onDeletePhilosophy(phil.id); onAdd(phil.text, targetCol === "urgent", phil.imageUrl); }
            }
        }
        setDraggedItem(null); setDropCol(null); setDropIdx(-1);
    };

    return (
        <div>
            <div className="flex gap-4">
                {COLS.map(col => {
                    const items = colData[col.key];
                    const colCfg = col;
                    return (
                        <div key={col.key} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDropCol(col.key); setDropIdx(calcAnnDropIdx(e, e.currentTarget as HTMLElement)); }}
                            onDragLeave={() => { setDropCol(null); setDropIdx(-1); }}
                            onDrop={e => handleDrop(col.key, e)}>
                            {/* Column header */}
                            <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: `2.5px solid ${colCfg.color}` }}>
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-bold" style={{ color: "#334155" }}>{colCfg.label}</span>
                                    <span className="text-[12px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: colCfg.accent, color: colCfg.color }}>{items.length}</span>
                                </div>
                                {isLeader && (
                                    <button onClick={() => openAdd(col.key)} className="flex items-center gap-1 px-3 py-1.5 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"><span className="text-[14px]">+</span> {col.key === "urgent" ? "긴급 공지" : col.key === "general" ? "일반 공지" : "문화 추가"}</button>
                                )}
                            </div>
                            {/* Add input */}
                            {addingCol === col.key && (
                                <div className="mb-3 rounded-xl p-3" style={{ background: "#F8F9FA", border: `1px solid ${colCfg.accent}` }}>
                                    <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="내용 작성... (Ctrl+V로 이미지 첨부)"
                                        className="w-full bg-transparent text-[14px] focus:outline-none resize-none" rows={2} autoFocus
                                        onPaste={annImg.onPaste}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newText.trim()) { e.preventDefault(); submitAdd(); } if (e.key === "Escape") { setAddingCol(null); setNewText(""); annImg.clear(); } }} />
                                    {annImg.preview}
                                    {annImg.uploading && <div className="text-[11px] text-slate-400 mb-1">업로드 중...</div>}
                                    <div className="flex justify-end gap-1.5 mt-1">
                                        <button onClick={() => { setAddingCol(null); setNewText(""); annImg.clear(); }} className="px-2.5 py-1 text-[12px] text-slate-400 hover:text-slate-600">취소</button>
                                        <button onClick={submitAdd} className="px-3 py-1 rounded-lg text-[12px] font-medium text-white" style={{ background: colCfg.color }}>게시</button>
                                    </div>
                                </div>
                            )}
                            {/* Cards */}
                            <div className={`min-h-[60px] space-y-2 rounded-lg transition-colors ${dropCol === col.key && draggedItem && draggedItem.col !== col.key ? "bg-blue-50/60" : ""}`}>
                                {items.map(item => (
                                    <div key={item.id} draggable data-ann-card
                                        onDragStart={() => setDraggedItem({ id: item.id, col: col.key })}
                                        onDragEnd={() => { setDraggedItem(null); setDropCol(null); setDropIdx(-1); }}
                                        onClick={() => setSelected(item)}
                                        className={`group/card bg-white rounded-xl p-3.5 cursor-grab transition-all flex flex-col ${draggedItem?.id === item.id ? "opacity-40" : ""}`}
                                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: `2px solid ${colCfg.color}` }}>
                                        <div className="flex items-start justify-between">
                                            <span className="text-[14px] text-slate-800 whitespace-pre-wrap line-clamp-4 flex-1" style={{ lineHeight: 1.6, wordBreak: 'break-all', overflowWrap: 'break-word' }}>{item.text}<SavingBadge id={item.id} /></span>
                                        </div>
                                        {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full rounded-lg mt-2" style={{ maxHeight: 300, objectFit: 'cover' }} />}
                                        <div className="mt-auto pt-2 text-[11px] text-slate-400">{item.author} · {item.date}</div>
                                    </div>
                                ))}
                                {items.length === 0 && !addingCol && (
                                    <div className="text-center py-8 text-[12px] text-slate-300">—</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* View modal (read-only) */}
            {selected && !editing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{selected._col === "culture" ? "🎯 문화" : selected._col === "urgent" ? "🚨 긴급 공지" : "📌 일반 공지"}</h3>
                            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4">
                            <p className="text-[14px] text-slate-800 whitespace-pre-wrap leading-relaxed" style={{ wordBreak: "break-all", overflowWrap: "break-word" }}>{selected.text}</p>
                            {selected.imageUrl && <img src={selected.imageUrl} alt="" className="w-full rounded-lg mt-3 cursor-pointer" style={{ maxHeight: 400, objectFit: "contain" }} onClick={() => window.open(selected.imageUrl, "_blank")} />}
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <span className="text-[12px] text-slate-400">{selected.author} · {selected.date}</span>
                            {(isPI || currentUser === selected.author) && (
                                <div className="flex gap-2">
                                    <button onClick={() => confirmDel(() => { deleteItem(selected); setSelected(null); })} className="px-3 py-1.5 text-[13px] text-red-500 hover:bg-red-50 rounded-lg transition-colors">삭제</button>
                                    <button onClick={() => { openEdit(selected); setSelected(null); }} className="px-4 py-1.5 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors">수정</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Edit modal */}
            {editing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setEditing(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{editing._col === "culture" ? "문화" : "공지사항"} 수정</h3>
                            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4">
                            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" autoFocus
                                onPaste={editImg.onPaste} placeholder="Ctrl+V로 이미지 첨부 가능" />
                            {editImg.uploading && <div className="text-[11px] text-slate-400 mt-1">업로드 중...</div>}
                            {editImg.img ? editImg.preview : editImgUrl ? (
                                <div className="mt-2 relative inline-block">
                                    <img src={editImgUrl} alt="" className="rounded-lg cursor-pointer" style={{ maxWidth: '100%', height: 'auto' }} onClick={() => window.open(editImgUrl, '_blank')} />
                                    <button onClick={() => setEditImgUrl("")} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button>
                                </div>
                            ) : null}
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={saveEdit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            <button onClick={() => confirmDel(() => { deleteItem(editing); setEditing(null); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// ─── Settings View ──────────────────────────────────────────────────────────


export { DailyTargetView, ConferenceTripView, ResourceView, IdeasView, AnnouncementView };
