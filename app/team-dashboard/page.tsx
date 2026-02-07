"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const MEMBERS: Record<string, { team: string; role: string; emoji: string }> = {
    "박일웅": { team: "PI", role: "교수", emoji: "👨‍🏫" },
    "용현진": { team: "액침냉각", role: "팀장", emoji: "💧" },
    "양재혁": { team: "시스템코드", role: "", emoji: "⚙️" },
    "송준범": { team: "TES", role: "팀장", emoji: "🔥" },
    "송상민": { team: "액침냉각", role: "", emoji: "🧪" },
    "김성진": { team: "액침냉각", role: "", emoji: "🔬" },
    "신현근": { team: "이상유동", role: "팀장", emoji: "🌊" },
    "고경주": { team: "시스템코드", role: "", emoji: "📐" },
    "김채연": { team: "액침냉각", role: "", emoji: "❄️" },
    "박은빈": { team: "이상유동", role: "", emoji: "🔄" },
    "김만호": { team: "액침냉각", role: "", emoji: "💻" },
    "정영준": { team: "액침냉각", role: "", emoji: "📊" },
    "현준환": { team: "TES", role: "", emoji: "🌡️" },
};
const MEMBER_NAMES = Object.keys(MEMBERS).filter(k => k !== "박일웅");

type TeamData = { lead: string; members: string[]; color: string };

const DEFAULT_TEAMS: Record<string, TeamData> = {
    "이상유동": { lead: "신현근", members: ["신현근", "박은빈"], color: "#3b82f6" },
    "액침냉각": { lead: "용현진", members: ["용현진", "양재혁", "김성진", "김채연", "정영준", "송상민", "김만호"], color: "#ef4444" },
    "TES": { lead: "송준범", members: ["송준범", "고경주", "현준환"], color: "#f59e0b" },
    "시스템코드": { lead: "양재혁", members: ["양재혁", "고경주", "김만호"], color: "#8b5cf6" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#94a3b8" },
    experiment: { label: "실험", color: "#3b82f6" },
    analysis: { label: "해석", color: "#8b5cf6" },
    writing: { label: "작성중", color: "#f59e0b" },
    under_review: { label: "심사중", color: "#10b981" },
};
const STATUS_KEYS = ["planning", "experiment", "analysis", "writing", "under_review"];
const PAPER_TAGS = ["안전예타", "생애첫", "TES", "액침냉각", "이상유동", "시스템코드", "NTNU", "PCM", "기타"];

const REPORT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#94a3b8" },
    writing: { label: "작성중", color: "#f59e0b" },
    review: { label: "심사중", color: "#3b82f6" },
    done: { label: "완료", color: "#059669" },
};
const REPORT_STATUS_KEYS = ["planning", "writing", "review", "done"];
const PRIORITY_ICON: Record<string, string> = { highest: "🔥", high: "🔴", mid: "🟡", low: "🔵", lowest: "⚪" };
const PRIORITY_LABEL: Record<string, string> = { highest: "매우높음", high: "높음", mid: "중간", low: "낮음", lowest: "매우낮음" };
const PRIORITY_KEYS = ["highest", "high", "mid", "low", "lowest"];

const DEFAULT_EQUIPMENT = ["액침냉각", "이상유동", "예연소실", "라이덴프로스트", "모래배터리", "기타"];
const EXP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#94a3b8" },
    preparing: { label: "준비중", color: "#8b5cf6" },
    running: { label: "진행중", color: "#3b82f6" },
    paused: { label: "중단", color: "#f59e0b" },
    completed: { label: "완료", color: "#059669" },
};
const EXP_STATUS_KEYS = ["planning", "preparing", "running", "paused", "completed"];

const CALENDAR_TYPES: Record<string, { label: string; color: string; short: string }> = {
    conference: { label: "학회", color: "#3b82f6", short: "학" },
    trip: { label: "출장", color: "#2563eb", short: "출" },
    seminar: { label: "세미나", color: "#0ea5e9", short: "세" },
    dispatch: { label: "파견", color: "#6366f1", short: "파" },
    other: { label: "기타", color: "#94a3b8", short: "기" },
    vacation: { label: "휴가", color: "#ef4444", short: "휴" },
    wfh: { label: "재택", color: "#f97316", short: "재" },
};

