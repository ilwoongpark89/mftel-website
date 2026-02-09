"use client";

import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_MEMBERS: Record<string, { team: string; role: string; emoji: string }> = {
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
// Module-level aliases (fallback only — prefer MembersContext for emoji display)
const MEMBERS = DEFAULT_MEMBERS;
const MEMBER_NAMES = Object.keys(MEMBERS).filter(k => k !== "박일웅");

// Context for dynamic member data (customEmojis merged)
const MembersContext = createContext<Record<string, { team: string; role: string; emoji: string }>>(DEFAULT_MEMBERS);

type TeamData = { lead: string; members: string[]; color: string; emoji?: string };

const DEFAULT_TEAMS: Record<string, TeamData> = {};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#94a3b8" },
    exp_analysis: { label: "실험·해석", color: "#3b82f6" },
    writing: { label: "작성중", color: "#f59e0b" },
    under_review: { label: "심사중", color: "#10b981" },
    completed: { label: "완료", color: "#059669" },
};
const STATUS_KEYS = ["planning", "exp_analysis", "writing", "under_review"];
// Migration: map old statuses to merged ones
const PAPER_STATUS_MIGRATE = (s: string) => (s === "experiment" || s === "analysis") ? "exp_analysis" : s;
const PAPER_TAGS = ["안전예타", "생애첫", "TES", "액침냉각", "이상유동", "시스템코드", "NTNU", "PCM", "기타"];

const REPORT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#94a3b8" },
    writing: { label: "작성중", color: "#f59e0b" },
    checking: { label: "검토중", color: "#8b5cf6" },
    review: { label: "심사중", color: "#3b82f6" },
    done: { label: "완료", color: "#059669" },
};
const REPORT_STATUS_KEYS = ["planning", "writing", "checking", "review"];
const PRIORITY_ICON: Record<string, string> = { highest: "🔥", high: "🔴", mid: "🟡", low: "🔵", lowest: "⚪" };
const PRIORITY_LABEL: Record<string, string> = { highest: "매우높음", high: "높음", mid: "중간", low: "낮음", lowest: "매우낮음" };
const PRIORITY_KEYS = ["highest", "high", "mid", "low", "lowest"];

const DEFAULT_EQUIPMENT = ["액침냉각", "이상유동", "예연소실", "라이덴프로스트", "모래배터리", "기타"];
const EXP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#94a3b8" },
    preparing: { label: "준비중", color: "#8b5cf6" },
    running: { label: "진행중", color: "#3b82f6" },
    paused_done: { label: "중단", color: "#f97316" },
    completed: { label: "완료", color: "#059669" },
};
const EXP_STATUS_KEYS = ["planning", "preparing", "running", "paused_done"];
const EXP_STATUS_MIGRATE = (s: string) => s === "paused" ? "paused_done" : s;

const CALENDAR_TYPES: Record<string, { label: string; color: string; short: string }> = {
    conference: { label: "학회", color: "#60a5fa", short: "학" },
    trip: { label: "출장", color: "#7dd3fc", short: "출" },
    seminar: { label: "세미나", color: "#67e8f9", short: "세" },
    meeting: { label: "회의", color: "#5eead4", short: "회" },
    vendor: { label: "업체", color: "#6ee7b7", short: "업" },
    other: { label: "기타", color: "#cbd5e1", short: "기" },
    vacation: { label: "휴가", color: "#fca5a5", short: "휴" },
    wfh: { label: "재택", color: "#fdba74", short: "재" },
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
type Paper = { id: number; title: string; journal: string; status: string; assignees: string[]; tags: string[]; deadline: string; progress: number; comments: Comment[]; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string };
type Todo = { id: number; text: string; assignees: string[]; done: boolean; priority: string; deadline: string; progress?: number; needsDiscussion?: boolean; comments?: Comment[] };
type ExperimentLog = { id: number; date: string; author: string; text: string };
type Experiment = { id: number; title: string; equipment: string; status: string; assignees: string[]; goal: string; startDate: string; endDate: string; logs: ExperimentLog[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string };
type Announcement = { id: number; text: string; author: string; date: string; pinned: boolean };
type VacationEntry = { name: string; date: string; type: string };
type ScheduleEvent = { name: string; date: string; type: string; description: string };
type TimetableBlock = { id: number; day: number; startSlot: number; endSlot: number; name: string; students: string[]; color: string };
type ChecklistItem = { id: number; text: string; done: boolean };
type Report = { id: number; title: string; assignees: string[]; creator: string; deadline: string; progress: number; comments: Comment[]; status: string; createdAt: string; checklist: ChecklistItem[]; category?: string; needsDiscussion?: boolean; team?: string };
type DailyTarget = { name: string; date: string; text: string };
type Resource = { id: number; title: string; link: string; nasPath: string; author: string; date: string; comments: Comment[]; needsDiscussion?: boolean };
type IdeaPost = { id: number; title: string; body: string; author: string; date: string; comments: Comment[]; needsDiscussion?: boolean; color?: string; borderColor?: string };
type Memo = { id: number; title: string; content: string; color: string; borderColor?: string; updatedAt: string; needsDiscussion?: boolean; comments?: Comment[] };
type TeamMemoCard = { id: number; title: string; content: string; status: string; color: string; borderColor?: string; author: string; updatedAt: string; comments?: Comment[]; needsDiscussion?: boolean };
type TeamChatMsg = { id: number; author: string; text: string; date: string; imageUrl?: string };
type LabFile = { id: number; name: string; size: number; url: string; type: string; uploader: string; date: string };
type ConferenceTrip = { id: number; title: string; startDate: string; endDate: string; homepage: string; fee: string; participants: string[]; creator: string; createdAt: string; status?: string; comments?: Comment[]; needsDiscussion?: boolean };
type Meeting = { id: number; title: string; goal: string; summary: string; date: string; assignees: string[]; status: string; creator: string; createdAt: string; comments: Comment[]; team?: string; needsDiscussion?: boolean };

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PAPERS: Paper[] = [];
const DEFAULT_TODOS: Todo[] = [];
const DEFAULT_EXPERIMENTS: Experiment[] = [];
const IP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#94a3b8" },
    writing: { label: "작성중", color: "#f59e0b" },
    evaluation: { label: "평가중", color: "#3b82f6" },
    filed: { label: "출원", color: "#059669" },
    completed: { label: "완료", color: "#22c55e" },
};
const IP_STATUS_KEYS = ["planning", "writing", "evaluation", "filed"];

const ANALYSIS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#94a3b8" },
    preparing: { label: "준비중", color: "#8b5cf6" },
    running: { label: "진행중", color: "#3b82f6" },
    paused_done: { label: "중단", color: "#f97316" },
    completed: { label: "완료", color: "#059669" },
};
const ANALYSIS_STATUS_KEYS = ["planning", "preparing", "running", "paused_done"];
const ANALYSIS_STATUS_MIGRATE = (s: string) => s === "paused" ? "paused_done" : s;
const ANALYSIS_TOOLS = ["OpenFOAM", "ANSYS Fluent", "STAR-CCM+", "MARS-K", "CUPID", "GAMMA+", "Python/MATLAB", "기타"];

