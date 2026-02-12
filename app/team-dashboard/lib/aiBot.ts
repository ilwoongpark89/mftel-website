import type { Paper, Experiment, Analysis, Report, Patent, Meeting, Todo, VacationEntry, ScheduleEvent, DailyTarget, ConferenceTrip } from "./types";
import { ALL_MEMBER_NAMES, CALENDAR_TYPES } from "./constants";

// ─── Dashboard Data Interface ───────────────────────────────────────────────

export interface DashboardData {
    papers: Paper[];
    experiments: Experiment[];
    analyses: Analysis[];
    reports: Report[];
    patents: Patent[];
    meetings: Meeting[];
    todos: Todo[];
    vacations: VacationEntry[];
    schedule: ScheduleEvent[];
    dailyTargets: DailyTarget[];
    conferenceTrips: ConferenceTrip[];
    onlineUsers: Array<{ name: string; timestamp: number }>;
}

// ─── Bot Response Interface ─────────────────────────────────────────────────

export interface BotResponse {
    text: string;
    needsConfirm?: boolean;
    confirmAction?: {
        type: "calendar";
        name: string;
        dates: string[];
        calendarType: string;
        description: string;
    };
}

// ─── Parsed Command Interface ───────────────────────────────────────────────

export interface ParsedCommand {
    action: "등록" | "조회" | "삭제" | "수정" | null;
    target: string | null;
    members: string[];
    dates: { start: string; end?: string } | null;
    rawText: string;
    description: string;
}

// ─── Keyword Dictionaries ───────────────────────────────────────────────────

const ACTION_KEYWORDS: Record<string, ParsedCommand["action"]> = {
    "등록": "등록", "추가": "등록", "신청": "등록", "넣어": "등록", "잡아": "등록",
    "조회": "조회", "확인": "조회", "보여": "조회", "알려": "조회", "뭐야": "조회", "뭐있": "조회", "목록": "조회", "리스트": "조회",
    "삭제": "삭제", "취소": "삭제", "빼": "삭제", "제거": "삭제",
    "수정": "수정", "변경": "수정", "바꿔": "수정",
};

// target → { default action, category }
const TARGET_KEYWORDS: Record<string, { defaultAction: ParsedCommand["action"]; category: string }> = {
    // 일정 유형 → 기본 등록
    "휴가": { defaultAction: "등록", category: "schedule" },
    "반차": { defaultAction: "등록", category: "schedule" },
    "연차": { defaultAction: "등록", category: "schedule" },
    "출장": { defaultAction: "등록", category: "schedule" },
    "회의": { defaultAction: "등록", category: "schedule" },
    "재택": { defaultAction: "등록", category: "schedule" },
    "세미나": { defaultAction: "등록", category: "schedule" },
    "학회": { defaultAction: "등록", category: "schedule" },
    // 데이터 유형 → 기본 조회
    "논문": { defaultAction: "조회", category: "data" },
    "실험": { defaultAction: "조회", category: "data" },
    "해석": { defaultAction: "조회", category: "data" },
    "계획서": { defaultAction: "조회", category: "data" },
    "보고서": { defaultAction: "조회", category: "data" },
    "특허": { defaultAction: "조회", category: "data" },
    "마감": { defaultAction: "조회", category: "data" },
    "논의": { defaultAction: "조회", category: "data" },
    "할일": { defaultAction: "조회", category: "data" },
    "일정": { defaultAction: "조회", category: "data" },
    // 특수 → 항상 조회
    "요약": { defaultAction: "조회", category: "special" },
    "현황": { defaultAction: "조회", category: "special" },
    "접속": { defaultAction: "조회", category: "special" },
    "접속중": { defaultAction: "조회", category: "special" },
    "누가있어": { defaultAction: "조회", category: "special" },
    "도움말": { defaultAction: "조회", category: "special" },
    "help": { defaultAction: "조회", category: "special" },
};

// ─── Date Parsing ───────────────────────────────────────────────────────────

function pad(n: number) { return n.toString().padStart(2, "0"); }

function formatDate(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
}

