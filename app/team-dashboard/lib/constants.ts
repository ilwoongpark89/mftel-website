import type { Paper, Todo, Experiment, Patent, TimetableBlock, TeamData } from "./types";

// ─── Members ────────────────────────────────────────────────────────────────

export const DEFAULT_MEMBERS: Record<string, { team: string; role: string; emoji: string }> = {
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
export const MEMBERS = DEFAULT_MEMBERS;
export const MEMBER_NAMES = Object.keys(MEMBERS).filter(k => k !== "박일웅");
export const ALL_MEMBER_NAMES = Object.keys(DEFAULT_MEMBERS);

// ─── Paper Status ───────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#BFDBFE" },
    exp_analysis: { label: "실험·해석", color: "#93C5FD" },
    writing: { label: "작성중", color: "#60A5FA" },
    under_review: { label: "심사중", color: "#3B82F6" },
    completed: { label: "완료", color: "#22C55E" },
};
export const STATUS_KEYS = ["planning", "exp_analysis", "writing", "under_review"];
export const PAPER_STATUS_MIGRATE = (s: string) => (s === "experiment" || s === "analysis") ? "exp_analysis" : s;
export const PAPER_TAGS = ["안전예타", "생애첫", "TES", "액침냉각", "이상유동", "시스템코드", "NTNU", "PCM", "기타"];

// ─── Report Status ──────────────────────────────────────────────────────────

export const REPORT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#FED7AA" },
    writing: { label: "작성중", color: "#FDBA74" },
    checking: { label: "검토중", color: "#FB923C" },
    review: { label: "심사중", color: "#F59E0B" },
    done: { label: "완료", color: "#22C55E" },
};
export const REPORT_STATUS_KEYS = ["planning", "writing", "checking", "review"];

// ─── Priority ───────────────────────────────────────────────────────────────

export const PRIORITY_ICON: Record<string, string> = { highest: "🔥", high: "🔴", mid: "🟡", low: "🔵", lowest: "⚪" };
export const PRIORITY_LABEL: Record<string, string> = { highest: "매우높음", high: "높음", mid: "중간", low: "낮음", lowest: "매우낮음" };
export const PRIORITY_KEYS = ["highest", "high", "mid", "low", "lowest"];

// ─── Experiment Status ──────────────────────────────────────────────────────

export const DEFAULT_EQUIPMENT = ["액침냉각", "이상유동", "예연소실", "라이덴프로스트", "모래배터리", "기타"];
export const EXP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#FECACA" },
    preparing: { label: "준비중", color: "#FCA5A5" },
    running: { label: "진행중", color: "#F87171" },
    paused_done: { label: "완료", color: "#EF4444" },
    completed: { label: "완료", color: "#22C55E" },
};
export const EXP_STATUS_KEYS = ["planning", "preparing", "running", "paused_done"];
export const EXP_STATUS_MIGRATE = (s: string) => s === "paused" ? "paused_done" : s;

// ─── IP / Patent Status ─────────────────────────────────────────────────────

export const IP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획", color: "#99F6E4" },
    writing: { label: "작성중", color: "#5EEAD4" },
    evaluation: { label: "평가중", color: "#2DD4BF" },
    filed: { label: "출원", color: "#14B8A6" },
    completed: { label: "완료", color: "#22C55E" },
};
export const IP_STATUS_KEYS = ["planning", "writing", "evaluation", "filed"];

// ─── Analysis Status ────────────────────────────────────────────────────────

export const ANALYSIS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    planning: { label: "기획중", color: "#DDD6FE" },
    preparing: { label: "준비중", color: "#C4B5FD" },
    running: { label: "진행중", color: "#A78BFA" },
    paused_done: { label: "완료", color: "#8B5CF6" },
    completed: { label: "완료", color: "#22C55E" },
};
export const ANALYSIS_STATUS_KEYS = ["planning", "preparing", "running", "paused_done"];
export const ANALYSIS_STATUS_MIGRATE = (s: string) => s === "paused" ? "paused_done" : s;
export const ANALYSIS_TOOLS = ["OpenFOAM", "ANSYS Fluent", "STAR-CCM+", "MARS-K", "CUPID", "GAMMA+", "Python/MATLAB", "기타"];

// ─── Calendar & Timetable ───────────────────────────────────────────────────

