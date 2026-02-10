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
const SavingContext = createContext<Set<number>>(new Set());
function SavingBadge({ id }: { id: number }) {
    const s = useContext(SavingContext);
    if (!s.has(id)) return null;
    return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-full animate-pulse ml-1">저장 중</span>;
}

type TeamData = { lead: string; members: string[]; color: string; emoji?: string };

const DEFAULT_TEAMS: Record<string, TeamData> = {};

// Helper: auto text color for status badge contrast
// Enter=send, Shift+Enter=newline, mobile=button only
const chatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, send: () => void, composing?: React.MutableRefObject<boolean>) => {
    if (composing?.current) return;
    if (e.key !== "Enter") return;
    if (e.shiftKey) return; // shift+enter: newline
    e.preventDefault(); send();
};

// Draft auto-save helpers
const DRAFT_PFX = "mftel_draft_";
const saveDraft = (key: string, val: string) => { try { if (val.trim()) localStorage.setItem(DRAFT_PFX + key, val); else localStorage.removeItem(DRAFT_PFX + key); } catch {} };
const loadDraft = (key: string) => { try { return localStorage.getItem(DRAFT_PFX + key) || ""; } catch { return ""; } };
const clearDraft = (key: string) => { try { localStorage.removeItem(DRAFT_PFX + key); } catch {} };
const hasDraft = (key: string) => { try { return !!localStorage.getItem(DRAFT_PFX + key); } catch { return false; } };

// Strip optimistic flags before persisting chat to server
const stripMsgFlags = (msgs: TeamChatMsg[]): TeamChatMsg[] => msgs.map(({ _sending, _failed, ...rest }) => rest as TeamChatMsg);

const statusText = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 160 ? "#FFFFFF" : "#1E293B";
};

// Shared category colors (soft tones matching pipeline palettes)
const CATEGORY_COLORS = { paper: "#60A5FA", report: "#FDBA74", experiment: "#F87171", analysis: "#A78BFA", ip: "#2DD4BF" } as const;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#BFDBFE" },
    exp_analysis: { label: "실험·해석", color: "#93C5FD" },
    writing: { label: "작성중", color: "#60A5FA" },
    under_review: { label: "심사중", color: "#3B82F6" },
    completed: { label: "완료", color: "#22C55E" },
};
const STATUS_KEYS = ["planning", "exp_analysis", "writing", "under_review"];
// Migration: map old statuses to merged ones
const PAPER_STATUS_MIGRATE = (s: string) => (s === "experiment" || s === "analysis") ? "exp_analysis" : s;
const PAPER_TAGS = ["안전예타", "생애첫", "TES", "액침냉각", "이상유동", "시스템코드", "NTNU", "PCM", "기타"];

const REPORT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#FED7AA" },
    writing: { label: "작성중", color: "#FDBA74" },
    checking: { label: "검토중", color: "#FB923C" },
    review: { label: "심사중", color: "#F59E0B" },
    done: { label: "완료", color: "#22C55E" },
};
const REPORT_STATUS_KEYS = ["planning", "writing", "checking", "review"];
const PRIORITY_ICON: Record<string, string> = { highest: "🔥", high: "🔴", mid: "🟡", low: "🔵", lowest: "⚪" };
const PRIORITY_LABEL: Record<string, string> = { highest: "매우높음", high: "높음", mid: "중간", low: "낮음", lowest: "매우낮음" };
const PRIORITY_KEYS = ["highest", "high", "mid", "low", "lowest"];

const DEFAULT_EQUIPMENT = ["액침냉각", "이상유동", "예연소실", "라이덴프로스트", "모래배터리", "기타"];
const EXP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#FECACA" },
    preparing: { label: "준비중", color: "#FCA5A5" },
    running: { label: "진행중", color: "#F87171" },
    paused_done: { label: "완료", color: "#EF4444" },
    completed: { label: "완료", color: "#22C55E" },
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
type TeamChatMsg = { id: number; author: string; text: string; date: string; imageUrl?: string; replyTo?: { id: number; author: string; text: string }; reactions?: Record<string, string[]>; _sending?: boolean; _failed?: boolean };
type LabFile = { id: number; name: string; size: number; url: string; type: string; uploader: string; date: string };
type ConferenceTrip = { id: number; title: string; startDate: string; endDate: string; homepage: string; fee: string; participants: string[]; creator: string; createdAt: string; status?: string; comments?: Comment[]; needsDiscussion?: boolean };
type Meeting = { id: number; title: string; goal: string; summary: string; date: string; assignees: string[]; status: string; creator: string; createdAt: string; comments: Comment[]; team?: string; needsDiscussion?: boolean };

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PAPERS: Paper[] = [];
const DEFAULT_TODOS: Todo[] = [];
const DEFAULT_EXPERIMENTS: Experiment[] = [];
const IP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#99F6E4" },
    writing: { label: "작성중", color: "#5EEAD4" },
    evaluation: { label: "평가중", color: "#2DD4BF" },
    filed: { label: "출원", color: "#14B8A6" },
    completed: { label: "완료", color: "#22C55E" },
};
const IP_STATUS_KEYS = ["planning", "writing", "evaluation", "filed"];

const ANALYSIS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#DDD6FE" },
    preparing: { label: "준비중", color: "#C4B5FD" },
    running: { label: "진행중", color: "#A78BFA" },
    paused_done: { label: "완료", color: "#8B5CF6" },
    completed: { label: "완료", color: "#22C55E" },
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
                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all border ${selected === t ? "bg-blue-500 text-white border-blue-500" : "text-slate-500 border-transparent hover:bg-slate-50 hover:border-slate-200"}`}>
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
                        className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all border ${selected === t ? "bg-blue-500 text-white border-blue-500" : "text-slate-500 border-transparent hover:bg-slate-50 hover:border-slate-200"}`}>
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
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                    style={status === s ? { background: STATUS_CONFIG[s].color, color: statusText(STATUS_CONFIG[s].color) } : undefined}>
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
                                onKeyDown={e => chatKeyDown(e, addComment)} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && (
                        <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(paper!.id); onClose(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                    )}
                </div>
            </div>
        </div>
    );
}

