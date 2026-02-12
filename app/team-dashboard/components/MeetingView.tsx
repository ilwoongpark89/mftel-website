"use client";

import { useState, useEffect, useRef, useContext, useMemo, memo } from "react";
import type { Comment, Meeting } from "../lib/types";
import { MEMBERS, MEMBER_NAMES } from "../lib/constants";
import { genId, toggleArr, chatKeyDown, renderWithMentions, saveDraft, loadDraft, clearDraft } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useCommentImg } from "../lib/hooks";
import { PillSelect, SavingBadge, TeamFilterBar, TeamSelect } from "./shared";

function MeetingFormModal({ meeting, onSave, onDelete, onClose, currentUser, teamNames, templateInit }: {
    meeting: Meeting | null; onSave: (m: Meeting) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; teamNames: string[];
    templateInit?: { title: string; goal: string; summary: string } | null;
}) {
    const confirmDel = useContext(ConfirmDeleteContext);
    const isEdit = !!meeting;
    const [title, setTitle] = useState(() => { if (templateInit) return templateInit.title; if (meeting) return meeting.title; const d = loadDraft("meeting_add"); if (d) { try { return JSON.parse(d).title || ""; } catch (e) { console.warn("Draft parse failed:", e); } } return ""; });
    const [goal, setGoal] = useState(templateInit?.goal || meeting?.goal || "");
    const [summary, setSummary] = useState(() => { if (templateInit) return templateInit.summary; if (meeting) return meeting.summary || ""; const d = loadDraft("meeting_add"); if (d) { try { return JSON.parse(d).content || ""; } catch (e) { console.warn("Draft parse failed:", e); } } return ""; });
    const [date, setDate] = useState(meeting?.date || new Date().toISOString().split("T")[0]);
    const [assignees, setAssignees] = useState<string[]>(meeting?.assignees || []);
    const [team, setTeam] = useState(meeting?.team || "");
    const [comments, setComments] = useState<Comment[]>(meeting?.comments || []);
    const [newComment, setNewComment] = useState("");
    const cImg = useCommentImg();
    const composingRef = useRef(false);
    const [meetingDraftLoaded] = useState(() => { if (meeting) return false; const d = loadDraft("meeting_add"); if (d) { try { const p = JSON.parse(d); return !!(p.title || p.content); } catch (e) { console.warn("Draft parse failed:", e); } } return false; });
    const [meetingDraftVisible, setMeetingDraftVisible] = useState(meetingDraftLoaded);
    const [tried, setTried] = useState(false);

    // Draft auto-save for add form
    useEffect(() => { if (!isEdit) saveDraft("meeting_add", JSON.stringify({ title, content: summary })); }, [title, summary, isEdit]);

    const handleSave = () => {
        setTried(true);
        if (!title.trim() || assignees.length === 0) return;
        if (!isEdit) { clearDraft("meeting_add"); setMeetingDraftVisible(false); }
        onSave({ id: meeting?.id ?? genId(), title: title.trim(), goal: goal.trim(), summary: summary.trim(), date, assignees, status: "done", creator: meeting?.creator || currentUser, createdAt: meeting?.createdAt || new Date().toLocaleString("ko-KR"), comments, team, needsDiscussion: meeting?.needsDiscussion });
    };
    const addComment = () => {
        if (!newComment.trim() && !cImg.img) return;
        setComments([...comments, { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }]);
        setNewComment(""); cImg.clear();
    };

    const handleClose = () => {
        const isDirty = title.trim() !== (meeting?.title || "") || summary.trim() !== (meeting?.summary || "");
        if (isDirty && !confirm("작성 중인 내용이 있습니다. 닫으시겠습니까?")) return;
        if (!isEdit && (title.trim() || summary.trim())) saveDraft("meeting_add", JSON.stringify({ title, content: summary })); onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={handleClose}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "회의록 수정" : "회의록 작성"}</h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    {meetingDraftVisible && !isEdit && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                            <span>임시저장된 글이 있습니다</span>
                            <button onClick={() => { setTitle(""); setSummary(""); clearDraft("meeting_add"); setMeetingDraftVisible(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                        </div>
                    )}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">회의 이름 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} autoFocus className={`w-full border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${tried && !title.trim() ? "border-red-400 ring-2 ring-red-200" : "border-slate-200"}`} />
                        {tried && !title.trim() && <p className="text-[11px] text-red-500 mt-0.5">회의 이름을 입력하세요</p>}
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">목표</label>
                        <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="이번 회의에서 달성할 목표" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">날짜</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">참석자 *</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))} />
                        {tried && assignees.length === 0 && <p className="text-[11px] text-red-500 mt-0.5">참석자를 선택하세요</p>}
                    </div>
                    {teamNames.length > 0 && <TeamSelect teamNames={teamNames} selected={team} onSelect={v => setTeam(v)} />}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용 요약</label>
                        <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={5} placeholder="회의 내용을 요약해 주세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                    </div>
                    {/* Comments */}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">댓글 ({comments.length})</label>
                        <div className="space-y-1.5 mb-2 max-h-[200px] overflow-y-auto">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2 group relative text-[13px]">
                                    <button onClick={() => { if (!confirm("댓글을 삭제하시겠습니까?")) return; setComments(comments.filter(x => x.id !== c.id)); }}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100">✕</button>
                                    <div className="text-slate-700 pr-4">{renderWithMentions(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mt-1" />}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{c.author} · {c.date}</div>
                                </div>
                            ))}
                        </div>
                        {cImg.preview}
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글... (Ctrl+V 이미지)"
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                onCompositionStart={() => { composingRef.current = true; }}
                                onCompositionEnd={() => { composingRef.current = false; }}
                                onPaste={cImg.onPaste} onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] hover:bg-blue-600">{cImg.uploading ? "⏳" : "추가"}</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={handleClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { setTried(true); if (!title.trim() || assignees.length === 0) return; handleSave(); onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => confirmDel(() => { onDelete(meeting!.id); onClose(); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                </div>
            </div>
        </div>
    );
}

