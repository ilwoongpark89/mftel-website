"use client";

import { useState, useEffect, useRef, memo, useMemo } from "react";
import type { TimetableBlock } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, TIMETABLE_COLORS, DAY_LABELS, SLOT_COUNT, slotToTime } from "../lib/constants";
import { genId, toggleArr } from "../lib/utils";
import { PillSelect } from "./shared";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function timeToSlot(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return (h - 9) * 2 + (m >= 30 ? 1 : 0);
}

function studentSummary(students: string[]): string {
    if (students.length === 0) return "";
    if (students.length === 1) return students[0];
    return `${students[0]} 외 ${students.length - 1}명`;
}

// Generate time options from 9:00 to 21:00 in 30-minute intervals
const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 21; h++) {
    TIME_OPTIONS.push(`${h}:00`);
    if (h < 21) TIME_OPTIONS.push(`${h}:30`);
}

// Color picker colors for timetable blocks (lighter tones for background)
const BLOCK_COLORS = [
    { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },  // blue
    { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },  // red
    { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },  // amber
    { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },  // green
    { bg: "#EDE9FE", border: "#8B5CF6", text: "#5B21B6" },  // violet
    { bg: "#FCE7F3", border: "#EC4899", text: "#9D174D" },  // pink
    { bg: "#FFEDD5", border: "#F97316", text: "#9A3412" },  // orange
    { bg: "#CCFBF1", border: "#14B8A6", text: "#134E4A" },  // teal
];

// ─── Overlap Calculation (Google Calendar style) ──────────────────────────────

type OverlapInfo = { colIdx: number; totalCols: number };

function blocksOverlap(a: TimetableBlock, b: TimetableBlock): boolean {
    return a.startSlot < b.endSlot && b.startSlot < a.endSlot;
}

function computeOverlapLayout(dayBlocks: TimetableBlock[]): Map<number, OverlapInfo> {
    const result = new Map<number, OverlapInfo>();
    if (dayBlocks.length === 0) return result;

    // Build adjacency: find connected components of overlapping blocks
    const adj = new Map<number, Set<number>>();
    for (const b of dayBlocks) adj.set(b.id, new Set());

    for (let i = 0; i < dayBlocks.length; i++) {
        for (let j = i + 1; j < dayBlocks.length; j++) {
            if (blocksOverlap(dayBlocks[i], dayBlocks[j])) {
                adj.get(dayBlocks[i].id)!.add(dayBlocks[j].id);
                adj.get(dayBlocks[j].id)!.add(dayBlocks[i].id);
            }
        }
    }

    // Find connected components via BFS
    const visited = new Set<number>();
    const groups: TimetableBlock[][] = [];

    for (const b of dayBlocks) {
        if (visited.has(b.id)) continue;
        const group: TimetableBlock[] = [];
        const queue = [b.id];
        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (visited.has(cur)) continue;
            visited.add(cur);
            group.push(dayBlocks.find(x => x.id === cur)!);
            for (const neighbor of adj.get(cur)!) {
                if (!visited.has(neighbor)) queue.push(neighbor);
            }
        }
        groups.push(group);
    }

    // For each group, assign column indices using greedy coloring
    for (const group of groups) {
        if (group.length === 1) {
            result.set(group[0].id, { colIdx: 0, totalCols: 1 });
            continue;
        }

        // Sort by start time, then by end time desc (longer blocks first)
        const sorted = [...group].sort((a, b) => a.startSlot - b.startSlot || b.endSlot - a.endSlot);
        const colAssign = new Map<number, number>();
        let maxCol = 0;

        for (const block of sorted) {
            // Find the first available column (not used by overlapping blocks)
            const usedCols = new Set<number>();
            for (const other of sorted) {
                if (other.id === block.id) continue;
                if (colAssign.has(other.id) && blocksOverlap(block, other)) {
                    usedCols.add(colAssign.get(other.id)!);
                }
            }
            let col = 0;
            while (usedCols.has(col)) col++;
            colAssign.set(block.id, col);
            if (col > maxCol) maxCol = col;
        }

        const totalCols = maxCol + 1;
        for (const block of group) {
            result.set(block.id, { colIdx: colAssign.get(block.id)!, totalCols });
        }
    }

    return result;
}