function KanbanView({ papers, filter, onFilterPerson, allPeople, onClickPaper, onAddPaper, onSavePaper, onDeletePaper, onReorder, tagList, onSaveTags, teamNames, currentUser }: { papers: Paper[]; filter: string; onFilterPerson?: (name: string) => void; allPeople?: string[]; onClickPaper: (p: Paper) => void; onAddPaper: () => void; onSavePaper: (p: Paper) => void; onDeletePaper?: (id: number) => void; onReorder: (list: Paper[]) => void; tagList: string[]; onSaveTags: (list: string[]) => void; teamNames?: string[]; currentUser: string }) {
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
    const [selected, setSelected] = useState<Paper | null>(null);
    const [detailComment, setDetailComment] = useState("");
    const composingRef = useRef(false);
    // Comment draft
    useEffect(() => { if (selected) { const d = loadDraft(`comment_paper_${selected.id}`); if (d) setDetailComment(d); else setDetailComment(""); } }, [selected?.id]);
    useEffect(() => { if (selected) saveDraft(`comment_paper_${selected.id}`, detailComment); }, [detailComment, selected?.id]);
    const addDetailComment = () => { if (!detailComment.trim() || !selected) return; clearDraft(`comment_paper_${selected.id}`); const u = { ...selected, comments: [...selected.comments, { id: Date.now(), author: currentUser, text: detailComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] }; onSavePaper(u); setSelected(u); setDetailComment(""); };
    const delDetailComment = (cid: number) => { if (!selected) return; const u = { ...selected, comments: selected.comments.filter(c => c.id !== cid) }; onSavePaper(u); setSelected(u); };
    const completedPapers = filtered.filter(p => PAPER_STATUS_MIGRATE(p.status) === "completed");
    const kanbanFiltered = filtered.filter(p => PAPER_STATUS_MIGRATE(p.status) !== "completed");
    return (
        <div>
            {/* Title row with action buttons */}
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-slate-800">논문</h2>
                <div className="flex items-center gap-2">
                    <button onClick={onAddPaper} className="px-3.5 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors">+ 논문 등록</button>
                    <button onClick={() => setShowTagMgr(!showTagMgr)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-200">🏷️ 태그 관리</button>
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
                                        onClick={() => setSelected(p)}
                                        className={`bg-white rounded-xl py-3 px-4 cursor-grab transition-all overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${draggedId === p.id ? "opacity-40 scale-95" : ""} border border-slate-200 hover:border-slate-300`}
                                        style={{ borderLeft: p.needsDiscussion ? "3px solid #EF4444" : `3px solid ${st.color}` }}>
                                        <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words line-clamp-2">{p.title}<SavingBadge id={p.id} /></div>
                                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                            {p.team && <span className="text-[10.5px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{background:"#EFF6FF", color:"#3B82F6", fontWeight:500}}>{p.team}</span>}
                                            {p.tags.slice(0, 2).map(t => <span key={t} className="text-[10.5px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 flex-shrink-0">{t}</span>)}
                                            {p.tags.length > 2 && <span className="text-[10px] text-slate-400 flex-shrink-0">+{p.tags.length - 2}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                <div className="h-1 rounded-full transition-all" style={{ width: `${p.progress}%`, background: "#3B82F6" }} />
                                            </div>
                                            <span className="text-[10px] font-semibold" style={{color: p.progress >= 80 ? "#10B981" : "#3B82F6"}}>{p.progress}%</span>
                                        </div>
                                        <div className="flex -space-x-1 mt-1.5">
                                            {p.assignees.slice(0, 4).map(a => <span key={a} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={a}>{MEMBERS[a]?.emoji || "👤"}</span>)}
                                            {p.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{p.assignees.length - 4}</span>}
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
                <div className="grid grid-cols-3 gap-3">
                    {completedPapers.map(p => (
                        <div key={p.id} onClick={() => setSelected(p)}
                            className="bg-white rounded-xl p-4 cursor-pointer transition-all border border-emerald-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-slate-300"
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
                            {p.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[p.creator]?.emoji || ""}{p.creator}{p.createdAt ? ` · ${p.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedPapers.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 논문이 없습니다</div>}
                </div>
            )}
            {selected && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSelected(null); setDetailComment(""); }}>
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5 pb-3">
                            <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selected.title}</h2>
                            {selected.journal !== "TBD" && <p className="text-[13px] text-slate-500 italic mt-1">{selected.journal}</p>}
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-4 modal-scroll">
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
                            <div className="border-t border-slate-100" />
                            <div>
                                <span className="text-[12px] font-semibold text-slate-500 block mb-2">댓글 ({selected.comments.length})</span>
                                <div className="space-y-2 mb-3">
                                    {selected.comments.map(c => (
                                        <div key={c.id} className="flex gap-2 group">
                                            <div className="flex-1 bg-slate-50 rounded-lg p-2.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[12px] font-semibold text-slate-700">{MEMBERS[c.author]?.emoji} {c.author}</span>
                                                    <span className="text-[10px] text-slate-400">{c.date}</span>
                                                </div>
                                                <div className="text-[13px] text-slate-600 whitespace-pre-wrap">{c.text}</div>
                                            </div>
                                            {(c.author === currentUser || currentUser === "박일웅") && (
                                                <button onClick={() => delDetailComment(c.id)} className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 self-start mt-2">삭제</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input value={detailComment} onChange={e => setDetailComment(e.target.value)}
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addDetailComment(); }}
                                        placeholder="댓글 입력..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    <button onClick={addDetailComment} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 flex-shrink-0">등록</button>
                                </div>
                                {detailComment && hasDraft(`comment_paper_${selected.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-100">
                            <button onClick={() => { onClickPaper(selected); setSelected(null); setDetailComment(""); }} className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                {onDeletePaper && (currentUser === selected.creator || currentUser === "박일웅") && (
                                    <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDeletePaper(selected.id); setSelected(null); setDetailComment(""); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={() => { setSelected(null); setDetailComment(""); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
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
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                            className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                            style={status === s ? { background: cfg.color, color: statusText(cfg.color) } : undefined}>{cfg.label}</button>
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
                                onKeyDown={e => chatKeyDown(e, addComment)} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(report!.id); onClose(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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
    const [selected, setSelected] = useState<Report | null>(null);
    const [detailComment, setDetailComment] = useState("");
    const composingRef = useRef(false);
    // Comment draft
    useEffect(() => { if (selected) { const d = loadDraft(`comment_report_${selected.id}`); if (d) setDetailComment(d); else setDetailComment(""); } }, [selected?.id]);
    useEffect(() => { if (selected) saveDraft(`comment_report_${selected.id}`, detailComment); }, [detailComment, selected?.id]);
    const addDetailComment = () => { if (!detailComment.trim() || !selected) return; clearDraft(`comment_report_${selected.id}`); const u = { ...selected, comments: [...selected.comments, { id: Date.now(), author: currentUser, text: detailComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] }; onSave(u); setSelected(u); setDetailComment(""); };
    const delDetailComment = (cid: number) => { if (!selected) return; const u = { ...selected, comments: selected.comments.filter(c => c.id !== cid) }; onSave(u); setSelected(u); };
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
                                            onClick={() => setSelected(r)}
                                            className={`bg-white rounded-xl py-3 px-4 cursor-grab transition-all overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${draggedId === r.id ? "opacity-40 scale-95" : ""} border border-slate-200 hover:border-slate-300`}
                                            style={{ borderLeft: r.needsDiscussion ? "3px solid #EF4444" : `3px solid ${cfg.color}` }}>
                                            <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words line-clamp-2">{r.title}<SavingBadge id={r.id} /></div>
                                            <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                                {r.category && <span className={`text-[10.5px] px-1.5 py-0.5 rounded flex-shrink-0 ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`} style={{fontWeight:500}}>{r.category}</span>}
                                                {r.team && <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{r.team}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                    <div className="h-1 rounded-full transition-all" style={{ width: `${r.progress}%`, background: "#3B82F6" }} />
                                                </div>
                                                <span className="text-[10px] font-semibold" style={{color: r.progress >= 80 ? "#10B981" : "#3B82F6"}}>{r.progress}%</span>
                                            </div>
                                            <div className="flex -space-x-1 mt-1.5">
                                                {r.assignees.slice(0, 4).map(a => <span key={a} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={a}>{MEMBERS[a]?.emoji || "👤"}</span>)}
                                                {r.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{r.assignees.length - 4}</span>}
                                            </div>
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
                        <div key={r.id} onClick={() => setSelected(r)}
                            className="bg-white rounded-xl p-4 cursor-pointer transition-all border border-emerald-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-slate-300"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                {r.category && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${r.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{r.category}</span>}
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
                            {r.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[r.creator]?.emoji || ""}{r.creator}{r.createdAt ? ` · ${r.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedReports.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 계획서/보고서가 없습니다</div>}
                </div>
            )}
            {addCategory && <ReportFormModal report={null} initialCategory={addCategory} onSave={r => { onSave(r); setAddCategory(null); }} onClose={() => setAddCategory(null)} currentUser={currentUser} teamNames={teamNames} />}
            {editing && <ReportFormModal report={editing} onSave={r => { onSave(r); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} teamNames={teamNames} />}
            {selected && !editing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSelected(null); setDetailComment(""); }}>
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5 pb-3">
                            <div className="flex items-center gap-2 mb-1">
                                {selected.category && <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${selected.category === "보고서" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"}`}>{selected.category}</span>}
                            </div>
                            <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selected.title}</h2>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-4 modal-scroll">
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
                            <div className="border-t border-slate-100" />
                            <div>
                                <span className="text-[12px] font-semibold text-slate-500 block mb-2">댓글 ({selected.comments.length})</span>
                                <div className="space-y-2 mb-3">
                                    {selected.comments.map(c => (
                                        <div key={c.id} className="flex gap-2 group">
                                            <div className="flex-1 bg-slate-50 rounded-lg p-2.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[12px] font-semibold text-slate-700">{MEMBERS[c.author]?.emoji} {c.author}</span>
                                                    <span className="text-[10px] text-slate-400">{c.date}</span>
                                                </div>
                                                <div className="text-[13px] text-slate-600 whitespace-pre-wrap">{c.text}</div>
                                            </div>
                                            {(c.author === currentUser || currentUser === "박일웅") && (
                                                <button onClick={() => delDetailComment(c.id)} className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 self-start mt-2">삭제</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input value={detailComment} onChange={e => setDetailComment(e.target.value)}
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addDetailComment(); }}
                                        placeholder="댓글 입력..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    <button onClick={addDetailComment} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 flex-shrink-0">등록</button>
                                </div>
                                {detailComment && hasDraft(`comment_report_${selected.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-100">
                            <button onClick={() => { setEditing(selected); setSelected(null); setDetailComment(""); }} className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                {(currentUser === selected.creator || currentUser === "박일웅") && (
                                    <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(selected.id); setSelected(null); setDetailComment(""); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={() => { setSelected(null); setDetailComment(""); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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

    // Mobile list view state
    const [mobileOffset, setMobileOffset] = useState(0); // 0 = today-based, increments of 7

    return (
        <div>
            {/* Mobile list view */}
            <div className="md:hidden">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setMobileOffset(p => p - 7)} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[14px]">◀</button>
                    <span className="text-[15px] font-bold text-slate-800">{month.y}년 {month.m + 1}월</span>
                    <div className="flex items-center gap-1.5">
                        {mobileOffset !== 0 && <button onClick={() => setMobileOffset(0)} className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[12px] font-medium">오늘</button>}
                        <button onClick={() => setMobileOffset(p => p + 7)} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[14px]">▶</button>
                    </div>
                </div>
                <div className="space-y-1">
                    {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(); d.setDate(d.getDate() + mobileOffset + i);
                        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        const dayItems = data.filter(v => v.date === ds);
                        const dispatchItems = (dispatches || []).filter(dp => dp.start <= ds && dp.end >= ds);
                        const isToday = ds === todayStr;
                        const isTomorrow = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return ds === `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; })();
                        const dow = d.getDay();
                        const we = dow === 0 || dow === 6;
                        return (
                            <div key={ds} className={`rounded-xl p-3 ${isToday ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200"}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {isToday && <span className="text-[11px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">오늘</span>}
                                    {isTomorrow && <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">내일</span>}
                                    <span className={`text-[14px] font-semibold ${we ? (dow === 0 ? "text-red-500" : "text-blue-500") : "text-slate-800"}`}>
                                        {d.getMonth() + 1}월 {d.getDate()}일 ({dayL[dow]})
                                    </span>
                                    {(isPI || true) && <button onClick={() => { setEditCell({ name: currentUser, date: ds }); setEditDesc(""); }} className="ml-auto text-[18px] text-slate-300 hover:text-blue-500">+</button>}
                                </div>
                                {dayItems.length === 0 && dispatchItems.length === 0 ? (
                                    <div className="text-[13px] text-slate-300 pl-1">일정 없음</div>
                                ) : (
                                    <div className="space-y-1">
                                        {dayItems.map(v => {
                                            const vt = types[v.type];
                                            return (
                                                <div key={`${v.name}-${v.type}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: `${vt?.color || "#94A3B8"}15` }}
                                                    onClick={() => { if (v.name === currentUser || isPI) { setSelType(v.type); setEditDesc(v.description || ""); setEditCell({ name: v.name, date: ds, existing: { type: v.type, description: v.description } }); } }}>
                                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: vt?.color || "#94A3B8" }} />
                                                    <span className="text-[13px]"><span className="font-semibold text-slate-700">{MEMBERS[v.name]?.emoji || "👤"}{v.name}</span> <span className="text-slate-500">{vt?.label}{v.description ? ` · ${v.description}` : ""}</span></span>
                                                </div>
                                            );
                                        })}
                                        {dispatchItems.map(dp => (
                                            <div key={dp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-50">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-violet-400" />
                                                <span className="text-[13px]"><span className="font-semibold text-slate-700">{MEMBERS[dp.name]?.emoji || "👤"}{dp.name}</span> <span className="text-violet-500">파견 · {dp.description}</span></span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* Dispatch section mobile */}
                <div className="mt-4">
                    <DispatchPanel dispatches={dispatches || []} currentUser={currentUser} onSave={onDispatchSave} onDelete={onDispatchDelete} />
                </div>
            </div>

            {/* Desktop grid view */}
            <div className="hidden md:block">
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
                <div className="absolute right-0 -top-5 flex gap-1.5 items-center z-10">
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
                                    <th key={d.date} className={`border-b border-[#E2E8F0] px-0 py-1 text-center cursor-pointer hover:bg-blue-50 transition-colors ${sel ? "bg-amber-50 ring-1 ring-inset ring-amber-300" : td ? "bg-[#EFF6FF]" : we ? "bg-[#F8FAFC]" : "bg-white"}`}
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
                                                className={`border-b border-[#E2E8F0] text-center py-0.5 px-0 select-none ${td ? "bg-[#EFF6FF]" : we ? "bg-[#F8FAFC]" : ""} ${canEdit ? "cursor-pointer" : ""} ${inDrag ? "bg-amber-100" : ""}`}
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
                                    <td className={`sticky left-0 z-10 border-r border-b border-[#E2E8F0] px-1 py-1.5 text-[13px] text-center whitespace-nowrap overflow-hidden ${isMe ? "bg-blue-50 font-semibold text-slate-800" : "bg-white text-slate-600"}`}
                                        style={dispatched ? { borderLeft: "3px solid #8B5CF6", background: "#F5F3FF" } : undefined}>
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
                                                className={`border-b border-[#E2E8F0] text-center py-0.5 px-0 select-none ${cellDispatched ? "bg-violet-50/80" : td ? "bg-[#EFF6FF]" : we ? "bg-[#F8FAFC]" : ""} ${canEdit ? "cursor-pointer" : ""} ${inDrag ? "bg-blue-100" : ""}`}
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
                    const bgColor = isThisWeek ? "bg-white border-slate-200" : "bg-white border-slate-200";
                    const titleColor = isThisWeek ? "text-slate-800" : "text-blue-700";
                    const dayTitleColor = isThisWeek ? "text-slate-600" : "text-blue-600";
                    const cardBorder = isThisWeek ? "border-slate-200 text-slate-700" : "border-blue-200 text-blue-800";
                    const weekLabel = isThisWeek ? "이번 주" : `${monLabel} ~ ${friLabel} 주`;
                    return (
                        <div className={`p-3 rounded-xl border sticky top-0 ${bgColor}`} style={{borderLeft: isThisWeek ? "3px solid #F59E0B" : "3px solid #3B82F6"}}>
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
            </div>
            {/* Inline event form for schedule mode */}
            {editCell && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditCell(null)}>
                    <div className="bg-white rounded-xl p-4 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-[16px] font-bold text-slate-900 mb-4">
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
                        <h4 className="text-[14px] mb-1" style={{fontWeight:650, color:"#334155"}}>{editBlock ? "수업 수정" : "수업 추가"}</h4>
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
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color, color: statusText(cfg.color) } : undefined}>{cfg.label}</button>
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
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(experiment!.id); onClose(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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
    const [selected, setSelected] = useState<Experiment | null>(null);
    const [detailComment, setDetailComment] = useState("");
    const composingRef = useRef(false);
    // Comment draft
    useEffect(() => { if (selected) { const d = loadDraft(`comment_exp_${selected.id}`); if (d) setDetailComment(d); else setDetailComment(""); } }, [selected?.id]);
    useEffect(() => { if (selected) saveDraft(`comment_exp_${selected.id}`, detailComment); }, [detailComment, selected?.id]);
    const addDetailComment = () => { if (!detailComment.trim() || !selected) return; clearDraft(`comment_exp_${selected.id}`); const u = { ...selected, logs: [{ id: Date.now(), author: currentUser, text: detailComment.trim(), date: new Date().toLocaleDateString("ko-KR") }, ...selected.logs] }; onSave(u); setSelected(u); setDetailComment(""); };
    const delDetailComment = (cid: number) => { if (!selected) return; const u = { ...selected, logs: selected.logs.filter(c => c.id !== cid) }; onSave(u); setSelected(u); };
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
                                <span className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>{cfg.label}</span>
                                <span className="text-[12px] text-slate-400">{col.length}</span>
                            </div>
                            <div className={`min-h-[80px] space-y-2 rounded-lg transition-colors ${dropTarget?.col === status ? "bg-blue-50/50" : ""}`}>
                                {col.map((exp, cardIdx) => (
                                    <div key={exp.id}>
                                    {dropTarget?.col === status && dropTarget?.idx === cardIdx && <DropLine />}
                                    <div draggable onDragStart={() => { dragItem.current = exp; setDraggedId(exp.id); }}
                                        onDragEnd={() => { dragItem.current = null; setDraggedId(null); setDropTarget(null); }}
                                        onDragOver={e => { e.preventDefault(); if (draggedId === exp.id) return; e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropTarget({ col: status, idx: e.clientY < mid ? cardIdx : cardIdx + 1 }); }}
                                        onClick={() => setSelected(exp)}
                                        className={`bg-white rounded-xl py-3 px-4 cursor-grab transition-all overflow-hidden hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${draggedId === exp.id ? "opacity-40 scale-95" : ""} border border-slate-200 hover:border-slate-300`}
                                        style={{ borderLeft: exp.needsDiscussion ? "3px solid #EF4444" : `3px solid ${cfg.color}` }}>
                                        <div className="text-[13px] font-semibold text-slate-800 leading-snug break-words line-clamp-2">{exp.title}<SavingBadge id={exp.id} /></div>
                                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                                            <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 flex-shrink-0">🔧 {exp.equipment}</span>
                                            {exp.team && <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{exp.team}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                <div className="h-1 rounded-full transition-all" style={{ width: `${exp.progress ?? 0}%`, background: "#3B82F6" }} />
                                            </div>
                                            <span className="text-[10px] font-semibold" style={{color: (exp.progress ?? 0) >= 80 ? "#10B981" : "#3B82F6"}}>{exp.progress ?? 0}%</span>
                                        </div>
                                        <div className="flex -space-x-1 mt-1.5">
                                            {exp.assignees.slice(0, 4).map(a => <span key={a} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={a}>{MEMBERS[a]?.emoji || "👤"}</span>)}
                                            {exp.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{exp.assignees.length - 4}</span>}
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
                <div className="grid grid-cols-3 gap-3">
                    {completedExperiments.map(exp => (
                        <div key={exp.id} onClick={() => setSelected(exp)}
                            className="bg-white rounded-xl p-4 cursor-pointer transition-all border border-emerald-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-slate-300"
                            style={{ borderLeft: "3px solid #059669" }}>
                            <div className="text-[14px] font-semibold text-slate-800 mb-1 leading-snug break-words">{exp.title}<SavingBadge id={exp.id} /></div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] text-slate-500">🔧 {exp.equipment}</span>
                                {exp.team && <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-semibold">{exp.team}</span>}
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
            {selected && !editing && !adding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSelected(null); setDetailComment(""); }}>
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5 pb-3">
                            <h2 className="text-[17px] font-bold text-slate-800 leading-snug">{selected.title}</h2>
                            <p className="text-[13px] text-slate-500 mt-1">🔧 {selected.equipment}</p>
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
                                <span className="text-[12px] px-2 py-0.5 rounded-full font-medium" style={{background: EXP_STATUS_CONFIG[EXP_STATUS_MIGRATE(selected.status)]?.color || "#94A3B8", color: statusText(EXP_STATUS_CONFIG[EXP_STATUS_MIGRATE(selected.status)]?.color || "#94A3B8")}}>{EXP_STATUS_CONFIG[EXP_STATUS_MIGRATE(selected.status)]?.label || selected.status}</span>
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
                                <span className="text-[12px] font-semibold text-slate-500 block mb-2">실험 일지 ({selected.logs.length})</span>
                                <div className="space-y-2 mb-3">
                                    {selected.logs.map(c => (
                                        <div key={c.id} className="flex gap-2 group">
                                            <div className="flex-1 bg-slate-50 rounded-lg p-2.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[12px] font-semibold text-slate-700">{MEMBERS[c.author]?.emoji} {c.author}</span>
                                                    <span className="text-[10px] text-slate-400">{c.date}</span>
                                                </div>
                                                <div className="text-[13px] text-slate-600 whitespace-pre-wrap">{c.text}</div>
                                            </div>
                                            {(c.author === currentUser || currentUser === "박일웅") && (
                                                <button onClick={() => delDetailComment(c.id)} className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 self-start mt-2">삭제</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input value={detailComment} onChange={e => setDetailComment(e.target.value)}
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addDetailComment(); }}
                                        placeholder="실험 일지 작성..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    <button onClick={addDetailComment} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 flex-shrink-0">등록</button>
                                </div>
                                {detailComment && hasDraft(`comment_exp_${selected.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-100">
                            <button onClick={() => { setEditing(selected); setSelected(null); setDetailComment(""); }} className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                {(currentUser === selected.creator || currentUser === "박일웅") && (
                                    <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(selected.id); setSelected(null); setDetailComment(""); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={() => { setSelected(null); setDetailComment(""); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color, color: statusText(cfg.color) } : undefined}>{cfg.label}</button>
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
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (handleSave()) onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(analysis!.id); onClose(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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
    const [selected, setSelected] = useState<Analysis | null>(null);
    const [detailComment, setDetailComment] = useState("");
    const composingRef = useRef(false);
    // Comment draft
    useEffect(() => { if (selected) { const d = loadDraft(`comment_analysis_${selected.id}`); if (d) setDetailComment(d); else setDetailComment(""); } }, [selected?.id]);
    useEffect(() => { if (selected) saveDraft(`comment_analysis_${selected.id}`, detailComment); }, [detailComment, selected?.id]);
    const addDetailComment = () => { if (!detailComment.trim() || !selected) return; clearDraft(`comment_analysis_${selected.id}`); const u = { ...selected, logs: [{ id: Date.now(), author: currentUser, text: detailComment.trim(), date: new Date().toLocaleDateString("ko-KR") }, ...selected.logs] }; onSave(u); setSelected(u); setDetailComment(""); };
    const delDetailComment = (cid: number) => { if (!selected) return; const u = { ...selected, logs: selected.logs.filter(c => c.id !== cid) }; onSave(u); setSelected(u); };
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
                                            <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 flex-shrink-0">🖥️ {a.tool}</span>
                                            {a.team && <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{a.team}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                <div className="h-1 rounded-full transition-all" style={{ width: `${a.progress ?? 0}%`, background: "#3B82F6" }} />
                                            </div>
                                            <span className="text-[10px] font-semibold" style={{color: (a.progress ?? 0) >= 80 ? "#10B981" : "#3B82F6"}}>{a.progress ?? 0}%</span>
                                        </div>
                                        <div className="flex -space-x-1 mt-1.5">
                                            {a.assignees.slice(0, 4).map(n => <span key={n} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={n}>{MEMBERS[n]?.emoji || "👤"}</span>)}
                                            {a.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{a.assignees.length - 4}</span>}
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
                <div className="grid grid-cols-3 gap-3">
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
                            {a.creator && <div className="text-[10px] text-slate-400 text-right mt-1">by {MEMBERS[a.creator]?.emoji || ""}{a.creator}{a.createdAt ? ` · ${a.createdAt}` : ""}</div>}
                        </div>
                    ))}
                    {completedAnalyses.length === 0 && <div className="col-span-3 text-center text-[13px] text-slate-400 py-8">완료된 해석이 없습니다</div>}
                </div>
            )}
            {adding && <AnalysisFormModal analysis={null} onSave={a => { onSave(a); setAdding(false); }} onClose={() => setAdding(false)} currentUser={currentUser} toolList={toolList} teamNames={teamNames} />}
            {editing && <AnalysisFormModal analysis={editing} onSave={a => { onSave(a); setEditing(null); }} onDelete={onDelete} onClose={() => setEditing(null)} currentUser={currentUser} toolList={toolList} teamNames={teamNames} />}
            {selected && !editing && !adding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSelected(null); setDetailComment(""); }}>
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
                                                    <span className="text-[10px] text-slate-400">{c.date}</span>
                                                </div>
                                                <div className="text-[13px] text-slate-600 whitespace-pre-wrap">{c.text}</div>
                                            </div>
                                            {(c.author === currentUser || currentUser === "박일웅") && (
                                                <button onClick={() => delDetailComment(c.id)} className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 self-start mt-2">삭제</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input value={detailComment} onChange={e => setDetailComment(e.target.value)}
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => { if (e.key === "Enter" && !composingRef.current) addDetailComment(); }}
                                        placeholder="해석 일지 작성..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    <button onClick={addDetailComment} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 flex-shrink-0">등록</button>
                                </div>
                                {detailComment && hasDraft(`comment_analysis_${selected.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-100">
                            <button onClick={() => { setEditing(selected); setSelected(null); setDetailComment(""); }} className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                {(currentUser === selected.creator || currentUser === "박일웅") && (
                                    <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(selected.id); setSelected(null); setDetailComment(""); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={() => { setSelected(null); setDetailComment(""); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
    const [mobileCol, setMobileCol] = useState("todo");
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
            <div className="flex flex-nowrap overflow-x-auto gap-1 mb-3 md:flex-wrap md:overflow-visible">
                <button onClick={() => setFilterPeople([])} className={`px-2 py-0.5 rounded-full text-[12px] font-medium shrink-0 ${filterPeople.length === 0 ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>전체</button>
                {MEMBER_NAMES.map(name => (
                    <button key={name} onClick={() => setFilterPeople(filterPeople.includes(name) ? filterPeople.filter(n => n !== name) : [...filterPeople, name])}
                        className={`px-2 py-0.5 rounded-full text-[12px] font-medium shrink-0 ${filterPeople.includes(name) ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {MEMBERS[name]?.emoji} {name}
                    </button>
                ))}
            </div>
            {/* Stats + Add button */}
            <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setShowForm(!showForm)} className="hidden md:inline-flex px-4 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600">+ 할 일 추가</button>
                <span className="text-[13px] text-slate-400">{doneCount}/{totalCount} 완료</span>
            </div>
            {/* Add form — inline on desktop, modal on mobile */}
            {showForm && (
                <div className="hidden md:block">
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
                </div>
            )}
            {/* Mobile add modal */}
            {showForm && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[15px] font-bold text-slate-800">할 일 추가</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="할 일 내용..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
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
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-[13px] w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                            <div className="flex gap-2">
                                <button onClick={() => setEditingTodo(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={() => { onUpdate({ ...editingTodo, text: newText, assignees: newAssignees.length > 0 ? newAssignees : editingTodo.assignees, priority: newPriority, deadline: newDeadline, progress: newProgress, comments: editComments }); setEditingTodo(null); }}
                                    className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(editingTodo.id); setEditingTodo(null); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
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
    const isPI = currentUser === "박일웅";
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [editingTeam, setEditingTeam] = useState<string | null>(null);
    const [addingTeam, setAddingTeam] = useState(false);
    const [formName, setFormName] = useState("");
    const [formLead, setFormLead] = useState("");
    const [formMembers, setFormMembers] = useState<string[]>([]);
    const [formColor, setFormColor] = useState(TEAM_COLORS[0]);
    const [formEmoji, setFormEmoji] = useState(TEAM_EMOJIS[0]);
    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
    const [draggedTeam, setDraggedTeam] = useState<string | null>(null);
    const [dropIdx, setDropIdx] = useState<number | null>(null);
    const teamNames = Object.keys(teams);

    const toggleExpand = (name: string) => { setExpanded(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; }); };
    const openEdit = (name: string) => {
        const t = teams[name];
        setEditingTeam(name); setFormName(name); setFormLead(t.lead); setFormMembers(t.members); setFormColor(t.color); setFormEmoji(t.emoji || TEAM_EMOJIS[0]);
    };
    const openAdd = () => {
        const idx = teamNames.length;
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
    const handleDrop = (targetIdx: number) => {
        if (!draggedTeam) return;
        const srcIdx = teamNames.indexOf(draggedTeam);
        if (srcIdx === targetIdx || srcIdx === targetIdx - 1) { setDraggedTeam(null); setDropIdx(null); return; }
        const ordered = [...teamNames];
        ordered.splice(srcIdx, 1);
        const insertAt = targetIdx > srcIdx ? targetIdx - 1 : targetIdx;
        ordered.splice(insertAt, 0, draggedTeam);
        const reordered: Record<string, TeamData> = {};
        ordered.forEach(n => { reordered[n] = teams[n]; });
        onSaveTeams(reordered);
        setDraggedTeam(null); setDropIdx(null);
    };

    const modal = editingTeam !== null || addingTeam;

    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                {isPI && <button onClick={openAdd} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 팀 추가</button>}
                <span className="text-[13px] text-slate-400">{teamNames.length}개 팀</span>
            </div>
            <div className="space-y-0 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {teamNames.map((name, idx) => {
                    const team = teams[name];
                    const isOpen = expanded.has(name);
                    const paperCount = papers.filter(p => p.team === name).length;
                    const todoCount = todos.filter(t => !t.done && team.members.some(m => t.assignees.includes(m))).length;
                    const expCount = experiments.filter(e => team.members.some(m => e.assignees.includes(m))).length;
                    const anaCount = analyses.filter(a => team.members.some(m => a.assignees.includes(m))).length;
                    return (
                        <div key={name}>
                            {isPI && dropIdx === idx && draggedTeam && draggedTeam !== name && <div className="h-0.5 bg-blue-400 mx-3" />}
                            <div
                                draggable={isPI}
                                onDragStart={() => setDraggedTeam(name)}
                                onDragEnd={() => { setDraggedTeam(null); setDropIdx(null); }}
                                onDragOver={e => { e.preventDefault(); const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.top + rect.height / 2; setDropIdx(e.clientY < mid ? idx : idx + 1); }}
                                onDrop={() => handleDrop(dropIdx ?? idx)}
                                className={`flex items-center gap-2 px-3 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${idx > 0 ? "border-t border-slate-100" : ""} ${draggedTeam === name ? "opacity-40" : ""}`}
                                onClick={() => toggleExpand(name)}>
                                {isPI && <span className="text-slate-300 cursor-grab flex-shrink-0 text-[14px]" title="드래그하여 순서 변경">⋮⋮</span>}
                                <span className={`text-[13px] text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                                <span className="text-[15px] flex-shrink-0">{team.emoji || "📌"}</span>
                                <span className="text-[14px] font-bold text-slate-800 truncate">{name}</span>
                                <span className="text-[12px] text-slate-400 flex-shrink-0">팀장: {MEMBERS[team.lead]?.emoji || ""}{team.lead}</span>
                                <span className="text-[12px] text-slate-400 flex-shrink-0">|</span>
                                <span className="text-[12px] text-slate-400 flex-shrink-0">{team.members.length}명</span>
                                <span className="text-[12px] text-slate-400 flex-shrink-0">|</span>
                                <span className="text-[11px] text-slate-400 flex-shrink-0 flex items-center gap-1.5">
                                    <span title="논문">📄{paperCount}</span>
                                    <span title="할 일">✅{todoCount}</span>
                                    <span title="실험">🧪{expCount}</span>
                                    <span title="해석">💻{anaCount}</span>
                                </span>
                                {isPI && <button onClick={e => { e.stopPropagation(); openEdit(name); }} className="ml-auto text-[12px] text-slate-400 hover:text-blue-500 flex-shrink-0 px-1.5 py-0.5 rounded hover:bg-blue-50">수정</button>}
                            </div>
                            {isOpen && (
                                <div className="px-4 pb-3 pt-1 bg-slate-50/50 border-t border-slate-100">
                                    <div className="space-y-1.5">
                                        {team.members.map(m => {
                                            const mp = papers.filter(p => p.assignees.includes(m) && p.team === name).length;
                                            const mt = todos.filter(t => !t.done && t.assignees.includes(m)).length;
                                            const me = experiments.filter(e => e.assignees.includes(m) && EXP_STATUS_MIGRATE(e.status) !== "completed").length;
                                            const ma = analyses.filter(a => a.assignees.includes(m) && ANALYSIS_STATUS_MIGRATE(a.status) !== "completed").length;
                                            return (
                                                <div key={m} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px]">{MEMBERS[m]?.emoji || "👤"}</span>
                                                        <span className="text-[13px] font-medium text-slate-700">{m}</span>
                                                        {m === team.lead && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 font-semibold">팀장</span>}
                                                    </div>
                                                    <div className="flex gap-2.5 text-[12px] text-slate-500">
                                                        <span title="논문">📄{mp}</span>
                                                        <span title="할 일">✅{mt}</span>
                                                        <span title="실험 진행중">🧪{me}</span>
                                                        <span title="해석 진행중">💻{ma}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {isPI && dropIdx === teamNames.length && draggedTeam && <div className="h-0.5 bg-blue-400 mx-3" />}
            </div>
            {/* Team edit/add modal */}
            {modal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setEditingTeam(null); setAddingTeam(false); }}>
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingTeam(null); setAddingTeam(false); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            {editingTeam && isPI && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { handleDelete(editingTeam); setEditingTeam(null); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${status === s ? "" : "bg-slate-100 text-slate-500"}`}
                                        style={status === s ? { background: cfg.color, color: statusText(cfg.color) } : undefined}>{cfg.label}</button>
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
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { if (title.trim()) { onSave({ id: patent?.id ?? Date.now(), title, deadline, status, assignees, creator: patent?.creator || currentUser, createdAt: patent?.createdAt || new Date().toLocaleString("ko-KR"), team }); onClose(); } }}
                            className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(patent!.id); onClose(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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
                                            {p.team && <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 flex-shrink-0" style={{fontWeight:500}}>{p.team}</span>}
                                            {p.deadline && <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 flex-shrink-0" style={{fontWeight:500}}>~{p.deadline}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 rounded-full h-1" style={{background:"#F1F5F9"}}>
                                                <div className="h-1 rounded-full transition-all" style={{ width: `${p.progress || 0}%`, background: "#3B82F6" }} />
                                            </div>
                                            <span className="text-[10px] font-semibold" style={{color: (p.progress || 0) >= 80 ? "#10B981" : "#3B82F6"}}>{p.progress || 0}%</span>
                                        </div>
                                        <div className="flex -space-x-1 mt-1.5">
                                            {p.assignees.slice(0, 4).map(a => <span key={a} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] border border-white" style={{background:"#F1F5F9"}} title={a}>{MEMBERS[a]?.emoji || "👤"}</span>)}
                                            {p.assignees.length > 4 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] border border-white" style={{background:"#F1F5F9", color:"#94A3B8"}}>+{p.assignees.length - 4}</span>}
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
                <div className="grid grid-cols-3 gap-3">
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

    // Mobile single-day view
    const mobileDateStr = fmtDate(centerDate);
    const mobileDow = centerDate.getDay();
    const mobileWritten = MEMBER_NAMES.filter(n => getTarget(n, mobileDateStr));
    const mobileUnwritten = MEMBER_NAMES.filter(n => !getTarget(n, mobileDateStr));

    return (
        <div>
            {/* Mobile single-day view */}
            <div className="md:hidden">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => shiftCenter(-1)} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[16px]">◀</button>
                    <div className="text-center">
                        <div className="text-[16px] font-bold text-slate-800">
                            {centerDate.getMonth() + 1}월 {centerDate.getDate()}일 ({dayL[mobileDow]})
                            {isCenterToday && <span className="ml-1.5 text-[11px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded align-middle">TODAY</span>}
                        </div>
                        {!isCenterToday && <button onClick={goToday} className="text-[12px] text-blue-500 mt-0.5">오늘로 이동</button>}
                    </div>
                    <button onClick={() => shiftCenter(1)} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[16px]">▶</button>
                </div>
                <div className="space-y-2">
                    {mobileWritten.map(name => {
                        const target = getTarget(name, mobileDateStr)!;
                        const isMe = name === currentUser;
                        const canEdit = isMe || currentUser === "박일웅";
                        return (
                            <div key={name} className={`rounded-xl p-3 ${isMe ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200"}`}
                                onClick={() => { if (canEdit) { setEditCell({ name, date: mobileDateStr }); setEditText(target.text); } }}>
                                <div className="text-[13px] font-bold text-slate-700 mb-1">{MEMBERS[name]?.emoji} {name}</div>
                                <div className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">{target.text}</div>
                            </div>
                        );
                    })}
                </div>
                {mobileUnwritten.length > 0 && (
                    <div className="mt-4">
                        <div className="text-[12px] font-semibold text-slate-400 mb-2">미작성</div>
                        <div className="flex flex-wrap gap-1.5">
                            {mobileUnwritten.map(name => {
                                const canEdit = name === currentUser || currentUser === "박일웅";
                                return (
                                    <span key={name} className={`text-[12px] px-2 py-1 rounded-lg bg-slate-100 text-slate-400 ${canEdit ? "cursor-pointer hover:bg-slate-200" : ""}`}
                                        onClick={() => { if (canEdit) { setEditCell({ name, date: mobileDateStr }); setEditText(""); } }}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop 3-day table view */}
            <div className="hidden md:block">
            {/* Navigation bar */}
            <div className="flex items-center justify-center gap-3 mb-3">
                <button onClick={() => shiftCenter(-1)} className="px-2.5 py-1 rounded-md text-[14px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">&lt;</button>
                <button onClick={goToday} className={`px-3 py-1 rounded-md text-[14px] font-medium transition-colors ${isCenterToday ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>오늘</button>
                <button onClick={() => shiftCenter(1)} className="px-2.5 py-1 rounded-md text-[14px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">&gt;</button>
            </div>
            </div>
            <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 border-b border-r border-slate-200 px-2 py-2 text-left text-[13px] font-semibold w-[72px]" style={{background:"#FAFBFC", color:"#94A3B8"}}>이름</th>
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
                                <tr key={name} className={`${isMe ? "bg-blue-50/30" : "hover:bg-[#F8FAFC]"} transition-colors`}>
                                    <td className={`sticky left-0 z-10 border-r border-b border-slate-100 px-2 py-2.5 text-[13px] whitespace-nowrap overflow-hidden ${isMe ? "font-semibold text-slate-800" : "text-slate-600"}`} style={{background: isMe ? "#EFF6FF" : "#FAFBFC"}}>
                                        {MEMBERS[name]?.emoji} {name}
                                    </td>
                                    {days.map(d => {
                                        const target = getTarget(name, d.str);
                                        return (
                                            <td key={d.str} className={`border-b border-l border-slate-200 px-2.5 py-2.5 align-top ${d.isToday ? "bg-[#EFF6FF]/50" : ""} ${canEdit ? "cursor-pointer hover:bg-slate-50" : ""}`}
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
                        <h4 className="text-[14px] mb-1" style={{fontWeight:650, color:"#334155"}}>{editCell.date === todayStr ? "오늘 목표" : `${editCell.date} 목표`}</h4>
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
    const [confDraftLoaded, setConfDraftLoaded] = useState(false);

    const openAdd = (status?: string) => {
        setEditing(null); setParticipants([]); setFormStatus(status || "관심"); setComments([]); setNewComment("");
        const d = loadDraft("conf_add");
        if (d) { try { const p = JSON.parse(d); setTitle(p.title || ""); setStartDate(p.startDate || ""); setEndDate(p.endDate || ""); setHomepage(p.homepage || ""); setFee(p.fee || ""); setConfDraftLoaded(true); } catch { setTitle(""); setStartDate(""); setEndDate(""); setHomepage(""); setFee(""); setConfDraftLoaded(false); } }
        else { setTitle(""); setStartDate(""); setEndDate(""); setHomepage(""); setFee(""); setConfDraftLoaded(false); }
        setAdding(true);
    };
    const openEdit = (c: ConferenceTrip) => { setEditing(c); setAdding(false); setTitle(c.title); setStartDate(c.startDate); setEndDate(c.endDate); setHomepage(c.homepage); setFee(c.fee); setParticipants(c.participants); setFormStatus(c.status || "관심"); setComments(c.comments || []); setNewComment(""); setConfDraftLoaded(false); };
    const closeModal = () => { if (adding && (title.trim() || homepage.trim() || fee.trim())) saveDraft("conf_add", JSON.stringify({ title, startDate, endDate, homepage, fee })); setAdding(false); setEditing(null); setConfDraftLoaded(false); };

    // Draft auto-save for add form
    useEffect(() => { if (adding && !editing) saveDraft("conf_add", JSON.stringify({ title, startDate, endDate, homepage, fee })); }, [title, startDate, endDate, homepage, fee, adding, editing]);

    const handleSave = () => {
        if (!title.trim()) return false;
        clearDraft("conf_add");
        onSave({ id: editing?.id ?? Date.now(), title: title.trim(), startDate, endDate, homepage: homepage.trim(), fee: fee.trim(), participants, creator: editing?.creator || currentUser, createdAt: editing?.createdAt || new Date().toISOString(), status: formStatus, comments, needsDiscussion: editing?.needsDiscussion });
        setConfDraftLoaded(false);
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

    // Sort by startDate ascending and group by month
    const sorted = useMemo(() => [...items].sort((a, b) => {
        const da = a.startDate || "9999-12-31";
        const db = b.startDate || "9999-12-31";
        return da.localeCompare(db);
    }), [items]);

    const monthGroups = useMemo(() => {
        const groups: { label: string; key: string; items: ConferenceTrip[] }[] = [];
        for (const c of sorted) {
            const d = c.startDate ? new Date(c.startDate) : null;
            const key = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "no-date";
            const label = d ? `📅 ${d.getFullYear()}년 ${d.getMonth() + 1}월` : "📅 날짜 미정";
            let group = groups.find(g => g.key === key);
            if (!group) { group = { label, key, items: [] }; groups.push(group); }
            group.items.push(c);
        }
        return groups;
    }, [sorted]);

    return (
        <div>
            <button onClick={() => openAdd()} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-[14px] font-medium hover:bg-blue-600">+ 학회/출장 추가</button>
            {items.length === 0 && <div className="text-center py-12 text-slate-400 text-[14px]">등록된 학회/출장이 없습니다</div>}
            {monthGroups.map(group => (
                <div key={group.key} className="mb-6">
                    <h3 className="text-[15px] font-bold text-slate-700 mb-3 pb-2 border-b border-slate-200">{group.label}</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {group.items.map(c => {
                            const cmt = c.comments || [];
                            return (
                            <div key={c.id} onClick={() => openEdit(c)}
                                className={`bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${c.needsDiscussion ? "border border-slate-200 border-l-[3px] border-l-red-400" : "border border-slate-200 hover:border-slate-300"}`}>
                                <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!c.needsDiscussion} onChange={() => onSave({ ...c, needsDiscussion: !c.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                    <span className={`text-[11px] font-medium ${c.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                </label>
                                <div className="text-[14px] font-semibold text-slate-800 mb-1">{c.title}<SavingBadge id={c.id} /></div>
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
                    </div>
                </div>
            ))}

            {modal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "학회/출장 수정" : "학회/출장 추가"}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {confDraftLoaded && !isEdit && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                                    <span>임시저장된 글이 있습니다</span>
                                    <button onClick={() => { setTitle(""); setStartDate(""); setEndDate(""); setHomepage(""); setFee(""); clearDraft("conf_add"); setConfDraftLoaded(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                                </div>
                            )}
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
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={() => { if (handleSave()) { setAdding(false); setEditing(null); setConfDraftLoaded(false); } }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            {isEdit && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(editing!.id); closeModal(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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
    const [resDraftLoaded, setResDraftLoaded] = useState(false);

    const dragRes = useRef<number | null>(null);
    const [dragOverRes, setDragOverRes] = useState<number | null>(null);

    const openAdd = () => {
        setEditing(null); setComments([]); setNewComment("");
        const d = loadDraft("resource_add");
        if (d) { try { const p = JSON.parse(d); setTitle(p.title || ""); setLink(p.link || ""); setNasPath(p.nasPath || ""); setResDraftLoaded(true); } catch { setTitle(""); setLink(""); setNasPath(""); setResDraftLoaded(false); } }
        else { setTitle(""); setLink(""); setNasPath(""); setResDraftLoaded(false); }
        setAdding(true);
    };
    const openEdit = (r: Resource) => { setEditing(r); setAdding(false); setTitle(r.title); setLink(r.link); setNasPath(r.nasPath); setComments(r.comments || []); setNewComment(""); setResDraftLoaded(false); };
    const closeModal = () => { if (adding && (title.trim() || link.trim() || nasPath.trim())) saveDraft("resource_add", JSON.stringify({ title, link, nasPath })); setAdding(false); setEditing(null); setResDraftLoaded(false); };
    const modal = adding || editing !== null;
    const isEdit = !!editing;

    // Draft auto-save for add form
    useEffect(() => { if (adding && !editing) saveDraft("resource_add", JSON.stringify({ title, link, nasPath })); }, [title, link, nasPath, adding, editing]);

    const handleSave = () => {
        if (!title.trim()) return;
        clearDraft("resource_add");
        onSave({ id: editing?.id ?? Date.now(), title, link, nasPath, author: editing?.author || currentUser, date: editing?.date || new Date().toLocaleDateString("ko-KR"), comments, needsDiscussion: editing?.needsDiscussion });
        setResDraftLoaded(false);
        setAdding(false); setEditing(null); // close without re-saving draft
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
                            onClick={() => openEdit(r)} className={`bg-white rounded-xl p-4 cursor-grab transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${dragOverRes === idx ? "ring-2 ring-blue-300" : ""} ${r.needsDiscussion ? "border border-slate-200 border-l-[3px] border-l-red-400" : "border border-slate-200 hover:border-slate-300"}`}>
                            <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={!!r.needsDiscussion} onChange={() => onSave({ ...r, needsDiscussion: !r.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                <span className={`text-[11px] font-medium ${r.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                            </label>
                            <div className="text-[14px] font-semibold text-slate-800 mb-2 break-words">{r.title}<SavingBadge id={r.id} /></div>
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
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "자료 수정" : "자료 추가"}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {resDraftLoaded && !isEdit && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                                    <span>임시저장된 글이 있습니다</span>
                                    <button onClick={() => { setTitle(""); setLink(""); setNasPath(""); clearDraft("resource_add"); setResDraftLoaded(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                                </div>
                            )}
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
                                        onKeyDown={e => chatKeyDown(e, addComment)} />
                                    <button onClick={addComment} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] hover:bg-slate-200">전송</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={handleSave} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            {isEdit && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(editing!.id); closeModal(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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
    const [draftLoaded, setDraftLoaded] = useState(false);

    const openDetail = (idea: IdeaPost) => { setSelected(idea); setNewComment(loadDraft(`comment_ideas_${idea.id}`)); setIsEditing(false); };
    const closeDetail = () => { setSelected(null); setIsEditing(false); };
    const openAdd = () => {
        setIdeaColor(MEMO_COLORS[0]); setIdeaBorder("");
        const d = loadDraft("ideas_add");
        if (d) { try { const p = JSON.parse(d); setTitle(p.title || ""); setBody(p.content || ""); setDraftLoaded(true); } catch { setTitle(""); setBody(""); setDraftLoaded(false); } }
        else { setTitle(""); setBody(""); setDraftLoaded(false); }
        setAdding(true);
    };
    const closeAdd = () => { if (title.trim() || body.trim()) saveDraft("ideas_add", JSON.stringify({ title, content: body })); setAdding(false); setDraftLoaded(false); };
    const startEdit = () => { if (!selected) return; setTitle(selected.title); setBody(selected.body); setIdeaColor(selected.color || MEMO_COLORS[0]); setIdeaBorder(selected.borderColor || ""); setIsEditing(true); };
    const saveEdit = () => {
        if (!selected || !title.trim()) return;
        const updated = { ...selected, title: title.trim(), body: body.trim(), color: ideaColor, borderColor: ideaBorder };
        onSave(updated); setSelected(updated); setIsEditing(false);
    };

    // Draft auto-save for add form
    useEffect(() => { if (adding) saveDraft("ideas_add", JSON.stringify({ title, content: body })); }, [title, body, adding]);

    const handleCreate = () => {
        if (!title.trim()) return;
        clearDraft("ideas_add");
        onSave({ id: Date.now(), title: title.trim(), body: body.trim(), author: currentUser, date: new Date().toLocaleDateString("ko-KR"), comments: [], color: ideaColor, borderColor: ideaBorder });
        setDraftLoaded(false); setAdding(false);
    };

    // Comment draft for ideas detail
    useEffect(() => { if (selected) saveDraft(`comment_ideas_${selected.id}`, newComment); }, [newComment, selected?.id]);

    const addComment = () => {
        if (!newComment.trim() || !selected) return;
        clearDraft(`comment_ideas_${selected.id}`);
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
                        className={`rounded-xl p-4 cursor-grab transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col ${dragOverIdea === idx ? "ring-2 ring-blue-300" : ""}`}
                        style={{ background: idea.color || "#fff", border: idea.borderColor ? `2px solid ${idea.borderColor}` : "1px solid #E2E8F0", borderLeft: idea.needsDiscussion && !idea.borderColor ? "3px solid #EF4444" : undefined }}>
                        <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!idea.needsDiscussion} onChange={() => onSave({ ...idea, needsDiscussion: !idea.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                            <span className={`text-[11px] font-medium ${idea.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                        </label>
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-[14px] font-semibold text-slate-800 break-words flex-1">{idea.title}<SavingBadge id={idea.id} /></div>
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
                            {draftLoaded && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                                    <span>임시저장된 글이 있습니다</span>
                                    <button onClick={() => { setTitle(""); setBody(""); clearDraft("ideas_add"); setDraftLoaded(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                                </div>
                            )}
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
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                <div className="flex gap-2 items-center">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onCompositionStart={() => { composingRef.current = true; }}
                                        onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                                    <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] hover:bg-blue-600 font-medium">전송</button>
                                </div>
                                {newComment && hasDraft(`comment_ideas_${selected.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            {(currentUser === selected.author || currentUser === "박일웅") && (
                                <button onClick={startEdit} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                            )}
                            <div className="flex items-center gap-3">
                                {(currentUser === selected.author || currentUser === "박일웅") && (
                                    <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(selected.id); closeDetail(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={closeDetail} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
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

function AnnouncementView({ announcements, onAdd, onDelete, onUpdate, onReorder, philosophy, onAddPhilosophy, onDeletePhilosophy, onUpdatePhilosophy, onReorderPhilosophy, currentUser }: {
    announcements: Announcement[]; onAdd: (text: string, pinned?: boolean) => void; onDelete: (id: number) => void; onUpdate: (ann: Announcement) => void; onReorder: (list: Announcement[]) => void;
    philosophy: Announcement[]; onAddPhilosophy: (text: string) => void; onDeletePhilosophy: (id: number) => void; onUpdatePhilosophy: (p: Announcement) => void; onReorderPhilosophy: (list: Announcement[]) => void;
    currentUser: string;
}) {
    const COLS = [
        { key: "urgent", label: "🚨 긴급", color: "#EF4444", accent: "#FEE2E2" },
        { key: "general", label: "📌 일반", color: "#3B82F6", accent: "#DBEAFE" },
        { key: "culture", label: "🎯 문화", color: "#8B5CF6", accent: "#EDE9FE" },
    ] as const;
    type ColKey = typeof COLS[number]["key"];

    const [addingCol, setAddingCol] = useState<ColKey | null>(null);
    const [newText, setNewText] = useState("");
    const [editing, setEditing] = useState<(Announcement & { _col: ColKey }) | null>(null);
    const [editText, setEditText] = useState("");
    const [draggedItem, setDraggedItem] = useState<{ id: number; col: ColKey } | null>(null);
    const [dropCol, setDropCol] = useState<ColKey | null>(null);
    const [dropIdx, setDropIdx] = useState<number>(-1);

    const isLeader = currentUser === "박일웅" || Object.values(DEFAULT_TEAMS).some(t => t.lead === currentUser);
    const isPI = currentUser === "박일웅";

    // Draft
    useEffect(() => { const d = loadDraft("ann_board"); if (d) setNewText(d); }, []);
    useEffect(() => { if (addingCol) saveDraft("ann_board", newText); }, [newText, addingCol]);

    // Build column data
    const colData: Record<ColKey, (Announcement & { _col: ColKey })[]> = {
        urgent: announcements.filter(a => a.pinned).map(a => ({ ...a, _col: "urgent" as ColKey })),
        general: announcements.filter(a => !a.pinned).map(a => ({ ...a, _col: "general" as ColKey })),
        culture: philosophy.map(p => ({ ...p, _col: "culture" as ColKey })),
    };

    const openAdd = (col: ColKey) => { setAddingCol(col); setNewText(""); };
    const submitAdd = () => {
        if (!newText.trim() || !addingCol) return;
        if (addingCol === "urgent") onAdd(newText.trim(), true);
        else if (addingCol === "general") onAdd(newText.trim(), false);
        else onAddPhilosophy(newText.trim());
        setNewText(""); setAddingCol(null); clearDraft("ann_board");
    };
    const openEdit = (item: Announcement & { _col: ColKey }) => { setEditing(item); setEditText(item.text); };
    const saveEdit = () => {
        if (!editing || !editText.trim()) return;
        if (editing._col === "culture") onUpdatePhilosophy({ ...editing, text: editText.trim() });
        else onUpdate({ ...editing, text: editText.trim() });
        setEditing(null);
    };
    const deleteItem = (item: Announcement & { _col: ColKey }) => {
        if (item._col === "culture") onDeletePhilosophy(item.id);
        else onDelete(item.id);
    };

    const calcAnnDropIdx = (e: React.DragEvent, colEl: HTMLElement): number => {
        const cards = Array.from(colEl.querySelectorAll("[data-ann-card]"));
        for (let i = 0; i < cards.length; i++) {
            const rect = cards[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) return i;
        }
        return cards.length;
    };

    const handleDrop = (targetCol: ColKey, e: React.DragEvent) => {
        if (!draggedItem) { setDraggedItem(null); setDropCol(null); setDropIdx(-1); return; }
        const targetItems = colData[targetCol];
        const idx = dropIdx >= 0 ? dropIdx : targetItems.length;
        if (draggedItem.col === targetCol) {
            // Same-column reorder
            const oldIdx = targetItems.findIndex(it => it.id === draggedItem.id);
            if (oldIdx < 0 || oldIdx === idx || oldIdx === idx - 1) { setDraggedItem(null); setDropCol(null); setDropIdx(-1); return; }
            const arr = [...targetItems];
            const [moved] = arr.splice(oldIdx, 1);
            const insertAt = idx > oldIdx ? idx - 1 : idx;
            arr.splice(insertAt, 0, moved);
            if (targetCol === "culture") {
                onReorderPhilosophy(arr.map(({ _col, ...rest }) => rest));
            } else {
                // Rebuild full announcements: replace items of this column type while keeping the other type intact
                const otherPinned = targetCol === "urgent" ? false : true;
                const others = announcements.filter(a => a.pinned === otherPinned);
                const reordered = arr.map(({ _col, ...rest }) => rest);
                onReorder([...reordered, ...others]);
            }
        } else {
            // Cross-column move
            const srcCol = draggedItem.col;
            if (srcCol === "urgent" && targetCol === "general") {
                const ann = announcements.find(a => a.id === draggedItem.id);
                if (ann) onUpdate({ ...ann, pinned: false });
            } else if (srcCol === "general" && targetCol === "urgent") {
                const ann = announcements.find(a => a.id === draggedItem.id);
                if (ann) onUpdate({ ...ann, pinned: true });
            } else if ((srcCol === "urgent" || srcCol === "general") && targetCol === "culture") {
                const ann = announcements.find(a => a.id === draggedItem.id);
                if (ann) { onDelete(ann.id); onAddPhilosophy(ann.text); }
            } else if (srcCol === "culture" && (targetCol === "urgent" || targetCol === "general")) {
                const phil = philosophy.find(p => p.id === draggedItem.id);
                if (phil) { onDeletePhilosophy(phil.id); onAdd(phil.text, targetCol === "urgent"); }
            }
        }
        setDraggedItem(null); setDropCol(null); setDropIdx(-1);
    };

    return (
        <div>
            <h2 className="text-[17px] font-bold text-slate-800 mb-4">📢 공지사항</h2>
            <div className="flex gap-4">
                {COLS.map(col => {
                    const items = colData[col.key];
                    const colCfg = col;
                    return (
                        <div key={col.key} className="flex-1 min-w-0"
                            onDragOver={e => { e.preventDefault(); setDropCol(col.key); setDropIdx(calcAnnDropIdx(e, e.currentTarget as HTMLElement)); }}
                            onDragLeave={() => { setDropCol(null); setDropIdx(-1); }}
                            onDrop={e => handleDrop(col.key, e)}>
                            {/* Column header */}
                            <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: `2.5px solid ${colCfg.color}` }}>
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-bold" style={{ color: "#334155" }}>{colCfg.label}</span>
                                    <span className="text-[12px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: colCfg.accent, color: colCfg.color }}>{items.length}</span>
                                </div>
                                {isLeader && (
                                    <button onClick={() => openAdd(col.key)} className="w-6 h-6 flex items-center justify-center rounded-md text-[14px] hover:bg-slate-100 transition-colors" style={{ color: colCfg.color }}>+</button>
                                )}
                            </div>
                            {/* Add input */}
                            {addingCol === col.key && (
                                <div className="mb-3 rounded-xl p-3" style={{ background: "#F8F9FA", border: `1px solid ${colCfg.accent}` }}>
                                    <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="내용 작성..."
                                        className="w-full bg-transparent text-[14px] focus:outline-none resize-none" rows={2} autoFocus
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newText.trim()) { e.preventDefault(); submitAdd(); } if (e.key === "Escape") { setAddingCol(null); setNewText(""); } }} />
                                    <div className="flex justify-end gap-1.5 mt-1">
                                        <button onClick={() => { setAddingCol(null); setNewText(""); }} className="px-2.5 py-1 text-[12px] text-slate-400 hover:text-slate-600">취소</button>
                                        <button onClick={submitAdd} className="px-3 py-1 rounded-lg text-[12px] font-medium text-white" style={{ background: colCfg.color }}>게시</button>
                                    </div>
                                </div>
                            )}
                            {/* Cards */}
                            <div className={`min-h-[60px] space-y-2 rounded-lg transition-colors ${dropCol === col.key && draggedItem && draggedItem.col !== col.key ? "bg-blue-50/60" : ""}`}>
                                {items.map(item => (
                                    <div key={item.id} draggable data-ann-card
                                        onDragStart={() => setDraggedItem({ id: item.id, col: col.key })}
                                        onDragEnd={() => { setDraggedItem(null); setDropCol(null); setDropIdx(-1); }}
                                        onClick={() => { if (isPI || currentUser === item.author) openEdit(item); }}
                                        className={`group/card bg-white rounded-xl p-3.5 cursor-grab transition-all flex flex-col ${draggedItem?.id === item.id ? "opacity-40" : ""}`}
                                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: `4px solid ${colCfg.color}` }}>
                                        <div className="flex items-start justify-between">
                                            <span className="text-[14px] text-slate-800 whitespace-pre-wrap break-words line-clamp-4 flex-1" style={{ lineHeight: 1.6 }}>{item.text}<SavingBadge id={item.id} /></span>
                                        </div>
                                        <div className="mt-auto pt-2 text-[11px] text-slate-400">{item.author} · {item.date}</div>
                                    </div>
                                ))}
                                {items.length === 0 && !addingCol && (
                                    <div className="text-center py-8 text-[12px] text-slate-300">—</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Edit modal */}
            {editing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{editing._col === "culture" ? "문화" : "공지사항"} 수정</h3>
                            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4">
                            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" autoFocus />
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={saveEdit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                            </div>
                            <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { deleteItem(editing); setEditing(null); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
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
                <h3 className="text-[14px]" style={{fontWeight:650, color:"#334155"}}>비밀번호 변경</h3>
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
            <h3 className="text-[16px] font-bold text-slate-900 mb-4">수정 로그</h3>
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
                <h3 className="text-[16px] font-bold text-slate-900 mb-4">하고 싶은 말 한마디</h3>
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
                <h3 className="text-[16px] font-bold text-slate-900 mb-4">내 이모지 설정</h3>
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

const MEMO_COLORS = ["#FFFFFF", "#FEF9C3", "#FFEDD5", "#FCE7F3", "#FEE2E2", "#F3E8FF", "#DBEAFE", "#E0F2FE", "#DCFCE7", "#F1F5F9"];
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

function PersonalMemoView({ memos, onSave, onDelete, files, onAddFile, onDeleteFile, chat, onAddChat, onDeleteChat, onClearChat, onRetryChat, currentUser }: {
    memos: Memo[]; onSave: (m: Memo) => void; onDelete: (id: number) => void;
    files: LabFile[]; onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
    chat: TeamChatMsg[]; onAddChat: (msg: TeamChatMsg) => void; onDeleteChat: (id: number) => void; onClearChat: () => void; onRetryChat: (id: number) => void;
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
    const piChatContainerRef = useRef<HTMLDivElement>(null);
    const piChatDidInit = useRef(false);
    const scrollPiChat = useCallback(() => { const el = piChatContainerRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);

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

    useEffect(() => {
        if (!piChatDidInit.current && chat.length > 0) { piChatDidInit.current = true; setTimeout(scrollPiChat, 150); }
        else { requestAnimationFrame(scrollPiChat); }
    }, [chat.length, scrollPiChat]);

    return (
        <div className="grid gap-3 flex-1 min-h-0" style={{gridTemplateColumns:"1.2fr 0.8fr 1fr"}}>
            {/* Board */}
            <div className="flex flex-col min-w-0">
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
                                <div key={m.id} className={`rounded-xl p-4 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col group relative`}
                                    style={{ background: m.color || "#fff", border: m.borderColor ? `2px solid ${m.borderColor}` : m.needsDiscussion ? "1px solid #E2E8F0" : "1px solid #E2E8F0", borderLeft: m.needsDiscussion && !m.borderColor ? "3px solid #EF4444" : undefined }}
                                    onClick={() => openDetail(m)}>
                                    <button onClick={e => { e.stopPropagation(); onDelete(m.id); }}
                                        className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <label className="flex items-center gap-1.5 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={!!m.needsDiscussion} onChange={() => onSave({ ...m, needsDiscussion: !m.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                        <span className={`text-[10px] font-medium ${m.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                    </label>
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="text-[13px] font-semibold text-slate-800 break-words flex-1">{m.title}<SavingBadge id={m.id} /></div>
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
            {/* Files */}
            <div className="flex flex-col min-w-0 bg-white border border-slate-200 rounded-xl">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">📎 파일</h3>
                    <span className="text-[12px] text-slate-400">{files.length}개</span>
                </div>
                <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} />
            </div>
            {/* PI Chat */}
            <div className="flex flex-col min-w-0 bg-white border border-slate-200 rounded-xl min-h-0">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">💬 PI 채팅</h3>
                    {currentUser === "박일웅" && (
                        <button onClick={() => { if (confirm("채팅을 모두 삭제하시겠습니까?")) onClearChat(); }} className="text-[12px] text-slate-400 hover:text-red-500">초기화</button>
                    )}
                </div>
                <div ref={piChatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chat.length === 0 && <div className="text-center py-12 text-slate-400 text-[12px]">PI와 대화를 시작하세요</div>}
                    {chat.map(msg => (
                        <div key={msg.id} className={`group ${msg.author === currentUser ? "text-right" : ""}`} style={{ opacity: msg._sending ? 0.7 : 1 }}>
                            <div className={`inline-block max-w-[90%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${msg.author === currentUser ? "text-white rounded-[16px_16px_4px_16px]" : "text-slate-700 rounded-[16px_16px_16px_4px]"}`} style={{background: msg.author === currentUser ? "#3B82F6" : "#F1F5F9"}}>
                                {msg.author !== currentUser && <div className="text-[11px] font-bold mb-0.5">{MEMBERS[msg.author]?.emoji || "👤"} {msg.author}</div>}
                                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mb-1 cursor-pointer" onLoad={scrollPiChat} onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
                                {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                                <div className={`text-[10px] mt-0.5 ${msg.author === currentUser ? "text-blue-200" : "text-slate-400"}`}>
                                    {msg._sending ? <span className="animate-pulse">전송 중...</span> : msg._failed ? <span className="text-red-300">⚠️ 전송 실패 <button onClick={(e) => { e.stopPropagation(); onRetryChat(msg.id); }} className="underline hover:text-red-200 ml-0.5">재전송</button> <span className="mx-0.5">|</span> <button onClick={(e) => { e.stopPropagation(); onDeleteChat(msg.id); }} className="underline hover:text-red-200">삭제</button></span> : msg.date}
                                </div>
                            </div>
                            {msg.author === currentUser && !msg._sending && !msg._failed && (
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
                            onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                            onKeyDown={e => chatKeyDown(e, sendChat, composingRef)}
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
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                        onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
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
    const [title, setTitle] = useState(() => { if (meeting) return meeting.title; const d = loadDraft("meeting_add"); if (d) { try { return JSON.parse(d).title || ""; } catch {} } return ""; });
    const [goal, setGoal] = useState(meeting?.goal || "");
    const [summary, setSummary] = useState(() => { if (meeting) return meeting.summary || ""; const d = loadDraft("meeting_add"); if (d) { try { return JSON.parse(d).content || ""; } catch {} } return ""; });
    const [date, setDate] = useState(meeting?.date || new Date().toISOString().split("T")[0]);
    const [assignees, setAssignees] = useState<string[]>(meeting?.assignees || []);
    const [team, setTeam] = useState(meeting?.team || "");
    const [comments, setComments] = useState<Comment[]>(meeting?.comments || []);
    const [newComment, setNewComment] = useState("");
    const composingRef = useRef(false);
    const [meetingDraftLoaded] = useState(() => { if (meeting) return false; const d = loadDraft("meeting_add"); if (d) { try { const p = JSON.parse(d); return !!(p.title || p.content); } catch {} } return false; });
    const [meetingDraftVisible, setMeetingDraftVisible] = useState(meetingDraftLoaded);

    // Draft auto-save for add form
    useEffect(() => { if (!isEdit) saveDraft("meeting_add", JSON.stringify({ title, content: summary })); }, [title, summary, isEdit]);

    const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

    const handleSave = () => {
        if (!title.trim()) return;
        if (!isEdit) { clearDraft("meeting_add"); setMeetingDraftVisible(false); }
        onSave({ id: meeting?.id ?? Date.now(), title: title.trim(), goal: goal.trim(), summary: summary.trim(), date, assignees, status: "done", creator: meeting?.creator || currentUser, createdAt: meeting?.createdAt || new Date().toLocaleString("ko-KR"), comments, team, needsDiscussion: meeting?.needsDiscussion });
    };
    const addComment = () => {
        if (!newComment.trim()) return;
        setComments([...comments, { id: Date.now(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR") }]);
        setNewComment("");
    };

    const handleClose = () => { if (!isEdit && (title.trim() || summary.trim())) saveDraft("meeting_add", JSON.stringify({ title, content: summary })); onClose(); };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-[15px] font-bold text-slate-800">{isEdit ? "회의록 수정" : "회의록 작성"}</h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
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
                                onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                            <button onClick={addComment} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] hover:bg-blue-600">추가</button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button onClick={handleClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                        <button onClick={() => { handleSave(); onClose(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
                    </div>
                    {isEdit && onDelete && <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDelete(meeting!.id); onClose(); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
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

function LabChatView({ chat, currentUser, onAdd, onDelete, onClear, onRetry, files, onAddFile, onDeleteFile, board, onSaveBoard, onDeleteBoard }: {
    chat: TeamChatMsg[]; currentUser: string; onAdd: (msg: TeamChatMsg) => void; onDelete: (id: number) => void; onClear: () => void; onRetry: (id: number) => void;
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
    const labChatContainerRef = useRef<HTMLDivElement>(null);
    const labChatDidInit = useRef(false);
    const scrollLabChat = useCallback(() => { const el = labChatContainerRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);
    const composingRef = useRef(false);
    const [boardAdding, setBoardAdding] = useState(false);
    const [boardTitle, setBoardTitle] = useState("");
    const [boardContent, setBoardContent] = useState("");
    const [boardColor, setBoardColor] = useState(MEMO_COLORS[0]);
    const [selectedCard, setSelectedCard] = useState<TeamMemoCard | null>(null);
    const [boardComment, setBoardComment] = useState("");
    const [boardEditing, setBoardEditing] = useState(false);
    // Lab board comment draft
    const openBoardDetail = (card: TeamMemoCard) => { setSelectedCard(card); setBoardComment(loadDraft(`comment_labboard_${card.id}`)); };
    useEffect(() => { if (selectedCard) saveDraft(`comment_labboard_${selectedCard.id}`, boardComment); }, [boardComment, selectedCard?.id]);
    const [mobileTab, setMobileTab] = useState<"chat"|"board"|"files">("chat");

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

    useEffect(() => {
        if (!labChatDidInit.current && chat.length > 0) { labChatDidInit.current = true; setTimeout(scrollLabChat, 150); }
        else { requestAnimationFrame(scrollLabChat); }
    }, [chat.length, scrollLabChat]);

    return (
        <div className="flex flex-col md:grid md:gap-3 flex-1 min-h-0" style={{gridTemplateColumns:"1fr 1fr 2fr"}}>
            {/* Mobile tab bar */}
            <div className="md:hidden flex border-b border-slate-200 bg-white flex-shrink-0 -mt-1">
                {([["chat","💬","채팅"],["board","📌","보드"],["files","📎","파일"]] as const).map(([id,icon,label]) => (
                    <button key={id} onClick={() => setMobileTab(id as typeof mobileTab)}
                        className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors ${mobileTab === id ? "text-blue-600 border-b-2 border-blue-500" : "text-slate-400"}`}>
                        {icon} {label}
                    </button>
                ))}
            </div>
            {/* Board */}
            <div className={`flex-col min-w-0 ${mobileTab === "board" ? "flex flex-1 min-h-0" : "hidden"} md:flex`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-bold text-slate-700">📌 보드</h3>
                    <button onClick={openBoardAdd} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 추가</button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                    {board.map(card => {
                        const cmts = card.comments || [];
                        return (
                            <div key={card.id} onClick={() => openBoardDetail(card)}
                                className={`rounded-xl p-3 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col group relative`}
                                style={{ background: card.color || "#fff", border: "1px solid #E2E8F0", borderLeft: card.needsDiscussion ? "3px solid #EF4444" : undefined }}>
                                <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!card.needsDiscussion} onChange={() => onSaveBoard({ ...card, needsDiscussion: !card.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                    <span className={`text-[10px] font-medium ${card.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                </label>
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="text-[13px] font-semibold text-slate-800 break-words flex-1">{card.title}<SavingBadge id={card.id} /></h4>
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
            {/* Files */}
            <div className={`flex-col min-w-0 bg-white border border-slate-200 rounded-xl ${mobileTab === "files" ? "flex flex-1 min-h-0" : "hidden"} md:flex`}>
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">📎 파일</h3>
                    <span className="text-[12px] text-slate-400">{files.length}개</span>
                </div>
                <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} />
            </div>
            {/* Chat */}
            <div className={`flex-col min-w-0 md:bg-white md:border md:border-slate-200 md:rounded-xl ${mobileTab === "chat" ? "flex flex-1 min-h-0" : "hidden"} md:flex`}>
                <div className="hidden md:flex px-4 py-3 border-b border-slate-100 items-center justify-between">
                    <h3 className="text-[15px] font-bold text-slate-700">💬 연구실 채팅</h3>
                    {currentUser === "박일웅" && (
                        <button onClick={() => { if (confirm("채팅을 모두 삭제하시겠습니까?")) onClear(); }} className="text-[12px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                    )}
                </div>
                <div ref={labChatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chat.length === 0 && <div className="text-center py-16 text-slate-400 text-[14px]">메시지가 없습니다. 자유롭게 대화해 보세요!</div>}
                    {chat.map(msg => (
                        <div key={msg.id} className={`group ${msg.author === currentUser ? "text-right" : ""}`} style={{ opacity: msg._sending ? 0.7 : 1 }}>
                            <div className={`inline-block max-w-[75%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${msg.author === currentUser ? "text-white rounded-[16px_16px_4px_16px]" : "text-slate-700 rounded-[16px_16px_16px_4px]"}`} style={{background: msg.author === currentUser ? "#3B82F6" : "#F1F5F9"}}>
                                {msg.author !== currentUser && <div className="text-[12px] font-bold mb-0.5">{MEMBERS[msg.author]?.emoji || "👤"} {msg.author}</div>}
                                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full max-h-[300px] rounded-md mb-1.5 cursor-pointer" onLoad={scrollLabChat} onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
                                {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                                <div className={`text-[11px] mt-1 ${msg.author === currentUser ? "text-blue-200" : "text-slate-400"}`}>
                                    {msg._sending ? <span className="animate-pulse">전송 중...</span> : msg._failed ? <span className="text-red-300">⚠️ 전송 실패 <button onClick={(e) => { e.stopPropagation(); onRetry(msg.id); }} className="underline hover:text-red-200 ml-0.5">재전송</button> <span className="mx-0.5">|</span> <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className="underline hover:text-red-200">삭제</button></span> : msg.date}
                                </div>
                            </div>
                            {msg.author === currentUser && !msg._sending && !msg._failed && (
                                <button onClick={() => onDelete(msg.id)} className="text-[11px] text-slate-300 hover:text-red-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">삭제</button>
                            )}
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>
                <div className="p-3 border-t border-slate-100 flex-shrink-0 bg-white">
                    {chatImg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[100px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-2 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        <button onClick={() => chatFileRef.current?.click()} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[18px]" title="사진 첨부">{imgUploading ? "⏳" : "📷"}</button>
                        <textarea value={text} onChange={e => setText(e.target.value)} onPaste={handlePaste}
                            onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                            onKeyDown={e => chatKeyDown(e, send, composingRef)}
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
            {selectedCard && !boardEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSelectedCard(null); setBoardComment(""); }}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                <div className="flex gap-2 items-center">
                                    <input value={boardComment} onChange={e => setBoardComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onKeyDown={e => chatKeyDown(e, () => { if (!boardComment.trim()) return; clearDraft(`comment_labboard_${selectedCard.id}`); const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: Date.now(), author: currentUser, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); })} />
                                    <button onClick={() => { if (!boardComment.trim()) return; clearDraft(`comment_labboard_${selectedCard.id}`); const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: Date.now(), author: currentUser, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR") }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] hover:bg-blue-600 font-medium">전송</button>
                                </div>
                                {boardComment && hasDraft(`comment_labboard_${selectedCard.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            {(currentUser === selectedCard.author || currentUser === "박일웅") && (
                                <button onClick={() => { setBoardTitle(selectedCard.title); setBoardContent(selectedCard.content); setBoardColor(selectedCard.color); setBoardEditing(true); }} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                            )}
                            <div className="flex items-center gap-3">
                                {(currentUser === selectedCard.author || currentUser === "박일웅") && (
                                    <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDeleteBoard(selectedCard.id); setSelectedCard(null); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={() => { setSelectedCard(null); setBoardComment(""); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Board edit modal */}
            {selectedCard && boardEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setBoardEditing(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">글 수정</h3>
                            <button onClick={() => setBoardEditing(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                                <input value={boardTitle} onChange={e => setBoardTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <textarea value={boardContent} onChange={e => setBoardContent(e.target.value)} rows={5}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                            </div>
                            <ColorPicker color={boardColor} onColor={setBoardColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => setBoardEditing(false)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={() => { const updated = { ...selectedCard, title: boardTitle.trim() || "제목 없음", content: boardContent, color: boardColor, updatedAt: new Date().toISOString().split("T")[0] }; onSaveBoard(updated); setSelectedCard(updated); setBoardEditing(false); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">저장</button>
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
                    <span className="text-[14px] truncate flex-1 pr-4" style={{fontWeight:650, color:"#334155"}}>{file.name}</span>
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
                {sorted.length === 0 && <div className={`text-center ${compact ? "py-6" : "py-12"}`}><div className="text-3xl mb-2">📁</div><div className="text-[13px]" style={{color:"#94A3B8"}}>파일을 업로드하세요 (10MB 이하)</div></div>}
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

function TeamMemoView({ teamName, kanban, chat, files, currentUser, onSaveCard, onDeleteCard, onReorderCards, onAddChat, onUpdateChat, onDeleteChat, onClearChat, onRetryChat, onAddFile, onDeleteFile }: {
    teamName: string; kanban: TeamMemoCard[]; chat: TeamChatMsg[]; files: LabFile[]; currentUser: string;
    onSaveCard: (card: TeamMemoCard) => void; onDeleteCard: (id: number) => void; onReorderCards: (cards: TeamMemoCard[]) => void;
    onAddChat: (msg: TeamChatMsg) => void; onUpdateChat: (msg: TeamChatMsg) => void; onDeleteChat: (id: number) => void; onClearChat: () => void; onRetryChat: (id: number) => void;
    onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<TeamMemoCard | null>(null);
    const [selected, setSelected] = useState<TeamMemoCard | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [cardDraftLoaded, setCardDraftLoaded] = useState(false);
    const cardDraftKey = `team_${teamName}_card`;
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
    const teamChatContainerRef = useRef<HTMLDivElement>(null);
    const teamChatDidInit = useRef(false);
    const scrollTeamChat = useCallback(() => { const el = teamChatContainerRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);
    const composingRef = useRef(false);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [mobileTab, setMobileTab] = useState<"chat"|"board"|"files">("chat");
    const [replyTo, setReplyTo] = useState<TeamChatMsg | null>(null);
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<number | null>(null);

    // Draft: auto-save card form
    useEffect(() => {
        if (showForm && !editing) {
            const val = JSON.stringify({ title, content });
            if (title.trim() || content.trim()) saveDraft(cardDraftKey, val);
            else clearDraft(cardDraftKey);
        }
    }, [title, content, showForm, editing, cardDraftKey]);

    const openNew = (c = "left") => {
        setEditing(null); setCol(c); setColor(TEAM_MEMO_COLORS[0]); setBorderClr("");
        const d = loadDraft(cardDraftKey);
        if (d) { try { const p = JSON.parse(d); setTitle(p.title || ""); setContent(p.content || ""); setCardDraftLoaded(true); } catch { setTitle(""); setContent(""); } }
        else { setTitle(""); setContent(""); setCardDraftLoaded(false); }
        setShowForm(true);
    };
    const teamMemoDraftKey = (id: number) => `comment_teammemo_${teamName}_${id}`;
    const openDetail = (c: TeamMemoCard) => { setSelected(c); setIsEditing(false); setNewComment(loadDraft(teamMemoDraftKey(c.id))); };
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
        setShowForm(false); clearDraft(cardDraftKey); setCardDraftLoaded(false);
    };
    // Team memo comment draft
    useEffect(() => { if (selected && !isEditing) saveDraft(teamMemoDraftKey(selected.id), newComment); }, [newComment, selected?.id, isEditing]);

    const addComment = () => {
        if (!newComment.trim() || !selected) return;
        clearDraft(teamMemoDraftKey(selected.id));
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
        onAddChat({ id: Date.now(), author: currentUser, text: chatText.trim(), date: new Date().toLocaleString("ko-KR"), imageUrl: chatImg || undefined, replyTo: replyTo ? { id: replyTo.id, author: replyTo.author, text: replyTo.text } : undefined });
        setChatText(""); setChatImg(""); setReplyTo(null);
    };
    const toggleReaction = (msgId: number, emoji: string) => {
        const msg = chat.find(m => m.id === msgId);
        if (!msg) return;
        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] || [];
        if (users.includes(currentUser)) {
            reactions[emoji] = users.filter(u => u !== currentUser);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji] = [...users, currentUser];
        }
        onUpdateChat({ ...msg, reactions });
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

    useEffect(() => {
        if (!teamChatDidInit.current && chat.length > 0) { teamChatDidInit.current = true; setTimeout(scrollTeamChat, 150); }
        else { requestAnimationFrame(scrollTeamChat); }
    }, [chat.length, scrollTeamChat]);

    return (
        <div className="flex flex-col md:grid md:gap-3 flex-1 min-h-0" style={{gridTemplateColumns:"1fr 1fr 2fr"}}>
            {/* Mobile tab bar */}
            <div className="md:hidden flex border-b border-slate-200 bg-white flex-shrink-0 -mt-1">
                {([["chat","💬","채팅"],["board","📌","보드"],["files","📎","파일"]] as const).map(([id,icon,label]) => (
                    <button key={id} onClick={() => setMobileTab(id as typeof mobileTab)}
                        className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors ${mobileTab === id ? "text-blue-600 border-b-2 border-blue-500" : "text-slate-400"}`}>
                        {icon} {label}
                    </button>
                ))}
            </div>
            {/* Board */}
            <div className={`flex-col min-w-0 ${mobileTab === "board" ? "flex flex-1 min-h-0" : "hidden"} md:flex`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-bold text-slate-700">📌 보드</h3>
                    <button onClick={() => openNew()} className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 추가</button>
                </div>
                {showForm && (
                    <div className="bg-white border border-blue-200 rounded-lg p-2.5 mb-2 space-y-1.5 flex-shrink-0">
                        {cardDraftLoaded && (title.trim() || content.trim()) && (
                            <div className="flex items-center justify-between px-1 text-[11px]">
                                <span className="text-amber-600">임시저장된 글이 있습니다</span>
                                <button onClick={() => { setTitle(""); setContent(""); clearDraft(cardDraftKey); setCardDraftLoaded(false); }} className="text-amber-500 hover:text-amber-700 font-medium">삭제</button>
                            </div>
                        )}
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
                                    className={`rounded-xl p-3 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col group relative ${draggedId === card.id ? "opacity-40" : ""}`}
                                    style={{ background: card.color || "#fff", border: card.borderColor ? `2px solid ${card.borderColor}` : "1px solid #E2E8F0", borderLeft: card.needsDiscussion && !card.borderColor ? "3px solid #EF4444" : undefined }}>
                                    <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={!!card.needsDiscussion} onChange={() => onSaveCard({ ...card, needsDiscussion: !card.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                        <span className={`text-[10px] font-medium ${card.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                    </label>
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="text-[13px] font-semibold text-slate-800 break-words flex-1">{card.title}<SavingBadge id={card.id} /></h4>
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

            {/* Files */}
            <div className={`flex-col min-w-0 bg-white border border-slate-200 rounded-xl ${mobileTab === "files" ? "flex flex-1 min-h-0" : "hidden"} md:flex`}>
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-slate-700">📎 파일</h4>
                    <span className="text-[12px] text-slate-400">{files.length}개</span>
                </div>
                <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} compact />
            </div>
            {/* Chat */}
            <div className={`flex-col min-w-0 md:border md:border-slate-200 md:rounded-xl min-h-0 ${mobileTab === "chat" ? "flex flex-1" : "hidden"} md:flex`} style={{ background: "#FFFFFF" }}>
                <div className="hidden md:flex px-3 py-2.5 border-b border-slate-100 items-center justify-between">
                    <h4 className="text-[14px] font-bold text-slate-700">💬 채팅</h4>
                    {currentUser === "박일웅" && (
                        <button onClick={() => { if (confirm("채팅을 모두 삭제하시겠습니까?")) onClearChat(); }} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                    )}
                </div>
                <div ref={teamChatContainerRef} className="flex-1 overflow-y-auto px-3 py-2">
                    {chat.length === 0 && <div className="text-center py-6 text-slate-400 text-[12px]">메시지가 없습니다</div>}
                    {chat.map((msg, idx) => {
                        const prev = idx > 0 ? chat[idx - 1] : null;
                        const isMe = msg.author === currentUser;
                        const sameAuthor = prev && prev.author === msg.author;
                        const prevDate = prev ? prev.date.split(/오[전후]/)[0].trim() : "";
                        const currDate = msg.date.split(/오[전후]/)[0].trim();
                        const showDateSep = !prev || prevDate !== currDate;
                        const showAvatar = !isMe && (!sameAuthor || showDateSep);
                        const tm = msg.date.match(/(오[전후])\s*(\d+:\d+)/);
                        const timeStr = tm ? `${tm[1]} ${tm[2]}` : "";
                        const reactions = msg.reactions || {};
                        return (
                            <div key={msg.id}>
                                {showDateSep && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <span className="text-[12px] text-slate-400 whitespace-nowrap">{currDate}</span>
                                        <div className="flex-1 h-px bg-slate-200" />
                                    </div>
                                )}
                                <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameAuthor && !showDateSep ? "mt-1" : "mt-3"} group/msg relative`} style={{ opacity: msg._sending ? 0.7 : 1 }}>
                                    {!isMe && (
                                        <div className="w-9 flex-shrink-0 mr-2 self-start">
                                            {showAvatar ? (
                                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[14px] font-semibold text-slate-600">
                                                    {MEMBERS[msg.author]?.emoji || msg.author[0]}
                                                </div>
                                            ) : <div className="w-9" />}
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        {!isMe && showAvatar && (
                                            <div className="flex items-baseline gap-2 mb-0.5 px-1">
                                                <span className="text-[13px] font-bold text-slate-800">{msg.author}</span>
                                                <span className="text-[11px] text-slate-400">{timeStr}</span>
                                            </div>
                                        )}
                                        {msg.replyTo && (
                                            <div className="text-[11px] text-slate-400 mb-0.5 px-3 py-1.5 bg-slate-100 rounded-lg border-l-2 border-slate-300 max-w-full truncate">
                                                <span className="font-semibold text-slate-500">{msg.replyTo.author}</span>: {msg.replyTo.text || "📷 이미지"}
                                            </div>
                                        )}
                                        <div className={`flex items-start gap-0.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                            {/* Message bubble + overlapping reactions */}
                                            <div className="relative" style={{ marginBottom: (!msg._sending && !msg._failed && Object.keys(reactions).length > 0) ? 14 : 0 }}>
                                                <div className="px-4 py-3 text-[13.5px] leading-relaxed text-slate-700" style={{ background: isMe ? "#DCF0FF" : "#F8F9FA", borderRadius: isMe ? "12px 4px 12px 12px" : "4px 12px 12px 12px" }}>
                                                    {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full max-h-[250px] rounded-md mb-1.5 cursor-pointer" onLoad={scrollTeamChat} onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
                                                    {msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>}
                                                </div>
                                                {/* Reaction badges overlapping bubble bottom */}
                                                {!msg._sending && !msg._failed && Object.keys(reactions).length > 0 && (
                                                    <div className={`absolute -bottom-3 ${isMe ? "right-1" : "left-1"} flex flex-wrap gap-0.5`}>
                                                        {Object.entries(reactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
                                                            <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                                                                className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[11px] border shadow-sm transition-colors ${users.includes(currentUser) ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                                                {emoji}{users.length}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Action buttons beside bubble — hover only */}
                                            {!msg._sending && !msg._failed && (
                                                <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-px flex-shrink-0 self-start mt-1">
                                                    <button onClick={() => setReplyTo(msg)} className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-500 text-[13px] flex items-center justify-center" title="답장">↩</button>
                                                    <div className="relative">
                                                        <button onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)} className="w-6 h-6 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-500 text-[13px] flex items-center justify-center" title="리액션">😊</button>
                                                        {emojiPickerMsgId === msg.id && (
                                                            <div className={`absolute bottom-full ${isMe ? "right-0" : "left-0"} mb-1 bg-white rounded-xl shadow-lg border border-slate-200 px-2 py-1.5 flex gap-1 z-10`}>
                                                                {["👍", "❤️", "😂", "😮", "😢", "🔥"].map(em => (
                                                                    <button key={em} onClick={() => { toggleReaction(msg.id, em); setEmojiPickerMsgId(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-[16px] transition-colors">{em}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isMe && <button onClick={() => onDeleteChat(msg.id)} className="w-6 h-6 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-400 text-[10px] flex items-center justify-center" title="삭제">삭제</button>}
                                                </div>
                                            )}
                                        </div>
                                        {isMe && (
                                            <div className="text-[11px] text-slate-400 mt-0.5 px-1">
                                                {msg._sending ? <span className="animate-pulse">전송 중...</span> : msg._failed ? <span className="text-red-500">⚠️ 전송 실패 <button onClick={() => onRetryChat(msg.id)} className="underline hover:text-red-600 ml-0.5">재전송</button> <span className="mx-0.5">|</span> <button onClick={() => onDeleteChat(msg.id)} className="underline hover:text-red-600">삭제</button></span> : timeStr}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>
                {replyTo && (
                    <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                        <div className="flex-1 min-w-0 text-[12px] text-slate-500 truncate">
                            <span className="font-semibold text-slate-600">{replyTo.author}</span>에게 답장: {replyTo.text || "📷 이미지"}
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 text-[14px] flex-shrink-0">✕</button>
                    </div>
                )}
                <div className={`p-2.5 ${replyTo ? "" : "border-t border-slate-100"} flex-shrink-0 bg-white`}>
                    {chatImg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[80px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-1.5 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        <button onClick={() => chatFileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[16px]" title="사진 첨부">{imgUploading ? "⏳" : "📷"}</button>
                        <textarea value={chatText} onChange={e => setChatText(e.target.value)} onPaste={handlePaste}
                            onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                            onKeyDown={e => chatKeyDown(e, sendChat, composingRef)}
                            placeholder="메시지 입력..." rows={1}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        <button onClick={sendChat} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 flex-shrink-0">전송</button>
                    </div>
                </div>
            </div>

            {/* Detail modal */}
            {selected && !isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
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
                                <div className="flex gap-2 items-center">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성..."
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                                    <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] hover:bg-blue-600 font-medium flex-shrink-0">전송</button>
                                </div>
                                {newComment && hasDraft(teamMemoDraftKey(selected.id)) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <button onClick={startEdit} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) { onDeleteCard(selected.id); setSelected(null); } }} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                <button onClick={() => setSelected(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
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
    const focusStyle = "w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none transition-all min-h-[48px]";
    const handleFocus = (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; };
    const handleBlur = (e: React.FocusEvent<HTMLElement>) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; };
    return (
        <div className="min-h-screen flex items-center justify-center px-5" style={{background:"radial-gradient(ellipse at top, #1E293B, #0F172A)"}}>
            <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm" style={{boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>M</div>
                    <h1 className="text-xl font-bold text-slate-800">MFTEL Dashboard</h1>
                    <p className="text-[13px] text-slate-400 mt-1">Team members only</p>
                </div>
                <div className="space-y-3">
                    <div><label className="text-[13px] font-medium text-slate-600 block mb-1">이름</label><select value={name} onChange={e => { setName(e.target.value); setErr(""); }} className={`${focusStyle} bg-white`} onFocus={handleFocus} onBlur={handleBlur}><option value="">이름 선택...</option>{Object.keys(members).map(n => <option key={n} value={n}>{members[n]?.emoji || "👤"} {n}</option>)}<option value="__custom">직접 입력</option></select></div>
                    {name === "__custom" && <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="이름 입력" className={focusStyle} onFocus={handleFocus} onBlur={handleBlur} />}
                    <div><label className="text-[13px] font-medium text-slate-600 block mb-1">비밀번호</label><input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(""); }} placeholder="비밀번호 입력" className={focusStyle} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={e => e.key === "Enter" && !loading && submit()} /></div>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-3.5 h-3.5 accent-blue-500" /><span className="text-[13px] text-slate-500">자동 로그인</span></label>
                    {err && <p className="text-[13px] text-red-500">{err}</p>}
                    <button onClick={submit} disabled={loading} className="w-full py-3 min-h-[48px] rounded-lg text-[14px] font-semibold text-white disabled:opacity-60 transition-all hover:brightness-110" style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}>{loading ? "로그인 중..." : "입장"}</button>
                    <p className="text-[11px] text-center" style={{color:"#CBD5E1"}}>초기 비밀번호: 0000</p>
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
                <div key={item.label} className="flex items-center gap-2.5">
                    <span className="text-[12px] w-[52px] text-right truncate" style={{color:"#94A3B8"}}>{item.label}</span>
                    <div className="flex-1 rounded-[3px] h-[6px] overflow-hidden" style={{background:"#F1F5F9"}}>
                        <div className="h-full rounded-[3px]" style={{ width: maxVal > 0 ? `${Math.max(4, (item.count / maxVal) * 100)}%` : "0%", background: item.color, opacity: item.count > 0 ? 1 : 0.2, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                    </div>
                    <span className="w-[16px] text-[12px]" style={{fontWeight: 600, color: item.count > 0 ? "#334155" : "#CBD5E1"}}>{item.count}</span>
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

    // Urgent & general announcements for overview
    const urgentAnn = announcements.filter(a => a.pinned).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12);
    const generalAnn = announcements.filter(a => !a.pinned).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12);

    // My items (always filtered to currentUser)
    const myPapers = papers.filter(p => p.assignees.includes(currentUser));
    const myTodos = todos.filter(t => !t.done && t.assignees.includes(currentUser));
    const myExperiments = experiments.filter(e => e.assignees.includes(currentUser));
    const myReports = reports.filter(r => r.assignees.includes(currentUser));
    const myAnalyses = analyses.filter(a => a.assignees.includes(currentUser));

    // Personal: today's target for current user
    const myTarget = todayTargets.find(t => t.name === currentUser);

    const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const dateLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${dayNames[today.getDay()]}`;

    return (
        <div className="space-y-5">
            {/* Team mode: page title + date + online users */}
            {!isPersonal && (
                <div>
                    <div className="text-[12px] mb-1" style={{color:"#94A3B8", fontWeight:500}}>대시보드</div>
                    <h2 className="text-[26px] font-extrabold tracking-tight" style={{color:"#0F172A", letterSpacing:"-0.03em"}}>연구실 현황</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[13.5px]" style={{color:"#94A3B8"}}>{dateLabel}</span>
                        <span className="text-[13px] flex items-center gap-1.5" style={{color:"#94A3B8"}}>
                            · 접속 중 <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                            <span style={{color:"#10B981", fontWeight:600}}>{onlineUsers.length}명</span>
                        </span>
                        {onlineUsers.length > 0 && (
                            <div className="flex items-center gap-1.5 ml-1">
                                {onlineUsers.map(u => (
                                    <span key={u.name} className="text-[12px] font-medium" style={{color:"#64748B"}} title={u.name}>{MEMBERS[u.name]?.emoji || "👤"} {u.name}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Personal mode header */}
            {isPersonal && (
                <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[20px]" style={{background:"#F1F5F9", border:"2px solid #E2E8F0"}}>{members[currentUser]?.emoji || "👤"}</div>
                        <div>
                            <h2 className="text-[18px] font-bold text-slate-800 leading-tight">{currentUser}</h2>
                            <div className="text-[12px] text-slate-400">{members[currentUser]?.team} {members[currentUser]?.role && `· ${members[currentUser]?.role}`}</div>
                        </div>
                        {myTarget && (
                            <div className="text-[13px] text-slate-500 max-w-[320px] truncate ml-3 px-3 py-1 rounded-lg" style={{background:"#F8FAFC"}}>📌 {myTarget.text}</div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {!myTarget && (
                            <button onClick={() => onNavigate("daily")} className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors" style={{background:"#EFF6FF", color:"#3B82F6", border:"1px solid #DBEAFE"}} onMouseEnter={e => (e.currentTarget.style.background = "#DBEAFE")} onMouseLeave={e => (e.currentTarget.style.background = "#EFF6FF")}>🎯 오늘 목표 작성하기</button>
                        )}
                        {!statusMessages[currentUser] && (
                            <button onClick={() => onNavigate("settings")} className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors" style={{background:"#F0FDF4", color:"#16A34A", border:"1px solid #DCFCE7"}} onMouseEnter={e => (e.currentTarget.style.background = "#DCFCE7")} onMouseLeave={e => (e.currentTarget.style.background = "#F0FDF4")}>💬 한마디 작성하기</button>
                        )}
                    </div>
                </div>
            )}

            {/* Row 1: 연구 파이프라인 5개 한 줄 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                <h3 className="text-[16px] font-bold text-slate-900 mb-4">{isPersonal ? "내 연구 파이프라인" : "연구 파이프라인"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    <button onClick={() => onNavigate("papers")} className="text-left hover:bg-slate-50 rounded-lg p-3 -m-3 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.paper}} />논문 <span className="font-bold" style={{color:"#334155"}}>({fp.length})</span>
                        </div>
                        <MiniBar items={papersByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...papersByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("reports")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.report}} />계획서/보고서 <span className="font-bold" style={{color:"#334155"}}>({fr.length})</span>
                        </div>
                        <MiniBar items={reportsByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...reportsByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("experiments")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.experiment}} />실험 <span className="font-bold" style={{color:"#334155"}}>({fe.length})</span>
                        </div>
                        <MiniBar items={expByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...expByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("analysis")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.analysis}} />해석 <span className="font-bold" style={{color:"#334155"}}>({fa.length})</span>
                        </div>
                        <MiniBar items={analysisByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...analysisByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("ip")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.ip}} />지식재산권 <span className="font-bold" style={{color:"#334155"}}>({fip.length})</span>
                        </div>
                        <MiniBar items={patentsByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...patentsByStatus.map(s => s.count))} />
                    </button>
                </div>
            </div>

            {/* Row 2: 오늘 목표 현황 (full width) / 내 To-do (personal) */}
            {isPersonal ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <button onClick={() => onNavigate("todos")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                            내 To-do
                            {myTodos.length > 0 && <span className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-[12px] font-bold">{myTodos.length}</span>}
                        </h3>
                    </button>
                    {myTodos.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">할 일 없음</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {myTodos.map(t => (
                                <div key={t.id} className="flex items-start gap-1.5 text-[12px] text-slate-600 p-2.5 rounded-lg hover:bg-slate-50" style={{background:"#F8FAFC"}}>
                                    <span className="shrink-0">{PRIORITY_ICON[t.priority]}</span>
                                    <span className="leading-relaxed">{t.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <button onClick={() => onNavigate("daily")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                            오늘 목표 현황
                            <span className="text-[12px] font-medium text-slate-400">{targetsWritten}/{MEMBER_NAMES.length}</span>
                        </h3>
                    </button>
                    <div className="mb-4">
                        <div className="w-full rounded-[3px] h-[6px]" style={{background:"#F1F5F9"}}>
                            <div className="h-[6px] rounded-[3px]" style={{ width: `${MEMBER_NAMES.length > 0 ? (targetsWritten / MEMBER_NAMES.length) * 100 : 0}%`, background: "linear-gradient(90deg, #3B82F6, #22C55E)", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                        </div>
                    </div>
                    {targetsMissing.length > 0 && (
                        <div className="mb-4">
                            <div className="text-[12px] text-slate-400 mb-1.5">미작성:</div>
                            <div className="flex flex-wrap gap-1.5">
                                {targetsMissing.map(name => (
                                    <span key={name} className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">{MEMBERS[name]?.emoji} {name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {targetsMissing.length === 0 && (
                        <div className="text-[13px] text-emerald-500 font-medium mb-4">전원 작성 완료</div>
                    )}
                    {todayTargets.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {todayTargets.map(t => (
                                <div key={t.name} className="flex items-start gap-2.5 p-3 rounded-xl" style={{background:"#F8FAFC"}}>
                                    <span className="text-[15px] shrink-0">{MEMBERS[t.name]?.emoji}</span>
                                    <div className="min-w-0">
                                        <div className="text-[12px] font-semibold text-slate-700">{t.name}</div>
                                        <div className="text-[12px] text-slate-500 leading-relaxed mt-0.5">{t.text}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Row 3: 긴급 공지 | 일반 공지 | 논의 필요 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                {/* 긴급 공지 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <button onClick={() => onNavigate("announcements")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                            🚨 긴급 공지
                            {urgentAnn.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 text-[11px] font-semibold">{urgentAnn.length}</span>}
                        </h3>
                    </button>
                    {urgentAnn.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">긴급 공지 없음</div>
                    ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                            {urgentAnn.map(ann => (
                                <div key={ann.id} className="p-3 rounded-xl cursor-pointer transition-colors" style={{background:"#FEF2F2", borderLeft:"3px solid #EF4444"}} onMouseEnter={e => (e.currentTarget.style.background = "#FEE2E2")} onMouseLeave={e => (e.currentTarget.style.background = "#FEF2F2")}>
                                    <div className="text-[13px] leading-relaxed" style={{color:"#334155", fontWeight:500}}>{ann.text.length > 50 ? ann.text.slice(0, 50) + "..." : ann.text}</div>
                                    <div className="text-[11px] mt-1" style={{color:"#94A3B8"}}>{members[ann.author]?.emoji} {ann.author} · {ann.date}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 일반 공지 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <button onClick={() => onNavigate("announcements")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                            📌 일반 공지
                            {generalAnn.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[11px] font-semibold">{generalAnn.length}</span>}
                        </h3>
                    </button>
                    {generalAnn.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">일반 공지 없음</div>
                    ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                            {generalAnn.map(ann => (
                                <div key={ann.id} className="p-3 rounded-xl cursor-pointer transition-colors" style={{background:"#EFF6FF", borderLeft:"3px solid #3B82F6"}} onMouseEnter={e => (e.currentTarget.style.background = "#DBEAFE")} onMouseLeave={e => (e.currentTarget.style.background = "#EFF6FF")}>
                                    <div className="text-[13px] leading-relaxed" style={{color:"#334155", fontWeight:500}}>{ann.text.length > 50 ? ann.text.slice(0, 50) + "..." : ann.text}</div>
                                    <div className="text-[11px] mt-1" style={{color:"#94A3B8"}}>{members[ann.author]?.emoji} {ann.author} · {ann.date}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 논의 필요 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                        {isPersonal ? "내 논의 필요" : "논의 필요"}
                        {discussionItems.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-500 text-[11px] font-semibold">{discussionItems.length}</span>}
                    </h3>
                    {discussionItems.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">논의 필요 항목 없음</div>
                    ) : (
                        <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                            {discussionItems.slice(0, 10).map((item, i) => (
                                <button key={i} onClick={() => onNavigate(item.tab)} className="w-full flex items-start gap-2.5 p-3 rounded-xl text-left transition-all group" style={{background:"#FEF2F2", borderLeft:"3px solid #EF4444"}}>
                                    <span className="text-[13px] mt-0.5">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13.5px] text-slate-800 leading-snug truncate group-hover:text-red-600 transition-colors" style={{fontWeight:600}}>{item.title}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{item.section}</div>
                                    </div>
                                </button>
                            ))}
                            {discussionItems.length > 10 && <div className="text-[12px] text-slate-400 text-center py-1">+{discussionItems.length - 10}개 더</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Row 3: 멤버별 현황 (team) / 내 현황 (personal) */}
            {isPersonal ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-4">내 전체 현황</h3>
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-4">멤버별 현황</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr style={{borderBottom:"1px solid #F1F5F9"}}>
                                    <th className="text-left py-2 px-3" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", width:300, minWidth:300}}>멤버</th>
                                    <th className="text-center py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>논문</th>
                                    <th className="text-center py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>계획/보고</th>
                                    <th className="text-center py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>실험</th>
                                    <th className="text-center py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>해석</th>
                                    <th className="text-center py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>To-do</th>
                                    <th className="text-center py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>목표</th>
                                    <th className="text-center py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>접속</th>
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
                                        <tr key={name} className={`${isMe ? "bg-blue-50/30" : "hover:bg-[#F8FAFC]"} transition-colors`} style={{borderBottom:"1px solid #F8FAFC"}}>
                                            <td className="py-2.5 px-3" style={{fontWeight:500, color:"#334155"}}>
                                                <div className="flex items-center gap-1">
                                                    <span className="whitespace-nowrap">{members[name]?.emoji} {name}</span>
                                                    {isTeamLead && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{fontWeight:700, color:"#3B82F6", background:"#EFF6FF"}}>팀장</span>}
                                                    {statusMessages[name] && <span className="text-[11px] text-blue-500/80 italic truncate max-w-[200px] ml-1.5 border-l border-slate-200 pl-1.5">&ldquo;{statusMessages[name]}&rdquo;</span>}
                                                </div>
                                            </td>
                                            <td className="text-center py-2.5 px-2"><span style={{fontWeight: memberPapers > 0 ? 650 : 400, color: memberPapers > 0 ? "#334155" : "#CBD5E1"}}>{memberPapers || "-"}</span></td>
                                            <td className="text-center py-2.5 px-2"><span style={{fontWeight: memberReports > 0 ? 650 : 400, color: memberReports > 0 ? "#334155" : "#CBD5E1"}}>{memberReports || "-"}</span></td>
                                            <td className="text-center py-2.5 px-2"><span style={{fontWeight: memberExp > 0 ? 650 : 400, color: memberExp > 0 ? "#334155" : "#CBD5E1"}}>{memberExp || "-"}</span></td>
                                            <td className="text-center py-2.5 px-2"><span style={{fontWeight: memberAnalysis > 0 ? 650 : 400, color: memberAnalysis > 0 ? "#334155" : "#CBD5E1"}}>{memberAnalysis || "-"}</span></td>
                                            <td className="text-center py-2.5 px-2"><span style={{fontWeight: memberTodos > 0 ? 650 : 400, color: memberTodos > 0 ? "#334155" : "#CBD5E1"}}>{memberTodos || "-"}</span></td>
                                            <td className="text-center py-2.5 px-2">{hasTarget ? <span className="text-emerald-500 font-bold">O</span> : <span className="text-red-400">X</span>}</td>
                                            <td className="text-center py-2.5 px-2">{isOnline ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-200" />}</td>
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[16px] font-bold text-slate-900">팀별 연구 현황</h3>
                            <div className="flex items-center gap-3">
                                {[{label:"논문",color:CATEGORY_COLORS.paper},{label:"계획/보고",color:CATEGORY_COLORS.report},{label:"실험",color:CATEGORY_COLORS.experiment},{label:"해석",color:CATEGORY_COLORS.analysis},{label:"지식재산권",color:CATEGORY_COLORS.ip}].map(c => (
                                    <span key={c.label} className="flex items-center gap-1 text-[11px]" style={{color:"#94A3B8"}}><span className="w-2 h-2 rounded-sm" style={{background:c.color}} />{c.label}</span>
                                ))}
                            </div>
                        </div>
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
                                <div className="space-y-2">
                                    {teamStats.filter(t => t.total > 0).map(team => (
                                        <div key={team.name}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[13px]" style={{fontWeight:600, color:"#334155"}}>{team.name}</span>
                                                <span className="text-[11px]" style={{color:"#94A3B8"}}>{team.total}건</span>
                                            </div>
                                            <div className="flex gap-[2px] h-[8px] rounded-sm overflow-hidden" style={{background:"#F1F5F9"}}>
                                                {team.tPapers > 0 && <div className="rounded-sm" style={{ width: `${(team.tPapers / maxTotal) * 100}%`, background: CATEGORY_COLORS.paper }} />}
                                                {team.tReports > 0 && <div className="rounded-sm" style={{ width: `${(team.tReports / maxTotal) * 100}%`, background: CATEGORY_COLORS.report }} />}
                                                {team.tExp > 0 && <div className="rounded-sm" style={{ width: `${(team.tExp / maxTotal) * 100}%`, background: CATEGORY_COLORS.experiment }} />}
                                                {team.tAnalysis > 0 && <div className="rounded-sm" style={{ width: `${(team.tAnalysis / maxTotal) * 100}%`, background: CATEGORY_COLORS.analysis }} />}
                                                {team.tPatents > 0 && <div className="rounded-sm" style={{ width: `${(team.tPatents / maxTotal) * 100}%`, background: CATEGORY_COLORS.ip }} />}
                                            </div>
                                            <div className="flex gap-2.5 mt-1 flex-wrap">
                                                {team.tPapers > 0 && <span className="text-[11px]" style={{color:CATEGORY_COLORS.paper}}>논문 {team.tPapers}</span>}
                                                {team.tReports > 0 && <span className="text-[11px]" style={{color:CATEGORY_COLORS.report}}>계획/보고 {team.tReports}</span>}
                                                {team.tExp > 0 && <span className="text-[11px]" style={{color:CATEGORY_COLORS.experiment}}>실험 {team.tExp}</span>}
                                                {team.tAnalysis > 0 && <span className="text-[11px]" style={{color:CATEGORY_COLORS.analysis}}>해석 {team.tAnalysis}</span>}
                                                {team.tPatents > 0 && <span className="text-[11px]" style={{color:CATEGORY_COLORS.ip}}>지식재산권 {team.tPatents}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {teamStats.filter(t => t.total === 0).length > 0 && (
                                        <div className="pt-1.5 mt-1" style={{borderTop:"1px solid #F1F5F9"}}>
                                            {teamStats.filter(t => t.total === 0).map(team => (
                                                <div key={team.name} className="flex items-center justify-between py-0.5">
                                                    <span className="text-[12px]" style={{color:"#94A3B8"}}>{team.name}</span>
                                                    <span className="text-[11px]" style={{color:"#CBD5E1"}}>0건</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        { id: "papers", label: "논문", icon: "📄" },
        { id: "reports", label: "계획서/보고서", icon: "📋" },
        { id: "ip", label: "지식재산권", icon: "💡" },
        { id: "experiments", label: "실험", icon: "🧪" },
        { id: "analysis", label: "해석", icon: "🖥️" },
        // 커뮤니케이션
        { id: "conferenceTrips", label: "학회/출장", icon: "✈️" },
        { id: "meetings", label: "회의록", icon: "📝" },
        { id: "resources", label: "자료", icon: "📁" },
        { id: "ideas", label: "아이디어", icon: "💡" },
        { id: "chat", label: "잡담", icon: "💬" },
        { id: "lectures", label: "수업", icon: "📚" },
    ];

    const allPeople = useMemo(() => ["전체", ...memberNames], [memberNames]);

    const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
    const pendingSavesRef = useRef(0);
    const [toast, setToast] = useState("");
    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 3000); return () => clearTimeout(t); } }, [toast]);

    const saveSection = useCallback(async (section: string, data: unknown): Promise<boolean> => {
        try { const r = await fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, data, userName }) }); return r.ok; } catch { return false; }
    }, [userName]);

    const trackSave = useCallback((itemId: number, section: string, data: unknown, rollback: () => void) => {
        setSavingIds(prev => new Set(prev).add(itemId));
        pendingSavesRef.current++;
        saveSection(section, data).then(ok => {
            pendingSavesRef.current--;
            setSavingIds(prev => { const s = new Set(prev); s.delete(itemId); return s; });
            if (!ok) { rollback(); setToast("저장에 실패했습니다. 다시 시도해주세요."); }
        });
    }, [saveSection]);

    const fetchData = useCallback(async () => {
        // Skip polling if saves are in-flight to avoid overwriting optimistic state
        if (pendingSavesRef.current > 0) return;
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

    // chatReadTs: mark current tab as read (on tab switch + when new msgs arrive while viewing)
    const activeChatLen = activeTab === "labChat" ? (labChat.length + labBoard.length)
        : activeTab.startsWith("teamMemo_") ? ((teamMemos[activeTab.replace("teamMemo_", "")]?.chat || []).length + (teamMemos[activeTab.replace("teamMemo_", "")]?.kanban || []).length)
        : activeTab.startsWith("memo_") ? (piChat[activeTab.replace("memo_", "")] || []).length
        : activeTab === "announcements" ? announcements.length : -1;
    useEffect(() => {
        if (!userName || activeChatLen < 0) return;
        setChatReadTs(prev => {
            const next = { ...prev, [activeTab]: Date.now() };
            try { localStorage.setItem(`mftel_chatReadTs_${userName}`, JSON.stringify(next)); } catch {}
            return next;
        });
    }, [activeTab, userName, activeChatLen]);

    // Handlers
    const handleToggleTodo = (id: number) => { const u = todos.map(t => t.id === id ? { ...t, done: !t.done } : t); setTodos(u); saveSection("todos", u); };
    const handleAddTodo = (t: Todo) => { const u = [...todos, t]; setTodos(u); trackSave(t.id, "todos", u, () => setTodos(prev => prev.filter(x => x.id !== t.id))); };
    const handleDeleteTodo = (id: number) => { const u = todos.filter(t => t.id !== id); setTodos(u); saveSection("todos", u); };
    const handleUpdateTodo = (t: Todo) => { const u = todos.map(x => x.id === t.id ? t : x); setTodos(u); saveSection("todos", u); };
    const handleAddAnn = (text: string, pinned = false) => { const nid = Date.now(); const u = [{ id: nid, text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned }, ...announcements]; setAnnouncements(u); trackSave(nid, "announcements", u, () => setAnnouncements(prev => prev.filter(a => a.id !== nid))); };
    const handleDelAnn = (id: number) => { const u = announcements.filter(a => a.id !== id); setAnnouncements(u); saveSection("announcements", u); };
    const handleUpdateAnn = (ann: Announcement) => { const u = announcements.map(a => a.id === ann.id ? ann : a); setAnnouncements(u); saveSection("announcements", u); };
    const handleAddPhil = (text: string) => { const nid = Date.now(); const u = [{ id: nid, text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned: false }, ...philosophy]; setPhilosophy(u); trackSave(nid, "philosophy", u, () => setPhilosophy(prev => prev.filter(p => p.id !== nid))); };
    const handleDelPhil = (id: number) => { const u = philosophy.filter(p => p.id !== id); setPhilosophy(u); saveSection("philosophy", u); };
    const handleUpdatePhil = (p: Announcement) => { const u = philosophy.map(x => x.id === p.id ? p : x); setPhilosophy(u); saveSection("philosophy", u); };

    const handleSavePaper = (p: Paper) => {
        const exists = papers.find(x => x.id === p.id);
        const u = exists ? papers.map(x => x.id === p.id ? p : x) : [...papers, p];
        setPapers(u); setPaperModal(null);
        if (exists) saveSection("papers", u);
        else trackSave(p.id, "papers", u, () => setPapers(prev => prev.filter(x => x.id !== p.id)));
    };
    const handleDeletePaper = (id: number) => { const u = papers.filter(p => p.id !== id); setPapers(u); saveSection("papers", u); };

    const handleSaveExperiment = (e: Experiment) => {
        const exists = experiments.find(x => x.id === e.id);
        const u = exists ? experiments.map(x => x.id === e.id ? e : x) : [...experiments, e];
        setExperiments(u);
        if (exists) saveSection("experiments", u);
        else trackSave(e.id, "experiments", u, () => setExperiments(prev => prev.filter(x => x.id !== e.id)));
    };
    const handleDeleteExperiment = (id: number) => { const u = experiments.filter(e => e.id !== id); setExperiments(u); saveSection("experiments", u); };

    const handleSaveReport = (r: Report) => {
        const exists = reports.find(x => x.id === r.id);
        const u = exists ? reports.map(x => x.id === r.id ? r : x) : [...reports, r];
        setReports(u);
        if (exists) saveSection("reports", u);
        else trackSave(r.id, "reports", u, () => setReports(prev => prev.filter(x => x.id !== r.id)));
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
        setIpPatents(u);
        if (exists) saveSection("patents", u);
        else trackSave(p.id, "patents", u, () => setIpPatents(prev => prev.filter(x => x.id !== p.id)));
    };
    const handleDeletePatent = (id: number) => { const u = ipPatents.filter(p => p.id !== id); setIpPatents(u); saveSection("patents", u); };
    const handleSaveResource = (r: Resource) => {
        const exists = resources.find(x => x.id === r.id);
        const u = exists ? resources.map(x => x.id === r.id ? r : x) : [...resources, r];
        setResources(u);
        if (exists) saveSection("resources", u);
        else trackSave(r.id, "resources", u, () => setResources(prev => prev.filter(x => x.id !== r.id)));
    };
    const handleDeleteResource = (id: number) => { const u = resources.filter(r => r.id !== id); setResources(u); saveSection("resources", u); };
    const handleSaveConference = (c: ConferenceTrip) => {
        const exists = conferenceTrips.find(x => x.id === c.id);
        const u = exists ? conferenceTrips.map(x => x.id === c.id ? c : x) : [...conferenceTrips, c];
        setConferenceTrips(u);
        if (exists) saveSection("conferences", u);
        else trackSave(c.id, "conferences", u, () => setConferenceTrips(prev => prev.filter(x => x.id !== c.id)));
    };
    const handleDeleteConference = (id: number) => { const u = conferenceTrips.filter(c => c.id !== id); setConferenceTrips(u); saveSection("conferences", u); };
    const handleSaveMeeting = (m: Meeting) => {
        const exists = meetings.find(x => x.id === m.id);
        const u = exists ? meetings.map(x => x.id === m.id ? m : x) : [...meetings, m];
        setMeetings(u);
        if (exists) saveSection("meetings", u);
        else trackSave(m.id, "meetings", u, () => setMeetings(prev => prev.filter(x => x.id !== m.id)));
    };
    const handleDeleteMeeting = (id: number) => { const u = meetings.filter(m => m.id !== id); setMeetings(u); saveSection("meetings", u); };
    const handleSaveDailyTargets = (t: DailyTarget[]) => { setDailyTargets(t); saveSection("dailyTargets", t); };
    const handleSaveIdea = (idea: IdeaPost) => {
        const exists = ideas.find(x => x.id === idea.id);
        const u = exists ? ideas.map(x => x.id === idea.id ? idea : x) : [idea, ...ideas];
        setIdeas(u);
        if (exists) saveSection("ideas", u);
        else trackSave(idea.id, "ideas", u, () => setIdeas(prev => prev.filter(x => x.id !== idea.id)));
    };
    const handleDeleteIdea = (id: number) => { const u = ideas.filter(i => i.id !== id); setIdeas(u); saveSection("ideas", u); };
    const handleSaveAnalysis = (a: Analysis) => {
        const exists = analyses.find(x => x.id === a.id);
        const u = exists ? analyses.map(x => x.id === a.id ? a : x) : [...analyses, a];
        setAnalyses(u);
        if (exists) saveSection("analyses", u);
        else trackSave(a.id, "analyses", u, () => setAnalyses(prev => prev.filter(x => x.id !== a.id)));
    };
    const handleDeleteAnalysis = (id: number) => { const u = analyses.filter(a => a.id !== id); setAnalyses(u); saveSection("analyses", u); };
    const handleSaveChat = (post: IdeaPost) => {
        const exists = chatPosts.find(x => x.id === post.id);
        const u = exists ? chatPosts.map(x => x.id === post.id ? post : x) : [post, ...chatPosts];
        setChatPosts(u);
        if (exists) saveSection("chatPosts", u);
        else trackSave(post.id, "chatPosts", u, () => setChatPosts(prev => prev.filter(x => x.id !== post.id)));
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
        setPersonalMemos(u);
        if (found) saveSection("personalMemos", u);
        else trackSave(memo.id, "personalMemos", u, () => setPersonalMemos(prev => { const arr = prev[memberName] || []; return { ...prev, [memberName]: arr.filter(m => m.id !== memo.id) }; }));
    };
    const handleDeleteMemo = (memberName: string, id: number) => {
        const updated = (personalMemos[memberName] || []).filter(m => m.id !== id);
        const u = { ...personalMemos, [memberName]: updated };
        setPersonalMemos(u); saveSection("personalMemos", u);
    };
    const handleAddPersonalFile = (name: string, f: LabFile) => {
        const u = { ...personalFiles, [name]: [...(personalFiles[name] || []), f] };
        setPersonalFiles(u); trackSave(f.id, "personalFiles", u, () => setPersonalFiles(prev => ({ ...prev, [name]: (prev[name] || []).filter(x => x.id !== f.id) })));
    };
    const handleDeletePersonalFile = (name: string, id: number) => {
        const u = { ...personalFiles, [name]: (personalFiles[name] || []).filter(f => f.id !== id) };
        setPersonalFiles(u); saveSection("personalFiles", u);
    };
    const handleAddPiChat = (name: string, msg: TeamChatMsg) => {
        const newMsgs = [...(piChat[name] || []), { ...msg, _sending: true }];
        const u = { ...piChat, [name]: newMsgs };
        setPiChat(u);
        saveSection("piChat", { ...u, [name]: stripMsgFlags(newMsgs) }).then(ok => {
            setPiChat(prev => ({ ...prev, [name]: (prev[name] || []).map(m => m.id === msg.id ? (ok ? { ...m, _sending: undefined } : { ...m, _sending: undefined, _failed: true }) : m) }));
        });
    };
    const handleRetryPiChat = (name: string, msgId: number) => {
        setPiChat(prev => {
            const updated = { ...prev, [name]: (prev[name] || []).map(m => m.id === msgId ? { ...m, _sending: true, _failed: undefined } : m) };
            saveSection("piChat", { ...updated, [name]: stripMsgFlags(updated[name]) }).then(ok => {
                setPiChat(p => ({ ...p, [name]: (p[name] || []).map(m => m.id === msgId ? (ok ? { ...m, _sending: undefined } : { ...m, _sending: undefined, _failed: true }) : m) }));
            });
            return updated;
        });
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
        setTeamMemos(u);
        if (found) saveSection("teamMemos", u);
        else trackSave(card.id, "teamMemos", u, () => setTeamMemos(prev => { const d = prev[teamName] || { kanban: [], chat: [] }; return { ...prev, [teamName]: { ...d, kanban: d.kanban.filter(c => c.id !== card.id) } }; }));
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
        const newChat = [...data.chat, { ...msg, _sending: true }];
        const u = { ...teamMemos, [teamName]: { ...data, chat: newChat } };
        setTeamMemos(u);
        const cleanU = { ...u, [teamName]: { ...u[teamName], chat: stripMsgFlags(newChat) } };
        saveSection("teamMemos", cleanU).then(ok => {
            setTeamMemos(prev => {
                const td = prev[teamName] || { kanban: [], chat: [] };
                return { ...prev, [teamName]: { ...td, chat: td.chat.map(m => m.id === msg.id ? (ok ? { ...m, _sending: undefined } : { ...m, _sending: undefined, _failed: true }) : m) } };
            });
        });
    };
    const handleRetryTeamChat = (teamName: string, msgId: number) => {
        setTeamMemos(prev => {
            const td = prev[teamName] || { kanban: [], chat: [] };
            const updated = { ...prev, [teamName]: { ...td, chat: td.chat.map(m => m.id === msgId ? { ...m, _sending: true, _failed: undefined } : m) } };
            saveSection("teamMemos", { ...updated, [teamName]: { ...updated[teamName], chat: stripMsgFlags(updated[teamName].chat) } }).then(ok => {
                setTeamMemos(p => {
                    const d = p[teamName] || { kanban: [], chat: [] };
                    return { ...p, [teamName]: { ...d, chat: d.chat.map(m => m.id === msgId ? (ok ? { ...m, _sending: undefined } : { ...m, _sending: undefined, _failed: true }) : m) } };
                });
            });
            return updated;
        });
    };
    const handleUpdateTeamChat = (teamName: string, msg: TeamChatMsg) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const u = { ...teamMemos, [teamName]: { ...data, chat: data.chat.map(c => c.id === msg.id ? msg : c) } };
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
        setTeamMemos(u); trackSave(file.id, "teamMemos", u, () => setTeamMemos(prev => { const d = prev[teamName] || { kanban: [], chat: [] }; return { ...prev, [teamName]: { ...d, files: (d.files || []).filter(f => f.id !== file.id) } }; }));
    };
    const handleDeleteTeamFile = async (teamName: string, id: number) => {
        const data = teamMemos[teamName] || { kanban: [], chat: [] };
        const file = (data.files || []).find(f => f.id === id);
        if (file?.url?.startsWith("https://")) { try { await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: file.url }), headers: { "Content-Type": "application/json" } }); } catch {} }
        const u = { ...teamMemos, [teamName]: { ...data, files: (data.files || []).filter(f => f.id !== id) } };
        setTeamMemos(u); saveSection("teamMemos", u);
    };

    const handleAddLabChat = (msg: TeamChatMsg) => {
        const u = [...labChat, { ...msg, _sending: true }];
        setLabChat(u);
        saveSection("labChat", stripMsgFlags(u)).then(ok => {
            if (ok) setLabChat(prev => prev.map(m => m.id === msg.id ? { ...m, _sending: undefined } : m));
            else setLabChat(prev => prev.map(m => m.id === msg.id ? { ...m, _sending: undefined, _failed: true } : m));
        });
    };
    const handleRetryLabChat = (msgId: number) => {
        setLabChat(prev => {
            const updated = prev.map(m => m.id === msgId ? { ...m, _sending: true, _failed: undefined } : m);
            saveSection("labChat", stripMsgFlags(updated)).then(ok => {
                if (ok) setLabChat(p => p.map(m => m.id === msgId ? { ...m, _sending: undefined } : m));
                else setLabChat(p => p.map(m => m.id === msgId ? { ...m, _sending: undefined, _failed: true } : m));
            });
            return updated;
        });
    };
    const handleDeleteLabChat = (id: number) => {
        const u = labChat.filter(c => c.id !== id);
        setLabChat(u); saveSection("labChat", stripMsgFlags(u));
    };
    const handleClearLabChat = () => {
        setLabChat([]); saveSection("labChat", []);
    };
    const handleSaveLabBoard = (card: TeamMemoCard) => {
        const exists = labBoard.some(c => c.id === card.id);
        const u = exists ? labBoard.map(c => c.id === card.id ? card : c) : [...labBoard, card];
        setLabBoard(u);
        if (exists) saveSection("labBoard", u);
        else trackSave(card.id, "labBoard", u, () => setLabBoard(prev => prev.filter(c => c.id !== card.id)));
    };
    const handleDeleteLabBoard = (id: number) => {
        const u = labBoard.filter(c => c.id !== id);
        setLabBoard(u); saveSection("labBoard", u);
    };
    const handleAddLabFile = (file: LabFile) => {
        const u = [...labFiles, file]; setLabFiles(u); trackSave(file.id, "labFiles", u, () => setLabFiles(prev => prev.filter(f => f.id !== file.id)));
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
        labChat: labChat.filter(m => m.author !== userName && m.id > (chatReadTs.labChat || 0)).length + labBoard.filter(c => c.author !== userName && c.id > (chatReadTs.labChat || 0)).length,
        announcements: announcements.filter(a => a.author !== userName && new Date(a.date).getTime() > (chatReadTs.announcements || 0)).length,
        ...Object.fromEntries(teamNames.map(t => {
            const ts = chatReadTs[`teamMemo_${t}`] || 0;
            const chatNew = (teamMemos[t]?.chat || []).filter(m => m.author !== userName && m.id > ts).length;
            const boardNew = (teamMemos[t]?.kanban || []).filter(c => c.author !== userName && c.id > ts).length;
            return [`teamMemo_${t}`, chatNew + boardNew];
        })),
        ...Object.fromEntries(memberNames.map(name => [`memo_${name}`, (piChat[name] || []).filter(m => m.author !== userName && m.id > (chatReadTs[`memo_${name}`] || 0)).length])),
    };

    return (
        <MembersContext.Provider value={displayMembers}>
        <SavingContext.Provider value={savingIds}>
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 leading-normal" style={{ fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>

            {/* Mobile top header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-[56px] px-4" style={{background:"#0F172A", boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
                <button onClick={() => setMobileMenuOpen(true)} className="text-[22px] text-white w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">☰</button>
                <span className="text-[15px] font-bold text-white truncate">{(() => { const found = tabs.find(t => t.id === activeTab); const extra: Record<string, string> = { teams: "팀 관리", settings: "설정" }; return found ? `${found.icon} ${found.label}` : extra[activeTab] || "대시보드"; })()}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] flex-shrink-0" style={{background:"rgba(59,130,246,0.1)", border:"1.5px solid rgba(59,130,246,0.25)"}}>{displayMembers[userName]?.emoji || "👤"}</div>
            </div>
            {/* Mobile slide menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute inset-0" style={{background:"rgba(0,0,0,0.5)"}} />
                    <div className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col overflow-y-auto dark-scrollbar" style={{background:"#0F172A"}} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setActiveTab("overview"); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0 w-full text-left cursor-pointer" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                            <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-[17px] font-extrabold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}>M</div>
                            <div className="min-w-0">
                                <div className="text-[15px] tracking-tight text-white" style={{fontWeight:750}}>MFTEL</div>
                                <div className="text-[10.5px] truncate" style={{color:"#64748B"}}>Multiphase Flow & Thermal Energy</div>
                            </div>
                        </button>
                        <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-2 dark-scrollbar">
                            {tabs.map((tab, i) => {
                                const sectionBreaks: Record<string, string> = { announcements: "운영", todos: "내 노트", papers: "연구", conferenceTrips: "커뮤니케이션" };
                                const showBreak = !tab.id.startsWith("memo_") && !tab.id.startsWith("teamMemo_") && sectionBreaks[tab.id];
                                const showTeamMemoBreak = tab.id.startsWith("teamMemo_") && i > 0 && !tabs[i - 1].id.startsWith("teamMemo_");
                                const isActive = activeTab === tab.id;
                                return (
                                    <div key={tab.id}>
                                        {showBreak && <div className="mt-5 mb-1.5 px-4"><div className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>{sectionBreaks[tab.id]}</div></div>}
                                        {showTeamMemoBreak && <div className="mt-5 mb-1.5 px-4"><div className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>팀 워크</div></div>}
                                        <button onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                                            className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13.5px] whitespace-nowrap transition-all"
                                            style={{ fontWeight: isActive ? 600 : 450, color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                            <span className="text-[15px]">{tab.icon}</span><span>{tab.label}</span>
                                        </button>
                                    </div>
                                );
                            })}
                            {userName === "박일웅" && <div className="mt-5 mb-1.5 px-4"><div className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>관리</div></div>}
                            {userName === "박일웅" && <button onClick={() => { setActiveTab("teams"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13.5px] whitespace-nowrap" style={{ fontWeight: activeTab === "teams" ? 600 : 450, color: activeTab === "teams" ? "#FFFFFF" : "#94A3B8", background: activeTab === "teams" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">👥</span><span>팀 관리</span>
                            </button>}
                            <button onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13.5px] whitespace-nowrap" style={{ fontWeight: activeTab === "settings" ? 600 : 450, color: activeTab === "settings" ? "#FFFFFF" : "#94A3B8", background: activeTab === "settings" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">⚙️</span><span>설정</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] flex-shrink-0" style={{background:"rgba(59,130,246,0.1)", border:"1.5px solid rgba(59,130,246,0.25)"}}>{displayMembers[userName]?.emoji || "👤"}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] truncate text-white" style={{fontWeight:650}}>{userName}</div>
                                <div className="text-[10.5px]" style={{color:"#64748B"}}>{displayMembers[userName]?.role || "학생"}</div>
                            </div>
                            <button onClick={handleLogout} className="text-[16px]" style={{color:"#64748B"}} title="로그아웃">⏻</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col h-[100dvh] overflow-hidden md:flex-row md:h-screen pt-[56px] md:pt-0">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex md:w-[240px] md:h-screen flex-shrink-0 flex-col" style={{background:"#0F172A", borderRight:"1px solid #1E293B", boxShadow:"2px 0 8px rgba(0,0,0,0.1)"}}>
                    {/* Sidebar top: MFTEL logo */}
                    <button onClick={() => setActiveTab("overview")} className="flex items-center gap-3 px-5 pt-5 pb-4 relative z-10 flex-shrink-0 cursor-pointer w-full text-left" style={{borderBottom:"1px solid rgba(255,255,255,0.08)", background:"#0F172A"}}>
                        <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-[17px] font-extrabold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}>M</div>
                        <div className="text-[15px] tracking-tight text-white" style={{fontWeight:750}}>MFTEL</div>
                    </button>
                    {/* Sidebar nav */}
                    <div className="flex-1 min-h-0 flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-3 md:p-0 md:pt-2 md:pb-2 gap-px dark-scrollbar">
                        {tabs.map((tab, i) => {
                            const sectionBreaks: Record<string, string> = { announcements: "운영", todos: "내 노트", papers: "연구", conferenceTrips: "커뮤니케이션" };
                            const showBreak = !tab.id.startsWith("memo_") && !tab.id.startsWith("teamMemo_") && sectionBreaks[tab.id];
                            const showTeamMemoBreak = tab.id.startsWith("teamMemo_") && i > 0 && !tabs[i - 1].id.startsWith("teamMemo_");
                            const showMemoBreak = false;
                            const isActive = activeTab === tab.id;
                            return (
                                <div key={tab.id}>
                                    {showBreak && (
                                        <div className="hidden md:block mt-5 mb-1.5 px-4">
                                            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>{sectionBreaks[tab.id]}</div>
                                        </div>
                                    )}
                                    {showTeamMemoBreak && (
                                        <div className="hidden md:block mt-5 mb-1.5 px-4">
                                            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>팀 워크</div>
                                        </div>
                                    )}
                                    {showMemoBreak && (
                                        <div className="hidden md:block mt-5 mb-1.5 px-4">
                                            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>내 노트</div>
                                        </div>
                                    )}
                                    <button onClick={() => setActiveTab(tab.id)}
                                        className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13.5px] whitespace-nowrap transition-all"
                                        style={{ fontWeight: isActive ? 600 : 450, letterSpacing: "-0.01em", color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#E2E8F0"; } }}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}>
                                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                        <span className="text-[15px]">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        {((unreadCounts[tab.id] || 0) > 0 || (discussionCounts[tab.id] || 0) > 0) && (
                                            <div className="flex items-center gap-1.5">
                                                {(unreadCounts[tab.id] || 0) > 0 && <span className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold" style={{background:"rgba(59,130,246,0.2)", color:"#60A5FA"}}>{unreadCounts[tab.id]}</span>}
                                                {(discussionCounts[tab.id] || 0) > 0 && <span className="w-[6px] h-[6px] rounded-full bg-orange-400" />}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                        {/* Admin: 팀 관리 + 설정 */}
                        {userName === "박일웅" && (
                            <div className="hidden md:block mt-5 mb-1.5 px-4">
                                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>관리</div>
                            </div>
                        )}
                        {userName === "박일웅" && (() => {
                            const isActive = activeTab === "teams";
                            return (
                                <button onClick={() => setActiveTab("teams")}
                                    className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13.5px] whitespace-nowrap transition-all"
                                    style={{ fontWeight: isActive ? 600 : 450, letterSpacing: "-0.01em", color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#E2E8F0"; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}>
                                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                    <span className="text-[15px]">👥</span>
                                    <span>팀 관리</span>
                                </button>
                            );
                        })()}
                        {(() => {
                            const isActive = activeTab === "settings";
                            return (
                                <button onClick={() => setActiveTab("settings")}
                                    className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13.5px] whitespace-nowrap transition-all"
                                    style={{ fontWeight: isActive ? 600 : 450, letterSpacing: "-0.01em", color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#E2E8F0"; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}>
                                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                    <span className="text-[15px]">⚙️</span>
                                    <span>설정</span>
                                </button>
                            );
                        })()}
                    </div>
                    {/* Sidebar bottom: user profile */}
                    <div className="hidden md:flex items-center gap-2.5 px-4 py-3.5 relative z-10 flex-shrink-0" style={{borderTop:"1px solid rgba(255,255,255,0.08)", background:"#0F172A"}}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] flex-shrink-0" style={{background:"rgba(59,130,246,0.1)", border:"1.5px solid rgba(59,130,246,0.25)"}}>{displayMembers[userName]?.emoji || "👤"}</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] truncate text-white" style={{fontWeight:650}}>{userName}</div>
                            <div className="text-[10.5px]" style={{color:"#64748B"}}>{displayMembers[userName]?.role || "학생"}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                            <button onClick={handleLogout} className="text-[16px] transition-colors" style={{color:"#64748B"}} onMouseEnter={e => e.currentTarget.style.color = "#EF4444"} onMouseLeave={e => e.currentTarget.style.color = "#64748B"} title="로그아웃">⏻</button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 md:py-7 md:px-9 overflow-y-auto flex flex-col min-h-0">
                    {activeTab !== "overview" && activeTab !== "overview_me" && (() => {
                        const extraTabs: Record<string, { icon: string; label: string }> = { teams: { icon: "👥", label: "팀 관리" }, settings: { icon: "⚙️", label: "설정" } };
                        const found = tabs.find(t => t.id === activeTab) || extraTabs[activeTab];
                        return found ? (
                            <div className="mb-6 flex-shrink-0 hidden md:block">
                                <h2 className="text-[26px] font-extrabold tracking-tight" style={{color:"#0F172A", letterSpacing:"-0.03em"}}>
                                    {found.icon} {found.label}
                                </h2>
                            </div>
                        ) : null;
                    })()}

                    {activeTab === "overview" && <OverviewDashboard papers={papers} reports={reports} experiments={experiments} analyses={analyses} todos={todos} ipPatents={ipPatents} announcements={announcements} dailyTargets={dailyTargets} ideas={ideas} resources={resources} chatPosts={chatPosts} personalMemos={personalMemos} teamMemos={teamMemos} meetings={meetings} onlineUsers={onlineUsers} currentUser={userName} onNavigate={setActiveTab} mode="team" statusMessages={statusMessages} members={displayMembers} teams={teams} />}
                    {activeTab === "overview_me" && <OverviewDashboard papers={papers} reports={reports} experiments={experiments} analyses={analyses} todos={todos} ipPatents={ipPatents} announcements={announcements} dailyTargets={dailyTargets} ideas={ideas} resources={resources} chatPosts={chatPosts} personalMemos={personalMemos} teamMemos={teamMemos} meetings={meetings} onlineUsers={onlineUsers} currentUser={userName} onNavigate={setActiveTab} mode="personal" statusMessages={statusMessages} members={displayMembers} teams={teams} />}
                    {activeTab === "announcements" && <AnnouncementView announcements={announcements} onAdd={handleAddAnn} onDelete={handleDelAnn} onUpdate={handleUpdateAnn} onReorder={list => { setAnnouncements(list); saveSection("announcements", list); }} philosophy={philosophy} onAddPhilosophy={handleAddPhil} onDeletePhilosophy={handleDelPhil} onUpdatePhilosophy={handleUpdatePhil} onReorderPhilosophy={list => { setPhilosophy(list); saveSection("philosophy", list); }} currentUser={userName} />}
                    {activeTab === "daily" && <DailyTargetView targets={dailyTargets} onSave={handleSaveDailyTargets} currentUser={userName} />}
                    {activeTab === "papers" && <KanbanView papers={papers} filter={selectedPerson} onFilterPerson={setSelectedPerson} allPeople={allPeople} onClickPaper={p => setPaperModal({ paper: p, mode: "edit" })} onAddPaper={() => setPaperModal({ paper: null, mode: "add" })} onSavePaper={handleSavePaper} onDeletePaper={handleDeletePaper} onReorder={list => { setPapers(list); saveSection("papers", list); }} tagList={paperTagList} onSaveTags={handleSavePaperTags} teamNames={teamNames} currentUser={userName} />}
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
                    {activeTab === "labChat" && <LabChatView chat={labChat} currentUser={userName} onAdd={handleAddLabChat} onDelete={handleDeleteLabChat} onClear={handleClearLabChat} onRetry={handleRetryLabChat} files={labFiles} onAddFile={handleAddLabFile} onDeleteFile={handleDeleteLabFile} board={labBoard} onSaveBoard={handleSaveLabBoard} onDeleteBoard={handleDeleteLabBoard} />}
                    {activeTab.startsWith("teamMemo_") && (() => {
                        const tName = activeTab.replace("teamMemo_", "");
                        const data = teamMemos[tName] || { kanban: [], chat: [] };
                        return <TeamMemoView teamName={tName} kanban={data.kanban} chat={data.chat} files={data.files || []} currentUser={userName} onSaveCard={c => handleSaveTeamMemo(tName, c)} onDeleteCard={id => handleDeleteTeamMemo(tName, id)} onReorderCards={cards => handleReorderTeamMemo(tName, cards)} onAddChat={msg => handleAddTeamChat(tName, msg)} onUpdateChat={msg => handleUpdateTeamChat(tName, msg)} onDeleteChat={id => handleDeleteTeamChat(tName, id)} onClearChat={() => handleClearTeamChat(tName)} onRetryChat={id => handleRetryTeamChat(tName, id)} onAddFile={f => handleAddTeamFile(tName, f)} onDeleteFile={id => handleDeleteTeamFile(tName, id)} />;
                    })()}
                    {activeTab.startsWith("memo_") && (() => {
                        const name = activeTab.replace("memo_", "");
                        return <PersonalMemoView memos={personalMemos[name] || []} onSave={m => handleSaveMemo(name, m)} onDelete={id => handleDeleteMemo(name, id)} files={personalFiles[name] || []} onAddFile={f => handleAddPersonalFile(name, f)} onDeleteFile={id => handleDeletePersonalFile(name, id)} chat={piChat[name] || []} onAddChat={msg => handleAddPiChat(name, msg)} onDeleteChat={id => handleDeletePiChat(name, id)} onClearChat={() => handleClearPiChat(name)} onRetryChat={id => handleRetryPiChat(name, id)} currentUser={userName} />;
                    })()}
                </div>
            </div>

            {/* Paper Modal */}
            {paperModal && <PaperFormModal paper={paperModal.paper} onSave={handleSavePaper} onDelete={handleDeletePaper} onClose={() => setPaperModal(null)} currentUser={userName} tagList={paperTagList} teamNames={teamNames} />}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-5 py-3 rounded-xl text-[14px] font-medium text-white shadow-lg animate-[fadeInUp_0.3s_ease]" style={{ background: "#EF4444" }}>
                    {toast}
                </div>
            )}
        </div>
        </SavingContext.Provider>
        </MembersContext.Provider>
    );
}
