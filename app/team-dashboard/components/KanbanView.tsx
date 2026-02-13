"use client";

import { useState, useRef, useContext, memo } from "react";
import type { Comment, Paper, LabFile } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, STATUS_CONFIG, STATUS_KEYS, PAPER_STATUS_MIGRATE } from "../lib/constants";
import { genId, toggleArr, statusText, chatKeyDown, renderChatMessage, calcDropIdx, reorderKanbanItems } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useCommentImg } from "../lib/hooks";
import { DropLine, ItemFiles, PillSelect, SavingBadge, TeamSelect, MobileReorderButtons, moveInColumn, DetailModal3Col } from "./shared";
import type { ChatMessage } from "./shared";

function PaperFormModal({ paper, onSave, onDelete, onClose, currentUser, tagList, teamNames }: {
    paper: Paper | null; onSave: (p: Paper) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; tagList: string[]; teamNames?: string[];
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const isEdit = !!paper;
    const [title, setTitle] = useState(paper?.title || "");
    const [journal, setJournal] = useState(paper?.journal || "TBD");
    const [status, setStatus] = useState(paper?.status || "planning");
    const [assignees, setAssignees] = useState<string[]>(paper?.assignees || []);
    const [tags, setTags] = useState<string[]>(paper?.tags || []);
    const [deadline, setDeadline] = useState(paper?.deadline || "");
    const [progress, setProgress] = useState(paper?.progress || 0);
    const [comments, setComments] = useState<Comment[]>(paper?.comments || []);
    const [newComment, setNewComment] = useState("");
    const [team, setTeam] = useState(paper?.team || "");
    const [files, setFiles] = useState<LabFile[]>(paper?.files || []);
    const cImg = useCommentImg();
    const [tried, setTried] = useState(false);

    const handleSave = () => {
        setTried(true);
        if (!title.trim() || assignees.length === 0) return false;
        onSave({ id: paper?.id ?? genId(), title, journal, status, assignees, tags, deadline, progress, comments, creator: paper?.creator || currentUser, createdAt: paper?.createdAt || new Date().toLocaleString("ko-KR"), team, files });
        return true;
    };
    const addComment = () => {
        if (!newComment.trim() && !cImg.img) return;
        setComments([...comments, { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }]);
        setNewComment(""); cImg.clear();
    };
    const isDirty = title.trim() !== (paper?.title || "");
    const handleBackdropClose = () => { if (isDirty && !confirm("작성 중인 내용이 있습니다. 닫으시겠습니까?")) return; onClose(); };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={handleBackdropClose} style={{ animation: "backdropIn 0.15s ease" }}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()} style={{ animation: "modalIn 0.2s ease" }}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "논문 수정" : "논문 등록"}</h3>
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
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">저널</label>
                            <input value={journal} onChange={e => setJournal(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">마감</label>
                            <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 12/31" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {[...STATUS_KEYS, "completed"].map(s => (
                                <button key={s} type="button" onClick={() => setStatus(s)}
                                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                    style={status === s ? { background: STATUS_CONFIG[s].color, color: statusText(STATUS_CONFIG[s].color) } : undefined}>
                                    {STATUS_CONFIG[s].label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">참여자 *</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        {tried && assignees.length === 0 && <p className="text-[11px] text-red-500 mt-0.5">참여자를 선택하세요</p>}
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">태그</label>
                        <PillSelect options={tagList} selected={tags} onToggle={v => setTags(toggleArr(tags, v))} />
                    </div>
                    {teamNames && <TeamSelect teamNames={teamNames} selected={team} onSelect={setTeam} />}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">진행도 {progress}%</label>
                        <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))}
                            className="w-full accent-blue-500" />
                    </div>
                    <ItemFiles files={files} onChange={setFiles} currentUser={currentUser} />
                    {/* Comments */}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
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
                                onPaste={cImg.onPaste} onKeyDown={e => chatKeyDown(e, addComment)} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">{cImg.uploading ? "⏳" : "전송"}</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={handleBackdropClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && (
                        <button onClick={() => confirmDel(() => { onDelete(paper!.id); onClose(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                    )}
                </div>
            </div>
        </div>
    );
}