type Patent = { id: number; title: string; deadline: string; status: string; assignees: string[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string };
type AnalysisLog = { id: number; date: string; author: string; text: string };
type Analysis = { id: number; title: string; tool: string; status: string; assignees: string[]; goal: string; startDate: string; endDate: string; logs: AnalysisLog[]; progress?: number; creator?: string; createdAt?: string; needsDiscussion?: boolean; team?: string };

const DEFAULT_PATENTS: Patent[] = [];
const DEFAULT_TIMETABLE: TimetableBlock[] = [];

// ─── Shared: Multi-select pill helper ────────────────────────────────────────

function PillSelect({ options, selected, onToggle, emojis }: { options: string[]; selected: string[]; onToggle: (v: string) => void; emojis?: Record<string, string> }) {
    return (
        <div className="flex flex-wrap gap-1">
            {options.map(o => (
                <button key={o} type="button" onClick={() => onToggle(o)}
                    className={`px-2 py-0.5 rounded-full text-[12px] font-medium transition-all ${selected.includes(o) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {emojis?.[o] ? `${emojis[o]} ` : ""}{o}
                </button>
            ))}
        </div>
    );
}

// ─── Shared: Drop indicator & kanban reorder helper ─────────────────────────

function calcDropIdx(e: React.DragEvent<HTMLDivElement>, col: string) {
    const cards = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[draggable]'));
    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) { idx = i; break; }
    }
    return { col, idx };
}

function DropLine() {
    return <div className="h-[3px] bg-blue-500 rounded-full mx-1 my-0.5 transition-all" style={{ animation: "dropPulse 1s ease-in-out infinite" }} />;
}

function reorderKanbanItems<T extends { id: number }>(
    allItems: T[],
    draggedItem: T,
    targetStatus: string,
    targetIdx: number,
    getStatus: (item: T) => string,
    setStatus: (item: T, status: string) => T
): T[] {
    const without = allItems.filter(i => i.id !== draggedItem.id);
    const updated = getStatus(draggedItem) !== targetStatus ? setStatus(draggedItem, targetStatus) : draggedItem;
    const colItems = without.filter(i => getStatus(i) === targetStatus);
    // When dragging downward within the same column, the visual index is off by 1
    // because onDragOver sees the column WITH the dragged item still in place
    const origCol = allItems.filter(i => getStatus(i) === targetStatus);
    const origIdx = origCol.findIndex(i => i.id === draggedItem.id);
    let adjusted = targetIdx;
    if (origIdx >= 0 && origIdx < targetIdx) adjusted = targetIdx - 1;
    const clamped = Math.min(adjusted, colItems.length);
    if (colItems.length === 0) return [...without, updated];
    if (clamped >= colItems.length) {
        const pos = without.indexOf(colItems[colItems.length - 1]);
        const result = [...without]; result.splice(pos + 1, 0, updated); return result;
    }
    const pos = without.indexOf(colItems[clamped]);
    const result = [...without]; result.splice(pos, 0, updated); return result;
}

// ─── Shared: Team Filter Bar ─────────────────────────────────────────────────

function TeamFilterBar({ teamNames, selected, onSelect }: { teamNames: string[]; selected: string; onSelect: (team: string) => void }) {
    if (teamNames.length === 0) return null;
    return (
        <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[12px] font-semibold text-slate-400 mr-1">팀:</span>
            {["전체", ...teamNames].map(t => (
                <button key={t} onClick={() => onSelect(t)}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${selected === t ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {t}
                </button>
            ))}
        </div>
    );
}

function TeamSelect({ teamNames, selected, onSelect }: { teamNames: string[]; selected: string; onSelect: (v: string) => void }) {
    if (teamNames.length === 0) return null;
    return (
        <div>
            <label className="text-[12px] font-semibold text-slate-500 block mb-1">소속 팀</label>
            <div className="flex flex-wrap gap-1">
                {teamNames.map(t => (
                    <button key={t} type="button" onClick={() => onSelect(selected === t ? "" : t)}
                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${selected === t ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Paper Components ────────────────────────────────────────────────────────

function PaperFormModal({ paper, onSave, onDelete, onClose, currentUser, tagList, teamNames }: {
    paper: Paper | null; onSave: (p: Paper) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; tagList: string[]; teamNames?: string[];
}) {
    const MEMBERS = useContext(MembersContext);
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

    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return false;
        onSave({ id: paper?.id ?? Date.now(), title, journal, status, assignees, tags, deadline, progress, comments, creator: paper?.creator || currentUser, createdAt: paper?.createdAt || new Date().toLocaleString("ko-KR"), team });
        return true;
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
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">저널</label>
                            <input value={journal} onChange={e => setJournal(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">마감</label>
                            <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 12/31" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {[...STATUS_KEYS, "completed"].map(s => (
                                <button key={s} type="button" onClick={() => setStatus(s)}
                                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                    style={status === s ? { background: STATUS_CONFIG[s].color } : undefined}>
                                    {STATUS_CONFIG[s].label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">참여자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
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
                    {/* Comments */}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[13px] text-slate-700 pr-4">{c.text}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <div className="text-[12px] text-slate-300 py-2">코멘트 없음</div>}
                        </div>
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addComment()} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>
                        {isEdit && onDelete && (
                            <button onClick={() => { onDelete(paper!.id); onClose(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KanbanView({ papers, filter, onClickPaper, onAddPaper, onSavePaper, onReorder, tagList, onSaveTags, teamNames }: { papers: Paper[]; filter: string; onClickPaper: (p: Paper) => void; onAddPaper: () => void; onSavePaper: (p: Paper) => void; onReorder: (list: Paper[]) => void; tagList: string[]; onSaveTags: (list: string[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const [filterTeam, setFilterTeam] = useState("전체");
    const personFiltered = filter === "전체" ? papers : papers.filter(p => p.assignees.includes(filter) || p.tags.some(t => t === filter));
    const filtered = filterTeam === "전체" ? personFiltered : personFiltered.filter(p => p.team === filterTeam);
    const [showTagMgr, setShowTagMgr] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Paper | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const completedPapers = filtered.filter(p => PAPER_STATUS_MIGRATE(p.status) === "completed");
    const kanbanFiltered = filtered.filter(p => PAPER_STATUS_MIGRATE(p.status) !== "completed");
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <button onClick={onAddPaper} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600 transition-colors">+ 논문 등록</button>
                <button onClick={() => setShowTagMgr(!showTagMgr)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-200">🏷️ 논문 태그 관리</button>
                <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedPapers.length})</button>
            </div>
            {teamNames && teamNames.length > 0 && <TeamFilterBar teamNames={teamNames} selected={filterTeam} onSelect={setFilterTeam} />}
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
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={e => { if (e.key === "Enter" && newTag.trim() && !tagList.includes(newTag.trim())) { onSaveTags([...tagList, newTag.trim()]); setNewTag(""); } }} />
                        <button onClick={() => { if (newTag.trim() && !tagList.includes(newTag.trim())) { onSaveTags([...tagList, newTag.trim()]); setNewTag(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            {!showCompleted && (
            <div className="flex gap-3 pb-2">
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
                                <span className="text-[14px] font-bold text-slate-800">{st.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((p, cardIdx) => (
                                    <div key={p.id}>
                                    {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = p; setDraggedId(p.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === p.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        onClick={() => onClickPaper(p)}
                                        className={`bg-white rounded-lg p-3 cursor-grab hover:shadow-md transition-all overflow-hidden ${draggedId === p.id ? "opacity-40 scale-95" : ""} ${p.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${st.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!p.needsDiscussion} onChange={() => onSavePaper({ ...p, needsDiscussion: !p.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[11px] font-medium ${p.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words overflow-hidden">{p.title}</div>
                                        {p.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{p.team}</span>}
                                        {p.journal !== "TBD" && <div className="text-[12px] text-slate-500 italic mb-1 truncate">{p.journal}</div>}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${p.progress}%` }} />
                                            </div>
                                            <span className="text-[11px] font-semibold text-blue-500">{p.progress}%</span>
                                        </div>
                                        <div className="flex gap-1 flex-wrap mb-1.5">
                                            {p.tags.map(t => <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t}</span>)}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {p.assignees.slice(0, 3).map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                                {p.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{p.assignees.length - 3}</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {p.comments.length > 0 && <span className="text-[11px] text-slate-400">💬{p.comments.length}</span>}
                                                {p.deadline && <span className="text-[11px] text-red-500 font-semibold">~{p.deadline}</span>}
                                            </div>
                                        </div>
                                        {p.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
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
                <div className="grid grid-cols-3 gap-3">
                    {completedPapers.map(p => (
                        <div key={p.id} onClick={() => onClickPaper(p)}
                            className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-emerald-200"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{p.title}</div>
                            {p.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{p.team}</span>}
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
                            {p.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedPapers.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 논문이 없습니다</div>}
                </div>
            )}
        </div>
    );
}

// ─── Report Components ───────────────────────────────────────────────────────

function ReportFormModal({ report, initialCategory, onSave, onDelete, onClose, currentUser, teamNames }: {
    report: Report | null; initialCategory?: string; onSave: (r: Report) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; teamNames?: string[];
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
    const [category] = useState(report?.category || initialCategory || "계획서");
    const [team, setTeam] = useState(report?.team || "");
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const doneCount = checklist.filter(c => c.done).length;
    const autoProgress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

    const handleSave = () => {
        if (!title.trim()) return false;
        onSave({ id: report?.id ?? Date.now(), title, assignees, creator: report?.creator || currentUser, deadline, progress: autoProgress, comments, status, createdAt: report?.createdAt || new Date().toLocaleDateString("ko-KR"), checklist, category, team });
        return true;
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
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">기한</label>
                            <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 3/15" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                            <div className="flex gap-1">
                                {[...REPORT_STATUS_KEYS, "done"].map(s => {
                                    const cfg = REPORT_STATUS_CONFIG[s];
                                    return (
                                        <button key={s} type="button" onClick={() => setStatus(s)}
                                            className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                            style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    {teamNames && <TeamSelect teamNames={teamNames} selected={team} onSelect={setTeam} />}
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
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addChecklistItem()} />
                            <button onClick={addChecklistItem} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">추가</button>
                        </div>
                    </div>
                    {/* Comments */}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="text-[13px] text-slate-700 pr-4">{c.text}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <div className="text-[12px] text-slate-300 py-2">코멘트 없음</div>}
                        </div>
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addComment()} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(report!.id); onClose(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportView({ reports, currentUser, onSave, onDelete, onToggleDiscussion, onReorder, teamNames }: { reports: Report[]; currentUser: string; onSave: (r: Report) => void; onDelete: (id: number) => void; onToggleDiscussion: (r: Report) => void; onReorder: (list: Report[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Report | null>(null);
    const [addCategory, setAddCategory] = useState<string | null>(null);
    const [filterTeam, setFilterTeam] = useState("전체");
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Report | null>(null);
    const filteredReports = filterTeam === "전체" ? reports : reports.filter(r => r.team === filterTeam);
    const [showCompleted, setShowCompleted] = useState(false);
    const completedReports = filteredReports.filter(r => r.status === "done");
    const kanbanFilteredReports = filteredReports.filter(r => r.status !== "done");
    return (
        <div>
            <div className="mb-3 flex gap-2">
                <button onClick={() => setAddCategory("계획서")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 계획서 등록</button>
                <button onClick={() => setAddCategory("보고서")} className="px-4 py-2 bg-violet-500 text-white rounded-lg text-[14px] font-medium hover:bg-violet-600">+ 보고서 등록</button>
                <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedReports.length})</button>
            </div>
            {teamNames && teamNames.length > 0 && <TeamFilterBar teamNames={teamNames} selected={filterTeam} onSelect={setFilterTeam} />}
            {!showCompleted && (
            <div className="flex gap-3 pb-2">
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
                                <span className="text-[14px] font-bold text-slate-800">{cfg.label}</span>
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
                                            onClick={() => setEditing(r)}
                                            className={`bg-white rounded-lg p-3 cursor-grab hover:shadow-md transition-all overflow-hidden ${draggedId === r.id ? "opacity-40 scale-95" : ""} ${r.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                            style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onToggleDiscussion(r)} className="w-3 h-3 accent-orange-500" />
                                                <span className={`text-[11px] font-medium ${r.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                            </label>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                {r.category && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{r.category}</span>}
                                                {r.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{r.team}</span>}
                                                <span className="text-[14px] font-semibold text-slate-800 leading-snug break-words">{r.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${r.progress}%` }} />
                                                </div>
                                                <span className="text-[11px] font-semibold text-blue-500">{r.progress}%</span>
                                            </div>
                                            {cl.length > 0 && (
                                                <div className="space-y-0.5 mb-1.5">
                                                    {cl.slice(0, 3).map(item => (
                                                        <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                                                            <span className={item.done ? "text-emerald-500" : "text-slate-300"}>{item.done ? "✓" : "○"}</span>
                                                            <span className={`truncate ${item.done ? "line-through text-slate-400" : "text-slate-600"}`}>{item.text}</span>
                                                        </div>
                                                    ))}
                                                    {cl.length > 3 && <div className="text-[10px] text-slate-400 pl-4">+{cl.length - 3}개 더</div>}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-1 flex-wrap">
                                                    {r.assignees.slice(0, 3).map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                                    {r.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{r.assignees.length - 3}</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {r.comments.length > 0 && <span className="text-[11px] text-slate-400">💬{r.comments.length}</span>}
                                                    {r.deadline && <span className="text-[11px] text-red-500 font-semibold">~{r.deadline}</span>}
                                                </div>
                                            </div>
                                            {r.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[r.creator]?.emoji || ""}{r.creator}{r.createdAt ? ` · ${r.createdAt}` : ""}</div>}
                                        </div>
                                        </div>
                                    );
                                })}
                                {dropTarget?.col === status && dropTarget?.idx === col.length && <DropLine />}
                                {col.length === 0 && <div className="text-[12px] text-slate-300 text-center py-6">—</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
            {showCompleted && (
                <div className="grid grid-cols-3 gap-3">
                    {completedReports.map(r => (
                        <div key={r.id} onClick={() => setEditing(r)}
                            className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-emerald-200"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                {r.category && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{r.category}</span>}
                                {r.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{r.team}</span>}
                            </div>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{r.title}</div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {r.assignees.slice(0, 3).map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                    {r.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{r.assignees.length - 3}</span>}
                                </div>
                                {r.deadline && <span className="text-[11px] text-red-500 font-semibold">~{r.deadline}</span>}
                            </div>
                            {r.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[r.creator]?.emoji || ""}{r.creator}{r.createdAt ? ` · ${r.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedReports.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 계획서/보고서가 없습니다</div>}
                </div>
            )}
            {addCategory && <ReportFormModal report={null} initialCategory={addCategory} onSave={r => { onSave(r); setAddCategory(null); }} onClose={() => setAddCategory(null)} currentUser={currentUser} teamNames={teamNames} />}
            {editing && <ReportFormModal report={editing} onSave={r => { onSave(r); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} teamNames={teamNames} />}
        </div>
    );
}

// ─── Dispatch Panel ──────────────────────────────────────────────────────────

function DispatchPanel({ dispatches, currentUser, onSave, onDelete }: {
    dispatches: Array<{ id: number; name: string; start: string; end: string; description: string }>;
    currentUser: string;
    onSave?: (d: { id: number; name: string; start: string; end: string; description: string }) => void;
    onDelete?: (id: number) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState(currentUser);
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [desc, setDesc] = useState("");
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();
    const active = dispatches.filter(d => d.end >= todayStr).sort((a, b) => a.start.localeCompare(b.start));
    const openEdit = (d: { id: number; name: string; start: string; end: string; description: string }) => {
        setEditId(d.id); setName(d.name); setStart(d.start); setEnd(d.end); setDesc(d.description); setShowForm(true);
    };
    const reset = () => { setEditId(null); setName(currentUser); setStart(""); setEnd(""); setDesc(""); setShowForm(false); };
    const submit = () => {
        if (!name || !start || !end) return;
        onSave?.({ id: editId || Date.now(), name, start, end, description: desc });
        reset();
    };
    return (
        <div className="mt-2 p-2.5 rounded-lg border border-violet-200 bg-violet-50/50">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-violet-700">🟣 파견 현황</span>
                {currentUser === "박일웅" && !showForm && (
                    <button onClick={() => setShowForm(true)} className="text-[11px] px-2 py-0.5 rounded bg-violet-100 text-violet-600 hover:bg-violet-200">+ 추가</button>
                )}
            </div>
            {active.length > 0 ? (
                <div className="flex flex-col gap-1">
                    {active.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-[12px] px-2 py-1 rounded bg-white border border-violet-100">
                            <div>
                                <span className="font-medium text-violet-800">{MEMBERS[d.name]?.emoji} {d.name}</span>
                                <span className="text-slate-400 ml-1.5">{d.start.slice(5)} ~ {d.end.slice(5)}</span>
                                {d.description && <span className="text-slate-500 ml-1">· {d.description}</span>}
                            </div>
                            {currentUser === "박일웅" && (
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => openEdit(d)} className="text-[11px] text-violet-500 hover:text-violet-700">수정</button>
                                    <button onClick={() => onDelete?.(d.id)} className="text-[11px] text-red-400 hover:text-red-600">삭제</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : !showForm && (
                <div className="text-[12px] text-slate-400">파견 중인 인원 없음</div>
            )}
            {showForm && (
                <div className="mt-1.5 p-2 rounded bg-white border border-violet-200 space-y-1.5">
                    <select value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-[13px]">
                        {Object.keys(MEMBERS).filter(k => k !== "박일웅").map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <div className="flex gap-1">
                        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1 text-[12px]" />
                        <span className="text-slate-400 text-[12px] self-center">~</span>
                        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1 text-[12px]" />
                    </div>
                    <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="파견처" className="w-full border border-slate-200 rounded px-2 py-1 text-[13px]" />
                    <div className="flex justify-end gap-1.5">
                        <button onClick={reset} className="text-[12px] text-slate-400 px-2 py-0.5">취소</button>
                        <button onClick={submit} className="text-[12px] text-white bg-violet-500 rounded px-2 py-0.5 font-medium">{editId ? "수정" : "추가"}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Vacation View ───────────────────────────────────────────────────────────

function CalendarGrid({ data, currentUser, types, onToggle, dispatches, onDispatchSave, onDispatchDelete }: {
    data: Array<{ name: string; date: string; type: string; description?: string }>;
    currentUser: string;
    types: Record<string, { label: string; color: string; short: string }>;
    onToggle: (name: string, date: string, type: string | null, desc?: string) => void;
    dispatches?: Array<{ id: number; name: string; start: string; end: string; description: string }>;
    onDispatchSave?: (d: { id: number; name: string; start: string; end: string; description: string }) => void;
    onDispatchDelete?: (id: number) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const isPI = currentUser === "박일웅";
    const [month, setMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
    const [selType, setSelType] = useState(Object.keys(types)[0]);
    const [editCell, setEditCell] = useState<{ name: string; date: string; existing?: { type: string; description?: string } } | null>(null);
    const [editDesc, setEditDesc] = useState("");
    // Drag selection state
    const [dragName, setDragName] = useState<string | null>(null);
    const [dragDates, setDragDates] = useState<string[]>([]);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const isDragging = useRef(false);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(month.y, month.m, i + 1);
        return { date: i + 1, dow: d.getDay(), str: `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}` };
    });
    const dayL = ["일", "월", "화", "수", "목", "금", "토"];
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();
    const monthDates = new Set(days.map(d => d.str));
    const getEntry = (name: string, dateStr: string) => data.find(v => v.name === name && v.date === dateStr);
    const countMonth = (name: string) => data.filter(v => v.name === name && monthDates.has(v.date) && (v.type === "vacation" || v.type === "wfh")).length;
    const countYear = (name: string) => data.filter(v => v.name === name && v.date.startsWith(String(month.y)) && (v.type === "vacation" || v.type === "wfh")).length;
    const isDispatchedOn = (name: string, dateStr: string) => (dispatches || []).some(d => d.name === name && d.start <= dateStr && d.end >= dateStr);
    const isDispatched = (name: string) => isDispatchedOn(name, todayStr);

    const scheduleTypeKeys = Object.keys(types).filter(k => k !== "vacation" && k !== "wfh");

    return (
        <div>
            <div className="flex items-center mb-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => setMonth(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { ...p, m: p.m - 1 })} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[14px]">◀</button>
                    <span className="text-[15px] font-bold text-slate-800 min-w-[120px] text-center">{month.y}년 {month.m + 1}월</span>
                    <button onClick={() => setMonth(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { ...p, m: p.m + 1 })} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[14px]">▶</button>
                    <button onClick={() => { const n = new Date(); setMonth({ y: n.getFullYear(), m: n.getMonth() }); }} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[12px] font-medium hover:bg-slate-200 ml-1">오늘</button>
                </div>
            </div>
            <div className="flex gap-3 items-start">
            <div className="shrink-0 relative" onMouseLeave={() => { if (isDragging.current) { isDragging.current = false; setDragName(null); setDragDates([]); setDragStart(null); } }}>
                <div className="absolute right-0 -top-5 flex gap-2 items-center z-10">
                    {Object.entries(types).filter(([k]) => scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                        <div key={k} className="flex items-center gap-0.5">
                            <span className="w-3 h-2.5 rounded" style={{ background: vt.color }} />
                            <span className="text-[11px] text-slate-500">{vt.label}</span>
                        </div>
                    ))}
                    <span className="text-slate-300 text-[11px]">|</span>
                    {Object.entries(types).filter(([k]) => !scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                        <div key={k} className="flex items-center gap-0.5">
                            <span className="w-3 h-2.5 rounded" style={{ background: vt.color }} />
                            <span className="text-[11px] text-slate-500">{vt.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-0.5">
                        <span className="w-3 h-2.5 rounded" style={{ background: "#a78bfa" }} />
                        <span className="text-[11px] text-slate-500">파견</span>
                    </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="border-collapse" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                        <col style={{ width: "68px" }} />
                        {days.map(d => <col key={d.date} style={{ width: "28px" }} />)}
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-1 py-2 text-center text-[13px] font-semibold text-slate-600 whitespace-nowrap">이름</th>
                            {days.map(d => {
                                const we = d.dow === 0 || d.dow === 6;
                                const td = d.str === todayStr;
                                const sel = d.str === selectedDate;
                                return (
                                    <th key={d.date} className={`border-b border-slate-200 px-0 py-1 text-center cursor-pointer hover:bg-blue-50 transition-colors ${sel ? "bg-amber-50 ring-1 ring-inset ring-amber-300" : td ? "bg-blue-50" : we ? "bg-slate-50/80" : "bg-white"}`}
                                        onClick={() => setSelectedDate(sel ? null : d.str)}>
                                        <div className={`text-[11px] leading-tight ${we ? (d.dow === 0 ? "text-red-400" : "text-blue-400") : "text-slate-400"}`}>{dayL[d.dow]}</div>
                                        <div className={`text-[13px] font-semibold leading-tight ${sel ? "text-amber-700" : td ? "text-blue-600" : we ? (d.dow === 0 ? "text-red-500" : "text-blue-500") : "text-slate-700"}`}>{d.date}</div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* 중요/공통 일정 rows – 박일웅만 편집 가능 */}
                        {["중요일정", "공통일정"].map(label => {
                            const canEdit = currentUser === "박일웅";
                            const entryFor = (ds: string) => data.find(v => v.name === label && v.date === ds);
                            const inDragRow = dragName === label;
                            return (
                                <tr key={label} className="bg-amber-50/40 hover:bg-amber-50/70">
                                    <td className="sticky left-0 z-10 border-r border-b border-amber-200/60 px-1 py-1.5 text-[12px] text-center whitespace-nowrap bg-amber-50 font-semibold text-amber-700">
                                        {label === "중요일정" ? "⭐ 중요" : "👥 공통"}
                                    </td>
                                    {days.map((d, di) => {
                                        const entry = entryFor(d.str);
                                        const we = d.dow === 0 || d.dow === 6;
                                        const td = d.str === todayStr;
                                        const vt = entry ? types[entry.type] : null;
                                        const inDrag = inDragRow && dragDates.includes(d.str);
                                        return (
                                            <td key={d.date}
                                                className={`border-b border-amber-100/60 text-center py-0.5 px-0 select-none ${td ? "bg-blue-50/50" : we ? "bg-slate-50/50" : ""} ${canEdit ? "cursor-pointer" : ""} ${inDrag ? "bg-amber-100" : ""}`}
                                                onMouseDown={() => {
                                                    if (!canEdit) return;
                                                    if (entry) { setSelType(entry.type); setEditDesc(entry.description || ""); setEditCell({ name: label, date: d.str, existing: { type: entry.type, description: entry.description } }); return; }
                                                    isDragging.current = true;
                                                    setDragName(label);
                                                    setDragStart(di);
                                                    setDragDates([d.str]);
                                                }}
                                                onMouseEnter={() => {
                                                    if (!isDragging.current || dragName !== label || dragStart === null) return;
                                                    const lo = Math.min(dragStart, di);
                                                    const hi = Math.max(dragStart, di);
                                                    setDragDates(days.slice(lo, hi + 1).map(x => x.str));
                                                }}
                                                onMouseUp={() => {
                                                    if (!isDragging.current || dragName !== label) { isDragging.current = false; setDragName(null); setDragDates([]); setDragStart(null); return; }
                                                    isDragging.current = false;
                                                    const dates = [...dragDates].filter(dt => !entryFor(dt));
                                                    setDragName(null); setDragDates([]); setDragStart(null);
                                                    if (dates.length === 0) return;
                                                    setEditCell({ name: label, date: dates.join(",") }); setEditDesc("");
                                                }}>
                                                {vt ? (
                                                    <div className="mx-auto w-[24px] h-[22px] rounded flex items-center justify-center text-[10.5px] font-bold text-white hover:scale-110 transition-transform"
                                                        style={{ background: vt.color }} title={entry?.description || vt.label}>{vt.short}</div>
                                                ) : canEdit ? (
                                                    <div className={`mx-auto w-[22px] h-[20px] rounded flex items-center justify-center ${inDrag ? "bg-amber-200" : "opacity-0 hover:opacity-100 bg-amber-100"} transition-opacity`}>
                                                        <span className="text-[10px] text-amber-300">+</span>
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {MEMBER_NAMES.map(name => {
                            const isMe = name === currentUser;
                            const canEdit = isMe || isPI;
                            const dispatched = isDispatched(name);
                            return (
                                <tr key={name} className={`${isMe ? "bg-blue-50/30" : ""} hover:bg-slate-50/50`}>
                                    <td className={`sticky left-0 z-10 border-r border-b border-slate-100 px-1 py-1.5 text-[13px] text-center whitespace-nowrap overflow-hidden ${dispatched ? "bg-violet-100/80 font-medium text-violet-800" : isMe ? "bg-blue-50 font-semibold text-slate-800" : "bg-white text-slate-600"}`}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </td>
                                    {days.map((d, di) => {
                                        const entry = getEntry(name, d.str);
                                        const we = d.dow === 0 || d.dow === 6;
                                        const td = d.str === todayStr;
                                        const vt = entry ? types[entry.type] : null;
                                        const inDrag = dragName === name && dragDates.includes(d.str);
                                        const cellDispatched = isDispatchedOn(name, d.str);
                                        return (
                                            <td key={d.date}
                                                className={`border-b border-slate-100 text-center py-0.5 px-0 select-none ${cellDispatched ? "bg-violet-100/60" : td ? "bg-blue-50/50" : we ? "bg-slate-50/50" : ""} ${canEdit ? "cursor-pointer" : ""} ${inDrag ? "bg-blue-100" : ""}`}
                                                onMouseDown={() => {
                                                    if (!canEdit) return;
                                                    if (entry) { setSelType(entry.type); setEditDesc(entry.description || ""); setEditCell({ name, date: d.str, existing: { type: entry.type, description: entry.description } }); return; }
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
                                                    <div className="mx-auto w-[24px] h-[22px] rounded flex items-center justify-center text-[10.5px] font-bold text-white hover:scale-110 transition-transform"
                                                        style={{ background: vt.color }} title={entry?.description || vt.label}>{vt.short}</div>
                                                ) : canEdit ? (
                                                    <div className={`mx-auto w-[22px] h-[20px] rounded flex items-center justify-center ${inDrag ? "bg-blue-200" : "opacity-0 hover:opacity-100 bg-slate-100"} transition-opacity`}>
                                                        <span className="text-[10px] text-slate-300">+</span>
                                                    </div>
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
            </div>
            {/* Right sidebar – week summary (based on selected or current date) */}
            <div className="flex-1 min-w-[200px] hidden lg:block">
                {(() => {
                    // 기준일: 선택한 날짜 또는 오늘
                    const baseDate = selectedDate ? new Date(selectedDate) : new Date();
                    const dow = baseDate.getDay();
                    const monday = new Date(baseDate);
                    monday.setDate(baseDate.getDate() - ((dow === 0 ? 7 : dow) - 1));
                    const weekDates: string[] = [];
                    for (let i = 0; i < 5; i++) {
                        const dd = new Date(monday);
                        dd.setDate(monday.getDate() + i);
                        weekDates.push(`${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`);
                    }
                    const weekItems = data.filter(v => weekDates.includes(v.date));
                    const monLabel = `${monday.getMonth() + 1}/${monday.getDate()}`;
                    const fri = new Date(monday); fri.setDate(monday.getDate() + 4);
                    const friLabel = `${fri.getMonth() + 1}/${fri.getDate()}`;
                    const isThisWeek = !selectedDate;
                    const bgColor = isThisWeek ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200";
                    const titleColor = isThisWeek ? "text-amber-700" : "text-blue-700";
                    const dayTitleColor = isThisWeek ? "text-amber-600" : "text-blue-600";
                    const cardBorder = isThisWeek ? "border-amber-200 text-amber-800" : "border-blue-200 text-blue-800";
                    const weekLabel = isThisWeek ? "이번 주" : `${monLabel} ~ ${friLabel} 주`;
                    return (
                        <div className={`p-3 rounded-lg border sticky top-0 ${bgColor}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[14px] font-semibold ${titleColor}`}>📋 {weekLabel} ({monLabel} ~ {friLabel})</span>
                                {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-[11px] text-blue-400 hover:text-blue-600">✕ 이번 주</button>}
                            </div>
                            {weekItems.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {weekDates.map(dateStr => {
                                        const dayItems = weekItems.filter(v => v.date === dateStr);
                                        if (dayItems.length === 0) return null;
                                        const dd = new Date(dateStr);
                                        const dayLabel = `${dd.getMonth() + 1}/${dd.getDate()}(${dayL[dd.getDay()]})`;
                                        const isSelected = dateStr === selectedDate;
                                        return (
                                            <div key={dateStr}>
                                                <div className={`text-[11px] font-semibold ${dayTitleColor} mt-1 mb-0.5 ${isSelected ? "underline underline-offset-2" : ""}`}>{dayLabel}</div>
                                                {dayItems.map(v => {
                                                    const vt = types[v.type];
                                                    return <div key={`${v.name}-${v.type}-${v.date}`} className={`text-[13px] px-2 py-1 rounded-md bg-white border ${cardBorder} mb-0.5`}>
                                                        <span className="font-medium">{MEMBERS[v.name]?.emoji || "⭐"}{v.name}</span>
                                                        <span className="text-[12px] text-slate-500 ml-1">{vt?.label}{v.description ? `: ${v.description}` : ""}</span>
                                                    </div>;
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-[13px] text-slate-400">이번 주 일정이 없습니다</div>
                            )}
                        </div>
                    );
                })()}
                {/* 파견 관리 패널 – 모두 열람, 박일웅만 편집 */}
                <DispatchPanel dispatches={dispatches || []} currentUser={currentUser} onSave={onDispatchSave} onDelete={onDispatchDelete} />
            </div>
            </div>
            {/* Inline event form for schedule mode */}
            {editCell && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditCell(null)}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[14px] font-bold text-slate-800 mb-3">
                            {editCell.existing ? `${editCell.date} 수정` : editCell.date.includes(",") ? `${editCell.date.split(",").length}일 추가` : `${editCell.date} 추가`}
                        </h4>
                        <div className="mb-3">
                            <div className="flex flex-wrap gap-1 mb-1">
                                {Object.entries(types).filter(([k]) => scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                                    <button key={k} onClick={() => setSelType(k)}
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${selType === k ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={selType === k ? { background: vt.color } : undefined}>{vt.label}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(types).filter(([k]) => !scheduleTypeKeys.includes(k)).map(([k, vt]) => (
                                    <button key={k} onClick={() => setSelType(k)}
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${selType === k ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={selType === k ? { background: vt.color } : undefined}>{vt.label}</button>
                                ))}
                            </div>
                        </div>
                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="내용입력" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <div className="flex justify-between">
                            {editCell.existing ? (
                                <button onClick={() => { onToggle(editCell.name, editCell.date, null); setEditCell(null); }}
                                    className="px-3 py-1.5 text-[13px] text-red-500 hover:bg-red-50 rounded-lg font-medium">삭제</button>
                            ) : <div />}
                            <div className="flex gap-2">
                                <button onClick={() => setEditCell(null)} className="px-3 py-1.5 text-[13px] text-slate-500">취소</button>
                                <button onClick={() => { onToggle(editCell.name, editCell.date, selType, editDesc); setEditCell(null); }}
                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium">{editCell.existing ? "수정" : "추가"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
                        const dayBlocks = blocks.filter(b => b.day === dayIdx);
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
                                    {/* Blocks */}
                                    {dayBlocks.map(b => (
                                        <div key={b.id}
                                            className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-white text-[11px] font-medium leading-tight overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10"
                                            style={{ top: b.startSlot * CELL_H + 1, height: (b.endSlot - b.startSlot) * CELL_H - 2, background: b.color }}
                                            onClick={() => { setEditBlock(b); setFormName(b.name); setFormStudents(b.students); }}>
                                            <div className="truncate font-semibold">{b.name}</div>
                                            {(b.endSlot - b.startSlot) >= 2 && <div className="text-[10px] opacity-80">{slotToTime(b.startSlot)}-{slotToTime(b.endSlot)}</div>}
                                            {(b.endSlot - b.startSlot) >= 4 && b.students.length > 0 && <div className="text-[10px] opacity-70 mt-0.5 truncate">{b.students.join(", ")}</div>}
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
                        <p className="text-[12px] text-slate-400 mb-3">
                            {DAY_LABELS[showForm?.day ?? editBlock?.day ?? 0]} {slotToTime(showForm?.start ?? editBlock?.startSlot ?? 0)} ~ {slotToTime(showForm?.end ?? editBlock?.endSlot ?? 0)}
                        </p>
                        <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="수업 이름" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
}

// ─── Experiment Components ───────────────────────────────────────────────────

function ExperimentFormModal({ experiment, onSave, onDelete, onClose, currentUser, equipmentList, teamNames }: {
    experiment: Experiment | null; onSave: (e: Experiment) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; equipmentList: string[]; teamNames?: string[];
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
    const [team, setTeam] = useState(experiment?.team || "");
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return false;
        onSave({ id: experiment?.id ?? Date.now(), title, equipment, status, assignees, goal, startDate, endDate, logs, progress, creator: experiment?.creator || currentUser, createdAt: experiment?.createdAt || new Date().toLocaleString("ko-KR"), team });
        return true;
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
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">실험 제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">실험 장치</label>
                        <div className="flex flex-wrap gap-1">
                            {equipmentList.map(eq => (
                                <button key={eq} type="button" onClick={() => setEquipment(eq)}
                                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${equipment === eq ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{eq}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">목표</label>
                        <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="실험 목표를 작성하세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">달성도 {progress}%</label>
                        <input type="range" min={0} max={100} step={5} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {[...EXP_STATUS_KEYS, "completed"].map(s => {
                                const cfg = EXP_STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    {teamNames && <TeamSelect teamNames={teamNames} selected={team} onSelect={setTeam} />}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">시작일</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">종료일</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                    </div>
                    {/* Daily logs */}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">실험 일지 ({logs.length})</label>
                        <div className="flex gap-2 mb-2">
                            <input value={newLog} onChange={e => setNewLog(e.target.value)} placeholder="오늘의 실험 내용을 기록하세요..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addLog()} />
                            <button onClick={addLog} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">기록</button>
                        </div>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {logs.map(l => (
                                <div key={l.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setLogs(logs.filter(x => x.id !== l.id))}
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
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(experiment!.id); onClose(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExperimentView({ experiments, onSave, onDelete, currentUser, equipmentList, onSaveEquipment, onToggleDiscussion, onReorder, teamNames }: { experiments: Experiment[]; onSave: (e: Experiment) => void; onDelete: (id: number) => void; currentUser: string; equipmentList: string[]; onSaveEquipment: (list: string[]) => void; onToggleDiscussion: (e: Experiment) => void; onReorder: (list: Experiment[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Experiment | null>(null);
    const [adding, setAdding] = useState(false);
    const [showEqMgr, setShowEqMgr] = useState(false);
    const [newEq, setNewEq] = useState("");
    const [filterTeam, setFilterTeam] = useState("전체");
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Experiment | null>(null);
    const filteredExperiments = filterTeam === "전체" ? experiments : experiments.filter(e => e.team === filterTeam);
    const [showCompleted, setShowCompleted] = useState(false);
    const completedExperiments = filteredExperiments.filter(e => EXP_STATUS_MIGRATE(e.status) === "completed");
    const kanbanFilteredExperiments = filteredExperiments.filter(e => EXP_STATUS_MIGRATE(e.status) !== "completed");
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <button onClick={() => setAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 실험 등록</button>
                <button onClick={() => setShowEqMgr(!showEqMgr)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-200">🔧 실험 장치 관리</button>
                <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedExperiments.length})</button>
            </div>
            {showEqMgr && (
                <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[13px] font-semibold text-slate-600 mb-2">실험 장치 목록</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {equipmentList.map(eq => (
                            <span key={eq} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[12px] text-slate-700">
                                {eq}
                                <button onClick={() => onSaveEquipment(equipmentList.filter(e => e !== eq))} className="text-slate-400 hover:text-red-500 text-[11px]">✕</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={newEq} onChange={e => setNewEq(e.target.value)} placeholder="새 장치 이름"
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={e => { if (e.key === "Enter" && newEq.trim() && !equipmentList.includes(newEq.trim())) { onSaveEquipment([...equipmentList, newEq.trim()]); setNewEq(""); } }} />
                        <button onClick={() => { if (newEq.trim() && !equipmentList.includes(newEq.trim())) { onSaveEquipment([...equipmentList, newEq.trim()]); setNewEq(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            {teamNames && teamNames.length > 0 && <TeamFilterBar teamNames={teamNames} selected={filterTeam} onSelect={setFilterTeam} />}
            {!showCompleted && (
            <div className="flex gap-3 pb-2">
                {EXP_STATUS_KEYS.map(status => {
                    const col = kanbanFilteredExperiments.filter(e => EXP_STATUS_MIGRATE(e.status) === status);
                    const cfg = EXP_STATUS_CONFIG[status];
                    return (
                        <div key={status} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDropTarget(calcDropIdx(e, status)); }}
                            onDragLeave={() => {}}
                            onDrop={() => { if (dragItem.current && dropTarget) { const reordered = reorderKanbanItems(experiments, dragItem.current, status, dropTarget.idx, e => EXP_STATUS_MIGRATE(e.status), (e, s) => ({ ...e, status: s })); onReorder(reordered); } dragItem.current = null; setDraggedId(null); setDropTarget(null); }}>
                            <div className="flex items-center gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${cfg.color}` }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
                                <span className="text-[14px] font-bold text-slate-800">{cfg.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((exp, cardIdx) => (
                                    <div key={exp.id}>
                                    {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = exp; setDraggedId(exp.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === exp.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        onClick={() => setEditing(exp)}
                                        className={`bg-white rounded-lg p-3 cursor-grab hover:shadow-md transition-all overflow-hidden ${draggedId === exp.id ? "opacity-40 scale-95" : ""} ${exp.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!exp.needsDiscussion} onChange={() => onToggleDiscussion(exp)} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[11px] font-medium ${exp.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{exp.title}</div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[11px] text-slate-500">🔧 {exp.equipment}</span>
                                            {exp.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{exp.team}</span>}
                                        </div>
                                        {(exp.progress ?? 0) > 0 && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${exp.progress}%` }} /></div>
                                                <span className="text-[11px] font-semibold text-blue-500">{exp.progress}%</span>
                                            </div>
                                        )}
                                        {exp.goal && <div className="text-[11px] text-slate-400 mb-1.5 line-clamp-2">{exp.goal}</div>}
                                        {(exp.startDate || exp.endDate) && (
                                            <div className="text-[11px] text-slate-400 mb-1.5">📅 {exp.startDate} ~ {exp.endDate}</div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {exp.assignees.slice(0, 3).map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                                {exp.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{exp.assignees.length - 3}</span>}
                                            </div>
                                            {exp.logs.length > 0 && <span className="text-[11px] text-slate-400">📝{exp.logs.length}</span>}
                                        </div>
                                        {exp.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[exp.creator]?.emoji || ""}{exp.creator}{exp.createdAt ? ` · ${exp.createdAt}` : ""}</div>}
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
                <div className="grid grid-cols-3 gap-3">
                    {completedExperiments.map(exp => (
                        <div key={exp.id} onClick={() => setEditing(exp)}
                            className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-emerald-200"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{exp.title}</div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] text-slate-500">🔧 {exp.equipment}</span>
                                {exp.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{exp.team}</span>}
                            </div>
                            {exp.goal && <div className="text-[11px] text-slate-400 mb-1.5 line-clamp-2">{exp.goal}</div>}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {exp.assignees.slice(0, 3).map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                    {exp.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{exp.assignees.length - 3}</span>}
                                </div>
                                {exp.logs.length > 0 && <span className="text-[11px] text-slate-400">📝{exp.logs.length}</span>}
                            </div>
                            {exp.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[exp.creator]?.emoji || ""}{exp.creator}{exp.createdAt ? ` · ${exp.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedExperiments.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 실험이 없습니다</div>}
                </div>
            )}
            {adding && <ExperimentFormModal experiment={null} onSave={e => { onSave(e); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} equipmentList={equipmentList} teamNames={teamNames} />}
            {editing && <ExperimentFormModal experiment={editing} onSave={e => { onSave(e); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} equipmentList={equipmentList} teamNames={teamNames} />}
        </div>
    );
}

// ─── Analysis Components ────────────────────────────────────────────────────

function AnalysisFormModal({ analysis, onSave, onDelete, onClose, currentUser, toolList, teamNames }: {
    analysis: Analysis | null; onSave: (a: Analysis) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; toolList: string[]; teamNames?: string[];
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
    const [team, setTeam] = useState(analysis?.team || "");
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return false;
        onSave({ id: analysis?.id ?? Date.now(), title, tool, status, assignees, goal, startDate, endDate, logs, progress, creator: analysis?.creator || currentUser, createdAt: analysis?.createdAt || new Date().toLocaleString("ko-KR"), team });
        return true;
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
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">해석 제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    {teamNames && <TeamSelect teamNames={teamNames} selected={team} onSelect={setTeam} />}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">시작일</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 block mb-1">종료일</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">해석 일지 ({logs.length})</label>
                        <div className="flex gap-2 mb-2">
                            <input value={newLog} onChange={e => setNewLog(e.target.value)} placeholder="오늘의 해석 내용을 기록하세요..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onKeyDown={e => e.key === "Enter" && addLog()} />
                            <button onClick={addLog} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">기록</button>
                        </div>
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {logs.map(l => (
                                <div key={l.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                    <button onClick={() => setLogs(logs.filter(x => x.id !== l.id))}
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
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(analysis!.id); onClose(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AnalysisView({ analyses, onSave, onDelete, currentUser, toolList, onSaveTools, onToggleDiscussion, onReorder, teamNames }: { analyses: Analysis[]; onSave: (a: Analysis) => void; onDelete: (id: number) => void; currentUser: string; toolList: string[]; onSaveTools: (list: string[]) => void; onToggleDiscussion: (a: Analysis) => void; onReorder: (list: Analysis[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Analysis | null>(null);
    const [adding, setAdding] = useState(false);
    const [showToolMgr, setShowToolMgr] = useState(false);
    const [newTool, setNewTool] = useState("");
    const [filterTeam, setFilterTeam] = useState("전체");
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Analysis | null>(null);
    const filteredAnalyses = filterTeam === "전체" ? analyses : analyses.filter(a => a.team === filterTeam);
    const [showCompleted, setShowCompleted] = useState(false);
    const completedAnalyses = filteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) === "completed");
    const kanbanFilteredAnalyses = filteredAnalyses.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) !== "completed");
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <button onClick={() => setAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 해석 등록</button>
                <button onClick={() => setShowToolMgr(!showToolMgr)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-200">🔧 해석 도구 관리</button>
                <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedAnalyses.length})</button>
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
                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onKeyDown={e => { if (e.key === "Enter" && newTool.trim() && !toolList.includes(newTool.trim())) { onSaveTools([...toolList, newTool.trim()]); setNewTool(""); } }} />
                        <button onClick={() => { if (newTool.trim() && !toolList.includes(newTool.trim())) { onSaveTools([...toolList, newTool.trim()]); setNewTool(""); } }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                    </div>
                </div>
            )}
            {teamNames && teamNames.length > 0 && <TeamFilterBar teamNames={teamNames} selected={filterTeam} onSelect={setFilterTeam} />}
            {!showCompleted && (
            <div className="flex gap-3 pb-2">
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
                                <span className="text-[14px] font-bold text-slate-800">{cfg.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((a, cardIdx) => (
                                    <div key={a.id}>
                                    {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = a; setDraggedId(a.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === a.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        onClick={() => setEditing(a)}
                                        className={`bg-white rounded-lg p-3 cursor-grab hover:shadow-md transition-all overflow-hidden ${draggedId === a.id ? "opacity-40 scale-95" : ""} ${a.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!a.needsDiscussion} onChange={() => onToggleDiscussion(a)} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[11px] font-medium ${a.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{a.title}</div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[11px] text-slate-500">🖥️ {a.tool}</span>
                                            {a.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{a.team}</span>}
                                        </div>
                                        {(a.progress ?? 0) > 0 && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${a.progress}%` }} /></div>
                                                <span className="text-[11px] font-semibold text-blue-500">{a.progress}%</span>
                                            </div>
                                        )}
                                        {a.goal && <div className="text-[11px] text-slate-400 mb-1.5 line-clamp-2">{a.goal}</div>}
                                        {(a.startDate || a.endDate) && (
                                            <div className="text-[11px] text-slate-400 mb-1.5">📅 {a.startDate} ~ {a.endDate}</div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {a.assignees.slice(0, 3).map(n => <span key={n} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[n]?.emoji}{n}</span>)}
                                                {a.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{a.assignees.length - 3}</span>}
                                            </div>
                                            {a.logs.length > 0 && <span className="text-[11px] text-slate-400">📝{a.logs.length}</span>}
                                        </div>
                                        {a.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[a.creator]?.emoji || ""}{a.creator}{a.createdAt ? ` · ${a.createdAt}` : ""}</div>}
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
                <div className="grid grid-cols-3 gap-3">
                    {completedAnalyses.map(a => (
                        <div key={a.id} onClick={() => setEditing(a)}
                            className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-emerald-200"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{a.title}</div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] text-slate-500">🖥️ {a.tool}</span>
                                {a.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{a.team}</span>}
                            </div>
                            {a.goal && <div className="text-[11px] text-slate-400 mb-1.5 line-clamp-2">{a.goal}</div>}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {a.assignees.slice(0, 3).map(n => <span key={n} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[n]?.emoji}{n}</span>)}
                                    {a.assignees.length > 3 && <span className="text-[11px] text-slate-400">+{a.assignees.length - 3}</span>}
                                </div>
                                {a.logs.length > 0 && <span className="text-[11px] text-slate-400">📝{a.logs.length}</span>}
                            </div>
                            {a.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[a.creator]?.emoji || ""}{a.creator}{a.createdAt ? ` · ${a.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedAnalyses.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 해석이 없습니다</div>}
                </div>
            )}
            {adding && <AnalysisFormModal analysis={null} onSave={a => { onSave(a); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} toolList={toolList} teamNames={teamNames} />}
            {editing && <AnalysisFormModal analysis={editing} onSave={a => { onSave(a); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} toolList={toolList} teamNames={teamNames} />}
        </div>
    );
}

function TodoList({ todos, onToggle, onAdd, onUpdate, onDelete, onReorder, currentUser }: { todos: Todo[]; onToggle: (id: number) => void; onAdd: (t: Todo) => void; onUpdate: (t: Todo) => void; onDelete: (id: number) => void; onReorder: (list: Todo[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [newText, setNewText] = useState("");
    const [newAssignees, setNewAssignees] = useState<string[]>([]);
    const [newPriority, setNewPriority] = useState("mid");
    const [newDeadline, setNewDeadline] = useState("");
    const [newProgress, setNewProgress] = useState(0);
    const [filterPeople, setFilterPeople] = useState<string[]>([currentUser]);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Todo | null>(null);
    const [editComments, setEditComments] = useState<Comment[]>([]);
    const [editNewComment, setEditNewComment] = useState("");
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

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
        onAdd({ id: Date.now(), text: newText.trim(), assignees, done: false, priority: newPriority, deadline: newDeadline, progress: newProgress, comments: [] });
        setNewText(""); setNewAssignees([]); setNewPriority("mid"); setNewDeadline(""); setNewProgress(0); setShowForm(false);
    };

    const doneCount = filtered.filter(t => t.done).length;
    const totalCount = filtered.length;

    return (
        <div>
            {/* Person filter */}
            <div className="flex flex-wrap gap-1 mb-3">
                <button onClick={() => setFilterPeople([])} className={`px-2 py-0.5 rounded-full text-[12px] font-medium ${filterPeople.length === 0 ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>전체</button>
                {MEMBER_NAMES.map(name => (
                    <button key={name} onClick={() => setFilterPeople(filterPeople.includes(name) ? filterPeople.filter(n => n !== name) : [...filterPeople, name])}
                        className={`px-2 py-0.5 rounded-full text-[12px] font-medium ${filterPeople.includes(name) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {MEMBERS[name]?.emoji} {name}
                    </button>
                ))}
            </div>
            {/* Stats + Add button */}
            <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setShowForm(!showForm)} className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 할 일 추가</button>
                <span className="text-[13px] text-slate-400">{doneCount}/{totalCount} 완료</span>
            </div>
            {/* Add form */}
            {showForm && (
                <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3 space-y-2">
                    <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="할 일 내용..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                className="border border-slate-200 rounded-lg px-2 py-1 text-[13px] w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
            )}
            {/* 3-column kanban */}
            <div className="grid grid-cols-3 gap-3">
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
                            <span className="text-[14px] font-bold text-slate-800">{col.label}</span>
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
                                                    <input type="checkbox" checked={!!todo.needsDiscussion} onChange={() => onUpdate({ ...todo, needsDiscussion: !todo.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                                    <span className={`text-[11px] font-medium ${todo.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                                </label>
                                            )}
                                            <div className={`text-[14px] leading-relaxed ${col.id === "completed" ? "text-slate-500" : "text-slate-700"}`}>
                                                {PRIORITY_ICON[todo.priority] || ""} {todo.text}
                                                {col.id !== "completed" && todo.priority === "highest" && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold align-middle">매우높음</span>}
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
                                        <button onClick={() => onDelete(todo.id)} className="text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1">✕</button>
                                    </div>
                                </div>
                            ))}
                            {dropTarget?.col === col.id && dropTarget?.idx === col.items.length && <DropLine />}
                        </div>
                        {col.items.length === 0 && <div className="text-center py-8 text-slate-300 text-[13px]">{col.label} 없음</div>}
                    </div>
                ))}
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
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <input value={newText} onChange={e => setNewText(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-[13px] w-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                                            <button onClick={() => setEditComments(editComments.filter(x => x.id !== c.id))}
                                                className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4">{c.text}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {editComments.length === 0 && <div className="text-[12px] text-slate-300 py-2">댓글 없음</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={editNewComment} onChange={e => setEditNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onKeyDown={e => { if (e.key === "Enter" && editNewComment.trim()) { setEditComments([...editComments, { id: Date.now(), author: currentUser, text: editNewComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]); setEditNewComment(""); } }} />
                                    <button onClick={() => { if (editNewComment.trim()) { setEditComments([...editComments, { id: Date.now(), author: currentUser, text: editNewComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]); setEditNewComment(""); } }}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <button onClick={() => { onDelete(editingTodo.id); setEditingTodo(null); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingTodo(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={() => { onUpdate({ ...editingTodo, text: newText, assignees: newAssignees.length > 0 ? newAssignees : editingTodo.assignees, priority: newPriority, deadline: newDeadline, progress: newProgress, comments: editComments }); setEditingTodo(null); }}
                                    className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const TEAM_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899", "#f97316", "#14b8a6", "#6366f1", "#0ea5e9", "#84cc16", "#d946ef", "#78716c", "#dc2626", "#059669", "#7c3aed"];
const TEAM_EMOJIS = ["💧", "⚙️", "🔋", "🌊", "🔬", "🧪", "📐", "🔧", "❄️", "☢️", "🔥", "💻", "📊", "🌡️", "⚡", "🛠️", "🧬", "🏗️", "📡", "🎯", "🚀", "💎", "🧊", "🌀", "⚛️", "🔩", "🧲", "💡", "🔭", "🪫", "🔌", "🌍", "🛡️", "🏭", "🧫", "📈"];

function TeamOverview({ papers, todos, experiments, analyses, teams, onSaveTeams, currentUser }: { papers: Paper[]; todos: Todo[]; experiments: Experiment[]; analyses: Analysis[]; teams: Record<string, TeamData>; onSaveTeams: (t: Record<string, TeamData>) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const [editingTeam, setEditingTeam] = useState<string | null>(null);
    const [addingTeam, setAddingTeam] = useState(false);
    const [formName, setFormName] = useState("");
    const [formLead, setFormLead] = useState("");
    const [formMembers, setFormMembers] = useState<string[]>([]);
    const [formColor, setFormColor] = useState(TEAM_COLORS[0]);
    const [formEmoji, setFormEmoji] = useState(TEAM_EMOJIS[0]);
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const openEdit = (name: string) => {
        const t = teams[name];
        setEditingTeam(name); setFormName(name); setFormLead(t.lead); setFormMembers(t.members); setFormColor(t.color); setFormEmoji(t.emoji || TEAM_EMOJIS[0]);
    };
    const openAdd = () => {
        const idx = Object.keys(teams).length;
        setAddingTeam(true); setFormName(""); setFormLead(""); setFormMembers([]); setFormColor(TEAM_COLORS[idx % TEAM_COLORS.length]); setFormEmoji(TEAM_EMOJIS[idx % TEAM_EMOJIS.length]);
    };
    const handleSave = () => {
        if (!formName.trim()) return;
        const updated = { ...teams };
        if (editingTeam && editingTeam !== formName) delete updated[editingTeam];
        updated[formName] = { lead: formLead, members: formMembers, color: formColor, emoji: formEmoji };
        onSaveTeams(updated); setEditingTeam(null); setAddingTeam(false);
    };
    const handleDelete = (name: string) => {
        const updated = { ...teams }; delete updated[name]; onSaveTeams(updated);
    };

    const modal = editingTeam !== null || addingTeam;

    return (
        <div>
            <button onClick={openAdd} className="mb-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 팀 추가</button>
            <div className="grid gap-3 sm:grid-cols-2">{Object.entries(teams).map(([name, team]) => (
                <div key={name} className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderTop: `3px solid ${team.color}` }}
                    onClick={() => openEdit(name)}>
                    <div className="text-[15px] font-bold text-slate-800 mb-1">{team.emoji || "📌"} TEAM_{name}</div>
                    <div className="text-[12px] text-slate-500 mb-3">팀장: {MEMBERS[team.lead]?.emoji || ""} {team.lead}</div>
                    <div className="space-y-1.5">{team.members.map(m => {
                        const paperCount = papers.filter(p => p.assignees.includes(m)).length;
                        const todoCount = todos.filter(t => !t.done && (t.assignees.includes(m) || t.assignees.includes("전체"))).length;
                        const expCount = experiments.filter(e => e.assignees.includes(m) && e.status === "running").length;
                        const anaCount = analyses.filter(a => a.assignees.includes(m) && a.status === "running").length;
                        return (
                            <div key={m} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-50">
                                <span className="text-[14px] text-slate-700">{MEMBERS[m]?.emoji} {m}</span>
                                <div className="flex gap-2">
                                    <span className="text-[12px] text-slate-500" title="논문">📄{paperCount}</span>
                                    <span className="text-[12px] text-slate-500" title="할 일">✅{todoCount}</span>
                                    <span className="text-[12px] text-slate-500" title="실험 진행중">🧪{expCount}</span>
                                    <span className="text-[12px] text-slate-500" title="해석 진행중">🖥️{anaCount}</span>
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
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">팀 이름 *</label>
                                <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">아이콘</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {TEAM_EMOJIS.map(e => (
                                        <button key={e} type="button" onClick={() => setFormEmoji(e)}
                                            className={`w-8 h-8 rounded-lg text-[16px] flex items-center justify-center transition-all ${formEmoji === e ? "bg-blue-100 ring-2 ring-blue-500 scale-110" : "bg-slate-50 hover:bg-slate-100 hover:scale-105"}`}>
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">색상</label>
                                <div className="flex gap-2">
                                    {TEAM_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setFormColor(c)}
                                            className={`w-7 h-7 rounded-full transition-all ${formColor === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`}
                                            style={{ background: c }} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">팀원</label>
                                <PillSelect options={MEMBER_NAMES} selected={formMembers} onToggle={v => setFormMembers(toggleArr(formMembers, v))}
                                    emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">팀장</label>
                                <div className="flex flex-wrap gap-1">
                                    {(formMembers.length > 0 ? formMembers : MEMBER_NAMES).map(m => (
                                        <button key={m} type="button" onClick={() => setFormLead(m)}
                                            className={`px-2 py-0.5 rounded-full text-[12px] font-medium transition-all ${formLead === m ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                            {MEMBERS[m]?.emoji} {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div>{editingTeam && currentUser === "박일웅" && <button onClick={() => { handleDelete(editingTeam); setEditingTeam(null); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingTeam(null); setAddingTeam(false); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function IPFormModal({ patent, onSave, onDelete, onClose, currentUser, teamNames }: { patent: Patent | null; onSave: (p: Patent) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; teamNames?: string[] }) {
    const isEdit = !!patent;
    const [title, setTitle] = useState(patent?.title || "");
    const [deadline, setDeadline] = useState(patent?.deadline || "");
    const [status, setStatus] = useState(patent?.status || "planning");
    const [assignees, setAssignees] = useState<string[]>(patent?.assignees || []);
    const [team, setTeam] = useState(patent?.team || "");
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "지식재산권 수정" : "지식재산권 등록"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">기한</label>
                        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="예: 12/31" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">상태</label>
                        <div className="flex flex-wrap gap-1">
                            {[...IP_STATUS_KEYS, "completed"].map(s => {
                                const cfg = IP_STATUS_CONFIG[s];
                                return (
                                    <button key={s} type="button" onClick={() => setStatus(s)}
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "text-white" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color } : undefined}>{cfg.label}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">담당자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))}
                            emojis={Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.emoji]))} />
                    </div>
                    {teamNames && <TeamSelect teamNames={teamNames} selected={team} onSelect={setTeam} />}
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>{isEdit && onDelete && <button onClick={() => { onDelete(patent!.id); onClose(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (title.trim()) { onSave({ id: patent?.id ?? Date.now(), title, deadline, status, assignees, creator: patent?.creator || currentUser, createdAt: patent?.createdAt || new Date().toLocaleString("ko-KR"), team }); onClose(); } }}
                            className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IPView({ patents, onSave, onDelete, currentUser, onToggleDiscussion, onReorder, teamNames }: { patents: Patent[]; onSave: (p: Patent) => void; onDelete: (id: number) => void; currentUser: string; onToggleDiscussion: (p: Patent) => void; onReorder: (list: Patent[]) => void; teamNames?: string[] }) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Patent | null>(null);
    const [adding, setAdding] = useState(false);
    const [filterTeam, setFilterTeam] = useState("전체");
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const dragItem = useRef<Patent | null>(null);
    const filteredPatents = filterTeam === "전체" ? patents : patents.filter(p => p.team === filterTeam);
    const [showCompleted, setShowCompleted] = useState(false);
    const completedPatents = filteredPatents.filter(p => p.status === "completed");
    const kanbanFilteredPatents = filteredPatents.filter(p => p.status !== "completed");
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <button onClick={() => setAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 지식재산권 등록</button>
                <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${showCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>✅ 완료 ({completedPatents.length})</button>
            </div>
            {teamNames && teamNames.length > 0 && <TeamFilterBar teamNames={teamNames} selected={filterTeam} onSelect={setFilterTeam} />}
            {!showCompleted && (
            <div className="flex gap-3 pb-2">
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
                                <span className="text-[14px] font-bold text-slate-800">{cfg.label}</span>
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
                                        className={`bg-white rounded-lg p-3 cursor-grab hover:shadow-md transition-all overflow-hidden ${draggedId === p.id ? "opacity-40 scale-95" : ""} ${p.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}
                                        style={{ borderLeft: `3px solid ${cfg.color}` }}>
                                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!p.needsDiscussion} onChange={() => onToggleDiscussion(p)} className="w-3 h-3 accent-orange-500" />
                                            <span className={`text-[11px] font-medium ${p.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{p.title}</div>
                                        {p.team && <div className="mb-1"><span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{p.team}</span></div>}
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${p.progress || 0}%` }} />
                                            </div>
                                            <span className="text-[11px] font-semibold text-blue-500">{p.progress || 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1 flex-wrap">
                                                {p.assignees.map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                            </div>
                                            {p.deadline && <span className="text-[11px] text-red-500 font-semibold">~{p.deadline}</span>}
                                        </div>
                                        {p.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
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
                <div className="grid grid-cols-3 gap-3">
                    {completedPatents.map(p => (
                        <div key={p.id} onClick={() => setEditing(p)}
                            className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all border border-emerald-200"
                            style={{ borderLeft: "3px solid #22c55e" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{p.title}</div>
                            {p.team && <div className="mb-1"><span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{p.team}</span></div>}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1 flex-wrap">
                                    {p.assignees.map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                                </div>
                                {p.deadline && <span className="text-[11px] text-red-500 font-semibold">~{p.deadline}</span>}
                            </div>
                            {p.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedPatents.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 지식재산권이 없습니다</div>}
                </div>
            )}
            {adding && <IPFormModal patent={null} onSave={p => { onSave(p); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} teamNames={teamNames} />}
            {editing && <IPFormModal patent={editing} onSave={p => { onSave(p); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} teamNames={teamNames} />}
        </div>
    );
}

// ─── Daily Target View ──────────────────────────────────────────────────────

function DailyTargetView({ targets, onSave, currentUser }: { targets: DailyTarget[]; onSave: (t: DailyTarget[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const [centerDate, setCenterDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
    const [editCell, setEditCell] = useState<{ name: string; date: string } | null>(null);
    const [editText, setEditText] = useState("");
    const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();

    // Report state
    const [showReport, setShowReport] = useState(false);
    const [reportStart, setReportStart] = useState("");
    const [reportEnd, setReportEnd] = useState("");
    const [reportMembers, setReportMembers] = useState<string[]>([]);
    const [reportData, setReportData] = useState<{ dates: string[]; members: string[]; rows: string[][] } | null>(null);

    const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayL = ["일", "월", "화", "수", "목", "금", "토"];

    // Helper: move by N weekdays
    const moveWeekdays = (from: Date, n: number): Date => {
        const d = new Date(from);
        let count = 0;
        while (count < Math.abs(n)) {
            d.setDate(d.getDate() + (n > 0 ? 1 : -1));
            if (d.getDay() !== 0 && d.getDay() !== 6) count++;
        }
        return d;
    };

    // 3 days: prev weekday | centerDate | next weekday
    const days = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const prev = moveWeekdays(centerDate, -1);
        const next = moveWeekdays(centerDate, 1);
        return [prev, new Date(centerDate), next].map(d => {
            const str = fmtDate(d);
            return { date: d, str, label: `${d.getMonth() + 1}/${d.getDate()} (${dayL[d.getDay()]})`, isToday: d.getTime() === today.getTime() };
        });
    }, [centerDate]);

    const shiftCenter = (dir: number) => setCenterDate(prev => moveWeekdays(prev, dir));
    const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCenterDate(d); };
    const isCenterToday = centerDate.getTime() === new Date(new Date().setHours(0, 0, 0, 0)).getTime();

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

    // Report generation
    const generateReport = () => {
        if (!reportStart || !reportEnd || reportMembers.length === 0) return;
        const start = new Date(reportStart + "T00:00:00");
        const end = new Date(reportEnd + "T00:00:00");
        if (start > end) return;
        const dates: string[] = [];
        const d = new Date(start);
        while (d <= end) {
            if (d.getDay() !== 0 && d.getDay() !== 6) dates.push(fmtDate(d));
            d.setDate(d.getDate() + 1);
        }
        const rows = dates.map(date => reportMembers.map(name => {
            const t = targets.find(x => x.name === name && x.date === date);
            return t?.text || "";
        }));
        setReportData({ dates, members: reportMembers, rows });
    };

    const reportCsvText = () => {
        if (!reportData) return "";
        const header = ["날짜", ...reportData.members].join(",");
        const lines = reportData.dates.map((date, i) => [date, ...reportData.rows[i].map(c => `"${c.replace(/"/g, '""')}"`)].join(","));
        return [header, ...lines].join("\n");
    };

    const downloadCsv = () => {
        const csv = reportCsvText();
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `daily-targets-${reportStart}-${reportEnd}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyReport = () => {
        if (!reportData) return;
        // Tab-separated for Excel/Sheets paste
        const header = ["날짜", ...reportData.members].join("\t");
        const lines = reportData.dates.map((date, i) => [date, ...reportData.rows[i]].join("\t"));
        navigator.clipboard.writeText([header, ...lines].join("\n"));
    };

    return (
        <div>
            {/* Navigation bar */}
            <div className="flex items-center justify-center gap-3 mb-3">
                <button onClick={() => shiftCenter(-1)} className="px-2.5 py-1 rounded-md text-[14px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">&lt;</button>
                <button onClick={goToday} className={`px-3 py-1 rounded-md text-[14px] font-medium transition-colors ${isCenterToday ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>오늘</button>
                <button onClick={() => shiftCenter(1)} className="px-2.5 py-1 rounded-md text-[14px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">&gt;</button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-1.5 py-2 text-left text-[13px] font-semibold text-slate-600 w-[72px]">이름</th>
                            {days.map(d => (
                                <th key={d.str} className={`border-b border-l border-slate-200 px-2 py-2 text-center ${d.isToday ? "bg-blue-50" : "bg-white"}`}>
                                    <div className={`text-[13px] font-semibold ${d.isToday ? "text-blue-600" : "text-slate-700"}`}>{d.label}</div>
                                    {d.isToday && <div className="text-[10px] text-blue-400 font-medium">TODAY</div>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {MEMBER_NAMES.map(name => {
                            const isMe = name === currentUser;
                            const canEdit = isMe || currentUser === "박일웅";
                            return (
                                <tr key={name} className={isMe ? "bg-blue-50/30" : ""}>
                                    <td className={`sticky left-0 z-10 border-r border-b border-slate-100 px-1.5 py-2 text-[13px] whitespace-nowrap overflow-hidden ${isMe ? "bg-blue-50 font-semibold text-slate-800" : "bg-white text-slate-600"}`}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </td>
                                    {days.map(d => {
                                        const target = getTarget(name, d.str);
                                        return (
                                            <td key={d.str} className={`border-b border-l border-slate-200 px-2 py-1.5 align-top ${d.isToday ? "bg-blue-50/50" : ""} ${canEdit ? "cursor-pointer hover:bg-slate-50" : ""}`}
                                                onClick={() => { if (canEdit) { setEditCell({ name, date: d.str }); setEditText(target?.text || ""); } }}>
                                                {target ? (
                                                    <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{target.text}</div>
                                                ) : canEdit ? (
                                                    <div className="text-[12px] text-slate-300 opacity-0 hover:opacity-100 transition-opacity">+ 작성</div>
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

            {/* Report section */}
            <div className="mt-4">
                <button onClick={() => setShowReport(v => !v)} className="text-[13px] font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    <span className={`transition-transform ${showReport ? "rotate-90" : ""}`}>&#9654;</span> 리포트
                </button>
                {showReport && (
                    <div className="mt-2 border border-slate-200 rounded-lg bg-white p-4">
                        <div className="flex flex-wrap items-end gap-3 mb-3">
                            <div>
                                <label className="block text-[12px] text-slate-500 mb-0.5">시작일</label>
                                <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-[13px]" />
                            </div>
                            <div>
                                <label className="block text-[12px] text-slate-500 mb-0.5">종료일</label>
                                <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-[13px]" />
                            </div>
                            <button onClick={generateReport} disabled={!reportStart || !reportEnd || reportMembers.length === 0}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-[13px] font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">리포트 생성</button>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <label className="text-[12px] text-slate-500">멤버 선택</label>
                                <button onClick={() => setReportMembers(prev => prev.length === MEMBER_NAMES.length ? [] : [...MEMBER_NAMES])}
                                    className="text-[11px] text-blue-500 hover:underline">{reportMembers.length === MEMBER_NAMES.length ? "전체 해제" : "전체 선택"}</button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {MEMBER_NAMES.map(name => (
                                    <label key={name} className="flex items-center gap-1 text-[12px] text-slate-600 cursor-pointer">
                                        <input type="checkbox" checked={reportMembers.includes(name)}
                                            onChange={e => setReportMembers(prev => e.target.checked ? [...prev, name] : prev.filter(n => n !== name))}
                                            className="w-3 h-3 rounded border-slate-300" />
                                        {MEMBERS[name]?.emoji} {name}
                                    </label>
                                ))}
                            </div>
                        </div>
                        {reportData && (
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <button onClick={downloadCsv} className="px-2.5 py-1 bg-green-500 text-white rounded text-[12px] font-medium hover:bg-green-600">CSV 다운로드</button>
                                    <button onClick={copyReport} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[12px] font-medium hover:bg-slate-200">복사</button>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded">
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr>
                                                <th className="bg-slate-50 border-b border-r border-slate-200 px-2 py-1 text-left text-slate-600 font-semibold">날짜</th>
                                                {reportData.members.map(m => (
                                                    <th key={m} className="bg-slate-50 border-b border-l border-slate-200 px-2 py-1 text-center text-slate-600 font-semibold">{m}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.dates.map((date, ri) => (
                                                <tr key={date}>
                                                    <td className="border-b border-r border-slate-100 px-2 py-1 text-slate-500 whitespace-nowrap">{date}</td>
                                                    {reportData.rows[ri].map((cell, ci) => (
                                                        <td key={ci} className="border-b border-l border-slate-100 px-2 py-1 text-slate-700 whitespace-pre-wrap">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit modal */}
            {editCell && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditCell(null)}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[14px] font-bold text-slate-800 mb-1">{editCell.date === todayStr ? "오늘 목표" : `${editCell.date} 목표`}</h4>
                        <p className="text-[12px] text-slate-400 mb-3">{editCell.name}</p>
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="오늘의 목표를 작성하세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditCell(null)} className="px-3 py-1.5 text-[13px] text-slate-500">취소</button>
                            {editText.trim() === "" && getTarget(editCell.name, editCell.date) && (
                                <button onClick={handleSave} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-[13px] font-medium">삭제</button>
                            )}
                            <button onClick={handleSave} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Conference / Trip View ──────────────────────────────────────────────────

const CONF_STATUSES = ["관심", "준비중", "완료"] as const;
const CONF_COL_COLORS: Record<string, { bg: string; border: string; header: string; count: string }> = {
    "관심": { bg: "bg-amber-50/50", border: "border-amber-200", header: "text-amber-700", count: "bg-amber-100 text-amber-600" },
    "준비중": { bg: "bg-blue-50/50", border: "border-blue-200", header: "text-blue-700", count: "bg-blue-100 text-blue-600" },
    "완료": { bg: "bg-green-50/50", border: "border-green-200", header: "text-green-700", count: "bg-green-100 text-green-600" },
};

function ConferenceTripView({ items, onSave, onDelete, onReorder, currentUser }: { items: ConferenceTrip[]; onSave: (c: ConferenceTrip) => void; onDelete: (id: number) => void; onReorder: (list: ConferenceTrip[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<ConferenceTrip | null>(null);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [homepage, setHomepage] = useState("");
    const [fee, setFee] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [formStatus, setFormStatus] = useState<string>("관심");
    const [draggedId, setDraggedId] = useState<number | null>(null);

    const modal = adding || editing !== null;
    const isEdit = !!editing;

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const openAdd = (status?: string) => { setAdding(true); setEditing(null); setTitle(""); setStartDate(""); setEndDate(""); setHomepage(""); setFee(""); setParticipants([]); setFormStatus(status || "관심"); setComments([]); setNewComment(""); };
    const openEdit = (c: ConferenceTrip) => { setEditing(c); setAdding(false); setTitle(c.title); setStartDate(c.startDate); setEndDate(c.endDate); setHomepage(c.homepage); setFee(c.fee); setParticipants(c.participants); setFormStatus(c.status || "관심"); setComments(c.comments || []); setNewComment(""); };
    const closeModal = () => { setAdding(false); setEditing(null); };

    const handleSave = () => {
        if (!title.trim()) return false;
        onSave({ id: editing?.id ?? Date.now(), title: title.trim(), startDate, endDate, homepage: homepage.trim(), fee: fee.trim(), participants, creator: editing?.creator || currentUser, createdAt: editing?.createdAt || new Date().toISOString(), status: formStatus, comments, needsDiscussion: editing?.needsDiscussion });
        return true;
    };

    const toggleParticipant = (name: string) => {
        setParticipants(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    };

    const formatPeriod = (s: string, e: string) => {
        if (!s && !e) return "";
        if (s && !e) return s;
        if (!s && e) return `~ ${e}`;
        return `${s} ~ ${e}`;
    };

    const handleColumnDrop = (targetStatus: string, e: React.DragEvent) => {
        e.preventDefault();
        if (draggedId === null) return;
        const item = items.find(c => c.id === draggedId);
        if (item && (item.status || "관심") !== targetStatus) {
            onSave({ ...item, status: targetStatus });
        }
        setDraggedId(null);
    };

    return (
        <div>
            <button onClick={() => openAdd()} className="mb-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 학회/출장 추가</button>
            <div className="grid grid-cols-3 gap-3">
                {items.map(c => {
                    const cmt = c.comments || [];
                    return (
                    <div key={c.id} onClick={() => openEdit(c)}
                        className={`bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${c.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}>
                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!c.needsDiscussion} onChange={() => onSave({ ...c, needsDiscussion: !c.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                            <span className={`text-[11px] font-medium ${c.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="text-[14px] font-semibold text-slate-800 mb-1">{c.title}</div>
                        {(c.startDate || c.endDate) && <div className="text-[12px] text-slate-500 mb-0.5">📅 {formatPeriod(c.startDate, c.endDate)}</div>}
                        {c.homepage && <div className="text-[11px] text-blue-500 mb-0.5 truncate" onClick={e => { e.stopPropagation(); try { const u = new URL(c.homepage); if (["http:", "https:"].includes(u.protocol)) window.open(c.homepage, "_blank", "noopener"); } catch {} }}>🔗 {c.homepage}</div>}
                        {c.fee && <div className="text-[12px] text-slate-500 mb-0.5">💰 {c.fee}</div>}
                        {c.participants.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1.5">
                                {c.participants.map(p => <span key={p} className="text-[10px] px-1 py-0.5 rounded bg-blue-50 text-blue-600">{MEMBERS[p]?.emoji || "👤"}{p}</span>)}
                            </div>
                        )}
                        <div className="border-t border-slate-100 pt-1.5 mt-2">
                            {cmt.length > 0 ? (
                                <div className="text-[11px] text-slate-500 truncate">
                                    <span className="font-medium text-slate-600">{MEMBERS[cmt.slice(-1)[0]?.author]?.emoji}{cmt.slice(-1)[0]?.author}</span> {cmt.slice(-1)[0]?.text}
                                </div>
                            ) : (
                                <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                            )}
                        </div>
                    </div>
                    );
                })}
                {items.length === 0 && <div className="text-center py-12 text-slate-400 text-[14px] col-span-full">등록된 학회/출장이 없습니다</div>}
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "학회/출장 수정" : "학회/출장 추가"}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">학회/출장 이름 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: NURETH-21" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 block mb-1">시작일</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-500 block mb-1">종료일</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">홈페이지</label>
                                <input value={homepage} onChange={e => setHomepage(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">등록비</label>
                                <input value={fee} onChange={e => setFee(e.target.value)} placeholder="예: Early bird $500 / Regular $700" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">참가자</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {MEMBER_NAMES.map(name => (
                                        <button key={name} onClick={() => toggleParticipant(name)}
                                            className={`px-2 py-1 rounded-lg text-[13px] transition-colors ${participants.includes(name) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                            {MEMBERS[name]?.emoji || "👤"} {name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Comments */}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">댓글 ({comments.length})</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                                    {comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                            <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                                className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4">{c.text}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && <div className="text-[12px] text-slate-300 py-2">댓글 없음</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onKeyDown={e => { if (e.key === "Enter" && newComment.trim()) { setComments([...comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]); setNewComment(""); } }} />
                                    <button onClick={() => { if (newComment.trim()) { setComments([...comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]); setNewComment(""); } }}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div>{isEdit && <button onClick={() => { onDelete(editing!.id); closeModal(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={() => { if (handleSave()) closeModal(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Resource View ──────────────────────────────────────────────────────────

function ResourceView({ resources, onSave, onDelete, onReorder, currentUser }: { resources: Resource[]; onSave: (r: Resource) => void; onDelete: (id: number) => void; onReorder: (list: Resource[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Resource | null>(null);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [link, setLink] = useState("");
    const [nasPath, setNasPath] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    const dragRes = useRef<number | null>(null);
    const [dragOverRes, setDragOverRes] = useState<number | null>(null);

    const openAdd = () => { setAdding(true); setEditing(null); setTitle(""); setLink(""); setNasPath(""); setComments([]); setNewComment(""); };
    const openEdit = (r: Resource) => { setEditing(r); setAdding(false); setTitle(r.title); setLink(r.link); setNasPath(r.nasPath); setComments(r.comments || []); setNewComment(""); };
    const closeModal = () => { setAdding(false); setEditing(null); };
    const modal = adding || editing !== null;
    const isEdit = !!editing;

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ id: editing?.id ?? Date.now(), title, link, nasPath, author: editing?.author || currentUser, date: editing?.date || new Date().toLocaleDateString("ko-KR"), comments, needsDiscussion: editing?.needsDiscussion });
        closeModal();
    };
    const addComment = () => {
        if (!newComment.trim()) return;
        setComments([...comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]);
        setNewComment("");
    };

    return (
        <div>
            <button onClick={openAdd} className="mb-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 자료 추가</button>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3"
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragRes.current !== null && dragOverRes !== null && dragRes.current !== dragOverRes) { const reordered = [...resources]; const [moved] = reordered.splice(dragRes.current, 1); reordered.splice(dragOverRes, 0, moved); onReorder(reordered); } dragRes.current = null; setDragOverRes(null); }}>
                {resources.map((r, idx) => {
                    const cmt = r.comments || [];
                    return (
                        <div key={r.id} draggable
                            onDragStart={() => { dragRes.current = idx; }}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverRes(idx); }}
                            onDragEnd={() => { dragRes.current = null; setDragOverRes(null); }}
                            onDrop={e => { e.stopPropagation(); if (dragRes.current !== null && dragRes.current !== idx) { const reordered = [...resources]; const [moved] = reordered.splice(dragRes.current, 1); reordered.splice(idx, 0, moved); onReorder(reordered); } dragRes.current = null; setDragOverRes(null); }}
                            onClick={() => openEdit(r)} className={`bg-white rounded-lg p-4 cursor-grab hover:shadow-md transition-shadow ${dragOverRes === idx ? "ring-2 ring-blue-300" : ""} ${r.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}>
                            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onSave({ ...r, needsDiscussion: !r.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                <span className={`text-[11px] font-medium ${r.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                            </label>
                            <div className="text-[14px] font-semibold text-slate-800 mb-2 break-words">{r.title}</div>
                            {r.link && (
                                <div className="text-[12px] text-blue-500 mb-1 truncate" onClick={e => { e.stopPropagation(); try { const u = new URL(r.link); if (["http:", "https:"].includes(u.protocol)) window.open(r.link, "_blank", "noopener"); } catch {} }}>
                                    🔗 {r.link}
                                </div>
                            )}
                            {r.nasPath && <div className="text-[12px] text-slate-500 mb-1 truncate">📂 {r.nasPath}</div>}
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-[11px] text-slate-400">{MEMBERS[r.author]?.emoji || ""} {r.author} · {r.date}</div>
                                {cmt.length > 0 && <span className="text-[11px] text-slate-400">💬{cmt.length}</span>}
                            </div>
                            <div className="border-t border-slate-100 pt-1.5 mt-2">
                                {cmt.length > 0 ? (
                                    cmt.slice(-1).map(c => (
                                        <div key={c.id} className="text-[12px] text-slate-500 truncate">
                                            <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {c.text}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {resources.length === 0 && <div className="text-center py-12 text-slate-400 text-[14px] col-span-full">등록된 자료가 없습니다</div>}
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
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">자료 이름 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">링크 (URL)</label>
                                <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">NAS 경로</label>
                                <input value={nasPath} onChange={e => setNasPath(e.target.value)} placeholder="예: \\NAS\연구자료\..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            {/* Comments */}
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">코멘트 ({comments.length})</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-2">
                                    {comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-md px-3 py-2 group relative">
                                            <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                                className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4">{c.text}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {comments.length === 0 && <div className="text-[12px] text-slate-300 py-2">코멘트 없음</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="코멘트 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onKeyDown={e => e.key === "Enter" && addComment()} />
                                    <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div>{isEdit && <button onClick={() => { onDelete(editing!.id); closeModal(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}</div>
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Ideas / Chat View ──────────────────────────────────────────────────────

function IdeasView({ ideas, onSave, onDelete, onReorder, currentUser }: { ideas: IdeaPost[]; onSave: (i: IdeaPost) => void; onDelete: (id: number) => void; onReorder: (list: IdeaPost[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const [selected, setSelected] = useState<IdeaPost | null>(null);
    const [adding, setAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [ideaColor, setIdeaColor] = useState(MEMO_COLORS[0]);
    const [ideaBorder, setIdeaBorder] = useState("");
    const [newComment, setNewComment] = useState("");
    const composingRef = useRef(false);
    const dragIdea = useRef<number | null>(null);
    const [dragOverIdea, setDragOverIdea] = useState<number | null>(null);

    const openDetail = (idea: IdeaPost) => { setSelected(idea); setNewComment(""); setIsEditing(false); };
    const closeDetail = () => { setSelected(null); setIsEditing(false); };
    const openAdd = () => { setAdding(true); setTitle(""); setBody(""); setIdeaColor(MEMO_COLORS[0]); setIdeaBorder(""); };
    const closeAdd = () => setAdding(false);
    const startEdit = () => { if (!selected) return; setTitle(selected.title); setBody(selected.body); setIdeaColor(selected.color || MEMO_COLORS[0]); setIdeaBorder(selected.borderColor || ""); setIsEditing(true); };
    const saveEdit = () => {
        if (!selected || !title.trim()) return;
        const updated = { ...selected, title: title.trim(), body: body.trim(), color: ideaColor, borderColor: ideaBorder };
        onSave(updated); setSelected(updated); setIsEditing(false);
    };

    const handleCreate = () => {
        if (!title.trim()) return;
        onSave({ id: Date.now(), title: title.trim(), body: body.trim(), author: currentUser, date: new Date().toLocaleDateString("ko-KR"), comments: [], color: ideaColor, borderColor: ideaBorder });
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
            <button onClick={openAdd} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 새 글 작성</button>
            <div className="grid gap-3 sm:grid-cols-3"
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragIdea.current !== null && dragOverIdea !== null && dragIdea.current !== dragOverIdea) { const reordered = [...ideas]; const [moved] = reordered.splice(dragIdea.current, 1); reordered.splice(dragOverIdea, 0, moved); onReorder(reordered); } dragIdea.current = null; setDragOverIdea(null); }}>
                {ideas.map((idea, idx) => (
                    <div key={idea.id} draggable
                        onDragStart={() => { dragIdea.current = idx; }}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIdea(idx); }}
                        onDragEnd={() => { dragIdea.current = null; setDragOverIdea(null); }}
                        onDrop={e => { e.stopPropagation(); if (dragIdea.current !== null && dragIdea.current !== idx) { const reordered = [...ideas]; const [moved] = reordered.splice(dragIdea.current, 1); reordered.splice(idx, 0, moved); onReorder(reordered); } dragIdea.current = null; setDragOverIdea(null); }}
                        onClick={() => openDetail(idea)}
                        className={`rounded-lg p-4 cursor-grab hover:shadow-md transition-shadow flex flex-col ${dragOverIdea === idx ? "ring-2 ring-blue-300" : ""} ${idea.needsDiscussion && !idea.borderColor ? "ring-1 ring-orange-200" : ""}`}
                        style={{ background: idea.color || "#fff", border: idea.borderColor ? `2px solid ${idea.borderColor}` : idea.needsDiscussion ? "2px solid #fb923c" : "1px solid #e2e8f0" }}>
                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!idea.needsDiscussion} onChange={() => onSave({ ...idea, needsDiscussion: !idea.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                            <span className={`text-[11px] font-medium ${idea.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-[14px] font-semibold text-slate-800 break-words flex-1">{idea.title}</div>
                            <span className="text-[11px] text-slate-400 ml-2 whitespace-nowrap">{idea.date}</span>
                        </div>
                        {idea.body && <div className="text-[13px] text-slate-600 mb-3 line-clamp-3 break-words">{idea.body}</div>}
                        <div className="text-[12px] text-slate-400 mb-2">{MEMBERS[idea.author]?.emoji || "👤"} {idea.author}</div>
                        {/* Comment preview */}
                        {idea.comments.length > 0 && (
                            <div className="border-t border-slate-100 pt-2 mt-auto space-y-1">
                                <div className="text-[11px] font-semibold text-slate-400 mb-1">💬 댓글 {idea.comments.length}개</div>
                                {idea.comments.slice(-2).map(c => (
                                    <div key={c.id} className="text-[12px] text-slate-500 truncate">
                                        <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {c.text}
                                    </div>
                                ))}
                            </div>
                        )}
                        {idea.comments.length === 0 && (
                            <div className="border-t border-slate-100 pt-2 mt-auto">
                                <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                            </div>
                        )}
                    </div>
                ))}
                {ideas.length === 0 && <div className="text-center py-12 text-slate-400 text-[14px] col-span-full">아직 글이 없습니다. 자유롭게 아이디어를 공유해 보세요!</div>}
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
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            </div>
                            <ColorPicker color={ideaColor} onColor={setIdeaColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={closeAdd} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={handleCreate} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">게시</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail modal */}
            {selected && !isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeDetail}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selected.title}</h3>
                            <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="text-[12px] text-slate-400 mb-3">{MEMBERS[selected.author]?.emoji || "👤"} {selected.author} · {selected.date}</div>
                            {selected.body && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap break-words">{selected.body}</div>}

                            {/* Comments section */}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({selected.comments.length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {selected.comments.map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group relative">
                                            <button onClick={() => deleteComment(c.id)}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4 break-words">{c.text}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {selected.comments.length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onCompositionStart={() => { composingRef.current = true; }}
                                        onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addComment(); }} />
                                    <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] hover:bg-blue-600 font-medium">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                {(currentUser === selected.author || currentUser === "박일웅") && (
                                    <button onClick={startEdit} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                                )}
                                {(currentUser === selected.author || currentUser === "박일웅") && (
                                    <button onClick={() => { onDelete(selected.id); closeDetail(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                            </div>
                            <button onClick={closeDetail} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {selected && isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">글 수정</h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            </div>
                            <ColorPicker color={ideaColor} onColor={setIdeaColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveEdit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AnnouncementView({ announcements, onAdd, onDelete, onUpdate, onReorder, philosophy, onAddPhilosophy, onDeletePhilosophy, onUpdatePhilosophy, currentUser }: {
    announcements: Announcement[]; onAdd: (text: string) => void; onDelete: (id: number) => void; onUpdate: (ann: Announcement) => void; onReorder: (list: Announcement[]) => void;
    philosophy: Announcement[]; onAddPhilosophy: (text: string) => void; onDeletePhilosophy: (id: number) => void; onUpdatePhilosophy: (p: Announcement) => void;
    currentUser: string;
}) {
    const [newText, setNewText] = useState("");
    const [newPhil, setNewPhil] = useState("");
    const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
    const [editText, setEditText] = useState("");
    const [editPinned, setEditPinned] = useState(false);
    const [editingPhil, setEditingPhil] = useState<Announcement | null>(null);
    const [editPhilText, setEditPhilText] = useState("");
    const isLeader = currentUser === "박일웅" || Object.values(DEFAULT_TEAMS).some(t => t.lead === currentUser);
    const isPI = currentUser === "박일웅";
    const dragAnn = useRef<number | null>(null);
    const [dragOverAnn, setDragOverAnn] = useState<number | null>(null);
    const pinned = announcements.filter(a => a.pinned);
    const unpinned = announcements.filter(a => !a.pinned);
    const sorted = [...pinned, ...unpinned];

    const openEditAnn = (ann: Announcement) => { setEditingAnn(ann); setEditText(ann.text); setEditPinned(ann.pinned); };
    const saveEditAnn = () => { if (!editingAnn || !editText.trim()) return; onUpdate({ ...editingAnn, text: editText.trim(), pinned: editPinned }); setEditingAnn(null); };
    const openEditPhil = (p: Announcement) => { setEditingPhil(p); setEditPhilText(p.text); };
    const saveEditPhil = () => { if (!editingPhil || !editPhilText.trim()) return; onUpdatePhilosophy({ ...editingPhil, text: editPhilText.trim() }); setEditingPhil(null); };

    return (
        <div className="space-y-8">
            {/* 📢 공지사항 */}
            <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-3">📢 공지사항</h3>
                {isLeader && (
                    <div className="flex gap-2 mb-3">
                        <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="공지사항 작성..."
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" rows={2}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newText.trim()) { e.preventDefault(); onAdd(newText.trim()); setNewText(""); } }} />
                        <button onClick={() => { if (newText.trim()) { onAdd(newText.trim()); setNewText(""); } }} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 self-end">게시</button>
                    </div>
                )}
                {announcements.length === 0 && <div className="text-center py-8 text-slate-400 text-[14px]">공지사항이 없습니다</div>}
                <div className="grid grid-cols-3 gap-3">{sorted.map((ann, idx) => (
                    <div key={ann.id} draggable
                        onDragStart={() => { dragAnn.current = idx; }}
                        onDragOver={e => { e.preventDefault(); setDragOverAnn(idx); }}
                        onDragEnd={() => { dragAnn.current = null; setDragOverAnn(null); }}
                        onDrop={() => { if (dragAnn.current !== null && dragAnn.current !== idx) { const reordered = [...sorted]; const [moved] = reordered.splice(dragAnn.current, 1); reordered.splice(idx, 0, moved); onReorder(reordered); } dragAnn.current = null; setDragOverAnn(null); }}
                        onClick={() => { if ((currentUser === ann.author || isPI) && !dragAnn.current) openEditAnn(ann); }}
                        className={`bg-white border rounded-lg p-4 cursor-grab transition-colors flex flex-col ${ann.pinned ? "border-amber-300 bg-amber-50/50" : "border-slate-200"} ${dragOverAnn === idx ? "bg-blue-50" : ""} ${(currentUser === ann.author || isPI) ? "hover:shadow-md" : ""}`}>
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">{ann.pinned && <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded mr-2">📌</span>}<span className="text-[14px] text-slate-800 whitespace-pre-wrap break-words">{ann.text}</span></div>
                            {(currentUser === ann.author || isPI) && <button onClick={e => { e.stopPropagation(); onDelete(ann.id); }} className="text-slate-400 hover:text-red-500 text-[13px] ml-2 flex-shrink-0">✕</button>}
                        </div>
                        <div className="mt-auto pt-2 text-[12px] text-slate-400">{ann.author} · {ann.date}</div>
                    </div>
                ))}</div>
            </div>

            {/* 공지사항 수정 모달 */}
            {editingAnn && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditingAnn(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">공지사항 수정</h3>
                            <button onClick={() => setEditingAnn(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" autoFocus />
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={editPinned} onChange={e => setEditPinned(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                                <span className="text-[14px] text-slate-700">📌 상단 고정</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <button onClick={() => { onDelete(editingAnn.id); setEditingAnn(null); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingAnn(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={saveEditAnn} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🧭 문화 */}
            <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-3">🧭 문화</h3>
                {isLeader && (
                    <div className="flex gap-2 mb-3">
                        <textarea value={newPhil} onChange={e => setNewPhil(e.target.value)} placeholder="연구실 문화 작성..."
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" rows={2}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newPhil.trim()) { e.preventDefault(); onAddPhilosophy(newPhil.trim()); setNewPhil(""); } }} />
                        <button onClick={() => { if (newPhil.trim()) { onAddPhilosophy(newPhil.trim()); setNewPhil(""); } }} className="px-4 py-2 bg-violet-500 text-white rounded-lg text-[13px] font-medium hover:bg-violet-600 self-end">게시</button>
                    </div>
                )}
                {philosophy.length === 0 && <div className="text-center py-8 text-slate-400 text-[14px]">등록된 내용이 없습니다</div>}
                <div className="grid grid-cols-3 gap-3">{philosophy.map(p => (
                    <div key={p.id} className={`bg-violet-50/50 border border-violet-200 rounded-lg p-4 flex flex-col ${isPI ? "cursor-pointer hover:shadow-md" : ""}`}
                        onClick={() => { if (isPI) openEditPhil(p); }}>
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex-1"><span className="text-[14px] text-slate-800 whitespace-pre-wrap break-words">{p.text}</span></div>
                            {isPI && <button onClick={e => { e.stopPropagation(); onDeletePhilosophy(p.id); }} className="text-slate-400 hover:text-red-500 text-[13px] ml-2 flex-shrink-0">✕</button>}
                        </div>
                        <div className="mt-auto pt-2 text-[12px] text-slate-400">{p.author} · {p.date}</div>
                    </div>
                ))}</div>
            </div>

            {/* 문화 수정 모달 */}
            {editingPhil && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditingPhil(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">문화 수정</h3>
                            <button onClick={() => setEditingPhil(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4">
                            <textarea value={editPhilText} onChange={e => setEditPhilText(e.target.value)} rows={4}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" autoFocus />
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <button onClick={() => { onDeletePhilosophy(editingPhil.id); setEditingPhil(null); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingPhil(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={saveEditPhil} className="px-4 py-2 text-[14px] bg-violet-500 text-white rounded-lg hover:bg-violet-600 font-medium">저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Settings View ──────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
    "👨‍🏫","🔥","🌊","💧","⚙️","📐","🔬","💻","🧪","❄️","📊","🔄","🌡️","🎯","🚀","⭐","🎨","🛠️","📡","🧬","💎","🌟","🎓","🤖","🔮","🌈",
    "🦊","🐱","🐶","🦁","🐼","🐻","🐸","🐙","🦋","🐝","🐺","🦄","🐯","🐮","🐷","🐵","🐰","🐨","🦅","🦇","🐳","🐬","🐠","🦈","🐢","🦜",
    "🍀","🌸","🌺","☀️","🌙","⚡","💥","✨","🎵","🎮","🏀","⚽","🎸","🎪","🎭","🎲","🎰","🏆","🥇","🏅","🎻","🎺","🥁","🎹","🎧","🎤",
    "🍎","🍊","🍋","🍇","🍓","🍑","🍒","🥝","🍌","🍉","🍔","🍕","🍩","🍪","🍰","🧁","🍫","🍿","☕","🍵","🥤","🧃","🍺","🧊","🍭","🎂",
    "🚗","✈️","🚁","🚢","🏎️","🚂","🛸","🚲","🏍️","🛵","⛵","🚤","🚃","🚅","🚆","🛩️","🪂","⛷️","🏂","🏄","🚣","🤿","🧗","🪁","🛶",
    "💪","👑","🧠","💡","🔑","❤️","💙","💚","💛","💜","🖤","🤍","💝","💖","❤️‍🔥","🫀","🩺","🔭","⚗️","🧲","🧫","🧰","🪛","⛏️","🗡️",
    "🏔️","🌋","🏝️","🏖️","🌅","🌄","🌃","🏙️","🌉","🎡","🎢","🗼","🏯","🕌","⛩️","🗻","🌎","🌍","🌏","🗺️","🧭","⛺","🏕️","🪐","🌠","🌌",
    "😎","🥳","🤩","😈","👻","💀","👽","🤡","🦸","🦹","🧙","🧛","🧜","🧚","🧝","🧞","🥷","🧑‍🚀","🧑‍🔬","🧑‍💻","🧑‍🎨","🧑‍🏫","🧑‍🔧","🧑‍🍳","🧑‍⚕️","🧑‍🌾",
    "🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚪","⚫","🔶","🔷","🔸","🔹","♠️","♥️","♦️","♣️","🃏","🀄","🎴","🏁","🚩","🎌","🏳️‍🌈","🏴‍☠️","🔔"
];

function PasswordChangeSection({ currentUser }: { currentUser: string }) {
    const [open, setOpen] = useState(false);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const submit = async () => {
        if (!currentPw || !newPw || !confirmPw) { setMsg({ type: "error", text: "모든 항목을 입력하세요" }); return; }
        if (newPw !== confirmPw) { setMsg({ type: "error", text: "새 비밀번호가 일치하지 않습니다" }); return; }
        if (newPw.length < 4) { setMsg({ type: "error", text: "비밀번호는 4자 이상이어야 합니다" }); return; }
        setLoading(true); setMsg(null);
        try {
            const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "changePassword", userName: currentUser, currentPassword: currentPw, newPassword: newPw }) });
            const data = await res.json();
            if (res.ok) { setMsg({ type: "success", text: "비밀번호가 변경되었습니다" }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
            else setMsg({ type: "error", text: data.error || "변경 실패" });
        } catch { setMsg({ type: "error", text: "서버 연결 실패" }); }
        setLoading(false);
    };
    return (
        <div className="bg-white border border-slate-200 rounded-lg">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors rounded-lg">
                <h3 className="text-[14px] font-bold text-slate-800">비밀번호 변경</h3>
                <span className={`text-slate-400 text-[13px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
            </button>
            {open && <div className="px-5 pb-5 space-y-3 max-w-[360px]">
                <div><label className="text-[12px] text-slate-500 block mb-1">현재 비밀번호</label><input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setMsg(null); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                <div><label className="text-[12px] text-slate-500 block mb-1">새 비밀번호</label><input type="password" value={newPw} onChange={e => { setNewPw(e.target.value); setMsg(null); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                <div><label className="text-[12px] text-slate-500 block mb-1">새 비밀번호 확인</label><input type="password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setMsg(null); }} onKeyDown={e => e.key === "Enter" && !loading && submit()} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                {msg && <p className={`text-[13px] ${msg.type === "success" ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
                <button onClick={submit} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 disabled:opacity-60">{loading ? "변경 중..." : "비밀번호 변경"}</button>
            </div>}
        </div>
    );
}

function AdminLogSection() {
    const MEMBERS = useContext(MembersContext);
    const [logs, setLogs] = useState<{ userName: string; section: string; action: string; timestamp: number }[]>([]);
    const [filterUser, setFilterUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/dashboard?section=logs");
                const data = await res.json();
                setLogs(data.data || []);
            } catch { /* ignore */ }
            setLoading(false);
        })();
    }, []);

    const SECTION_LABELS: Record<string, string> = { announcements: "공지사항", papers: "논문", experiments: "실험", todos: "To-do", conferences: "학회/출장", lectures: "수업", patents: "지식재산권", vacations: "휴가", schedule: "일정", timetable: "시간표", reports: "계획서/보고서", teams: "팀", dailyTargets: "오늘 목표", philosophy: "연구실 철학", resources: "자료", ideas: "아이디어", analyses: "해석", chatPosts: "잡담", customEmojis: "이모지", statusMessages: "한마디", equipmentList: "장비", personalMemos: "개인 메모", teamMemos: "팀 메모", labChat: "연구실 채팅", labFiles: "파일", meetings: "회의록", analysisToolList: "해석 도구", paperTagList: "태그", members: "멤버", dispatches: "출장" };

    const uniqueUsers = useMemo(() => [...new Set(logs.map(l => l.userName))].sort(), [logs]);
    const filtered = filterUser ? logs.filter(l => l.userName === filterUser) : logs;

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-[14px] font-bold text-slate-800 mb-3">수정 로그</h3>
            {loading ? <p className="text-[13px] text-slate-400">로딩 중...</p> : (
                <>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        <button onClick={() => setFilterUser(null)} className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${!filterUser ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>전체</button>
                        {uniqueUsers.map(u => (
                            <button key={u} onClick={() => setFilterUser(filterUser === u ? null : u)}
                                className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${filterUser === u ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                {MEMBERS[u]?.emoji || "👤"}{u}
                            </button>
                        ))}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-1">
                        {filtered.length === 0 && <p className="text-[13px] text-slate-400 py-4 text-center">로그가 없습니다</p>}
                        {filtered.slice(0, 200).map((l, i) => (
                            <div key={i} className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded text-[13px]">
                                <span className="text-slate-400 text-[11px] font-mono shrink-0 w-[120px]">{new Date(l.timestamp).toLocaleString("ko-KR")}</span>
                                <button onClick={() => setFilterUser(filterUser === l.userName ? null : l.userName)} className="text-slate-700 font-medium shrink-0 hover:text-blue-600 transition-colors">{MEMBERS[l.userName]?.emoji || "👤"}{l.userName}</button>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-600">{SECTION_LABELS[l.section] || l.section}</span>
                            </div>
                        ))}
                        {filtered.length > 200 && <p className="text-[11px] text-slate-400 text-center py-2">최근 200건만 표시</p>}
                    </div>
                </>
            )}
        </div>
    );
}

function SettingsView({ currentUser, customEmojis, onSaveEmoji, statusMessages, onSaveStatusMsg }: { currentUser: string; customEmojis: Record<string, string>; onSaveEmoji: (name: string, emoji: string) => void; statusMessages: Record<string, string>; onSaveStatusMsg: (name: string, msg: string) => void }) {
    const MEMBERS = useContext(MembersContext);
    const savedEmoji = customEmojis[currentUser] || MEMBERS[currentUser]?.emoji || "👤";
    const [selectedEmoji, setSelectedEmoji] = useState(savedEmoji);
    const [msg, setMsg] = useState(statusMessages[currentUser] || "");
    const emojiChanged = selectedEmoji !== savedEmoji;
    return (
        <div className="space-y-4">
            {/* 비밀번호 변경 */}
            <PasswordChangeSection currentUser={currentUser} />
            {/* 한마디 */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-[14px] font-bold text-slate-800 mb-3">하고 싶은 말 한마디</h3>
                <p className="text-[12px] text-slate-400 mb-3">팀 Overview에 표시됩니다</p>
                {statusMessages[currentUser] && (
                    <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-[13px] text-blue-700 italic">&ldquo;{statusMessages[currentUser]}&rdquo;</div>
                )}
                <div className="flex gap-2">
                    <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="오늘의 한마디를 남겨보세요..." maxLength={50} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { onSaveStatusMsg(currentUser, msg.trim()); } }} />
                    <button onClick={() => { if (msg.trim()) onSaveStatusMsg(currentUser, msg.trim()); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 shrink-0">저장</button>
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 text-right">{msg.length}/50</div>
            </div>
            {/* 이모지 */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-[14px] font-bold text-slate-800 mb-4">내 이모지 설정</h3>
                <div className="flex items-center gap-3 mb-3">
                    <div>
                        <span className="text-[13px] text-slate-500">현재: </span>
                        <span className="text-[20px]">{selectedEmoji}</span>
                        <span className="text-[14px] text-slate-700 ml-2 font-medium">{currentUser}</span>
                    </div>
                    <button onClick={() => { onSaveEmoji(currentUser, selectedEmoji); }}
                        disabled={!emojiChanged}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${emojiChanged ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}>
                        저장
                    </button>
                    {emojiChanged && <span className="text-[12px] text-amber-500 font-medium">변경됨 — 저장을 눌러주세요</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setSelectedEmoji(e)}
                            className={`w-9 h-9 rounded-lg text-[18px] flex items-center justify-center transition-all ${selectedEmoji === e ? "bg-blue-100 ring-2 ring-blue-500 scale-110" : "bg-slate-50 hover:bg-slate-100 hover:scale-105"}`}>
                            {e}
                        </button>
                    ))}
                </div>
            </div>
            {/* Admin Log */}
            {currentUser === "박일웅" && <AdminLogSection />}
        </div>
    );
}

// ─── Login ───────────────────────────────────────────────────────────────────

// ─── Personal Memo View ──────────────────────────────────────────────────────

const MEMO_COLORS = ["#f8fafc", "#fef3c7", "#dcfce7", "#dbeafe", "#fce7f3", "#f3e8ff", "#e0f2fe", "#fef9c3", "#fff1f2", "#ecfdf5", "#eff6ff", "#fdf4ff", "#fffbeb", "#f0fdfa", "#faf5ff", "#fff7ed"];
const MEMO_BORDERS = ["", "#94a3b8", "#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];

function ColorPicker({ color, onColor, compact }: { color: string; onColor: (c: string) => void; compact?: boolean }) {
    return (
        <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">배경색</label>
            <div className="flex flex-wrap gap-1">{MEMO_COLORS.map(c => (
                <button key={c} onClick={() => onColor(c)} className={`${compact ? "w-5 h-5" : "w-6 h-6"} rounded border-2 transition-all ${color === c ? "border-blue-500 scale-110" : "border-slate-200"}`} style={{ background: c }} />
            ))}</div>
        </div>
    );
}

function PersonalMemoView({ memos, onSave, onDelete, files, onAddFile, onDeleteFile, chat, onAddChat, onDeleteChat, onClearChat, currentUser }: {
    memos: Memo[]; onSave: (m: Memo) => void; onDelete: (id: number) => void;
    files: LabFile[]; onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
    chat: TeamChatMsg[]; onAddChat: (msg: TeamChatMsg) => void; onDeleteChat: (id: number) => void; onClearChat: () => void;
    currentUser: string;
}) {
    const MEMBERS = useContext(MembersContext);
    const [selected, setSelected] = useState<Memo | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [color, setColor] = useState(MEMO_COLORS[0]);
    const [borderColor, setBorderColor] = useState("");
    const [newComment, setNewComment] = useState("");
    const [chatText, setChatText] = useState("");
    const [chatImg, setChatImg] = useState("");
    const [imgUploading, setImgUploading] = useState(false);
    const [previewImg, setPreviewImg] = useState("");
    const chatFileRef = useRef<HTMLInputElement>(null);
    const composingRef = useRef(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const openDetail = (m: Memo) => { setSelected(m); setIsEditing(false); setNewComment(""); };
    const startEdit = () => { if (!selected) return; setTitle(selected.title); setContent(selected.content); setColor(selected.color); setBorderColor(selected.borderColor || ""); setIsEditing(true); };
    const saveEdit = () => {
        if (!selected) return;
        const now = new Date().toISOString().split("T")[0];
        const updated = { ...selected, title: title.trim() || "제목 없음", content, color, borderColor, updatedAt: now };
        onSave(updated); setSelected(updated); setIsEditing(false);
    };
    const openAdd = () => { setAdding(true); setTitle(""); setContent(""); setColor(MEMO_COLORS[0]); setBorderColor(""); };
    const saveNew = () => {
        const now = new Date().toISOString().split("T")[0];
        onSave({ id: Date.now(), title: title.trim() || "제목 없음", content, color, borderColor, updatedAt: now, comments: [] });
        setAdding(false);
    };
    const addComment = () => {
        if (!newComment.trim() || !selected) return;
        const updated = { ...selected, comments: [...(selected.comments || []), { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] };
        onSave(updated); setSelected(updated); setNewComment("");
    };
    const deleteComment = (cid: number) => {
        if (!selected) return;
        const updated = { ...selected, comments: (selected.comments || []).filter(c => c.id !== cid) };
        onSave(updated); setSelected(updated);
    };
    const sendChat = () => {
        if (!chatText.trim() && !chatImg) return;
        onAddChat({ id: Date.now(), author: currentUser, text: chatText.trim(), date: new Date().toLocaleString("ko-KR"), imageUrl: chatImg || undefined });
        setChatText(""); setChatImg("");
    };
    const handleChatImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setImgUploading(true);
        try { const url = await uploadFile(file); setChatImg(url); } catch {}
        setImgUploading(false); e.target.value = "";
    };
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile(); if (!file) return;
                setImgUploading(true);
                try { const url = await uploadFile(file); setChatImg(url); } catch {}
                setImgUploading(false); return;
            }
        }
    };

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.length]);

    return (
        <div className="flex gap-3 h-[calc(100vh-140px)]">
            {/* Board (2/4) */}
            <div className="w-2/4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-bold text-slate-700">📝 노트</h3>
                    <button onClick={openAdd} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 추가</button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {memos.length === 0 && !adding && <div className="text-center py-12 text-slate-400 text-[13px]">노트가 없습니다</div>}
                    <div className="grid grid-cols-2 gap-2">
                        {[...memos].sort((a, b) => b.id - a.id).map(m => {
                            const cmts = m.comments || [];
                            return (
                                <div key={m.id} className={`rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col group relative ${m.needsDiscussion && !m.borderColor ? "ring-1 ring-orange-200" : ""}`}
                                    style={{ background: m.color, border: m.borderColor ? `2px solid ${m.borderColor}` : m.needsDiscussion ? "2px solid #fb923c" : "1px solid #e2e8f0" }}
                                    onClick={() => openDetail(m)}>
                                    <button onClick={e => { e.stopPropagation(); onDelete(m.id); }}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <label className="flex items-center gap-1.5 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={!!m.needsDiscussion} onChange={() => onSave({ ...m, needsDiscussion: !m.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                        <span className={`text-[10px] font-medium ${m.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                    </label>
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="text-[13px] font-semibold text-slate-800 break-words flex-1">{m.title}</div>
                                        <span className="text-[10px] text-slate-400 ml-1 whitespace-nowrap">{m.updatedAt}</span>
                                    </div>
                                    {m.content && <div className="text-[11px] text-slate-600 mb-2 line-clamp-3 break-words">{m.content}</div>}
                                    {cmts.length > 0 ? (
                                        <div className="border-t border-slate-100 pt-1.5 mt-auto space-y-0.5">
                                            <div className="text-[10px] font-semibold text-slate-400">💬 댓글 {cmts.length}개</div>
                                            {cmts.slice(-2).map(c => (
                                                <div key={c.id} className="text-[10px] text-slate-500 truncate">
                                                    <span className="font-medium text-slate-600">{c.author}</span> {c.text}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border-t border-slate-100 pt-1.5 mt-auto">
                                            <div className="text-[10px] text-slate-300">💬 댓글 없음</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Files (1/4) */}
            <div className="w-1/4 flex flex-col bg-white border border-slate-200 rounded-lg">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">📎 파일</h3>
                    <span className="text-[12px] text-slate-400">{files.length}개</span>
                </div>
                <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} />
            </div>
            {/* PI Chat (1/4) */}
            <div className="w-1/4 flex flex-col bg-white border border-slate-200 rounded-lg">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">💬 PI 채팅</h3>
                    {currentUser === "박일웅" && (
                        <button onClick={() => { if (confirm("채팅을 모두 삭제하시겠습니까?")) onClearChat(); }} className="text-[12px] text-slate-400 hover:text-red-500">초기화</button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chat.length === 0 && <div className="text-center py-12 text-slate-400 text-[12px]">PI와 대화를 시작하세요</div>}
                    {chat.map(msg => (
                        <div key={msg.id} className={`group ${msg.author === currentUser ? "text-right" : ""}`}>
                            <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-[13px] ${msg.author === currentUser ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                                {msg.author !== currentUser && <div className="text-[11px] font-bold mb-0.5">{MEMBERS[msg.author]?.emoji || "👤"} {msg.author}</div>}
                                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mb-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
                                {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                                <div className={`text-[10px] mt-0.5 ${msg.author === currentUser ? "text-blue-200" : "text-slate-400"}`}>{msg.date}</div>
                            </div>
                            {msg.author === currentUser && (
                                <button onClick={() => onDeleteChat(msg.id)} className="text-[10px] text-slate-300 hover:text-red-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-2.5 border-t border-slate-100">
                    {chatImg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[80px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-1.5 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        <button onClick={() => chatFileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[16px]" title="사진 첨부">{imgUploading ? "⏳" : "📷"}</button>
                        <textarea value={chatText} onChange={e => setChatText(e.target.value)} onPaste={handlePaste}
                            placeholder="메시지 입력..." rows={1}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        <button onClick={sendChat} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 flex-shrink-0">전송</button>
                    </div>
                </div>
            </div>

            {/* Add modal */}
            {adding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setAdding(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">새 노트</h3>
                            <button onClick={() => setAdding(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용..." rows={5} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            <ColorPicker color={color} onColor={setColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => setAdding(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveNew} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail modal */}
            {selected && !isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selected.title}</h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={startEdit} className="text-[13px] text-blue-500 hover:text-blue-600 font-medium">수정</button>
                                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="text-[12px] text-slate-400 mb-3">{selected.updatedAt}</div>
                            {selected.content && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap break-words">{selected.content}</div>}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({(selected.comments || []).length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {(selected.comments || []).map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group/c relative">
                                            <button onClick={() => deleteComment(c.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover/c:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4 break-words">{c.text}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{c.date}</div>
                                        </div>
                                    ))}
                                    {(selected.comments || []).length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">댓글이 없습니다</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addComment(); }} />
                                    <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] hover:bg-blue-600 font-medium flex-shrink-0">전송</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {selected && isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">노트 수정</h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용..." rows={5} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            <ColorPicker color={color} onColor={setColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveEdit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}

            {previewImg && (
                <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImg("")}>
                    <img src={previewImg} alt="" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
                </div>
            )}
        </div>
    );
}

// ─── Meeting View ────────────────────────────────────────────────────────────

function MeetingFormModal({ meeting, onSave, onDelete, onClose, currentUser, teamNames }: {
    meeting: Meeting | null; onSave: (m: Meeting) => void; onDelete?: (id: number) => void; onClose: () => void; currentUser: string; teamNames: string[];
}) {
    const isEdit = !!meeting;
    const [title, setTitle] = useState(meeting?.title || "");
    const [goal, setGoal] = useState(meeting?.goal || "");
    const [summary, setSummary] = useState(meeting?.summary || "");
    const [date, setDate] = useState(meeting?.date || new Date().toISOString().split("T")[0]);
    const [assignees, setAssignees] = useState<string[]>(meeting?.assignees || []);
    const [team, setTeam] = useState(meeting?.team || "");
    const [comments, setComments] = useState<Comment[]>(meeting?.comments || []);
    const [newComment, setNewComment] = useState("");
    const composingRef = useRef(false);

    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ id: meeting?.id ?? Date.now(), title: title.trim(), goal: goal.trim(), summary: summary.trim(), date, assignees, status: "done", creator: meeting?.creator || currentUser, createdAt: meeting?.createdAt || new Date().toLocaleString("ko-KR"), comments, team, needsDiscussion: meeting?.needsDiscussion });
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
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "회의록 수정" : "회의록 작성"}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                </div>
                <div className="p-4 space-y-3">
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">회의 이름 *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">목표</label>
                        <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="이번 회의에서 달성할 목표" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">날짜</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">참석자</label>
                        <PillSelect options={MEMBER_NAMES} selected={assignees} onToggle={v => setAssignees(toggleArr(assignees, v))} />
                    </div>
                    {teamNames.length > 0 && <TeamSelect teamNames={teamNames} selected={team} onSelect={v => setTeam(v)} />}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용 요약</label>
                        <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={5} placeholder="회의 내용을 요약해 주세요..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>
                    {/* Comments */}
                    <div>
                        <label className="text-[12px] font-semibold text-slate-500 block mb-1">댓글 ({comments.length})</label>
                        <div className="space-y-1.5 mb-2 max-h-[200px] overflow-y-auto">
                            {comments.map(c => (
                                <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2 group relative text-[13px]">
                                    <button onClick={() => setComments(comments.filter(x => x.id !== c.id))}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100">✕</button>
                                    <div className="text-slate-700 pr-4">{c.text}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{c.author} · {c.date}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글..."
                                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                onCompositionStart={() => { composingRef.current = true; }}
                                onCompositionEnd={() => { composingRef.current = false; }}
                                onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addComment(); }} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] hover:bg-blue-600">추가</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div>
                        {isEdit && onDelete && <button onClick={() => { onDelete(meeting!.id); onClose(); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { handleSave(); onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MeetingView({ meetings, onSave, onDelete, currentUser, teamNames }: {
    meetings: Meeting[]; onSave: (m: Meeting) => void; onDelete: (id: number) => void; currentUser: string; teamNames: string[];
}) {
    const MEMBERS = useContext(MembersContext);
    const [editing, setEditing] = useState<Meeting | null>(null);
    const [adding, setAdding] = useState(false);
    const [filterTeam, setFilterTeam] = useState("전체");

    const filtered = filterTeam === "전체" ? meetings : meetings.filter(m => m.team === filterTeam);
    const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setAdding(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 회의록 작성</button>
                <span className="text-[13px] text-slate-400">총 {filtered.length}건</span>
            </div>
            {teamNames.length > 0 && <TeamFilterBar teamNames={teamNames} selected={filterTeam} onSelect={setFilterTeam} />}
            <div className="grid grid-cols-3 gap-3">
                {sorted.map(m => (
                    <div key={m.id} onClick={() => setEditing(m)}
                        className={`bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col ${m.needsDiscussion ? "border-2 border-orange-400 ring-1 ring-orange-200" : "border border-slate-200"}`}>
                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!m.needsDiscussion} onChange={() => onSave({ ...m, needsDiscussion: !m.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                            <span className={`text-[11px] font-medium ${m.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="flex items-start justify-between mb-1">
                            <div className="text-[14px] font-semibold text-slate-800 break-words flex-1">{m.title}</div>
                            <span className="text-[11px] text-slate-400 ml-2 whitespace-nowrap">{m.date}</span>
                        </div>
                        {m.team && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium self-start mb-1">{m.team}</span>}
                        {m.goal && <div className="text-[12px] text-blue-600 mb-1 line-clamp-1"><span className="font-semibold">목표:</span> {m.goal}</div>}
                        {m.summary && <div className="text-[13px] text-slate-600 mb-2 line-clamp-3 break-words">{m.summary}</div>}
                        <div className="flex flex-wrap gap-0.5 mb-2">
                            {m.assignees.slice(0, 5).map(a => <span key={a} className="text-[10px] px-1 py-0.5 rounded bg-slate-50 text-slate-600">{MEMBERS[a]?.emoji}{a}</span>)}
                            {m.assignees.length > 5 && <span className="text-[10px] text-slate-400">+{m.assignees.length - 5}</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 mb-1">{MEMBERS[m.creator]?.emoji || ""} {m.creator}</div>
                        {m.comments.length > 0 ? (
                            <div className="border-t border-slate-100 pt-2 mt-auto space-y-1">
                                <div className="text-[11px] font-semibold text-slate-400 mb-1">💬 댓글 {m.comments.length}개</div>
                                {m.comments.slice(-2).map(c => (
                                    <div key={c.id} className="text-[12px] text-slate-500 truncate">
                                        <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {c.text}
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
                {sorted.length === 0 && <div className="text-[14px] text-slate-400 text-center py-12 col-span-full">아직 회의록이 없습니다</div>}
            </div>
            {adding && <MeetingFormModal meeting={null} onSave={m => { onSave(m); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} teamNames={teamNames} />}
            {editing && <MeetingFormModal meeting={editing} onSave={m => { onSave(m); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} teamNames={teamNames} />}
        </div>
    );
}

// ─── Lab Chat View ───────────────────────────────────────────────────────────

function LabChatView({ chat, currentUser, onAdd, onDelete, onClear, files, onAddFile, onDeleteFile, board, onSaveBoard, onDeleteBoard }: {
    chat: TeamChatMsg[]; currentUser: string; onAdd: (msg: TeamChatMsg) => void; onDelete: (id: number) => void; onClear: () => void;
    files: LabFile[]; onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
    board: TeamMemoCard[]; onSaveBoard: (c: TeamMemoCard) => void; onDeleteBoard: (id: number) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const [text, setText] = useState("");
    const [chatImg, setChatImg] = useState("");
    const [imgUploading, setImgUploading] = useState(false);
    const [previewImg, setPreviewImg] = useState("");
    const chatFileRef = useRef<HTMLInputElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const composingRef = useRef(false);
    const [boardAdding, setBoardAdding] = useState(false);
    const [boardTitle, setBoardTitle] = useState("");
    const [boardContent, setBoardContent] = useState("");
    const [boardColor, setBoardColor] = useState(MEMO_COLORS[0]);
    const [selectedCard, setSelectedCard] = useState<TeamMemoCard | null>(null);
    const [boardComment, setBoardComment] = useState("");

    const send = () => {
        if (!text.trim() && !chatImg) return;
        onAdd({ id: Date.now(), author: currentUser, text: text.trim(), date: new Date().toLocaleString("ko-KR"), imageUrl: chatImg || undefined });
        setText(""); setChatImg("");
    };
    const handleChatImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setImgUploading(true);
        try { const url = await uploadFile(file); setChatImg(url); } catch {}
        setImgUploading(false); e.target.value = "";
    };
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile(); if (!file) return;
                setImgUploading(true);
                try { const url = await uploadFile(file); setChatImg(url); } catch {}
                setImgUploading(false); return;
            }
        }
    };
    const openBoardAdd = () => { setBoardAdding(true); setBoardTitle(""); setBoardContent(""); setBoardColor(MEMO_COLORS[0]); };
    const saveBoard = () => {
        onSaveBoard({ id: Date.now(), title: boardTitle.trim() || "제목 없음", content: boardContent, status: "left", color: boardColor, author: currentUser, updatedAt: new Date().toISOString().split("T")[0] });
        setBoardAdding(false);
    };

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.length]);

    return (
        <div className="flex gap-3 h-[calc(100vh-140px)]">
            {/* Board (1/4) */}
            <div className="w-1/4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-bold text-slate-700">📌 보드</h3>
                    <button onClick={openBoardAdd} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 추가</button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                    {board.map(card => {
                        const cmts = card.comments || [];
                        return (
                            <div key={card.id} onClick={() => setSelectedCard(card)}
                                className={`rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-shadow flex flex-col group relative ${card.needsDiscussion ? "ring-1 ring-orange-200" : ""}`}
                                style={{ background: card.color || "#fff", border: card.needsDiscussion ? "2px solid #fb923c" : "1px solid #e2e8f0" }}>
                                <button onClick={e => { e.stopPropagation(); onDeleteBoard(card.id); }}
                                    className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!card.needsDiscussion} onChange={() => onSaveBoard({ ...card, needsDiscussion: !card.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                    <span className={`text-[10px] font-medium ${card.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                </label>
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="text-[13px] font-semibold text-slate-800 break-words flex-1">{card.title}</h4>
                                    <span className="text-[10px] text-slate-400 ml-1 whitespace-nowrap">{card.updatedAt}</span>
                                </div>
                                {card.content && <div className="text-[11px] text-slate-600 mb-2 line-clamp-2 break-words">{card.content}</div>}
                                <div className="text-[10px] text-slate-400 mb-1">{MEMBERS[card.author]?.emoji || "👤"} {card.author}</div>
                                {cmts.length > 0 ? (
                                    <div className="border-t border-slate-100 pt-1.5 mt-auto space-y-0.5">
                                        <div className="text-[10px] font-semibold text-slate-400">💬 댓글 {cmts.length}개</div>
                                        {cmts.slice(-2).map(c => (
                                            <div key={c.id} className="text-[10px] text-slate-500 truncate">
                                                <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {c.text}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border-t border-slate-100 pt-1.5 mt-auto">
                                        <div className="text-[10px] text-slate-300">💬 댓글 없음</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {board.length === 0 && (
                        <button onClick={openBoardAdd} className="w-full py-6 text-[12px] text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">+ 추가</button>
                    )}
                </div>
            </div>
            {/* Files (1/4) */}
            <div className="w-1/4 flex flex-col bg-white border border-slate-200 rounded-lg">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">📎 파일</h3>
                    <span className="text-[12px] text-slate-400">{files.length}개</span>
                </div>
                <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} />
            </div>
            {/* Chat (2/4) */}
            <div className="w-2/4 flex flex-col bg-white border border-slate-200 rounded-lg">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-slate-700">💬 연구실 채팅</h3>
                    {currentUser === "박일웅" && (
                        <button onClick={() => { if (confirm("채팅을 모두 삭제하시겠습니까?")) onClear(); }} className="text-[12px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chat.length === 0 && <div className="text-center py-16 text-slate-400 text-[14px]">메시지가 없습니다. 자유롭게 대화해 보세요!</div>}
                    {chat.map(msg => (
                        <div key={msg.id} className={`group ${msg.author === currentUser ? "text-right" : ""}`}>
                            <div className={`inline-block max-w-[75%] rounded-lg px-3.5 py-2.5 text-[14px] ${msg.author === currentUser ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                                {msg.author !== currentUser && <div className="text-[12px] font-bold mb-0.5">{MEMBERS[msg.author]?.emoji || "👤"} {msg.author}</div>}
                                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full max-h-[300px] rounded-md mb-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
                                {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                                <div className={`text-[11px] mt-1 ${msg.author === currentUser ? "text-blue-200" : "text-slate-400"}`}>{msg.date}</div>
                            </div>
                            {msg.author === currentUser && (
                                <button onClick={() => onDelete(msg.id)} className="text-[11px] text-slate-300 hover:text-red-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                            )}
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>
                <div className="p-3 border-t border-slate-100">
                    {chatImg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[100px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-2 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        <button onClick={() => chatFileRef.current?.click()} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[18px]" title="사진 첨부">{imgUploading ? "⏳" : "📷"}</button>
                        <textarea value={text} onChange={e => setText(e.target.value)} onPaste={handlePaste}
                            placeholder="메시지 입력..." rows={1}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        <button onClick={send} className="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600 flex-shrink-0">전송</button>
                    </div>
                </div>
            </div>
            {/* Board add modal */}
            {boardAdding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setBoardAdding(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">새 글 작성</h3>
                            <button onClick={() => setBoardAdding(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={boardTitle} onChange={e => setBoardTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            <textarea value={boardContent} onChange={e => setBoardContent(e.target.value)} placeholder="내용..." rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            <ColorPicker color={boardColor} onColor={setBoardColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => setBoardAdding(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveBoard} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">게시</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Board detail modal */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSelectedCard(null); setBoardComment(""); }}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selectedCard.title}</h3>
                            <button onClick={() => { setSelectedCard(null); setBoardComment(""); }} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="text-[12px] text-slate-400 mb-3">{MEMBERS[selectedCard.author]?.emoji || "👤"} {selectedCard.author} · {selectedCard.updatedAt}</div>
                            {selectedCard.content && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap break-words">{selectedCard.content}</div>}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({(selectedCard.comments || []).length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {(selectedCard.comments || []).map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group/c relative">
                                            <button onClick={() => { const updated = { ...selectedCard, comments: (selectedCard.comments || []).filter(x => x.id !== c.id) }; onSaveBoard(updated); setSelectedCard(updated); }}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover/c:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4 break-words">{c.text}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {(selectedCard.comments || []).length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={boardComment} onChange={e => setBoardComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onKeyDown={e => { if (e.key === "Enter" && boardComment.trim()) { const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: Date.now(), author: currentUser, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); } }} />
                                    <button onClick={() => { if (!boardComment.trim()) return; const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: Date.now(), author: currentUser, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] hover:bg-blue-600 font-medium">전송</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {previewImg && (
                <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImg("")}>
                    <img src={previewImg} alt="" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
                </div>
            )}
        </div>
    );
}

// ─── File Helpers ────────────────────────────────────────────────────────────

const FILE_MAX = 10 * 1024 * 1024;
const isImageFile = (f: LabFile) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(f.name) || f.type?.startsWith("image/");
const isPdfFile = (f: LabFile) => /\.pdf$/i.test(f.name) || f.type === "application/pdf";

async function uploadFile(file: File): Promise<string> {
    try {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`dashboard/${Date.now()}_${file.name}`, file, { access: "public", handleUploadUrl: "/api/dashboard-files" });
        return blob.url;
    } catch {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

function FilePreviewModal({ file, onClose }: { file: LabFile; onClose: () => void }) {
    const img = isImageFile(file);
    const pdf = isPdfFile(file);
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <span className="text-[14px] font-bold text-slate-800 truncate flex-1 pr-4">{file.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                        <a href={file.url} download={file.name} className="text-[13px] text-blue-500 hover:text-blue-600 font-medium">다운로드</a>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                    </div>
                </div>
                <div className="overflow-auto" style={{ maxHeight: "calc(90vh - 60px)" }}>
                    {img && <img src={file.url} alt={file.name} className="max-w-full mx-auto p-4" />}
                    {pdf && <iframe src={file.url} className="w-full border-0" style={{ height: "75vh" }} />}
                    {!img && !pdf && (
                        <div className="text-center py-20">
                            <div className="text-[48px] mb-4">📄</div>
                            <div className="text-[15px] font-semibold text-slate-700 mb-1">{file.name}</div>
                            <div className="text-[13px] text-slate-400 mb-6">{(file.size / 1024).toFixed(0)} KB · {file.type || "알 수 없는 형식"}</div>
                            <a href={file.url} download={file.name} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-[14px] hover:bg-blue-600 inline-block">다운로드</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FileBox({ files, currentUser, onAddFile, onDeleteFile, compact }: {
    files: LabFile[]; currentUser: string; onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void; compact?: boolean;
}) {
    const MEMBERS = useContext(MembersContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<LabFile | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > FILE_MAX) { alert("10MB 이하 파일만 업로드 가능합니다."); return; }
        setUploading(true);
        try {
            const url = await uploadFile(file);
            onAddFile({ id: Date.now(), name: file.name, size: file.size, url, type: file.type, uploader: currentUser, date: new Date().toLocaleString("ko-KR") });
        } catch { alert("파일 업로드에 실패했습니다."); }
        setUploading(false);
        e.target.value = "";
    };

    const sorted = [...files].sort((a, b) => b.id - a.id);

    return (
        <>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sorted.length === 0 && <div className={`text-center text-slate-400 ${compact ? "py-6 text-[12px]" : "py-12 text-[13px]"}`}>파일을 업로드하세요 (10MB 이하)</div>}
                {sorted.map(f => (
                    <div key={f.id} className="group bg-slate-50 rounded-lg p-2.5 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start gap-2">
                            <span className="text-[16px] mt-0.5 shrink-0 cursor-pointer" onClick={() => { if (isImageFile(f) || isPdfFile(f)) setPreview(f); else { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); } }}>
                                {isImageFile(f) ? "🖼️" : isPdfFile(f) ? "📄" : "📎"}
                            </span>
                            <div className="flex-1 min-w-0">
                                <button onClick={() => { if (isImageFile(f) || isPdfFile(f)) setPreview(f); else { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); } }}
                                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 truncate block w-full text-left">{f.name}</button>
                                <div className="text-[10px] text-slate-400 mt-0.5">{(f.size / 1024).toFixed(0)} KB · {MEMBERS[f.uploader]?.emoji || ""}{f.uploader}</div>
                            </div>
                            {(f.uploader === currentUser || currentUser === "박일웅") && (
                                <button onClick={() => { if (confirm("삭제?")) onDeleteFile(f.id); }}
                                    className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">✕</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2.5 border-t border-slate-100">
                <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50">
                    {uploading ? "업로드 중..." : "📎 파일 업로드"}
                </button>
            </div>
            {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
        </>
    );
}

// ─── Team Memo View ──────────────────────────────────────────────────────────

const TEAM_MEMO_COLORS = MEMO_COLORS;
const MEMO_COL_MIGRATE = (s: string) => (s === "done" || s === "right") ? "right" : "left";
const MEMO_COLUMNS = [{ key: "left", label: "진행", color: "#3b82f6" }, { key: "right", label: "완료", color: "#8b5cf6" }];

function TeamMemoView({ teamName, kanban, chat, files, currentUser, onSaveCard, onDeleteCard, onReorderCards, onAddChat, onDeleteChat, onClearChat, onAddFile, onDeleteFile }: {
    teamName: string; kanban: TeamMemoCard[]; chat: TeamChatMsg[]; files: LabFile[]; currentUser: string;
    onSaveCard: (card: TeamMemoCard) => void; onDeleteCard: (id: number) => void; onReorderCards: (cards: TeamMemoCard[]) => void;
    onAddChat: (msg: TeamChatMsg) => void; onDeleteChat: (id: number) => void; onClearChat: () => void;
    onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<TeamMemoCard | null>(null);
    const [selected, setSelected] = useState<TeamMemoCard | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [col, setCol] = useState("left");
    const [color, setColor] = useState(TEAM_MEMO_COLORS[0]);
    const [borderClr, setBorderClr] = useState("");
    const [chatText, setChatText] = useState("");
    const [chatImg, setChatImg] = useState("");
    const [imgUploading, setImgUploading] = useState(false);
    const [previewImg, setPreviewImg] = useState("");
    const chatFileRef = useRef<HTMLInputElement>(null);
    const [newComment, setNewComment] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const composingRef = useRef(false);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);

    const openNew = (c = "left") => { setEditing(null); setTitle(""); setContent(""); setCol(c); setColor(TEAM_MEMO_COLORS[0]); setBorderClr(""); setShowForm(true); };
    const openDetail = (c: TeamMemoCard) => { setSelected(c); setIsEditing(false); setNewComment(""); };
    const startEdit = () => {
        if (!selected) return;
        setEditing(selected); setTitle(selected.title); setContent(selected.content); setCol(MEMO_COL_MIGRATE(selected.status)); setColor(selected.color); setBorderClr(selected.borderColor || ""); setIsEditing(true);
    };
    const saveEdit = () => {
        if (!editing) return;
        const now = new Date().toISOString().split("T")[0];
        const updated = { ...editing, title: title.trim() || "제목 없음", content, status: col, color, borderColor: borderClr, updatedAt: now };
        onSaveCard(updated); setSelected(updated); setIsEditing(false);
    };
    const saveNew = () => {
        const now = new Date().toISOString().split("T")[0];
        onSaveCard({ id: Date.now(), title: title.trim() || "제목 없음", content, status: col, color, borderColor: borderClr, author: currentUser, updatedAt: now, comments: [] });
        setShowForm(false);
    };
    const addComment = () => {
        if (!newComment.trim() || !selected) return;
        const updated = { ...selected, comments: [...(selected.comments || []), { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] };
        onSaveCard(updated); setSelected(updated); setNewComment("");
    };
    const deleteComment = (cid: number) => {
        if (!selected) return;
        const updated = { ...selected, comments: (selected.comments || []).filter(c => c.id !== cid) };
        onSaveCard(updated); setSelected(updated);
    };
    const sendChat = () => {
        if (!chatText.trim() && !chatImg) return;
        onAddChat({ id: Date.now(), author: currentUser, text: chatText.trim(), date: new Date().toLocaleString("ko-KR"), imageUrl: chatImg || undefined });
        setChatText(""); setChatImg("");
    };
    const handleChatImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setImgUploading(true);
        try { const url = await uploadFile(file); setChatImg(url); } catch {}
        setImgUploading(false); e.target.value = "";
    };
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile(); if (!file) return;
                setImgUploading(true);
                try { const url = await uploadFile(file); setChatImg(url); } catch {}
                setImgUploading(false); return;
            }
        }
    };

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.length]);

    return (
        <div className="flex gap-3 h-[calc(100vh-140px)]">
            {/* Board (1/4) - single column */}
            <div className="w-1/4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-bold text-slate-700">📌 보드</h3>
                    <button onClick={() => openNew()} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 추가</button>
                </div>
                {showForm && (
                    <div className="bg-white border border-blue-200 rounded-lg p-2.5 mb-2 space-y-1.5 flex-shrink-0">
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용..." rows={2} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        <ColorPicker color={color} onColor={setColor} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowForm(false)} className="px-2 py-1 text-[12px] text-slate-500">취소</button>
                            <button onClick={saveNew} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">저장</button>
                        </div>
                    </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2"
                    onDragOver={e => { e.preventDefault(); setDropTarget(calcDropIdx(e, "left")); }}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={() => {
                        if (draggedId == null || !dropTarget) return;
                        const dragged = kanban.find(c => c.id === draggedId);
                        if (!dragged) return;
                        const reordered = reorderKanbanItems(kanban, dragged, dropTarget.col, dropTarget.idx, c => MEMO_COL_MIGRATE(c.status), (c, s) => ({ ...c, status: s }));
                        onReorderCards(reordered); setDraggedId(null); setDropTarget(null);
                    }}>
                    {kanban.map((card, ci) => {
                        const cmts = card.comments || [];
                        return (
                            <div key={card.id}>
                                {dropTarget?.col === "left" && dropTarget?.idx === ci && draggedId !== card.id && <DropLine />}
                                <div draggable onDragStart={() => setDraggedId(card.id)} onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}
                                    onDragOver={e => { if (draggedId === card.id) return; e.stopPropagation(); e.preventDefault(); }}
                                    onClick={() => openDetail(card)}
                                    className={`rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-shadow flex flex-col group relative ${card.needsDiscussion && !card.borderColor ? "ring-1 ring-orange-200" : ""} ${draggedId === card.id ? "opacity-40" : ""}`}
                                    style={{ background: card.color, border: card.borderColor ? `2px solid ${card.borderColor}` : card.needsDiscussion ? "2px solid #fb923c" : "1px solid #e2e8f0" }}>
                                    <button onClick={e => { e.stopPropagation(); onDeleteCard(card.id); }}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={!!card.needsDiscussion} onChange={() => onSaveCard({ ...card, needsDiscussion: !card.needsDiscussion })} className="w-3 h-3 accent-orange-500" />
                                        <span className={`text-[10px] font-medium ${card.needsDiscussion ? "text-orange-500" : "text-slate-400"}`}>논의 필요</span>
                                    </label>
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="text-[13px] font-semibold text-slate-800 break-words flex-1">{card.title}</h4>
                                        <span className="text-[10px] text-slate-400 ml-1 whitespace-nowrap">{card.updatedAt}</span>
                                    </div>
                                    {card.content && <div className="text-[11px] text-slate-600 mb-2 line-clamp-2 break-words">{card.content}</div>}
                                    <div className="text-[10px] text-slate-400 mb-1">{MEMBERS[card.author]?.emoji || "👤"} {card.author}</div>
                                    {cmts.length > 0 ? (
                                        <div className="border-t border-slate-100 pt-1.5 mt-auto space-y-0.5">
                                            <div className="text-[10px] font-semibold text-slate-400">💬 댓글 {cmts.length}개</div>
                                            {cmts.slice(-2).map(c => (
                                                <div key={c.id} className="text-[10px] text-slate-500 truncate">
                                                    <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {c.text}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border-t border-slate-100 pt-1.5 mt-auto">
                                            <div className="text-[10px] text-slate-300">💬 댓글 없음</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {dropTarget?.col === "left" && dropTarget.idx >= kanban.length && draggedId != null && <DropLine />}
                    {kanban.length === 0 && !draggedId && (
                        <button onClick={() => openNew()} className="w-full py-6 text-[12px] text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">+ 추가</button>
                    )}
                </div>
            </div>

            {/* Files (1/4) */}
            <div className="w-1/4 flex flex-col bg-white border border-slate-200 rounded-lg">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-slate-700">📎 파일</h4>
                    <span className="text-[12px] text-slate-400">{files.length}개</span>
                </div>
                <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} compact />
            </div>
            {/* Chat (2/4) */}
            <div className="w-2/4 flex flex-col bg-white border border-slate-200 rounded-lg min-h-0">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-slate-700">💬 채팅</h4>
                    {currentUser === "박일웅" && (
                        <button onClick={() => { if (confirm("채팅을 모두 삭제하시겠습니까?")) onClearChat(); }} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chat.length === 0 && <div className="text-center py-6 text-slate-400 text-[12px]">메시지가 없습니다</div>}
                    {chat.map(msg => (
                        <div key={msg.id} className={`group ${msg.author === currentUser ? "text-right" : ""}`}>
                            <div className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${msg.author === currentUser ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                                {msg.author !== currentUser && <div className="text-[11px] font-bold mb-0.5">{MEMBERS[msg.author]?.emoji || "👤"}{msg.author}</div>}
                                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full max-h-[250px] rounded-md mb-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
                                {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                                <div className={`text-[10px] mt-1 ${msg.author === currentUser ? "text-blue-200" : "text-slate-400"}`}>{msg.date}</div>
                            </div>
                            {msg.author === currentUser && (
                                <button onClick={() => onDeleteChat(msg.id)} className="text-[11px] text-slate-300 hover:text-red-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-2.5 border-t border-slate-100">
                    {chatImg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[80px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-1.5 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        <button onClick={() => chatFileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[16px]" title="사진 첨부">{imgUploading ? "⏳" : "📷"}</button>
                        <textarea value={chatText} onChange={e => setChatText(e.target.value)} onPaste={handlePaste}
                            placeholder="메시지 입력..." rows={1}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        <button onClick={sendChat} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 flex-shrink-0">전송</button>
                    </div>
                </div>
            </div>

            {/* Detail modal */}
            {selected && !isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selected.title}</h3>
                            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="text-[12px] text-slate-400 mb-3">{MEMBERS[selected.author]?.emoji || "👤"} {selected.author} · {selected.updatedAt}</div>
                            {selected.content && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap break-words">{selected.content}</div>}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({(selected.comments || []).length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {(selected.comments || []).map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group/c relative">
                                            <button onClick={() => deleteComment(c.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover/c:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4 break-words">{c.text}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {(selected.comments || []).length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addComment(); }} />
                                    <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] hover:bg-blue-600 font-medium flex-shrink-0">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                <button onClick={startEdit} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                                <button onClick={() => { onDeleteCard(selected.id); setSelected(null); }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                            </div>
                            <button onClick={() => setSelected(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                        </div>
                    </div>
                </div>
            )}
            {selected && isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">카드 수정</h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용..." rows={5} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            <ColorPicker color={color} onColor={setColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveEdit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                        </div>
                    </div>
                </div>
            )}

            {previewImg && (
                <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImg("")}>
                    <img src={previewImg} alt="" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
                </div>
            )}
        </div>
    );
}

function LoginScreen({ onLogin, members }: { onLogin: (name: string, password: string, rememberMe: boolean) => Promise<string | null>; members: Record<string, { team: string; role: string; emoji: string }> }) {
    const [pw, setPw] = useState(""); const [name, setName] = useState(""); const [custom, setCustom] = useState(""); const [err, setErr] = useState("");
    const [remember, setRemember] = useState(false); const [loading, setLoading] = useState(false);
    const submit = async () => {
        const n = name === "__custom" ? custom.trim() : name;
        if (!n) { setErr("이름을 선택하세요"); return; }
        if (!pw) { setErr("비밀번호를 입력하세요"); return; }
        setLoading(true); setErr("");
        const error = await onLogin(n, pw, remember);
        if (error) { setErr(error); setLoading(false); }
    };
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>M</div>
                    <h1 className="text-xl font-bold text-slate-800">MFTEL Dashboard</h1>
                    <p className="text-[13px] text-slate-400 mt-1">Team members only</p>
                </div>
                <div className="space-y-3">
                    <div><label className="text-[13px] font-medium text-slate-600 block mb-1">이름</label><select value={name} onChange={e => { setName(e.target.value); setErr(""); }} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"><option value="">이름 선택...</option>{Object.keys(members).map(n => <option key={n} value={n}>{members[n]?.emoji || "👤"} {n}</option>)}<option value="__custom">직접 입력</option></select></div>
                    {name === "__custom" && <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="이름 입력" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />}
                    <div><label className="text-[13px] font-medium text-slate-600 block mb-1">비밀번호</label><input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} placeholder="비밀번호 입력" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" onKeyDown={e => e.key === "Enter" && !loading && submit()} /></div>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-3.5 h-3.5 accent-blue-500" /><span className="text-[13px] text-slate-500">자동 로그인</span></label>
                    {err && <p className="text-[13px] text-red-500">{err}</p>}
                    <button onClick={submit} disabled={loading} className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>{loading ? "로그인 중..." : "입장"}</button>
                    <p className="text-[12px] text-slate-400 text-center">초기 비밀번호: 0000</p>
                </div>
            </div>
        </div>
    );
}

// ─── Overview Dashboard ──────────────────────────────────────────────────────

function MiniBar({ items, maxVal }: { items: Array<{ label: string; count: number; color: string }>; maxVal: number }) {
    return (
        <div className="space-y-1.5">
            {items.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-500 w-[52px] text-right truncate">{item.label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-[6px] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: maxVal > 0 ? `${Math.max(4, (item.count / maxVal) * 100)}%` : "0%", background: item.color, opacity: item.count > 0 ? 1 : 0.2 }} />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-600 w-[20px]">{item.count}</span>
                </div>
            ))}
        </div>
    );
}

function OverviewDashboard({ papers, reports, experiments, analyses, todos, ipPatents, announcements, dailyTargets, ideas, resources, chatPosts, personalMemos, teamMemos, meetings, onlineUsers, currentUser, onNavigate, mode, statusMessages, members, teams }: {
    papers: Paper[]; reports: Report[]; experiments: Experiment[]; analyses: Analysis[]; todos: Todo[]; ipPatents: Patent[]; announcements: Announcement[]; dailyTargets: DailyTarget[]; ideas: IdeaPost[]; resources: Resource[]; chatPosts: IdeaPost[]; personalMemos: Record<string, Memo[]>; teamMemos: Record<string, { kanban: TeamMemoCard[]; chat: TeamChatMsg[] }>; meetings: Meeting[]; onlineUsers: Array<{ name: string; timestamp: number }>; currentUser: string; onNavigate: (tab: string) => void; mode: "team" | "personal"; statusMessages: Record<string, string>; members: Record<string, { team: string; role: string; emoji: string }>; teams: Record<string, TeamData>;
}) {
    const MEMBERS = useContext(MembersContext);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isPersonal = mode === "personal";
    const MEMBER_NAMES = useMemo(() => Object.keys(members).filter(k => k !== "박일웅"), [members]);

    // For personal mode, filter items to currentUser
    const fp = isPersonal ? papers.filter(p => p.assignees.includes(currentUser)) : papers;
    const fr = isPersonal ? reports.filter(r => r.assignees.includes(currentUser)) : reports;
    const fe = isPersonal ? experiments.filter(e => e.assignees.includes(currentUser)) : experiments;
    const fa = isPersonal ? analyses.filter(a => a.assignees.includes(currentUser)) : analyses;
    const ft = isPersonal ? todos.filter(t => t.assignees.includes(currentUser)) : todos;
    const fip = isPersonal ? ipPatents.filter(p => p.assignees?.includes(currentUser)) : ipPatents;

    // Pipeline stats
    const papersByStatus = STATUS_KEYS.map(s => ({ key: s, ...STATUS_CONFIG[s], count: fp.filter(p => PAPER_STATUS_MIGRATE(p.status) === s).length }));
    const reportsByStatus = REPORT_STATUS_KEYS.map(s => ({ key: s, ...REPORT_STATUS_CONFIG[s], count: fr.filter(r => r.status === s).length }));
    const expByStatus = EXP_STATUS_KEYS.map(s => ({ key: s, ...EXP_STATUS_CONFIG[s], count: fe.filter(e => EXP_STATUS_MIGRATE(e.status) === s).length }));
    const analysisByStatus = ANALYSIS_STATUS_KEYS.map(s => ({ key: s, ...ANALYSIS_STATUS_CONFIG[s], count: fa.filter(a => ANALYSIS_STATUS_MIGRATE(a.status) === s).length }));
    const patentsByStatus = IP_STATUS_KEYS.map(s => ({ key: s, ...IP_STATUS_CONFIG[s], count: fip.filter(p => p.status === s).length }));

    // Discussion items across all sections
    const discussionItems: Array<{ section: string; tab: string; title: string; icon: string }> = [
        ...ft.filter(t => t.needsDiscussion).map(t => ({ section: "To-do", tab: "todos", title: t.text, icon: "✅" })),
        ...fp.filter(p => p.needsDiscussion).map(p => ({ section: "논문", tab: "papers", title: p.title, icon: "📄" })),
        ...fr.filter(r => r.needsDiscussion).map(r => ({ section: "보고서", tab: "reports", title: r.title, icon: "📋" })),
        ...fe.filter(e => e.needsDiscussion).map(e => ({ section: "실험", tab: "experiments", title: e.title, icon: "🧪" })),
        ...fa.filter(a => a.needsDiscussion).map(a => ({ section: "해석", tab: "analysis", title: a.title, icon: "🖥️" })),
        ...fip.filter(p => p.needsDiscussion).map(p => ({ section: "지식재산권", tab: "ip", title: p.title, icon: "💡" })),
        ...resources.filter(r => r.needsDiscussion).map(r => ({ section: "자료", tab: "resources", title: r.title, icon: "📁" })),
        ...ideas.filter(i => i.needsDiscussion).map(i => ({ section: "아이디어", tab: "ideas", title: i.title, icon: "💡" })),
        ...chatPosts.filter(c => c.needsDiscussion).map(c => ({ section: "잡담", tab: "chat", title: c.title, icon: "💬" })),
        ...Object.entries(personalMemos).flatMap(([name, memos]) => memos.filter(m => m.needsDiscussion).map(m => ({ section: `메모(${name})`, tab: `memo_${name}`, title: m.title, icon: "📝" }))),
        ...Object.entries(teamMemos).flatMap(([t, data]) => (data.kanban || []).filter(c => c.needsDiscussion).map(c => ({ section: `팀메모(${t})`, tab: `teamMemo_${t}`, title: c.title, icon: "📌" }))),
        ...meetings.filter(m => m.needsDiscussion).map(m => ({ section: "회의록", tab: "meetings", title: m.title, icon: "📝" })),
    ];

    // Today's targets
    // For weekends, also check the most recent weekday
    const getRecentWeekday = () => {
        const d = new Date(today);
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    const targetDateStr = isWeekend ? getRecentWeekday() : todayStr;
    const todayTargets = dailyTargets.filter(t => t.date === targetDateStr);
    const targetsWritten = todayTargets.length;
    const targetsMissing = MEMBER_NAMES.filter(n => !todayTargets.some(t => t.name === n));

    // Todo summary
    const activeTodos = ft.filter(t => !t.done).length;

    // Recent announcements (last 3)
    const recentAnn = [...announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

    // My items (always filtered to currentUser)
    const myPapers = papers.filter(p => p.assignees.includes(currentUser));
    const myTodos = todos.filter(t => !t.done && t.assignees.includes(currentUser));
    const myExperiments = experiments.filter(e => e.assignees.includes(currentUser));
    const myReports = reports.filter(r => r.assignees.includes(currentUser));
    const myAnalyses = analyses.filter(a => a.assignees.includes(currentUser));

    // Personal: today's target for current user
    const myTarget = todayTargets.find(t => t.name === currentUser);

    return (
        <div className="space-y-5">
            {/* Personal mode header */}
            {isPersonal && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{members[currentUser]?.emoji || "👤"}</span>
                        <div>
                            <h2 className="text-[20px] font-bold">{currentUser}</h2>
                            <div className="text-[13px] text-blue-200">{members[currentUser]?.team} {members[currentUser]?.role && `· ${members[currentUser]?.role}`}</div>
                        </div>
                    </div>
                    {myTarget ? (
                        <div className="mt-3 p-3 bg-white/10 rounded-lg">
                            <div className="text-[12px] text-blue-200 mb-1">오늘의 목표</div>
                            <div className="text-[14px] leading-relaxed">{myTarget.text}</div>
                        </div>
                    ) : (
                        <div className="mt-3 p-3 bg-white/10 rounded-lg text-center">
                            <div className="text-[13px] text-blue-200">오늘 목표를 아직 작성하지 않았습니다</div>
                            <button onClick={() => onNavigate("daily")} className="mt-1 text-[13px] font-medium underline underline-offset-2 text-white">작성하러 가기</button>
                        </div>
                    )}
                    {!statusMessages[currentUser] && (
                        <div className="mt-2 p-2.5 bg-white/10 rounded-lg text-center">
                            <div className="text-[13px] text-blue-200">오늘의 한마디를 작성하지 않았습니다</div>
                            <button onClick={() => onNavigate("settings")} className="mt-1 text-[13px] font-medium underline underline-offset-2 text-white">작성하러 가기</button>
                        </div>
                    )}
                </div>
            )}

            {/* Row 1: 연구 파이프라인 5개 한 줄 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-[14px] font-bold text-slate-800 mb-4">{isPersonal ? "내 연구 파이프라인" : "연구 파이프라인"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                    <button onClick={() => onNavigate("papers")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />논문 <span className="text-slate-700 font-bold">({fp.length})</span>
                        </div>
                        <MiniBar items={papersByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...papersByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("reports")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />계획서/보고서 <span className="text-slate-700 font-bold">({fr.length})</span>
                        </div>
                        <MiniBar items={reportsByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...reportsByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("experiments")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />실험 <span className="text-slate-700 font-bold">({fe.length})</span>
                        </div>
                        <MiniBar items={expByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...expByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("analysis")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />해석 <span className="text-slate-700 font-bold">({fa.length})</span>
                        </div>
                        <MiniBar items={analysisByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...analysisByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("ip")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />지식재산권 <span className="text-slate-700 font-bold">({fip.length})</span>
                        </div>
                        <MiniBar items={patentsByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...patentsByStatus.map(s => s.count))} />
                    </button>
                </div>
            </div>

            {/* Row 2: 논의 필요 + (오늘목표 현황 or 투두) + 최근 공지 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 논의 필요 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                        {isPersonal ? "내 논의 필요" : "논의 필요"}
                        {discussionItems.length > 0 && <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-orange-500 text-white text-[12px] font-bold">{discussionItems.length}</span>}
                    </h3>
                    {discussionItems.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">논의 필요 항목 없음</div>
                    ) : (
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {discussionItems.slice(0, 10).map((item, i) => (
                                <button key={i} onClick={() => onNavigate(item.tab)} className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-orange-50 text-left transition-colors group">
                                    <span className="text-[13px] mt-0.5">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] text-slate-700 leading-snug truncate group-hover:text-orange-600 transition-colors">{item.title}</div>
                                        <div className="text-[11px] text-slate-400">{item.section}</div>
                                    </div>
                                </button>
                            ))}
                            {discussionItems.length > 10 && <div className="text-[12px] text-slate-400 text-center py-1">+{discussionItems.length - 10}개 더</div>}
                        </div>
                    )}
                </div>

                {/* 오늘 목표 현황 (team) / 투두 리스트 (personal) */}
                {isPersonal ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <button onClick={() => onNavigate("todos")} className="w-full text-left">
                            <h3 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                                내 To-do
                                {myTodos.length > 0 && <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-[12px] font-bold">{myTodos.length}</span>}
                            </h3>
                        </button>
                        {myTodos.length === 0 ? (
                            <div className="text-[13px] text-slate-300 text-center py-6">할 일 없음</div>
                        ) : (
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                {myTodos.map(t => (
                                    <div key={t.id} className="flex items-start gap-1.5 text-[12px] text-slate-600 p-1.5 rounded hover:bg-slate-50">
                                        <span className="shrink-0">{PRIORITY_ICON[t.priority]}</span>
                                        <span className="leading-relaxed">{t.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <button onClick={() => onNavigate("daily")} className="w-full text-left">
                            <h3 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                                오늘 목표 현황
                                <span className="text-[12px] font-medium text-slate-400">{targetsWritten}/{MEMBER_NAMES.length}</span>
                            </h3>
                        </button>
                        <div className="mb-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="h-2 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${MEMBER_NAMES.length > 0 ? (targetsWritten / MEMBER_NAMES.length) * 100 : 0}%` }} />
                            </div>
                        </div>
                        {targetsMissing.length > 0 ? (
                            <div>
                                <div className="text-[12px] text-slate-400 mb-1.5">미작성:</div>
                                <div className="flex flex-wrap gap-1">
                                    {targetsMissing.map(name => (
                                        <span key={name} className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">{MEMBERS[name]?.emoji} {name}</span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-[13px] text-emerald-500 font-medium text-center py-2">전원 작성 완료</div>
                        )}
                        {todayTargets.length > 0 && (
                            <div className="mt-3 space-y-1 max-h-[140px] overflow-y-auto">
                                {todayTargets.map(t => (
                                    <div key={t.name} className="flex items-start gap-2 py-1">
                                        <span className="text-[11px] font-medium text-slate-500 shrink-0 mt-0.5">{MEMBERS[t.name]?.emoji} {t.name}</span>
                                        <span className="text-[12px] text-slate-600 leading-relaxed">{t.text.length > 40 ? t.text.slice(0, 40) + "..." : t.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 최근 공지 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <button onClick={() => onNavigate("announcements")} className="w-full text-left">
                        <h3 className="text-[14px] font-bold text-slate-800 mb-3">최근 공지</h3>
                    </button>
                    {recentAnn.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">공지 없음</div>
                    ) : (
                        <div className="space-y-2">
                            {recentAnn.map(ann => (
                                <div key={ann.id} className="p-2.5 bg-slate-50 rounded-lg">
                                    <div className="text-[13px] text-slate-700 leading-relaxed">{ann.text.length > 60 ? ann.text.slice(0, 60) + "..." : ann.text}</div>
                                    <div className="text-[11px] text-slate-400 mt-1">{members[ann.author]?.emoji} {ann.author} · {ann.date}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 3: 멤버별 현황 (team) / 내 현황 (personal) */}
            {isPersonal ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-[14px] font-bold text-slate-800 mb-3">내 전체 현황</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                            <div className="text-[12px] font-semibold text-slate-400 mb-2">내 논문 ({myPapers.length})</div>
                            {myPapers.length === 0 ? <div className="text-[12px] text-slate-300">없음</div> : (
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                    {myPapers.map(p => (
                                        <div key={p.id} className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_CONFIG[PAPER_STATUS_MIGRATE(p.status)]?.color }} />
                                            <span className="text-[12px] text-slate-600 truncate">{p.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-slate-400 mb-2">내 계획서/보고서 ({myReports.length})</div>
                            {myReports.length === 0 ? <div className="text-[12px] text-slate-300">없음</div> : (
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                    {myReports.map(r => (
                                        <div key={r.id} className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: REPORT_STATUS_CONFIG[r.status]?.color }} />
                                            <span className="text-[12px] text-slate-600 truncate">{r.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-slate-400 mb-2">내 실험 ({myExperiments.length})</div>
                            {myExperiments.length === 0 ? <div className="text-[12px] text-slate-300">없음</div> : (
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                    {myExperiments.map(e => (
                                        <div key={e.id} className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: EXP_STATUS_CONFIG[EXP_STATUS_MIGRATE(e.status)]?.color }} />
                                            <span className="text-[12px] text-slate-600 truncate">{e.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-slate-400 mb-2">내 해석 ({myAnalyses.length})</div>
                            {myAnalyses.length === 0 ? <div className="text-[12px] text-slate-300">없음</div> : (
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                    {myAnalyses.map(a => (
                                        <div key={a.id} className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ANALYSIS_STATUS_CONFIG[ANALYSIS_STATUS_MIGRATE(a.status)]?.color }} />
                                            <span className="text-[12px] text-slate-600 truncate">{a.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-[12px] font-semibold text-slate-400 mb-2">내 지식재산권 ({ipPatents.filter(p => p.assignees?.includes(currentUser)).length})</div>
                            {ipPatents.filter(p => p.assignees?.includes(currentUser)).length === 0 ? <div className="text-[12px] text-slate-300">없음</div> : (
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                                    {ipPatents.filter(p => p.assignees?.includes(currentUser)).map(p => (
                                        <div key={p.id} className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: IP_STATUS_CONFIG[p.status]?.color }} />
                                            <span className="text-[12px] text-slate-600 truncate">{p.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-[14px] font-bold text-slate-800 mb-3">멤버별 현황</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-1.5 px-1.5 font-semibold text-slate-500">멤버</th>
                                    <th className="text-center py-1.5 px-1 font-semibold text-slate-500">논문</th>
                                    <th className="text-center py-1.5 px-1 font-semibold text-slate-500">계획/보고</th>
                                    <th className="text-center py-1.5 px-1 font-semibold text-slate-500">실험</th>
                                    <th className="text-center py-1.5 px-1 font-semibold text-slate-500">해석</th>
                                    <th className="text-center py-1.5 px-1 font-semibold text-slate-500">To-do</th>
                                    <th className="text-center py-1.5 px-1 font-semibold text-slate-500">목표</th>
                                    <th className="text-center py-1.5 px-1 font-semibold text-slate-500">접속</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MEMBER_NAMES.map(name => {
                                    const isMe = name === currentUser;
                                    const isOnline = onlineUsers.some(u => u.name === name);
                                    const memberPapers = papers.filter(p => p.assignees.includes(name)).length;
                                    const memberReports = reports.filter(r => r.assignees.includes(name)).length;
                                    const memberExp = experiments.filter(e => e.assignees.includes(name)).length;
                                    const memberAnalysis = analyses.filter(a => a.assignees.includes(name)).length;
                                    const memberTodos = todos.filter(t => !t.done && t.assignees.includes(name)).length;
                                    const hasTarget = todayTargets.some(t => t.name === name);
                                    const isTeamLead = Object.values(teams).some(t => t.lead === name);
                                    return (
                                        <tr key={name} className={`border-b border-slate-50 ${isMe ? "bg-blue-50/30" : "hover:bg-slate-50"} transition-colors`}>
                                            <td className="py-1.5 px-1.5 font-medium text-slate-700">
                                                <div className="flex items-center gap-1">
                                                    <span className="whitespace-nowrap">{members[name]?.emoji} {name}</span>
                                                    {isTeamLead && <span className="text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold">팀장</span>}
                                                    {statusMessages[name] && <span className="text-[11px] text-blue-500/80 italic truncate max-w-[140px] ml-1.5 border-l border-slate-200 pl-1.5">&ldquo;{statusMessages[name]}&rdquo;</span>}
                                                </div>
                                            </td>
                                            <td className="text-center py-1.5 px-1"><span className={memberPapers > 0 ? "font-semibold text-blue-600" : "text-slate-300"}>{memberPapers || "-"}</span></td>
                                            <td className="text-center py-1.5 px-1"><span className={memberReports > 0 ? "font-semibold text-amber-600" : "text-slate-300"}>{memberReports || "-"}</span></td>
                                            <td className="text-center py-1.5 px-1"><span className={memberExp > 0 ? "font-semibold text-emerald-600" : "text-slate-300"}>{memberExp || "-"}</span></td>
                                            <td className="text-center py-1.5 px-1"><span className={memberAnalysis > 0 ? "font-semibold text-violet-600" : "text-slate-300"}>{memberAnalysis || "-"}</span></td>
                                            <td className="text-center py-1.5 px-1"><span className={memberTodos > 0 ? "font-semibold text-red-500" : "text-slate-300"}>{memberTodos || "-"}</span></td>
                                            <td className="text-center py-1.5 px-1">{hasTarget ? <span className="text-emerald-500 font-bold">O</span> : <span className="text-red-400">X</span>}</td>
                                            <td className="text-center py-1.5 px-1">{isOnline ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-200" />}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Row 4: 팀별 현황 (team only) */}
            {!isPersonal && (() => {
                const hasTeams = Object.keys(teams).length > 0;
                const teamEntries: Array<{ name: string; members: string[]; color: string }> = hasTeams
                    ? Object.entries(teams).map(([name, t]) => ({ name, members: t.members, color: t.color }))
                    : [...new Set(Object.values(members).map(m => m.team))].filter(t => t !== "PI").map(t => ({
                        name: t,
                        members: Object.entries(members).filter(([, m]) => m.team === t).map(([n]) => n),
                        color: "#94a3b8",
                    }));
                return (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h3 className="text-[14px] font-bold text-slate-800 mb-3">팀별 연구 현황</h3>
                        {(() => {
                            const teamStats = teamEntries.map(team => {
                                const tPapers = papers.filter(p => p.team === team.name).length;
                                const tReports = reports.filter(r => r.team === team.name).length;
                                const tPatents = ipPatents.filter(p => p.team === team.name).length;
                                const tExp = experiments.filter(e => e.team === team.name).length;
                                const tAnalysis = analyses.filter(a => a.team === team.name).length;
                                const total = tPapers + tReports + tPatents + tExp + tAnalysis;
                                return { ...team, tPapers, tReports, tPatents, tExp, tAnalysis, total };
                            });
                            const maxTotal = Math.max(...teamStats.map(t => t.total), 1);
                            return (
                                <div className="space-y-3">
                                    {teamStats.map(team => (
                                        <div key={team.name}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[13px] font-semibold text-slate-700" style={hasTeams ? { color: team.color } : undefined}>{team.name}</span>
                                                <span className="text-[11px] text-slate-400">{team.total}건</span>
                                            </div>
                                            <div className="flex gap-[2px] h-[10px]">
                                                {Array.from({ length: team.tPapers }, (_, i) => <div key={`p${i}`} className="bg-blue-500 rounded-sm" style={{ width: `${100 / maxTotal}%` }} />)}
                                                {Array.from({ length: team.tReports }, (_, i) => <div key={`r${i}`} className="bg-amber-500 rounded-sm" style={{ width: `${100 / maxTotal}%` }} />)}
                                                {Array.from({ length: team.tPatents }, (_, i) => <div key={`ip${i}`} className="bg-teal-500 rounded-sm" style={{ width: `${100 / maxTotal}%` }} />)}
                                                {Array.from({ length: team.tExp }, (_, i) => <div key={`e${i}`} className="bg-emerald-500 rounded-sm" style={{ width: `${100 / maxTotal}%` }} />)}
                                                {Array.from({ length: team.tAnalysis }, (_, i) => <div key={`a${i}`} className="bg-violet-500 rounded-sm" style={{ width: `${100 / maxTotal}%` }} />)}
                                            </div>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                {team.tPapers > 0 && <span className="text-[11px] text-blue-600">논문 {team.tPapers}</span>}
                                                {team.tReports > 0 && <span className="text-[11px] text-amber-600">계획/보고 {team.tReports}</span>}
                                                {team.tPatents > 0 && <span className="text-[11px] text-teal-600">지식재산권 {team.tPatents}</span>}
                                                {team.tExp > 0 && <span className="text-[11px] text-emerald-600">실험 {team.tExp}</span>}
                                                {team.tAnalysis > 0 && <span className="text-[11px] text-violet-600">해석 {team.tAnalysis}</span>}
                                                {team.total === 0 && <span className="text-[11px] text-slate-300">항목 없음</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                );
            })()}
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [authChecked, setAuthChecked] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedPerson, setSelectedPerson] = useState("전체");
    const [onlineUsers, setOnlineUsers] = useState<Array<{ name: string; timestamp: number }>>([]);
    const [members, setMembers] = useState<Record<string, { team: string; role: string; emoji: string }>>(DEFAULT_MEMBERS);
    const memberNames = useMemo(() => Object.keys(members).filter(k => k !== "박일웅"), [members]);

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
    const [dispatches, setDispatches] = useState<Array<{ id: number; name: string; start: string; end: string; description: string }>>([]);
    const [timetable, setTimetable] = useState<TimetableBlock[]>(DEFAULT_TIMETABLE);
    const [reports, setReports] = useState<Report[]>([]);
    const [teams, setTeams] = useState<Record<string, TeamData>>(DEFAULT_TEAMS);
    const teamNames = useMemo(() => Object.keys(teams), [teams]);
    const [dailyTargets, setDailyTargets] = useState<DailyTarget[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [conferenceTrips, setConferenceTrips] = useState<ConferenceTrip[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [philosophy, setPhilosophy] = useState<Announcement[]>([]);
    const [ideas, setIdeas] = useState<IdeaPost[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [chatPosts, setChatPosts] = useState<IdeaPost[]>([]);
    const [customEmojis, setCustomEmojis] = useState<Record<string, string>>({});
    const [statusMessages, setStatusMessages] = useState<Record<string, string>>({});
    // Always merge customEmojis on top of members — single source of truth for display
    const displayMembers = useMemo(() => {
        const merged = { ...members };
        Object.entries(customEmojis).forEach(([name, emoji]) => {
            if (merged[name]) merged[name] = { ...merged[name], emoji };
        });
        return merged;
    }, [members, customEmojis]);
    const [equipmentList, setEquipmentList] = useState<string[]>(DEFAULT_EQUIPMENT);
    const [analysisToolList, setAnalysisToolList] = useState<string[]>(ANALYSIS_TOOLS);
    const [paperTagList, setPaperTagList] = useState<string[]>(PAPER_TAGS);
    const [personalMemos, setPersonalMemos] = useState<Record<string, Memo[]>>({});
    const [personalFiles, setPersonalFiles] = useState<Record<string, LabFile[]>>({});
    const [piChat, setPiChat] = useState<Record<string, TeamChatMsg[]>>({});
    const [teamMemos, setTeamMemos] = useState<Record<string, { kanban: TeamMemoCard[]; chat: TeamChatMsg[]; files?: LabFile[] }>>({});
    const [labChat, setLabChat] = useState<TeamChatMsg[]>([]);
    const [labFiles, setLabFiles] = useState<LabFile[]>([]);
    const [labBoard, setLabBoard] = useState<TeamMemoCard[]>([]);
    const [chatReadTs, setChatReadTs] = useState<Record<string, number>>({});

    const tabs = [
        { id: "overview", label: "연구실 현황", icon: "🏠" },
        { id: "overview_me", label: `개별 현황 (${userName})`, icon: "👤" },
        { id: "labChat", label: "연구실 채팅", icon: "💬" },
        // 운영
        { id: "announcements", label: "공지사항", icon: "📢" },
        { id: "calendar", label: "일정/휴가", icon: "📅" },
        { id: "daily", label: "오늘 목표", icon: "🎯" },
        // 팀 워크
        ...(userName === "박일웅" ? teamNames : teamNames.filter(t => teams[t]?.lead === userName || teams[t]?.members?.includes(userName))).map(t => ({ id: `teamMemo_${t}`, label: t, icon: teams[t]?.emoji || "📌", color: teams[t]?.color })),
        // 내 노트
        { id: "todos", label: "To-do", icon: "✅" },
        ...(userName === "박일웅" ? memberNames : memberNames.filter(n => n === userName)).map(name => ({ id: `memo_${name}`, label: name, icon: customEmojis[name] || members[name]?.emoji || "👤" })),
        // 연구
        { id: "papers", label: "논문 현황", icon: "📄" },
        { id: "reports", label: "계획서/보고서", icon: "📋" },
        { id: "ip", label: "지식재산권", icon: "💡" },
        { id: "experiments", label: "실험 현황", icon: "🧪" },
        { id: "analysis", label: "해석 현황", icon: "🖥️" },
        // 커뮤니케이션
        { id: "conferenceTrips", label: "학회/출장", icon: "✈️" },
        { id: "meetings", label: "회의록", icon: "📝" },
        { id: "resources", label: "자료", icon: "📁" },
        { id: "ideas", label: "아이디어", icon: "💡" },
        { id: "chat", label: "잡담", icon: "💬" },
        { id: "lectures", label: "수업", icon: "📚" },
    ];

    const allPeople = useMemo(() => ["전체", ...memberNames], [memberNames]);

    const saveSection = useCallback(async (section: string, data: unknown) => {
        try { await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, data, userName }) }); } catch { /* ignore */ }
    }, [userName]);

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
            if (d.dispatches) setDispatches(d.dispatches);
            if (d.timetable) setTimetable(d.timetable);
            if (d.reports) setReports(d.reports);
            if (d.teams) setTeams(d.teams);
            if (d.dailyTargets) setDailyTargets(d.dailyTargets);
            if (d.philosophy) setPhilosophy(d.philosophy);
            if (d.resources) setResources(d.resources);
            if (d.conferences) setConferenceTrips(d.conferences);
            if (d.meetings) setMeetings(d.meetings);
            if (d.ideas) setIdeas(d.ideas);
            if (d.analyses) setAnalyses(d.analyses);
            if (d.chatPosts) setChatPosts(d.chatPosts);
            if (d.customEmojis) setCustomEmojis(d.customEmojis);
            if (d.statusMessages) setStatusMessages(d.statusMessages);
            if (d.equipmentList) setEquipmentList(d.equipmentList);
            if (d.personalMemos) setPersonalMemos(d.personalMemos);
            if (d.personalFiles) setPersonalFiles(d.personalFiles);
            if (d.piChat) setPiChat(d.piChat);
            if (d.teamMemos) setTeamMemos(d.teamMemos);
            if (d.labChat) setLabChat(d.labChat);
            if (d.labFiles) setLabFiles(d.labFiles);
            if (d.labBoard) setLabBoard(d.labBoard);
            if (d.analysisToolList) setAnalysisToolList(d.analysisToolList);
            if (d.paperTagList) setPaperTagList(d.paperTagList);
            if (d.members && Object.keys(d.members).length > 0) {
                setMembers(d.members);
            } else {
                // Auto-seed default members to server if none exist
                fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "members", data: DEFAULT_MEMBERS }) }).catch(() => {});
            }
        } catch { /* ignore */ }
    }, []);

    const fetchOnline = useCallback(async () => {
        try { const r = await fetch("/api/dashboard?section=online"); const d = await r.json(); setOnlineUsers(d.users || []); } catch { /* ignore */ }
    }, []);

    const sendHeartbeat = useCallback(async () => {
        if (!userName) return;
        try { await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "online", action: "heartbeat", userName }) }); } catch { /* ignore */ }
    }, [userName]);

    const handleLogin = async (name: string, password: string, rememberMe: boolean): Promise<string | null> => {
        try {
            const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", userName: name, password }) });
            const data = await res.json();
            if (!res.ok) return data.error || "로그인 실패";
            if (rememberMe && data.token) localStorage.setItem("mftel-auth-token", data.token);
            setUserName(name); setLoggedIn(true);
            try { await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "online", action: "join", userName: name }) }); } catch {}
            return null;
        } catch { return "서버 연결 실패"; }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem("mftel-auth-token");
        if (token) {
            try { await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout", token }) }); } catch {}
            localStorage.removeItem("mftel-auth-token");
        }
        try { navigator.sendBeacon("/api/dashboard", new Blob([JSON.stringify({ section: "online", action: "leave", userName })], { type: "application/json" })); } catch {}
        setLoggedIn(false); setUserName("");
    };

    // Pre-login: fetch members + customEmojis so LoginScreen shows correct emojis, + auto-login
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/dashboard?section=all");
                const d = await res.json();
                if (d.members && Object.keys(d.members).length > 0) setMembers(d.members);
                if (d.customEmojis) setCustomEmojis(d.customEmojis);
            } catch {}
            // Auto-login from saved token
            const token = localStorage.getItem("mftel-auth-token");
            if (token) {
                try {
                    const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "validateSession", token }) });
                    const data = await res.json();
                    if (data.valid && data.userName) {
                        setUserName(data.userName); setLoggedIn(true);
                        try { await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "online", action: "join", userName: data.userName }) }); } catch {}
                    } else {
                        localStorage.removeItem("mftel-auth-token");
                    }
                } catch { localStorage.removeItem("mftel-auth-token"); }
            }
            setAuthChecked(true);
        })();
    }, []);

    useEffect(() => {
        if (!loggedIn) return;
        // Use intervals starting at 0 for initial fetch to avoid lint warning about setState in effect body
        const d = setTimeout(() => { fetchData(); fetchOnline(); }, 0);
        const a = setInterval(fetchData, 5000);
        const b = setInterval(fetchOnline, 5000);
        const c = setInterval(sendHeartbeat, 10000);
        return () => { clearTimeout(d); clearInterval(a); clearInterval(b); clearInterval(c); };
    }, [loggedIn, fetchData, fetchOnline, sendHeartbeat]);

    useEffect(() => {
        if (!userName) return;
        const h = () => navigator.sendBeacon("/api/dashboard", new Blob([JSON.stringify({ section: "online", action: "leave", userName })], { type: "application/json" }));
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [userName]);

    // chatReadTs: init from localStorage
    useEffect(() => {
        if (!userName) return;
        try {
            const saved = localStorage.getItem(`mftel_chatReadTs_${userName}`);
            if (saved) setChatReadTs(JSON.parse(saved));
        } catch {}
    }, [userName]);

    // chatReadTs: mark current tab as read
    useEffect(() => {
        if (!userName) return;
        setChatReadTs(prev => {
            const next = { ...prev, [activeTab]: Date.now() };
            try { localStorage.setItem(`mftel_chatReadTs_${userName}`, JSON.stringify(next)); } catch {}
            return next;
        });
    }, [activeTab, userName]);

    // Handlers
    const handleToggleTodo = (id: number) => { const u = todos.map(t => t.id === id ? { ...t, done: !t.done } : t); setTodos(u); saveSection("todos", u); };
    const handleAddTodo = (t: Todo) => { const u = [...todos, t]; setTodos(u); saveSection("todos", u); };
    const handleDeleteTodo = (id: number) => { const u = todos.filter(t => t.id !== id); setTodos(u); saveSection("todos", u); };
    const handleUpdateTodo = (t: Todo) => { const u = todos.map(x => x.id === t.id ? t : x); setTodos(u); saveSection("todos", u); };
    const handleAddAnn = (text: string) => { const u = [{ id: Date.now(), text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned: false }, ...announcements]; setAnnouncements(u); saveSection("announcements", u); };
    const handleDelAnn = (id: number) => { const u = announcements.filter(a => a.id !== id); setAnnouncements(u); saveSection("announcements", u); };
    const handleUpdateAnn = (ann: Announcement) => { const u = announcements.map(a => a.id === ann.id ? ann : a); setAnnouncements(u); saveSection("announcements", u); };
    const handleAddPhil = (text: string) => { const u = [{ id: Date.now(), text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned: false }, ...philosophy]; setPhilosophy(u); saveSection("philosophy", u); };
    const handleDelPhil = (id: number) => { const u = philosophy.filter(p => p.id !== id); setPhilosophy(u); saveSection("philosophy", u); };
    const handleUpdatePhil = (p: Announcement) => { const u = philosophy.map(x => x.id === p.id ? p : x); setPhilosophy(u); saveSection("philosophy", u); };

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
    const handleSaveConference = (c: ConferenceTrip) => {
        const exists = conferenceTrips.find(x => x.id === c.id);
        const u = exists ? conferenceTrips.map(x => x.id === c.id ? c : x) : [...conferenceTrips, c];
        setConferenceTrips(u); saveSection("conferences", u);
    };
    const handleDeleteConference = (id: number) => { const u = conferenceTrips.filter(c => c.id !== id); setConferenceTrips(u); saveSection("conferences", u); };
    const handleSaveMeeting = (m: Meeting) => {
        const exists = meetings.find(x => x.id === m.id);
        const u = exists ? meetings.map(x => x.id === m.id ? m : x) : [...meetings, m];
        setMeetings(u); saveSection("meetings", u);
    };
    const handleDeleteMeeting = (id: number) => { const u = meetings.filter(m => m.id !== id); setMeetings(u); saveSection("meetings", u); };
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
    const handleSaveStatusMsg = (name: string, msg: string) => {
        const u = { ...statusMessages, [name]: msg };
        setStatusMessages(u); saveSection("statusMessages", u);
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
    const handleAddPersonalFile = (name: string, f: LabFile) => {
        const u = { ...personalFiles, [name]: [...(personalFiles[name] || []), f] };
        setPersonalFiles(u); saveSection("personalFiles", u);
    };
    const handleDeletePersonalFile = (name: string, id: number) => {
        const u = { ...personalFiles, [name]: (personalFiles[name] || []).filter(f => f.id !== id) };
        setPersonalFiles(u); saveSection("personalFiles", u);
    };
    const handleAddPiChat = (name: string, msg: TeamChatMsg) => {
        const u = { ...piChat, [name]: [...(piChat[name] || []), msg] };
        setPiChat(u); saveSection("piChat", u);
    };
    const handleDeletePiChat = (name: string, id: number) => {
        const u = { ...piChat, [name]: (piChat[name] || []).filter(m => m.id !== id) };
        setPiChat(u); saveSection("piChat", u);
    };
    const handleClearPiChat = (name: string) => {
        const u = { ...piChat, [name]: [] };
        setPiChat(u); saveSection("piChat", u);
    };

    const handleSaveTeamMemo = (teamName: string, card: TeamMemoCard) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const found = data.kanban.find(c => c.id === card.id);
        const updated = found ? data.kanban.map(c => c.id === card.id ? card : c) : [...data.kanban, card];
        const u = { ...teamMemos, [teamName]: { ...data, kanban: updated } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };
    const handleDeleteTeamMemo = (teamName: string, id: number) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const u = { ...teamMemos, [teamName]: { ...data, kanban: data.kanban.filter(c => c.id !== id) } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };
    const handleReorderTeamMemo = (teamName: string, cards: TeamMemoCard[]) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const u = { ...teamMemos, [teamName]: { ...data, kanban: cards } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };
    const handleAddTeamChat = (teamName: string, msg: TeamChatMsg) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const u = { ...teamMemos, [teamName]: { ...data, chat: [...data.chat, msg] } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };
    const handleDeleteTeamChat = (teamName: string, id: number) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const u = { ...teamMemos, [teamName]: { ...data, chat: data.chat.filter(c => c.id !== id) } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };
    const handleClearTeamChat = (teamName: string) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const u = { ...teamMemos, [teamName]: { ...data, chat: [] } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };
    const handleAddTeamFile = (teamName: string, file: LabFile) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const u = { ...teamMemos, [teamName]: { ...data, files: [...(data.files || []), file] } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };
    const handleDeleteTeamFile = async (teamName: string, id: number) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const file = (data.files || []).find(f => f.id === id);
        if (file?.url?.startsWith("https://")) { try { await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: file.url }), headers: { "Content-Type": "application/json" } }); } catch {} }
        const u = { ...teamMemos, [teamName]: { ...data, files: (data.files || []).filter(f => f.id !== id) } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };

    const handleAddLabChat = (msg: TeamChatMsg) => {
        const u = [...labChat, msg];
        setLabChat(u); saveSection("labChat", u);
    };
    const handleDeleteLabChat = (id: number) => {
        const u = labChat.filter(c => c.id !== id);
        setLabChat(u); saveSection("labChat", u);
    };
    const handleClearLabChat = () => {
        setLabChat([]); saveSection("labChat", []);
    };
    const handleSaveLabBoard = (card: TeamMemoCard) => {
        const u = labBoard.some(c => c.id === card.id) ? labBoard.map(c => c.id === card.id ? card : c) : [...labBoard, card];
        setLabBoard(u); saveSection("labBoard", u);
    };
    const handleDeleteLabBoard = (id: number) => {
        const u = labBoard.filter(c => c.id !== id);
        setLabBoard(u); saveSection("labBoard", u);
    };
    const handleAddLabFile = (file: LabFile) => {
        const u = [...labFiles, file]; setLabFiles(u); saveSection("labFiles", u);
    };
    const handleDeleteLabFile = async (id: number) => {
        const file = labFiles.find(f => f.id === id);
        if (file?.url?.startsWith("https://")) { try { await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: file.url }), headers: { "Content-Type": "application/json" } }); } catch {} }
        const u = labFiles.filter(f => f.id !== id); setLabFiles(u); saveSection("labFiles", u);
    };

    if (!authChecked) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white animate-pulse" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>M</div>
                <p className="text-slate-400 text-[14px]">로그인 확인 중...</p>
            </div>
        </div>
    );
    if (!loggedIn) return <LoginScreen onLogin={handleLogin} members={displayMembers} />;

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
        meetings: meetings.filter(m => m.needsDiscussion).length,
        ...Object.fromEntries(teamNames.map(t => [`teamMemo_${t}`, (teamMemos[t]?.kanban || []).filter(c => c.needsDiscussion).length])),
        ...Object.fromEntries(memberNames.map(name => [`memo_${name}`, (personalMemos[name] || []).filter(m => m.needsDiscussion).length])),
    };

    const unreadCounts: Record<string, number> = {
        labChat: labChat.filter(m => m.id > (chatReadTs.labChat || 0)).length,
        ...Object.fromEntries(teamNames.map(t => [`teamMemo_${t}`, (teamMemos[t]?.chat || []).filter(m => m.id > (chatReadTs[`teamMemo_${t}`] || 0)).length])),
        ...Object.fromEntries(memberNames.map(name => [`memo_${name}`, (piChat[name] || []).filter(m => m.id > (chatReadTs[`memo_${name}`] || 0)).length])),
    };

    return (
        <MembersContext.Provider value={displayMembers}>
        <div className="min-h-screen bg-slate-50 text-slate-800 leading-normal" style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            {/* Header */}
            <div className="bg-slate-900 px-4 md:px-7 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-lg shadow-slate-900/20">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] font-extrabold text-white shadow-lg" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>M</div>
                    <div>
                        <div className="text-[16px] font-bold text-white tracking-tight">MFTEL Dashboard</div>
                        <div className="text-[11px] text-slate-500 tracking-wide">Multiphase Flow & Thermal Engineering Lab</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                        <span className="text-[12px] text-emerald-400 font-medium">{onlineUsers.length}</span>
                        <div className="flex items-center gap-1 ml-1">
                            {onlineUsers.filter(u => u.name !== userName).slice(0, 5).map(u => (
                                <span key={u.name} className="text-[12px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">{displayMembers[u.name]?.emoji || "👤"}{u.name}</span>
                            ))}
                            {onlineUsers.filter(u => u.name !== userName).length > 5 && <span className="text-[11px] text-slate-500">+{onlineUsers.filter(u => u.name !== userName).length - 5}</span>}
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                        <button onClick={() => setActiveTab("teams")} className={`px-3 py-1.5 rounded-lg text-[18px] transition-all ${activeTab === "teams" ? "bg-slate-700 ring-1 ring-slate-500" : "hover:bg-slate-800"}`} title="팀 현황">👥</button>
                        <button onClick={() => setActiveTab("settings")} className={`px-3 py-1.5 rounded-lg text-[18px] transition-all ${activeTab === "settings" ? "bg-slate-700 ring-1 ring-slate-500" : "hover:bg-slate-800"}`} title="설정">⚙️</button>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800">
                        <span className="text-[13px] text-white font-medium">{displayMembers[userName]?.emoji || "👤"} {userName}</span>
                        <button onClick={handleLogout} className="text-[12px] text-slate-400 hover:text-red-400 ml-1.5 transition-colors" title="로그아웃">⏻</button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="md:w-[210px] bg-white md:border-r border-b md:border-b-0 border-slate-200 md:min-h-[calc(100vh-56px)] flex-shrink-0">
                    <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:max-h-[calc(100vh-56px)] p-3 md:p-0 md:pt-3 md:pb-8 gap-px">
                        {tabs.map((tab, i) => {
                            const sectionBreaks: Record<string, string> = { announcements: "운영", todos: "내 노트", papers: "연구", conferenceTrips: "커뮤니케이션" };
                            const showBreak = !tab.id.startsWith("memo_") && !tab.id.startsWith("teamMemo_") && sectionBreaks[tab.id];
                            const showTeamMemoBreak = tab.id.startsWith("teamMemo_") && i > 0 && !tabs[i - 1].id.startsWith("teamMemo_");
                            const showMemoBreak = false;
                            return (
                                <div key={tab.id}>
                                    {showBreak && (
                                        <div className="hidden md:block mt-5 mb-1.5 mx-3">
                                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-1">{sectionBreaks[tab.id]}</div>
                                        </div>
                                    )}
                                    {showTeamMemoBreak && (
                                        <div className="hidden md:block mt-5 mb-1.5 mx-3">
                                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-1">팀 워크</div>
                                        </div>
                                    )}
                                    {showMemoBreak && (
                                        <div className="hidden md:block mt-5 mb-1.5 mx-3">
                                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-1">내 노트</div>
                                        </div>
                                    )}
                                    <button onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-1 rounded-md text-[13px] whitespace-nowrap transition-all ${activeTab === tab.id ? "font-semibold text-blue-700 bg-blue-50/80" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}>
                                        <span className="text-[14px]">{tab.icon}</span>
{/* color dot removed */}
                                        <span>{tab.label}</span>
                                        {((unreadCounts[tab.id] || 0) > 0 || (discussionCounts[tab.id] || 0) > 0) && (
                                            <div className="ml-auto flex items-center gap-1.5">
                                                {(unreadCounts[tab.id] || 0) > 0 && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[11px] font-semibold">{unreadCounts[tab.id]}</span>}
                                                {(discussionCounts[tab.id] || 0) > 0 && <span className="w-[6px] h-[6px] rounded-full bg-orange-400" />}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {activeTab === "papers" && (
                        <div className="hidden md:block px-3 mt-4">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">필터</div>
                            <div className="max-h-[360px] overflow-y-auto space-y-0.5">
                                {allPeople.map(person => (
                                    <button key={person} onClick={() => setSelectedPerson(person)}
                                        className={`flex items-center gap-1.5 w-full px-3 py-1.5 rounded-md text-[13px] transition-all ${selectedPerson === person ? "font-semibold text-slate-800 bg-blue-50" : "text-slate-500 hover:bg-slate-50"}`}>
                                        {person !== "전체" && <span>{displayMembers[person]?.emoji}</span>}{person}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 md:p-5 overflow-x-auto">
                    {activeTab !== "overview" && activeTab !== "overview_me" && (
                        <div className="mb-4">
                            <h2 className="text-[18px] font-bold text-slate-900">
                                {tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label}
                                {activeTab === "papers" && selectedPerson !== "전체" && <span className="text-[14px] font-normal text-slate-500 ml-2">— {displayMembers[selectedPerson]?.emoji} {selectedPerson}</span>}
                            </h2>
                        </div>
                    )}

                    {activeTab === "overview" && <OverviewDashboard papers={papers} reports={reports} experiments={experiments} analyses={analyses} todos={todos} ipPatents={ipPatents} announcements={announcements} dailyTargets={dailyTargets} ideas={ideas} resources={resources} chatPosts={chatPosts} personalMemos={personalMemos} teamMemos={teamMemos} meetings={meetings} onlineUsers={onlineUsers} currentUser={userName} onNavigate={setActiveTab} mode="team" statusMessages={statusMessages} members={displayMembers} teams={teams} />}
                    {activeTab === "overview_me" && <OverviewDashboard papers={papers} reports={reports} experiments={experiments} analyses={analyses} todos={todos} ipPatents={ipPatents} announcements={announcements} dailyTargets={dailyTargets} ideas={ideas} resources={resources} chatPosts={chatPosts} personalMemos={personalMemos} teamMemos={teamMemos} meetings={meetings} onlineUsers={onlineUsers} currentUser={userName} onNavigate={setActiveTab} mode="personal" statusMessages={statusMessages} members={displayMembers} teams={teams} />}
                    {activeTab === "announcements" && <AnnouncementView announcements={announcements} onAdd={handleAddAnn} onDelete={handleDelAnn} onUpdate={handleUpdateAnn} onReorder={list => { setAnnouncements(list); saveSection("announcements", list); }} philosophy={philosophy} onAddPhilosophy={handleAddPhil} onDeletePhilosophy={handleDelPhil} onUpdatePhilosophy={handleUpdatePhil} currentUser={userName} />}
                    {activeTab === "daily" && <DailyTargetView targets={dailyTargets} onSave={handleSaveDailyTargets} currentUser={userName} />}
                    {activeTab === "papers" && <KanbanView papers={papers} filter={selectedPerson} onClickPaper={p => setPaperModal({ paper: p, mode: "edit" })} onAddPaper={() => setPaperModal({ paper: null, mode: "add" })} onSavePaper={handleSavePaper} onReorder={list => { setPapers(list); saveSection("papers", list); }} tagList={paperTagList} onSaveTags={handleSavePaperTags} teamNames={teamNames} />}
                    {activeTab === "reports" && <ReportView reports={reports} currentUser={userName} onSave={handleSaveReport} onDelete={handleDeleteReport} onToggleDiscussion={r => handleSaveReport({ ...r, needsDiscussion: !r.needsDiscussion })} onReorder={list => { setReports(list); saveSection("reports", list); }} teamNames={teamNames} />}
                    {activeTab === "experiments" && <ExperimentView experiments={experiments} onSave={handleSaveExperiment} onDelete={handleDeleteExperiment} currentUser={userName} equipmentList={equipmentList} onSaveEquipment={handleSaveEquipment} onToggleDiscussion={e => handleSaveExperiment({ ...e, needsDiscussion: !e.needsDiscussion })} onReorder={list => { setExperiments(list); saveSection("experiments", list); }} teamNames={teamNames} />}
                    {activeTab === "analysis" && <AnalysisView analyses={analyses} onSave={handleSaveAnalysis} onDelete={handleDeleteAnalysis} currentUser={userName} toolList={analysisToolList} onSaveTools={handleSaveAnalysisTools} onToggleDiscussion={a => handleSaveAnalysis({ ...a, needsDiscussion: !a.needsDiscussion })} onReorder={list => { setAnalyses(list); saveSection("analyses", list); }} teamNames={teamNames} />}
                    {activeTab === "todos" && <TodoList todos={todos} onToggle={handleToggleTodo} onAdd={handleAddTodo} onUpdate={handleUpdateTodo} onDelete={handleDeleteTodo} onReorder={list => { setTodos(list); saveSection("todos", list); }} currentUser={userName} />}
                    {activeTab === "teams" && <TeamOverview papers={papers} todos={todos} experiments={experiments} analyses={analyses} teams={teams} onSaveTeams={handleSaveTeams} currentUser={userName} />}
                    {activeTab === "calendar" && <CalendarGrid data={[...vacations.map(v => ({ ...v, description: undefined })), ...schedule]} currentUser={userName} types={CALENDAR_TYPES} onToggle={handleCalendarToggle} dispatches={dispatches} onDispatchSave={(d) => { const u = d.id && dispatches.find(x => x.id === d.id) ? dispatches.map(x => x.id === d.id ? d : x) : [...dispatches, d]; setDispatches(u); saveSection("dispatches", u); }} onDispatchDelete={(id) => { const u = dispatches.filter(x => x.id !== id); setDispatches(u); saveSection("dispatches", u); }} />}
                    {activeTab === "lectures" && <TimetableView blocks={timetable} onSave={handleTimetableSave} onDelete={handleTimetableDelete} />}
                    {activeTab === "ip" && <IPView patents={ipPatents} onSave={handleSavePatent} onDelete={handleDeletePatent} currentUser={userName} onToggleDiscussion={p => handleSavePatent({ ...p, needsDiscussion: !p.needsDiscussion })} onReorder={list => { setIpPatents(list); saveSection("patents", list); }} teamNames={teamNames} />}
                    {activeTab === "conferenceTrips" && <ConferenceTripView items={conferenceTrips} onSave={handleSaveConference} onDelete={handleDeleteConference} onReorder={list => { setConferenceTrips(list); saveSection("conferences", list); }} currentUser={userName} />}
                    {activeTab === "meetings" && <MeetingView meetings={meetings} onSave={handleSaveMeeting} onDelete={handleDeleteMeeting} currentUser={userName} teamNames={teamNames} />}
                    {activeTab === "resources" && <ResourceView resources={resources} onSave={handleSaveResource} onDelete={handleDeleteResource} onReorder={list => { setResources(list); saveSection("resources", list); }} currentUser={userName} />}
                    {activeTab === "ideas" && <IdeasView ideas={ideas} onSave={handleSaveIdea} onDelete={handleDeleteIdea} onReorder={list => { setIdeas(list); saveSection("ideas", list); }} currentUser={userName} />}
                    {activeTab === "chat" && <IdeasView ideas={chatPosts} onSave={handleSaveChat} onDelete={handleDeleteChat} onReorder={list => { setChatPosts(list); saveSection("chatPosts", list); }} currentUser={userName} />}
                    {activeTab === "settings" && <SettingsView currentUser={userName} customEmojis={customEmojis} onSaveEmoji={handleSaveEmoji} statusMessages={statusMessages} onSaveStatusMsg={handleSaveStatusMsg} />}
                    {activeTab === "labChat" && <LabChatView chat={labChat} currentUser={userName} onAdd={handleAddLabChat} onDelete={handleDeleteLabChat} onClear={handleClearLabChat} files={labFiles} onAddFile={handleAddLabFile} onDeleteFile={handleDeleteLabFile} board={labBoard} onSaveBoard={handleSaveLabBoard} onDeleteBoard={handleDeleteLabBoard} />}
                    {activeTab.startsWith("teamMemo_") && (() => {
                        const tName = activeTab.replace("teamMemo_", "");
                        const data = teamMemos[tName] || { kanban: [], chat: [] };
                        return <TeamMemoView teamName={tName} kanban={data.kanban} chat={data.chat} files={data.files || []} currentUser={userName} onSaveCard={c => handleSaveTeamMemo(tName, c)} onDeleteCard={id => handleDeleteTeamMemo(tName, id)} onReorderCards={cards => handleReorderTeamMemo(tName, cards)} onAddChat={msg => handleAddTeamChat(tName, msg)} onDeleteChat={id => handleDeleteTeamChat(tName, id)} onClearChat={() => handleClearTeamChat(tName)} onAddFile={f => handleAddTeamFile(tName, f)} onDeleteFile={id => handleDeleteTeamFile(tName, id)} />;
                    })()}
                    {activeTab.startsWith("memo_") && (() => {
                        const name = activeTab.replace("memo_", "");
                        return <PersonalMemoView memos={personalMemos[name] || []} onSave={m => handleSaveMemo(name, m)} onDelete={id => handleDeleteMemo(name, id)} files={personalFiles[name] || []} onAddFile={f => handleAddPersonalFile(name, f)} onDeleteFile={id => handleDeletePersonalFile(name, id)} chat={piChat[name] || []} onAddChat={msg => handleAddPiChat(name, msg)} onDeleteChat={id => handleDeletePiChat(name, id)} onClearChat={() => handleClearPiChat(name)} currentUser={userName} />;
                    })()}
                </div>
            </div>

            {/* Paper Modal */}
            {paperModal && <PaperFormModal paper={paperModal.paper} onSave={handleSavePaper} onDelete={handleDeletePaper} onClose={() => setPaperModal(null)} currentUser={userName} tagList={paperTagList} teamNames={teamNames} />}
        </div>
        </MembersContext.Provider>
    );
}