// ─── Add Modal ───────────────────────────────────────────────────────────────

function AddTimetableModal({ semester, currentUser, onSave, onClose }: {
    semester: string;
    currentUser: string;
    onSave: (b: TimetableBlock) => void;
    onClose: () => void;
}) {
    const [formName, setFormName] = useState("");
    const [formDays, setFormDays] = useState<number[]>([]);
    const [formStart, setFormStart] = useState("9:00");
    const [formEnd, setFormEnd] = useState("10:30");
    const [formLocation, setFormLocation] = useState("");
    const [formStudents, setFormStudents] = useState<string[]>([]);
    const [formColorIdx, setFormColorIdx] = useState(0);

    const handleSave = () => {
        if (!formName.trim() || formDays.length === 0) return;
        const startSlot = timeToSlot(formStart);
        const endSlot = timeToSlot(formEnd);
        if (endSlot <= startSlot) return;

        const chosen = BLOCK_COLORS[formColorIdx];
        // Save with the border color as the main color identifier
        for (const day of formDays) {
            onSave({
                id: genId(),
                day,
                startSlot,
                endSlot,
                name: formName.trim(),
                students: formStudents,
                color: chosen.border,
                semester,
                location: formLocation.trim() || undefined,
                creator: currentUser,
            });
        }
        onClose();
    };

    // Filter end times to only show times after start
    const startSlotNum = timeToSlot(formStart);
    const validEndOptions = TIME_OPTIONS.filter(t => timeToSlot(t) > startSlotNum);

    // If current end is not valid, auto-fix
    useEffect(() => {
        if (timeToSlot(formEnd) <= startSlotNum) {
            const nextSlot = startSlotNum + 3; // default 1.5hr
            const h = 9 + Math.floor(nextSlot / 2);
            const m = nextSlot % 2 === 0 ? "00" : "30";
            if (h <= 21) setFormEnd(`${h}:${m}`);
            else setFormEnd("21:00");
        }
    }, [formStart, formEnd, startSlotNum]);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto modal-scroll" onClick={e => e.stopPropagation()}>
                <h4 className="text-[15px] mb-4" style={{ fontWeight: 650, color: "#334155" }}>시간표 추가</h4>

                {/* 수업 이름 */}
                <label className="text-[12px] font-semibold text-slate-500 block mb-1">수업 이름 *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="예: 열전달, 유체역학"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />

                {/* 요일 */}
                <label className="text-[12px] font-semibold text-slate-500 block mb-1">요일 *</label>
                <div className="flex gap-1.5 mb-3">
                    {DAY_LABELS.map((label, idx) => (
                        <button key={idx} type="button"
                            onClick={() => setFormDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all border ${formDays.includes(idx) ? "bg-blue-500 text-white border-blue-500" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* 시작/종료 시간 */}
                <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">시작 시간</label>
                        <select value={formStart} onChange={e => setFormStart(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                            {TIME_OPTIONS.filter(t => timeToSlot(t) < SLOT_COUNT).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">종료 시간</label>
                        <select value={formEnd} onChange={e => setFormEnd(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                            {validEndOptions.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 장소 */}
                <label className="text-[12px] font-semibold text-slate-500 block mb-1">장소</label>
                <input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="예: 2호관 301호"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />

                {/* 수강생 */}
                <label className="text-[12px] font-semibold text-slate-500 block mb-1">수강생</label>
                <div className="mb-3">
                    <PillSelect options={MEMBER_NAMES} selected={formStudents} onToggle={v => setFormStudents(toggleArr(formStudents, v))}
                        emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                </div>

                {/* 색상 */}
                <label className="text-[12px] font-semibold text-slate-500 block mb-1">색상</label>
                <div className="flex gap-2 mb-4">
                    {BLOCK_COLORS.map((c, i) => (
                        <button key={i} type="button" onClick={() => setFormColorIdx(i)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${formColorIdx === i ? "border-slate-700 scale-110 shadow-md" : "border-slate-200 hover:border-slate-300"}`}
                            style={{ background: c.bg, borderLeftColor: formColorIdx === i ? c.border : undefined, borderLeftWidth: formColorIdx === i ? 3 : undefined }}>
                            <div className="w-full h-full rounded-md" style={{ borderLeft: `3px solid ${c.border}` }} />
                        </button>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                    <button onClick={handleSave}
                        disabled={!formName.trim() || formDays.length === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">저장</button>
                </div>
            </div>
        </div>
    );
}

// ─── Detail Modal (view + edit) ──────────────────────────────────────────────

function BlockDetailModal({ block, semester, currentUser, onSave, onDelete, onClose }: {
    block: TimetableBlock;
    semester: string;
    currentUser: string;
    onSave: (b: TimetableBlock) => void;
    onDelete: (id: number) => void;
    onClose: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [formName, setFormName] = useState(block.name);
    const [formStart, setFormStart] = useState(slotToTime(block.startSlot));
    const [formEnd, setFormEnd] = useState(slotToTime(block.endSlot));
    const [formLocation, setFormLocation] = useState(block.location || "");
    const [formStudents, setFormStudents] = useState<string[]>(block.students);
    const [formColorIdx, setFormColorIdx] = useState(() => {
        const idx = BLOCK_COLORS.findIndex(c => c.border === block.color);
        return idx >= 0 ? idx : TIMETABLE_COLORS.indexOf(block.color) % BLOCK_COLORS.length;
    });

    const canEdit = currentUser === "박일웅" || currentUser === block.creator;

    const colorInfo = BLOCK_COLORS.find(c => c.border === block.color) || BLOCK_COLORS[0];

    const handleSave = () => {
        if (!formName.trim()) return;
        const startSlot = timeToSlot(formStart);
        const endSlot = timeToSlot(formEnd);
        if (endSlot <= startSlot) return;
        const chosen = BLOCK_COLORS[formColorIdx];
        onSave({
            ...block,
            name: formName.trim(),
            startSlot,
            endSlot,
            students: formStudents,
            color: chosen.border,
            location: formLocation.trim() || undefined,
        });
        onClose();
    };

    const handleDelete = () => {
        onDelete(block.id);
        onClose();
    };

    const startSlotNum = timeToSlot(formStart);
    const validEndOptions = TIME_OPTIONS.filter(t => timeToSlot(t) > startSlotNum);

    useEffect(() => {
        if (editing && timeToSlot(formEnd) <= startSlotNum) {
            const nextSlot = startSlotNum + 3;
            const h = 9 + Math.floor(nextSlot / 2);
            const m = nextSlot % 2 === 0 ? "00" : "30";
            if (h <= 21) setFormEnd(`${h}:${m}`);
            else setFormEnd("21:00");
        }
    }, [formStart, formEnd, startSlotNum, editing]);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto modal-scroll" onClick={e => e.stopPropagation()}>
                {!editing ? (
                    <>
                        {/* Read-only detail view */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-1.5 rounded-full self-stretch" style={{ background: block.color, minHeight: 40 }} />
                            <div className="flex-1">
                                <h4 className="text-[16px] mb-1" style={{ fontWeight: 650, color: "#334155" }}>{block.name}</h4>
                                <p className="text-[13px] text-slate-400">
                                    {semesterLabel(semester)} &middot; {DAY_LABELS[block.day]} {slotToTime(block.startSlot)} ~ {slotToTime(block.endSlot)}
                                </p>
                            </div>
                        </div>

                        {block.location && (
                            <div className="flex items-center gap-2 mb-2.5">
                                <span className="text-[14px]">📍</span>
                                <span className="text-[13px] text-slate-600">{block.location}</span>
                            </div>
                        )}

                        {block.students.length > 0 && (
                            <div className="mb-3">
                                <label className="text-[12px] font-semibold text-slate-400 block mb-1.5">수강생 ({block.students.length}명)</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {block.students.map(s => (
                                        <span key={s} className="px-2.5 py-1 rounded-full text-[12px] font-medium" style={{ background: colorInfo.bg, color: colorInfo.text }}>
                                            {MEMBERS[s]?.emoji} {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {block.creator && (
                            <div className="text-[11px] text-slate-300 mb-3">등록: {MEMBERS[block.creator]?.emoji} {block.creator}</div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            {canEdit ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setEditing(true)} className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">수정</button>
                                    <button onClick={handleDelete} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                </div>
                            ) : <div />}
                            <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Edit mode */}
                        <h4 className="text-[15px] mb-4" style={{ fontWeight: 650, color: "#334155" }}>수업 수정</h4>

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">수업 이름 *</label>
                        <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="수업 이름"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />

                        <div className="flex gap-3 mb-3">
                            <div className="flex-1">
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">시작 시간</label>
                                <select value={formStart} onChange={e => setFormStart(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                                    {TIME_OPTIONS.filter(t => timeToSlot(t) < SLOT_COUNT).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">종료 시간</label>
                                <select value={formEnd} onChange={e => setFormEnd(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                                    {validEndOptions.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">장소</label>
                        <input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="예: 2호관 301호"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">수강생</label>
                        <div className="mb-3">
                            <PillSelect options={MEMBER_NAMES} selected={formStudents} onToggle={v => setFormStudents(toggleArr(formStudents, v))}
                                emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        </div>

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">색상</label>
                        <div className="flex gap-2 mb-4">
                            {BLOCK_COLORS.map((c, i) => (
                                <button key={i} type="button" onClick={() => setFormColorIdx(i)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${formColorIdx === i ? "border-slate-700 scale-110 shadow-md" : "border-slate-200 hover:border-slate-300"}`}
                                    style={{ background: c.bg }}>
                                    <div className="w-full h-full rounded-md" style={{ borderLeft: `3px solid ${c.border}` }} />
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between">
                            <button onClick={handleDelete} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(false)} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} disabled={!formName.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">저장</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main TimetableView ──────────────────────────────────────────────────────

const TimetableView = memo(function TimetableView({ blocks, onSave, onDelete, currentUser }: {
    blocks: TimetableBlock[]; onSave: (b: TimetableBlock) => void; onDelete: (id: number) => void; currentUser: string;
}) {
    const isDragging = useRef(false);
    const [dragDay, setDragDay] = useState<number | null>(null);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDragForm, setShowDragForm] = useState<{ day: number; start: number; end: number } | null>(null);
    const [detailBlock, setDetailBlock] = useState<TimetableBlock | null>(null);
    const [semester, setSemester] = useState(getCurrentSemester);

    // Drag form state (for drag-created quick add)
    const [dragFormName, setDragFormName] = useState("");
    const [dragFormStudents, setDragFormStudents] = useState<string[]>([]);
    const [dragFormLocation, setDragFormLocation] = useState("");
    const [dragFormColorIdx, setDragFormColorIdx] = useState(0);

    const dragDayRef = useRef(dragDay); dragDayRef.current = dragDay;
    const dragStartRef = useRef(dragStart); dragStartRef.current = dragStart;
    const dragEndRef = useRef(dragEnd); dragEndRef.current = dragEnd;

    useEffect(() => {
        const up = () => {
            if (isDragging.current && dragDayRef.current !== null && dragStartRef.current !== null && dragEndRef.current !== null) {
                const s = Math.min(dragStartRef.current, dragEndRef.current);
                const e = Math.max(dragStartRef.current, dragEndRef.current) + 1;
                setShowDragForm({ day: dragDayRef.current, start: s, end: e });
                setDragFormName(""); setDragFormStudents([]); setDragFormLocation(""); setDragFormColorIdx(0);
            }
            isDragging.current = false; setDragDay(null); setDragStart(null); setDragEnd(null);
        };
        document.addEventListener("mouseup", up);
        return () => document.removeEventListener("mouseup", up);
    }, []);

    const CELL_H = 28;

    // Filter blocks by current semester
    const filteredBlocks = useMemo(() =>
        blocks.filter(b => (b.semester || getCurrentSemester()) === semester),
        [blocks, semester]
    );

    // Compute overlap layouts per day
    const overlapLayouts = useMemo(() => {
        const layouts = new Map<number, Map<number, OverlapInfo>>();
        for (let d = 0; d < 5; d++) {
            const dayBlocks = filteredBlocks.filter(b => b.day === d);
            layouts.set(d, computeOverlapLayout(dayBlocks));
        }
        return layouts;
    }, [filteredBlocks]);

    const handleDragFormSave = () => {
        if (!dragFormName.trim() || !showDragForm) return;
        const chosen = BLOCK_COLORS[dragFormColorIdx];
        onSave({
            id: genId(),
            day: showDragForm.day,
            startSlot: showDragForm.start,
            endSlot: showDragForm.end,
            name: dragFormName.trim(),
            students: dragFormStudents,
            color: chosen.border,
            semester,
            location: dragFormLocation.trim() || undefined,
            creator: currentUser,
        });
        setShowDragForm(null);
    };

    const isInDrag = (day: number, slot: number) => {
        if (dragDay !== day || dragStart === null || dragEnd === null) return false;
        const s = Math.min(dragStart, dragEnd);
        const e = Math.max(dragStart, dragEnd);
        return slot >= s && slot <= e;
    };

    // Resolve color info for a block
    const getColorInfo = (block: TimetableBlock) => {
        const found = BLOCK_COLORS.find(c => c.border === block.color);
        if (found) return found;
        // Fallback for old blocks that used TIMETABLE_COLORS directly
        return { bg: block.color + "20", border: block.color, text: "#FFFFFF" };
    };

    return (
        <div>
            {/* Header: Semester Navigation + Add Button */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex-1" />
                <div className="flex items-center gap-4">
                    <button onClick={() => setSemester(s => shiftSemester(s, -1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-[14px]">◀</button>
                    <span className="text-[15px] font-bold text-slate-700 min-w-[120px] text-center">{semesterLabel(semester)}</span>
                    <button onClick={() => setSemester(s => shiftSemester(s, 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-[14px]">▶</button>
                </div>
                <div className="flex-1 flex justify-end">
                    <button onClick={() => setShowAddModal(true)}
                        className="px-3.5 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors flex items-center gap-1.5">
                        <span className="text-[14px]">+</span> 시간표 추가
                    </button>
                </div>
            </div>

            {/* Timetable Grid */}
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
                        const dayLayout = overlapLayouts.get(dayIdx)!;

                        return (
                            <div key={dayIdx} className="flex-1 border-r border-slate-200 last:border-r-0 relative select-none">
                                <div className="h-[32px] border-b border-slate-200 flex items-center justify-center text-[14px] font-bold text-slate-700 bg-slate-50">{label}</div>
                                <div className="relative" style={{ height: SLOT_COUNT * CELL_H }}>
                                    {/* Grid lines */}
                                    {Array.from({ length: SLOT_COUNT }, (_, slotIdx) => (
                                        <div key={slotIdx}
                                            className={`absolute w-full border-b ${slotIdx % 2 === 1 ? "border-slate-200" : "border-slate-100"} ${isInDrag(dayIdx, slotIdx) ? "bg-blue-100" : ""}`}
                                            style={{ top: slotIdx * CELL_H, height: CELL_H }}
                                            onMouseDown={e => { e.preventDefault(); isDragging.current = true; setDragDay(dayIdx); setDragStart(slotIdx); setDragEnd(slotIdx); }}
                                            onMouseEnter={() => { if (isDragging.current && dragDay === dayIdx) setDragEnd(slotIdx); }}
                                        />
                                    ))}
                                    {/* Timetable blocks with overlap handling */}
                                    {dayBlocks.map(b => {
                                        const layout = dayLayout.get(b.id) || { colIdx: 0, totalCols: 1 };
                                        const colorInfo = getColorInfo(b);
                                        const blockHeight = (b.endSlot - b.startSlot) * CELL_H;
                                        const PAD = 2; // padding in px from edges

                                        return (
                                            <div key={b.id}
                                                className="absolute rounded-md overflow-hidden cursor-pointer hover:brightness-95 transition-all z-10"
                                                style={{
                                                    top: b.startSlot * CELL_H + 1,
                                                    height: blockHeight - 2,
                                                    left: `calc(${(layout.colIdx / layout.totalCols) * 100}% + ${PAD}px)`,
                                                    width: `calc(${(1 / layout.totalCols) * 100}% - ${PAD * 2}px)`,
                                                    background: colorInfo.bg,
                                                    borderLeft: `3px solid ${colorInfo.border}`,
                                                }}
                                                onClick={() => setDetailBlock(b)}>
                                                <div className="px-1.5 py-0.5 h-full flex flex-col justify-start overflow-hidden">
                                                    <div className="truncate text-[11px] font-semibold" style={{ color: colorInfo.text }}>{b.name}</div>
                                                    {blockHeight >= CELL_H * 2 && b.location && (
                                                        <div className="text-[10px] truncate" style={{ color: colorInfo.text, opacity: 0.7 }}>📍 {b.location}</div>
                                                    )}
                                                    {blockHeight >= CELL_H * 2 && !b.location && (
                                                        <div className="text-[10px] truncate" style={{ color: colorInfo.text, opacity: 0.7 }}>{slotToTime(b.startSlot)}-{slotToTime(b.endSlot)}</div>
                                                    )}
                                                    {blockHeight >= CELL_H * 3 && b.students.length > 0 && (
                                                        <div className="text-[10px] truncate mt-0.5" style={{ color: colorInfo.text, opacity: 0.6 }}>{studentSummary(b.students)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {filteredBlocks.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-[13px]">{semesterLabel(semester)}에 등록된 수업이 없습니다</div>
            )}

            {/* Add Modal (button-triggered) */}
            {showAddModal && (
                <AddTimetableModal semester={semester} currentUser={currentUser} onSave={onSave} onClose={() => setShowAddModal(false)} />
            )}

            {/* Drag-created Quick Add Form */}
            {showDragForm && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setShowDragForm(null)}>
                    <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto modal-scroll" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[15px] mb-1" style={{ fontWeight: 650, color: "#334155" }}>수업 추가</h4>
                        <p className="text-[12px] text-slate-400 mb-3">
                            {semesterLabel(semester)} &middot; {DAY_LABELS[showDragForm.day]} {slotToTime(showDragForm.start)} ~ {slotToTime(showDragForm.end)}
                        </p>

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">수업 이름 *</label>
                        <input value={dragFormName} onChange={e => setDragFormName(e.target.value)} placeholder="예: 열전달, 유체역학"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">장소</label>
                        <input value={dragFormLocation} onChange={e => setDragFormLocation(e.target.value)} placeholder="예: 2호관 301호"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">수강생</label>
                        <div className="mb-3">
                            <PillSelect options={MEMBER_NAMES} selected={dragFormStudents} onToggle={v => setDragFormStudents(toggleArr(dragFormStudents, v))}
                                emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        </div>

                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">색상</label>
                        <div className="flex gap-2 mb-4">
                            {BLOCK_COLORS.map((c, i) => (
                                <button key={i} type="button" onClick={() => setDragFormColorIdx(i)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${dragFormColorIdx === i ? "border-slate-700 scale-110 shadow-md" : "border-slate-200 hover:border-slate-300"}`}
                                    style={{ background: c.bg }}>
                                    <div className="w-full h-full rounded-md" style={{ borderLeft: `3px solid ${c.border}` }} />
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setShowDragForm(null)} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={handleDragFormSave} disabled={!dragFormName.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detailBlock && (
                <BlockDetailModal
                    block={detailBlock}
                    semester={semester}
                    currentUser={currentUser}
                    onSave={onSave}
                    onDelete={onDelete}
                    onClose={() => setDetailBlock(null)}
                />
            )}
        </div>
    );
});

export { TimetableView };