const DEFAULT_TEMPLATE_ITEMS = ["연구 진행 현황", "실험/해석 결과", "문제점 및 해결 방안", "다음 단계"];

function TemplateEditorModal({ items, onSave, onClose }: { items: string[]; onSave: (items: string[]) => void; onClose: () => void }) {
    const [list, setList] = useState<string[]>(items.length > 0 ? [...items] : [...DEFAULT_TEMPLATE_ITEMS]);
    const [newItem, setNewItem] = useState("");
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editVal, setEditVal] = useState("");

    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= list.length) return;
        const next = [...list];
        [next[i], next[j]] = [next[j], next[i]];
        setList(next);
    };
    const remove = (i: number) => setList(list.filter((_, idx) => idx !== i));
    const add = () => {
        if (!newItem.trim()) return;
        setList([...list, newItem.trim()]);
        setNewItem("");
    };
    const startEdit = (i: number) => { setEditIdx(i); setEditVal(list[i]); };
    const finishEdit = () => {
        if (editIdx === null) return;
        if (editVal.trim()) {
            const next = [...list]; next[editIdx] = editVal.trim(); setList(next);
        }
        setEditIdx(null); setEditVal("");
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">회의록 양식 편집</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                </div>
                <div className="p-4">
                    <p className="text-[12px] text-slate-400 mb-3">회의록 작성 시 &quot;내용 요약&quot;에 기본으로 채워지는 항목을 편집합니다.</p>
                    <div className="space-y-1.5 mb-4">
                        {list.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 group">
                                <span className="text-[12px] text-slate-400 w-5 text-right shrink-0">{i + 1}.</span>
                                {editIdx === i ? (
                                    <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                                        className="flex-1 border border-blue-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onKeyDown={e => { if (e.key === "Enter") finishEdit(); if (e.key === "Escape") { setEditIdx(null); setEditVal(""); } }}
                                        onBlur={finishEdit} />
                                ) : (
                                    <span className="flex-1 text-[13px] text-slate-700 cursor-pointer hover:text-blue-600" onClick={() => startEdit(i)}>{item}</span>
                                )}
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => move(i, -1)} disabled={i === 0} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 text-[12px]">↑</button>
                                    <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 text-[12px]">↓</button>
                                    <button onClick={() => remove(i)} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 text-[12px]">✕</button>
                                </div>
                            </div>
                        ))}
                        {list.length === 0 && <div className="text-[13px] text-slate-400 text-center py-3">항목이 없습니다</div>}
                    </div>
                    <div className="flex gap-2">
                        <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="새 항목 추가..."
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            onKeyDown={e => { if (e.key === "Enter") add(); }} />
                        <button onClick={add} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <button onClick={() => setList([...DEFAULT_TEMPLATE_ITEMS])} className="text-[12px] text-slate-400 hover:text-slate-600">기본값 복원</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { onSave(list); onClose(); }} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function buildSummaryFromTemplate(items: string[]): string {
    return items.map((item, i) => `${i + 1}. ${item}`).join("\n\n");
}