const KanbanView = memo(function KanbanView({ papers, filter, onFilterPerson, allPeople, onClickPaper, onAddPaper, onSavePaper, onDeletePaper, onReorder, tagList, onSaveTags, teamNames, currentUser }: { papers: Paper[]; filter: string; onFilterPerson?: (name: string) => void; allPeople?: string[]; onClickPaper: (p: Paper) => void; onAddPaper: () => void; onSavePaper: (p: Paper) => void; onDeletePaper?: (id: number) => void; onReorder: (list: Paper[]) => void; tagList: string[]; onSaveTags: (list: string[]) => void; teamNames?: string[]; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [filterTeam, setFilterTeam] = useState("전체");
    const personFiltered = filter === "전체" ? papers : papers.filter(p => p.assignees.includes(filter) || p.tags.some(t => t === filter));
    const filtered = filterTeam === "전체" ? personFiltered : personFiltered.filter(p => p.team === filterTeam);
    const [showTagMgr, setShowTagMgr] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [mobileCol, setMobileCol] = useState(STATUS_KEYS[0]);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Paper | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [selected, setSelected] = useState<Paper | null>(null);
    const handleChatAdd = (msg: ChatMessage) => { if (!selected) return; const u = { ...selected, comments: [...selected.comments, msg] }; onSavePaper(u); setSelected(u); };
    const handleChatDelete = (id: number) => { if (!selected) return; const u = { ...selected, comments: selected.comments.filter(c => c.id !== id) }; onSavePaper(u); setSelected(u); };
    const handleFileAdd = (f: LabFile) => { if (!selected) return; const u = { ...selected, files: [...(selected.files || []), f] }; onSavePaper(u); setSelected(u); };
    const handleFileDelete = async (id: number) => { if (!selected) return; const f = (selected.files || []).find(x => x.id === id); if (f?.url?.startsWith("https://")) { try { const tk = typeof window !== "undefined" ? localStorage.getItem("mftel-auth-token") || "" : ""; await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: f.url }), headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {} as Record<string, string>) } }); } catch (e) { console.warn("파일 삭제 실패:", e); } } const u = { ...selected, files: (selected.files || []).filter(x => x.id !== id) }; onSavePaper(u); setSelected(u); };
    const completedPapers = filtered.filter(p => PAPER_STATUS_MIGRATE(p.status) === "completed");
    const kanbanFiltered = filtered.filter(p => PAPER_STATUS_MIGRATE(p.status) !== "completed");
    return (
        <div>
            {/* Action buttons */}
            <div className="mb-3 flex items-center justify-end">
                <div className="flex items-center gap-2">
                    <button onClick={onAddPaper} className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors"><span className="text-[14px]">+</span> 논문 등록</button>
                    <button onClick={() => setShowTagMgr(!showTagMgr)} className="hidden md:inline-flex px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">🏷️ 태그 관리</button>
                    <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedPapers.length})</button>
                </div>
            </div>
            {/* Filter rows */}
            {(teamNames && teamNames.length > 0 || allPeople) && (
                <div className="space-y-2 mb-3">
                    {/* Row 1: team chips */}
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
                    {/* Row 2: member chips (emoji + name) */}
                    {allPeople && onFilterPerson && (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold flex-shrink-0" style={{color:"#94A3B8"}}>멤버</span>
                            <div className="flex items-center gap-1 overflow-x-auto pb-0.5" style={{scrollbarWidth:"none", whiteSpace:"nowrap"}}>
                                {allPeople.map(p => (
                                    <button key={p} onClick={() => onFilterPerson(p)}
                                        className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-all flex-shrink-0"
                                        style={{
                                            background: filter === p ? "#3B82F6" : "transparent",
                                            color: filter === p ? "#FFFFFF" : "#64748B",
                                            border: filter === p ? "1px solid #3B82F6" : "1px solid #CBD5E1",
                                        }}>
                                        {p === "전체" ? "전체" : `${MEMBERS[p]?.emoji || "👤"} ${p}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {showTagMgr && (
                <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[13px] font-semibold text-slate-600 mb-2">논문 태그 목록</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {tagList.map(t => (
                            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[12px] text-slate-700">
                                {t}
                                <button onClick={() => onSaveTags(tagList.filter(x => x !== t))} className="text-slate-400 hover:text-red-500 text-[11px]">✕</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="새 태그"
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            onKeyDown={e => { if (e.key === "Enter" && newTag.trim() && !tagList.includes(newTag.trim())) { onSaveTags([...tagList, newTag.trim()]); setNewTag(""); } }} />
                        <button onClick={() => { if (newTag.trim() && !tagList.includes(newTag.trim())) { onSaveTags([...tagList, newTag.trim()]); setNewTag(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            {/* Mobile tab bar */}
            {!showCompleted && (
            <div className="md:hidden flex border-b border-slate-200 mb-3 -mx-1">
                {STATUS_KEYS.map(status => {
                    const cnt = kanbanFiltered.filter(p => PAPER_STATUS_MIGRATE(p.status) === status).length;
                    const st = STATUS_CONFIG[status];
                    return (
                        <button key={status} onClick={() => setMobileCol(status)}
                            className={`flex-1 text-center py-2 text-[13px] font-semibold transition-colors ${mobileCol === status ? "border-b-2 text-slate-800" : "text-slate-400"}`}
                            style={mobileCol === status ? { borderColor: st.color } : {}}>
                            {st.label} <span className="text-[11px] font-normal">{cnt}</span>
                        </button>
                    );
                })}
            </div>
            )}
            {/* Mobile single column */}
            {!showCompleted && (() => {
                const colItems = kanbanFiltered.filter(p => PAPER_STATUS_MIGRATE(p.status) === mobileCol);
                return (
            <div className="md:hidden space-y-2">
                {colItems.map((p, mi) => (
                    <div key={p.id} onClick={() => { if (window.getSelection()?.toString()) return; setSelected(p); }}
                        className={`bg-white rounded-xl py-3 px-4 cursor-pointer transition-all border border-slate-200 hover:border-slate-300 hover:shadow-sm`}
                        style={{ borderLeft: p.needsDiscussion ? "3px solid #EF4444" : `3px solid ${STATUS_CONFIG[mobileCol]?.color || "#ccc"}` }}>
                        <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!p.needsDiscussion} onChange={() => onSavePaper({ ...p, needsDiscussion: !p.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                            <span className={`text-[11px] font-medium ${p.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words">{p.title}<SavingBadge id={p.id} /></div>
                                <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                    {p.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{background:"#EFF6FF", color:"#3B82F6", fontWeight:500}}>{p.team}</span>}
                                    {p.tags.slice(0, 2).map(t => <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 flex-shrink-0">{t}</span>)}
                                    {p.tags.length > 2 && <span className="text-[11px] text-slate-400 flex-shrink-0">+{p.tags.length - 2}</span>}
                                </div>
                            </div>
                            <MobileReorderButtons idx={mi} total={colItems.length} onMove={dir => onReorder(moveInColumn(papers, p.id, dir, colItems))} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                <div className="h-1 rounded-full transition-all" style={{ width: `${p.progress}%`, background: "#3B82F6" }} />
                            </div>
                            <span className="text-[11px] font-semibold" style={{color: p.progress >= 80 ? "#10B981" : "#3B82F6"}}>{p.progress}%</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5 truncate">
                            {p.assignees.map((a, i) => <span key={a}>{i > 0 && ", "}{MEMBERS[a]?.emoji || "👤"}{a}</span>)}
                        </div>
                    </div>
                ))}
                {colItems.length === 0 && <div className="text-center py-10"><div className="text-3xl mb-2 opacity-30">📄</div><div className="text-[13px] text-slate-300">{STATUS_CONFIG[mobileCol]?.label} 논문이 없습니다</div></div>}
            </div>
                );
            })()}
            {/* Desktop kanban */}
            {!showCompleted && (
            <div className="hidden md:flex gap-3 pb-2">
                {STATUS_KEYS.map(status => {
                    const col = kanbanFiltered.filter(p => PAPER_STATUS_MIGRATE(p.status) === status);
                    const st = STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDropTarget(calcDropIdx(e, status)); }}
                            onDragLeave={() => {}}
                            onDrop={() => { if (dragItem.current && dropTarget) { const reordered = reorderKanbanItems(papers, dragItem.current, status, dropTarget.idx, p => PAPER_STATUS_MIGRATE(p.status), (p, s) => ({ ...p, status: s })); onReorder(reordered); } dragItem.current = null; setDraggedId(null); setDropTarget(null); }}>
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${st.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: st.color }} />
                                <span className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>{st.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((p, cardIdx) => (
                                    <div key={p.id}>
                                    {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = p; setDraggedId(p.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === p.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        onClick={() => { if (window.getSelection()?.toString()) return; setSelected(p); }}
                                        className={`bg-white rounded-xl py-3 px-4 cursor-grab transition-all overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${draggedId === p.id ? "opacity-40 scale-95" : ""} border border-slate-200 hover:border-slate-300`}
                                        style={{ borderLeft: p.needsDiscussion ? "3px solid #EF4444" : `3px solid ${st.color}` }}>
                                        <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!p.needsDiscussion} onChange={() => onSavePaper({ ...p, needsDiscussion: !p.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                            <span className={`text-[11px] font-medium ${p.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words line-clamp-2">{p.title}<SavingBadge id={p.id} /></div>
                                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                            {p.team && <span className="text-[11px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{background:"#EFF6FF", color:"#3B82F6", fontWeight:500}}>{p.team}</span>}
                                            {p.tags.slice(0, 2).map(t => <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 flex-shrink-0">{t}</span>)}
                                            {p.tags.length > 2 && <span className="text-[11px] text-slate-400 flex-shrink-0">+{p.tags.length - 2}</span>}
                                            {(p.files?.length ?? 0) > 0 && <span className="text-[11px] text-slate-400 flex-shrink-0 ml-auto">📎{p.files?.length}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                <div className="h-1 rounded-full transition-all" style={{ width: `${p.progress}%`, background: "#3B82F6" }} />
                                            </div>
                                            <span className="text-[11px] font-semibold" style={{color: p.progress >= 80 ? "#10B981" : "#3B82F6"}}>{p.progress}%</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1.5 truncate">
                                            {p.assignees.map((a, i) => <span key={a}>{i > 0 && ", "}{MEMBERS[a]?.emoji || "👤"}{a}</span>)}
                                        </div>
                                    </div>
                                    </div>
                                ))}
                                {dropTarget?.col === status && dropTarget?.idx === col.length && <DropLine />}
                                {col.length === 0 && <div className="text-center py-8"><div className="text-2xl mb-1 opacity-30">📄</div><div className="text-[12px] text-slate-300">항목 없음</div></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
            {showCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {completedPapers.map(p => (
                        <div key={p.id} onClick={() => { if (window.getSelection()?.toString()) return; setSelected(p); }}
                            className="bg-white rounded-xl p-4 cursor-pointer transition-all border border-emerald-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{p.title}<SavingBadge id={p.id} /></div>
                            {p.team && <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-semibold">{p.team}</span>}
                            {p.journal !== "TBD" && <div className="text-[12px] text-slate-500 italic mb-1 truncate">{p.journal}</div>}
                            <div className="flex gap-1 flex-wrap mb-1.5">
                                {p.tags.map(t => <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t}</span>)}
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {p.assignees.slice(0, 3).map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                    {p.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{p.assignees.length - 3}</span>}
                                </div>
                                {p.deadline && <span className="text-[11px] text-red-500 font-semibold">~{p.deadline}</span>}
                            </div>
                            {p.creator && <div className="text-[11px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedPapers.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 논문이 없습니다</div>}
                </div>
            )}
            {/* Mobile FAB */}
            {!selected && (
                <button onClick={onAddPaper} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-600 active:scale-95 transition-transform">+</button>
            )}
            {selected && (
                <DetailModal3Col
                    onClose={() => setSelected(null)}
                    onEdit={() => { onClickPaper(selected); setSelected(null); }}
                    onDelete={onDeletePaper && (currentUser === selected.creator || currentUser === "박일웅") ? () => { onDeletePaper!(selected.id); setSelected(null); } : undefined}
                    files={selected.files || []}
                    currentUser={currentUser}
                    onAddFile={handleFileAdd}
                    onDeleteFile={handleFileDelete}
                    chatMessages={selected.comments}
                    onAddChat={handleChatAdd}
                    onDeleteChat={handleChatDelete}
                    chatDraftKey={`comment_paper_${selected.id}`}
                >
                    <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selected.title}</h2>
                    {selected.journal !== "TBD" && <p className="text-[13px] text-slate-500 italic mt-1">{selected.journal}</p>}
                    <div className="flex flex-wrap gap-1.5">
                        {selected.team && <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{background:"#EFF6FF", color:"#3B82F6"}}>{selected.team}</span>}
                        {selected.tags.map(t => <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">{t}</span>)}
                    </div>
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
                        <span className="text-[12px] px-2 py-0.5 rounded-full font-medium" style={{background: STATUS_CONFIG[PAPER_STATUS_MIGRATE(selected.status)]?.color || "#94A3B8", color: statusText(STATUS_CONFIG[PAPER_STATUS_MIGRATE(selected.status)]?.color || "#94A3B8")}}>{STATUS_CONFIG[PAPER_STATUS_MIGRATE(selected.status)]?.label || selected.status}</span>
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

// ─── Report Components ───────────────────────────────────────────────────────


export { PaperFormModal, KanbanView };