const DAY_MAP: Record<string, number> = { "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6, "일": 0 };

export function parseDate(text: string): { start: string; end?: string } | null {
    const today = new Date();
    const todayStr = formatDate(today);

    // 오늘/내일/모레
    if (/오늘/.test(text)) return { start: todayStr };
    if (/내일/.test(text)) return { start: formatDate(addDays(today, 1)) };
    if (/모레/.test(text)) return { start: formatDate(addDays(today, 2)) };

    // 다음주 월~금
    const nextWeekDay = text.match(/다음\s*주\s*([월화수목금토일])/);
    if (nextWeekDay) {
        const targetDay = DAY_MAP[nextWeekDay[1]];
        const nextMon = addDays(getMonday(today), 7);
        const diff = targetDay === 0 ? 6 : targetDay - 1;
        return { start: formatDate(addDays(nextMon, diff)) };
    }

    // 이번주 월~금
    const thisWeekDay = text.match(/이번\s*주\s*([월화수목금토일])/);
    if (thisWeekDay) {
        const targetDay = DAY_MAP[thisWeekDay[1]];
        const thisMon = getMonday(today);
        const diff = targetDay === 0 ? 6 : targetDay - 1;
        return { start: formatDate(addDays(thisMon, diff)) };
    }

    // 이번주 / 다음주 (범위)
    if (/다음\s*주/.test(text)) {
        const nextMon = addDays(getMonday(today), 7);
        return { start: formatDate(nextMon), end: formatDate(addDays(nextMon, 4)) };
    }
    if (/이번\s*주/.test(text)) {
        const thisMon = getMonday(today);
        return { start: formatDate(thisMon), end: formatDate(addDays(thisMon, 4)) };
    }

    // M/D~D or M/D~M/D
    const rangeMatch = text.match(/(\d{1,2})\/(\d{1,2})\s*[~\-]\s*(?:(\d{1,2})\/)?(\d{1,2})/);
    if (rangeMatch) {
        const y = today.getFullYear();
        const m1 = parseInt(rangeMatch[1]);
        const d1 = parseInt(rangeMatch[2]);
        const m2 = rangeMatch[3] ? parseInt(rangeMatch[3]) : m1;
        const d2 = parseInt(rangeMatch[4]);
        return { start: `${y}-${pad(m1)}-${pad(d1)}`, end: `${y}-${pad(m2)}-${pad(d2)}` };
    }

    // M월 D일 or M/D
    const mdMatch = text.match(/(\d{1,2})\s*[월\/]\s*(\d{1,2})\s*일?/);
    if (mdMatch) {
        const y = today.getFullYear();
        return { start: `${y}-${pad(parseInt(mdMatch[1]))}-${pad(parseInt(mdMatch[2]))}` };
    }

    return null;
}

// ─── Member Parsing ─────────────────────────────────────────────────────────

export function parseMember(text: string, currentUser: string, memberNames: string[]): string[] {
    const found: string[] = [];

    // "내"/"나"/"제" → currentUser
    if (/\b(내|나의|나|제)\b/.test(text) || /^(내|나)/.test(text)) {
        found.push(currentUser);
    }

    // 멤버 이름 매칭
    for (const name of memberNames) {
        if (text.includes(name)) found.push(name);
    }

    // 중복 제거
    const unique = [...new Set(found)];
    return unique.length > 0 ? unique : [currentUser];
}

// ─── Main Parser ────────────────────────────────────────────────────────────

export function parseCommand(text: string, currentUser: string, memberNames: string[]): ParsedCommand {
    // Strip @AI prefix
    const cleaned = text.replace(/^@[Aa][Ii]\s*/, "").trim();

    let action: ParsedCommand["action"] = null;
    let target: string | null = null;

    // Find action keyword
    for (const [keyword, act] of Object.entries(ACTION_KEYWORDS)) {
        if (cleaned.includes(keyword)) {
            action = act;
            break;
        }
    }

    // Find target keyword
    for (const keyword of Object.keys(TARGET_KEYWORDS)) {
        if (cleaned.includes(keyword)) {
            target = keyword;
            break;
        }
    }

    // Apply default action based on target
    if (!action && target && TARGET_KEYWORDS[target]) {
        action = TARGET_KEYWORDS[target].defaultAction;
    }

    // Parse members and dates
    const members = parseMember(cleaned, currentUser, memberNames);
    const dates = parseDate(cleaned);

    // Build description (remaining text after removing known keywords)
    let description = cleaned;
    if (target) description = description.replace(target, "");
    for (const kw of Object.keys(ACTION_KEYWORDS)) {
        description = description.replace(kw, "");
    }
    for (const name of members) {
        description = description.replace(name, "");
    }
    description = description.replace(/[오늘내일모레]|이번\s*주|다음\s*주\s*[월화수목금토일]?|\d+\/\d+[~\-]?\d*\/?~?\d*|\d+월\s*\d+일/g, "").trim();
    description = description.replace(/\s+/g, " ").trim();

    return { action, target, members, dates, rawText: cleaned, description };
}

// ─── Calendar Type Mapping ──────────────────────────────────────────────────

function targetToCalendarType(target: string): string {
    const map: Record<string, string> = {
        "휴가": "vacation", "반차": "vacation", "연차": "vacation",
        "재택": "wfh",
        "출장": "trip",
        "회의": "meeting",
        "세미나": "seminar",
        "학회": "conference",
    };
    return map[target] || "other";
}

// ─── Date Range Expansion ───────────────────────────────────────────────────

function expandDateRange(start: string, end?: string): string[] {
    if (!end) return [start];
    const dates: string[] = [];
    const s = new Date(start);
    const e = new Date(end);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        dates.push(formatDate(d));
    }
    return dates;
}

