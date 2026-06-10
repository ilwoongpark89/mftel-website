"use client";

import { useState, useRef, useContext, memo } from "react";
import type { Comment, Report, ChecklistItem, LabFile } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, REPORT_STATUS_CONFIG, REPORT_STATUS_KEYS } from "../lib/constants";
import { genId, toggleArr, statusText, chatKeyDown, renderChatMessage, calcDropIdx, reorderKanbanItems } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useCommentImg } from "../lib/hooks";
import { DropLine, ItemFiles, PillSelect, SavingBadge, TeamSelect, MobileReorderButtons, moveInColumn, DetailModal3Col } from "./shared";
import type { ChatMessage } from "./shared";

function ReportFormModal({ report, initialCategory, onSave, onDelete, onClose, currentUser, teamNames }: {
    report: Report | null; initialCategory?: string; onSave: (r: Report) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; teamNames?: string[];
}) {
    const confirmDel = useContext(ConfirmDeleteContext);
    const isEdit = !!report;
    const [title, setTitle] = useState(report?.title || "");
    const [assignees, setAssignees] = useState<string[]>(report?.assignees || []);
    const [deadline, setDeadline] = useState(report?.deadline || "");
    const [status, setStatus] = useState(report?.status || "planning");
    const [checklist, setChecklist] = useState<ChecklistItem[]>(report?.checklist || []);
    const [newItem, setNewItem] = useState("");
    const [comments, setComments] = useState<Comment[]>(report?.comments || []);
    const [newComment, setNewComment] = useState("");
    const cImg = useCommentImg();
    const composingRef = useRef(false);
    const [category] = useState(report?.category || initialCategory || "계획서");
    const [team, setTeam] = useState(report?.team || "");
    const [files, setFiles] = useState<LabFile[]>(report?.files || []);
    const [tried, setTried] = useState(false);


    const doneCount = checklist.filter(c => c.done).length;
    const autoProgress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

    const handleSave = () => {
        setTried(true);
        if (!title.trim() || assignees.length === 0) return false;
        onSave({ id: report?.id ?? genId(), title, assignees, creator: report?.creator || currentUser, deadline, progress: autoProgress, comments, status, createdAt: report?.createdAt || new Date().toLocaleDateString("ko-KR"), checklist, category, team, files });
        return true;
    };
    const addChecklistItem = () => {
        if (!newItem.trim()) return;
        setChecklist([...checklist, { id: genId(), text: newItem.trim(), done: false }]);
        setNewItem("");
    };
    const toggleChecklistItem = (id: number) => {
        setChecklist(checklist.map(c => c.id === id ? { ...c, done: !c.done } : c));
    };
    const removeChecklistItem = (id: number) => {
        setChecklist(checklist.filter(c => c.id !== id));
    };
    const addComment = () => {
        if (!newComment.trim() && !cImg.img) return;
        setComments([...comments, { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }]);
        setNewComment(""); cImg.clear();
    };
    const isDirty = title.trim() !== (report?.title || "");
    const handleBackdropClose = () => { if (isDirty && !confirm("작성 중인 내용이 있습니다. 닫으시겠습니까?")) return; onClose(); };
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={handleBackdropClose} style={{ animation: "backdropIn 0.15s ease" }}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()} style={{ animation: "modalIn 0.2s ease" }}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? `${report?.category || "계획서/보고서"} 수정` : `${category} 등록`}</h3>
                    <button onClick={handleBackdropClose} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} autoFocus className={`w-full border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${tried && !title.trim() ? "border-red-400 ring-2 ring-red-200" : "border-slate-200"}`} />
                        {tried && !title.trim() && <p className="text-[11px] text-red-500 mt-0.5">제목을 입력하세요</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">기한</label>
                            <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 3/15" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                            <div className="flex gap-1">
                                {[...REPORT_STATUS_KEYS, "done"].map(s => {
                                    const cfg = REPORT_STATUS_CONFIG[s];
                                    return (
                                        <button key={s} type="button" onClick={() => setStatus(s)}
                                            className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                            style={status === s ? { background: cfg.color, color: statusText(cfg.color) } : undefined}>{cfg.label}</button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">담당자 *</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        {tried && assignees.length === 0 && <p className="text-[11px] text-red-500 mt-0.5">담당자를 선택하세요</p>}
                    </div>
                    {teamNames && <TeamSelect teamNames={teamNames} selected={team} onSelect={setTeam} />}
                    <ItemFiles files={files} onChange={setFiles} currentUser={currentUser} />
                    {/* Checklist */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[12px] font-semibold text-slate-500">체크리스트 ({doneCount}/{checklist.length})</label>
                            {checklist.length > 0 && <span className="text-[12px] font-semibold text-blue-500">{autoProgress}%</span>}
                        </div>
                        {checklist.length > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${autoProgress}%` }} />
                            </div>
                        )}
                        <div className="space-y-1 max-h-[200px] overflow-y-auto mb-2">
                            {checklist.map(item => (
                                <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-50 group">
                                    <button type="button" onClick={() => toggleChecklistItem(item.id)}
                                        className={`w-[18px] h-[18px] rounded flex-shrink-0 flex items-center justify-center transition-all ${item.done ? "bg-emerald-500" : "border-2 border-slate-300 hover:border-blue-400"}`}>
                                        {item.done && <span className="text-white text-[12px]">✓</span>}
                                    </button>
                                    <span className={`flex-1 text-[13px] ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>{item.text}</span>
                                    <button onClick={() => removeChecklistItem(item.id)}
                                        className="text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="할 일 추가..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                onKeyDown={e => e.key === "Enter" && addChecklistItem()} />
                            <button onClick={addChecklistItem} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">추가</button>
                        </div>
                    </div>
                    {/* Comments */}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group relative">
                                    <button onClick={() => { if (!confirm("댓글을 삭제하시겠습니까?")) return; setComments(comments.filter(x => x.id !== c.id)); }}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[13px] text-slate-700 pr-4">{renderChatMessage(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mt-1" />}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <div className="text-[12px] text-slate-300 py-2">코멘트 없음</div>}
                        </div>
                        {cImg.preview}
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성... (Ctrl+V 이미지)"
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                onPaste={cImg.onPaste} onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">{cImg.uploading ? "⏳" : "전송"}</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={handleBackdropClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => confirmDel(() => { onDelete(report!.id); onClose(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                </div>
            </div>
        </div>
    );
}

const ReportView = memo(function ReportView({ reports, currentUser, onSave, onDelete, onToggleDiscussion, onReorder, teamNames }: { reports: Report[]; currentUser: string; onSave: (r: Report) => void; onDelete: (id: number) => void; onToggleDiscussion: (r: Report) => void; onReorder: (list: Report[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [editing, setEditing] = useState<Report | null>(null);
    const [addCategory, setAddCategory] = useState<string | null>(null);
    const [filterTeam, setFilterTeam] = useState("전체");
    const [filterPerson, setFilterPerson] = useState("전체");
    const [mobileCol, setMobileCol] = useState(REPORT_STATUS_KEYS[0]);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Report | null>(null);
    const teamFiltered = filterTeam === "전체" ? reports : reports.filter(r => r.team === filterTeam);
    const filteredReports = filterPerson === "전체" ? teamFiltered : teamFiltered.filter(r => r.assignees?.includes(filterPerson));
    const [showCompleted, setShowCompleted] = useState(false);
    const [selected, setSelected] = useState<Report | null>(null);
    const handleChatAdd = (msg: ChatMessage) => { if (!selected) return; const u = { ...selected, comments: [...selected.comments, msg] }; onSave(u); setSelected(u); };
    const handleChatDelete = (id: number) => { if (!selected) return; const u = { ...selected, comments: selected.comments.filter(c => c.id !== id) }; onSave(u); setSelected(u); };
    const handleFileAdd = (f: LabFile) => { if (!selected) return; const u = { ...selected, files: [...(selected.files || []), f] }; onSave(u); setSelected(u); };
    const handleFileDelete = async (id: number) => { if (!selected) return; const f = (selected.files || []).find(x => x.id === id); if (f?.url?.startsWith("https://")) { try { const tk = typeof window !== "undefined" ? localStorage.getItem("mftel-auth-token") || "" : ""; const res = await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: f.url }), headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {} as Record<string, string>) } }); if (!res.ok) { alert("파일 삭제에 실패했습니다."); return; } } catch (e) { console.warn("파일 삭제 실패:", e); alert("파일 삭제에 실패했습니다."); return; } } const u = { ...selected, files: (selected.files || []).filter(x => x.id !== id) }; onSave(u); setSelected(u); };
    const completedReports = filteredReports.filter(r => r.status === "done");
    const kanbanFilteredReports = filteredReports.filter(r => r.status !== "done");
    return (
        <div>
            <div className="mb-3 flex items-center justify-end">
                <div className="flex items-center gap-2">
                    <button onClick={() => setAddCategory("계획서")} className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors"><span className="text-[14px]">+</span> 계획서 등록</button>
                    <button onClick={() => setAddCategory("보고서")} className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 bg-violet-500 text-white rounded-lg text-[13px] font-medium hover:bg-violet-600 transition-colors"><span className="text-[14px]">+</span> 보고서 등록</button>
                    <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedReports.length})</button>
                </div>
            </div>
            <div className="space-y-2 mb-3">
                {teamNames && teamNames.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold flex-shrink-0" style={{color:"#94A3B8"}}>팀</span>
                        <div className="flex items-center gap-1 flex-wrap">
                            {["전체", ...teamNames].map(t => (
                                <button key={t} onClick={() => setFilterTeam(t)}
                                    className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-all flex-shrink-0"
                                    style={{
                                        background: filterTeam === t ? "#3B82F6" : "transparent",
                                        color: filterTeam === t ? "#FFFFFF" : "#64748B",
                                        border: filterTeam === t ? "1px solid #3B82F6" : "1px solid #CBD5E1",
                                    }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold flex-shrink-0" style={{color:"#94A3B8"}}>멤버</span>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5" style={{scrollbarWidth:"none", whiteSpace:"nowrap"}}>
                        {["전체", ...MEMBER_NAMES].map(p => (
                            <button key={p} onClick={() => setFilterPerson(p)}
                                className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-all flex-shrink-0"
                                style={{
                                    background: filterPerson === p ? "#3B82F6" : "transparent",
                                    color: filterPerson === p ? "#FFFFFF" : "#64748B",
                                    border: filterPerson === p ? "1px solid #3B82F6" : "1px solid #CBD5E1",
                                }}>
                                {p === "전체" ? "전체" : `${MEMBERS[p]?.emoji || ""} ${p}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Mobile tab bar */}
            {!showCompleted && (
            <div className="md:hidden flex border-b border-slate-200 mb-3 -mx-1">
                {REPORT_STATUS_KEYS.map(status => {
                    const cnt = kanbanFilteredReports.filter(r => r.status === status).length;
                    const cfg = REPORT_STATUS_CONFIG[status];
                    return (
                        <button key={status} onClick={() => setMobileCol(status)}
                            className={`flex-1 text-center py-2 text-[13px] font-semibold transition-colors ${mobileCol === status ? "border-b-2 text-slate-800" : "text-slate-400"}`}
                            style={mobileCol === status ? { borderColor: cfg.color } : {}}>
                            {cfg.label} <span className="text-[11px] font-normal">{cnt}</span>
                        </button>
                    );
                })}
            </div>
            )}
            {/* Mobile single column */}
            {!showCompleted && (() => {
                const colItems = kanbanFilteredReports.filter(r => r.status === mobileCol);
                return (
            <div className="md:hidden space-y-2">
                {colItems.map((r, mi) => {
                    const cl = r.checklist || [];
                    const done = cl.filter(c => c.done).length;
                    return (
                        <div key={r.id} onClick={() => { if (window.getSelection()?.toString()) return; setSelected(r); }}
                            className={`bg-white rounded-xl py-3 px-4 cursor-pointer transition-all border border-slate-200 hover:border-slate-300 hover:shadow-sm`}
                            style={{ borderLeft: r.needsDiscussion ? "3px solid #EF4444" : `3px solid ${REPORT_STATUS_CONFIG[mobileCol]?.color || "#ccc"}` }}>
                        <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onToggleDiscussion(r)} className="w-3 h-3 accent-red-500" />
                            <span className={`text-[11px] font-medium ${r.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words">{r.title}<SavingBadge id={r.id} /></div>
                                    <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                        {r.category && <span className={`text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`} style={{fontWeight:500}}>{r.category}</span>}
                                        {r.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{r.team}</span>}
                                    </div>
                                </div>
                                <MobileReorderButtons idx={mi} total={colItems.length} onMove={dir => onReorder(moveInColumn(reports, r.id, dir, colItems))} />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                    <div className="h-1 rounded-full transition-all" style={{ width: `${r.progress}%`, background: "#3B82F6" }} />
                                </div>
                                <span className="text-[11px] font-semibold" style={{color: r.progress >= 80 ? "#10B981" : "#3B82F6"}}>{r.progress}%</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1.5 truncate">
                                {r.assignees.map((a, i) => <span key={a}>{i > 0 && ", "}{MEMBERS[a]?.emoji || "👤"}{a}</span>)}
                            </div>
                        </div>
                    );
                })}
                {colItems.length === 0 && <div className="text-center py-10"><div className="text-3xl mb-2 opacity-30">📋</div><div className="text-[13px] text-slate-300">{REPORT_STATUS_CONFIG[mobileCol]?.label} 보고서가 없습니다</div></div>}
            </div>
                );
            })()}
            {/* Desktop kanban */}
            {!showCompleted && (
            <div className="hidden md:flex gap-3 pb-2">
                {REPORT_STATUS_KEYS.map(status => {
                    const col = kanbanFilteredReports.filter(r => r.status === status);
                    const cfg = REPORT_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDropTarget(calcDropIdx(e, status)); }}
                            onDragLeave={() => {}}
                            onDrop={() => { if (dragItem.current && dropTarget) { const reordered = reorderKanbanItems(reports, dragItem.current, status, dropTarget.idx, r => r.status, (r, s) => ({ ...r, status: s })); onReorder(reordered); } dragItem.current = null; setDraggedId(null); setDropTarget(null); }}>
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>{cfg.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((r, cardIdx) => {
                                    const cl = r.checklist || [];
                                    const done = cl.filter(c => c.done).length;
                                    return (
                                        <div key={r.id}>
                                        {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                        <div draggable onDragStart={() => { dragItem.current = r; setDraggedId(r.id); }}
                                            onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                            onDragOver={e => { e.preventDefault(); if (draggedId === r.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                            onClick={() => { if (window.getSelection()?.toString()) return; setSelected(r); }}
                                            className={`bg-white rounded-xl py-3 px-4 cursor-grab transition-all overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${draggedId === r.id ? "opacity-40 scale-95" : ""} border border-slate-200 hover:border-slate-300`}
                                            style={{ borderLeft: r.needsDiscussion ? "3px solid #EF4444" : `3px solid ${cfg.color}` }}>
                                        <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onToggleDiscussion(r)} className="w-3 h-3 accent-red-500" />
                                            <span className={`text-[11px] font-medium ${r.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                            <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words line-clamp-2">{r.title}<SavingBadge id={r.id} /></div>
                                            <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                                {r.category && <span className={`text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`} style={{fontWeight:500}}>{r.category}</span>}
                                                {r.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{r.team}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                    <div className="h-1 rounded-full transition-all" style={{ width: `${r.progress}%`, background: "#3B82F6" }} />
                                                </div>
                                                <span className="text-[11px] font-semibold" style={{color: r.progress >= 80 ? "#10B981" : "#3B82F6"}}>{r.progress}%</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-1.5 truncate">
                                                {r.assignees.map((a, i) => <span key={a}>{i > 0 && ", "}{MEMBERS[a]?.emoji || "👤"}{a}</span>)}
                                            </div>
                                        </div>
                                        </div>
                                    );
                                })}
                                {dropTarget?.col === status && dropTarget?.idx === col.length && <DropLine />}
                                {col.length === 0 && <div className="text-center py-8"><div className="text-2xl mb-1 opacity-30">📋</div><div className="text-[12px] text-slate-300">항목 없음</div></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
            {showCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {completedReports.map(r => (
                        <div key={r.id} onClick={() => { if (window.getSelection()?.toString()) return; setSelected(r); }}
                            className="bg-white rounded-xl p-4 cursor-pointer transition-all border border-emerald-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                {r.category && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{r.category}</span>}
                                {r.team && <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-semibold">{r.team}</span>}
                            </div>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{r.title}<SavingBadge id={r.id} /></div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {r.assignees.slice(0, 3).map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                    {r.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{r.assignees.length - 3}</span>}
                                </div>
                                {r.deadline && <span className="text-[11px] text-red-500 font-semibold">~{r.deadline}</span>}
                            </div>
                            {r.creator && <div className="text-[11px] text-slate-400 text-right mt-1">by {MEMBERS[r.creator]?.emoji || ""}{r.creator}{r.createdAt ? ` · ${r.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedReports.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 계획서/보고서가 없습니다</div>}
                </div>
            )}
            {addCategory && <ReportFormModal report={null} initialCategory={addCategory} onSave={r => { onSave(r); setAddCategory(null); }} onClose={() => setAddCategory(null)} currentUser={currentUser} teamNames={teamNames} />}
            {editing && <ReportFormModal report={editing} onSave={r => { onSave(r); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} teamNames={teamNames} />}
            {/* Mobile FAB */}
            {!addCategory && !editing && !selected && (
                <button onClick={() => setAddCategory("보고서")} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-orange-600 active:scale-95 transition-transform">+</button>
            )}
            {selected && !editing && (
                <DetailModal3Col
                    onClose={() => setSelected(null)}
                    onEdit={() => { setEditing(selected); setSelected(null); }}
                    onDelete={(currentUser === selected.creator || currentUser === "박일웅") ? () => { onDelete(selected.id); setSelected(null); } : undefined}
                    files={selected.files || []}
                    currentUser={currentUser}
                    onAddFile={handleFileAdd}
                    onDeleteFile={handleFileDelete}
                    chatMessages={selected.comments}
                    onAddChat={handleChatAdd}
                    onDeleteChat={handleChatDelete}
                    chatDraftKey={`comment_report_${selected.id}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {selected.category && <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${selected.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{selected.category}</span>}
                    </div>
                    <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selected.title}</h2>
                    {selected.team && (
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-500">소속 팀</span>
                            <span className="text-[12px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 font-medium">{selected.team}</span>
                        </div>
                    )}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-semibold text-slate-500">진행률</span>
                            <span className="text-[13px] font-bold" style={{color: selected.progress >= 80 ? "#10B981" : "#3B82F6"}}>{selected.progress}%</span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{background:"#F1F5F9"}}>
                            <div className="h-2 rounded-full transition-all" style={{ width: `${selected.progress}%`, background: selected.progress >= 80 ? "#10B981" : "#3B82F6" }} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-500">상태</span>
                        <span className="text-[12px] px-2 py-0.5 rounded-full font-medium" style={{background: REPORT_STATUS_CONFIG[selected.status]?.color || "#94A3B8", color: statusText(REPORT_STATUS_CONFIG[selected.status]?.color || "#94A3B8")}}>{REPORT_STATUS_CONFIG[selected.status]?.label || selected.status}</span>
                    </div>
                    <div>
                        <span className="text-[12px] font-semibold text-slate-500 block mb-1.5">담당자</span>
                        <div className="flex flex-wrap gap-1.5">
                            {selected.assignees.map(a => <span key={a} className="text-[12px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji || "👤"} {a}</span>)}
                        </div>
                    </div>
                    {selected.deadline && (
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-500">마감</span>
                            <span className="text-[13px] text-red-500 font-medium">{selected.deadline}</span>
                        </div>
                    )}
                    {selected.checklist && selected.checklist.length > 0 && (
                        <div>
                            <span className="text-[12px] font-semibold text-slate-500 block mb-1.5">체크리스트 ({selected.checklist.filter(c => c.done).length}/{selected.checklist.length})</span>
                            <div className="space-y-1">
                                {selected.checklist.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 text-[13px]">
                                        <span className={c.done ? "text-emerald-500" : "text-slate-300"}>{c.done ? "✅" : "⬜"}</span>
                                        <span className={c.done ? "text-slate-400 line-through" : "text-slate-600"}>{c.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-500">논의 필요</span>
                        <span className={`text-[12px] font-medium ${selected.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>{selected.needsDiscussion ? "예" : "—"}</span>
                    </div>
                    {selected.creator && <div className="text-[11px] text-slate-400">작성: {MEMBERS[selected.creator]?.emoji || ""}{selected.creator}{selected.createdAt ? ` · ${selected.createdAt}` : ""}</div>}
                </DetailModal3Col>
            )}
        </div>
    );
});

// ─── Dispatch Panel ──────────────────────────────────────────────────────────


export { ReportFormModal, ReportView };