const TIMETABLE_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#6366f1", "#84cc16"];
const DAY_LABELS = ["월", "화", "수", "목", "금"];
const SLOT_COUNT = 24; // 9:00 ~ 21:00, 30min each
function slotToTime(slot: number) {
    const h = 9 + Math.floor(slot / 2);
    const m = slot % 2 === 0 ? "00" : "30";
    return `${h}:${m}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Comment = { id: number; author: string; text: string; date: string };
type Paper = { id: number; title: string; journal: string; status: string; assignees: string[]; tags: string[]; deadline: string; progress: number; comments: Comment[]; creator?: string; createdAt?: string; needsDiscussion?: boolean };
type Todo = { id: number; text: string; assignees: string[]; done: boolean; priority: string; deadline: string; progress?: number; needsDiscussion?: boolean };
type ExperimentLog = { id: number; date: string; author: string; text: string };
type Experiment = { id: number; title: string; equipment: string; status: string; assignees: string[]; goal: string; startDate: string; endDate: string; logs: ExperimentLog[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean };
type Announcement = { id: number; text: string; author: string; date: string; pinned: boolean };
type VacationEntry = { name: string; date: string; type: string };
type ScheduleEvent = { name: string; date: string; type: string; description: string };
type TimetableBlock = { id: number; day: number; startSlot: number; endSlot: number; name: string; students: string[]; color: string };
type ChecklistItem = { id: number; text: string; done: boolean };
type Report = { id: number; title: string; assignees: string[]; creator: string; deadline: string; progress: number; comments: Comment[]; status: string; createdAt: string; checklist: ChecklistItem[]; category?: string; needsDiscussion?: boolean };
type DailyTarget = { name: string; date: string; text: string };
type Resource = { id: number; title: string; link: string; nasPath: string; author: string; date: string; comments: Comment[]; needsDiscussion?: boolean };
type IdeaPost = { id: number; title: string; body: string; author: string; date: string; comments: Comment[]; needsDiscussion?: boolean };
type Memo = { id: number; title: string; content: string; color: string; updatedAt: string };

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PAPERS: Paper[] = [];
const DEFAULT_TODOS: Todo[] = [];
const DEFAULT_EXPERIMENTS: Experiment[] = [];
const IP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#94a3b8" },
    writing: { label: "작성중", color: "#f59e0b" },
    evaluation: { label: "평가중", color: "#3b82f6" },
    filed: { label: "출원", color: "#059669" },
};
const IP_STATUS_KEYS = ["planning", "writing", "evaluation", "filed"];

const ANALYSIS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#94a3b8" },
    preparing: { label: "준비중", color: "#8b5cf6" },
    running: { label: "진행중", color: "#3b82f6" },
    paused: { label: "중단", color: "#f59e0b" },
    completed: { label: "완료", color: "#059669" },
};
const ANALYSIS_STATUS_KEYS = ["planning", "preparing", "running", "paused", "completed"];
const ANALYSIS_TOOLS = ["OpenFOAM", "ANSYS Fluent", "STAR-CCM+", "MARS-K", "CUPID", "GAMMA+", "Python/MATLAB", "기타"];

type Patent = { id: number; title: string; deadline: string; status: string; assignees: string[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean };
type AnalysisLog = { id: number; date: string; author: string; text: string };
type Analysis = { id: number; title: string; tool: string; status: string; assignees: string[]; goal: string; startDate: string; endDate: string; logs: AnalysisLog[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean };

const DEFAULT_PATENTS: Patent[] = [
    { id: 1, title: "액침냉각 30도 각도 CHF 증진 활용", deadline: "12/31", status: "writing", assignees: [] },
    { id: 2, title: "메탈폼 + 배향각 활용", deadline: "12/31", status: "writing", assignees: [] },
    { id: 3, title: "카르노배터리 ORC 적용 열에너지 저장시스템", deadline: "12/31", status: "writing", assignees: [] },
    { id: 4, title: "TES + 그라파이트", deadline: "TBD", status: "planning", assignees: ["송준범"] },
];
const DEFAULT_TIMETABLE: TimetableBlock[] = [
    { id: 1, day: 0, startSlot: 9, endSlot: 12, name: "수치해석", students: [], color: "#3b82f6" },
    { id: 2, day: 1, startSlot: 9, endSlot: 12, name: "수치해석", students: [], color: "#3b82f6" },
    { id: 3, day: 0, startSlot: 12, endSlot: 15, name: "열전달", students: [], color: "#ef4444" },
    { id: 4, day: 1, startSlot: 12, endSlot: 15, name: "열전달", students: [], color: "#ef4444" },
    { id: 5, day: 0, startSlot: 15, endSlot: 18, name: "열전달", students: [], color: "#f59e0b" },
    { id: 6, day: 1, startSlot: 15, endSlot: 18, name: "열전달", students: [], color: "#f59e0b" },
    { id: 7, day: 0, startSlot: 18, endSlot: 24, name: "카르노배터리설계", students: ["고경주", "송준범", "용현진", "신현근"], color: "#8b5cf6" },
    { id: 8, day: 1, startSlot: 1, endSlot: 7, name: "저탄소플랜트", students: MEMBER_NAMES.filter(n => n !== "고경주"), color: "#10b981" },
    { id: 9, day: 1, startSlot: 18, endSlot: 24, name: "기계공학종합설계", students: [], color: "#f97316" },
    { id: 10, day: 2, startSlot: 0, endSlot: 6, name: "지능재료 및 MEMS", students: ["송상민"], color: "#14b8a6" },
    { id: 11, day: 4, startSlot: 8, endSlot: 13, name: "파워트레인공학", students: ["고경주", "김채연"], color: "#6366f1" },
];

// ─── Shared: Multi-select pill helper ────────────────────────────────────────

function PillSelect({ options, selected, onToggle, emojis }: { options: string[]; selected: string[]; onToggle: (v: string) => void; emojis?: Record<string, string> }) {
    return (
        <div className="flex flex-wrap gap-1">
            {options.map(o => (
                <button key={o} type="button" onClick={() => onToggle(o)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${selected.includes(o) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {emojis?.[o] ? `${emojis[o]} ` : ""}{o}
                </button>
            ))}
        </div>
    );
}

// ─── Paper Components ────────────────────────────────────────────────────────

function PaperFormModal({ paper, onSave, onDelete, onClose, currentUser, tagList }: {
    paper: Paper | null; onSave: (p: Paper) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; tagList: string[];
}) {
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

    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ id: paper?.id || Date.now(), title, journal, status, assignees, tags, deadline, progress, comments, creator: paper?.creator || currentUser, createdAt: paper?.createdAt || new Date().toLocaleString("ko-KR") });
    };
    const addComment = () => {
        if (!newComment.trim()) return;
        setComments([...comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]);
        setNewComment("");
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "논문 수정" : "논문 등록"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">저널</label>
                            <input value={journal} onChange={e => setJournal(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">마감</label>
                            <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 12/31" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {STATUS_KEYS.map(s => (
                                <button key={s} type="button" onClick={() => setStatus(s)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                    style={status === s ? { background: STATUS_CONFIG[s].color } : undefined}>
                                    {STATUS_CONFIG[s].label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">참여자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">태그</label>
                        <PillSelect options={tagList} selected={tags} onToggle={v => setTags(toggleArr(tags, v))} />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">진행도 {progress}%</label>
                        <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))}
                            className="w-full accent-blue-500" />
                    </div>
                    {/* Comments */}
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[12px] text-slate-700 pr-4">{c.text}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <div className="text-[11px] text-slate-300 py-2">코멘트 없음</div>}
                        </div>
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addComment()} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] hover:bg-slate-200">전송</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>
                        {isEdit && onDelete && (
                            <button onClick={() => { onDelete(paper!.id); onClose(); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { handleSave(); onClose(); }} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KanbanView({ papers, filter, onClickPaper, onAddPaper, onSavePaper, tagList, onSaveTags }: { papers: Paper[]; filter: string; onClickPaper: (p: Paper) => void; onAddPaper: () => void; onSavePaper: (p: Paper) => void; tagList: string[]; onSaveTags: (list: string[]) => void }) {
    const filtered = filter === "전체" ? papers : papers.filter(p => p.assignees.includes(filter) || p.tags.some(t => t === filter));
    const [showTagMgr, setShowTagMgr] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);
    const dragItem = useRef<Paper | null>(null);
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <button onClick={onAddPaper} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors">+ 논문 등록</button>
                <button onClick={() => setShowTagMgr(!showTagMgr)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">🏷️ 논문 태그 관리</button>
            </div>
            {showTagMgr && (
                <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[12px] font-semibold text-slate-600 mb-2">논문 태그 목록</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {tagList.map(t => (
                            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-700">
                                {t}
                                <button onClick={() => onSaveTags(tagList.filter(x => x !== t))} className="text-slate-400 hover:text-red-500 text-[10px]">✕</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="새 태그"
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={e => { if (e.key === "Enter" && newTag.trim() && !tagList.includes(newTag.trim())) { onSaveTags([...tagList, newTag.trim()]); setNewTag(""); } }} />
                        <button onClick={() => { if (newTag.trim() && !tagList.includes(newTag.trim())) { onSaveTags([...tagList, newTag.trim()]); setNewTag(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[11px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            <div className="flex gap-3 pb-2">
                {STATUS_KEYS.map(status => {
                    const col = filtered.filter(p => p.status === status);
                    const st = STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDragOverCol(status); }}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={() => { if (dragItem.current && dragItem.current.status !== status) { onSavePaper({ ...dragItem.current, status }); } dragItem.current = null; setDragOverCol(null); }}>
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${st.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: st.color }} />
                                <span className="text-[13px] font-bold text-slate-800">{st.label}</span>
                                <span className="text-[11px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dragOverCol === status ? "bg-blue-50" : ""}`}>
                                {col.map(p => (
                                    <div key={p.id} draggable onDragStart={() => { dragItem.current = p; }} onClick={() => onClickPaper(p)}
                                        className={`bg-white rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow overflow-hidden ${p.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${st.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!p.needsDiscussion} onChange={() => onSavePaper({ ...p, needsDiscussion: !p.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[10px] font-medium ${p.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[13px] font-semibold text-slate-800 mb-1 leading-snug break-words overflow-hidden">{p.title}</div>
                                        {p.journal !== "TBD" && <div className="text-[11px] text-slate-500 italic mb-1 truncate">{p.journal}</div>}
                                        {p.progress > 0 && (
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                                <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${p.progress}%` }} />
                                            </div>
                                        )}
                                        <div className="flex gap-1 flex-wrap mb-1.5">
                                            {p.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t}</span>)}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {p.assignees.slice(0, 3).map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                                {p.assignees.length > 3 && <span className="text-[10px] text-slate-400">+{p.assignees.length - 3}</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {p.comments.length > 0 && <span className="text-[10px] text-slate-400">💬{p.comments.length}</span>}
                                                {p.deadline && <span className="text-[10px] text-red-500 font-semibold">~{p.deadline}</span>}
                                            </div>
                                        </div>
                                        {p.creator && <div className="text-[9px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
                                    </div>
                                ))}
                                {col.length === 0 && <div className="text-[11px] text-slate-300 text-center py-6">—</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Report Components ───────────────────────────────────────────────────────

function ReportFormModal({ report, initialCategory, onSave, onDelete, onClose, currentUser }: {
    report: Report | null; initialCategory?: string; onSave: (r: Report) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string;
}) {
    const isEdit = !!report;
    const [title, setTitle] = useState(report?.title || "");
    const [assignees, setAssignees] = useState<string[]>(report?.assignees || []);
    const [deadline, setDeadline] = useState(report?.deadline || "");
    const [status, setStatus] = useState(report?.status || "planning");
    const [checklist, setChecklist] = useState<ChecklistItem[]>(report?.checklist || []);
    const [newItem, setNewItem] = useState("");
    const [comments, setComments] = useState<Comment[]>(report?.comments || []);
    const [newComment, setNewComment] = useState("");
    const [category, setCategory] = useState(report?.category || initialCategory || "계획서");
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const doneCount = checklist.filter(c => c.done).length;
    const autoProgress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ id: report?.id || Date.now(), title, assignees, creator: report?.creator || currentUser, deadline, progress: autoProgress, comments, status, createdAt: report?.createdAt || new Date().toLocaleDateString("ko-KR"), checklist, category });
    };
    const addChecklistItem = () => {
        if (!newItem.trim()) return;
        setChecklist([...checklist, { id: Date.now(), text: newItem.trim(), done: false }]);
        setNewItem("");
    };
    const toggleChecklistItem = (id: number) => {
        setChecklist(checklist.map(c => c.id === id ? { ...c, done: !c.done } : c));
    };
    const removeChecklistItem = (id: number) => {
        setChecklist(checklist.filter(c => c.id !== id));
    };
    const addComment = () => {
        if (!newComment.trim()) return;
        setComments([...comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]);
        setNewComment("");
    };
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? `${report?.category || "계획서/보고서"} 수정` : `${category} 등록`}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">기한</label>
                            <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 3/15" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">상태</label>
                            <div className="flex gap-1">
                                {REPORT_STATUS_KEYS.map(s => {
                                    const cfg = REPORT_STATUS_CONFIG[s];
                                    return (
                                        <button key={s} type="button" onClick={() => setStatus(s)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                            style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    {/* Checklist */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-slate-500">체크리스트 ({doneCount}/{checklist.length})</label>
                            {checklist.length > 0 && <span className="text-[11px] font-semibold text-blue-500">{autoProgress}%</span>}
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
                                        {item.done && <span className="text-white text-[11px]">✓</span>}
                                    </button>
                                    <span className={`flex-1 text-[12px] ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>{item.text}</span>
                                    <button onClick={() => removeChecklistItem(item.id)}
                                        className="text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="할 일 추가..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addChecklistItem()} />
                            <button onClick={addChecklistItem} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] hover:bg-slate-200">추가</button>
                        </div>
                    </div>
                    {/* Comments */}
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[12px] text-slate-700 pr-4">{c.text}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <div className="text-[11px] text-slate-300 py-2">코멘트 없음</div>}
                        </div>
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addComment()} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] hover:bg-slate-200">전송</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(report!.id); onClose(); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { handleSave(); onClose(); }} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportView({ reports, currentUser, onSave, onDelete, onToggleDiscussion }: { reports: Report[]; currentUser: string; onSave: (r: Report) => void; onDelete: (id: number) => void; onToggleDiscussion: (r: Report) => void }) {
    const [editing, setEditing] = useState<Report | null>(null);
    const [addCategory, setAddCategory] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);
    const dragItem = useRef<Report | null>(null);
    return (
        <div>
            <div className="mb-3 flex gap-2">
                <button onClick={() => setAddCategory("계획서")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 계획서 등록</button>
                <button onClick={() => setAddCategory("보고서")} className="px-4 py-2 bg-violet-500 text-white rounded-lg text-[13px] font-medium hover:bg-violet-600">+ 보고서 등록</button>
            </div>
            <div className="flex gap-3 pb-2">
                {REPORT_STATUS_KEYS.map(status => {
                    const col = reports.filter(r => r.status === status);
                    const cfg = REPORT_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDragOverCol(status); }}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={() => { if (dragItem.current && dragItem.current.status !== status) { onSave({ ...dragItem.current, status }); } dragItem.current = null; setDragOverCol(null); }}>
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[13px] font-bold text-slate-800">{cfg.label}</span>
                                <span className="text-[11px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dragOverCol === status ? "bg-blue-50" : ""}`}>
                                {col.map(r => {
                                    const cl = r.checklist || [];
                                    const done = cl.filter(c => c.done).length;
                                    return (
                                        <div key={r.id} draggable onDragStart={() => { dragItem.current = r; }} onClick={() => setEditing(r)}
                                            className={`bg-white rounded-lg p-3 cursor-grab hover:shadow-md transition-shadow overflow-hidden ${r.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                            style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onToggleDiscussion(r)} className="w-3 h-3 accent-orange-500" />
                                                <span className={`text-[10px] font-medium ${r.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                            </label>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                {r.category && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{r.category}</span>}
                                                <span className="text-[13px] font-semibold text-slate-800 leading-snug break-words">{r.title}</span>
                                            </div>
                                            {cl.length > 0 && (
                                                <>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                            <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${r.progress}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-blue-500">{done}/{cl.length}</span>
                                                    </div>
                                                    <div className="space-y-0.5 mb-1.5">
                                                        {cl.slice(0, 3).map(item => (
                                                            <div key={item.id} className="flex items-center gap-1.5 text-[10px]">
                                                                <span className={item.done ? "text-emerald-500" : "text-slate-300"}>{item.done ? "✓" : "○"}</span>
                                                                <span className={`truncate ${item.done ? "line-through text-slate-400" : "text-slate-600"}`}>{item.text}</span>
                                                            </div>
                                                        ))}
                                                        {cl.length > 3 && <div className="text-[9px] text-slate-400 pl-4">+{cl.length - 3}개 더</div>}
                                                    </div>
                                                </>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-1 flex-wrap">
                                                    {r.assignees.slice(0, 3).map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                                    {r.assignees.length > 3 && <span className="text-[10px] text-slate-400">+{r.assignees.length - 3}</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {r.comments.length > 0 && <span className="text-[10px] text-slate-400">💬{r.comments.length}</span>}
                                                    {r.deadline && <span className="text-[10px] text-red-500 font-semibold">~{r.deadline}</span>}
                                                </div>
                                            </div>
                                            {r.creator && <div className="text-[9px] text-slate-400 text-right mt-1">by {MEMBERS[r.creator]?.emoji || ""}{r.creator}{r.createdAt ? ` · ${r.createdAt}` : ""}</div>}
                                        </div>
                                    );
                                })}
                                {col.length === 0 && <div className="text-[11px] text-slate-300 text-center py-6">—</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            {addCategory && <ReportFormModal report={null} initialCategory={addCategory} onSave={r => { onSave(r); setAddCategory(null); }} onClose={() => setAddCategory(null)} currentUser={currentUser} />}
            {editing && <ReportFormModal report={editing} onSave={r => { onSave(r); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} />}
        </div>
    );
}

// ─── Vacation View ───────────────────────────────────────────────────────────

function CalendarGrid({ data, currentUser, types, onToggle, showYearTotal }: {
    data: Array<{ name: string; date: string; type: string; description?: string }>;
    currentUser: string;
    types: Record<string, { label: string; color: string; short: string }>;
    onToggle: (name: string, date: string, type: string | null, desc?: string) => void;
    showYearTotal?: boolean;
}) {
    const [month, setMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
    const [selType, setSelType] = useState(Object.keys(types)[0]);
    const [editCell, setEditCell] = useState<{ name: string; date: string } | null>(null);
    const [editDesc, setEditDesc] = useState("");
    // Drag selection state
    const [dragName, setDragName] = useState<string | null>(null);
    const [dragDates, setDragDates] = useState<string[]>([]);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const isDragging = useRef(false);

    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(month.y, month.m, i + 1);
        return { date: i + 1, dow: d.getDay(), str: `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}` };
    });
    const dayL = ["일", "월", "화", "수", "목", "금", "토"];
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();
    const monthDates = new Set(days.map(d => d.str));
    const getEntry = (name: string, dateStr: string) => data.find(v => v.name === name && v.date === dateStr);
    const countMonth = (name: string) => data.filter(v => v.name === name && monthDates.has(v.date)).length;
    const countYear = (name: string) => data.filter(v => v.name === name && v.date.startsWith(String(month.y))).length;

    const scheduleTypeKeys = Object.keys(types).filter(k => k !== "vacation" && k !== "wfh");

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <button onClick={() => setMonth(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { ...p, m: p.m - 1 })} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px]">◀</button>
                    <span className="text-[15px] font-bold text-slate-800 min-w-[120px] text-center">{month.y}년 {month.m + 1}월</span>
                    <button onClick={() => setMonth(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { ...p, m: p.m + 1 })} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px]">▶</button>
                    <button onClick={() => { const n = new Date(); setMonth({ y: n.getFullYear(), m: n.getMonth() }); }} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium hover:bg-slate-200 ml-1">오늘</button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 mr-1">유형:</span>
                    {Object.entries(types).map(([k, vt]) => (
                        <button key={k} onClick={() => setSelType(k)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${selType === k ? "text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            style={selType === k ? { background: vt.color } : undefined}>{vt.label}</button>
                    ))}
                </div>
            </div>
            <div className="flex gap-3 mb-3 flex-wrap items-center">
                {Object.entries(types).filter(([k]) => scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                    <div key={k} className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm" style={{ background: vt.color }} />
                        <span className="text-[10px] text-slate-500">{vt.label}</span>
                    </div>
                ))}
                <span className="text-slate-300 text-[10px]">|</span>
                {Object.entries(types).filter(([k]) => !scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                    <div key={k} className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm" style={{ background: vt.color }} />
                        <span className="text-[10px] text-slate-500">{vt.label}</span>
                    </div>
                ))}
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white" onMouseLeave={() => { if (isDragging.current) { isDragging.current = false; setDragName(null); setDragDates([]); setDragStart(null); } }}>
                <table className="w-full border-collapse" style={{ minWidth: daysInMonth * 36 + 180 }}>
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left text-[12px] font-semibold text-slate-600 min-w-[100px]">이름</th>
                            {days.map(d => {
                                const we = d.dow === 0 || d.dow === 6;
                                const td = d.str === todayStr;
                                return (
                                    <th key={d.date} className={`border-b border-slate-200 px-0 py-1.5 text-center min-w-[36px] ${td ? "bg-blue-50" : we ? "bg-slate-50/80" : "bg-white"}`}>
                                        <div className={`text-[10px] ${we ? (d.dow === 0 ? "text-red-400" : "text-blue-400") : "text-slate-400"}`}>{dayL[d.dow]}</div>
                                        <div className={`text-[12px] font-semibold ${td ? "text-blue-600" : we ? (d.dow === 0 ? "text-red-500" : "text-blue-500") : "text-slate-700"}`}>{d.date}</div>
                                    </th>
                                );
                            })}
                            <th className="border-b border-l border-slate-200 px-2 py-1.5 text-center bg-slate-50 min-w-[36px]"><div className="text-[10px] text-slate-400">월</div></th>
                            {showYearTotal && <th className="border-b border-l border-slate-200 px-2 py-1.5 text-center bg-slate-50 min-w-[36px]"><div className="text-[10px] text-slate-400">연</div></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {MEMBER_NAMES.map(name => {
                            const isMe = name === currentUser;
                            return (
                                <tr key={name} className={`${isMe ? "bg-blue-50/30" : ""} hover:bg-slate-50/50`}>
                                    <td className={`sticky left-0 z-10 border-r border-b border-slate-100 px-3 py-1.5 text-[12px] whitespace-nowrap ${isMe ? "bg-blue-50 font-semibold text-slate-800" : "bg-white text-slate-600"}`}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </td>
                                    {days.map((d, di) => {
                                        const entry = getEntry(name, d.str);
                                        const we = d.dow === 0 || d.dow === 6;
                                        const td = d.str === todayStr;
                                        const vt = entry ? types[entry.type] : null;
                                        const inDrag = dragName === name && dragDates.includes(d.str);
                                        return (
                                            <td key={d.date}
                                                className={`border-b border-slate-100 text-center p-0 select-none ${td ? "bg-blue-50/50" : we ? "bg-slate-50/50" : ""} ${isMe ? "cursor-pointer" : ""} ${inDrag ? "bg-blue-100" : ""}`}
                                                onMouseDown={() => {
                                                    if (!isMe) return;
                                                    if (entry) { onToggle(name, d.str, null); return; }
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
                                                    <div className="mx-auto w-[28px] h-[24px] rounded flex items-center justify-center text-[10px] font-bold text-white hover:scale-110 transition-transform"
                                                        style={{ background: vt.color }} title={entry?.description || vt.label}>{vt.short}</div>
                                                ) : isMe ? (
                                                    <div className={`mx-auto w-[28px] h-[24px] rounded flex items-center justify-center ${inDrag ? "bg-blue-200" : "opacity-0 hover:opacity-100 bg-slate-100"} transition-opacity`}>
                                                        <span className="text-[10px] text-slate-300">+</span>
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                    <td className="border-b border-l border-slate-100 text-center px-2 py-1.5">
                                        <span className={`text-[12px] font-semibold ${countMonth(name) > 0 ? "text-blue-600" : "text-slate-300"}`}>{countMonth(name) || "-"}</span>
                                    </td>
                                    {showYearTotal && (
                                        <td className="border-b border-l border-slate-100 text-center px-2 py-1.5">
                                            <span className={`text-[12px] font-semibold ${countYear(name) > 0 ? "text-violet-600" : "text-slate-300"}`}>{countYear(name) || "-"}</span>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Inline event form for schedule mode */}
            {editCell && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditCell(null)}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[14px] font-bold text-slate-800 mb-3">{editCell.date.includes(",") ? `${editCell.date.split(",").length}일 추가` : `${editCell.date} 추가`}</h4>
                        <div className="mb-3">
                            <div className="flex flex-wrap gap-1 mb-1">
                                {Object.entries(types).filter(([k]) => scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                                    <button key={k} onClick={() => setSelType(k)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${selType === k ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={selType === k ? { background: vt.color } : undefined}>{vt.label}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(types).filter(([k]) => !scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                                    <button key={k} onClick={() => setSelType(k)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${selType === k ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={selType === k ? { background: vt.color } : undefined}>{vt.label}</button>
                                ))}
                            </div>
                        </div>
                        {scheduleTypeKeys.includes(selType) && <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="내용 (예: NUTHOS 발표)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditCell(null)} className="px-3 py-1.5 text-[12px] text-slate-500">취소</button>
                            <button onClick={() => { onToggle(editCell.name, editCell.date, selType, editDesc); setEditCell(null); }}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium">추가</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Today summary */}
            {(() => {
                const today = data.filter(v => v.date === todayStr);
                if (today.length === 0) return null;
                return (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-[12px] font-semibold text-amber-700 mb-1">📋 오늘</div>
                        <div className="flex gap-2 flex-wrap">
                            {today.map(v => {
                                const vt = types[v.type];
                                return <span key={v.name} className="text-[12px] px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800">{MEMBERS[v.name]?.emoji}{v.name} ({vt?.label}{v.description ? `: ${v.description}` : ""})</span>;
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

// ─── Timetable View ──────────────────────────────────────────────────────────

function TimetableView({ blocks, onSave, onDelete }: {
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
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    useEffect(() => {
        const up = () => {
            if (isDragging.current && dragDay !== null && dragStart !== null && dragEnd !== null) {
                const s = Math.min(dragStart, dragEnd);
                const e = Math.max(dragStart, dragEnd) + 1;
                setShowForm({ day: dragDay, start: s, end: e });
                setFormName(""); setFormStudents([]);
            }
            isDragging.current = false; setDragDay(null); setDragStart(null); setDragEnd(null);
        };
        document.addEventListener("mouseup", up);
        return () => document.removeEventListener("mouseup", up);
    }, [dragDay, dragStart, dragEnd]);

    const CELL_H = 28;

    const handleSaveForm = () => {
        if (!formName.trim()) return;
        const color = TIMETABLE_COLORS[blocks.length % TIMETABLE_COLORS.length];
        if (showForm) {
            onSave({ id: Date.now(), day: showForm.day, startSlot: showForm.start, endSlot: showForm.end, name: formName, students: formStudents, color });
            setShowForm(null);
        }
        if (editBlock) {
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
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <div className="flex" style={{ minWidth: 600 }}>
                    {/* Time column */}
                    <div className="flex-shrink-0 w-[52px] border-r border-slate-200">
                        <div className="h-[32px] border-b border-slate-200" />
                        {Array.from({ length: SLOT_COUNT }, (_, i) => (
                            <div key={i} className="border-b border-slate-100 flex items-center justify-end pr-2 text-[10px] text-slate-400" style={{ height: CELL_H }}>
                                {i % 2 === 0 ? slotToTime(i) : ""}
                            </div>
                        ))}
                    </div>
                    {/* Day columns */}
                    {DAY_LABELS.map((label, dayIdx) => {
                        const dayBlocks = blocks.filter(b => b.day === dayIdx);
                        return (
                            <div key={dayIdx} className="flex-1 border-r border-slate-200 last:border-r-0 relative select-none">
                                <div className="h-[32px] border-b border-slate-200 flex items-center justify-center text-[13px] font-bold text-slate-700 bg-slate-50">{label}</div>
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
                                    {/* Blocks */}
                                    {dayBlocks.map(b => (
                                        <div key={b.id}
                                            className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-white text-[10px] font-medium leading-tight overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10"
                                            style={{ top: b.startSlot * CELL_H + 1, height: (b.endSlot - b.startSlot) * CELL_H - 2, background: b.color }}
                                            onClick={() => { setEditBlock(b); setFormName(b.name); setFormStudents(b.students); }}>
                                            <div className="truncate font-semibold">{b.name}</div>
                                            {(b.endSlot - b.startSlot) >= 2 && <div className="text-[9px] opacity-80">{slotToTime(b.startSlot)}-{slotToTime(b.endSlot)}</div>}
                                            {(b.endSlot - b.startSlot) >= 4 && b.students.length > 0 && <div className="text-[9px] opacity-70 mt-0.5 truncate">{b.students.join(", ")}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Form Modal */}
            {(showForm || editBlock) && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => { setShowForm(null); setEditBlock(null); }}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[14px] font-bold text-slate-800 mb-1">{editBlock ? "수업 수정" : "수업 추가"}</h4>
                        <p className="text-[11px] text-slate-400 mb-3">
                            {DAY_LABELS[showForm?.day ?? editBlock?.day ?? 0]} {slotToTime(showForm?.start ?? editBlock?.startSlot ?? 0)} ~ {slotToTime(showForm?.end ?? editBlock?.endSlot ?? 0)}
                        </p>
                        <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="수업 이름" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">수강생</label>
                        <PillSelect options={MEMBER_NAMES} selected={formStudents} onToggle={v => setFormStudents(toggleArr(formStudents, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                        <div className="flex items-center justify-between mt-4">
                            <div>{editBlock && <button onClick={() => { onDelete(editBlock.id); setEditBlock(null); }} className="text-[12px] text-red-500">삭제</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={() => { setShowForm(null); setEditBlock(null); }} className="px-3 py-1.5 text-[12px] text-slate-500">취소</button>
                                <button onClick={handleSaveForm} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Experiment Components ───────────────────────────────────────────────────

function ExperimentFormModal({ experiment, onSave, onDelete, onClose, currentUser, equipmentList }: {
    experiment: Experiment | null; onSave: (e: Experiment) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; equipmentList: string[];
}) {
    const isEdit = !!experiment;
    const [title, setTitle] = useState(experiment?.title || "");
    const [equipment, setEquipment] = useState(experiment?.equipment || equipmentList[0] || "");
    const [status, setStatus] = useState(experiment?.status || "preparing");
    const [assignees, setAssignees] = useState<string[]>(experiment?.assignees || []);
    const [goal, setGoal] = useState(experiment?.goal || "");
    const [startDate, setStartDate] = useState(experiment?.startDate || "");
    const [endDate, setEndDate] = useState(experiment?.endDate || "");
    const [logs, setLogs] = useState<ExperimentLog[]>(experiment?.logs || []);
    const [newLog, setNewLog] = useState("");
    const [progress, setProgress] = useState(experiment?.progress ?? 0);
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ id: experiment?.id || Date.now(), title, equipment, status, assignees, goal, startDate, endDate, logs, progress, creator: experiment?.creator || currentUser, createdAt: experiment?.createdAt || new Date().toLocaleString("ko-KR") });
    };
    const addLog = () => {
        if (!newLog.trim()) return;
        setLogs([{ id: Date.now(), date: new Date().toLocaleDateString("ko-KR"), author: currentUser, text: newLog.trim() }, ...logs]);
        setNewLog("");
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "실험 수정" : "실험 등록"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">실험 제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">실험 장치</label>
                        <div className="flex flex-wrap gap-1">
                            {equipmentList.map(eq => (
                                <button key={eq} type="button" onClick={() => setEquipment(eq)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${equipment === eq ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{eq}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">목표</label>
                        <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="실험 목표를 작성하세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">달성도 {progress}%</label>
                        <input type="range" min={0} max={100} step={5} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {EXP_STATUS_KEYS.map(s => {
                                const cfg = EXP_STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">시작일</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">종료일</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                    </div>
                    {/* Daily logs */}
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">실험 일지 ({logs.length})</label>
                        <div className="flex gap-2 mb-2">
                            <input value={newLog} onChange={e => setNewLog(e.target.value)} placeholder="오늘의 실험 내용을 기록하세요..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addLog()} />
                            <button onClick={addLog} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] hover:bg-slate-200">기록</button>
                        </div>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {logs.map(l => (
                                <div key={l.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setLogs(logs.filter(x => x.id !== l.id))}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[12px] text-slate-700 pr-4">{l.text}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{MEMBERS[l.author]?.emoji} {l.author} · {l.date}</div>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-[11px] text-slate-300 py-2">기록 없음</div>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(experiment!.id); onClose(); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { handleSave(); onClose(); }} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExperimentView({ experiments, onSave, onDelete, currentUser, equipmentList, onSaveEquipment, onToggleDiscussion }: { experiments: Experiment[]; onSave: (e: Experiment) => void; onDelete: (id: number) => void; currentUser: string; equipmentList: string[]; onSaveEquipment: (list: string[]) => void; onToggleDiscussion: (e: Experiment) => void }) {
    const [editing, setEditing] = useState<Experiment | null>(null);
    const [adding, setAdding] = useState(false);
    const [showEqMgr, setShowEqMgr] = useState(false);
    const [newEq, setNewEq] = useState("");
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <button onClick={() => setAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 실험 등록</button>
                <button onClick={() => setShowEqMgr(!showEqMgr)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">🔧 실험 장치 관리</button>
            </div>
            {showEqMgr && (
                <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[12px] font-semibold text-slate-600 mb-2">실험 장치 목록</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {equipmentList.map(eq => (
                            <span key={eq} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-700">
                                {eq}
                                <button onClick={() => onSaveEquipment(equipmentList.filter(e => e !== eq))} className="text-slate-400 hover:text-red-500 text-[10px]">✕</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newEq} onChange={e => setNewEq(e.target.value)} placeholder="새 장치 이름"
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={e => { if (e.key === "Enter" && newEq.trim() && !equipmentList.includes(newEq.trim())) { onSaveEquipment([...equipmentList, newEq.trim()]); setNewEq(""); } }} />
                        <button onClick={() => { if (newEq.trim() && !equipmentList.includes(newEq.trim())) { onSaveEquipment([...equipmentList, newEq.trim()]); setNewEq(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[11px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            <div className="flex gap-3 pb-2">
                {EXP_STATUS_KEYS.map(status => {
                    const col = experiments.filter(e => e.status === status);
                    const cfg = EXP_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[13px] font-bold text-slate-800">{cfg.label}</span>
                                <span className="text-[11px] text-slate-400">{col.length}</span>
                            </div>
                            <div className="min-h-[80px] space-y-2">
                                {col.map(exp => (
                                    <div key={exp.id} onClick={() => setEditing(exp)}
                                        className={`bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${exp.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!exp.needsDiscussion} onChange={() => onToggleDiscussion(exp)} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[10px] font-medium ${exp.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[13px] font-semibold text-slate-800 mb-1 leading-snug break-words">{exp.title}</div>
                                        <div className="text-[10px] text-slate-500 mb-1">🔧 {exp.equipment}</div>
                                        {(exp.progress ?? 0) > 0 && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${exp.progress}%` }} /></div>
                                                <span className="text-[10px] font-semibold text-blue-500">{exp.progress}%</span>
                                            </div>
                                        )}
                                        {exp.goal && <div className="text-[10px] text-slate-400 mb-1.5 line-clamp-2">{exp.goal}</div>}
                                        {(exp.startDate || exp.endDate) && (
                                            <div className="text-[10px] text-slate-400 mb-1.5">📅 {exp.startDate} ~ {exp.endDate}</div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {exp.assignees.slice(0, 3).map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                                {exp.assignees.length > 3 && <span className="text-[10px] text-slate-400">+{exp.assignees.length - 3}</span>}
                                            </div>
                                            {exp.logs.length > 0 && <span className="text-[10px] text-slate-400">📝{exp.logs.length}</span>}
                                        </div>
                                        {exp.creator && <div className="text-[9px] text-slate-400 text-right mt-1">by {MEMBERS[exp.creator]?.emoji || ""}{exp.creator}{exp.createdAt ? ` · ${exp.createdAt}` : ""}</div>}
                                    </div>
                                ))}
                                {col.length === 0 && <div className="text-[11px] text-slate-300 text-center py-6">—</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            {adding && <ExperimentFormModal experiment={null} onSave={e => { onSave(e); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} equipmentList={equipmentList} />}
            {editing && <ExperimentFormModal experiment={editing} onSave={e => { onSave(e); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} equipmentList={equipmentList} />}
        </div>
    );
}

// ─── Analysis Components ────────────────────────────────────────────────────

function AnalysisFormModal({ analysis, onSave, onDelete, onClose, currentUser, toolList }: {
    analysis: Analysis | null; onSave: (a: Analysis) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; toolList: string[];
}) {
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
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ id: analysis?.id || Date.now(), title, tool, status, assignees, goal, startDate, endDate, logs, progress, creator: analysis?.creator || currentUser, createdAt: analysis?.createdAt || new Date().toLocaleString("ko-KR") });
    };
    const addLog = () => {
        if (!newLog.trim()) return;
        setLogs([{ id: Date.now(), date: new Date().toLocaleDateString("ko-KR"), author: currentUser, text: newLog.trim() }, ...logs]);
        setNewLog("");
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "해석 수정" : "해석 등록"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">해석 제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">해석 도구</label>
                        <div className="flex flex-wrap gap-1">
                            {toolList.map(t => (
                                <button key={t} type="button" onClick={() => setTool(t)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${tool === t ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">목표</label>
                        <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="해석 목표를 작성하세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">달성도 {progress}%</label>
                        <input type="range" min={0} max={100} step={5} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {ANALYSIS_STATUS_KEYS.map(s => {
                                const cfg = ANALYSIS_STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">시작일</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">종료일</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">해석 일지 ({logs.length})</label>
                        <div className="flex gap-2 mb-2">
                            <input value={newLog} onChange={e => setNewLog(e.target.value)} placeholder="오늘의 해석 내용을 기록하세요..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addLog()} />
                            <button onClick={addLog} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] hover:bg-slate-200">기록</button>
                        </div>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {logs.map(l => (
                                <div key={l.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setLogs(logs.filter(x => x.id !== l.id))}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[12px] text-slate-700 pr-4">{l.text}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{MEMBERS[l.author]?.emoji} {l.author} · {l.date}</div>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="text-[11px] text-slate-300 py-2">기록 없음</div>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(analysis!.id); onClose(); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { handleSave(); onClose(); }} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalysisView({ analyses, onSave, onDelete, currentUser, toolList, onSaveTools, onToggleDiscussion }: { analyses: Analysis[]; onSave: (a: Analysis) => void; onDelete: (id: number) => void; currentUser: string; toolList: string[]; onSaveTools: (list: string[]) => void; onToggleDiscussion: (a: Analysis) => void }) {
    const [editing, setEditing] = useState<Analysis | null>(null);
    const [adding, setAdding] = useState(false);
    const [showToolMgr, setShowToolMgr] = useState(false);
    const [newTool, setNewTool] = useState("");
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <button onClick={() => setAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 해석 등록</button>
                <button onClick={() => setShowToolMgr(!showToolMgr)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">🔧 해석 도구 관리</button>
            </div>
            {showToolMgr && (
                <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[12px] font-semibold text-slate-600 mb-2">해석 도구 목록</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {toolList.map(t => (
                            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] text-slate-700">
                                {t}
                                <button onClick={() => onSaveTools(toolList.filter(x => x !== t))} className="text-slate-400 hover:text-red-500 text-[10px]">✕</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newTool} onChange={e => setNewTool(e.target.value)} placeholder="새 도구 이름"
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={e => { if (e.key === "Enter" && newTool.trim() && !toolList.includes(newTool.trim())) { onSaveTools([...toolList, newTool.trim()]); setNewTool(""); } }} />
                        <button onClick={() => { if (newTool.trim() && !toolList.includes(newTool.trim())) { onSaveTools([...toolList, newTool.trim()]); setNewTool(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[11px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            <div className="flex gap-3 pb-2">
                {ANALYSIS_STATUS_KEYS.map(status => {
                    const col = analyses.filter(a => a.status === status);
                    const cfg = ANALYSIS_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[13px] font-bold text-slate-800">{cfg.label}</span>
                                <span className="text-[11px] text-slate-400">{col.length}</span>
                            </div>
                            <div className="min-h-[80px] space-y-2">
                                {col.map(a => (
                                    <div key={a.id} onClick={() => setEditing(a)}
                                        className={`bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${a.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!a.needsDiscussion} onChange={() => onToggleDiscussion(a)} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[10px] font-medium ${a.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[13px] font-semibold text-slate-800 mb-1 leading-snug break-words">{a.title}</div>
                                        <div className="text-[10px] text-slate-500 mb-1">🖥️ {a.tool}</div>
                                        {(a.progress ?? 0) > 0 && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${a.progress}%` }} /></div>
                                                <span className="text-[10px] font-semibold text-blue-500">{a.progress}%</span>
                                            </div>
                                        )}
                                        {a.goal && <div className="text-[10px] text-slate-400 mb-1.5 line-clamp-2">{a.goal}</div>}
                                        {(a.startDate || a.endDate) && (
                                            <div className="text-[10px] text-slate-400 mb-1.5">📅 {a.startDate} ~ {a.endDate}</div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {a.assignees.slice(0, 3).map(n => <span key={n} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[n]?.emoji}{n}</span>)}
                                                {a.assignees.length > 3 && <span className="text-[10px] text-slate-400">+{a.assignees.length - 3}</span>}
                                            </div>
                                            {a.logs.length > 0 && <span className="text-[10px] text-slate-400">📝{a.logs.length}</span>}
                                        </div>
                                        {a.creator && <div className="text-[9px] text-slate-400 text-right mt-1">by {MEMBERS[a.creator]?.emoji || ""}{a.creator}{a.createdAt ? ` · ${a.createdAt}` : ""}</div>}
                                    </div>
                                ))}
                                {col.length === 0 && <div className="text-[11px] text-slate-300 text-center py-6">—</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            {adding && <AnalysisFormModal analysis={null} onSave={a => { onSave(a); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} toolList={toolList} />}
            {editing && <AnalysisFormModal analysis={editing} onSave={a => { onSave(a); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} toolList={toolList} />}
        </div>
    );
}

function TodoList({ todos, onToggle, onAdd, onUpdate, onDelete, currentUser }: { todos: Todo[]; onToggle: (id: number) => void; onAdd: (t: Todo) => void; onUpdate: (t: Todo) => void; onDelete: (id: number) => void; currentUser: string }) {
    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [newText, setNewText] = useState("");
    const [newAssignees, setNewAssignees] = useState<string[]>([]);
    const [newPriority, setNewPriority] = useState("mid");
    const [newDeadline, setNewDeadline] = useState("");
    const [newProgress, setNewProgress] = useState(0);
    const [filterPeople, setFilterPeople] = useState<string[]>([currentUser]);
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const filtered = filterPeople.length === 0 ? todos : todos.filter(t => t.assignees.some(a => filterPeople.includes(a)));
    const activeTodos = [...filtered].filter(t => !t.done).sort((a, b) => { const pr: Record<string, number> = { highest: 0, high: 1, mid: 2, low: 3, lowest: 4 }; return (pr[a.priority] ?? 2) - (pr[b.priority] ?? 2); });
    const completedTodos = filtered.filter(t => t.done);

    const handleAdd = () => {
        if (!newText.trim()) return;
        const assignees = newAssignees.length > 0 ? newAssignees : [currentUser];
        onAdd({ id: Date.now(), text: newText.trim(), assignees, done: false, priority: newPriority, deadline: newDeadline, progress: newProgress });
        setNewText(""); setNewAssignees([]); setNewPriority("mid"); setNewDeadline(""); setNewProgress(0); setShowForm(false);
    };

    const doneCount = filtered.filter(t => t.done).length;
    const totalCount = filtered.length;

    return (
        <div>
            {/* Person filter */}
            <div className="flex flex-wrap gap-1 mb-3">
                <button onClick={() => setFilterPeople([])} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${filterPeople.length === 0 ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>전체</button>
                {MEMBER_NAMES.map(name => (
                    <button key={name} onClick={() => setFilterPeople(filterPeople.includes(name) ? filterPeople.filter(n => n !== name) : [...filterPeople, name])}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${filterPeople.includes(name) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {MEMBERS[name]?.emoji} {name}
                    </button>
                ))}
            </div>
            {/* Stats + Add button */}
            <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setShowForm(!showForm)} className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 할 일 추가</button>
                <span className="text-[12px] text-slate-400">{doneCount}/{totalCount} 완료</span>
            </div>
            {/* Add form */}
            {showForm && (
                <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                    <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="할 일 내용..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus />
                    <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">담당자 (미선택시 본인)</label>
                        <PillSelect options={MEMBER_NAMES} selected={newAssignees} onToggle={v => setNewAssignees(toggleArr(newAssignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    <div className="flex gap-3 items-end">
                        <div>
                            <label className="text-[10px] font-semibold text-slate-400 block mb-1">우선순위</label>
                            <div className="flex gap-1">
                                {PRIORITY_KEYS.map(p => (
                                    <button key={p} type="button" onClick={() => setNewPriority(p)}
                                        className={`px-2 py-0.5 rounded text-[11px] ${newPriority === p ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                        {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-400 block mb-1">기한</label>
                            <input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} placeholder="예: 2/28"
                                className="border border-slate-200 rounded-lg px-2 py-1 text-[12px] w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-400 block mb-1">달성도 {newProgress}%</label>
                            <input type="range" min={0} max={100} step={5} value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} className="w-[120px] accent-blue-500" />
                        </div>
                        <div className="flex gap-1 ml-auto">
                            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-[12px] text-slate-400 hover:text-slate-600">취소</button>
                            <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Left-Right layout: Active | Completed */}
            <div className="flex gap-4">
                {/* Left: Active */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-blue-500">
                        <span className="text-[13px] font-bold text-slate-800">할 일</span>
                        <span className="text-[11px] text-slate-400">{activeTodos.length}</span>
                    </div>
                    <div className="space-y-1">{activeTodos.map(todo => (
                        <div key={todo.id} className={`flex items-start gap-2.5 p-2.5 rounded-md border transition-all bg-white hover:bg-slate-50 group ${todo.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border-slate-100"}`}>
                            <div onClick={() => onToggle(todo.id)} className="w-[18px] h-[18px] rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer border-2 border-slate-300 hover:border-blue-400" />
                            <div className="flex-1 cursor-pointer" onClick={() => { setEditingTodo(todo); setNewText(todo.text); setNewAssignees(todo.assignees); setNewPriority(todo.priority); setNewDeadline(todo.deadline); setNewProgress(todo.progress ?? 0); }}>
                                <label className="flex items-center gap-1.5 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!todo.needsDiscussion} onChange={() => onUpdate({ ...todo, needsDiscussion: !todo.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                    <span className={`text-[10px] font-medium ${todo.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                </label>
                                <div className="text-[13px] text-slate-700 leading-relaxed">{PRIORITY_ICON[todo.priority] || ""} {todo.text}</div>
                                {(todo.progress ?? 0) > 0 && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${todo.progress}%` }} /></div>
                                        <span className="text-[10px] font-semibold text-blue-500">{todo.progress}%</span>
                                    </div>
                                )}
                                <div className="flex gap-1 mt-1 flex-wrap items-center">
                                    {todo.assignees.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-500">{MEMBERS[a]?.emoji || ""}{a}</span>)}
                                    {todo.deadline && <span className="text-[10px] text-red-500 font-semibold ml-auto">~{todo.deadline}</span>}
                                </div>
                            </div>
                            <button onClick={() => onDelete(todo.id)} className="text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity mt-1">✕</button>
                        </div>
                    ))}</div>
                    {activeTodos.length === 0 && <div className="text-center py-8 text-slate-300 text-[12px]">할 일 없음</div>}
                </div>
                {/* Right: Completed */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-emerald-500">
                        <span className="text-[13px] font-bold text-slate-800">완료</span>
                        <span className="text-[11px] text-slate-400">{completedTodos.length}</span>
                    </div>
                    <div className="space-y-1">{completedTodos.map(todo => (
                        <div key={todo.id} className="flex items-start gap-2.5 p-2.5 rounded-md border transition-all bg-slate-50 border-slate-100 opacity-70 group">
                            <div onClick={() => onToggle(todo.id)} className="w-[18px] h-[18px] rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer bg-emerald-500"><span className="text-white text-[12px]">✓</span></div>
                            <div className="flex-1 cursor-pointer" onClick={() => { setEditingTodo(todo); setNewText(todo.text); setNewAssignees(todo.assignees); setNewPriority(todo.priority); setNewDeadline(todo.deadline); setNewProgress(todo.progress ?? 0); }}>
                                <div className="text-[13px] text-slate-500 leading-relaxed">{PRIORITY_ICON[todo.priority] || ""} {todo.text}</div>
                                <div className="flex gap-1 mt-1 flex-wrap items-center">
                                    {todo.assignees.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-400">{MEMBERS[a]?.emoji || ""}{a}</span>)}
                                </div>
                            </div>
                            <button onClick={() => onDelete(todo.id)} className="text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity mt-1">✕</button>
                        </div>
                    ))}</div>
                    {completedTodos.length === 0 && <div className="text-center py-8 text-slate-300 text-[12px]">완료 항목 없음</div>}
                </div>
            </div>
            {/* Edit modal */}
            {editingTodo && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditingTodo(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">할 일 수정</h3>
                            <button onClick={() => setEditingTodo(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">내용</label>
                                <input value={newText} onChange={e => setNewText(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">담당자</label>
                                <PillSelect options={MEMBER_NAMES} selected={newAssignees} onToggle={v => setNewAssignees(toggleArr(newAssignees, v))}
                                    emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                            </div>
                            <div className="flex gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">우선순위</label>
                                    <div className="flex gap-1">
                                        {(["high", "mid", "low"] as const).map(p => (
                                            <button key={p} type="button" onClick={() => setNewPriority(p)}
                                                className={`px-2 py-0.5 rounded text-[11px] ${newPriority === p ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                {PRIORITY_ICON[p]} {PRIORITY_LABEL[p]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">목표 기한</label>
                                    <input value={newDeadline} onChange={e => setNewDeadline(e.target.value)} placeholder="예: 2/28"
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-[12px] w-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">달성도 {newProgress}%</label>
                                <input type="range" min={0} max={100} step={5} value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} className="w-full accent-blue-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <button onClick={() => { onDelete(editingTodo.id); setEditingTodo(null); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingTodo(null)} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={() => { onUpdate({ ...editingTodo, text: newText, assignees: newAssignees.length > 0 ? newAssignees : editingTodo.assignees, priority: newPriority, deadline: newDeadline, progress: newProgress }); setEditingTodo(null); }}
                                    className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const TEAM_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899", "#f97316", "#14b8a6"];

function TeamOverview({ papers, todos, experiments, analyses, teams, onSaveTeams }: { papers: Paper[]; todos: Todo[]; experiments: Experiment[]; analyses: Analysis[]; teams: Record<string, TeamData>; onSaveTeams: (t: Record<string, TeamData>) => void }) {
    const [editingTeam, setEditingTeam] = useState<string | null>(null);
    const [addingTeam, setAddingTeam] = useState(false);
    const [formName, setFormName] = useState("");
    const [formLead, setFormLead] = useState("");
    const [formMembers, setFormMembers] = useState<string[]>([]);
    const [formColor, setFormColor] = useState(TEAM_COLORS[0]);
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const openEdit = (name: string) => {
        const t = teams[name];
        setEditingTeam(name); setFormName(name); setFormLead(t.lead); setFormMembers(t.members); setFormColor(t.color);
    };
    const openAdd = () => {
        setAddingTeam(true); setFormName(""); setFormLead(""); setFormMembers([]); setFormColor(TEAM_COLORS[Object.keys(teams).length % TEAM_COLORS.length]);
    };
    const handleSave = () => {
        if (!formName.trim()) return;
        const updated = { ...teams };
        if (editingTeam && editingTeam !== formName) delete updated[editingTeam];
        updated[formName] = { lead: formLead, members: formMembers, color: formColor };
        onSaveTeams(updated); setEditingTeam(null); setAddingTeam(false);
    };
    const handleDelete = (name: string) => {
        const updated = { ...teams }; delete updated[name]; onSaveTeams(updated);
    };

    const modal = editingTeam !== null || addingTeam;

    return (
        <div>
            <button onClick={openAdd} className="mb-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 팀 추가</button>
            <div className="grid gap-3 sm:grid-cols-2">{Object.entries(teams).map(([name, team]) => (
                <div key={name} className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderTop: `3px solid ${team.color}` }}
                    onClick={() => openEdit(name)}>
                    <div className="text-[15px] font-bold text-slate-800 mb-1">TEAM_{name}</div>
                    <div className="text-[11px] text-slate-500 mb-3">팀장: {MEMBERS[team.lead]?.emoji || ""} {team.lead}</div>
                    <div className="space-y-1.5">{team.members.map(m => {
                        const paperCount = papers.filter(p => p.assignees.includes(m)).length;
                        const todoCount = todos.filter(t => !t.done && (t.assignees.includes(m) || t.assignees.includes("전체"))).length;
                        const expCount = experiments.filter(e => e.assignees.includes(m) && e.status === "running").length;
                        const anaCount = analyses.filter(a => a.assignees.includes(m) && a.status === "running").length;
                        return (
                            <div key={m} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-50">
                                <span className="text-[13px] text-slate-700">{MEMBERS[m]?.emoji} {m}</span>
                                <div className="flex gap-2">
                                    <span className="text-[11px] text-slate-500" title="논문">📄{paperCount}</span>
                                    <span className="text-[11px] text-slate-500" title="할 일">✅{todoCount}</span>
                                    <span className="text-[11px] text-slate-500" title="실험 진행중">🧪{expCount}</span>
                                    <span className="text-[11px] text-slate-500" title="해석 진행중">🖥️{anaCount}</span>
                                </div>
                            </div>
                        );
                    })}</div>
                </div>
            ))}</div>
            {/* Team edit/add modal */}
            {modal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setEditingTeam(null); setAddingTeam(false); }}>
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{editingTeam ? "팀 수정" : "팀 추가"}</h3>
                            <button onClick={() => { setEditingTeam(null); setAddingTeam(false); }} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">팀 이름 *</label>
                                <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">색상</label>
                                <div className="flex gap-2">
                                    {TEAM_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setFormColor(c)}
                                            className={`w-7 h-7 rounded-full transition-all ${formColor === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`}
                                            style={{ background: c }} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">팀원</label>
                                <PillSelect options={MEMBER_NAMES} selected={formMembers} onToggle={v => setFormMembers(toggleArr(formMembers, v))}
                                    emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">팀장</label>
                                <div className="flex flex-wrap gap-1">
                                    {(formMembers.length > 0 ? formMembers : MEMBER_NAMES).map(m => (
                                        <button key={m} type="button" onClick={() => setFormLead(m)}
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${formLead === m ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                            {MEMBERS[m]?.emoji} {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div>{editingTeam && <button onClick={() => { handleDelete(editingTeam); setEditingTeam(null); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingTeam(null); setAddingTeam(false); }} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function IPFormModal({ patent, onSave, onDelete, onClose, currentUser }: { patent: Patent | null; onSave: (p: Patent) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string }) {
    const isEdit = !!patent;
    const [title, setTitle] = useState(patent?.title || "");
    const [deadline, setDeadline] = useState(patent?.deadline || "");
    const [status, setStatus] = useState(patent?.status || "planning");
    const [assignees, setAssignees] = useState<string[]>(patent?.assignees || []);
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "지재권 수정" : "지재권 등록"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">기한</label>
                        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 12/31" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {IP_STATUS_KEYS.map(s => {
                                const cfg = IP_STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(patent!.id); onClose(); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (title.trim()) { onSave({ id: patent?.id || Date.now(), title, deadline, status, assignees, creator: patent?.creator || currentUser, createdAt: patent?.createdAt || new Date().toLocaleString("ko-KR") }); onClose(); } }}
                            className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IPView({ patents, onSave, onDelete, currentUser, onToggleDiscussion }: { patents: Patent[]; onSave: (p: Patent) => void; onDelete: (id: number) => void; currentUser: string; onToggleDiscussion: (p: Patent) => void }) {
    const [editing, setEditing] = useState<Patent | null>(null);
    const [adding, setAdding] = useState(false);
    return (
        <div>
            <div className="mb-3">
                <button onClick={() => setAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 지재권 등록</button>
            </div>
            <div className="flex gap-3 pb-2">
                {IP_STATUS_KEYS.map(status => {
                    const col = patents.filter(p => p.status === status);
                    const cfg = IP_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[13px] font-bold text-slate-800">{cfg.label}</span>
                                <span className="text-[11px] text-slate-400">{col.length}</span>
                            </div>
                            <div className="min-h-[80px] space-y-2">
                                {col.map(p => (
                                    <div key={p.id} onClick={() => setEditing(p)}
                                        className={`bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${p.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!p.needsDiscussion} onChange={() => onToggleDiscussion(p)} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[10px] font-medium ${p.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[13px] font-semibold text-slate-800 mb-1 leading-snug break-words">{p.title}</div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {p.assignees.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                            </div>
                                            {p.deadline && <span className="text-[10px] text-red-500 font-semibold">~{p.deadline}</span>}
                                        </div>
                                        {p.creator && <div className="text-[9px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
                                    </div>
                                ))}
                                {col.length === 0 && <div className="text-[11px] text-slate-300 text-center py-6">—</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            {adding && <IPFormModal patent={null} onSave={p => { onSave(p); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} />}
            {editing && <IPFormModal patent={editing} onSave={p => { onSave(p); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} />}
        </div>
    );
}

// ─── Daily Target View ──────────────────────────────────────────────────────

function getWeekdays(centerDate: Date, range: number): { date: Date; str: string; label: string; isToday: boolean }[] {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // collect weekdays around center
    const allDays: { date: Date; str: string; label: string; isToday: boolean }[] = [];
    const d = new Date(centerDate); d.setDate(d.getDate() - range * 2); // start well before
    while (allDays.length < range * 2 + 20) {
        if (d.getDay() !== 0 && d.getDay() !== 6) {
            const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const dayL = ["일", "월", "화", "수", "목", "금", "토"];
            allDays.push({ date: new Date(d), str, label: `${d.getMonth() + 1}/${d.getDate()} (${dayL[d.getDay()]})`, isToday: d.getTime() === today.getTime() });
        }
        d.setDate(d.getDate() + 1);
    }
    // find center index
    const todayStr = `${centerDate.getFullYear()}-${String(centerDate.getMonth() + 1).padStart(2, "0")}-${String(centerDate.getDate()).padStart(2, "0")}`;
    let ci = allDays.findIndex(d => d.str === todayStr);
    if (ci < 0) ci = Math.floor(allDays.length / 2);
    return allDays.slice(Math.max(0, ci - range), ci + range + 1);
}

function DailyTargetView({ targets, onSave, currentUser }: { targets: DailyTarget[]; onSave: (t: DailyTarget[]) => void; currentUser: string }) {
    const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
    const [editCell, setEditCell] = useState<{ name: string; date: string } | null>(null);
    const [editText, setEditText] = useState("");

    // 3 weekdays ending at endDate: 2일전 | 어제 | 오늘(rightmost)
    const days = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const result: { date: Date; str: string; label: string; isToday: boolean }[] = [];
        const d = new Date(endDate);
        const dayL = ["일", "월", "화", "수", "목", "금", "토"];
        while (result.length < 3) {
            if (d.getDay() !== 0 && d.getDay() !== 6) {
                const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                result.unshift({ date: new Date(d), str, label: `${d.getMonth() + 1}/${d.getDate()} (${dayL[d.getDay()]})`, isToday: d.getTime() === today.getTime() });
            }
            d.setDate(d.getDate() - 1);
        }
        return result;
    }, [endDate]);

    const shiftDays = (dir: number) => {
        const d = new Date(endDate);
        let count = 0;
        while (count < Math.abs(dir)) {
            d.setDate(d.getDate() + (dir > 0 ? 1 : -1));
            if (d.getDay() !== 0 && d.getDay() !== 6) count++;
        }
        setEndDate(d);
    };
    const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setEndDate(d); };

    const getTarget = (name: string, dateStr: string) => targets.find(t => t.name === name && t.date === dateStr);

    const handleSave = () => {
        if (!editCell) return;
        const filtered = targets.filter(t => !(t.name === editCell.name && t.date === editCell.date));
        if (editText.trim()) {
            filtered.push({ name: editCell.name, date: editCell.date, text: editText.trim() });
        }
        onSave(filtered);
        setEditCell(null);
    };

    return (
        <div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left text-[12px] font-semibold text-slate-600 min-w-[100px]">이름</th>
                            {days.map((d, i) => (
                                <th key={d.str} className={`border-b border-l border-slate-200 px-3 py-2 text-center min-w-[160px] ${d.isToday ? "bg-blue-50" : "bg-white"}`}>
                                    {i === 0 && <button onClick={() => shiftDays(-3)} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 mb-1">◀◀</button>}
                                    {i === 1 && <button onClick={() => shiftDays(-1)} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 mb-1">◀</button>}
                                    {i === 2 && <button onClick={goToday} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500 text-white hover:bg-blue-600 mb-1">▶▶▶</button>}
                                    <div className={`text-[12px] font-semibold ${d.isToday ? "text-blue-600" : "text-slate-700"}`}>{d.label}</div>
                                    {d.isToday && <div className="text-[9px] text-blue-400 font-medium">TODAY</div>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {MEMBER_NAMES.map(name => {
                            const isMe = name === currentUser;
                            return (
                                <tr key={name} className={isMe ? "bg-blue-50/30" : ""}>
                                    <td className={`sticky left-0 z-10 border-r border-b border-slate-100 px-3 py-2 text-[12px] whitespace-nowrap ${isMe ? "bg-blue-50 font-semibold text-slate-800" : "bg-white text-slate-600"}`}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </td>
                                    {days.map(d => {
                                        const target = getTarget(name, d.str);
                                        return (
                                            <td key={d.str} className={`border-b border-l border-slate-200 px-2 py-1.5 align-top ${d.isToday ? "bg-blue-50/50" : ""} ${isMe ? "cursor-pointer hover:bg-slate-50" : ""}`}
                                                onClick={() => { if (isMe) { setEditCell({ name, date: d.str }); setEditText(target?.text || ""); } }}>
                                                {target ? (
                                                    <div className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap">{target.text}</div>
                                                ) : isMe ? (
                                                    <div className="text-[11px] text-slate-300 opacity-0 hover:opacity-100 transition-opacity">+ 작성</div>
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
            {/* Edit modal */}
            {editCell && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditCell(null)}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[14px] font-bold text-slate-800 mb-1">일일타겟</h4>
                        <p className="text-[11px] text-slate-400 mb-3">{editCell.date} · {editCell.name}</p>
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="오늘의 타겟을 작성하세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditCell(null)} className="px-3 py-1.5 text-[12px] text-slate-500">취소</button>
                            {editText.trim() === "" && getTarget(editCell.name, editCell.date) && (
                                <button onClick={handleSave} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[12px] font-medium">삭제</button>
                            )}
                            <button onClick={handleSave} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResourceView({ resources, onSave, onDelete, currentUser }: { resources: Resource[]; onSave: (r: Resource) => void; onDelete: (id: number) => void; currentUser: string }) {
    const [editing, setEditing] = useState<Resource | null>(null);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [nasPath, setNasPath] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    const openAdd = () => { setAdding(true); setEditing(null); setTitle(""); setLink(""); setNasPath(""); setComments([]); setNewComment(""); };
    const openEdit = (r: Resource) => { setEditing(r); setAdding(false); setTitle(r.title); setLink(r.link); setNasPath(r.nasPath); setComments(r.comments || []); setNewComment(""); };
    const closeModal = () => { setAdding(false); setEditing(null); };
    const modal = adding || editing !== null;
    const isEdit = !!editing;

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ id: editing?.id || Date.now(), title, link, nasPath, author: editing?.author || currentUser, date: editing?.date || new Date().toLocaleDateString("ko-KR"), comments });
        closeModal();
    };
    const addComment = () => {
        if (!newComment.trim()) return;
        setComments([...comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]);
        setNewComment("");
    };

    return (
        <div>
            <button onClick={openAdd} className="mb-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 자료 추가</button>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {resources.map(r => {
                    const cmt = r.comments || [];
                    return (
                        <div key={r.id} onClick={() => openEdit(r)} className={`bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${r.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}>
                            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onSave({ ...r, needsDiscussion: !r.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                <span className={`text-[10px] font-medium ${r.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                            </label>
                            <div className="text-[14px] font-semibold text-slate-800 mb-2 break-words">{r.title}</div>
                            {r.link && (
                                <div className="text-[11px] text-blue-500 mb-1 truncate" onClick={e => { e.stopPropagation(); window.open(r.link, "_blank"); }}>
                                    🔗 {r.link}
                                </div>
                            )}
                            {r.nasPath && <div className="text-[11px] text-slate-500 mb-1 truncate">📂 {r.nasPath}</div>}
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-[10px] text-slate-400">{MEMBERS[r.author]?.emoji || ""} {r.author} · {r.date}</div>
                                {cmt.length > 0 && <span className="text-[10px] text-slate-400">💬{cmt.length}</span>}
                            </div>
                            {cmt.length > 0 && (
                                <div className="border-t border-slate-100 pt-1.5 mt-2">
                                    {cmt.slice(-1).map(c => (
                                        <div key={c.id} className="text-[11px] text-slate-500 truncate">
                                            <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {c.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {resources.length === 0 && <div className="text-center py-12 text-slate-400 text-[13px] col-span-full">등록된 자료가 없습니다</div>}
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "자료 수정" : "자료 추가"}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">자료 이름 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">링크 (URL)</label>
                                <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">NAS 경로</label>
                                <input value={nasPath} onChange={e => setNasPath(e.target.value)} placeholder="예: \\NAS\연구자료\..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            {/* Comments */}
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                                    {comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                            <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                                className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[12px] text-slate-700 pr-4">{c.text}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && <div className="text-[11px] text-slate-300 py-2">코멘트 없음</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onKeyDown={e => e.key === "Enter" && addComment()} />
                                    <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] hover:bg-slate-200">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div>{isEdit && <button onClick={() => { onDelete(editing!.id); closeModal(); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Ideas / Chat View ──────────────────────────────────────────────────────

function IdeasView({ ideas, onSave, onDelete, currentUser }: { ideas: IdeaPost[]; onSave: (i: IdeaPost) => void; onDelete: (id: number) => void; currentUser: string }) {
    const [selected, setSelected] = useState<IdeaPost | null>(null);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [newComment, setNewComment] = useState("");

    const openDetail = (idea: IdeaPost) => { setSelected(idea); setNewComment(""); };
    const closeDetail = () => setSelected(null);
    const openAdd = () => { setAdding(true); setTitle(""); setBody(""); };
    const closeAdd = () => setAdding(false);

    const handleCreate = () => {
        if (!title.trim()) return;
        onSave({ id: Date.now(), title: title.trim(), body: body.trim(), author: currentUser, date: new Date().toLocaleDateString("ko-KR"), comments: [] });
        closeAdd();
    };

    const addComment = () => {
        if (!newComment.trim() || !selected) return;
        const updated = { ...selected, comments: [...selected.comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] };
        onSave(updated);
        setSelected(updated);
        setNewComment("");
    };

    const deleteComment = (cid: number) => {
        if (!selected) return;
        const updated = { ...selected, comments: selected.comments.filter(c => c.id !== cid) };
        onSave(updated);
        setSelected(updated);
    };

    return (
        <div>
            <button onClick={openAdd} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 새 글 작성</button>
            <div className="grid gap-4 sm:grid-cols-2">
                {ideas.map(idea => (
                    <div key={idea.id} onClick={() => openDetail(idea)}
                        className={`bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col ${idea.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}>
                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!idea.needsDiscussion} onChange={() => onSave({ ...idea, needsDiscussion: !idea.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                            <span className={`text-[10px] font-medium ${idea.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-[14px] font-semibold text-slate-800 break-words flex-1">{idea.title}</div>
                            <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">{idea.date}</span>
                        </div>
                        {idea.body && <div className="text-[12px] text-slate-600 mb-3 line-clamp-3 break-words">{idea.body}</div>}
                        <div className="text-[11px] text-slate-400 mb-2">{MEMBERS[idea.author]?.emoji || "👤"} {idea.author}</div>
                        {/* Comment preview */}
                        {idea.comments.length > 0 && (
                            <div className="border-t border-slate-100 pt-2 mt-auto space-y-1">
                                <div className="text-[10px] font-semibold text-slate-400 mb-1">💬 댓글 {idea.comments.length}개</div>
                                {idea.comments.slice(-2).map(c => (
                                    <div key={c.id} className="text-[11px] text-slate-500 truncate">
                                        <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {c.text}
                                    </div>
                                ))}
                            </div>
                        )}
                        {idea.comments.length === 0 && (
                            <div className="border-t border-slate-100 pt-2 mt-auto">
                                <div className="text-[10px] text-slate-300">💬 댓글 없음</div>
                            </div>
                        )}
                    </div>
                ))}
                {ideas.length === 0 && <div className="text-center py-12 text-slate-400 text-[13px] col-span-full">아직 글이 없습니다. 자유롭게 아이디어를 공유해 보세요!</div>}
            </div>

            {/* Add modal */}
            {adding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeAdd}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">새 글 작성</h3>
                            <button onClick={closeAdd} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">제목 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">내용</label>
                                <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={closeAdd} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={handleCreate} className="px-4 py-2 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">게시</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail modal */}
            {selected && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeDetail}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selected.title}</h3>
                            <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="text-[11px] text-slate-400 mb-3">{MEMBERS[selected.author]?.emoji || "👤"} {selected.author} · {selected.date}</div>
                            {selected.body && <div className="text-[13px] text-slate-700 mb-4 whitespace-pre-wrap break-words">{selected.body}</div>}

                            {/* Comments section */}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[12px] font-semibold text-slate-600 mb-3">💬 댓글 ({selected.comments.length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {selected.comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group relative">
                                            <button onClick={() => deleteComment(c.id)}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[12px] text-slate-700 pr-4 break-words">{c.text}</div>
                                            <div className="text-[10px] text-slate-400 mt-1">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {selected.comments.length === 0 && <div className="text-[11px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onKeyDown={e => e.key === "Enter" && addComment()} />
                                    <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[12px] hover:bg-blue-600 font-medium">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div>
                                {(currentUser === selected.author || currentUser === "박일웅") && (
                                    <button onClick={() => { onDelete(selected.id); closeDetail(); }} className="text-[12px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                            </div>
                            <button onClick={closeDetail} className="px-4 py-2 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AnnouncementView({ announcements, onAdd, onDelete, philosophy, onAddPhilosophy, onDeletePhilosophy, currentUser }: {
    announcements: Announcement[]; onAdd: (text: string) => void; onDelete: (id: number) => void;
    philosophy: Announcement[]; onAddPhilosophy: (text: string) => void; onDeletePhilosophy: (id: number) => void;
    currentUser: string;
}) {
    const [newText, setNewText] = useState("");
    const [newPhil, setNewPhil] = useState("");
    const isLeader = currentUser === "박일웅" || Object.values(DEFAULT_TEAMS).some(t => t.lead === currentUser);
    const isPI = currentUser === "박일웅";
    return (
        <div className="space-y-8">
            {/* 공지사항 */}
            <div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-3">공지사항</h3>
                {isLeader && (
                    <div className="mb-3 flex gap-2">
                        <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="공지사항 작성... (Shift+Enter로 줄바꿈)"
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[40px]" rows={1}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newText.trim()) { e.preventDefault(); onAdd(newText.trim()); setNewText(""); } }}
                            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }} />
                        <button onClick={() => { if (newText.trim()) { onAdd(newText.trim()); setNewText(""); } }} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 self-end">게시</button>
                    </div>
                )}
                {announcements.length === 0 && <div className="text-center py-8 text-slate-400 text-[13px]">공지사항이 없습니다</div>}
                <div className="space-y-2">{[...announcements].sort((a, b) => { if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; return new Date(b.date).getTime() - new Date(a.date).getTime(); }).map(ann => (
                    <div key={ann.id} className={`bg-white border rounded-lg p-4 ${ann.pinned ? "border-amber-300 bg-amber-50/50" : "border-slate-200"}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">{ann.pinned && <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded mr-2">📌</span>}<span className="text-[13px] text-slate-800 whitespace-pre-wrap">{ann.text}</span></div>
                            {(currentUser === ann.author || isPI) && <button onClick={() => onDelete(ann.id)} className="text-slate-400 hover:text-red-500 text-[12px] ml-2">✕</button>}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-400">{ann.author} · {ann.date}</div>
                    </div>
                ))}</div>
            </div>
            {/* 문화 */}
            <div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-1">🧭 문화</h3>
                <p className="text-[11px] text-slate-400 mb-3">연구실 문화 및 핵심 가치</p>
                {isLeader && (
                    <div className="mb-3 flex gap-2">
                        <textarea value={newPhil} onChange={e => setNewPhil(e.target.value)} placeholder="연구실 문화 작성... (Shift+Enter로 줄바꿈)"
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[40px]" rows={1}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newPhil.trim()) { e.preventDefault(); onAddPhilosophy(newPhil.trim()); setNewPhil(""); } }}
                            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }} />
                        <button onClick={() => { if (newPhil.trim()) { onAddPhilosophy(newPhil.trim()); setNewPhil(""); } }} className="px-4 py-2 bg-violet-500 text-white rounded-lg text-[13px] font-medium hover:bg-violet-600 self-end">게시</button>
                    </div>
                )}
                {philosophy.length === 0 && <div className="text-center py-8 text-slate-400 text-[13px]">등록된 내용이 없습니다</div>}
                <div className="space-y-2">{[...philosophy].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                    <div key={p.id} className="bg-violet-50/50 border border-violet-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1"><span className="text-[13px] text-slate-800 whitespace-pre-wrap">{p.text}</span></div>
                            {isPI && <button onClick={() => onDeletePhilosophy(p.id)} className="text-slate-400 hover:text-red-500 text-[12px] ml-2">✕</button>}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-400">{p.author} · {p.date}</div>
                    </div>
                ))}</div>
            </div>
        </div>
    );
}

// ─── Settings View ──────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
    "👨‍🏫","🔥","🌊","💧","⚙️","📐","🔬","💻","🧪","❄️","📊","🔄","🌡️","🎯","🚀","⭐","🎨","🛠️","📡","🧬","💎","🌟","🎓","🤖","🔮","🌈",
    "🦊","🐱","🐶","🦁","🐼","🐻","🐸","🐙","🦋","🐝","🐺","🦄","🐯","🐮","🐷","🐵","🐰","🐨","🦅","🦇","🐳","🐬","🐠","🦈","🐢","🦜",
    "🍀","🌸","🌺","☀️","🌙","⚡","💥","✨","🎵","🎮","🏀","⚽","🎸","🎪","🎭","🎲","🎰","🏆","🥇","🏅","🎻","🎺","🥁","🎹","🎧","🎤",
    "🍎","🍊","🍋","🍇","🍓","🍑","🍒","🥝","🍌","🍉","🍔","🍕","🍩","🍪","🍰","🧁","🍫","🍿","☕","🍵","🥤","🧃","🍺","🧊","🍭","🎂",
    "🚗","🚀","✈️","🚁","🚢","🏎️","🚂","🛸","🚲","🏍️","🛵","⛵","🚤","🚃","🚅","🚆","🛩️","🪂","⛷️","🏂","🏄","🚣","🤿","🧗","🪁","🛶",
    "💪","👑","🧠","💡","🔑","❤️","💙","💚","💛","💜","🖤","🤍","💝","💖","❤️‍🔥","🫀","🩺","🔭","🔬","⚗️","🧲","🧫","🧰","🪛","⛏️","🗡️",
    "🏔️","🌋","🏝️","🏖️","🌅","🌄","🌃","🏙️","🌉","🎡","🎢","🗼","🏯","🕌","⛩️","🗻","🌎","🌍","🌏","🗺️","🧭","⛺","🏕️","🪐","🌠","🌌",
    "😎","🥳","🤩","😈","👻","💀","👽","🤡","🦸","🦹","🧙","🧛","🧜","🧚","🧝","🧞","🥷","🧑‍🚀","🧑‍🔬","🧑‍💻","🧑‍🎨","🧑‍🏫","🧑‍🔧","🧑‍🍳","🧑‍⚕️","🧑‍🌾",
    "🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚪","⚫","🔶","🔷","🔸","🔹","♠️","♥️","♦️","♣️","🃏","🀄","🎴","🏁","🚩","🎌","🏳️‍🌈","🏴‍☠️","🔔"
];

function SettingsView({ currentUser, customEmojis, onSaveEmoji }: { currentUser: string; customEmojis: Record<string, string>; onSaveEmoji: (name: string, emoji: string) => void }) {
    const currentEmoji = customEmojis[currentUser] || MEMBERS[currentUser]?.emoji || "👤";
    return (
        <div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-[14px] font-bold text-slate-800 mb-4">내 이모지 설정</h3>
                <div className="mb-3">
                    <span className="text-[12px] text-slate-500">현재: </span>
                    <span className="text-[20px]">{currentEmoji}</span>
                    <span className="text-[13px] text-slate-700 ml-2 font-medium">{currentUser}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => onSaveEmoji(currentUser, e)}
                            className={`w-9 h-9 rounded-lg text-[18px] flex items-center justify-center transition-all ${currentEmoji === e ? "bg-blue-100 ring-2 ring-blue-500 scale-110" : "bg-slate-50 hover:bg-slate-100 hover:scale-105"}`}>
                            {e}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Login ───────────────────────────────────────────────────────────────────

// ─── Personal Memo View ──────────────────────────────────────────────────────

const MEMO_COLORS = ["#f8fafc", "#fef3c7", "#dcfce7", "#dbeafe", "#fce7f3", "#f3e8ff", "#e0f2fe", "#fef9c3"];

function PersonalMemoView({ memos, onSave, onDelete }: {
    memos: Memo[]; onSave: (m: Memo) => void; onDelete: (id: number) => void;
}) {
    const [editing, setEditing] = useState<Memo | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [color, setColor] = useState(MEMO_COLORS[0]);

    const openNew = () => { setEditing(null); setTitle(""); setContent(""); setColor(MEMO_COLORS[0]); };
    const openEdit = (m: Memo) => { setEditing(m); setTitle(m.title); setContent(m.content); setColor(m.color); };
    const save = () => {
        const now = new Date().toISOString().split("T")[0];
        if (editing) {
            onSave({ ...editing, title: title.trim() || "제목 없음", content, color, updatedAt: now });
        } else {
            onSave({ id: Date.now(), title: title.trim() || "제목 없음", content, color, updatedAt: now });
        }
        setEditing(null); setTitle(""); setContent(""); setColor(MEMO_COLORS[0]);
    };
    const [showForm, setShowForm] = useState(false);

    return (
        <div>
            <div className="mb-3">
                <button onClick={() => { openNew(); setShowForm(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 메모 추가</button>
            </div>
            {showForm && (
                <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="메모 제목" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요..." rows={6}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">색상</label>
                        <div className="flex gap-1.5">
                            {MEMO_COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${color === c ? "border-blue-500 scale-110" : "border-slate-200 hover:border-slate-300"}`}
                                    style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[12px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { save(); setShowForm(false); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">저장</button>
                    </div>
                </div>
            )}
            {memos.length === 0 && !showForm && <div className="text-center py-12 text-slate-400 text-[13px]">메모가 없습니다</div>}
            <div className="grid grid-cols-3 gap-3">
                {[...memos].sort((a, b) => b.id - a.id).map(m => (
                    <div key={m.id} className="rounded-lg border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-shadow group relative"
                        style={{ background: m.color }}
                        onClick={() => { openEdit(m); setShowForm(true); }}>
                        <button onClick={e => { e.stopPropagation(); onDelete(m.id); }}
                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        <h4 className="text-[13px] font-bold text-slate-800 mb-1 truncate">{m.title}</h4>
                        <p className="text-[12px] text-slate-600 whitespace-pre-wrap line-clamp-4">{m.content}</p>
                        <div className="mt-2 text-[10px] text-slate-400">{m.updatedAt}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
    const [pw, setPw] = useState(""); const [name, setName] = useState(""); const [custom, setCustom] = useState(""); const [err, setErr] = useState("");
    const submit = () => {
        if (pw !== "Mftel7335!") { setErr("비밀번호가 틀렸습니다"); return; }
        const n = name === "__custom" ? custom.trim() : name;
        if (!n) { setErr("이름을 선택하세요"); return; }
        onLogin(n);
    };
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>M</div>
                    <h1 className="text-xl font-bold text-slate-800">MFTEL Dashboard</h1>
                    <p className="text-[12px] text-slate-400 mt-1">Team members only</p>
                </div>
                <div className="space-y-3">
                    <div><label className="text-[12px] font-medium text-slate-600 block mb-1">비밀번호</label><input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} placeholder="비밀번호 입력" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" onKeyDown={e => e.key === "Enter" && submit()} /></div>
                    <div><label className="text-[12px] font-medium text-slate-600 block mb-1">이름</label><select value={name} onChange={e => { setName(e.target.value); setErr(""); }} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"><option value="">이름 선택...</option>{Object.keys(MEMBERS).map(n => <option key={n} value={n}>{MEMBERS[n].emoji} {n}</option>)}<option value="__custom">직접 입력</option></select></div>
                    {name === "__custom" && <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="이름 입력" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />}
                    {err && <p className="text-[12px] text-red-500">{err}</p>}
                    <button onClick={submit} className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>입장</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [activeTab, setActiveTab] = useState("announcements");
    const [selectedPerson, setSelectedPerson] = useState("전체");
    const [onlineUsers, setOnlineUsers] = useState<Array<{ name: string; timestamp: number }>>([]);

    // Paper modal state
    const [paperModal, setPaperModal] = useState<{ paper: Paper | null; mode: "add" | "edit" } | null>(null);

    // Data states
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [papers, setPapers] = useState<Paper[]>(DEFAULT_PAPERS);
    const [experiments, setExperiments] = useState(DEFAULT_EXPERIMENTS);
    const [todos, setTodos] = useState(DEFAULT_TODOS);
    const [ipPatents, setIpPatents] = useState(DEFAULT_PATENTS);
    const [vacations, setVacations] = useState<VacationEntry[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
    const [timetable, setTimetable] = useState<TimetableBlock[]>(DEFAULT_TIMETABLE);
    const [reports, setReports] = useState<Report[]>([]);
    const [teams, setTeams] = useState<Record<string, TeamData>>(DEFAULT_TEAMS);
    const [dailyTargets, setDailyTargets] = useState<DailyTarget[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [philosophy, setPhilosophy] = useState<Announcement[]>([]);
    const [ideas, setIdeas] = useState<IdeaPost[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [chatPosts, setChatPosts] = useState<IdeaPost[]>([]);
    const [customEmojis, setCustomEmojis] = useState<Record<string, string>>({});
    const [equipmentList, setEquipmentList] = useState<string[]>(DEFAULT_EQUIPMENT);
    const [analysisToolList, setAnalysisToolList] = useState<string[]>(ANALYSIS_TOOLS);
    const [paperTagList, setPaperTagList] = useState<string[]>(PAPER_TAGS);
    const [personalMemos, setPersonalMemos] = useState<Record<string, Memo[]>>({});

    const tabs = [
        { id: "announcements", label: "공지사항", icon: "📢" },
        { id: "daily", label: "일일타겟", icon: "🎯" },
        { id: "calendar", label: "일정/휴가", icon: "📅" },
        { id: "todos", label: "To-do", icon: "✅" },
        { id: "papers", label: "논문 현황", icon: "📄" },
        { id: "reports", label: "계획서/보고서", icon: "📋" },
        { id: "ip", label: "지재권", icon: "💡" },
        { id: "experiments", label: "실험 현황", icon: "🧪" },
        { id: "analysis", label: "해석 현황", icon: "🖥️" },
        { id: "resources", label: "자료", icon: "📁" },
        { id: "ideas", label: "아이디어", icon: "💡" },
        { id: "chat", label: "잡담", icon: "💬" },
        { id: "teams", label: "팀 현황", icon: "👥" },
        { id: "lectures", label: "수업", icon: "📚" },
        { id: "settings", label: "설정", icon: "⚙️" },
        ...MEMBER_NAMES.map(name => ({ id: `memo_${name}`, label: name, icon: customEmojis[name] || MEMBERS[name]?.emoji || "👤" })),
    ];

    const allPeople = useMemo(() => ["전체", ...MEMBER_NAMES], []);

    const saveSection = useCallback(async (section: string, data: unknown) => {
        try { await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, data }) }); } catch { /* ignore */ }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/dashboard?section=all");
            const d = await res.json();
            if (d.announcements) setAnnouncements(d.announcements);
            if (d.papers) setPapers(d.papers);
            if (d.experiments) setExperiments(d.experiments);
            if (d.todos) setTodos(d.todos);
            if (d.patents) setIpPatents(d.patents);
            if (d.vacations) setVacations(d.vacations);
            if (d.schedule) setSchedule(d.schedule);
            if (d.timetable) setTimetable(d.timetable);
            if (d.reports) setReports(d.reports);
            if (d.teams) setTeams(d.teams);
            if (d.dailyTargets) setDailyTargets(d.dailyTargets);
            if (d.philosophy) setPhilosophy(d.philosophy);
            if (d.resources) setResources(d.resources);
            if (d.ideas) setIdeas(d.ideas);
            if (d.analyses) setAnalyses(d.analyses);
            if (d.chatPosts) setChatPosts(d.chatPosts);
            if (d.customEmojis) setCustomEmojis(d.customEmojis);
            if (d.equipmentList) setEquipmentList(d.equipmentList);
            if (d.personalMemos) setPersonalMemos(d.personalMemos);
            if (d.analysisToolList) setAnalysisToolList(d.analysisToolList);
            if (d.paperTagList) setPaperTagList(d.paperTagList);
        } catch { /* ignore */ }
    }, []);

    const fetchOnline = useCallback(async () => {
        try { const r = await fetch("/api/dashboard?section=online"); const d = await r.json(); setOnlineUsers(d.users || []); } catch { /* ignore */ }
    }, []);

    const sendHeartbeat = useCallback(async () => {
        if (!userName) return;
        try { await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "online", action: "heartbeat", userName }) }); } catch { /* ignore */ }
    }, [userName]);

    const handleLogin = async (name: string) => {
        setUserName(name); setLoggedIn(true);
        await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "online", action: "join", userName: name }) });
    };

    useEffect(() => {
        if (!loggedIn) return;
        fetchData(); fetchOnline();
        const a = setInterval(fetchData, 5000);
        const b = setInterval(fetchOnline, 5000);
        const c = setInterval(sendHeartbeat, 10000);
        return () => { clearInterval(a); clearInterval(b); clearInterval(c); };
    }, [loggedIn, fetchData, fetchOnline, sendHeartbeat]);

    useEffect(() => {
        if (!userName) return;
        const h = () => navigator.sendBeacon("/api/dashboard", JSON.stringify({ section: "online", action: "leave", userName }));
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [userName]);

    // Handlers
    const handleToggleTodo = (id: number) => { const u = todos.map(t => t.id === id ? { ...t, done: !t.done } : t); setTodos(u); saveSection("todos", u); };
    const handleAddTodo = (t: Todo) => { const u = [...todos, t]; setTodos(u); saveSection("todos", u); };
    const handleDeleteTodo = (id: number) => { const u = todos.filter(t => t.id !== id); setTodos(u); saveSection("todos", u); };
    const handleUpdateTodo = (t: Todo) => { const u = todos.map(x => x.id === t.id ? t : x); setTodos(u); saveSection("todos", u); };
    const handleAddAnn = (text: string) => { const u = [{ id: Date.now(), text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned: false }, ...announcements]; setAnnouncements(u); saveSection("announcements", u); };
    const handleDelAnn = (id: number) => { const u = announcements.filter(a => a.id !== id); setAnnouncements(u); saveSection("announcements", u); };
    const handleAddPhil = (text: string) => { const u = [{ id: Date.now(), text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned: false }, ...philosophy]; setPhilosophy(u); saveSection("philosophy", u); };
    const handleDelPhil = (id: number) => { const u = philosophy.filter(p => p.id !== id); setPhilosophy(u); saveSection("philosophy", u); };

    const handleSavePaper = (p: Paper) => {
        const exists = papers.find(x => x.id === p.id);
        const u = exists ? papers.map(x => x.id === p.id ? p : x) : [...papers, p];
        setPapers(u); saveSection("papers", u); setPaperModal(null);
    };
    const handleDeletePaper = (id: number) => { const u = papers.filter(p => p.id !== id); setPapers(u); saveSection("papers", u); };

    const handleSaveExperiment = (e: Experiment) => {
        const exists = experiments.find(x => x.id === e.id);
        const u = exists ? experiments.map(x => x.id === e.id ? e : x) : [...experiments, e];
        setExperiments(u); saveSection("experiments", u);
    };
    const handleDeleteExperiment = (id: number) => { const u = experiments.filter(e => e.id !== id); setExperiments(u); saveSection("experiments", u); };

    const handleSaveReport = (r: Report) => {
        const exists = reports.find(x => x.id === r.id);
        const u = exists ? reports.map(x => x.id === r.id ? r : x) : [...reports, r];
        setReports(u); saveSection("reports", u);
    };
    const handleDeleteReport = (id: number) => { const u = reports.filter(r => r.id !== id); setReports(u); saveSection("reports", u); };

    const handleCalendarToggle = (name: string, date: string, type: string | null, desc?: string) => {
        const dates = date.includes(",") ? date.split(",") : [date];
        const isVacType = type === "vacation" || type === "wfh";
        // Update vacations
        let uv = [...vacations];
        let us = [...schedule];
        for (const dt of dates) {
            if (type === null) {
                uv = uv.filter(v => !(v.name === name && v.date === dt));
                us = us.filter(v => !(v.name === name && v.date === dt));
            } else if (isVacType) {
                us = us.filter(v => !(v.name === name && v.date === dt));
                uv = [...uv.filter(v => !(v.name === name && v.date === dt)), { name, date: dt, type }];
            } else {
                uv = uv.filter(v => !(v.name === name && v.date === dt));
                us = [...us.filter(v => !(v.name === name && v.date === dt)), { name, date: dt, type, description: desc || "" }];
            }
        }
        setVacations(uv); saveSection("vacations", uv);
        setSchedule(us); saveSection("schedule", us);
    };
    const handleTimetableSave = (b: TimetableBlock) => {
        const exists = timetable.find(x => x.id === b.id);
        const u = exists ? timetable.map(x => x.id === b.id ? b : x) : [...timetable, b];
        setTimetable(u); saveSection("timetable", u);
    };
    const handleTimetableDelete = (id: number) => { const u = timetable.filter(b => b.id !== id); setTimetable(u); saveSection("timetable", u); };
    const handleSaveTeams = (t: Record<string, TeamData>) => { setTeams(t); saveSection("teams", t); };
    const handleSavePatent = (p: Patent) => {
        const exists = ipPatents.find(x => x.id === p.id);
        const u = exists ? ipPatents.map(x => x.id === p.id ? p : x) : [...ipPatents, p];
        setIpPatents(u); saveSection("patents", u);
    };
    const handleDeletePatent = (id: number) => { const u = ipPatents.filter(p => p.id !== id); setIpPatents(u); saveSection("patents", u); };
    const handleSaveResource = (r: Resource) => {
        const exists = resources.find(x => x.id === r.id);
        const u = exists ? resources.map(x => x.id === r.id ? r : x) : [...resources, r];
        setResources(u); saveSection("resources", u);
    };
    const handleDeleteResource = (id: number) => { const u = resources.filter(r => r.id !== id); setResources(u); saveSection("resources", u); };
    const handleSaveDailyTargets = (t: DailyTarget[]) => { setDailyTargets(t); saveSection("dailyTargets", t); };
    const handleSaveIdea = (idea: IdeaPost) => {
        const exists = ideas.find(x => x.id === idea.id);
        const u = exists ? ideas.map(x => x.id === idea.id ? idea : x) : [idea, ...ideas];
        setIdeas(u); saveSection("ideas", u);
    };
    const handleDeleteIdea = (id: number) => { const u = ideas.filter(i => i.id !== id); setIdeas(u); saveSection("ideas", u); };
    const handleSaveAnalysis = (a: Analysis) => {
        const exists = analyses.find(x => x.id === a.id);
        const u = exists ? analyses.map(x => x.id === a.id ? a : x) : [...analyses, a];
        setAnalyses(u); saveSection("analyses", u);
    };
    const handleDeleteAnalysis = (id: number) => { const u = analyses.filter(a => a.id !== id); setAnalyses(u); saveSection("analyses", u); };
    const handleSaveChat = (post: IdeaPost) => {
        const exists = chatPosts.find(x => x.id === post.id);
        const u = exists ? chatPosts.map(x => x.id === post.id ? post : x) : [post, ...chatPosts];
        setChatPosts(u); saveSection("chatPosts", u);
    };
    const handleDeleteChat = (id: number) => { const u = chatPosts.filter(p => p.id !== id); setChatPosts(u); saveSection("chatPosts", u); };
    const handleSaveEmoji = (name: string, emoji: string) => {
        const u = { ...customEmojis, [name]: emoji };
        setCustomEmojis(u); saveSection("customEmojis", u);
    };
    const handleSaveEquipment = (list: string[]) => { setEquipmentList(list); saveSection("equipmentList", list); };
    const handleSaveAnalysisTools = (list: string[]) => { setAnalysisToolList(list); saveSection("analysisToolList", list); };
    const handleSavePaperTags = (list: string[]) => { setPaperTagList(list); saveSection("paperTagList", list); };
    const handleSaveMemo = (memberName: string, memo: Memo) => {
        const existing = personalMemos[memberName] || [];
        const found = existing.find(m => m.id === memo.id);
        const updated = found ? existing.map(m => m.id === memo.id ? memo : m) : [...existing, memo];
        const u = { ...personalMemos, [memberName]: updated };
        setPersonalMemos(u); saveSection("personalMemos", u);
    };
    const handleDeleteMemo = (memberName: string, id: number) => {
        const updated = (personalMemos[memberName] || []).filter(m => m.id !== id);
        const u = { ...personalMemos, [memberName]: updated };
        setPersonalMemos(u); saveSection("personalMemos", u);
    };

    if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

    const stats = [
        { label: "논문 작성중", value: papers.filter(p => p.status === "writing").length, color: "#3b82f6" },
        { label: "계획서/보고서 작성중", value: reports.filter(r => r.status === "writing").length, color: "#f59e0b" },
        { label: "실험 진행중", value: experiments.filter(e => e.status === "running").length, color: "#10b981" },
        { label: "해석 진행중", value: analyses.filter(a => a.status === "running").length, color: "#8b5cf6" },
    ];

    const discussionCounts: Record<string, number> = {
        todos: todos.filter(t => t.needsDiscussion).length,
        papers: papers.filter(p => p.needsDiscussion).length,
        reports: reports.filter(r => r.needsDiscussion).length,
        ip: ipPatents.filter(p => p.needsDiscussion).length,
        experiments: experiments.filter(e => e.needsDiscussion).length,
        analysis: analyses.filter(a => a.needsDiscussion).length,
        resources: resources.filter(r => r.needsDiscussion).length,
        ideas: ideas.filter(i => i.needsDiscussion).length,
        chat: chatPosts.filter(c => c.needsDiscussion).length,
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            {/* Header */}
            <div className="bg-slate-900 px-4 md:px-7 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] font-extrabold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>M</div>
                    <div>
                        <div className="text-[16px] font-bold text-white tracking-tight">MFTEL Lab Dashboard</div>
                        <div className="text-[11px] text-slate-400">Multi-phase Flow & Thermal Energy Lab · Inha University</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-[12px] text-slate-400">
                        <span className="text-[11px]">접속:</span>
                        {onlineUsers.filter(u => u.name !== userName).length === 0 ? <span className="text-slate-500">-</span> : onlineUsers.filter(u => u.name !== userName).map(u => <span key={u.name} className="text-slate-300">{MEMBERS[u.name]?.emoji || "👤"}{u.name}</span>)}
                    </div>
                    <span className="text-[12px] text-slate-400">{MEMBERS[userName]?.emoji || "👤"} {userName} (me)</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="md:w-[200px] bg-white md:border-r border-b md:border-b-0 border-slate-200 md:min-h-[calc(100vh-60px)] flex-shrink-0">
                    <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-3 md:p-0 md:pt-4 md:pb-8 gap-0.5">
                        {tabs.map((tab, i) => (
                            <div key={tab.id}>
                                {tab.id.startsWith("memo_") && i > 0 && !tabs[i - 1].id.startsWith("memo_") && (
                                    <div className="my-2 mx-3 border-t border-slate-200" />
                                )}
                                <button onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] whitespace-nowrap transition-all ${activeTab === tab.id ? "font-semibold text-slate-800 bg-slate-100" : "text-slate-500 hover:bg-slate-50"}`}>
                                    <span>{tab.icon}</span><span>{tab.label}</span>
                                    {(discussionCounts[tab.id] || 0) > 0 && <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">{discussionCounts[tab.id]}</span>}
                                </button>
                            </div>
                        ))}
                    </div>
                    {(activeTab === "papers" || activeTab === "todos") && (
                        <div className="hidden md:block px-3 mt-4">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">필터</div>
                            <div className="max-h-[360px] overflow-y-auto space-y-0.5">
                                {allPeople.map(person => (
                                    <button key={person} onClick={() => setSelectedPerson(person)}
                                        className={`flex items-center gap-1.5 w-full px-3 py-1.5 rounded-md text-[12px] transition-all ${selectedPerson === person ? "font-semibold text-slate-800 bg-blue-50" : "text-slate-500 hover:bg-slate-50"}`}>
                                        {person !== "전체" && <span>{MEMBERS[person]?.emoji}</span>}{person}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 md:p-5 overflow-x-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        {stats.map(s => <div key={s.label} className="bg-white border border-slate-200 rounded-lg px-4 py-3"><div className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</div><div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div></div>)}
                    </div>
                    <div className="mb-4">
                        <h2 className="text-[18px] font-bold text-slate-900">
                            {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
                            {(activeTab === "papers" || activeTab === "todos") && selectedPerson !== "전체" && <span className="text-[14px] font-normal text-slate-500 ml-2">— {MEMBERS[selectedPerson]?.emoji} {selectedPerson}</span>}
                        </h2>
                    </div>

                    {activeTab === "announcements" && <AnnouncementView announcements={announcements} onAdd={handleAddAnn} onDelete={handleDelAnn} philosophy={philosophy} onAddPhilosophy={handleAddPhil} onDeletePhilosophy={handleDelPhil} currentUser={userName} />}
                    {activeTab === "daily" && <DailyTargetView targets={dailyTargets} onSave={handleSaveDailyTargets} currentUser={userName} />}
                    {activeTab === "papers" && <KanbanView papers={papers} filter={selectedPerson} onClickPaper={p => setPaperModal({ paper: p, mode: "edit" })} onAddPaper={() => setPaperModal({ paper: null, mode: "add" })} onSavePaper={handleSavePaper} tagList={paperTagList} onSaveTags={handleSavePaperTags} />}
                    {activeTab === "reports" && <ReportView reports={reports} currentUser={userName} onSave={handleSaveReport} onDelete={handleDeleteReport} onToggleDiscussion={r => handleSaveReport({ ...r, needsDiscussion: !r.needsDiscussion })} />}
                    {activeTab === "experiments" && <ExperimentView experiments={experiments} onSave={handleSaveExperiment} onDelete={handleDeleteExperiment} currentUser={userName} equipmentList={equipmentList} onSaveEquipment={handleSaveEquipment} onToggleDiscussion={e => handleSaveExperiment({ ...e, needsDiscussion: !e.needsDiscussion })} />}
                    {activeTab === "analysis" && <AnalysisView analyses={analyses} onSave={handleSaveAnalysis} onDelete={handleDeleteAnalysis} currentUser={userName} toolList={analysisToolList} onSaveTools={handleSaveAnalysisTools} onToggleDiscussion={a => handleSaveAnalysis({ ...a, needsDiscussion: !a.needsDiscussion })} />}
                    {activeTab === "todos" && <TodoList todos={todos} onToggle={handleToggleTodo} onAdd={handleAddTodo} onUpdate={handleUpdateTodo} onDelete={handleDeleteTodo} currentUser={userName} />}
                    {activeTab === "teams" && <TeamOverview papers={papers} todos={todos} experiments={experiments} analyses={analyses} teams={teams} onSaveTeams={handleSaveTeams} />}
                    {activeTab === "calendar" && <CalendarGrid data={[...vacations.map(v => ({ ...v, description: undefined })), ...schedule]} currentUser={userName} types={CALENDAR_TYPES} onToggle={handleCalendarToggle} showYearTotal />}
                    {activeTab === "lectures" && <TimetableView blocks={timetable} onSave={handleTimetableSave} onDelete={handleTimetableDelete} />}
                    {activeTab === "ip" && <IPView patents={ipPatents} onSave={handleSavePatent} onDelete={handleDeletePatent} currentUser={userName} onToggleDiscussion={p => handleSavePatent({ ...p, needsDiscussion: !p.needsDiscussion })} />}
                    {activeTab === "resources" && <ResourceView resources={resources} onSave={handleSaveResource} onDelete={handleDeleteResource} currentUser={userName} />}
                    {activeTab === "ideas" && <IdeasView ideas={ideas} onSave={handleSaveIdea} onDelete={handleDeleteIdea} currentUser={userName} />}
                    {activeTab === "chat" && <IdeasView ideas={chatPosts} onSave={handleSaveChat} onDelete={handleDeleteChat} currentUser={userName} />}
                    {activeTab === "settings" && <SettingsView currentUser={userName} customEmojis={customEmojis} onSaveEmoji={handleSaveEmoji} />}
                    {activeTab.startsWith("memo_") && (() => {
                        const name = activeTab.replace("memo_", "");
                        return <PersonalMemoView memos={personalMemos[name] || []} onSave={m => handleSaveMemo(name, m)} onDelete={id => handleDeleteMemo(name, id)} />;
                    })()}
                </div>
            </div>

            {/* Paper Modal */}
            {paperModal && <PaperFormModal paper={paperModal.paper} onSave={handleSavePaper} onDelete={handleDeletePaper} onClose={() => setPaperModal(null)} currentUser={userName} tagList={paperTagList} />}
        </div>
    );
}
