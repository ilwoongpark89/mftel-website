"use client";

import { useContext, useMemo, memo } from "react";
import type { TeamData, Comment, Paper, Todo, Experiment, Analysis, Patent, Report, Meeting, TeamMemoCard, TeamChatMsg, Memo, DailyTarget, Announcement, IdeaPost, Resource, ConferenceTrip } from "../lib/types";
import { STATUS_CONFIG, STATUS_KEYS, PAPER_STATUS_MIGRATE, REPORT_STATUS_CONFIG, REPORT_STATUS_KEYS, EXP_STATUS_CONFIG, EXP_STATUS_KEYS, EXP_STATUS_MIGRATE, ANALYSIS_STATUS_CONFIG, ANALYSIS_STATUS_KEYS, ANALYSIS_STATUS_MIGRATE, IP_STATUS_CONFIG, IP_STATUS_KEYS, CATEGORY_COLORS, PRIORITY_ICON } from "../lib/constants";
import { MembersContext } from "../lib/contexts";
import { MiniBar } from "./shared";

const SectionSkeleton = ({ rows = 3, className = "" }: { rows?: number; className?: string }) => (
    <div className={`bg-white border border-slate-200 rounded-2xl px-5 py-4 ${className}`}>
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                </div>
            ))}
        </div>
    </div>
);

