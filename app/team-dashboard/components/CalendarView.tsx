"use client";

import { useState, useRef, useContext, memo } from "react";
import { MEMBERS, MEMBER_NAMES } from "../lib/constants";
import { genId } from "../lib/utils";
import { MembersContext } from "../lib/contexts";

function DispatchPanel({ dispatches, currentUser, onSave, onDelete }: {
    dispatches: Array<{ id: number; name: string; start: string; end: string; description: string }>;
    currentUser: string;
    onSave?: (d: { id: number; name: string; start: string; end: string; description: string }) => void;
    onDelete?: (id: number) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState(currentUser);
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [desc, setDesc] = useState("");
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();
    const active = dispatches.filter(d => d.end >= todayStr).sort((a, b) => a.start.localeCompare(b.start));
    const openEdit = (d: { id: number; name: string; start: string; end: string; description: string }) => {
        setEditId(d.id); setName(d.name); setStart(d.start); setEnd(d.end); setDesc(d.description); setShowForm(true);
    };
    const reset = () => { setEditId(null); setName(currentUser); setStart(""); setEnd(""); setDesc(""); setShowForm(false); };
    const submit = () => {
        if (!name || !start || !end) return;
        onSave?.({ id: editId || genId(), name, start, end, description: desc });
        reset();
    };
    return (
        <div className="mt-2 p-2.5 rounded-lg border border-violet-200 bg-violet-50/50">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-violet-700">🟣 파견 현황</span>
                {currentUser === "박일웅" && !showForm && (
                    <button onClick={() => setShowForm(true)} className="text-[11px] px-2 py-0.5 rounded bg-violet-100 text-violet-600 hover:bg-violet-200">+ 추가</button>
                )}
            </div>
            {active.length > 0 ? (
                <div className="flex flex-col gap-1">
                    {active.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-[12px] px-2 py-1 rounded bg-white border border-violet-100">
                            <div>
                                <span className="font-medium text-violet-800">{MEMBERS[d.name]?.emoji} {d.name}</span>
                                <span className="text-slate-400 ml-1.5">{d.start.slice(5)} ~ {d.end.slice(5)}</span>
                                {d.description && <span className="text-slate-500 ml-1">· {d.description}</span>}
                            </div>
                            {currentUser === "박일웅" && (
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => openEdit(d)} className="text-[11px] text-violet-500 hover:text-violet-700">수정</button>
                                    <button onClick={() => onDelete?.(d.id)} className="text-[11px] text-red-400 hover:text-red-600">삭제</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : !showForm && (
                <div className="text-[12px] text-slate-400">파견 중인 인원 없음</div>
            )}
            {showForm && (
                <div className="mt-1.5 p-2 rounded bg-white border border-violet-200 space-y-1.5">
                    <select value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-[13px]">
                        {Object.keys(MEMBERS).filter(k => k !== "박일웅").map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <div className="flex gap-1">
                        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1 text-[12px]" />
                        <span className="text-slate-400 text-[12px] self-center">~</span>
                        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1 text-[12px]" />
                    </div>
                    <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="파견처" className="w-full border border-slate-200 rounded px-2 py-1 text-[13px]" />
                    <div className="flex justify-end gap-1.5">
                        <button onClick={reset} className="text-[12px] text-slate-400 px-2 py-0.5">취소</button>
                        <button onClick={submit} className="text-[12px] text-white bg-violet-500 rounded px-2 py-0.5 font-medium">{editId ? "수정" : "추가"}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Vacation View ───────────────────────────────────────────────────────────

const CalendarGrid = memo(function CalendarGrid({ data, currentUser, types, onToggle, dispatches, onDispatchSave, onDispatchDelete, deadlines, onNavigate }: {
    data: Array<{ name: string; date: string; type: string; description?: string }>;
    currentUser: string;
    types: Record<string, { label: string; color: string; short: string }>;
    onToggle: (name: string, date: string, type: string | null, desc?: string) => void;
    dispatches?: Array<{ id: number; name: string; start: string; end: string; description: string }>;
    onDispatchSave?: (d: { id: number; name: string; start: string; end: string; description: string }) => void;
    onDispatchDelete?: (id: number) => void;
    deadlines?: Array<{ title: string; date: string; type: string; color: string; icon: string; tab: string }>;
    onNavigate?: (tab: string) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const isPI = currentUser === "박일웅";
    const [month, setMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
    const [selType, setSelType] = useState(Object.keys(types)[0]);
    const [editCell, setEditCell] = useState<{ name: string; date: string; existing?: { type: string; description?: string } } | null>(null);
    const [editDesc, setEditDesc] = useState("");
    // Drag selection state
    const [dragName, setDragName] = useState<string | null>(null);
    const [dragDates, setDragDates] = useState<string[]>([]);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const isDragging = useRef(false);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(month.y, month.m, i + 1);
        return { date: i + 1, dow: d.getDay(), str: `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}` };
    });
    const dayL = ["일", "월", "화", "수", "목", "금", "토"];
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();
    const monthDates = new Set(days.map(d => d.str));
    const getEntry = (name: string, dateStr: string) => data.find(v => v.name === name && v.date === dateStr);
    const countMonth = (name: string) => data.filter(v => v.name === name && monthDates.has(v.date) && (v.type === "vacation" || v.type === "wfh")).length;
    const countYear = (name: string) => data.filter(v => v.name === name && v.date.startsWith(String(month.y)) && (v.type === "vacation" || v.type === "wfh")).length;
    const isDispatchedOn = (name: string, dateStr: string) => (dispatches || []).some(d => d.name === name && d.start <= dateStr && d.end >= dateStr);
    const isDispatched = (name: string) => isDispatchedOn(name, todayStr);

    const scheduleTypeKeys = Object.keys(types).filter(k => k !== "vacation" && k !== "wfh");

    // Mobile list view state
    const [mobileOffset, setMobileOffset] = useState(0); // 0 = today-based, increments of 7

    return (
        <div>
            {/* Mobile list view */}
            <div className="md:hidden">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setMobileOffset(p => p - 7)} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[14px]">◀</button>
                    <span className="text-[15px] font-bold text-slate-800">{month.y}년 {month.m + 1}월</span>
                    <div className="flex items-center gap-1.5">
                        {mobileOffset !== 0 && <button onClick={() => setMobileOffset(0)} className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[12px] font-medium">오늘</button>}
                        <button onClick={() => setMobileOffset(p => p + 7)} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[14px]">▶</button>
                    </div>
                </div>
                <div className="space-y-1">
                    {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(); d.setDate(d.getDate() + mobileOffset + i);
                        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        const dayItems = data.filter(v => v.date === ds);
                        const dispatchItems = (dispatches || []).filter(dp => dp.start <= ds && dp.end >= ds);
                        const isToday = ds === todayStr;
                        const isTomorrow = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return ds === `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; })();
                        const dow = d.getDay();
                        const we = dow === 0 || dow === 6;
                        return (
                            <div key={ds} className={`rounded-xl p-3 ${isToday ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {isToday && <span className="text-[11px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">오늘</span>}
                                    {isTomorrow && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">내일</span>}
                                    <span className={`text-[14px] font-semibold ${we ? (dow === 0 ? "text-red-500" : "text-blue-500") : "text-slate-800"}`}>
                                        {d.getMonth() + 1}월 {d.getDate()}일 ({dayL[dow]})
                                    </span>
                                    {(isPI || true) && <button onClick={() => { setEditCell({ name: currentUser, date: ds }); setEditDesc(""); }} className="ml-auto text-[18px] text-slate-300 hover:text-blue-500">+</button>}
                                </div>
                                {dayItems.length === 0 && dispatchItems.length === 0 ? (
                                    <div className="text-[13px] text-slate-300 pl-1">일정 없음</div>
                                ) : (
                                    <div className="space-y-1">
                                        {dayItems.map(v => {
                                            const vt = types[v.type];
                                            return (
                                                <div key={`${v.name}-${v.type}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: `${vt?.color || "#94A3B8"}15` }}
                                                    onClick={() => { if (v.name === currentUser || isPI) { setSelType(v.type); setEditDesc(v.description || ""); setEditCell({ name: v.name, date: ds, existing: { type: v.type, description: v.description } }); } }}>
                                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: vt?.color || "#94A3B8" }} />
                                                    <span className="text-[13px]"><span className="font-semibold text-slate-700">{MEMBERS[v.name]?.emoji || "👤"}{v.name}</span> <span className="text-slate-500">{vt?.label}{v.description ? ` · ${v.description}` : ""}</span></span>
                                                </div>
                                            );
                                        })}
                                        {dispatchItems.map(dp => (
                                            <div key={dp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-50">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-violet-400" />
                                                <span className="text-[13px]"><span className="font-semibold text-slate-700">{MEMBERS[dp.name]?.emoji || "👤"}{dp.name}</span> <span className="text-violet-500">파견 · {dp.description}</span></span>
                                            </div>
                                        ))}
                                        {(deadlines || []).filter(dl => dl.date === ds).map((dl, dlIdx) => (
                                            <button key={`dl-${dlIdx}`} onClick={() => onNavigate?.(dl.tab)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-50 text-left">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:dl.color}} />
                                                <span className="text-[13px]"><span className="font-semibold" style={{color:dl.color}}>마감</span> <span className="text-slate-700">{dl.title}</span></span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* Dispatch section mobile */}
                <div className="mt-4">
                    <DispatchPanel dispatches={dispatches || []} currentUser={currentUser} onSave={onDispatchSave} onDelete={onDispatchDelete} />
                </div>
            </div>

            {/* Desktop grid view */}
            <div className="hidden md:block">
            <div className="flex items-center mb-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => setMonth(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { ...p, m: p.m - 1 })} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[14px]">◀</button>
                    <span className="text-[15px] font-bold text-slate-800 min-w-[120px] text-center">{month.y}년 {month.m + 1}월</span>
                    <button onClick={() => setMonth(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { ...p, m: p.m + 1 })} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[14px]">▶</button>
                    <button onClick={() => { const n = new Date(); setMonth({ y: n.getFullYear(), m: n.getMonth() }); }} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[12px] font-medium hover:bg-slate-200 ml-1">오늘</button>
                </div>
            </div>
            <div className="flex gap-3 items-start">
            <div className="shrink-0 relative" onMouseLeave={() => { if (isDragging.current) { isDragging.current = false; setDragName(null); setDragDates([]); setDragStart(null); } }}>
                <div className="absolute right-0 -top-5 flex gap-1.5 items-center z-10">
                    {Object.entries(types).filter(([k]) => scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                        <div key={k} className="flex items-center gap-0.5">
                            <span className="w-3 h-2.5 rounded" style={{ background: vt.color }} />
                            <span className="text-[11px] text-slate-500">{vt.label}</span>
                        </div>
                    ))}
                    <span className="text-slate-300 text-[11px]">|</span>
                    {Object.entries(types).filter(([k]) => !scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                        <div key={k} className="flex items-center gap-0.5">
                            <span className="w-3 h-2.5 rounded" style={{ background: vt.color }} />
                            <span className="text-[11px] text-slate-500">{vt.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-0.5">
                        <span className="w-3 h-2.5 rounded" style={{ background: "#a78bfa" }} />
                        <span className="text-[11px] text-slate-500">파견</span>
                    </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="border-collapse" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                        <col style={{ width: "68px" }} />
                        {days.map(d => <col key={d.date} style={{ width: "28px" }} />)}
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-1 py-2 text-center text-[13px] font-semibold text-slate-600 whitespace-nowrap">이름</th>
                            {days.map(d => {
                                const we = d.dow === 0 || d.dow === 6;
                                const td = d.str === todayStr;
                                const sel = d.str === selectedDate;
                                return (
                                    <th key={d.date} className={`border-b border-[#E2E8F0] px-0 py-1 text-center cursor-pointer hover:bg-blue-50 transition-colors ${sel ? "bg-amber-50 ring-1 ring-inset ring-amber-300" : td ? "bg-[#EFF6FF]" : we ? "bg-[#F8FAFC]" : "bg-white"}`}
                                        onClick={() => setSelectedDate(sel ? null : d.str)}>
                                        <div className={`text-[11px] leading-tight ${we ? (d.dow === 0 ? "text-red-400" : "text-blue-400") : "text-slate-400"}`}>{dayL[d.dow]}</div>
                                        <div className={`text-[13px] font-semibold leading-tight ${sel ? "text-amber-700" : td ? "text-blue-600" : we ? (d.dow === 0 ? "text-red-500" : "text-blue-500") : "text-slate-700"}`}>{d.date}</div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* 중요/공통 일정 rows – 박일웅만 편집 가능 */}
                        {["중요일정", "공통일정"].map(label => {
                            const canEdit = currentUser === "박일웅";
                            const entryFor = (ds: string) => data.find(v => v.name === label && v.date === ds);
                            const inDragRow = dragName === label;
                            return (
                                <tr key={label} className="bg-amber-50/40 hover:bg-amber-50/70">
                                    <td className="sticky left-0 z-10 border-r border-b border-amber-200/60 px-1 py-1.5 text-[12px] text-center whitespace-nowrap bg-amber-50 font-semibold text-amber-700">
                                        {label === "중요일정" ? "⭐ 중요" : "👥 공통"}
                                    </td>
                                    {days.map((d, di) => {
                                        const entry = entryFor(d.str);
                                        const we = d.dow === 0 || d.dow === 6;
                                        const td = d.str === todayStr;
                                        const vt = entry ? types[entry.type] : null;
                                        const inDrag = inDragRow && dragDates.includes(d.str);
                                        return (
                                            <td key={d.date}
                                                className={`border-b border-[#E2E8F0] text-center py-0.5 px-0 select-none ${td ? "bg-[#EFF6FF]" : we ? "bg-[#F8FAFC]" : ""} ${canEdit ? "cursor-pointer" : ""} ${inDrag ? "bg-amber-100" : ""}`}
                                                onMouseDown={() => {
                                                    if (!canEdit) return;
                                                    if (entry) { setSelType(entry.type); setEditDesc(entry.description || ""); setEditCell({ name: label, date: d.str, existing: { type: entry.type, description: entry.description } }); return; }
                                                    isDragging.current = true;
                                                    setDragName(label);
                                                    setDragStart(di);
                                                    setDragDates([d.str]);
                                                }}
                                                onMouseEnter={() => {
                                                    if (!isDragging.current || dragName !== label || dragStart === null) return;
                                                    const lo = Math.min(dragStart, di);
                                                    const hi = Math.max(dragStart, di);
                                                    setDragDates(days.slice(lo, hi + 1).map(x => x.str));
                                                }}
                                                onMouseUp={() => {
                                                    if (!isDragging.current || dragName !== label) { isDragging.current = false; setDragName(null); setDragDates([]); setDragStart(null); return; }
                                                    isDragging.current = false;
                                                    const dates = [...dragDates].filter(dt => !entryFor(dt));
                                                    setDragName(null); setDragDates([]); setDragStart(null);
                                                    if (dates.length === 0) return;
                                                    setEditCell({ name: label, date: dates.join(",") }); setEditDesc("");
                                                }}>
                                                {vt ? (
                                                    <div className="mx-auto w-[24px] h-[22px] rounded flex items-center justify-center text-[11px] font-bold text-white hover:scale-110 transition-transform"
                                                        style={{ background: vt.color }} title={entry?.description || vt.label}>{vt.short}</div>
                                                ) : canEdit ? (
                                                    <div className={`mx-auto w-[22px] h-[20px] rounded flex items-center justify-center ${inDrag ? "bg-amber-200" : "opacity-0 hover:opacity-100 bg-amber-100"} transition-opacity`}>
                                                        <span className="text-[11px] text-amber-300">+</span>
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {/* 마감 row — deadline dots */}
                        {deadlines && deadlines.length > 0 && (() => {
                            const dlByDate: Record<string, typeof deadlines> = {};
                            deadlines.forEach(dl => { if (!dlByDate[dl.date]) dlByDate[dl.date] = []; dlByDate[dl.date].push(dl); });
                            return (
                                <tr className="bg-red-50/30">
                                    <td className="sticky left-0 z-10 border-r border-b border-red-200/60 px-1 py-1.5 text-[12px] text-center whitespace-nowrap bg-red-50 font-semibold text-red-500">📌 마감</td>
                                    {days.map(d => {
                                        const dls = dlByDate[d.str];
                                        return (
                                            <td key={d.date} className="border-b border-[#E2E8F0] text-center py-0.5 px-0">
                                                {dls ? (
                                                    <div className="flex gap-[2px] justify-center flex-wrap">
                                                        {dls.slice(0, 3).map((dl, i) => (
                                                            <button key={i} onClick={() => onNavigate?.(dl.tab)} className="w-[8px] h-[8px] rounded-full hover:scale-150 transition-transform" style={{background:dl.color}} title={`${dl.icon} ${dl.title}`} />
                                                        ))}
                                                        {dls.length > 3 && <span className="text-[11px] text-slate-400">+{dls.length - 3}</span>}
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })()}
                        {MEMBER_NAMES.map(name => {
                            const isMe = name === currentUser;
                            const canEdit = isMe || isPI;
                            const dispatched = isDispatched(name);
                            return (
                                <tr key={name} className={`${isMe ? "bg-blue-50/30" : ""} hover:bg-slate-50/50`}>
                                    <td className={`sticky left-0 z-10 border-r border-b border-[#E2E8F0] px-1 py-1.5 text-[13px] text-center whitespace-nowrap overflow-hidden ${isMe ? "bg-blue-50 font-semibold text-slate-800" : "bg-white text-slate-600"}`}
                                        style={dispatched ? { borderLeft: "3px solid #8B5CF6", background: "#F5F3FF" } : undefined}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </td>
                                    {days.map((d, di) => {
                                        const entry = getEntry(name, d.str);
                                        const we = d.dow === 0 || d.dow === 6;
                                        const td = d.str === todayStr;
                                        const vt = entry ? types[entry.type] : null;
                                        const inDrag = dragName === name && dragDates.includes(d.str);
                                        const cellDispatched = isDispatchedOn(name, d.str);
                                        return (
                                            <td key={d.date}
                                                className={`border-b border-[#E2E8F0] text-center py-0.5 px-0 select-none ${cellDispatched ? "bg-violet-50/80" : td ? "bg-[#EFF6FF]" : we ? "bg-[#F8FAFC]" : ""} ${canEdit ? "cursor-pointer" : ""} ${inDrag ? "bg-blue-100" : ""}`}
                                                onMouseDown={() => {
                                                    if (!canEdit) return;
                                                    if (entry) { setSelType(entry.type); setEditDesc(entry.description || ""); setEditCell({ name, date: d.str, existing: { type: entry.type, description: entry.description } }); return; }
                                                    isDragging.current = true;
                                                    setDragName(name);
                                                    setDragStart(di);
                                                    setDragDates([d.str]);
                                                }}
                                                onMouseEnter={() => {
                                                    if (!isDragging.current || dragName !== name || dragStart === null) return;
                                                    const lo = Math.min(dragStart, di);
                                                    const hi = Math.max(dragStart, di);
                                                    setDragDates(days.slice(lo, hi + 1).map(x => x.str));
                                                }}
                                                onMouseUp={() => {
                                                    if (!isDragging.current || dragName !== name) { isDragging.current = false; setDragName(null); setDragDates([]); setDragStart(null); return; }
                                                    isDragging.current = false;
                                                    const dates = [...dragDates].filter(dt => !getEntry(name, dt));
                                                    setDragName(null); setDragDates([]); setDragStart(null);
                                                    if (dates.length === 0) return;
                                                    setEditCell({ name, date: dates.join(",") }); setEditDesc("");
                                                }}>
                                                {vt ? (
                                                    <div className="mx-auto w-[24px] h-[22px] rounded flex items-center justify-center text-[11px] font-bold text-white hover:scale-110 transition-transform"
                                                        style={{ background: vt.color }} title={entry?.description || vt.label}>{vt.short}</div>
                                                ) : canEdit ? (
                                                    <div className={`mx-auto w-[22px] h-[20px] rounded flex items-center justify-center ${inDrag ? "bg-blue-200" : "opacity-0 hover:opacity-100 bg-slate-100"} transition-opacity`}>
                                                        <span className="text-[11px] text-slate-300">+</span>
                                                    </div>
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
            </div>
            {/* Right sidebar – week summary (based on selected or current date) */}
            <div className="flex-1 min-w-[200px] hidden lg:block">
                {(() => {
                    // 기준일: 선택한 날짜 또는 오늘
                    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
                    const dow = baseDate.getDay();
                    const monday = new Date(baseDate);
                    monday.setDate(baseDate.getDate() - ((dow === 0 ? 7 : dow) - 1));
                    const weekDates: string[] = [];
                    for (let i = 0; i < 5; i++) {
                        const dd = new Date(monday);
                        dd.setDate(monday.getDate() + i);
                        weekDates.push(`${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`);
                    }
                    const weekItems = data.filter(v => weekDates.includes(v.date));
                    const monLabel = `${monday.getMonth() + 1}/${monday.getDate()}`;
                    const fri = new Date(monday); fri.setDate(monday.getDate() + 4);
                    const friLabel = `${fri.getMonth() + 1}/${fri.getDate()}`;
                    const isThisWeek = !selectedDate;
                    const bgColor = isThisWeek ? "bg-white border-slate-200" : "bg-white border-slate-200";
                    const titleColor = isThisWeek ? "text-slate-800" : "text-blue-700";
                    const dayTitleColor = isThisWeek ? "text-slate-600" : "text-blue-600";
                    const cardBorder = isThisWeek ? "border-slate-200 text-slate-700" : "border-blue-200 text-blue-800";
                    const weekLabel = isThisWeek ? "이번 주" : `${monLabel} ~ ${friLabel} 주`;
                    return (
                        <div className={`p-3 rounded-xl border sticky top-0 ${bgColor}`} style={{borderLeft: isThisWeek ? "3px solid #F59E0B" : "3px solid #3B82F6"}}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[14px] font-semibold ${titleColor}`}>📋 {weekLabel} ({monLabel} ~ {friLabel})</span>
                                {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-[11px] text-blue-400 hover:text-blue-600">✕ 이번 주</button>}
                            </div>
                            {weekItems.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {weekDates.map(dateStr => {
                                        const dayItems = weekItems.filter(v => v.date === dateStr);
                                        if (dayItems.length === 0) return null;
                                        const dd = new Date(dateStr);
                                        const dayLabel = `${dd.getMonth() + 1}/${dd.getDate()}(${dayL[dd.getDay()]})`;
                                        const isSelected = dateStr === selectedDate;
                                        return (
                                            <div key={dateStr}>
                                                <div className={`text-[11px] font-semibold ${dayTitleColor} mt-1 mb-0.5 ${isSelected ? "underline underline-offset-2" : ""}`}>{dayLabel}</div>
                                                {dayItems.map(v => {
                                                    const vt = types[v.type];
                                                    return <div key={`${v.name}-${v.type}-${v.date}`} className={`text-[13px] px-2 py-1 rounded-md bg-white border ${cardBorder} mb-0.5`}>
                                                        <span className="font-medium">{MEMBERS[v.name]?.emoji || "⭐"}{v.name}</span>
                                                        <span className="text-[12px] text-slate-500 ml-1">{vt?.label}{v.description ? `: ${v.description}` : ""}</span>
                                                    </div>;
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-[13px] text-slate-400">이번 주 일정이 없습니다</div>
                            )}
                        </div>
                    );
                })()}
                {/* 주간 마감 */}
                {deadlines && deadlines.length > 0 && (() => {
                    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
                    const dow2 = baseDate.getDay();
                    const monday2 = new Date(baseDate);
                    monday2.setDate(baseDate.getDate() - ((dow2 === 0 ? 7 : dow2) - 1));
                    const friday2 = new Date(monday2);
                    friday2.setDate(monday2.getDate() + 4);
                    const monStr = `${monday2.getFullYear()}-${String(monday2.getMonth() + 1).padStart(2, "0")}-${String(monday2.getDate()).padStart(2, "0")}`;
                    const friStr = `${friday2.getFullYear()}-${String(friday2.getMonth() + 1).padStart(2, "0")}-${String(friday2.getDate()).padStart(2, "0")}`;
                    const weekDl = deadlines.filter(dl => dl.date >= monStr && dl.date <= friStr);
                    if (weekDl.length === 0) return null;
                    return (
                        <div className="p-3 rounded-xl border border-red-200 bg-white sticky mt-3" style={{borderLeft:"3px solid #EF4444"}}>
                            <div className="text-[14px] font-semibold text-red-600 mb-2">📌 이번 주 마감 ({weekDl.length})</div>
                            <div className="space-y-1">
                                {weekDl.map((dl, i) => {
                                    const dd = new Date(dl.date);
                                    const dayL2 = ["일", "월", "화", "수", "목", "금", "토"];
                                    return (
                                        <button key={i} onClick={() => onNavigate?.(dl.tab)} className="w-full text-left text-[13px] px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{background:dl.color}} />
                                            <span className="font-medium text-slate-700 truncate flex-1">{dl.title}</span>
                                            <span className="text-[11px] text-slate-400 shrink-0">{dd.getMonth() + 1}/{dd.getDate()}({dayL2[dd.getDay()]})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
                {/* 파견 관리 패널 – 모두 열람, 박일웅만 편집 */}
                <DispatchPanel dispatches={dispatches || []} currentUser={currentUser} onSave={onDispatchSave} onDelete={onDispatchDelete} />
            </div>
            </div>
            </div>
            {/* Inline event form for schedule mode */}
            {editCell && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setEditCell(null)}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">
                            {editCell.existing ? `${editCell.date} 수정` : editCell.date.includes(",") ? `${editCell.date.split(",").length}일 추가` : `${editCell.date} 추가`}
                        </h4>
                        <div className="mb-3">
                            <div className="flex flex-wrap gap-1 mb-1">
                                {Object.entries(types).filter(([k]) => scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                                    <button key={k} onClick={() => setSelType(k)}
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${selType === k ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={selType === k ? { background: vt.color } : undefined}>{vt.label}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(types).filter(([k]) => !scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                                    <button key={k} onClick={() => setSelType(k)}
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${selType === k ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={selType === k ? { background: vt.color } : undefined}>{vt.label}</button>
                                ))}
                            </div>
                        </div>
                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="내용입력" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        <div className="flex justify-between">
                            {editCell.existing ? (
                                <button onClick={() => { onToggle(editCell.name, editCell.date, null); setEditCell(null); }}
                                    className="px-3 py-1.5 text-[13px] text-red-500 hover:bg-red-50 rounded-lg font-medium">삭제</button>
                            ) : <div />}
                            <div className="flex gap-2">
                                <button onClick={() => setEditCell(null)} className="px-3 py-1.5 text-[13px] text-slate-500">취소</button>
                                <button onClick={() => { onToggle(editCell.name, editCell.date, selType, editDesc); setEditCell(null); }}
                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium">{editCell.existing ? "수정" : "추가"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// ─── Timetable View ──────────────────────────────────────────────────────────


export { DispatchPanel, CalendarGrid };
