"use client";

import { useState, useEffect, useRef, useContext, memo } from "react";
import type { Comment, Analysis, AnalysisLog, LabFile } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, ANALYSIS_STATUS_CONFIG, ANALYSIS_STATUS_KEYS, ANALYSIS_STATUS_MIGRATE } from "../lib/constants";
import { genId, toggleArr, statusText, chatKeyDown, renderWithMentions, saveDraft, loadDraft, clearDraft, hasDraft, calcDropIdx, reorderKanbanItems } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useCommentImg } from "../lib/hooks";
import { DropLine, ItemFiles, PillSelect, SavingBadge, TeamSelect } from "./shared";

function AnalysisFormModal({ analysis, onSave, onDelete, onClose, currentUser, toolList, teamNames }: {
    analysis: Analysis | null; onSave: (a: Analysis) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; toolList: string[]; teamNames?: string[];
}) {
    const confirmDel = useContext(ConfirmDeleteContext);
    const isEdit = !!analysis;
    const [title, setTitle] = useState(analysis?.title || "");
    const [tool, setTool] = useState(analysis?.tool || toolList[0] || "");
    const [status, setStatus] = useState(analysis?.status || "planning");
    const [assignees, setAssignees] = useState<string[]>(analysis?.assignees || []);
    const [goal, setGoal] = useState(analysis?.goal || "");
    const [startDate, setStartDate] = useState(analysis?.startDate || "");
    const [endDate, setEndDate] = useState(analysis?.endDate || "");
    const [logs, setLogs] = useState<AnalysisLog[]>(analysis?.logs || []);
    const [newLog, setNewLog] = useState("");
    const [progress, setProgress] = useState(analysis?.progress ?? 0);
    const [team, setTeam] = useState(analysis?.team || "");
    const [files, setFiles] = useState<LabFile[]>(analysis?.files || []);
    const [tried, setTried] = useState(false);


    const handleSave = () => {
        setTried(true);
        if (!title.trim() || assignees.length === 0) return false;
        onSave({ id: analysis?.id ?? genId(), title, tool, status, assignees, goal, startDate, endDate, logs, progress, creator: analysis?.creator || currentUser, createdAt: analysis?.createdAt || new Date().toLocaleString("ko-KR"), team, files });
        return true;
    };
    const addLog = () => {
        if (!newLog.trim()) return;
        setLogs([{ id: genId(), date: new Date().toLocaleDateString("ko-KR"), author: currentUser, text: newLog.trim() }, ...logs]);
        setNewLog("");
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "해석 수정" : "해석 등록"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">해석 제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} autoFocus className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">해석 도구</label>
                        <div className="flex flex-wrap gap-1">
                            {toolList.map(t => (
                                <button key={t} type="button" onClick={() => setTool(t)}
                                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${tool === t ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">목표</label>
                        <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="해석 목표를 작성하세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">달성도 {progress}%</label>
                        <input type="range" min={0} max={100} step={5} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {[...ANALYSIS_STATUS_KEYS, "completed"].map(s => {
                                const cfg = ANALYSIS_STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color, color: statusText(cfg.color) } : undefined}>{cfg.label}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">담당자 *</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        {tried && assignees.length === 0 && <p className="text-[11px] text-red-500 mt-0.5">담당자를 선택하세요</p>}
                    </div>
                    {teamNames && <TeamSelect teamNames={teamNames} selected={team} onSelect={setTeam} />}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">시작일</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">종료일</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        </div>
                    </div>
                    <ItemFiles files={files} onChange={setFiles} currentUser={currentUser} />
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">해석 일지 ({logs.length})</label>
                        <div className="flex gap-2 mb-2">
                            <input value={newLog} onChange={e => setNewLog(e.target.value)} placeholder="오늘의 해석 내용을 기록하세요..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                onKeyDown={e => e.key === "Enter" && addLog()} />
                            <button onClick={addLog} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">기록</button>
                        </div>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {logs.map(l => (
                                <div key={l.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => { if (!confirm("기록을 삭제하시겠습니까?")) return; setLogs(logs.filter(x => x.id !== l.id)); }}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[13px] text-slate-700 pr-4">{l.text}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[l.author]?.emoji} {l.author} · {l.date}</div>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-[12px] text-slate-300 py-2">기록 없음</div>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => confirmDel(() => { onDelete(analysis!.id); onClose(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                </div>
            </div>
        </div>
    );
}

const AnalysisView = memo(function AnalysisView({ analyses, onSave, onDelete, currentUser, toolList, onSaveTools, onToggleDiscussion, onReorder, teamNames }: { analyses: Analysis[]; onSave: (a: Analysis) => void; onDelete: (id: number) => void; currentUser: string; toolList: string[]; onSaveTools: (list: string[]) => void; onToggleDiscussion: (a: Analysis) => void; onReorder: (list: Analysis[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [editing, setEditing] = useState<Analysis | null>(null);
    const [adding, setAdding] = useState(false);
    const [showToolMgr, setShowToolMgr] = useState(false);
    const [newTool, setNewTool] = useState("");
    const [filterTeam, setFilterTeam] = useState("전체");
    const [filterPerson, setFilterPerson] = useState("전체");
    const [mobileCol, setMobileCol] = useState(ANALYSIS_STATUS_KEYS[0]);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Analysis | null>(null);
    const teamFilteredAnalyses = filterTeam === "전체" ? analyses : analyses.filter(a => a.team === filterTeam);
    const filteredAnalyses = filterPerson === "전체" ? teamFilteredAnalyses : teamFilteredAnalyses.filter(a => a.assignees?.includes(filterPerson));
    const [showCompleted, setShowCompleted] = useState(false);
    const [selected, setSelected] = useState<Analysis | null>(null);
    const [detailComment, setDetailComment] = useState("");
    const cImg = useCommentImg();
    const composingRef = useRef(false);
    // Comment draft
    useEffect(() => { if (selected) { const d = loadDraft(`comment_analysis_${selected.id}`); if (d) setDetailComment(d); else setDetailComment(""); } }, [selected?.id]);
    useEffect(() => { if (selected) saveDraft(`comment_analysis_${selected.id}`, detailComment); }, [detailComment, selected?.id]);
    const addDetailComment = () => { if (!selected || (!detailComment.trim() && !cImg.img)) return; clearDraft(`comment_analysis_${selected.id}`); const u = { ...selected, logs: [{ id: genId(), author: currentUser, text: detailComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }, ...selected.logs] }; onSave(u); setSelected(u); setDetailComment(""); cImg.clear(); };
    const delDetailComment = (cid: number) => { if (!selected) return; const u = { ...selected, logs: selected.logs.filter(c => c.id !== cid) }; onSave(u); setSelected(u); };
    const completedAnalyses = filteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) === "completed");
    const kanbanFilteredAnalyses = filteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) !== "completed");
    return (
        <div>
            <div className="mb-3 flex items-center justify-end">
                <div className="flex items-center gap-2">
                    <button onClick={() => setAdding(true)} className="hidden md:inline-flex px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors">+ 해석 등록</button>
                    <button onClick={() => setShowToolMgr(!showToolMgr)} className="hidden md:inline-flex px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">🔧 해석 도구 관리</button>
                    <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedAnalyses.length})</button>
                </div>
            </div>
            {showToolMgr && (
                <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[13px] font-semibold text-slate-600 mb-2">해석 도구 목록</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {toolList.map(t => (
                            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[12px] text-slate-700">
                                {t}
                                <button onClick={() => onSaveTools(toolList.filter(x => x !== t))} className="text-slate-400 hover:text-red-500 text-[11px]">✕</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newTool} onChange={e => setNewTool(e.target.value)} placeholder="새 도구 이름"
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            onKeyDown={e => { if (e.key === "Enter" && newTool.trim() && !toolList.includes(newTool.trim())) { onSaveTools([...toolList, newTool.trim()]); setNewTool(""); } }} />
                        <button onClick={() => { if (newTool.trim() && !toolList.includes(newTool.trim())) { onSaveTools([...toolList, newTool.trim()]); setNewTool(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
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
                {ANALYSIS_STATUS_KEYS.map(status => {
                    const cnt = kanbanFilteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) === status).length;
                    const cfg = ANALYSIS_STATUS_CONFIG[status];
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
            {!showCompleted && (
            <div className="md:hidden space-y-2">
                {kanbanFilteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) === mobileCol).map(a => (
                    <div key={a.id} onClick={() => setSelected(a)}
                        className={`bg-white rounded-xl py-3 px-4 cursor-pointer transition-all border border-slate-200 hover:border-slate-300`}
                        style={{ borderLeft: a.needsDiscussion ? "3px solid #EF4444" : `3px solid ${ANALYSIS_STATUS_CONFIG[mobileCol]?.color || "#ccc"}` }}>
                        <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words">{a.title}<SavingBadge id={a.id} /></div>
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 flex-shrink-0">🖥️ {a.tool}</span>
                            {a.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{a.team}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                <div className="h-1 rounded-full transition-all" style={{ width: `${a.progress ?? 0}%`, background: "#3B82F6" }} />
                            </div>
                            <span className="text-[11px] font-semibold" style={{color: (a.progress ?? 0) >= 80 ? "#10B981" : "#3B82F6"}}>{a.progress ?? 0}%</span>
                        </div>
                        <div className="flex -space-x-1 mt-1.5">
                            {a.assignees.slice(0, 4).map(n => <span key={n} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={n}>{MEMBERS[n]?.emoji || "👤"}</span>)}
                            {a.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{a.assignees.length - 4}</span>}
                        </div>
                    </div>
                ))}
                {kanbanFilteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) === mobileCol).length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">{ANALYSIS_STATUS_CONFIG[mobileCol]?.label} 없음</div>}
            </div>
            )}
            {/* Desktop kanban */}
            {!showCompleted && (
            <div className="hidden md:flex gap-3 pb-2">
                {ANALYSIS_STATUS_KEYS.map(status => {
                    const col = kanbanFilteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) === status);
                    const cfg = ANALYSIS_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDropTarget(calcDropIdx(e, status)); }}
                            onDragLeave={() => {}}
                            onDrop={() => { if (dragItem.current && dropTarget) { const reordered = reorderKanbanItems(analyses, dragItem.current, status, dropTarget.idx, a => ANALYSIS_STATUS_MIGRATE(a.status), (a, s) => ({ ...a, status: s })); onReorder(reordered); } dragItem.current = null; setDraggedId(null); setDropTarget(null); }}>
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>{cfg.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((a, cardIdx) => (
                                    <div key={a.id}>
                                    {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = a; setDraggedId(a.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === a.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        onClick={() => setSelected(a)}
                                        className={`bg-white rounded-xl py-3 px-4 cursor-grab transition-all overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${draggedId === a.id ? "opacity-40 scale-95" : ""} border border-slate-200 hover:border-slate-300`}
                                        style={{ borderLeft: a.needsDiscussion ? "3px solid #EF4444" : `3px solid ${cfg.color}` }}>
                                        <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words line-clamp-2">{a.title}<SavingBadge id={a.id} /></div>
                                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 flex-shrink-0">🖥️ {a.tool}</span>
                                            {a.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{a.team}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                <div className="h-1 rounded-full transition-all" style={{ width: `${a.progress ?? 0}%`, background: "#3B82F6" }} />
                                            </div>
                                            <span className="text-[11px] font-semibold" style={{color: (a.progress ?? 0) >= 80 ? "#10B981" : "#3B82F6"}}>{a.progress ?? 0}%</span>
                                        </div>
                                        <div className="flex -space-x-1 mt-1.5">
                                            {a.assignees.slice(0, 4).map(n => <span key={n} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={n}>{MEMBERS[n]?.emoji || "👤"}</span>)}
                                            {a.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{a.assignees.length - 4}</span>}
                                        </div>
                                    </div>
                                    </div>
                                ))}
                                {dropTarget?.col === status && dropTarget?.idx === col.length && <DropLine />}
                                {col.length === 0 && <div className="text-[12px] text-slate-300 text-center py-6">—</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
            {showCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {completedAnalyses.map(a => (
                        <div key={a.id} onClick={() => setSelected(a)}
                            className="bg-white rounded-xl p-4 cursor-pointer transition-all border border-emerald-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-slate-300"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{a.title}<SavingBadge id={a.id} /></div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] text-slate-500">🖥️ {a.tool}</span>
                                {a.team && <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-semibold">{a.team}</span>}
                            </div>
                            {a.goal && <div className="text-[11px] text-slate-400 mb-1.5 line-clamp-2">{a.goal}</div>}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {a.assignees.slice(0, 3).map(n => <span key={n} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[n]?.emoji}{n}</span>)}
                                    {a.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{a.assignees.length - 3}</span>}
                                </div>
                                {a.logs.length > 0 && <span className="text-[11px] text-slate-400">📝{a.logs.length}</span>}
                            </div>
                            {a.creator && <div className="text-[11px] text-slate-400 text-right mt-1">by {MEMBERS[a.creator]?.emoji || ""}{a.creator}{a.createdAt ? ` · ${a.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedAnalyses.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 해석이 없습니다</div>}
                </div>
            )}
            {adding && <AnalysisFormModal analysis={null} onSave={a => { onSave(a); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} toolList={toolList} teamNames={teamNames} />}
            {editing && <AnalysisFormModal analysis={editing} onSave={a => { onSave(a); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} toolList={toolList} teamNames={teamNames} />}
            {/* Mobile FAB */}
            {!adding && !editing && !selected && (
                <button onClick={() => setAdding(true)} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-violet-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-violet-600 active:scale-95 transition-transform">+</button>
            )}
            {selected && !editing && !adding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setSelected(null); setDetailComment(""); }}>
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5 pb-3">
                            <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selected.title}</h2>
                            <p className="text-[13px] text-slate-500 mt-1">🖥️ {selected.tool}</p>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-4 modal-scroll">
                            {selected.goal && (
                                <div>
                                    <span className="text-[12px] font-semibold text-slate-500 block mb-1">목표</span>
                                    <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{selected.goal}</p>
                                </div>
                            )}
                            {selected.team && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-semibold text-slate-500">소속 팀</span>
                                    <span className="text-[12px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 font-medium">{selected.team}</span>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[12px] font-semibold text-slate-500">달성도</span>
                                    <span className="text-[13px] font-bold" style={{color: (selected.progress ?? 0) >= 80 ? "#10B981" : "#3B82F6"}}>{selected.progress ?? 0}%</span>
                                </div>
                                <div className="w-full rounded-full h-2" style={{background:"#F1F5F9"}}>
                                    <div className="h-2 rounded-full transition-all" style={{ width: `${selected.progress ?? 0}%`, background: (selected.progress ?? 0) >= 80 ? "#10B981" : "#3B82F6" }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] font-semibold text-slate-500">상태</span>
                                <span className="text-[12px] px-2 py-0.5 rounded-full font-medium" style={{background: ANALYSIS_STATUS_CONFIG[ANALYSIS_STATUS_MIGRATE(selected.status)]?.color || "#94A3B8", color: statusText(ANALYSIS_STATUS_CONFIG[ANALYSIS_STATUS_MIGRATE(selected.status)]?.color || "#94A3B8")}}>{ANALYSIS_STATUS_CONFIG[ANALYSIS_STATUS_MIGRATE(selected.status)]?.label || selected.status}</span>
                            </div>
                            <div>
                                <span className="text-[12px] font-semibold text-slate-500 block mb-1.5">담당자</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {selected.assignees.map(a => <span key={a} className="text-[12px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji || "👤"} {a}</span>)}
                                </div>
                            </div>
                            {(selected.startDate || selected.endDate) && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-semibold text-slate-500">기간</span>
                                    <span className="text-[13px] text-slate-600">{selected.startDate || "—"} ~ {selected.endDate || "—"}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] font-semibold text-slate-500">논의 필요</span>
                                <span className={`text-[12px] font-medium ${selected.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>{selected.needsDiscussion ? "예" : "—"}</span>
                            </div>
                            {selected.creator && <div className="text-[11px] text-slate-400">작성: {MEMBERS[selected.creator]?.emoji || ""}{selected.creator}{selected.createdAt ? ` · ${selected.createdAt}` : ""}</div>}
                            <div className="border-t border-slate-100" />
                            <div>
                                <span className="text-[12px] font-semibold text-slate-500 block mb-2">해석 일지 ({selected.logs.length})</span>
                                <div className="space-y-2 mb-3">
                                    {selected.logs.map(c => (
                                        <div key={c.id} className="flex gap-2 group">
                                            <div className="flex-1 bg-slate-50 rounded-lg p-2.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[12px] font-semibold text-slate-700">{MEMBERS[c.author]?.emoji} {c.author}</span>
                                                    <span className="text-[11px] text-slate-400">{c.date}</span>
                                                </div>
                                                <div className="text-[13px] text-slate-600 whitespace-pre-wrap">{renderWithMentions(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mt-1" />}</div>
                                            </div>
                                            {(c.author === currentUser || currentUser === "박일웅") && (
                                                <button onClick={() => delDetailComment(c.id)} className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 self-start mt-2">삭제</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {cImg.preview}
                                <div className="flex gap-2 items-center">
                                    <input value={detailComment} onChange={e => setDetailComment(e.target.value)}
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onPaste={cImg.onPaste} onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addDetailComment(); }}
                                        placeholder="해석 일지 작성... (Ctrl+V 이미지)" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                                    <button onClick={addDetailComment} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 flex-shrink-0">{cImg.uploading ? "⏳" : "등록"}</button>
                                </div>
                                {detailComment && hasDraft(`comment_analysis_${selected.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-100">
                            <button onClick={() => { setEditing(selected); setSelected(null); setDetailComment(""); }} className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                {(currentUser === selected.creator || currentUser === "박일웅") && (
                                    <button onClick={() => confirmDel(() => { onDelete(selected.id); setSelected(null); setDetailComment(""); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={() => { setSelected(null); setDetailComment(""); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});


export { AnalysisFormModal, AnalysisView };
