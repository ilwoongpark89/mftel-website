"use client";

import { useState, useEffect, useRef, memo } from "react";
import type { TimetableBlock } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, TIMETABLE_COLORS, DAY_LABELS, SLOT_COUNT, slotToTime } from "../lib/constants";
import { genId, toggleArr } from "../lib/utils";
import { PillSelect } from "./shared";

function getCurrentSemester() {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return m >= 3 && m <= 8 ? `${y}-1` : m >= 9 ? `${y}-2` : `${y}-1`;
}

function semesterLabel(sem: string) {
    const [y, s] = sem.split("-");
    return `${y}년 ${s}학기`;
}

function shiftSemester(sem: string, dir: -1 | 1): string {
    const [y, s] = sem.split("-").map(Number);
    if (dir === 1) return s === 1 ? `${y}-2` : `${y + 1}-1`;
    return s === 2 ? `${y}-1` : `${y - 1}-2`;
}

const TimetableView = memo(function TimetableView({ blocks, onSave, onDelete }: {
    blocks: TimetableBlock[]; onSave: (b: TimetableBlock) => void; onDelete: (id: number) => void;
}) {
    const isDragging = useRef(false);
    const [dragDay, setDragDay] = useState<number | null>(null);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const [showForm, setShowForm] = useState<{ day: number; start: number; end: number } | null>(null);
    const [editBlock, setEditBlock] = useState<TimetableBlock | null>(null);
    const [formName, setFormName] = useState("");
    const [formStudents, setFormStudents] = useState<string[]>([]);
    const [semester, setSemester] = useState(getCurrentSemester);

    const dragDayRef = useRef(dragDay); dragDayRef.current = dragDay;
    const dragStartRef = useRef(dragStart); dragStartRef.current = dragStart;
    const dragEndRef = useRef(dragEnd); dragEndRef.current = dragEnd;

    useEffect(() => {
        const up = () => {
            if (isDragging.current && dragDayRef.current !== null && dragStartRef.current !== null && dragEndRef.current !== null) {
                const s = Math.min(dragStartRef.current, dragEndRef.current);
                const e = Math.max(dragStartRef.current, dragEndRef.current) + 1;
                setShowForm({ day: dragDayRef.current, start: s, end: e });
                setFormName(""); setFormStudents([]);
            }
            isDragging.current = false; setDragDay(null); setDragStart(null); setDragEnd(null);
        };
        document.addEventListener("mouseup", up);
        return () => document.removeEventListener("mouseup", up);
    }, []);

    const CELL_H = 28;

    // Filter blocks by current semester (blocks without semester belong to current)
    const filteredBlocks = blocks.filter(b => (b.semester || getCurrentSemester()) === semester);

    const handleSaveForm = () => {
        if (!formName.trim()) return;
        const color = TIMETABLE_COLORS[blocks.length % TIMETABLE_COLORS.length];
        if (showForm) {
            onSave({ id: genId(), day: showForm.day, startSlot: showForm.start, endSlot: showForm.end, name: formName, students: formStudents, color, semester });
            setShowForm(null);
        } else if (editBlock) {
            onSave({ ...editBlock, name: formName, students: formStudents });
            setEditBlock(null);
        }
    };

    const isInDrag = (day: number, slot: number) => {
        if (dragDay !== day || dragStart === null || dragEnd === null) return false;
        const s = Math.min(dragStart, dragEnd);
        const e = Math.max(dragStart, dragEnd);
        return slot >= s && slot <= e;
    };

    return (
        <div>
            {/* Semester Navigation */}
            <div className="flex items-center justify-center gap-4 mb-3">
                <button onClick={() => setSemester(s => shiftSemester(s, -1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-[14px]">◀</button>
                <span className="text-[15px] font-bold text-slate-700 min-w-[120px] text-center">{semesterLabel(semester)}</span>
                <button onClick={() => setSemester(s => shiftSemester(s, 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-[14px]">▶</button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <div className="flex" style={{ minWidth: 600 }}>
                    {/* Time column */}
                    <div className="flex-shrink-0 w-[52px] border-r border-slate-200">
                        <div className="h-[32px] border-b border-slate-200" />
                        {Array.from({ length: SLOT_COUNT }, (_, i) => (
                            <div key={i} className="border-b border-slate-100 flex items-center justify-end pr-2 text-[11px] text-slate-400" style={{ height: CELL_H }}>
                                {i % 2 === 0 ? slotToTime(i) : ""}
                            </div>
                        ))}
                    </div>
                    {/* Day columns */}
                    {DAY_LABELS.map((label, dayIdx) => {
                        const dayBlocks = filteredBlocks.filter(b => b.day === dayIdx);
                        return (
                            <div key={dayIdx} className="flex-1 border-r border-slate-200 last:border-r-0 relative select-none">
                                <div className="h-[32px] border-b border-slate-200 flex items-center justify-center text-[14px] font-bold text-slate-700 bg-slate-50">{label}</div>
                                <div className="relative" style={{ height: SLOT_COUNT * CELL_H }}>
                                    {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => (
                                        <div key={slotIdx}
                                            className={`absolute w-full border-b ${slotIdx % 2 === 1 ? "border-slate-200" : "border-slate-100"} ${isInDrag(dayIdx, slotIdx) ? "bg-blue-100" : ""}`}
                                            style={{ top: slotIdx * CELL_H, height: CELL_H }}
                                            onMouseDown={e => { e.preventDefault(); isDragging.current = true; setDragDay(dayIdx); setDragStart(slotIdx); setDragEnd(slotIdx); }}
                                            onMouseEnter={() => { if (isDragging.current && dragDay === dayIdx) setDragEnd(slotIdx); }}
                                        />
                                    ))}
                                    {dayBlocks.map(b => (
                                        <div key={b.id}
                                            className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-white text-[11px] font-medium leading-tight overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10"
                                            style={{ top: b.startSlot * CELL_H + 1, height: (b.endSlot - b.startSlot) * CELL_H - 2, background: b.color }}
                                            onClick={() => { setEditBlock(b); setFormName(b.name); setFormStudents(b.students); }}>
                                            <div className="truncate font-semibold">{b.name}</div>
                                            {(b.endSlot - b.startSlot) >= 2 && <div className="text-[11px] opacity-80">{slotToTime(b.startSlot)}-{slotToTime(b.endSlot)}</div>}
                                            {(b.endSlot - b.startSlot) >= 4 && b.students.length > 0 && <div className="text-[11px] opacity-70 mt-0.5 truncate">{b.students.join(", ")}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {filteredBlocks.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-[13px]">{semesterLabel(semester)}에 등록된 수업이 없습니다</div>
            )}
            {/* Form Modal */}
            {(showForm || editBlock) && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setShowForm(null); setEditBlock(null); }}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[14px] mb-1" style={{fontWeight:650, color:"#334155"}}>{editBlock ? "수업 수정" : "수업 추가"}</h4>
                        <p className="text-[12px] text-slate-400 mb-3">
                            {semesterLabel(semester)} · {DAY_LABELS[showForm?.day ?? editBlock?.day ?? 0]} {slotToTime(showForm?.start ?? editBlock?.startSlot ?? 0)} ~ {slotToTime(showForm?.end ?? editBlock?.endSlot ?? 0)}
                        </p>
                        <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="수업 이름" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">수강생</label>
                        <PillSelect options={MEMBER_NAMES} selected={formStudents} onToggle={v => setFormStudents(toggleArr(formStudents, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        <div className="flex items-center justify-between mt-4">
                            <div>{editBlock && <button onClick={() => { onDelete(editBlock.id); setEditBlock(null); }} className="text-[13px] text-red-500">삭제</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={() => { setShowForm(null); setEditBlock(null); }} className="px-3 py-1.5 text-[13px] text-slate-500">취소</button>
                                <button onClick={handleSaveForm} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export { TimetableView };