const MeetingView = memo(function MeetingView({ meetings, onSave, onDelete, currentUser, teamNames, templateItems, onSaveTemplate }: {
    meetings: Meeting[]; onSave: (m: Meeting) => void; onDelete: (id: number) => void; currentUser: string; teamNames: string[];
    templateItems?: string[]; onSaveTemplate?: (items: string[]) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Meeting | null>(null);
    const [adding, setAdding] = useState(false);
    const [filterTeam, setFilterTeam] = useState("전체");
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [templateInit, setTemplateInit] = useState<{ title: string; goal: string; summary: string } | null>(null);
    const currentTemplateItems = templateItems && templateItems.length > 0 ? templateItems : DEFAULT_TEMPLATE_ITEMS;

    const filtered = filterTeam === "전체" ? meetings : meetings.filter(m => m.team === filterTeam);
    const sorted = useMemo(() => [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [filtered]);

    const monthGroups = useMemo(() => {
        const groups: { label: string; key: string; items: Meeting[] }[] = [];
        for (const m of sorted) {
            const d = m.date ? new Date(m.date) : null;
            const key = d && !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "no-date";
            const label = d && !isNaN(d.getTime()) ? `📅 ${d.getFullYear()}년 ${d.getMonth() + 1}월` : "📅 날짜 미정";
            let group = groups.find(g => g.key === key);
            if (!group) { group = { label, key, items: [] }; groups.push(group); }
            group.items.push(m);
        }
        return groups;
    }, [sorted]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => { setTemplateInit({ title: "", goal: "", summary: buildSummaryFromTemplate(currentTemplateItems) }); setAdding(true); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">+ 회의록 작성</button>
                    <button onClick={() => setShowTemplateEditor(true)} className="px-3 py-2 text-[13px] bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium">📋 양식</button>
                </div>
                <span className="text-[13px] text-slate-400">총 {filtered.length}건</span>
            </div>
            {teamNames.length > 0 && <TeamFilterBar teamNames={teamNames} selected={filterTeam} onSelect={setFilterTeam} />}
            {sorted.length === 0 && <div className="text-center py-12"><div className="text-3xl mb-2 opacity-40">📝</div><div className="text-slate-400 text-[14px]">아직 회의록이 없습니다</div></div>}
            {monthGroups.map(group => (
                <div key={group.key} className="mb-6">
                    <h3 className="text-[15px] font-bold text-slate-700 mb-3 pb-2 border-b border-slate-200">{group.label} <span className="text-[12px] text-slate-400 font-normal ml-1">({group.items.length}건)</span></h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map(m => (
                    <div key={m.id} onClick={() => setEditing(m)}
                        className={`bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col ${m.needsDiscussion ? "border border-slate-200 border-l-[3px] border-l-red-400" : "border border-slate-200 hover:border-slate-300"}`}>
                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!m.needsDiscussion} onChange={() => onSave({ ...m, needsDiscussion: !m.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                            <span className={`text-[11px] font-medium ${m.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="flex items-start justify-between mb-1">
                            <div className="text-[14px] font-semibold text-slate-800 break-words flex-1">{m.title}<SavingBadge id={m.id} /></div>
                            <span className="text-[11px] text-slate-400 ml-2 whitespace-nowrap">{m.date}</span>
                        </div>
                        {m.team && <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-semibold self-start mb-1">{m.team}</span>}
                        {m.goal && <div className="text-[12px] text-blue-600 mb-1 line-clamp-1"><span className="font-semibold">목표:</span> {m.goal}</div>}
                        {m.summary && <div className="text-[13px] text-slate-600 mb-2 line-clamp-3 break-words">{m.summary}</div>}
                        <div className="flex flex-wrap gap-0.5 mb-2">
                            {m.assignees.slice(0, 5).map(a => <span key={a} className="text-[11px] px-1 py-0.5 rounded bg-slate-50 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                            {m.assignees.length > 5 && <span className="text-[11px] text-slate-400">+{m.assignees.length - 5}</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 mb-1">{MEMBERS[m.creator]?.emoji || ""} {m.creator}</div>
                        {m.comments.length > 0 ? (
                            <div className="border-t border-slate-100 pt-2 mt-auto space-y-1">
                                <div className="text-[11px] font-semibold text-slate-400 mb-1">💬 댓글 {m.comments.length}개</div>
                                {m.comments.slice(-2).map(c => (
                                    <div key={c.id} className="text-[12px] text-slate-500 truncate">
                                        <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {renderWithMentions(c.text)}{c.imageUrl && " 📷"}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border-t border-slate-100 pt-2 mt-auto">
                                <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                            </div>
                        )}
                    </div>
                ))}
                    </div>
                </div>
            ))}
            {adding && <MeetingFormModal meeting={null} onSave={m => { onSave(m); setAdding(false); setTemplateInit(null); }} onClose={() => { setAdding(false); setTemplateInit(null); }} currentUser={currentUser} teamNames={teamNames} templateInit={templateInit} />}
            {editing && <MeetingFormModal meeting={editing} onSave={m => { onSave(m); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} teamNames={teamNames} />}
            {showTemplateEditor && <TemplateEditorModal items={currentTemplateItems} onSave={items => onSaveTemplate?.(items)} onClose={() => setShowTemplateEditor(false)} />}
        </div>
    );
});

// ─── Lab Chat View ───────────────────────────────────────────────────────────


export { MeetingFormModal, MeetingView };