export const CALENDAR_TYPES: Record<string, { label: string; color: string; short: string }> = {
    conference: { label: "학회", color: "#60a5fa", short: "학" },
    trip: { label: "출장", color: "#7dd3fc", short: "출" },
    seminar: { label: "세미나", color: "#67e8f9", short: "세" },
    meeting: { label: "회의", color: "#5eead4", short: "회" },
    vendor: { label: "업체", color: "#6ee7b7", short: "업" },
    other: { label: "기타", color: "#cbd5e1", short: "기" },
    vacation: { label: "휴가", color: "#fca5a5", short: "휴" },
    wfh: { label: "재택", color: "#fdba74", short: "재" },
};
export const TIMETABLE_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#6366f1", "#84cc16"];
export const DAY_LABELS = ["월", "화", "수", "목", "금"];
export const SLOT_COUNT = 24;
export function slotToTime(slot: number) {
    const h = 9 + Math.floor(slot / 2);
    const m = slot % 2 === 0 ? "00" : "30";
    return `${h}:${m}`;
}

// ─── Colors ─────────────────────────────────────────────────────────────────

export const CATEGORY_COLORS = { paper: "#60A5FA", report: "#FDBA74", experiment: "#F87171", analysis: "#A78BFA", ip: "#2DD4BF" } as const;

export const TEAM_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899", "#f97316", "#14b8a6", "#6366f1", "#0ea5e9", "#84cc16", "#d946ef", "#78716c", "#dc2626", "#059669", "#7c3aed"];
export const TEAM_EMOJIS = ["💧", "⚙️", "🔋", "🌊", "🔬", "🧪", "📐", "🔧", "❄️", "☢️", "🔥", "💻", "📊", "🌡️", "⚡", "🛠️", "🧬", "🏗️", "📡", "🎯", "🚀", "💎", "🧊", "🌀", "⚛️", "🔩", "🧲", "💡", "🔭", "🪫", "🔌", "🌍", "🛡️", "🏭", "🧫", "📈"];

export const EMOJI_CATEGORIES = [
    { label: "😀", name: "표정", emojis: ["😀","😁","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😋","😛","😜","🤪","😝","🤗","🤔","🤫","🤭","😏","🙄","😯","😲","😳","🥺","🥹","😢","😭","😤"] },
    { label: "👍", name: "손", emojis: ["👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✋","🤚","🖖","👋","🤝","🙏","💪","🫶"] },
    { label: "❤️", name: "하트", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💞","💓","💗","💖","💝","💘"] },
    { label: "🎉", name: "축하", emojis: ["🎉","🎊","🎈","🎁","🏆","🏅","🥇","⭐","🌟","💫","✨","🔔","📣"] },
    { label: "🔥", name: "기타", emojis: ["🔥","💯","✅","❌","⭕","❓","❗","💡","📌","📎","📝","💬","👀","🚀","⚡","🌈","☀️","🌙","⏰","🎯"] },
];

export const EMOJI_OPTIONS = [
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

export const MEMO_COLORS = ["#FFFFFF", "#FEF9C3", "#FFEDD5", "#FCE7F3", "#FEE2E2", "#F3E8FF", "#DBEAFE", "#E0F2FE", "#DCFCE7", "#F1F5F9"];
export const MEMO_BORDERS = ["", "#94a3b8", "#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"];
export const TEAM_MEMO_COLORS = MEMO_COLORS;
export const MEMO_COL_MIGRATE = (s: string) => (s === "done" || s === "right") ? "right" : "left";
export const MEMO_COLUMNS = [{ key: "left", label: "진행", color: "#3b82f6" }, { key: "right", label: "완료", color: "#8b5cf6" }];

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_TEAMS: Record<string, TeamData> = {};
export const DEFAULT_PAPERS: Paper[] = [];
export const DEFAULT_TODOS: Todo[] = [];
export const DEFAULT_EXPERIMENTS: Experiment[] = [];
export const DEFAULT_PATENTS: Patent[] = [];
export const DEFAULT_TIMETABLE: TimetableBlock[] = [];

// ─── Draft & File ───────────────────────────────────────────────────────────

export const DRAFT_PFX = "mftel_draft_";
export const FILE_MAX = 10 * 1024 * 1024;