// ─── Date Display Helper ────────────────────────────────────────────────────

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

function displayDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const wd = WEEKDAY_KR[d.getDay()];
    return `${m}/${day}(${wd})`;
}

function displayDateRange(start: string, end?: string): string {
    if (!end || start === end) return displayDate(start);
    return `${displayDate(start)}~${displayDate(end)}`;
}

// ─── Response Generation ────────────────────────────────────────────────────

export function generateResponse(
    cmd: ParsedCommand,
    data: DashboardData,
    members: Record<string, { team: string; role: string; emoji: string }>
): BotResponse {
    const { action, target, members: cmdMembers, dates } = cmd;

    // ─── 도움말 ─────────────────────────────────────────────────────────
    if (target === "도움말" || target === "help" || (!target && !action)) {
        return {
            text: `📋 **사용 가능한 명령어**\n\n` +
                `**일정 등록** (확인 후 등록)\n` +
                `• \`@AI 오늘 휴가\` — 오늘 휴가 등록\n` +
                `• \`@AI 내일 재택\` — 내일 재택 등록\n` +
                `• \`@AI 송준범 2/26~28 출장\` — 날짜 범위 등록\n` +
                `• \`@AI 다음주 월 세미나\` — 다음주 월요일 세미나\n` +
                `• \`@AI 휴가 삭제 오늘\` — 일정 삭제\n\n` +
                `**데이터 조회** (즉시 결과)\n` +
                `• \`@AI 논문\` — 진행중 논문 목록\n` +
                `• \`@AI 실험\` / \`@AI 해석\` — 실험/해석 현황\n` +
                `• \`@AI 보고서\` / \`@AI 특허\` — 보고서/특허 현황\n` +
                `• \`@AI 할일\` — 미완료 할일 목록\n` +
                `• \`@AI 마감\` — 이번주 마감 항목\n` +
                `• \`@AI 논의\` — 논의 필요 항목\n\n` +
                `**기타**\n` +
                `• \`@AI 요약\` — 전체 대시보드 현황\n` +
                `• \`@AI 접속중\` — 온라인 사용자 목록\n` +
                `• \`@AI 일정 송준범\` — 멤버 일정 조회\n` +
                `• \`@AI 도움말\` — 이 안내 표시`,
        };
    }

    // ─── 접속중 ─────────────────────────────────────────────────────────
    if (target === "접속중" || target === "접속" || target === "누가있어") {
        const now = Date.now();
        const online = data.onlineUsers.filter(u => now - u.timestamp < 5 * 60 * 1000);
        if (online.length === 0) return { text: "현재 접속중인 사용자가 없습니다." };
        const emoji = (n: string) => members[n]?.emoji || "👤";
        const list = online.map(u => `${emoji(u.name)} ${u.name}`).join(", ");
        return { text: `🟢 **현재 접속중** (${online.length}명)\n${list}` };
    }

    // ─── 요약 / 현황 ───────────────────────────────────────────────────
    if (target === "요약" || target === "현황") {
        const activePapers = data.papers.filter(p => p.status !== "completed");
        const activeExps = data.experiments.filter(e => e.status !== "completed");
        const activeAnalyses = data.analyses.filter(a => a.status !== "completed");
        const activeReports = data.reports.filter(r => r.status !== "done");
        const activePatents = data.patents.filter(p => p.status !== "completed");
        const pendingTodos = data.todos.filter(t => !t.done);
        const now = Date.now();
        const online = data.onlineUsers.filter(u => now - u.timestamp < 5 * 60 * 1000);

        return {
            text: `📊 **대시보드 현황 요약**\n\n` +
                `📄 논문: ${activePapers.length}건 진행중\n` +
                `🧪 실험: ${activeExps.length}건 진행중\n` +
                `🖥️ 해석: ${activeAnalyses.length}건 진행중\n` +
                `📋 보고서: ${activeReports.length}건 진행중\n` +
                `💡 특허: ${activePatents.length}건 진행중\n` +
                `✅ 할일: ${pendingTodos.length}건 미완료\n` +
                `🟢 접속: ${online.length}명 온라인`,
        };
    }

    // ─── 마감 ───────────────────────────────────────────────────────────
    if (target === "마감") {
        const today = new Date();
        const endDate = dates?.end ? new Date(dates.end) : addDays(getMonday(today), 6);
        const startDate = dates?.start ? new Date(dates.start) : getMonday(today);
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        const deadlines: Array<{ title: string; deadline: string; type: string }> = [];
        data.papers.filter(p => p.deadline && p.status !== "completed" && p.deadline >= startStr && p.deadline <= endStr)
            .forEach(p => deadlines.push({ title: p.title, deadline: p.deadline, type: "📄 논문" }));
        data.experiments.filter(e => e.endDate && e.status !== "completed" && e.endDate >= startStr && e.endDate <= endStr)
            .forEach(e => deadlines.push({ title: e.title, deadline: e.endDate, type: "🧪 실험" }));
        data.reports.filter(r => r.deadline && r.status !== "done" && r.deadline >= startStr && r.deadline <= endStr)
            .forEach(r => deadlines.push({ title: r.title, deadline: r.deadline, type: "📋 보고서" }));
        data.patents.filter(p => p.deadline && p.status !== "completed" && p.deadline >= startStr && p.deadline <= endStr)
            .forEach(p => deadlines.push({ title: p.title, deadline: p.deadline, type: "💡 특허" }));
        data.analyses.filter(a => a.endDate && a.status !== "completed" && a.endDate >= startStr && a.endDate <= endStr)
            .forEach(a => deadlines.push({ title: a.title, deadline: a.endDate, type: "🖥️ 해석" }));
        data.todos.filter(t => t.deadline && !t.done && t.deadline >= startStr && t.deadline <= endStr)
            .forEach(t => deadlines.push({ title: t.text, deadline: t.deadline, type: "✅ 할일" }));

        deadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));

        if (deadlines.length === 0) return { text: `📅 ${displayDateRange(startStr, endStr)} 마감 항목이 없습니다.` };
        const lines = deadlines.map(d => `• ${d.type} ${displayDate(d.deadline)} — ${d.title}`);
        return { text: `📅 **마감 항목** (${displayDateRange(startStr, endStr)})\n\n${lines.join("\n")}` };
    }

    // ─── 논의 필요 ──────────────────────────────────────────────────────
    if (target === "논의") {
        const items: Array<{ title: string; type: string }> = [];
        data.papers.filter(p => p.needsDiscussion).forEach(p => items.push({ title: p.title, type: "📄 논문" }));
        data.experiments.filter(e => e.needsDiscussion).forEach(e => items.push({ title: e.title, type: "🧪 실험" }));
        data.analyses.filter(a => a.needsDiscussion).forEach(a => items.push({ title: a.title, type: "🖥️ 해석" }));
        data.reports.filter(r => r.needsDiscussion).forEach(r => items.push({ title: r.title, type: "📋 보고서" }));
        data.patents.filter(p => p.needsDiscussion).forEach(p => items.push({ title: p.title, type: "💡 특허" }));

        if (items.length === 0) return { text: "✅ 논의 필요 항목이 없습니다." };
        const lines = items.map(i => `• ${i.type} ${i.title}`);
        return { text: `🗣️ **논의 필요 항목** (${items.length}건)\n\n${lines.join("\n")}` };
    }

    // ─── 일정 조회 ──────────────────────────────────────────────────────
    if (target === "일정" && action === "조회") {
        const memberList = cmdMembers;
        const items: string[] = [];
        for (const name of memberList) {
            const emoji = members[name]?.emoji || "👤";
            const vacs = data.vacations.filter(v => v.name === name);
            const scheds = data.schedule.filter(s => s.name === name);
            if (vacs.length === 0 && scheds.length === 0) {
                items.push(`${emoji} ${name}: 등록된 일정 없음`);
                continue;
            }
            const all = [
                ...vacs.map(v => `${displayDate(v.date)} ${CALENDAR_TYPES[v.type]?.label || v.type}`),
                ...scheds.map(s => `${displayDate(s.date)} ${CALENDAR_TYPES[s.type]?.label || s.type}${s.description ? ` (${s.description})` : ""}`),
            ];
            items.push(`${emoji} **${name}**\n${all.map(a => `  • ${a}`).join("\n")}`);
        }
        return { text: `📅 **일정 조회**\n\n${items.join("\n\n")}` };
    }

    // ─── 일정 등록/삭제 ─────────────────────────────────────────────────
    if (target && TARGET_KEYWORDS[target]?.category === "schedule") {
        const calType = targetToCalendarType(target);
        const typeLabel = CALENDAR_TYPES[calType]?.label || target;

        if (action === "삭제") {
            if (!dates) return { text: `❓ 날짜를 지정해주세요.\n예: \`@AI ${target} 삭제 오늘\`` };
            const dateList = expandDateRange(dates.start, dates.end);
            const name = cmdMembers[0];
            const emoji = members[name]?.emoji || "👤";
            return {
                text: `${emoji} ${name}의 ${displayDateRange(dates.start, dates.end)} **${typeLabel}**를 삭제할까요?`,
                needsConfirm: true,
                confirmAction: { type: "calendar", name, dates: dateList, calendarType: "", description: "" },
            };
        }

        // 등록
        if (!dates) {
            // 날짜 없으면 오늘로 기본 설정
            const todayStr = formatDate(new Date());
            const name = cmdMembers[0];
            const emoji = members[name]?.emoji || "👤";
            return {
                text: `${emoji} ${name}의 오늘(${displayDate(todayStr)}) **${typeLabel}**를 등록할까요?`,
                needsConfirm: true,
                confirmAction: { type: "calendar", name, dates: [todayStr], calendarType: calType, description: cmd.description || "" },
            };
        }

        const dateList = expandDateRange(dates.start, dates.end);
        const name = cmdMembers[0];
        const emoji = members[name]?.emoji || "👤";
        return {
            text: `${emoji} ${name}의 ${displayDateRange(dates.start, dates.end)} **${typeLabel}**를 등록할까요?`,
            needsConfirm: true,
            confirmAction: { type: "calendar", name, dates: dateList, calendarType: calType, description: cmd.description || "" },
        };
    }

    // ─── 논문 조회 ──────────────────────────────────────────────────────
    if (target === "논문") {
        const memberFilter = cmdMembers.length === 1 && cmdMembers[0] !== cmd.rawText ? cmdMembers : null;
        let items = data.papers.filter(p => p.status !== "completed");
        if (memberFilter) items = items.filter(p => p.assignees.some(a => memberFilter.includes(a)));
        if (items.length === 0) return { text: "📄 진행중인 논문이 없습니다." };
        const lines = items.map(p => {
            const assignees = p.assignees.join(", ");
            const progress = p.progress ? ` (${p.progress}%)` : "";
            return `• **${p.title}**${progress} — ${assignees}`;
        });
        const header = memberFilter ? `${memberFilter.join(", ")}의 논문` : "진행중 논문";
        return { text: `📄 **${header}** (${items.length}건)\n\n${lines.join("\n")}` };
    }

    // ─── 실험 조회 ──────────────────────────────────────────────────────
    if (target === "실험") {
        const memberFilter = cmdMembers.length === 1 && cmdMembers[0] !== cmd.rawText ? cmdMembers : null;
        let items = data.experiments.filter(e => e.status !== "completed");
        if (memberFilter) items = items.filter(e => e.assignees.some(a => memberFilter.includes(a)));
        if (items.length === 0) return { text: "🧪 진행중인 실험이 없습니다." };
        const lines = items.map(e => {
            const assignees = e.assignees.join(", ");
            const progress = e.progress ? ` (${e.progress}%)` : "";
            return `• **${e.title}**${progress} — ${assignees}`;
        });
        const header = memberFilter ? `${memberFilter.join(", ")}의 실험` : "진행중 실험";
        return { text: `🧪 **${header}** (${items.length}건)\n\n${lines.join("\n")}` };
    }

    // ─── 해석 조회 ──────────────────────────────────────────────────────
    if (target === "해석") {
        const memberFilter = cmdMembers.length === 1 && cmdMembers[0] !== cmd.rawText ? cmdMembers : null;
        let items = data.analyses.filter(a => a.status !== "completed");
        if (memberFilter) items = items.filter(a => a.assignees.some(n => memberFilter.includes(n)));
        if (items.length === 0) return { text: "🖥️ 진행중인 해석이 없습니다." };
        const lines = items.map(a => {
            const assignees = a.assignees.join(", ");
            const progress = a.progress ? ` (${a.progress}%)` : "";
            return `• **${a.title}**${progress} — ${assignees}`;
        });
        const header = memberFilter ? `${memberFilter.join(", ")}의 해석` : "진행중 해석";
        return { text: `🖥️ **${header}** (${items.length}건)\n\n${lines.join("\n")}` };
    }

    // ─── 보고서/계획서 조회 ──────────────────────────────────────────────
    if (target === "보고서" || target === "계획서") {
        const memberFilter = cmdMembers.length === 1 && cmdMembers[0] !== cmd.rawText ? cmdMembers : null;
        let items = data.reports.filter(r => r.status !== "done");
        if (memberFilter) items = items.filter(r => r.assignees.some(a => memberFilter.includes(a)));
        if (items.length === 0) return { text: "📋 진행중인 보고서가 없습니다." };
        const lines = items.map(r => {
            const assignees = r.assignees.join(", ");
            return `• **${r.title}** (${r.progress}%) — ${assignees}`;
        });
        const header = memberFilter ? `${memberFilter.join(", ")}의 보고서` : "진행중 보고서";
        return { text: `📋 **${header}** (${items.length}건)\n\n${lines.join("\n")}` };
    }

    // ─── 특허 조회 ──────────────────────────────────────────────────────
    if (target === "특허") {
        const memberFilter = cmdMembers.length === 1 && cmdMembers[0] !== cmd.rawText ? cmdMembers : null;
        let items = data.patents.filter(p => p.status !== "completed");
        if (memberFilter) items = items.filter(p => p.assignees.some(a => memberFilter.includes(a)));
        if (items.length === 0) return { text: "💡 진행중인 특허가 없습니다." };
        const lines = items.map(p => {
            const assignees = p.assignees.join(", ");
            const progress = p.progress ? ` (${p.progress}%)` : "";
            return `• **${p.title}**${progress} — ${assignees}`;
        });
        const header = memberFilter ? `${memberFilter.join(", ")}의 특허` : "진행중 특허";
        return { text: `💡 **${header}** (${items.length}건)\n\n${lines.join("\n")}` };
    }

    // ─── 할일 조회 ──────────────────────────────────────────────────────
    if (target === "할일") {
        const memberFilter = cmdMembers;
        let items = data.todos.filter(t => !t.done);
        if (memberFilter.length > 0) items = items.filter(t => t.assignees.some(a => memberFilter.includes(a)));
        if (items.length === 0) return { text: "✅ 미완료 할일이 없습니다." };
        const lines = items.map(t => {
            const assignees = t.assignees.join(", ");
            const dl = t.deadline ? ` (마감: ${displayDate(t.deadline)})` : "";
            return `• ${t.text}${dl} — ${assignees}`;
        });
        return { text: `✅ **미완료 할일** (${items.length}건)\n\n${lines.join("\n")}` };
    }

    // ─── Fallback ───────────────────────────────────────────────────────
    return {
        text: `🤔 명령을 이해하지 못했습니다.\n\`@AI 도움말\`을 입력하면 사용 가능한 명령어를 확인할 수 있습니다.`,
    };
}