export const OverviewDashboard = memo(function OverviewDashboard({ papers, reports, experiments, analyses, todos, ipPatents, announcements, dailyTargets, ideas, resources, chatPosts, personalMemos, teamMemos, meetings, conferenceTrips, onlineUsers, currentUser, onNavigate, mode, statusMessages, members, teams, dataLoaded = false }: {
    papers: Paper[]; reports: Report[]; experiments: Experiment[]; analyses: Analysis[]; todos: Todo[]; ipPatents: Patent[]; announcements: Announcement[]; dailyTargets: DailyTarget[]; ideas: IdeaPost[]; resources: Resource[]; chatPosts: IdeaPost[]; personalMemos: Record<string, Memo[]>; teamMemos: Record<string, { kanban: TeamMemoCard[]; chat: TeamChatMsg[] }>; meetings: Meeting[]; conferenceTrips: ConferenceTrip[]; onlineUsers: Array<{ name: string; timestamp: number }>; currentUser: string; onNavigate: (tab: string) => void; mode: "team" | "personal"; statusMessages: Record<string, string>; members: Record<string, { team: string; role: string; emoji: string }>; teams: Record<string, TeamData>; dataLoaded?: boolean;
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

    // Pre-compute member stats (avoid 72 filter() calls per render)
    const memberStats = useMemo(() => {
        const map: Record<string, { papers: number; reports: number; exp: number; analysis: number; todos: number; hasTarget: boolean }> = {};
        for (const name of MEMBER_NAMES) {
            map[name] = { papers: 0, reports: 0, exp: 0, analysis: 0, todos: 0, hasTarget: false };
        }
        for (const p of papers) for (const a of p.assignees) if (map[a]) map[a].papers++;
        for (const r of reports) for (const a of r.assignees) if (map[a]) map[a].reports++;
        for (const e of experiments) for (const a of e.assignees) if (map[a]) map[a].exp++;
        for (const a of analyses) for (const al of a.assignees) if (map[al]) map[al].analysis++;
        for (const t of todos) if (!t.done) for (const a of t.assignees) if (map[a]) map[a].todos++;
        for (const t of todayTargets) if (map[t.name]) map[t.name].hasTarget = true;
        return map;
    }, [papers, reports, experiments, analyses, todos, todayTargets, MEMBER_NAMES]);

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

    // ── Upcoming Deadlines (D-day) ──
    type DeadlineItem = { title: string; deadline: string; dday: number; type: string; color: string; icon: string; tab: string; assignees: string[] };
    const upcomingDeadlines = useMemo(() => {
        const nowMs = today.getTime();
        const items: DeadlineItem[] = [];
        const addItem = (title: string, deadline: string, type: string, color: string, icon: string, tab: string, assignees: string[]) => {
            if (!deadline) return;
            const dMs = new Date(deadline + "T00:00:00").getTime();
            const dday = Math.ceil((dMs - nowMs) / 86400000);
            if (dday >= -7 && dday <= 90) items.push({ title, deadline, dday, type, color, icon, tab, assignees });
        };
        fp.filter(p => p.status !== "completed").forEach(p => addItem(p.title, p.deadline, "논문", CATEGORY_COLORS.paper, "📄", "papers", p.assignees));
        fr.filter(r => r.status !== "done").forEach(r => addItem(r.title, r.deadline, "보고서", CATEGORY_COLORS.report, "📋", "reports", r.assignees));
        ft.filter(t => !t.done).forEach(t => addItem(t.text, t.deadline, "할일", "#F59E0B", "✅", "todos", t.assignees));
        fe.filter(e => e.status !== "completed").forEach(e => addItem(e.title, e.endDate, "실험", CATEGORY_COLORS.experiment, "🧪", "experiments", e.assignees));
        fa.filter(a => a.status !== "completed").forEach(a => addItem(a.title, a.endDate, "해석", CATEGORY_COLORS.analysis, "🖥️", "analysis", a.assignees));
        fip.filter(p => p.status !== "completed").forEach(p => addItem(p.title, p.deadline, "특허", CATEGORY_COLORS.ip, "💡", "ip", p.assignees || []));
        const fconf = isPersonal ? conferenceTrips.filter(c => c.participants.includes(currentUser)) : conferenceTrips;
        fconf.forEach(c => addItem(c.title, c.startDate, "학회", "#60A5FA", "✈️", "conferenceTrips", c.participants));
        items.sort((a, b) => a.dday - b.dday);
        return items;
    }, [fp, fr, ft, fe, fa, fip, conferenceTrips, isPersonal, currentUser, today]);
    const ddayLabel = (d: number) => d === 0 ? "D-Day" : d > 0 ? `D-${d}` : `D+${Math.abs(d)}`;
    const ddayColor = (d: number) => d < 0 ? "#EF4444" : d === 0 ? "#EF4444" : d <= 3 ? "#F97316" : d <= 7 ? "#F59E0B" : "#94A3B8";

    // ── Feedback (comments by others on my items) ──
    const recentFeedback = useMemo(() => {
        if (!isPersonal) return [];
        type FeedbackItem = { author: string; text: string; date: string; itemTitle: string; icon: string; tab: string };
        const fb: FeedbackItem[] = [];
        const collectComments = (items: Array<{ title?: string; text?: string; comments?: Comment[] }>, icon: string, tab: string) => {
            items.forEach(item => {
                (item.comments || []).filter(c => c.author !== currentUser).forEach(c => {
                    fb.push({ author: c.author, text: c.text, date: c.date, itemTitle: (item.title || item.text || "").slice(0, 30), icon, tab });
                });
            });
        };
        collectComments(myPapers, "📄", "papers");
        collectComments(myReports, "📋", "reports");
        collectComments(myExperiments, "🧪", "experiments");
        collectComments(myAnalyses, "🖥️", "analysis");
        collectComments(myTodos as Array<{ title?: string; text?: string; comments?: Comment[] }>, "✅", "todos");
        fb.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return fb.slice(0, 10);
    }, [isPersonal, myPapers, myReports, myExperiments, myAnalyses, myTodos, currentUser]);

    // ── Goal Streak (consecutive weekdays with daily target written) ──
    const goalStreak = useMemo(() => {
        if (!isPersonal) return 0;
        const myTargetDates = new Set(dailyTargets.filter(t => t.name === currentUser).map(t => t.date));
        let streak = 0;
        const d = new Date(today);
        // Start from today (or yesterday if no target today yet)
        if (!myTargetDates.has(todayStr)) d.setDate(d.getDate() - 1);
        // Skip weekends
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
        // Count consecutive weekdays
        for (let i = 0; i < 365; i++) {
            if (d.getDay() === 0 || d.getDay() === 6) { d.setDate(d.getDate() - 1); continue; }
            const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            if (myTargetDates.has(ds)) { streak++; d.setDate(d.getDate() - 1); } else break;
        }
        return streak;
    }, [isPersonal, dailyTargets, currentUser, todayStr, today]);

    return (
        <div className="space-y-5">
            {/* Team mode: page title + date + online users */}
            {!isPersonal && (
                <div className="mb-2">
                    <h2 className="text-[24px] font-bold tracking-tight mb-3 flex items-center gap-2" style={{color:"#0F172A", letterSpacing:"-0.02em", lineHeight:"1.3"}}>🏠 연구실 현황{!dataLoaded && <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}</h2>
                    <div className="flex items-center gap-3 py-1 flex-wrap">
                        <span className="text-[13px] whitespace-nowrap" style={{color:"#94A3B8"}}>{dateLabel}</span>
                        <span className="text-[13px] flex items-center gap-1.5 whitespace-nowrap" style={{color:"#94A3B8"}}>
                            · 접속 중 <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                            <span style={{color:"#10B981", fontWeight:600}}>{onlineUsers.length}명</span>
                        </span>
                        {onlineUsers.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {onlineUsers.map(u => (
                                    <span key={u.name} className="inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{background:"#F0FDF4", color:"#16A34A", border:"1px solid #DCFCE7"}} title={u.name}>{MEMBERS[u.name]?.emoji || "👤"} {u.name}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Personal mode header */}
            {isPersonal && (
                <div>
                    <h2 className="text-[24px] font-bold tracking-tight mb-4 flex items-center gap-2" style={{color:"#0F172A", letterSpacing:"-0.02em", lineHeight:"1.3"}}>👤 개별 현황 ({currentUser}){!dataLoaded && <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}</h2>
                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[18px]" style={{background:"#F1F5F9", border:"2px solid #E2E8F0"}}>{members[currentUser]?.emoji || "👤"}</div>
                            <div>
                                <div className="text-[15px] font-semibold text-slate-800 leading-tight">{currentUser}</div>
                                <div className="text-[12px] text-slate-400">{members[currentUser]?.team} {members[currentUser]?.role && `· ${members[currentUser]?.role}`}</div>
                            </div>
                            {myTarget && (
                                <div className="text-[13px] text-slate-500 max-w-[320px] truncate ml-3 px-3 py-1 rounded-lg" style={{background:"#F8FAFC"}}>📌 {myTarget.text}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {myTarget ? (
                                <span className="px-3 py-1.5 rounded-lg text-[13px] font-medium" style={{background:"#F1F5F9", color:"#94A3B8"}}>✅ 오늘 목표 완료</span>
                            ) : (
                                <button onClick={() => onNavigate("daily")} className="relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors" style={{background:"#EFF6FF", color:"#3B82F6", border:"1px solid #DBEAFE", animation:"subtle-pulse 3s ease-in-out infinite"}} onMouseEnter={e => (e.currentTarget.style.background = "#DBEAFE")} onMouseLeave={e => (e.currentTarget.style.background = "#EFF6FF")}><span className="absolute -top-1 -left-1 w-[6px] h-[6px] rounded-full bg-red-500" />🎯 오늘 목표 작성하기</button>
                            )}
                            {statusMessages[currentUser] ? (
                                <span className="px-3 py-1.5 rounded-lg text-[13px] font-medium" style={{background:"#F1F5F9", color:"#94A3B8"}}>✅ 한마디 완료</span>
                            ) : (
                                <button onClick={() => onNavigate("settings")} className="relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors" style={{background:"#F0FDF4", color:"#16A34A", border:"1px solid #DCFCE7", animation:"subtle-pulse 3s ease-in-out infinite"}} onMouseEnter={e => (e.currentTarget.style.background = "#DCFCE7")} onMouseLeave={e => (e.currentTarget.style.background = "#F0FDF4")}><span className="absolute -top-1 -left-1 w-[6px] h-[6px] rounded-full bg-red-500" />💬 한마디 작성하기</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 1. 긴급 공지 | 일반 공지 | 논의 필요 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                {/* 긴급 공지 */}
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                    <button onClick={() => onNavigate("announcements")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500 flex items-center gap-2">
                            🚨 긴급 공지
                            {urgentAnn.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 text-[11px] font-semibold">{urgentAnn.length}</span>}
                        </h3>
                    </button>
                    {urgentAnn.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">긴급 공지 없음</div>
                    ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                            {urgentAnn.map(ann => (
                                <div key={ann.id} className="p-3 rounded-xl cursor-pointer transition-colors" style={{background:"#FEF2F2", borderLeft:"2px solid #EF4444"}} onMouseEnter={e => (e.currentTarget.style.background = "#FEE2E2")} onMouseLeave={e => (e.currentTarget.style.background = "#FEF2F2")}>
                                    <div className="text-[13px] leading-relaxed" style={{color:"#334155", fontWeight:500}}>{ann.text.length > 50 ? ann.text.slice(0, 50) + "..." : ann.text}</div>
                                    <div className="text-[11px] mt-1" style={{color:"#94A3B8"}}>{members[ann.author]?.emoji} {ann.author} · {ann.date}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 일반 공지 */}
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                    <button onClick={() => onNavigate("announcements")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500 flex items-center gap-2">
                            📌 일반 공지
                            {generalAnn.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[11px] font-semibold">{generalAnn.length}</span>}
                        </h3>
                    </button>
                    {generalAnn.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">일반 공지 없음</div>
                    ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                            {generalAnn.map(ann => (
                                <div key={ann.id} className="p-3 rounded-xl cursor-pointer transition-colors" style={{background:"#EFF6FF", borderLeft:"2px solid #3B82F6"}} onMouseEnter={e => (e.currentTarget.style.background = "#DBEAFE")} onMouseLeave={e => (e.currentTarget.style.background = "#EFF6FF")}>
                                    <div className="text-[13px] leading-relaxed" style={{color:"#334155", fontWeight:500}}>{ann.text.length > 50 ? ann.text.slice(0, 50) + "..." : ann.text}</div>
                                    <div className="text-[11px] mt-1" style={{color:"#94A3B8"}}>{members[ann.author]?.emoji} {ann.author} · {ann.date}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 논의 필요 */}
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500 flex items-center gap-2">
                        {isPersonal ? "내 논의 필요" : "논의 필요"}
                        {discussionItems.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-500 text-[11px] font-semibold">{discussionItems.length}</span>}
                    </h3>
                    {discussionItems.length === 0 ? (
                        <div className="text-[13px] text-slate-300 text-center py-6">논의 필요 항목 없음</div>
                    ) : (
                        <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                            {discussionItems.slice(0, 10).map((item, i) => (
                                <button key={i} onClick={() => onNavigate(item.tab)} className="w-full flex items-start gap-2.5 p-3 rounded-xl text-left transition-all group" style={{background:"#FEF2F2", borderLeft:"2px solid #EF4444"}}>
                                    <span className="text-[13px] mt-0.5">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] text-slate-800 leading-snug truncate group-hover:text-red-600 transition-colors" style={{fontWeight:600}}>{item.title}</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{item.section}</div>
                                    </div>
                                </button>
                            ))}
                            {discussionItems.length > 10 && <div className="text-[12px] text-slate-400 text-center py-1">+{discussionItems.length - 10}개 더</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. 오늘 목표 현황 (team only) */}
            {!isPersonal && (
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                    <button onClick={() => onNavigate("daily")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">
                            오늘 목표 현황
                        </h3>
                    </button>
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex-1 rounded-[4px] h-[8px]" style={{background:"#F1F5F9"}}>
                            <div className="h-[8px] rounded-[4px]" style={{ width: `${MEMBER_NAMES.length > 0 ? (targetsWritten / MEMBER_NAMES.length) * 100 : 0}%`, background: "linear-gradient(90deg, #22C55E, #3B82F6)", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 shrink-0">{targetsWritten}/{MEMBER_NAMES.length}</span>
                    </div>
                    {targetsMissing.length > 0 && (
                        <div className="mb-3">
                            <div className="text-[12px] text-slate-400 mb-1.5">미작성:</div>
                            <div className="flex flex-wrap gap-1.5">
                                {targetsMissing.map(name => (
                                    <span key={name} className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">{MEMBERS[name]?.emoji} {name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {targetsMissing.length === 0 && (
                        <div className="text-[13px] text-emerald-500 font-medium mb-3">전원 작성 완료</div>
                    )}
                    {todayTargets.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                            {todayTargets.map((t, i) => (
                                <div key={t.name} className="flex items-center gap-2" style={{padding:"8px 12px", background:"#FAFBFC", borderBottom: i < todayTargets.length - 1 || (i + 1) % 3 !== 0 ? "1px solid #F1F5F9" : "none"}}>
                                    <span className="text-[14px] shrink-0">{MEMBERS[t.name]?.emoji}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[14px] font-bold text-slate-700">{t.name}</div>
                                        <div className="text-[13px] text-slate-500 truncate">{t.text}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. D-day: 다가오는 마감 */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200" style={{borderTop:"2px solid #F59E0B"}}>
                <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-amber-500 flex items-center gap-2">
                    {isPersonal ? "내 마감 일정" : "다가오는 마감"}
                    {upcomingDeadlines.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[11px] font-semibold">{upcomingDeadlines.length}</span>}
                </h3>
                {upcomingDeadlines.length === 0 ? (
                    <div className="text-[13px] text-slate-300 text-center py-6">예정된 마감 없음</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                        {upcomingDeadlines.slice(0, 20).map((dl, i) => (
                            <button key={`${dl.tab}-${dl.title}-${i}`} onClick={() => onNavigate(dl.tab)} className="rounded-xl p-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5 group" style={{background:`${dl.color}08`, border:`1px solid ${dl.color}30`}}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[12px] font-semibold px-1.5 py-0.5 rounded truncate" style={{background:`${dl.color}18`, color:dl.color}}>{dl.icon} {dl.type}</span>
                                    <span className="text-[13px] font-black flex-shrink-0 ml-1" style={{color:ddayColor(dl.dday)}}>{ddayLabel(dl.dday)}</span>
                                </div>
                                <div className="text-[13px] font-semibold text-slate-800 leading-snug truncate group-hover:text-slate-900">{dl.title}</div>
                                <div className="text-[11px] text-slate-400 mt-1 truncate">{dl.deadline} · {dl.assignees.slice(0, 2).join(", ")}{dl.assignees.length > 2 ? ` +${dl.assignees.length - 2}` : ""}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. 내 To-do (personal only) */}
            {isPersonal && (
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                    <button onClick={() => onNavigate("todos")} className="w-full text-left">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500 flex items-center gap-2">
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
            )}

            {/* 4-team / 5-personal: 멤버별 현황 (team) */}
            {!isPersonal && (
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">멤버별 현황</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]" style={{tableLayout:"fixed", minWidth:"700px"}}>
                            <colgroup>
                                <col style={{width:"72px"}} />
                                <col style={{width:"200px"}} />
                                <col style={{width:"1fr"}} />
                                <col style={{width:"1fr"}} />
                                <col style={{width:"1fr"}} />
                                <col style={{width:"1fr"}} />
                                <col style={{width:"1fr"}} />
                                <col style={{width:"1fr"}} />
                                <col style={{width:"1fr"}} />
                            </colgroup>
                            <thead>
                                <tr style={{borderBottom:"1px solid #F1F5F9"}}>
                                    <th className="text-left py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>멤버</th>
                                    <th className="text-left py-2 px-2" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8"}}>한마디</th>
                                    <th className="text-center py-2 px-1" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", whiteSpace:"nowrap"}}>논문</th>
                                    <th className="text-center py-2 px-1" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", whiteSpace:"nowrap"}}>계획/보고</th>
                                    <th className="text-center py-2 px-1" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", whiteSpace:"nowrap"}}>실험</th>
                                    <th className="text-center py-2 px-1" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", whiteSpace:"nowrap"}}>해석</th>
                                    <th className="text-center py-2 px-1" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", whiteSpace:"nowrap"}}>To-do</th>
                                    <th className="text-center py-2 px-1" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", whiteSpace:"nowrap"}}>목표</th>
                                    <th className="text-center py-2 px-1" style={{fontSize:"11.5px", fontWeight:600, color:"#94A3B8", whiteSpace:"nowrap"}}>접속</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MEMBER_NAMES.map(name => {
                                    const isMe = name === currentUser;
                                    const isOnline = onlineUsers.some(u => u.name === name);
                                    const ms = memberStats[name];
                                    return (
                                        <tr key={name} className={`${isMe ? "bg-blue-50/30" : "hover:bg-[#F8FAFC]"} transition-colors`} style={{borderBottom:"1px solid #F8FAFC"}}>
                                            <td className="py-2.5 px-2 whitespace-nowrap" style={{fontWeight:500, color:"#334155"}}>
                                                {members[name]?.emoji} {name}
                                            </td>
                                            <td className="py-2.5 px-2">
                                                {statusMessages[name] && <span className="text-[11px] text-blue-500/80 italic truncate block">&ldquo;{statusMessages[name]}&rdquo;</span>}
                                            </td>
                                            <td className="text-center py-2.5 px-1"><span style={{fontWeight: ms.papers > 0 ? 650 : 400, color: ms.papers > 0 ? "#334155" : "#CBD5E1"}}>{ms.papers || "-"}</span></td>
                                            <td className="text-center py-2.5 px-1"><span style={{fontWeight: ms.reports > 0 ? 650 : 400, color: ms.reports > 0 ? "#334155" : "#CBD5E1"}}>{ms.reports || "-"}</span></td>
                                            <td className="text-center py-2.5 px-1"><span style={{fontWeight: ms.exp > 0 ? 650 : 400, color: ms.exp > 0 ? "#334155" : "#CBD5E1"}}>{ms.exp || "-"}</span></td>
                                            <td className="text-center py-2.5 px-1"><span style={{fontWeight: ms.analysis > 0 ? 650 : 400, color: ms.analysis > 0 ? "#334155" : "#CBD5E1"}}>{ms.analysis || "-"}</span></td>
                                            <td className="text-center py-2.5 px-1"><span style={{fontWeight: ms.todos > 0 ? 650 : 400, color: ms.todos > 0 ? "#334155" : "#CBD5E1"}}>{ms.todos || "-"}</span></td>
                                            <td className="text-center py-2.5 px-1">{ms.hasTarget ? <span className="text-emerald-500 font-bold">O</span> : <span className="text-red-400">X</span>}</td>
                                            <td className="text-center py-2.5 px-1">{isOnline ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-200" />}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 5. 연구 파이프라인 */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200" style={{borderTop:"2px solid #3B82F6"}}>
                <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">{isPersonal ? "내 연구 파이프라인" : "연구 파이프라인"}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                    <button onClick={() => onNavigate("papers")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.paper}} />논문 <span className="font-bold" style={{color:"#334155"}}>({fp.length})</span>
                        </div>
                        <MiniBar items={papersByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...papersByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("reports")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.report}} />계획서/보고서 <span className="font-bold" style={{color:"#334155"}}>({fr.length})</span>
                        </div>
                        <MiniBar items={reportsByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...reportsByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("experiments")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.experiment}} />실험 <span className="font-bold" style={{color:"#334155"}}>({fe.length})</span>
                        </div>
                        <MiniBar items={expByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...expByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("analysis")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.analysis}} />해석 <span className="font-bold" style={{color:"#334155"}}>({fa.length})</span>
                        </div>
                        <MiniBar items={analysisByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...analysisByStatus.map(s => s.count))} />
                    </button>
                    <button onClick={() => onNavigate("ip")} className="text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors">
                        <div className="text-[13px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS.ip}} />지식재산권 <span className="font-bold" style={{color:"#334155"}}>({fip.length})</span>
                        </div>
                        <MiniBar items={patentsByStatus.map(s => ({ label: s.label, count: s.count, color: s.color }))} maxVal={Math.max(1, ...patentsByStatus.map(s => s.count))} />
                    </button>
                </div>
            </div>

            {/* 6-personal: 내 전체 현황 */}
            {isPersonal && (
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">내 전체 현황</h3>
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
            )}

            {/* 7-personal: 피드백 + 스트릭 */}
            {isPersonal && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* 나에게 온 피드백 */}
                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500 flex items-center gap-2">
                            나에게 온 피드백
                            {recentFeedback.length > 0 && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[11px] font-semibold">{recentFeedback.length}</span>}
                        </h3>
                        {recentFeedback.length === 0 ? (
                            <div className="text-[13px] text-slate-300 text-center py-6">피드백 없음</div>
                        ) : (
                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                                {recentFeedback.map((fb, i) => (
                                    <button key={i} onClick={() => onNavigate(fb.tab)} className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors hover:bg-slate-50" style={{background:"#F8FAFC"}}>
                                        <span className="text-[14px] mt-0.5">{fb.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] text-slate-700 leading-snug"><span className="font-semibold">{MEMBERS[fb.author]?.emoji} {fb.author}</span> <span className="text-slate-400">→</span> <span className="text-slate-500">{fb.itemTitle}</span></div>
                                            <div className="text-[12px] text-slate-500 mt-0.5 truncate">{fb.text}</div>
                                            <div className="text-[11px] text-slate-300 mt-0.5">{fb.date}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 목표 스트릭 */}
                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">목표 스트릭</h3>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="text-center">
                                <div className="text-[36px] font-black" style={{color: goalStreak >= 5 ? "#22C55E" : goalStreak >= 1 ? "#3B82F6" : "#CBD5E1", lineHeight:1}}>{goalStreak}</div>
                                <div className="text-[12px] text-slate-400 mt-1">연속 일수</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-[13px] text-slate-600 leading-relaxed">
                                    {goalStreak === 0 ? "오늘 목표를 작성하고 스트릭을 시작하세요!" :
                                     goalStreak < 5 ? `${goalStreak}일 연속 작성 중! 계속 이어가세요.` :
                                     goalStreak < 20 ? `${goalStreak}일 연속! 대단해요!` :
                                     `${goalStreak}일 연속 달성! 놀라운 꾸준함입니다!`}
                                </div>
                                {goalStreak === 0 && !myTarget && (
                                    <button onClick={() => onNavigate("daily")} className="mt-2 text-[12px] px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors">🎯 목표 작성하기</button>
                                )}
                            </div>
                        </div>
                        {/* Mini heatmap — last 14 weekdays */}
                        {(() => {
                            const myTargetDates = new Set(dailyTargets.filter(t => t.name === currentUser).map(t => t.date));
                            const cells: Array<{ date: string; has: boolean; label: string }> = [];
                            const d = new Date(today);
                            for (let i = 0; cells.length < 14; i++) {
                                if (i > 30) break;
                                if (d.getDay() !== 0 && d.getDay() !== 6) {
                                    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                    cells.unshift({ date: ds, has: myTargetDates.has(ds), label: `${d.getMonth() + 1}/${d.getDate()}` });
                                }
                                d.setDate(d.getDate() - 1);
                            }
                            return (
                                <div className="flex gap-1 mt-2">
                                    {cells.map(c => (
                                        <div key={c.date} className="flex-1 h-[28px] rounded-md flex items-center justify-center text-[11px] font-medium transition-colors" title={c.date}
                                            style={{background: c.has ? "#22C55E" : "#F1F5F9", color: c.has ? "white" : "#94A3B8"}}>
                                            {c.label.split("/")[1]}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* 6-team: 팀별 현황 (team only) */}
            {!isPersonal && (() => {
                const hasTeams = Object.keys(teams).length > 0;
                if (!hasTeams) return (
                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                        <h3 className="text-[16px] font-bold text-slate-900 mb-3 pl-2 border-l-[3px] border-blue-500">팀별 연구 현황</h3>
                        <div className="text-[13px] text-slate-300 text-center py-6">등록된 팀 없음</div>
                    </div>
                );
                const teamEntries: Array<{ name: string; members: string[]; color: string }> = hasTeams
                    ? Object.entries(teams).map(([name, t]) => ({ name, members: t.members, color: t.color }))
                    : [...new Set(Object.values(members).map(m => m.team))].filter(t => t !== "PI").map(t => ({
                        name: t,
                        members: Object.entries(members).filter(([, m]) => m.team === t).map(([n]) => n),
                        color: "#94a3b8",
                    }));
                return (
                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[16px] font-bold text-slate-900 pl-2 border-l-[3px] border-blue-500">팀별 연구 현황</h3>
                            <div className="flex items-center gap-3 flex-wrap">
                                {[{label:"논문",color:CATEGORY_COLORS.paper},{label:"계획/보고",color:CATEGORY_COLORS.report},{label:"실험",color:CATEGORY_COLORS.experiment},{label:"해석",color:CATEGORY_COLORS.analysis},{label:"지식재산권",color:CATEGORY_COLORS.ip}].map(c => (
                                    <span key={c.label} className="flex items-center gap-1 text-[11px] whitespace-nowrap" style={{color:"#94A3B8"}}><span className="w-2 h-2 rounded-sm" style={{background:c.color}} />{c.label}</span>
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
                                                {team.tPapers > 0 && <span className="text-[11px] whitespace-nowrap" style={{color:CATEGORY_COLORS.paper}}>논문 {team.tPapers}</span>}
                                                {team.tReports > 0 && <span className="text-[11px] whitespace-nowrap" style={{color:CATEGORY_COLORS.report}}>계획/보고 {team.tReports}</span>}
                                                {team.tExp > 0 && <span className="text-[11px] whitespace-nowrap" style={{color:CATEGORY_COLORS.experiment}}>실험 {team.tExp}</span>}
                                                {team.tAnalysis > 0 && <span className="text-[11px] whitespace-nowrap" style={{color:CATEGORY_COLORS.analysis}}>해석 {team.tAnalysis}</span>}
                                                {team.tPatents > 0 && <span className="text-[11px] whitespace-nowrap" style={{color:CATEGORY_COLORS.ip}}>지식재산권 {team.tPatents}</span>}
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
});
