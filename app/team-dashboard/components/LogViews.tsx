"use client";

import { useState, useEffect, useMemo, useContext, memo } from "react";
import type { AnalysisLogEntry, ExpLogEntry } from "../lib/types";
import { MEMBERS } from "../lib/constants";
import { genId, uploadFile } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";

const AnalysisLogView = memo(function AnalysisLogView({ bookName, entries, onSave, onDelete, currentUser, categories }: {
    bookName: string; entries: AnalysisLogEntry[]; onSave: (e: AnalysisLogEntry) => void; onDelete: (id: number) => void; currentUser: string; categories?: string[];
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDelete = useContext(ConfirmDeleteContext);
    const [formOpen, setFormOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<AnalysisLogEntry | null>(null);
    const [category, setCategory] = useState("");
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; });
    const [tool, setTool] = useState("");
    const [meshInfo, setMeshInfo] = useState("");
    const [boundaryConditions, setBoundaryConditions] = useState("");
    const [results, setResults] = useState("");
    const [notes, setNotes] = useState("");
    const [imgUrl, setImgUrl] = useState("");
    const [imgUploading, setImgUploading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [localPending, setLocalPending] = useState<AnalysisLogEntry[]>([]);
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();

    // Clear pending when parent props catch up
    useEffect(() => {
        if (localPending.length === 0) return;
        const ids = new Set(entries.map(e => e.id));
        setLocalPending(prev => { const next = prev.filter(e => !ids.has(e.id)); return next.length === prev.length ? prev : next; });
    }, [entries]);

    // Merge props + optimistic local entries
    const mergedEntries = useMemo(() => {
        const ids = new Set(entries.map(e => e.id));
        const updated = entries.map(e => { const p = localPending.find(l => l.id === e.id); return p || e; });
        return [...updated, ...localPending.filter(e => !ids.has(e.id))];
    }, [entries, localPending]);

    const openAdd = () => { setEditEntry(null); setTitle(""); setDate(todayStr); setTool(""); setMeshInfo(""); setBoundaryConditions(""); setResults(""); setNotes(""); setImgUrl(""); setCategory(""); setFormOpen(true); };
    const openEdit = (e: AnalysisLogEntry) => { setEditEntry(e); setTitle(e.title); setDate(e.date); setTool(e.tool); setMeshInfo(e.meshInfo); setBoundaryConditions(e.boundaryConditions); setResults(e.results); setNotes(e.notes); setImgUrl(e.imageUrl || ""); setCategory(e.category || ""); setFormOpen(true); };
    const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setImgUploading(true);
        try { const url = await uploadFile(file); setImgUrl(url); } catch { alert("이미지 업로드에 실패했습니다."); }
        setImgUploading(false); e.target.value = "";
    };
    const handleSubmit = () => {
        if (!title.trim()) return;
        const entry: AnalysisLogEntry = editEntry
            ? { ...editEntry, title: title.trim(), date, tool, meshInfo, boundaryConditions, results, notes, imageUrl: imgUrl || undefined, createdAt: editEntry.createdAt, category: category || undefined }
            : { id: genId(), title: title.trim(), date, author: currentUser, tool, meshInfo, boundaryConditions, results, notes, imageUrl: imgUrl || undefined, createdAt: todayStr, category: category || undefined };
        setLocalPending(prev => [...prev.filter(e => e.id !== entry.id), entry]);
        onSave(entry);
        setFormOpen(false);
    };

    const sorted = useMemo(() => [...mergedEntries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [mergedEntries]);
    const filtered = useMemo(() => {
        if (!search.trim()) return sorted;
        const q = search.toLowerCase();
        return sorted.filter(e => e.title.toLowerCase().includes(q) || e.tool.toLowerCase().includes(q) || e.meshInfo?.toLowerCase().includes(q) || e.boundaryConditions?.toLowerCase().includes(q) || e.results?.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q));
    }, [sorted, search]);

    const dateGroups = useMemo(() => {
        const groups: Array<{ date: string; label: string; entries: AnalysisLogEntry[] }> = [];
        const dayL = ["일", "월", "화", "수", "목", "금", "토"];
        let cur = "";
        for (const e of filtered) {
            if (e.date !== cur) {
                cur = e.date;
                const d = new Date(e.date + "T00:00:00");
                groups.push({ date: e.date, label: `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${dayL[d.getDay()]})`, entries: [] });
            }
            groups[groups.length - 1].entries.push(e);
        }
        return groups;
    }, [filtered]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-[20px] font-bold text-slate-900">💻 {bookName}</h2>
                <button onClick={openAdd} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600 transition-colors shadow-sm">+ 기록 추가</button>
            </div>
            {mergedEntries.length > 3 && (
                <div className="mb-4">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="도구, 격자, 경계조건, 결과 검색..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
            )}
            <div className="flex items-center gap-4 mb-4 text-[13px] text-slate-500">
                <span>전체 <span className="font-bold text-slate-700">{mergedEntries.length}</span>건</span>
                <span>오늘 <span className="font-bold text-blue-600">{mergedEntries.filter(e => e.date === todayStr).length}</span>건</span>
            </div>
            {dateGroups.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-[40px] mb-3">🖥️</div>
                    <div className="text-3xl mb-2 opacity-40">🖥️</div>
                <div className="text-[15px] text-slate-400 mb-1">아직 해석 기록이 없습니다</div>
                    <div className="text-[13px] text-slate-300 mb-4">해석을 진행하고 기록을 남겨보세요</div>
                    <button onClick={openAdd} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 첫 기록 추가</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {dateGroups.map(g => (
                        <div key={g.date}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[14px] font-bold ${g.date === todayStr ? "text-blue-600" : "text-slate-700"}`}>{g.label}</span>
                                {g.date === todayStr && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold">오늘</span>}
                                <span className="text-[12px] text-slate-400">{g.entries.length}건</span>
                            </div>
                            <div className="space-y-2">
                                {g.entries.map(entry => {
                                    const isExpanded = expandedId === entry.id;
                                    return (
                                        <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-sm">
                                            <button onClick={() => setExpandedId(isExpanded ? null : entry.id)} className="w-full text-left p-4 flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[15px] font-semibold text-slate-800 leading-snug">{entry.title}</div>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        {entry.category && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{entry.category}</span>}
                                                        {entry.tool && <span className="text-[12px] text-slate-500">🔧 {entry.tool}</span>}
                                                        {entry.meshInfo && <span className="text-[12px] text-slate-400 truncate max-w-[200px]">📐 {entry.meshInfo}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] text-slate-400">{MEMBERS[entry.author]?.emoji} {entry.author}</span>
                                                    <span className="text-[16px] text-slate-300 transition-transform" style={{transform: isExpanded ? "rotate(180deg)" : "rotate(0)"}}>{isExpanded ? "▲" : "▼"}</span>
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                                        {entry.tool && (
                                                            <div className="rounded-lg p-3" style={{background:"#F8FAFC"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">🔧 해석 도구</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.tool}</div>
                                                            </div>
                                                        )}
                                                        {entry.meshInfo && (
                                                            <div className="rounded-lg p-3" style={{background:"#F0F9FF"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">📐 격자 정보</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.meshInfo}</div>
                                                            </div>
                                                        )}
                                                        {entry.boundaryConditions && (
                                                            <div className="rounded-lg p-3" style={{background:"#FFF7ED"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">⚙️ 경계 조건</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.boundaryConditions}</div>
                                                            </div>
                                                        )}
                                                        {entry.results && (
                                                            <div className="rounded-lg p-3" style={{background:"#F0FDF4"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">📊 결과</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.results}</div>
                                                            </div>
                                                        )}
                                                        {entry.notes && (
                                                            <div className="rounded-lg p-3" style={{background:"#FFFBEB"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">💬 의견</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.notes}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {entry.imageUrl && (
                                                        <div className="mt-3">
                                                            <img src={entry.imageUrl} alt="" className="max-h-[300px] rounded-lg border border-slate-200 object-contain cursor-pointer" onClick={() => window.open(entry.imageUrl, '_blank')} />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-3 pt-2" style={{borderTop:"1px solid #F1F5F9"}}>
                                                        <span className="text-[11px] text-slate-300">작성: {entry.createdAt}</span>
                                                        <button onClick={() => openEdit(entry)} className="text-[12px] text-blue-500 hover:text-blue-700 font-medium">수정</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={openAdd} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center text-[24px] hover:bg-blue-600 active:scale-95 transition-all">+</button>
            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.4)"}} role="dialog" aria-modal="true" onClick={() => setFormOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5">
                            <h3 className="text-[18px] font-bold text-slate-900 mb-4">{editEntry ? "해석 기록 수정" : "해석 기록 추가"}</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">해석명 *</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: ANSYS Fluent CHF 시뮬레이션 #2" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">날짜</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                                </div>
                                {categories && categories.length > 0 && (
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-500 mb-1 block">📂 분류</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white">
                                            <option value="">미분류</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">🔧 해석 도구</label>
                                    <input value={tool} onChange={e => setTool(e.target.value)} placeholder="예: ANSYS Fluent 2024R2, OpenFOAM v2312..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">📐 격자 정보</label>
                                    <textarea value={meshInfo} onChange={e => setMeshInfo(e.target.value)} placeholder="격자 유형, 셀 수, 격자 품질, y+ 등" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">⚙️ 경계 조건</label>
                                    <textarea value={boundaryConditions} onChange={e => setBoundaryConditions(e.target.value)} placeholder="inlet/outlet 조건, 벽면 조건, 열유속 등" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">📊 결과</label>
                                    <textarea value={results} onChange={e => setResults(e.target.value)} placeholder="수렴 결과, 핵심 수치, 비교 분석 등" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">💬 의견</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="관찰사항, 문제점, 다음 해석 계획 등" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">📷 이미지</label>
                                    <input type="file" accept="image/*" onChange={handleImg} className="w-full text-[13px] text-slate-500" />
                                    {imgUploading && <span className="text-[12px] text-blue-500">업로드 중...</span>}
                                    {imgUrl && <img src={imgUrl} alt="" className="mt-2 max-h-[150px] rounded-lg border border-slate-200 object-contain" />}
                                </div>
                            </div>
                            <div className="flex justify-between mt-5">
                                {editEntry ? (
                                    <button onClick={() => { confirmDelete(() => { onDelete(editEntry.id); setFormOpen(false); }); }} className="px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 rounded-lg font-medium">삭제</button>
                                ) : <div />}
                                <div className="flex gap-2">
                                    <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                    <button onClick={handleSubmit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{imgUploading ? "⏳" : editEntry ? "수정" : "추가"}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// ─── Experiment Log View (per-team daily log) ────────────────────────────────

const ExpLogView = memo(function ExpLogView({ teamName, entries, onSave, onDelete, currentUser, categories }: {
    teamName: string; entries: ExpLogEntry[]; onSave: (e: ExpLogEntry) => void; onDelete: (id: number) => void; currentUser: string; categories?: string[];
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDelete = useContext(ConfirmDeleteContext);
    const [formOpen, setFormOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<ExpLogEntry | null>(null);
    const [category, setCategory] = useState("");
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; });
    const [conditions, setConditions] = useState("");
    const [specimen, setSpecimen] = useState("");
    const [dataField, setDataField] = useState("");
    const [notes, setNotes] = useState("");
    const [imgUrl, setImgUrl] = useState("");
    const [imgUploading, setImgUploading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [localPending, setLocalPending] = useState<ExpLogEntry[]>([]);

    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();

    // Clear pending when parent props catch up
    useEffect(() => {
        if (localPending.length === 0) return;
        const ids = new Set(entries.map(e => e.id));
        setLocalPending(prev => { const next = prev.filter(e => !ids.has(e.id)); return next.length === prev.length ? prev : next; });
    }, [entries]);

    // Merge props + optimistic local entries
    const mergedEntries = useMemo(() => {
        const ids = new Set(entries.map(e => e.id));
        const updated = entries.map(e => { const p = localPending.find(l => l.id === e.id); return p || e; });
        return [...updated, ...localPending.filter(e => !ids.has(e.id))];
    }, [entries, localPending]);

    const openAdd = () => { setEditEntry(null); setTitle(""); setDate(todayStr); setConditions(""); setSpecimen(""); setDataField(""); setNotes(""); setImgUrl(""); setCategory(""); setFormOpen(true); };
    const openEdit = (e: ExpLogEntry) => { setEditEntry(e); setTitle(e.title); setDate(e.date); setConditions(e.conditions); setSpecimen(e.specimen || ""); setDataField(e.data || ""); setNotes(e.notes || ""); setImgUrl(e.imageUrl || ""); setCategory(e.category || ""); setFormOpen(true); };
    const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setImgUploading(true);
        try { const url = await uploadFile(file); setImgUrl(url); } catch { alert("이미지 업로드에 실패했습니다."); }
        setImgUploading(false); e.target.value = "";
    };
    const handleSubmit = () => {
        if (!title.trim()) return;
        const now = todayStr;
        const entry: ExpLogEntry = editEntry
            ? { ...editEntry, title: title.trim(), date, conditions, specimen, data: dataField, notes, imageUrl: imgUrl || undefined, createdAt: editEntry.createdAt, category: category || undefined }
            : { id: genId(), title: title.trim(), date, author: currentUser, conditions, specimen, data: dataField, notes, imageUrl: imgUrl || undefined, createdAt: now, category: category || undefined };
        setLocalPending(prev => [...prev.filter(e => e.id !== entry.id), entry]);
        onSave(entry);
        setFormOpen(false);
    };

    // Sort by date descending, group by date
    const sorted = useMemo(() => [...mergedEntries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [mergedEntries]);
    const filtered = useMemo(() => {
        if (!search.trim()) return sorted;
        const q = search.toLowerCase();
        return sorted.filter(e => e.title.toLowerCase().includes(q) || e.conditions.toLowerCase().includes(q) || e.data?.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q) || e.author.includes(q));
    }, [sorted, search]);

    const dateGroups = useMemo(() => {
        const groups: Array<{ date: string; label: string; entries: ExpLogEntry[] }> = [];
        const dayL = ["일", "월", "화", "수", "목", "금", "토"];
        let cur = "";
        for (const e of filtered) {
            if (e.date !== cur) {
                cur = e.date;
                const d = new Date(e.date + "T00:00:00");
                groups.push({ date: e.date, label: `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${dayL[d.getDay()]})`, entries: [] });
            }
            groups[groups.length - 1].entries.push(e);
        }
        return groups;
    }, [filtered]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-[20px] font-bold text-slate-900">✏️ {teamName}</h2>
                <button onClick={openAdd} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600 transition-colors shadow-sm">+ 기록 추가</button>
            </div>

            {/* Search */}
            {mergedEntries.length > 3 && (
                <div className="mb-4">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="실험명, 조건, 데이터 검색..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-[13px] text-slate-500">
                <span>전체 <span className="font-bold text-slate-700">{mergedEntries.length}</span>건</span>
                <span>오늘 <span className="font-bold text-blue-600">{mergedEntries.filter(e => e.date === todayStr).length}</span>건</span>
            </div>

            {/* Date-grouped list */}
            {dateGroups.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-[40px] mb-3">🧪</div>
                    <div className="text-3xl mb-2 opacity-40">🧪</div>
                <div className="text-[15px] text-slate-400 mb-1">아직 실험 기록이 없습니다</div>
                    <div className="text-[13px] text-slate-300 mb-4">실험을 진행하고 기록을 남겨보세요</div>
                    <button onClick={openAdd} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 첫 기록 추가</button>
                </div>
            ) : (
                <div className="space-y-4">
                    {dateGroups.map(g => (
                        <div key={g.date}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[14px] font-bold ${g.date === todayStr ? "text-blue-600" : "text-slate-700"}`}>{g.label}</span>
                                {g.date === todayStr && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold">오늘</span>}
                                <span className="text-[12px] text-slate-400">{g.entries.length}건</span>
                            </div>
                            <div className="space-y-2">
                                {g.entries.map(entry => {
                                    const isExpanded = expandedId === entry.id;
                                    return (
                                        <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:shadow-sm">
                                            <button onClick={() => setExpandedId(isExpanded ? null : entry.id)} className="w-full text-left p-4 flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[15px] font-semibold text-slate-800 leading-snug">{entry.title}</div>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        {entry.category && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{entry.category}</span>}
                                                        {entry.conditions && <span className="text-[12px] text-slate-400 truncate max-w-[200px]">⚙️ {entry.conditions}</span>}
                                                        {entry.specimen && <span className="text-[12px] text-slate-400 truncate max-w-[200px]">🧪 {entry.specimen}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] text-slate-400">{MEMBERS[entry.author]?.emoji} {entry.author}</span>
                                                    <span className="text-[16px] text-slate-300 transition-transform" style={{transform: isExpanded ? "rotate(180deg)" : "rotate(0)"}}>{isExpanded ? "▲" : "▼"}</span>
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                                        {entry.conditions && (
                                                            <div className="rounded-lg p-3" style={{background:"#F8FAFC"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">⚙️ 실험 조건</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.conditions}</div>
                                                            </div>
                                                        )}
                                                        {entry.specimen && (
                                                            <div className="rounded-lg p-3" style={{background:"#FDF2F8"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">🧪 시편/장비</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.specimen}</div>
                                                            </div>
                                                        )}
                                                        {entry.data && (
                                                            <div className="rounded-lg p-3" style={{background:"#F0FDF4"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">📊 데이터</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.data}</div>
                                                            </div>
                                                        )}
                                                        {entry.notes && (
                                                            <div className="rounded-lg p-3" style={{background:"#FFFBEB"}}>
                                                                <div className="text-[11px] font-bold text-slate-400 mb-1">💬 의견</div>
                                                                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.notes}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {entry.imageUrl && (
                                                        <div className="mt-3">
                                                            <img src={entry.imageUrl} alt="" className="max-h-[300px] rounded-lg border border-slate-200 object-contain cursor-pointer" onClick={() => window.open(entry.imageUrl, '_blank')} />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-3 pt-2" style={{borderTop:"1px solid #F1F5F9"}}>
                                                        <span className="text-[11px] text-slate-300">작성: {entry.createdAt}</span>
                                                        <button onClick={() => openEdit(entry)} className="text-[12px] text-blue-500 hover:text-blue-700 font-medium">수정</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mobile FAB */}
            <button onClick={openAdd} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center text-[24px] hover:bg-blue-600 active:scale-95 transition-all">+</button>

            {/* Form modal */}
            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.4)"}} role="dialog" aria-modal="true" onClick={() => setFormOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5">
                            <h3 className="text-[18px] font-bold text-slate-900 mb-4">{editEntry ? "실험 기록 수정" : "실험 기록 추가"}</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">실험명 *</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: Pool boiling CHF 측정 #3" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">실험 날짜</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                                </div>
                                {categories && categories.length > 0 && (
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-500 mb-1 block">📂 분류</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white">
                                            <option value="">미분류</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">⚙️ 실험 조건</label>
                                    <textarea value={conditions} onChange={e => setConditions(e.target.value)} placeholder="유속, 온도, 압력, 히터 전력, 냉각수 유량 등" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">🧪 시편/장비</label>
                                    <textarea value={specimen} onChange={e => setSpecimen(e.target.value)} placeholder="시편 종류(Cu 20×20mm, SiC 코팅 등), 사용 장비, 센서 정보 등" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">📊 데이터</label>
                                    <textarea value={dataField} onChange={e => setDataField(e.target.value)} placeholder="측정 결과, 열유속, HTC 값, 주요 수치 등" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">💬 의견</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="관찰사항, 문제점, 다음 실험 계획 등" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 mb-1 block">📷 이미지</label>
                                    <input type="file" accept="image/*" onChange={handleImg} className="w-full text-[13px] text-slate-500" />
                                    {imgUploading && <span className="text-[12px] text-blue-500">업로드 중...</span>}
                                    {imgUrl && <img src={imgUrl} alt="" className="mt-2 max-h-[150px] rounded-lg border border-slate-200 object-contain" />}
                                </div>
                            </div>
                            <div className="flex justify-between mt-5">
                                {editEntry ? (
                                    <button onClick={() => { confirmDelete(() => { onDelete(editEntry.id); setFormOpen(false); }); }} className="px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 rounded-lg font-medium">삭제</button>
                                ) : <div />}
                                <div className="flex gap-2">
                                    <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                    <button onClick={handleSubmit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{imgUploading ? "⏳" : editEntry ? "수정" : "추가"}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

// ─── Main Dashboard ──────────────────────────────────────────────────────────


export { AnalysisLogView, ExpLogView };
