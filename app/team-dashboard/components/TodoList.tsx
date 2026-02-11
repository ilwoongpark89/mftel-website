"use client";

import { useState, useRef, useContext, memo } from "react";
import type { Comment, Todo } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, PRIORITY_ICON, PRIORITY_LABEL, PRIORITY_KEYS } from "../lib/constants";
import { genId, toggleArr, renderWithMentions, calcDropIdx, reorderKanbanItems } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { DropLine, PillSelect, SavingBadge } from "./shared";

const TodoList = memo(function TodoList({ todos, onToggle, onAdd, onUpdate, onDelete, onReorder, currentUser }: { todos: Todo[]; onToggle: (id: number) => void; onAdd: (t: Todo) => void; onUpdate: (t: Todo) => void; onDelete: (id: number) => void; onReorder: (list: Todo[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [newText, setNewText] = useState("");
    const [newAssignees, setNewAssignees] = useState<string[]>([]);
    const [newPriority, setNewPriority] = useState("mid");
    const [newDeadline, setNewDeadline] = useState("");
    const [newProgress, setNewProgress] = useState(0);
    const [filterPeople, setFilterPeople] = useState<string[]>([currentUser]);
    const [mobileCol, setMobileCol] = useState("todo");
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Todo | null>(null);
    const [editComments, setEditComments] = useState<Comment[]>([]);
    const [editNewComment, setEditNewComment] = useState("");


    const filtered = filterPeople.length === 0 ? todos : todos.filter(t => t.assignees.some(a => filterPeople.includes(a)));
    const getCol = (t: Todo) => t.done ? "completed" : (t.progress ?? 0) > 0 ? "inProgress" : "todo";
    const setCol = (t: Todo, s: string): Todo => s === "todo" ? { ...t, done: false, progress: 0 } : s === "inProgress" ? { ...t, done: false, progress: Math.max(t.progress ?? 0, 5) } : { ...t, done: true };
    const todoItems = filtered.filter(t => !t.done && (t.progress ?? 0) === 0);
    const inProgressItems = filtered.filter(t => !t.done && (t.progress ?? 0) > 0);
    const completedTodos = filtered.filter(t => t.done);
    const colData: { id: string; label: string; border: string; bgDrop: string; items: Todo[] }[] = [
        { id: "todo", label: "할 일", border: "border-blue-500", bgDrop: "bg-blue-50/50", items: todoItems },
        { id: "inProgress", label: "진행 중", border: "border-amber-500", bgDrop: "bg-amber-50/50", items: inProgressItems },
        { id: "completed", label: "완료", border: "border-emerald-500", bgDrop: "bg-emerald-50/50", items: completedTodos },
    ];

    const handleAdd = () => {
        if (!newText.trim()) return;
        const assignees = newAssignees.length > 0 ? newAssignees : [currentUser];
        onAdd({ id: genId(), text: newText.trim(), assignees, done: false, priority: newPriority, deadline: newDeadline, progress: newProgress, comments: [] });
        setNewText(""); setNewAssignees([]); setNewPriority("mid"); setNewDeadline(""); setNewProgress(0); setShowForm(false);
    };

    const doneCount = filtered.filter(t => t.done).length;
    const totalCount = filtered.length;

    return (
        <div>
            {/* Action buttons */}
            <div className="mb-3 flex items-center justify-end">
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowForm(!showForm)} className="hidden md:inline-flex px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors">+ 할 일 추가</button>
                    <span className="text-[13px] text-slate-400">{doneCount}/{totalCount} 완료</span>
                </div>
            </div>
            {/* Member filter */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold flex-shrink-0" style={{color:"#94A3B8"}}>멤버</span>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5" style={{scrollbarWidth:"none", whiteSpace:"nowrap"}}>
                        <button onClick={() => setFilterPeople([])}
                            className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-all flex-shrink-0"
                            style={{
                                background: filterPeople.length === 0 ? "#3B82F6" : "transparent",
                                color: filterPeople.length === 0 ? "#FFFFFF" : "#64748B",
                                border: filterPeople.length === 0 ? "1px solid #3B82F6" : "1px solid #CBD5E1",
                            }}>
                            전체
                        </button>
                        {MEMBER_NAMES.map(name => (
                            <button key={name} onClick={() => setFilterPeople(filterPeople.includes(name) ? filterPeople.filter(n => n !== name) : [...filterPeople, name])}
                                className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-all flex-shrink-0"
                                style={{
                                    background: filterPeople.includes(name) ? "#3B82F6" : "transparent",
                                    color: filterPeople.includes(name) ? "#FFFFFF" : "#64748B",
                                    border: filterPeople.includes(name) ? "1px solid #3B82F6" : "1px solid #CBD5E1",
                                }}>
                                {`${MEMBERS[name]?.emoji || ""} ${name}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Add form — inline on desktop, modal on mobile */}
            {showForm && (
                <div className="hidden md:block">
                    <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                        <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="할 일 내용..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus />
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">담당자 (미선택시 본인)</label>
                            <PillSelect options={MEMBER_NAMES} selected={newAssignees} onToggle={v => setNewAssignees(toggleArr(newAssignees, v))}
                                emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        </div>
                        <div className="flex gap-3 items-end">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">우선순위</label>
                                <div className="flex gap-1">
                                    {PRIORITY_KEYS.map(p => (
                                        <button key={p} type="button" onClick={() => setNewPriority(p)}
                                            className={`px-2 py-0.5 rounded text-[12px] ${newPriority === p ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                            {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">기한</label>
                                <input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} placeholder="예: 2/28"
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-[13px] w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">달성도 {newProgress}%</label>
                                <input type="range" min={0} max={100} step={5} value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} className="w-[120px] accent-blue-500" />
                            </div>
                            <div className="flex gap-1 ml-auto">
                                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-[13px] text-slate-400 hover:text-slate-600">취소</button>
                                <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">추가</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Mobile add modal */}
            {showForm && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[15px] font-bold text-slate-800">할 일 추가</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="할 일 내용..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" autoFocus />
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">담당자</label>
                            <div className="flex flex-nowrap overflow-x-auto gap-1">
                                {MEMBER_NAMES.map(name => (
                                    <button key={name} type="button" onClick={() => setNewAssignees(toggleArr(newAssignees, name))}
                                        className={`px-2 py-0.5 rounded-full text-[12px] font-medium shrink-0 ${newAssignees.includes(name) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 items-end">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">우선순위</label>
                                <div className="flex gap-1">
                                    {PRIORITY_KEYS.map(p => (
                                        <button key={p} type="button" onClick={() => setNewPriority(p)}
                                            className={`px-2 py-0.5 rounded text-[12px] ${newPriority === p ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                            {PRIORITY_ICON[p]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">기한</label>
                                <input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} placeholder="예: 2/28"
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-[13px] w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">달성도 {newProgress}%</label>
                                <input type="range" min={0} max={100} step={5} value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} className="w-full accent-blue-500" />
                            </div>
                        </div>
                        <button onClick={handleAdd} className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            {/* Mobile tab bar */}
            <div className="md:hidden flex border-b border-slate-200 mb-3 -mx-1">
                {colData.map(col => (
                    <button key={col.id} onClick={() => setMobileCol(col.id)}
                        className={`flex-1 text-center py-2 text-[13px] font-semibold transition-colors ${mobileCol === col.id ? `border-b-2 ${col.border} text-slate-800` : "text-slate-400"}`}>
                        {col.label} <span className="text-[11px] font-normal">{col.items.length}</span>
                    </button>
                ))}
            </div>
            {/* Mobile single column */}
            <div className="md:hidden space-y-1.5">
                {colData.filter(c => c.id === mobileCol).map(col => (
                    <div key={col.id}>
                        {col.items.map(todo => (
                            <div key={todo.id} className={`flex items-start gap-2 p-2.5 rounded-md border transition-all mb-1.5 ${col.id === "completed" ? "bg-slate-50 border-slate-100 opacity-70" : todo.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200 bg-white" : todo.priority === "highest" ? "border-2 border-red-400 ring-1 ring-red-100 bg-red-50/30" : "bg-white border-slate-100"}`}>
                                <div onClick={() => onToggle(todo.id)} className={`w-[18px] h-[18px] rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${col.id === "completed" ? "bg-emerald-500" : "border-2 border-slate-300 hover:border-blue-400"}`}>
                                    {col.id === "completed" && <span className="text-white text-[13px]">✓</span>}
                                </div>
                                <div className="flex-1 min-w-0" onClick={() => { setEditingTodo(todo); setNewText(todo.text); setNewAssignees(todo.assignees); setNewPriority(todo.priority); setNewDeadline(todo.deadline); setNewProgress(todo.progress ?? 0); setEditComments(todo.comments || []); setEditNewComment(""); }}>
                                    {col.id !== "completed" && (
                                        <label className="flex items-center gap-1.5 mb-1" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!todo.needsDiscussion} onChange={() => onUpdate({ ...todo, needsDiscussion: !todo.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                            <span className={`text-[11px] font-medium ${todo.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                    )}
                                    <div className={`text-[14px] leading-relaxed ${col.id === "completed" ? "text-slate-500" : "text-slate-700"}`}>
                                        {PRIORITY_ICON[todo.priority] || ""} {todo.text}
                                        {col.id !== "completed" && todo.priority === "highest" && <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold align-middle">매우높음</span>}
                                    </div>
                                    {col.id !== "completed" && (todo.progress ?? 0) > 0 && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${todo.progress}%` }} /></div>
                                            <span className="text-[11px] font-semibold text-blue-500">{todo.progress}%</span>
                                        </div>
                                    )}
                                    <div className="flex gap-1 mt-1 flex-wrap items-center">
                                        {todo.assignees.map(a => <span key={a} className={`text-[11px] px-1.5 py-0.5 rounded-lg bg-slate-100 ${col.id === "completed" ? "text-slate-400" : "text-slate-500"}`}>{MEMBERS[a]?.emoji || ""}{a}</span>)}
                                        {col.id !== "completed" && todo.deadline && <span className="text-[11px] text-red-500 font-semibold ml-auto">~{todo.deadline}</span>}
                                    </div>
                                    <div className="border-t border-slate-100 pt-1 mt-1.5">
                                        {(todo.comments || []).length > 0 ? (
                                            <div className="text-[11px] text-slate-500 truncate">
                                                <span className="font-medium text-slate-600">{MEMBERS[(todo.comments || []).slice(-1)[0]?.author]?.emoji}{(todo.comments || []).slice(-1)[0]?.author}</span> {(todo.comments || []).slice(-1)[0]?.text}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {col.items.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">{col.label} 없음</div>}
                    </div>
                ))}
            </div>
            {/* Desktop 3-column kanban */}
            <div className="hidden md:grid grid-cols-3 gap-3">
                {colData.map(col => (
                    <div key={col.id}
                        onDragOver={e => { e.preventDefault(); setDropTarget(calcDropIdx(e, col.id)); }}
                        onDragLeave={() => {}}
                        onDrop={() => {
                            if (dragItem.current && dropTarget) {
                                const reordered = reorderKanbanItems(todos, dragItem.current, col.id, dropTarget.idx, getCol, setCol);
                                onReorder(reordered);
                            }
                            dragItem.current = null; setDraggedId(null); setDropTarget(null);
                        }}>
                        <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b-2 ${col.border}`}>
                            <span className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>{col.label}</span>
                            <span className="text-[12px] text-slate-400">{col.items.length}</span>
                        </div>
                        <div className={`space-y-1 min-h-[80px] rounded-lg transition-colors ${dropTarget?.col === col.id ? col.bgDrop : ""}`}>
                            {col.items.map((todo, cardIdx) => (
                                <div key={todo.id}>
                                    {dropTarget?.col === col.id && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = todo; setDraggedId(todo.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === todo.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: col.id, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        className={`flex items-start gap-2 p-2.5 rounded-md border transition-all group cursor-grab ${draggedId === todo.id ? "opacity-40 scale-95" : ""} ${col.id === "completed" ? "bg-slate-50 border-slate-100 opacity-70" : todo.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200 bg-white" : todo.priority === "highest" ? "border-2 border-red-400 ring-1 ring-red-100 bg-red-50/30" : "bg-white border-slate-100"}`}>
                                        <div onClick={() => onToggle(todo.id)} className={`w-[18px] h-[18px] rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${col.id === "completed" ? "bg-emerald-500" : "border-2 border-slate-300 hover:border-blue-400"}`}>
                                            {col.id === "completed" && <span className="text-white text-[13px]">✓</span>}
                                        </div>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingTodo(todo); setNewText(todo.text); setNewAssignees(todo.assignees); setNewPriority(todo.priority); setNewDeadline(todo.deadline); setNewProgress(todo.progress ?? 0); setEditComments(todo.comments || []); setEditNewComment(""); }}>
                                            {col.id !== "completed" && (
                                                <label className="flex items-center gap-1.5 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={!!todo.needsDiscussion} onChange={() => onUpdate({ ...todo, needsDiscussion: !todo.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                                    <span className={`text-[11px] font-medium ${todo.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                                </label>
                                            )}
                                            <div className={`text-[14px] leading-relaxed ${col.id === "completed" ? "text-slate-500" : "text-slate-700"}`}>
                                                {PRIORITY_ICON[todo.priority] || ""} {todo.text}<SavingBadge id={todo.id} />
                                                {col.id !== "completed" && todo.priority === "highest" && <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold align-middle">매우높음</span>}
                                            </div>
                                            {col.id !== "completed" && (todo.progress ?? 0) > 0 && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${todo.progress}%` }} /></div>
                                                    <span className="text-[11px] font-semibold text-blue-500">{todo.progress}%</span>
                                                </div>
                                            )}
                                            <div className="flex gap-1 mt-1 flex-wrap items-center">
                                                {todo.assignees.map(a => <span key={a} className={`text-[11px] px-1.5 py-0.5 rounded-lg bg-slate-100 ${col.id === "completed" ? "text-slate-400" : "text-slate-500"}`}>{MEMBERS[a]?.emoji || ""}{a}</span>)}
                                                {col.id !== "completed" && todo.deadline && <span className="text-[11px] text-red-500 font-semibold ml-auto">~{todo.deadline}</span>}
                                            </div>
                                            {/* Comment preview */}
                                            <div className="border-t border-slate-100 pt-1 mt-1.5">
                                                {(todo.comments || []).length > 0 ? (
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        <span className="font-medium text-slate-600">{MEMBERS[(todo.comments || []).slice(-1)[0]?.author]?.emoji}{(todo.comments || []).slice(-1)[0]?.author}</span> {(todo.comments || []).slice(-1)[0]?.text}
                                                    </div>
                                                ) : (
                                                    <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {dropTarget?.col === col.id && dropTarget?.idx === col.items.length && <DropLine />}
                        </div>
                        {col.items.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">{col.label} 없음</div>}
                    </div>
                ))}
            </div>
            {/* Mobile FAB */}
            {!showForm && !editingTodo && (
                <button onClick={() => setShowForm(true)} className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-600 active:scale-95 transition-transform">+</button>
            )}
            {/* Edit modal */}
            {editingTodo && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setEditingTodo(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">할 일 수정</h3>
                            <button onClick={() => setEditingTodo(null)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <input value={newText} onChange={e => setNewText(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">담당자</label>
                                <PillSelect options={MEMBER_NAMES} selected={newAssignees} onToggle={v => setNewAssignees(toggleArr(newAssignees, v))}
                                    emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                            </div>
                            <div className="flex gap-3">
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 block mb-1">우선순위</label>
                                    <div className="flex gap-1">
                                        {PRIORITY_KEYS.map(p => (
                                            <button key={p} type="button" onClick={() => setNewPriority(p)}
                                                className={`px-2 py-0.5 rounded text-[12px] ${newPriority === p ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 block mb-1">목표 기한</label>
                                    <input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} placeholder="예: 2/28"
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-[13px] w-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">달성도 {newProgress}%</label>
                                <input type="range" min={0} max={100} step={5} value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} className="w-full accent-blue-500" />
                            </div>
                            {/* Comments */}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">댓글 ({editComments.length})</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                                    {editComments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                            <button onClick={() => { if (!confirm("댓글을 삭제하시겠습니까?")) return; setEditComments(editComments.filter(x => x.id !== c.id)); }}
                                                className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4">{renderWithMentions(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mt-1" />}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {editComments.length === 0 && <div className="text-[12px] text-slate-300 py-2">댓글 없음</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={editNewComment} onChange={e => setEditNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onKeyDown={e => { if (e.key === "Enter" && editNewComment.trim()) { setEditComments([...editComments, { id: genId(), author: currentUser, text: editNewComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]); setEditNewComment(""); } }} />
                                    <button onClick={() => { if (editNewComment.trim()) { setEditComments([...editComments, { id: genId(), author: currentUser, text: editNewComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]); setEditNewComment(""); } }}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <button onClick={() => setEditingTodo(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={() => { onUpdate({ ...editingTodo, text: newText, assignees: newAssignees.length > 0 ? newAssignees : editingTodo.assignees, priority: newPriority, deadline: newDeadline, progress: newProgress, comments: editComments }); setEditingTodo(null); }}
                                    className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            <button onClick={() => confirmDel(() => { onDelete(editingTodo.id); setEditingTodo(null); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});


export { TodoList };
