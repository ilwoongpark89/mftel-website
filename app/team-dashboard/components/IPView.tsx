"use client";

import { useState, useRef, useContext, memo } from "react";
import type { Patent, LabFile } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, IP_STATUS_CONFIG, IP_STATUS_KEYS } from "../lib/constants";
import { genId, toggleArr, statusText, calcDropIdx, reorderKanbanItems } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { DropLine, ItemFiles, MobileReorderButtons, moveInColumn, PillSelect, SavingBadge, TeamSelect } from "./shared";

function IPFormModal({ patent, onSave, onDelete, onClose, currentUser, teamNames }: { patent: Patent | null; onSave: (p: Patent) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; teamNames?: string[] }) {
    const confirmDel = useContext(ConfirmDeleteContext);
    const isEdit = !!patent;
    const [title, setTitle] = useState(patent?.title || "");
    const [deadline, setDeadline] = useState(patent?.deadline || "");
    const [status, setStatus] = useState(patent?.status || "planning");
    const [assignees, setAssignees] = useState<string[]>(patent?.assignees || []);
    const [team, setTeam] = useState(patent?.team || "");
    const [files, setFiles] = useState<LabFile[]>(patent?.files || []);
    const [tried, setTried] = useState(false);

    const isDirty = title.trim() !== (patent?.title || "");
    const handleBackdropClose = () => { if (isDirty && !confirm("작성 중인 내용이 있습니다. 닫으시겠습니까?")) return; onClose(); };
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={handleBackdropClose}>
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "지식재산권 수정" : "지식재산권 등록"}</h3>
                    <button onClick={handleBackdropClose} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} autoFocus className={`w-full border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${tried && !title.trim() ? "border-red-400 ring-2 ring-red-200" : "border-slate-200"}`} />
                        {tried && !title.trim() && <p className="text-[11px] text-red-500 mt-0.5">제목을 입력하세요</p>}
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">기한</label>
                        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 12/31" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {[...IP_STATUS_KEYS, "completed"].map(s => {
                                const cfg = IP_STATUS_CONFIG[s];
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
                    <ItemFiles files={files} onChange={setFiles} currentUser={currentUser} />
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={handleBackdropClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { setTried(true); if (!title.trim() || assignees.length === 0) return; onSave({ id: patent?.id ?? genId(), title, deadline, status, assignees, creator: patent?.creator || currentUser, createdAt: patent?.createdAt || new Date().toLocaleString("ko-KR"), team, files }); onClose(); }}
                            className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => confirmDel(() => { onDelete(patent!.id); onClose(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                </div>
            </div>
        </div>
    );
}

const IPView = memo(function IPView({ patents, onSave, onDelete, currentUser, onToggleDiscussion, onReorder, teamNames }: { patents: Patent[]; onSave: (p: Patent) => void; onDelete: (id: number) => void; currentUser: string; onToggleDiscussion: (p: Patent) => void; onReorder: (list: Patent[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Patent | null>(null);
    const [adding, setAdding] = useState(false);
    const [filterTeam, setFilterTeam] = useState("전체");
    const [filterPerson, setFilterPerson] = useState("전체");
    const [mobileCol, setMobileCol] = useState(IP_STATUS_KEYS[0]);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Patent | null>(null);
    const teamFilteredPatents = filterTeam === "전체" ? patents : patents.filter(p => p.team === filterTeam);
    const filteredPatents = filterPerson === "전체" ? teamFilteredPatents : teamFilteredPatents.filter(p => p.assignees?.includes(filterPerson));
    const [showCompleted, setShowCompleted] = useState(false);
    const completedPatents = filteredPatents.filter(p => p.status === "completed");
    const kanbanFilteredPatents = filteredPatents.filter(p => p.status !== "completed");
    return (
        <div>
            <div className="mb-3 flex items-center justify-end">
                <div className="flex items-center gap-2">
                    <button onClick={() => setAdding(true)} className="hidden md:inline-flex px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors">+ 지식재산권 등록</button>
                    <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedPatents.length})</button>
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
                {IP_STATUS_KEYS.map(status => {
                    const cnt = kanbanFilteredPatents.filter(p => p.status === status).length;
                    const cfg = IP_STATUS_CONFIG[status];
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
                {(() => { const colItems = kanbanFilteredPatents.filter(p => p.status === mobileCol); return colItems.length === 0 ? <div className="text-center py-8 text-slate-300 text-[13px]">{IP_STATUS_CONFIG[mobileCol]?.label} 없음</div> : colItems.map((item, mi) => (
                    <div key={item.id} onClick={() => setEditing(item)}
                        className={`bg-white rounded-xl py-3 px-4 cursor-pointer transition-all border border-slate-200 hover:border-slate-300`}
                        style={{ borderLeft: item.needsDiscussion ? "3px solid #EF4444" : `3px solid ${IP_STATUS_CONFIG[mobileCol]?.color || "#ccc"}` }}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words min-w-0 flex-1">{item.title}<SavingBadge id={item.id} /></div>
                            <MobileReorderButtons idx={mi} total={colItems.length} onMove={dir => onReorder(moveInColumn(patents, item.id, dir, colItems))} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                            {item.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{item.team}</span>}
                            {item.deadline && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 flex-shrink-0" style={{fontWeight:500}}>~{item.deadline}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                <div className="h-1 rounded-full transition-all" style={{ width: `${item.progress || 0}%`, background: "#3B82F6" }} />
                            </div>
                            <span className="text-[11px] font-semibold" style={{color: (item.progress || 0) >= 80 ? "#10B981" : "#3B82F6"}}>{item.progress || 0}%</span>
                        </div>
                        <div className="flex -space-x-1 mt-1.5">
                            {item.assignees.slice(0, 4).map(a => <span key={a} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={a}>{MEMBERS[a]?.emoji || "👤"}</span>)}
                            {item.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{item.assignees.length - 4}</span>}
                        </div>
                    </div>
                )); })()}
            </div>
            )}
            {/* Desktop kanban */}
            {!showCompleted && (
            <div className="hidden md:flex gap-3 pb-2">
                {IP_STATUS_KEYS.map(status => {
                    const col = kanbanFilteredPatents.filter(p => p.status === status);
                    const cfg = IP_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDropTarget(calcDropIdx(e, status)); }}
                            onDragLeave={() => {}}
                            onDrop={() => { if (dragItem.current && dropTarget) { const reordered = reorderKanbanItems(patents, dragItem.current, status, dropTarget.idx, p => p.status, (p, s) => ({ ...p, status: s })); onReorder(reordered); } dragItem.current = null; setDraggedId(null); setDropTarget(null); }}>
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>{cfg.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((p, cardIdx) => (
                                    <div key={p.id}>
                                    {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = p; setDraggedId(p.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === p.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        onClick={() => setEditing(p)}
                                        className={`bg-white rounded-xl py-3 px-4 cursor-grab transition-all overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${draggedId === p.id ? "opacity-40 scale-95" : ""} border border-slate-200 hover:border-slate-300`}
                                        style={{ borderLeft: p.needsDiscussion ? "3px solid #EF4444" : `3px solid ${cfg.color}` }}>
                                        <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words line-clamp-2">{p.title}<SavingBadge id={p.id} /></div>
                                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                            {p.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{p.team}</span>}
                                            {p.deadline && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 flex-shrink-0" style={{fontWeight:500}}>~{p.deadline}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                <div className="h-1 rounded-full transition-all" style={{ width: `${p.progress || 0}%`, background: "#3B82F6" }} />
                                            </div>
                                            <span className="text-[11px] font-semibold" style={{color: (p.progress || 0) >= 80 ? "#10B981" : "#3B82F6"}}>{p.progress || 0}%</span>
                                        </div>
                                        <div className="flex -space-x-1 mt-1.5">
                                            {p.assignees.slice(0, 4).map(a => <span key={a} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={a}>{MEMBERS[a]?.emoji || "👤"}</span>)}
                                            {p.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{p.assignees.length - 4}</span>}
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
                    {completedPatents.map(p => (
                        <div key={p.id} onClick={() => setEditing(p)}
                            className="bg-white rounded-xl p-4 cursor-pointer transition-all border border-emerald-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-slate-300"
                            style={{ borderLeft: "3px solid #22c55e" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{p.title}<SavingBadge id={p.id} /></div>
                            {p.team && <div className="mb-1"><span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-semibold">{p.team}</span></div>}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {p.assignees.map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                </div>
                                {p.deadline && <span className="text-[11px] text-red-500 font-semibold">~{p.deadline}</span>}
                            </div>
                            {p.creator && <div className="text-[11px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedPatents.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 지식재산권이 없습니다</div>}
                </div>
            )}
            {adding && <IPFormModal patent={null} onSave={p => { onSave(p); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} teamNames={teamNames} />}
            {editing && <IPFormModal patent={editing} onSave={p => { onSave(p); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} teamNames={teamNames} />}
            {/* Mobile FAB */}
            {!adding && !editing && (
                <button onClick={() => setAdding(true)} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-teal-600 active:scale-95 transition-transform">+</button>
            )}
        </div>
    );
});

// ─── Daily Target View ──────────────────────────────────────────────────────


export { IPFormModal, IPView };
