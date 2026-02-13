"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useContext, startTransition } from "react";

// ─── Lib imports ────────────────────────────────────────────────────────────
import type { TeamData, Paper, Todo, Experiment, Analysis, Patent, Report, Meeting, TeamMemoCard, TeamChatMsg, LabFile, ConferenceTrip, IdeaPost, Memo, Resource, DailyTarget, Announcement, VacationEntry, ScheduleEvent, TimetableBlock, ExpLogEntry, AnalysisLogEntry, MenuConfig } from "./lib/types";
import { DEFAULT_MEMBERS, MEMBERS, MEMBER_NAMES, STATUS_CONFIG, STATUS_KEYS, PAPER_TAGS, DEFAULT_EQUIPMENT, ANALYSIS_TOOLS, CALENDAR_TYPES, CATEGORY_COLORS, DEFAULT_TEAMS, DEFAULT_PAPERS, DEFAULT_TODOS, DEFAULT_EXPERIMENTS, DEFAULT_PATENTS, DEFAULT_TIMETABLE, MEMO_COLORS } from "./lib/constants";
import { genId, stripMsgFlags, renderChatMessage, saveDraft, loadDraft, clearDraft, hasDraft, chatKeyDown } from "./lib/utils";
import type { DashboardData } from "./lib/aiBot";
import { MembersContext, ConfirmDeleteContext, SavingContext } from "./lib/contexts";
import { useConfirmDelete, useCommentImg } from "./lib/hooks";
import dynamic from "next/dynamic";
import { LoginScreen } from "./components/LoginScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ColorPicker, SavingBadge } from "./components/shared";

// ─── Lazy-loaded components (code splitting) ─────────────────────────────────
const OverviewDashboard = dynamic(() => import("./components/OverviewDashboard").then(m => ({ default: m.OverviewDashboard })), { ssr: false });
const PaperFormModal = dynamic(() => import("./components/KanbanView").then(m => ({ default: m.PaperFormModal })), { ssr: false });
const KanbanView = dynamic(() => import("./components/KanbanView").then(m => ({ default: m.KanbanView })), { ssr: false });
const ReportView = dynamic(() => import("./components/ReportView").then(m => ({ default: m.ReportView })), { ssr: false });
const ExperimentView = dynamic(() => import("./components/ExperimentView").then(m => ({ default: m.ExperimentView })), { ssr: false });
const AnalysisView = dynamic(() => import("./components/AnalysisView").then(m => ({ default: m.AnalysisView })), { ssr: false });
const IPView = dynamic(() => import("./components/IPView").then(m => ({ default: m.IPView })), { ssr: false });
const TodoList = dynamic(() => import("./components/TodoList").then(m => ({ default: m.TodoList })), { ssr: false });
const CalendarGrid = dynamic(() => import("./components/CalendarView").then(m => ({ default: m.CalendarGrid })), { ssr: false });
const TimetableView = dynamic(() => import("./components/TimetableView").then(m => ({ default: m.TimetableView })), { ssr: false });
const LabChatView = dynamic(() => import("./components/ChatViews").then(m => ({ default: m.LabChatView })), { ssr: false });
const TeamOverview = dynamic(() => import("./components/TeamViews").then(m => ({ default: m.TeamOverview })), { ssr: false });
const TeamMemoView = dynamic(() => import("./components/TeamViews").then(m => ({ default: m.TeamMemoView })), { ssr: false });
const PersonalMemoView = dynamic(() => import("./components/PersonalMemoView").then(m => ({ default: m.PersonalMemoView })), { ssr: false });
const MeetingView = dynamic(() => import("./components/MeetingView").then(m => ({ default: m.MeetingView })), { ssr: false });
const DailyTargetView = dynamic(() => import("./components/MiscViews").then(m => ({ default: m.DailyTargetView })), { ssr: false });
const ConferenceTripView = dynamic(() => import("./components/MiscViews").then(m => ({ default: m.ConferenceTripView })), { ssr: false });
const ResourceView = dynamic(() => import("./components/MiscViews").then(m => ({ default: m.ResourceView })), { ssr: false });
const IdeasView = dynamic(() => import("./components/MiscViews").then(m => ({ default: m.IdeasView })), { ssr: false });
const AnnouncementView = dynamic(() => import("./components/MiscViews").then(m => ({ default: m.AnnouncementView })), { ssr: false });
const ExpLogView = dynamic(() => import("./components/LogViews").then(m => ({ default: m.ExpLogView })), { ssr: false });
const AnalysisLogView = dynamic(() => import("./components/LogViews").then(m => ({ default: m.AnalysisLogView })), { ssr: false });
const SettingsView = dynamic(() => import("./components/SettingsView").then(m => ({ default: m.SettingsView })), { ssr: false });
const AdminMemberView = dynamic(() => import("./components/AdminView").then(m => ({ default: m.AdminMemberView })), { ssr: false });
const AdminBackupView = dynamic(() => import("./components/AdminView").then(m => ({ default: m.AdminBackupView })), { ssr: false });
const AdminAccessLogView = dynamic(() => import("./components/AdminView").then(m => ({ default: m.AdminAccessLogView })), { ssr: false });
const AdminMenuView = dynamic(() => import("./components/AdminView").then(m => ({ default: m.AdminMenuView })), { ssr: false });
const AiBotChat = dynamic(() => import("./components/AiBotChat").then(m => ({ default: m.AiBotChat })), { ssr: false });

// ─── Main Dashboard ──────────────────────────────────────────────────────────

// ─── Chat with AI Tab (board + ideas + AI bot) ──────────────────────────────
function ChatWithAiTab({ userName, aiBotChat, handleAddAiBotChat, handleUpdateAiBotChat, handleDeleteAiBotChat, handleClearAiBotChat, dashboardData, handleCalendarToggle, readReceipts, board, onSaveBoard, onDeleteBoard }: {
    userName: string;
    aiBotChat: TeamChatMsg[]; handleAddAiBotChat: (msg: TeamChatMsg) => void; handleUpdateAiBotChat: (msg: TeamChatMsg) => void; handleDeleteAiBotChat: (id: number) => void; handleClearAiBotChat: () => void;
    dashboardData: DashboardData; handleCalendarToggle: (name: string, date: string, type: string | null, desc?: string) => void;
    readReceipts?: Record<string, number>;
    board: TeamMemoCard[]; onSaveBoard: (c: TeamMemoCard) => void; onDeleteBoard: (id: number) => void;
}) {
    const MCTX = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [mobileTab, setMobileTab] = useState<"board" | "bot">("bot");
    // Board state
    const [boardAdding, setBoardAdding] = useState(false);
    const [boardTitle, setBoardTitle] = useState("");
    const [boardContent, setBoardContent] = useState("");
    const [boardColor, setBoardColor] = useState(MEMO_COLORS[0]);
    const [selectedCard, setSelectedCard] = useState<TeamMemoCard | null>(null);
    const [boardComment, setBoardComment] = useState("");
    const [boardEditing, setBoardEditing] = useState(false);
    const boardImg = useCommentImg();
    const boardCmtImg = useCommentImg();
    const openBoardDetail = (card: TeamMemoCard) => { setSelectedCard(card); setBoardComment(loadDraft(`comment_aibotboard_${card.id}`)); };
    useEffect(() => { if (selectedCard) saveDraft(`comment_aibotboard_${selectedCard.id}`, boardComment); }, [boardComment, selectedCard?.id]);
    const openBoardAdd = () => { setBoardAdding(true); setBoardTitle(""); setBoardContent(""); setBoardColor(MEMO_COLORS[0]); boardImg.clear(); };
    const saveBoard = () => {
        onSaveBoard({ id: genId(), title: boardTitle.trim() || "제목 없음", content: boardContent, status: "left", color: boardColor, author: userName, updatedAt: new Date().toISOString().split("T")[0], imageUrl: boardImg.img || undefined });
        setBoardAdding(false); boardImg.clear();
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Mobile tab toggle */}
            <div className="flex md:hidden border-b border-slate-200 mb-2 flex-shrink-0">
                {([["board", "📌", "보드"], ["bot", "🤖", "AI 봇"]] as const).map(([id, icon, label]) => (
                    <button key={id} onClick={() => setMobileTab(id as typeof mobileTab)}
                        className={`flex-1 py-2 text-[13px] font-medium transition-colors ${mobileTab === id ? "text-blue-600 border-b-2 border-blue-500" : "text-slate-400"}`}>
                        {icon} {label}
                    </button>
                ))}
            </div>
            {/* Desktop: 2fr 3fr grid (board + AI chat) / Mobile: tab switching */}
            <div className="flex flex-col md:grid md:gap-3 flex-1 min-h-0 overflow-hidden" style={{ gridTemplateColumns: "2fr 3fr" }}>
                {/* Board - 2-column card grid */}
                <div className={`flex-col min-w-0 ${mobileTab === "board" ? "flex flex-1 min-h-0" : "hidden"} md:flex md:min-h-0`}>
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <h3 className="text-[14px] font-bold text-slate-700">📌 보드</h3>
                        <button onClick={openBoardAdd} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors"><span className="text-[14px]">+</span> 새 글 작성</button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                            {board.map(card => {
                                const cmts = card.comments || [];
                                return (
                                    <div key={card.id} onClick={() => openBoardDetail(card)}
                                        className="rounded-xl p-3 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col group relative"
                                        style={{ background: card.color || "#fff", border: "1px solid #E2E8F0", borderLeft: card.needsDiscussion ? "3px solid #EF4444" : undefined }}>
                                        <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={!!card.needsDiscussion} onChange={() => onSaveBoard({ ...card, needsDiscussion: !card.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                            <span className={`text-[11px] font-medium ${card.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                        </label>
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="text-[13px] font-semibold text-slate-800 break-words flex-1">{card.title}<SavingBadge id={card.id} /></h4>
                                            <span className="text-[11px] text-slate-400 ml-1 whitespace-nowrap">{card.updatedAt}</span>
                                        </div>
                                        {card.content && <div className="text-[11px] text-slate-600 mb-2 line-clamp-2 break-words">{card.content}</div>}
                                        <div className="text-[11px] text-slate-400 mb-1">{MCTX[card.author]?.emoji || "👤"} {card.author}</div>
                                        {cmts.length > 0 ? (
                                            <div className="border-t border-slate-100 pt-1.5 mt-auto space-y-0.5">
                                                <div className="text-[11px] font-semibold text-slate-400">💬 댓글 {cmts.length}개</div>
                                                {cmts.slice(-2).map(c => (
                                                    <div key={c.id} className="text-[11px] text-slate-500 truncate">
                                                        <span className="font-medium text-slate-600">{MCTX[c.author]?.emoji}{c.author}</span> {renderChatMessage(c.text)}{c.imageUrl && " 📷"}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border-t border-slate-100 pt-1.5 mt-auto">
                                                <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {board.length === 0 && (
                                <button onClick={openBoardAdd} className="col-span-2 w-full py-6 flex items-center justify-center gap-1 text-[13px] text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><span className="text-[14px]">+</span> 새 글 작성</button>
                            )}
                        </div>
                    </div>
                </div>
                {/* AI Bot Chat */}
                <div className={`flex flex-col min-h-0 ${mobileTab !== "bot" ? "hidden md:flex" : "flex"}`}>
                    <AiBotChat messages={aiBotChat} currentUser={userName}
                        onAddMessage={handleAddAiBotChat} onUpdateMessage={handleUpdateAiBotChat}
                        onDeleteMessage={handleDeleteAiBotChat} onClearChat={handleClearAiBotChat}
                        dashboardData={dashboardData}
                        onCalendarToggle={handleCalendarToggle} readReceipts={readReceipts} />
                </div>
            </div>
            {/* Board add modal */}
            {boardAdding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setBoardAdding(false); boardImg.clear(); }}>
                    <div className="bg-white rounded-xl w-full shadow-2xl" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">새 글 작성</h3>
                            <button onClick={() => { setBoardAdding(false); boardImg.clear(); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={boardTitle} onChange={e => setBoardTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40" style={{height:48}} onPaste={boardImg.onPaste} />
                            <textarea value={boardContent} onChange={e => setBoardContent(e.target.value)} placeholder="내용을 입력하세요... (Ctrl+V로 이미지 붙여넣기)" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" style={{minHeight:200}} onPaste={boardImg.onPaste} onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.max(200, t.scrollHeight) + "px"; }} />
                            {boardImg.preview}
                            <ColorPicker color={boardColor} onColor={setBoardColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => { setBoardAdding(false); boardImg.clear(); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveBoard} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardImg.uploading ? "⏳" : "게시"}</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Board detail modal */}
            {selectedCard && !boardEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setSelectedCard(null); setBoardComment(""); }}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selectedCard.title}</h3>
                            <button onClick={() => { setSelectedCard(null); setBoardComment(""); }} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="text-[12px] text-slate-400 mb-3">{MCTX[selectedCard.author]?.emoji || "👤"} {selectedCard.author} · {selectedCard.updatedAt}</div>
                            {selectedCard.content && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap break-words">{selectedCard.content}</div>}
                            {selectedCard.imageUrl && <img src={selectedCard.imageUrl} alt="" className="max-w-full max-h-[300px] rounded-md mb-4" />}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({(selectedCard.comments || []).length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {(selectedCard.comments || []).map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group/c relative">
                                            <button onClick={() => confirmDel(() => { const updated = { ...selectedCard, comments: (selectedCard.comments || []).filter(x => x.id !== c.id) }; onSaveBoard(updated); setSelectedCard(updated); })}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover/c:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4 break-words">{renderChatMessage(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mt-1" />}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{MCTX[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {(selectedCard.comments || []).length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                {boardCmtImg.preview}
                                <div className="flex gap-2 items-center">
                                    <input value={boardComment} onChange={e => setBoardComment(e.target.value)} placeholder="댓글 작성... (Ctrl+V 이미지)"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onPaste={boardCmtImg.onPaste}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!boardComment.trim() && !boardCmtImg.img) return; clearDraft(`comment_aibotboard_${selectedCard.id}`); const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: genId(), author: userName, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: boardCmtImg.img || undefined }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); boardCmtImg.clear(); } }} />
                                    <button onClick={() => { if (!boardComment.trim() && !boardCmtImg.img) return; clearDraft(`comment_aibotboard_${selectedCard.id}`); const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: genId(), author: userName, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: boardCmtImg.img || undefined }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); boardCmtImg.clear(); }}
                                        className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardCmtImg.uploading ? "⏳" : "전송"}</button>
                                </div>
                                {boardComment && hasDraft(`comment_aibotboard_${selectedCard.id}`) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            {(userName === selectedCard.author || userName === "박일웅") && (
                                <button onClick={() => { setBoardTitle(selectedCard.title); setBoardContent(selectedCard.content); setBoardColor(selectedCard.color); setBoardEditing(true); }} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                            )}
                            <div className="flex items-center gap-3">
                                {(userName === selectedCard.author || userName === "박일웅") && (
                                    <button onClick={() => confirmDel(() => { onDeleteBoard(selectedCard.id); setSelectedCard(null); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={() => { setSelectedCard(null); setBoardComment(""); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Board edit modal */}
            {selectedCard && boardEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setBoardEditing(false); boardImg.clear(); }}>
                    <div className="bg-white rounded-xl w-full shadow-2xl" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">글 수정</h3>
                            <button onClick={() => { setBoardEditing(false); boardImg.clear(); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">제목 *</label>
                                <input value={boardTitle} onChange={e => setBoardTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" style={{height:48}} onPaste={boardImg.onPaste} />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">내용</label>
                                <textarea value={boardContent} onChange={e => setBoardContent(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" style={{minHeight:200}} onPaste={boardImg.onPaste} onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.max(200, t.scrollHeight) + "px"; }} />
                            </div>
                            {boardImg.preview}
                            <ColorPicker color={boardColor} onColor={setBoardColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => { setBoardEditing(false); boardImg.clear(); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={() => { const updated = { ...selectedCard, title: boardTitle.trim() || "제목 없음", content: boardContent, color: boardColor, updatedAt: new Date().toISOString().split("T")[0], imageUrl: boardImg.img || undefined }; onSaveBoard(updated); setSelectedCard(updated); setBoardEditing(false); boardImg.clear(); }} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardImg.uploading ? "⏳" : "저장"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Default Menu Config Generator ──────────────────────────────────────────
const DEFAULT_MENU_ITEMS: Array<{ key: string; name: string; emoji: string; section: string }> = [
    // 대시보드
    { key: "overview", name: "연구실 현황", emoji: "🏠", section: "대시보드" },
    { key: "overview_me", name: "개별 현황", emoji: "👤", section: "대시보드" },
    { key: "labChat", name: "연구실 채팅", emoji: "💬", section: "대시보드" },
    { key: "chat", name: "잡담 with AI", emoji: "💡", section: "대시보드" },
    // 운영
    { key: "announcements", name: "공지사항", emoji: "📢", section: "운영" },
    { key: "calendar", name: "일정/휴가", emoji: "📅", section: "운영" },
    { key: "daily", name: "오늘 목표", emoji: "🎯", section: "운영" },
    // 내 노트
    { key: "todos", name: "To-do", emoji: "✅", section: "내 노트" },
    // 연구
    { key: "papers", name: "논문", emoji: "📄", section: "연구" },
    { key: "reports", name: "계획서/보고서", emoji: "📋", section: "연구" },
    { key: "ip", name: "지식재산권", emoji: "💡", section: "연구" },
    { key: "experiments", name: "실험", emoji: "🧪", section: "연구" },
    { key: "analysis", name: "해석", emoji: "🖥️", section: "연구" },
    // 커뮤니케이션
    { key: "conferenceTrips", name: "학회/출장", emoji: "✈️", section: "커뮤니케이션" },
    { key: "meetings", name: "회의록", emoji: "📝", section: "커뮤니케이션" },
    { key: "resources", name: "자료", emoji: "📁", section: "커뮤니케이션" },
    { key: "ideas", name: "아이디어", emoji: "💡", section: "커뮤니케이션" },
    { key: "lectures", name: "수업", emoji: "📚", section: "커뮤니케이션" },
];

function buildDefaultMenuConfig(): MenuConfig[] {
    return DEFAULT_MENU_ITEMS.map((item, i) => ({
        key: item.key,
        name: item.name,
        emoji: item.emoji,
        sortOrder: i,
        isActive: true,
        section: item.section,
    }));
}

/** Merge saved config with defaults to ensure new menus appear */
function mergeMenuConfig(saved: MenuConfig[]): MenuConfig[] {
    const savedMap = new Map(saved.map(s => [s.key, s]));
    const result: MenuConfig[] = [];
    // Keep saved items (preserving order/settings)
    for (const s of saved) result.push(s);
    // Add any new defaults not in saved
    for (const def of DEFAULT_MENU_ITEMS) {
        if (!savedMap.has(def.key)) {
            result.push({ key: def.key, name: def.name, emoji: def.emoji, sortOrder: result.length, isActive: true, section: def.section });
        }
    }
    return result;
}

export default function DashboardPage() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");
    const [mustChangePassword, setMustChangePassword] = useState(false);
    // If no saved token, skip loading screen and show login immediately
    const [authChecked, setAuthChecked] = useState(() => {
        if (typeof window === "undefined") return false;
        return !localStorage.getItem("mftel-auth-token");
    });
    const [activeTab, setActiveTab] = useState("overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cmdKOpen, setCmdKOpen] = useState(false);
    const [cmdKQuery, setCmdKQuery] = useState("");
    const [debouncedCmdKQuery, setDebouncedCmdKQuery] = useState("");
    const [cmdKIdx, setCmdKIdx] = useState(0);
    const cmdKRef = useRef<HTMLInputElement>(null);
    const cmdKListRef = useRef<HTMLDivElement>(null);
    const scrollPositionsRef = useRef<Record<string, number>>({});
    const mainContentRef = useRef<HTMLDivElement>(null);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiLogs, setNotiLogs] = useState<Array<{ userName: string; section: string; action: string; timestamp: number; detail?: string }>>([]);
    const [notiLastSeen, setNotiLastSeen] = useState(0);
    const [selectedPerson, setSelectedPerson] = useState("전체");
    const [onlineUsers, setOnlineUsers] = useState<Array<{ name: string; timestamp: number }>>([]);
    const [members, setMembers] = useState<Record<string, { team: string; role: string; emoji: string }>>(DEFAULT_MEMBERS);
    const memberNames = useMemo(() => Object.keys(members).filter(k => k !== "박일웅"), [members]);
    const { confirm: confirmDel, dialog: confirmDialog } = useConfirmDelete();

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
    const [casualChat, setCasualChat] = useState<TeamChatMsg[]>([]);
    const [aiBotChat, setAiBotChat] = useState<TeamChatMsg[]>([]);
    const [aiBotBoard, setAiBotBoard] = useState<TeamMemoCard[]>([]);
    const [labFiles, setLabFiles] = useState<LabFile[]>([]);
    const [labBoard, setLabBoard] = useState<TeamMemoCard[]>([]);
    const [chatReadTs, setChatReadTs] = useState<Record<string, number>>({});
    const [readReceipts, setReadReceipts] = useState<Record<string, Record<string, number>>>({});
    const [pushPrefs, setPushPrefs] = useState<Record<string, Record<string, boolean>>>({});
    const [notiSettingsOpen, setNotiSettingsOpen] = useState(false);
    const [experimentLogs, setExperimentLogs] = useState<Record<string, ExpLogEntry[]>>({});
    const [analysisLogs, setAnalysisLogs] = useState<Record<string, AnalysisLogEntry[]>>({});
    const [expLogCategories, setExpLogCategories] = useState<Record<string, Array<{name: string; members: string[]}>>>({});
    const [analysisLogCategories, setAnalysisLogCategories] = useState<Record<string, Array<{name: string; members: string[]}>>>({});
    const [showExpMgr, setShowExpMgr] = useState(false);
    const [showAnalysisMgr, setShowAnalysisMgr] = useState(false);
    const [showTeamLayoutSettings, setShowTeamLayoutSettings] = useState(false);
    const [showPersonalLayoutSettings, setShowPersonalLayoutSettings] = useState(false);
    const [newExpCat, setNewExpCat] = useState("");
    const [newAnalysisCat, setNewAnalysisCat] = useState("");
    const [editingCat, setEditingCat] = useState<string | null>(null);
    const [editingCatVal, setEditingCatVal] = useState("");
    const [dataLoaded, setDataLoaded] = useState(false);
    const [menuConfig, setMenuConfig] = useState<MenuConfig[]>(buildDefaultMenuConfig());

    // Build a lookup map from menuConfig for active/name/emoji overrides
    const menuConfigMap = useMemo(() => {
        const m = new Map<string, MenuConfig>();
        for (const mc of menuConfig) m.set(mc.key, mc);
        return m;
    }, [menuConfig]);

    const tabs = useMemo(() => {
        // Helper: apply menuConfig overrides (name, emoji) and check visibility
        const mc = (key: string, defaultLabel: string, defaultIcon: string) => {
            const cfg = menuConfigMap.get(key);
            if (cfg && !cfg.isActive) return null; // hidden
            return { id: key, label: cfg?.name || defaultLabel, icon: cfg?.emoji || defaultIcon };
        };

        // Section builders - order within each section follows menuConfig sortOrder
        const sectionItems = (sectionName: string, defaults: Array<{ key: string; label: string; icon: string; color?: string }>) => {
            // Get menuConfig items for this section, sorted by sortOrder
            const sectionConfig = menuConfig.filter(c => c.section === sectionName).sort((a, b) => a.sortOrder - b.sortOrder);
            if (sectionConfig.length === 0) {
                // No config for this section, use defaults
                return defaults.map(d => mc(d.key, d.label, d.icon)).filter(Boolean) as Array<{ id: string; label: string; icon: string; color?: string }>;
            }
            const result: Array<{ id: string; label: string; icon: string; color?: string }> = [];
            for (const cfg of sectionConfig) {
                if (!cfg.isActive) continue;
                const def = defaults.find(d => d.key === cfg.key);
                if (def) {
                    result.push({ id: cfg.key, label: cfg.name, icon: cfg.emoji, color: def.color });
                } else if (cfg.isClone) {
                    // Cloned item - use the clone source's default or just use config values
                    result.push({ id: cfg.key, label: cfg.name, icon: cfg.emoji });
                }
            }
            // Add any defaults not in config
            for (const def of defaults) {
                if (!sectionConfig.some(c => c.key === def.key) && !result.some(r => r.id === def.key)) {
                    result.push({ id: def.key, label: def.label, icon: def.icon, color: def.color });
                }
            }
            return result;
        };

        const dashboard = sectionItems("대시보드", [
            { key: "overview", label: "연구실 현황", icon: "🏠" },
            { key: "overview_me", label: `개별 현황 (${userName})`, icon: "👤" },
            { key: "labChat", label: "연구실 채팅", icon: "💬" },
            { key: "chat", label: "잡담 with AI", icon: "💡" },
        ]);
        // For overview_me, always append userName
        for (const t of dashboard) {
            if (t.id === "overview_me" && !t.label.includes(userName)) t.label = `${t.label} (${userName})`;
        }

        const ops = sectionItems("운영", [
            { key: "announcements", label: "공지사항", icon: "📢" },
            { key: "calendar", label: "일정/휴가", icon: "📅" },
            { key: "daily", label: "오늘 목표", icon: "🎯" },
        ]);

        // 팀 워크 (dynamic - not in menuConfig)
        const teamTabs = (userName === "박일웅" ? teamNames : teamNames.filter(t => teams[t]?.lead === userName || teams[t]?.members?.includes(userName))).map(t =>
            ({ id: `teamMemo_${t}`, label: t, icon: teams[t]?.emoji || "📌", color: teams[t]?.color })
        );

        const myNotes = sectionItems("내 노트", [
            { key: "todos", label: "To-do", icon: "✅" },
        ]);
        // memo_ tabs (dynamic - not in menuConfig)
        const memoTabs = (userName === "박일웅" ? memberNames : memberNames.filter(n => n === userName)).map(name => ({ id: `memo_${name}`, label: name, icon: customEmojis[name] || members[name]?.emoji || "👤" }));

        const research = sectionItems("연구", [
            { key: "papers", label: "논문", icon: "📄" },
            { key: "reports", label: "계획서/보고서", icon: "📋" },
            { key: "ip", label: "지식재산권", icon: "💡" },
            { key: "experiments", label: "실험", icon: "🧪" },
            { key: "analysis", label: "해석", icon: "🖥️" },
        ]);

        const comms = sectionItems("커뮤니케이션", [
            { key: "conferenceTrips", label: "학회/출장", icon: "✈️" },
            { key: "meetings", label: "회의록", icon: "📝" },
            { key: "resources", label: "자료", icon: "📁" },
            { key: "ideas", label: "아이디어", icon: "💡" },
            { key: "lectures", label: "수업", icon: "📚" },
        ]);

        return [...dashboard, ...ops, ...teamTabs, ...myNotes, ...memoTabs, ...research, ...comms];
    }, [userName, teamNames, teams, memberNames, customEmojis, members, menuConfig, menuConfigMap]);

    const allPeople = useMemo(() => ["전체", ...memberNames], [memberNames]);

    const dashboardData = useMemo(() => ({
        papers, experiments, analyses, reports, patents: ipPatents, meetings,
        todos, vacations, schedule, dailyTargets, conferenceTrips, onlineUsers,
    }), [papers, experiments, analyses, reports, ipPatents, meetings, todos, vacations, schedule, dailyTargets, conferenceTrips, onlineUsers]);

    const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
    const pendingSavesRef = useRef(0);
    const [toast, setToast] = useState("");
    const [toastType, setToastType] = useState<"error" | "success">("error");
    const showToast = useCallback((msg: string, type: "error" | "success" = "error") => { setToast(msg); setToastType(type); }, []);
    useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), toastType === "success" ? 2000 : 3000); return () => clearTimeout(t); } }, [toast, toastType]);

    // ─── Keyboard Shortcuts ──────────────────────────────────────────────────
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setCmdKOpen(o => { if (!o) { setCmdKQuery(""); setCmdKIdx(0); } return !o; });
            }
            if (e.key === "?" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                e.preventDefault(); setShortcutsOpen(o => !o);
            }
            if (e.key === "Escape" && shortcutsOpen) setShortcutsOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [shortcutsOpen]);
    useEffect(() => { if (cmdKOpen) setTimeout(() => cmdKRef.current?.focus(), 50); }, [cmdKOpen]);
    useEffect(() => {
        if (cmdKOpen && cmdKListRef.current) {
            const el = cmdKListRef.current.querySelector(`[data-cmdk-idx="${cmdKIdx}"]`);
            el?.scrollIntoView({ block: "nearest" });
        }
    }, [cmdKIdx, cmdKOpen]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedCmdKQuery(cmdKQuery), 200);
        return () => clearTimeout(timer);
    }, [cmdKQuery]);

    const cmdKResults = useMemo(() => {
        if (!cmdKOpen) return []; // Skip computation when dialog is closed
        const q = debouncedCmdKQuery.trim().toLowerCase();
        type SR = { type: string; icon: string; title: string; subtitle: string; tabId: string };
        const r: SR[] = [];
        const M = 4;
        if (!q) return tabs.map(t => ({ type: "nav", icon: t.icon, title: t.label, subtitle: "", tabId: t.id }));

        // Tab navigation
        tabs.filter(t => t.label.toLowerCase().includes(q)).forEach(t => r.push({ type: "이동", icon: t.icon, title: t.label, subtitle: "탭 이동", tabId: t.id }));
        // Admin tabs (PI only)
        if (userName === "박일웅") {
            [{ id: "admin_members", icon: "🔑", label: "멤버 관리" }, { id: "admin_backups", icon: "💾", label: "백업 관리" }, { id: "admin_access", icon: "🔐", label: "접속 로그" }, { id: "admin_menus", icon: "📋", label: "메뉴 관리" }]
                .filter(t => t.label.toLowerCase().includes(q)).forEach(t => r.push({ type: "이동", icon: t.icon, title: t.label, subtitle: "관리", tabId: t.id }));
        }
        // Papers
        papers.filter(p => p.title.toLowerCase().includes(q) || p.journal?.toLowerCase().includes(q) || p.assignees.some(a => a.includes(q)) || p.tags?.some(t => t.toLowerCase().includes(q))).slice(0, M).forEach(p => r.push({ type: "논문", icon: "📄", title: p.title, subtitle: `${p.journal || ""} · ${p.assignees.join(", ")}`, tabId: "papers" }));
        // Reports
        reports.filter(p => p.title.toLowerCase().includes(q) || p.assignees.some(a => a.includes(q))).slice(0, M).forEach(p => r.push({ type: "보고서", icon: "📋", title: p.title, subtitle: p.assignees.join(", "), tabId: "reports" }));
        // Experiments
        experiments.filter(p => p.title.toLowerCase().includes(q) || p.equipment?.toLowerCase().includes(q) || p.assignees.some(a => a.includes(q))).slice(0, M).forEach(p => r.push({ type: "실험", icon: "🧪", title: p.title, subtitle: `${p.equipment || ""} · ${p.assignees.join(", ")}`, tabId: "experiments" }));
        // Analyses
        analyses.filter(p => p.title.toLowerCase().includes(q) || p.tool?.toLowerCase().includes(q) || p.assignees.some(a => a.includes(q))).slice(0, M).forEach(p => r.push({ type: "해석", icon: "🖥️", title: p.title, subtitle: `${p.tool || ""} · ${p.assignees.join(", ")}`, tabId: "analysis" }));
        // Todos
        todos.filter(p => p.text.toLowerCase().includes(q) || p.assignees.some(a => a.includes(q))).slice(0, M).forEach(p => r.push({ type: "할일", icon: "✅", title: p.text, subtitle: p.assignees.join(", "), tabId: "todos" }));
        // Patents
        ipPatents.filter(p => p.title.toLowerCase().includes(q) || p.assignees.some(a => a.includes(q))).slice(0, M).forEach(p => r.push({ type: "특허", icon: "💡", title: p.title, subtitle: p.assignees.join(", "), tabId: "ip" }));
        // Announcements
        announcements.filter(a => a.text.toLowerCase().includes(q) || a.author.includes(q)).slice(0, M).forEach(a => r.push({ type: "공지", icon: "📢", title: a.text.slice(0, 80), subtitle: a.author, tabId: "announcements" }));
        // Conferences
        conferenceTrips.filter(c => c.title.toLowerCase().includes(q) || c.participants.some(p => p.includes(q))).slice(0, M).forEach(c => r.push({ type: "학회", icon: "✈️", title: c.title, subtitle: c.participants.join(", "), tabId: "conferenceTrips" }));
        // Meetings
        meetings.filter(m => m.title.toLowerCase().includes(q) || m.goal?.toLowerCase().includes(q)).slice(0, M).forEach(m => r.push({ type: "회의", icon: "📝", title: m.title, subtitle: m.goal || "", tabId: "meetings" }));
        // Resources
        resources.filter(p => p.title.toLowerCase().includes(q) || p.author.includes(q)).slice(0, M).forEach(p => r.push({ type: "자료", icon: "📁", title: p.title, subtitle: p.author, tabId: "resources" }));
        // Ideas
        ideas.filter(p => p.title.toLowerCase().includes(q) || p.body?.toLowerCase().includes(q) || p.author.includes(q)).slice(0, M).forEach(p => r.push({ type: "아이디어", icon: "💡", title: p.title, subtitle: p.author, tabId: "ideas" }));
        // Lab board
        labBoard.filter(b => b.title.toLowerCase().includes(q) || b.content?.toLowerCase().includes(q) || b.author.includes(q)).slice(0, M).forEach(b => r.push({ type: "게시판", icon: "📌", title: b.title, subtitle: b.author, tabId: "labChat" }));
        aiBotBoard.filter(b => b.title.toLowerCase().includes(q) || b.content?.toLowerCase().includes(q) || b.author.includes(q)).slice(0, M).forEach(b => r.push({ type: "잡담 보드", icon: "📌", title: b.title, subtitle: b.author, tabId: "chat" }));
        // Team memo boards
        Object.entries(teamMemos).forEach(([tName, data]) => {
            data.kanban?.filter(c => c.title.toLowerCase().includes(q) || c.content?.toLowerCase().includes(q) || c.author?.includes(q)).slice(0, M).forEach(c => r.push({ type: `${tName}`, icon: "📌", title: c.title, subtitle: c.author || "", tabId: `teamMemo_${tName}` }));
        });
        // Daily targets
        dailyTargets.filter(d => d.text.toLowerCase().includes(q) || d.name.includes(q)).slice(0, M).forEach(d => r.push({ type: "목표", icon: "🎯", title: `${d.name}: ${d.text.slice(0, 60)}`, subtitle: d.date, tabId: "daily" }));
        return r;
    }, [cmdKOpen, debouncedCmdKQuery, tabs, papers, reports, experiments, analyses, todos, ipPatents, announcements, conferenceTrips, meetings, resources, ideas, labBoard, aiBotBoard, teamMemos, dailyTargets]);

    const handleCmdKSelect = useCallback((tabId: string) => { setActiveTab(tabId); setCmdKOpen(false); }, []);

    const getAuthHeaders = useCallback((): Record<string, string> => {
        const token = localStorage.getItem("mftel-auth-token");
        return token ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } : { "Content-Type": "application/json" };
    }, []);

    const saveSection = useCallback(async (section: string, data: unknown, detail?: string): Promise<boolean> => {
        try { const r = await fetch("/api/dashboard", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ section, data, userName, ...(detail ? { detail } : {}) }) }); return r.ok; } catch { return false; }
    }, [userName, getAuthHeaders]);

    const trackSave = useCallback((itemId: number, section: string, data: unknown, rollback: () => void, detail?: string) => {
        setSavingIds(prev => new Set(prev).add(itemId));
        pendingSavesRef.current++;
        saveSection(section, data, detail).then(ok => {
            pendingSavesRef.current--;
            setSavingIds(prev => { const s = new Set(prev); s.delete(itemId); return s; });
            if (!ok) { rollback(); showToast("저장에 실패했습니다. 다시 시도해주세요."); }
        });
    }, [saveSection, showToast]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hydrateData = useCallback((d: any) => {
      try {
        if (!d || typeof d !== 'object') throw new Error('Invalid data format');
        const arr = (v: unknown) => Array.isArray(v);
        const obj = (v: unknown) => v && typeof v === 'object' && !Array.isArray(v);
        startTransition(() => {
            if (arr(d.announcements)) setAnnouncements(d.announcements);
            if (arr(d.papers)) setPapers(d.papers);
            if (arr(d.experiments)) setExperiments(d.experiments);
            if (arr(d.todos)) setTodos(d.todos);
            if (arr(d.patents)) setIpPatents(d.patents);
            if (arr(d.vacations)) setVacations(d.vacations);
            if (arr(d.schedule)) setSchedule(d.schedule);
            if (arr(d.dispatches)) setDispatches(d.dispatches);
            if (arr(d.timetable)) setTimetable(d.timetable);
            if (arr(d.reports)) setReports(d.reports);
            if (obj(d.teams)) setTeams(d.teams);
            if (arr(d.dailyTargets)) setDailyTargets(d.dailyTargets);
            if (arr(d.philosophy)) setPhilosophy(d.philosophy);
            if (arr(d.resources)) setResources(d.resources);
            if (arr(d.conferences)) setConferenceTrips(d.conferences);
            if (arr(d.meetings)) setMeetings(d.meetings);
            if (arr(d.ideas)) setIdeas(d.ideas);
            if (arr(d.analyses)) setAnalyses(d.analyses);
            if (arr(d.chatPosts)) setChatPosts(d.chatPosts);
            if (obj(d.customEmojis)) setCustomEmojis(d.customEmojis);
            if (obj(d.statusMessages)) setStatusMessages(d.statusMessages);
            if (arr(d.equipmentList)) setEquipmentList(d.equipmentList);
            if (obj(d.personalMemos)) setPersonalMemos(d.personalMemos);
            if (obj(d.personalFiles)) setPersonalFiles(d.personalFiles);
            if (obj(d.piChat)) setPiChat(d.piChat);
            if (obj(d.teamMemos)) setTeamMemos(d.teamMemos);
            if (arr(d.labChat)) setLabChat(d.labChat);
            if (arr(d.casualChat)) setCasualChat(d.casualChat);
            if (arr(d.aiBotChat)) setAiBotChat(d.aiBotChat);
            if (arr(d.aiBotBoard)) setAiBotBoard(d.aiBotBoard);
            if (arr(d.labFiles)) setLabFiles(d.labFiles);
            if (arr(d.labBoard)) setLabBoard(d.labBoard);
            if (obj(d.readReceipts) && !pendingReadReceiptRef.current) setReadReceipts(d.readReceipts);
            if (obj(d.pushPrefs)) setPushPrefs(d.pushPrefs);
            if (d.experimentLogs) {
                const raw = d.experimentLogs as Record<string, unknown>;
                const migrated: Record<string, ExpLogEntry[]> = {};
                const migratedCats: Record<string, Array<{name: string; members: string[]}>> = {};
                for (const [team, val] of Object.entries(raw)) {
                    if (Array.isArray(val) && val.length > 0 && 'entries' in val[0]) {
                        const books = val as Array<{ name: string; entries: ExpLogEntry[] }>;
                        migrated[team] = books.flatMap(b => b.entries.map(e => ({ ...e, category: e.category || b.name })));
                        migratedCats[team] = books.map(b => ({ name: b.name, members: [] }));
                    } else if (Array.isArray(val)) {
                        migrated[team] = val as ExpLogEntry[];
                    }
                }
                setExperimentLogs(migrated);
                if (Object.keys(migratedCats).length > 0) {
                    setExpLogCategories(prev => {
                        const merged = { ...prev };
                        for (const [t, cats] of Object.entries(migratedCats)) {
                            if (!merged[t] || merged[t].length === 0) merged[t] = cats;
                        }
                        return merged;
                    });
                }
            }
            if (d.analysisLogs) {
                const rawA = d.analysisLogs as Record<string, unknown>;
                const migratedA: Record<string, AnalysisLogEntry[]> = {};
                const migratedACats: Record<string, Array<{name: string; members: string[]}>> = {};
                for (const [team, val] of Object.entries(rawA)) {
                    if (Array.isArray(val) && val.length > 0 && 'entries' in val[0]) {
                        const books = val as Array<{ name: string; entries: AnalysisLogEntry[] }>;
                        migratedA[team] = books.flatMap(b => b.entries.map(e => ({ ...e, category: e.category || b.name })));
                        migratedACats[team] = books.map(b => ({ name: b.name, members: [] }));
                    } else if (Array.isArray(val)) {
                        migratedA[team] = val as AnalysisLogEntry[];
                    }
                }
                setAnalysisLogs(migratedA);
                if (Object.keys(migratedACats).length > 0) {
                    setAnalysisLogCategories(prev => {
                        const merged = { ...prev };
                        for (const [t, cats] of Object.entries(migratedACats)) {
                            if (!merged[t] || merged[t].length === 0) merged[t] = cats;
                        }
                        return merged;
                    });
                }
            }
            if (d.experimentLogCategories) {
                const raw = d.experimentLogCategories as Record<string, unknown[]>;
                const norm: Record<string, Array<{name: string; members: string[]}>> = {};
                for (const [t, cats] of Object.entries(raw)) {
                    norm[t] = (cats || []).map((c: unknown) => typeof c === "string" ? { name: c, members: [] } : c as {name: string; members: string[]});
                }
                setExpLogCategories(norm);
            }
            if (d.analysisLogCategories) {
                const raw = d.analysisLogCategories as Record<string, unknown[]>;
                const norm: Record<string, Array<{name: string; members: string[]}>> = {};
                for (const [t, cats] of Object.entries(raw)) {
                    norm[t] = (cats || []).map((c: unknown) => typeof c === "string" ? { name: c, members: [] } : c as {name: string; members: string[]});
                }
                setAnalysisLogCategories(norm);
            }
            if (arr(d.analysisToolList)) setAnalysisToolList(d.analysisToolList);
            if (arr(d.paperTagList)) setPaperTagList(d.paperTagList);
            if (arr(d.menuConfig) && d.menuConfig.length > 0) setMenuConfig(mergeMenuConfig(d.menuConfig));
            setDataLoaded(true);
            if (obj(d.members) && Object.keys(d.members).length > 0) {
                setMembers(d.members);
            } else {
                const tk = localStorage.getItem("mftel-auth-token");
                if (tk) fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tk}` }, body: JSON.stringify({ section: "members", data: DEFAULT_MEMBERS }) }).catch(e => console.warn("Background request failed:", e));
            }
        });
      } catch (err) {
        console.error('hydrateData error:', err);
        showToast("캐시 데이터에 오류가 있어 초기화합니다.");
        try { localStorage.removeItem('mftel-dc'); } catch {}
      }
    }, []);

    const pollBackoffRef = useRef(0);
    const fetchingRef = useRef(false);
    const serverVersionRef = useRef(0);
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem("mftel-auth-token");
        if (!token) return;
        if (pendingSavesRef.current > 0 || fetchingRef.current) return;
        fetchingRef.current = true;
        try {
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 10000);
            const v = serverVersionRef.current;
            const res = await fetch(`/api/dashboard?section=all${v ? `&v=${v}` : ''}`, { signal: ctrl.signal, headers: { "Authorization": `Bearer ${token}` } });
            clearTimeout(timeout);
            const d = await res.json();
            pollBackoffRef.current = 0;
            if (pendingSavesRef.current > 0) return;
            // Update server version
            if (d._v) serverVersionRef.current = d._v;
            // Skip if nothing changed (delta sync)
            if (d._noChange) return;
            // For partial updates, only hydrate changed sections
            if (d._partial) {
                const partial = { ...d };
                delete partial._v;
                delete partial._partial;
                hydrateData(partial);
                return;
            }
            // Full fetch — cache for instant hydration
            const clean = { ...d };
            delete clean._v;
            try { localStorage.setItem('mftel-dc', JSON.stringify(clean)); } catch {}
            hydrateData(clean);
        } catch {
            pollBackoffRef.current = Math.min(pollBackoffRef.current + 1, 3);
        } finally {
            fetchingRef.current = false;
        }
    }, [hydrateData]);

    const fetchOnline = useCallback(async () => {
        const token = localStorage.getItem("mftel-auth-token");
        if (!token) return;
        try { const r = await fetch("/api/dashboard?section=online", { headers: { "Authorization": `Bearer ${token}` } }); const d = await r.json(); setOnlineUsers(d.users || []); } catch { /* ignore */ }
    }, []);

    const sendHeartbeat = useCallback(async () => {
        if (!userName) return;
        try { await fetch("/api/dashboard", { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ section: "online", action: "heartbeat", userName }) }); } catch { /* ignore */ }
    }, [userName, getAuthHeaders]);

    const fetchLogs = useCallback(async () => {
        const token = localStorage.getItem("mftel-auth-token");
        if (!token) return;
        try {
            const res = await fetch("/api/dashboard?section=logs", { headers: { "Authorization": `Bearer ${token}` } });
            const d = await res.json();
            if (d.data) setNotiLogs(d.data);
        } catch { /* ignore */ }
    }, []);

    const handleLogin = async (name: string, password: string, rememberMe: boolean): Promise<string | null> => {
        try {
            const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", userName: name, password }) });
            const data = await res.json();
            if (!res.ok) return data.error || "로그인 실패";
            // Always store token (needed for API auth); rememberMe only controls auto-login
            if (data.token) localStorage.setItem("mftel-auth-token", data.token);
            if (data.isDefaultPassword) { setMustChangePassword(true); setUserName(name); return null; }
            setUserName(name); setLoggedIn(true);
            const authH = { "Content-Type": "application/json", "Authorization": `Bearer ${data.token}` };
            fetchData(); fetchOnline(); fetchLogs();
            fetch("/api/dashboard", { method: "POST", headers: authH, body: JSON.stringify({ section: "online", action: "join", userName: name }) }).catch(e => console.warn("Online join failed:", e));
            return null;
        } catch { return "서버 연결 실패"; }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem("mftel-auth-token");
        const authH: Record<string, string> = token ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } : { "Content-Type": "application/json" };
        if (token) {
            try { await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout", token }) }); } catch (e) { console.warn("Logout failed:", e); }
            localStorage.removeItem("mftel-auth-token");
        }
        try { fetch("/api/dashboard", { method: "POST", headers: authH, body: JSON.stringify({ section: "online", action: "leave", userName }), keepalive: true }); } catch (e) { console.warn("Online leave failed:", e); }
        try { localStorage.removeItem('mftel-dc'); } catch {}
        setLoggedIn(false); setUserName(""); setDataLoaded(false); setMustChangePassword(false);
    };

    // Pre-login: hydrate cache + validate token
    useEffect(() => {
        const token = localStorage.getItem("mftel-auth-token");

        // 1. Instant hydrate from localStorage cache (0ms — data visible immediately)
        try {
            const cached = localStorage.getItem('mftel-dc');
            if (cached) hydrateData(JSON.parse(cached));
        } catch {}

        // 2. If token exists, pre-fetch data in background (requires auth)
        if (token) fetchData();

        // 3. Members/emojis for login screen (requires auth, fallback to cache/defaults)
        if (token) {
            const authH = { "Authorization": `Bearer ${token}` };
            Promise.allSettled([
                fetch("/api/dashboard?section=members", { headers: authH }).then(r => r.json()).catch(() => null),
                fetch("/api/dashboard?section=customEmojis", { headers: authH }).then(r => r.json()).catch(() => null),
            ]).then(([membersResult, emojisResult]) => {
                const mData = membersResult.status === "fulfilled" ? membersResult.value?.data : null;
                if (mData && Object.keys(mData).length > 0) setMembers(mData);
                const eData = emojisResult.status === "fulfilled" ? emojisResult.value?.data : null;
                if (eData) setCustomEmojis(eData);
            });
        }

        // 4. Token validation: only blocks if token exists (shows loading screen)
        if (!token) return;
        (async () => {
            try {
                const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "validateSession", token }) });
                const authResp = await res.json();
                if (authResp?.valid && authResp.userName) {
                    if (authResp.isDefaultPassword) { setMustChangePassword(true); setUserName(authResp.userName); }
                    else { setUserName(authResp.userName); setLoggedIn(true); }
                    const authH = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
                    fetchOnline(); fetchLogs();
                    fetch("/api/dashboard", { method: "POST", headers: authH, body: JSON.stringify({ section: "online", action: "join", userName: authResp.userName }) }).catch(() => {});
                } else {
                    localStorage.removeItem("mftel-auth-token");
                }
            } catch {
                localStorage.removeItem("mftel-auth-token");
            }
            setAuthChecked(true);
        })();
    }, []);

    useEffect(() => {
        if (!loggedIn) return;
        // Initial fetch only if not already triggered eagerly from login/token validation
        const d = dataLoaded ? undefined : setTimeout(() => { fetchData(); fetchOnline(); fetchLogs(); }, 0);
        const a = setInterval(() => {
            const delay = pollBackoffRef.current * 5000;
            if (delay > 0) { pollBackoffRef.current--; return; }
            fetchData();
        }, 30000);
        const b = setInterval(fetchOnline, 30000);
        const c = setInterval(sendHeartbeat, 30000);
        const l = setInterval(fetchLogs, 60000);
        return () => { if (d) clearTimeout(d); clearInterval(a); clearInterval(b); clearInterval(c); clearInterval(l); };
    }, [loggedIn, fetchData, fetchOnline, sendHeartbeat, fetchLogs]);

    useEffect(() => {
        if (!userName) return;
        const h = () => {
            const token = localStorage.getItem("mftel-auth-token");
            const headers: Record<string, string> = token
                ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                : { "Content-Type": "application/json" };
            try { fetch("/api/dashboard", { method: "POST", headers, body: JSON.stringify({ section: "online", action: "leave", userName }), keepalive: true }); } catch {}
        };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [userName]);

    // Scroll position restore on tab switch
    useEffect(() => {
        const el = mainContentRef.current;
        if (el) el.scrollTop = scrollPositionsRef.current[activeTab] || 0;
    }, [activeTab]);

    // chatReadTs: init from localStorage
    useEffect(() => {
        if (!userName) return;
        try {
            const saved = localStorage.getItem(`mftel_chatReadTs_${userName}`);
            if (saved) setChatReadTs(JSON.parse(saved));
        } catch (e) { console.warn("chatReadTs load failed:", e); }
    }, [userName]);

    // notiLastSeen: init from localStorage
    useEffect(() => {
        if (!userName) return;
        try {
            const saved = localStorage.getItem(`mftel_notiLastSeen_${userName}`);
            if (saved) setNotiLastSeen(Number(saved));
        } catch (e) { console.warn("notiLastSeen load failed:", e); }
    }, [userName]);

    // Register Service Worker for PWA + Push
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !userName) return;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        navigator.serviceWorker.register('/sw.js').then(async (reg) => {
            if (!vapidKey || !('PushManager' in window)) return;
            try {
                const existing = await reg.pushManager.getSubscription();
                if (existing) {
                    // Already subscribed, just re-register with server
                    fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName, subscription: existing.toJSON() }) }).catch(e => console.warn("Background request failed:", e));
                    return;
                }
                const urlBase64ToUint8Array = (base64String: string) => {
                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                    const raw = atob(base64);
                    return Uint8Array.from(raw, c => c.charCodeAt(0));
                };
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
                fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName, subscription: sub.toJSON() }) }).catch(e => console.warn("Background request failed:", e));
            } catch (e) { console.warn("Push setup skipped:", e); } // push permission denied or not supported
        }).catch(e => console.warn("Background request failed:", e));
    }, [userName]);

    // chatReadTs: mark current tab as read (on tab switch + when new msgs arrive while viewing)
    const activeChatLen = activeTab === "labChat" ? (labChat.length + labBoard.length)
        : activeTab === "chat" ? (aiBotChat.length + chatPosts.length + aiBotBoard.length)
        : activeTab.startsWith("teamMemo_") ? ((teamMemos[activeTab.replace("teamMemo_", "")]?.chat || []).length + (teamMemos[activeTab.replace("teamMemo_", "")]?.kanban || []).length)
        : activeTab.startsWith("memo_") ? (piChat[activeTab.replace("memo_", "")] || []).length
        : activeTab === "announcements" ? announcements.length : -1;
    // Debounced save of readReceipts to server
    const readReceiptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingReadReceiptRef = useRef(false);
    const saveReadReceipt = useCallback((tabId: string, ts: number) => {
        if (!userName) return;
        setReadReceipts(prev => {
            const next = { ...prev, [tabId]: { ...(prev[tabId] || {}), [userName]: ts } };
            if (readReceiptTimerRef.current) clearTimeout(readReceiptTimerRef.current);
            pendingReadReceiptRef.current = true;
            readReceiptTimerRef.current = setTimeout(() => {
                const tk = localStorage.getItem("mftel-auth-token");
                if (tk) fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tk}` }, body: JSON.stringify({ section: "readReceipts", data: next, userName }) })
                    .then(() => { pendingReadReceiptRef.current = false; })
                    .catch(e => { pendingReadReceiptRef.current = false; console.warn("Background request failed:", e); });
            }, 1000);
            return next;
        });
    }, [userName]);
    useEffect(() => {
        if (!userName || activeChatLen < 0) return;
        const now = Date.now() * 100; // match genId() scale
        setChatReadTs(prev => {
            const next = { ...prev, [activeTab]: now };
            try { localStorage.setItem(`mftel_chatReadTs_${userName}`, JSON.stringify(next)); } catch (e) { console.warn("chatReadTs save failed:", e); }
            return next;
        });
        saveReadReceipt(activeTab, now);
    }, [activeTab, userName, activeChatLen, saveReadReceipt]);

    // Handlers
    const handleToggleTodo = useCallback((id: number) => { pendingSavesRef.current++; setTodos(prev => { const u = prev.map(t => t.id === id ? { ...t, done: !t.done } : t); saveSection("todos", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleAddTodo = useCallback((t: Todo) => { setTodos(prev => { const u = [...prev, t]; trackSave(t.id, "todos", u, () => setTodos(pp => pp.filter(x => x.id !== t.id))); return u; }); }, [trackSave]);
    const handleDeleteTodo = useCallback((id: number) => { pendingSavesRef.current++; setTodos(prev => { const u = prev.filter(t => t.id !== id); saveSection("todos", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleUpdateTodo = useCallback((t: Todo) => { pendingSavesRef.current++; setTodos(prev => { const u = prev.map(x => x.id === t.id ? t : x); saveSection("todos", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderTodos = useCallback((list: Todo[]) => { setTodos(list); pendingSavesRef.current++; saveSection("todos", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleAddAnn = useCallback((text: string, pinned = false, imageUrl?: string) => { const nid = genId(); setAnnouncements(prev => { const u = [{ id: nid, text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned, ...(imageUrl ? { imageUrl } : {}) }, ...prev]; trackSave(nid, "announcements", u, () => setAnnouncements(pp => pp.filter(a => a.id !== nid))); return u; }); }, [userName, trackSave]);
    const handleDelAnn = useCallback((id: number) => { pendingSavesRef.current++; setAnnouncements(prev => { const u = prev.filter(a => a.id !== id); saveSection("announcements", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleUpdateAnn = useCallback((ann: Announcement) => { pendingSavesRef.current++; setAnnouncements(prev => { const u = prev.map(a => a.id === ann.id ? ann : a); saveSection("announcements", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderAnn = useCallback((list: Announcement[]) => { setAnnouncements(list); pendingSavesRef.current++; saveSection("announcements", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleAddPhil = useCallback((text: string, imageUrl?: string) => { const nid = genId(); setPhilosophy(prev => { const u = [{ id: nid, text, author: userName, date: new Date().toLocaleDateString("ko-KR"), pinned: false, ...(imageUrl ? { imageUrl } : {}) }, ...prev]; trackSave(nid, "philosophy", u, () => setPhilosophy(pp => pp.filter(p => p.id !== nid))); return u; }); }, [userName, trackSave]);
    const handleDelPhil = useCallback((id: number) => { pendingSavesRef.current++; setPhilosophy(prev => { const u = prev.filter(p => p.id !== id); saveSection("philosophy", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleUpdatePhil = useCallback((p: Announcement) => { pendingSavesRef.current++; setPhilosophy(prev => { const u = prev.map(x => x.id === p.id ? p : x); saveSection("philosophy", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderPhil = useCallback((list: Announcement[]) => { setPhilosophy(list); pendingSavesRef.current++; saveSection("philosophy", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);

    const handleSavePaper = useCallback((p: Paper) => {
        setPaperModal(null);
        setPapers(prev => {
            const exists = prev.find(x => x.id === p.id);
            const u = exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
            if (exists) { pendingSavesRef.current++; saveSection("papers", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(p.id, "papers", u, () => setPapers(pp => pp.filter(x => x.id !== p.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeletePaper = useCallback((id: number) => { pendingSavesRef.current++; setPapers(prev => { const u = prev.filter(p => p.id !== id); saveSection("papers", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderPapers = useCallback((list: Paper[]) => { setPapers(list); pendingSavesRef.current++; saveSection("papers", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);

    const handleSaveExperiment = useCallback((e: Experiment) => {
        setExperiments(prev => {
            const exists = prev.find(x => x.id === e.id);
            const u = exists ? prev.map(x => x.id === e.id ? e : x) : [...prev, e];
            if (exists) { pendingSavesRef.current++; saveSection("experiments", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(e.id, "experiments", u, () => setExperiments(pp => pp.filter(x => x.id !== e.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteExperiment = useCallback((id: number) => { pendingSavesRef.current++; setExperiments(prev => { const u = prev.filter(e => e.id !== id); saveSection("experiments", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderExperiments = useCallback((list: Experiment[]) => { setExperiments(list); pendingSavesRef.current++; saveSection("experiments", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);

    const handleSaveReport = useCallback((r: Report) => {
        setReports(prev => {
            const exists = prev.find(x => x.id === r.id);
            const u = exists ? prev.map(x => x.id === r.id ? r : x) : [...prev, r];
            if (exists) { pendingSavesRef.current++; saveSection("reports", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(r.id, "reports", u, () => setReports(pp => pp.filter(x => x.id !== r.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteReport = useCallback((id: number) => { pendingSavesRef.current++; setReports(prev => { const u = prev.filter(r => r.id !== id); saveSection("reports", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderReports = useCallback((list: Report[]) => { setReports(list); pendingSavesRef.current++; saveSection("reports", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);

    // ─── Schedule → Daily Target auto-sync helpers ────────────────────────────
    const SCHEDULE_TARGET_MARKER = "[일정]";
    const formatScheduleTargetText = useCallback((type: string, desc?: string): string => {
        const icons: Record<string, string> = { vacation: "\uD83C\uDFD6\uFE0F", trip: "\uD83D\uDE97", meeting: "\uD83E\uDD1D", seminar: "\uD83D\uDCE2", conference: "\uD83C\uDF93", wfh: "\uD83C\uDFE0", vendor: "\uD83D\uDCBC", other: "\uD83D\uDCCC" };
        const labels: Record<string, string> = { vacation: "휴가", trip: "출장", meeting: "회의", seminar: "세미나", conference: "학회", wfh: "재택", vendor: "업체 미팅", other: "기타" };
        const icon = icons[type] || "\uD83D\uDCCC";
        const label = labels[type] || CALENDAR_TYPES[type]?.label || type;
        const needsDesc = !["vacation", "wfh"].includes(type);
        const descPart = needsDesc && desc ? `: ${desc}` : "";
        return `${SCHEDULE_TARGET_MARKER} ${icon} ${label}${descPart}`;
    }, []);

    const handleCalendarToggle = useCallback((name: string, date: string, type: string | null, desc?: string) => {
        const dates = date.includes(",") ? date.split(",") : [date];
        const isVacType = type === "vacation" || type === "wfh";

        setVacations(prevV => {
            let uv = [...prevV];
            for (const dt of dates) {
                if (type === null) uv = uv.filter(v => !(v.name === name && v.date === dt));
                else if (isVacType) uv = [...uv.filter(v => !(v.name === name && v.date === dt)), { name, date: dt, type }];
                else uv = uv.filter(v => !(v.name === name && v.date === dt));
            }
            pendingSavesRef.current++; saveSection("vacations", uv).then(() => { pendingSavesRef.current--; });
            return uv;
        });
        setSchedule(prevS => {
            let us = [...prevS];
            for (const dt of dates) {
                if (type === null) us = us.filter(v => !(v.name === name && v.date === dt));
                else if (isVacType) us = us.filter(v => !(v.name === name && v.date === dt));
                else us = [...us.filter(v => !(v.name === name && v.date === dt)), { name, date: dt, type, description: desc || "" }];
            }
            pendingSavesRef.current++; saveSection("schedule", us).then(() => { pendingSavesRef.current--; });
            return us;
        });

        // --- 2. Sync daily targets (skip non-member names like 중요일정/공통일정) ---
        const isMember = MEMBER_NAMES.includes(name);
        if (!isMember) return;

        pendingSavesRef.current++;
        setDailyTargets(prev => {
            let updated = [...prev];

            for (const dt of dates) {
                // Remove ALL auto-generated schedule marker lines for this name+date
                const existing = updated.find(t => t.name === name && t.date === dt);
                if (existing) {
                    const lines = existing.text.split("\n");
                    const cleaned = lines.filter(line => !line.startsWith(SCHEDULE_TARGET_MARKER));
                    if (cleaned.length === 0 || (cleaned.length === 1 && cleaned[0].trim() === "")) {
                        updated = updated.filter(t => !(t.name === name && t.date === dt));
                    } else {
                        updated = updated.map(t => t.name === name && t.date === dt ? { ...t, text: cleaned.join("\n") } : t);
                    }
                }

                // Add new auto-generated line if type is being set (not deleted)
                if (type !== null) {
                    const newLine = formatScheduleTargetText(type, desc);
                    const cur = updated.find(t => t.name === name && t.date === dt);
                    if (cur) {
                        // Prepend the schedule line before existing user content
                        updated = updated.map(t => t.name === name && t.date === dt ? { ...t, text: newLine + "\n" + t.text } : t);
                    } else {
                        updated = [...updated, { name, date: dt, text: newLine }];
                    }
                }
            }

            saveSection("dailyTargets", updated).then(() => { pendingSavesRef.current--; });
            return updated;
        });
    }, [saveSection, formatScheduleTargetText]);
    const handleTimetableSave = useCallback((b: TimetableBlock) => {
        setTimetable(prev => {
            const exists = prev.find(x => x.id === b.id);
            const u = exists ? prev.map(x => x.id === b.id ? b : x) : [...prev, b];
            pendingSavesRef.current++; saveSection("timetable", u).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleTimetableDelete = useCallback((id: number) => { pendingSavesRef.current++; setTimetable(prev => { const u = prev.filter(b => b.id !== id); saveSection("timetable", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleSaveTeams = useCallback((t: Record<string, TeamData>) => { setTeams(t); pendingSavesRef.current++; saveSection("teams", t).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSavePatent = useCallback((p: Patent) => {
        setIpPatents(prev => {
            const exists = prev.find(x => x.id === p.id);
            const u = exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
            if (exists) { pendingSavesRef.current++; saveSection("patents", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(p.id, "patents", u, () => setIpPatents(pp => pp.filter(x => x.id !== p.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeletePatent = useCallback((id: number) => { pendingSavesRef.current++; setIpPatents(prev => { const u = prev.filter(p => p.id !== id); saveSection("patents", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderPatents = useCallback((list: Patent[]) => { setIpPatents(list); pendingSavesRef.current++; saveSection("patents", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveResource = useCallback((r: Resource) => {
        setResources(prev => {
            const exists = prev.find(x => x.id === r.id);
            const u = exists ? prev.map(x => x.id === r.id ? r : x) : [...prev, r];
            if (exists) { pendingSavesRef.current++; saveSection("resources", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(r.id, "resources", u, () => setResources(pp => pp.filter(x => x.id !== r.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteResource = useCallback((id: number) => { pendingSavesRef.current++; setResources(prev => { const u = prev.filter(r => r.id !== id); saveSection("resources", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderResources = useCallback((list: Resource[]) => { setResources(list); pendingSavesRef.current++; saveSection("resources", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveConference = useCallback((c: ConferenceTrip) => {
        setConferenceTrips(prev => {
            const exists = prev.find(x => x.id === c.id);
            const u = exists ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
            if (exists) { pendingSavesRef.current++; saveSection("conferences", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(c.id, "conferences", u, () => setConferenceTrips(pp => pp.filter(x => x.id !== c.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteConference = useCallback((id: number) => { pendingSavesRef.current++; setConferenceTrips(prev => { const u = prev.filter(c => c.id !== id); saveSection("conferences", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderConferences = useCallback((list: ConferenceTrip[]) => { setConferenceTrips(list); pendingSavesRef.current++; saveSection("conferences", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveMeeting = useCallback((m: Meeting) => {
        setMeetings(prev => {
            const exists = prev.find(x => x.id === m.id);
            const u = exists ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
            if (exists) { pendingSavesRef.current++; saveSection("meetings", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(m.id, "meetings", u, () => setMeetings(pp => pp.filter(x => x.id !== m.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteMeeting = useCallback((id: number) => { pendingSavesRef.current++; setMeetings(prev => { const u = prev.filter(m => m.id !== id); saveSection("meetings", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleSaveDailyTargets = useCallback((t: DailyTarget[]) => { setDailyTargets(t); pendingSavesRef.current++; saveSection("dailyTargets", t).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveIdea = useCallback((idea: IdeaPost) => {
        setIdeas(prev => {
            const exists = prev.find(x => x.id === idea.id);
            const u = exists ? prev.map(x => x.id === idea.id ? idea : x) : [idea, ...prev];
            if (exists) { pendingSavesRef.current++; saveSection("ideas", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(idea.id, "ideas", u, () => setIdeas(pp => pp.filter(x => x.id !== idea.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteIdea = useCallback((id: number) => { pendingSavesRef.current++; setIdeas(prev => { const u = prev.filter(i => i.id !== id); saveSection("ideas", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderIdeas = useCallback((list: IdeaPost[]) => { setIdeas(list); pendingSavesRef.current++; saveSection("ideas", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveAnalysis = useCallback((a: Analysis) => {
        setAnalyses(prev => {
            const exists = prev.find(x => x.id === a.id);
            const u = exists ? prev.map(x => x.id === a.id ? a : x) : [...prev, a];
            if (exists) { pendingSavesRef.current++; saveSection("analyses", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(a.id, "analyses", u, () => setAnalyses(pp => pp.filter(x => x.id !== a.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteAnalysis = useCallback((id: number) => { pendingSavesRef.current++; setAnalyses(prev => { const u = prev.filter(a => a.id !== id); saveSection("analyses", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderAnalyses = useCallback((list: Analysis[]) => { setAnalyses(list); pendingSavesRef.current++; saveSection("analyses", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveChat = useCallback((post: IdeaPost) => {
        setChatPosts(prev => {
            const exists = prev.find(x => x.id === post.id);
            const u = exists ? prev.map(x => x.id === post.id ? post : x) : [post, ...prev];
            if (exists) { pendingSavesRef.current++; saveSection("chatPosts", u).then(() => { pendingSavesRef.current--; }); }
            else trackSave(post.id, "chatPosts", u, () => setChatPosts(pp => pp.filter(x => x.id !== post.id)));
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteChat = useCallback((id: number) => { pendingSavesRef.current++; setChatPosts(prev => { const u = prev.filter(p => p.id !== id); saveSection("chatPosts", u).then(() => { pendingSavesRef.current--; }); return u; }); }, [saveSection]);
    const handleReorderChatPosts = useCallback((list: IdeaPost[]) => { setChatPosts(list); pendingSavesRef.current++; saveSection("chatPosts", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveEmoji = useCallback((name: string, emoji: string) => {
        pendingSavesRef.current++; setCustomEmojis(prev => { const u = { ...prev, [name]: emoji }; saveSection("customEmojis", u).then(() => { pendingSavesRef.current--; }); return u; });
    }, [saveSection]);
    const handleSaveStatusMsg = useCallback((name: string, msg: string) => {
        pendingSavesRef.current++; setStatusMessages(prev => { const u = { ...prev, [name]: msg }; saveSection("statusMessages", u).then(() => { pendingSavesRef.current--; }); return u; });
    }, [saveSection]);
    const handleSaveEquipment = useCallback((list: string[]) => { setEquipmentList(list); pendingSavesRef.current++; saveSection("equipmentList", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveAnalysisTools = useCallback((list: string[]) => { setAnalysisToolList(list); pendingSavesRef.current++; saveSection("analysisToolList", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSavePaperTags = useCallback((list: string[]) => { setPaperTagList(list); pendingSavesRef.current++; saveSection("paperTagList", list).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveMenuConfig = useCallback((config: MenuConfig[]) => { setMenuConfig(config); pendingSavesRef.current++; saveSection("menuConfig", config).then(() => { pendingSavesRef.current--; }); }, [saveSection]);
    const handleSaveMemo = useCallback((memberName: string, memo: Memo) => {
        setPersonalMemos(prev => {
            const existing = prev[memberName] || [];
            const found = existing.find(m => m.id === memo.id);
            const updated = found ? existing.map(m => m.id === memo.id ? memo : m) : [...existing, memo];
            const u = { ...prev, [memberName]: updated };
            if (found) { pendingSavesRef.current++; saveSection("personalMemos", u, memberName).then(() => { pendingSavesRef.current--; }); }
            else trackSave(memo.id, "personalMemos", u, () => setPersonalMemos(pp => { const arr = pp[memberName] || []; return { ...pp, [memberName]: arr.filter(m => m.id !== memo.id) }; }), memberName);
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteMemo = useCallback((memberName: string, id: number) => {
        pendingSavesRef.current++;
        setPersonalMemos(prev => {
            const updated = (prev[memberName] || []).filter(m => m.id !== id);
            const u = { ...prev, [memberName]: updated };
            saveSection("personalMemos", u, memberName).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleAddPersonalFile = useCallback((name: string, f: LabFile) => {
        setPersonalFiles(prev => {
            const u = { ...prev, [name]: [...(prev[name] || []), f] };
            trackSave(f.id, "personalFiles", u, () => setPersonalFiles(pp => ({ ...pp, [name]: (pp[name] || []).filter(x => x.id !== f.id) })));
            return u;
        });
    }, [trackSave]);
    const handleDeletePersonalFile = useCallback((name: string, id: number) => {
        pendingSavesRef.current++;
        setPersonalFiles(prev => {
            const u = { ...prev, [name]: (prev[name] || []).filter(f => f.id !== id) };
            saveSection("personalFiles", u).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleAddPiChat = useCallback((name: string, msg: TeamChatMsg) => {
        pendingSavesRef.current++;
        setPiChat(prev => {
            const newMsgs = [...(prev[name] || []), { ...msg, _sending: true }];
            const next = { ...prev, [name]: newMsgs };
            saveSection("piChat", { ...next, [name]: stripMsgFlags(newMsgs) }).then(ok => {
                pendingSavesRef.current--;
                setPiChat(p => ({ ...p, [name]: (p[name] || []).map(m => m.id === msg.id ? { ...m, _sending: undefined, ...(ok ? {} : { _failed: true }) } : m) }));
            });
            return next;
        });
    }, [saveSection]);
    const handleRetryPiChat = useCallback((name: string, msgId: number) => {
        pendingSavesRef.current++;
        setPiChat(prev => {
            const updated = { ...prev, [name]: (prev[name] || []).map(m => m.id === msgId ? { ...m, _sending: true, _failed: undefined } : m) };
            saveSection("piChat", { ...updated, [name]: stripMsgFlags(updated[name]) }).then(ok => {
                pendingSavesRef.current--;
                setPiChat(p => ({ ...p, [name]: (p[name] || []).map(m => m.id === msgId ? { ...m, _sending: undefined, ...(ok ? {} : { _failed: true }) } : m) }));
            });
            return updated;
        });
    }, [saveSection]);
    const handleDeletePiChat = useCallback((name: string, id: number) => {
        pendingSavesRef.current++; setPiChat(prev => { const u = { ...prev, [name]: (prev[name] || []).filter(m => m.id !== id) }; saveSection("piChat", u).then(() => { pendingSavesRef.current--; }); return u; });
    }, [saveSection]);
    const handleClearPiChat = useCallback((name: string) => {
        pendingSavesRef.current++; setPiChat(prev => { const u = { ...prev, [name]: [] }; saveSection("piChat", u).then(() => { pendingSavesRef.current--; }); return u; });
    }, [saveSection]);
    const handleUpdatePiChat = useCallback((name: string, msg: TeamChatMsg) => {
        pendingSavesRef.current++;
        setPiChat(prev => {
            const u = { ...prev, [name]: (prev[name] || []).map(m => m.id === msg.id ? msg : m) };
            saveSection("piChat", u).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);

    // All teamMemos handlers use functional updaters to avoid stale closure bugs.
    // teamMemos stores kanban + chat + files in a single Redis key, so any handler
    // reading from a stale closure could overwrite another field's recent changes.
    const handleSaveTeamMemo = useCallback((teamName: string, card: TeamMemoCard) => {
        let isNew = false;
        pendingSavesRef.current++;
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const found = data.kanban.find(c => c.id === card.id);
            isNew = !found;
            const updated = found ? data.kanban.map(c => c.id === card.id ? card : c) : [...data.kanban, card];
            const toSave = { ...prev, [teamName]: { ...data, kanban: updated } };
            if (isNew) {
                trackSave(card.id, "teamMemos", toSave, () => setTeamMemos(p => { const d = p[teamName] || { kanban: [], chat: [] }; return { ...p, [teamName]: { ...d, kanban: d.kanban.filter(c => c.id !== card.id) } }; }));
                pendingSavesRef.current--; // trackSave manages its own ref
            } else {
                saveSection("teamMemos", toSave).then(() => { pendingSavesRef.current--; });
            }
            return toSave;
        });
    }, [saveSection, trackSave]);
    const handleDeleteTeamMemo = useCallback((teamName: string, id: number) => {
        pendingSavesRef.current++;
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const toSave = { ...prev, [teamName]: { ...data, kanban: data.kanban.filter(c => c.id !== id) } };
            saveSection("teamMemos", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleReorderTeamMemo = useCallback((teamName: string, cards: TeamMemoCard[]) => {
        pendingSavesRef.current++;
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const toSave = { ...prev, [teamName]: { ...data, kanban: cards } };
            saveSection("teamMemos", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    // ── Experiment Log entry handlers (flat) ──
    const handleSaveExpLogEntry = useCallback((teamName: string, entry: ExpLogEntry) => {
        pendingSavesRef.current++;
        setExperimentLogs(prev => {
            const entries = prev[teamName] || [];
            const found = entries.find(e => e.id === entry.id);
            const updated = found ? entries.map(e => e.id === entry.id ? entry : e) : [...entries, entry];
            const toSave = { ...prev, [teamName]: updated };
            saveSection("experimentLogs", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleDeleteExpLogEntry = useCallback((teamName: string, entryId: number) => {
        pendingSavesRef.current++;
        setExperimentLogs(prev => {
            const toSave = { ...prev, [teamName]: (prev[teamName] || []).filter(e => e.id !== entryId) };
            saveSection("experimentLogs", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleSaveExpLogCategories = useCallback((teamName: string, cats: Array<{name: string; members: string[]}>) => {
        pendingSavesRef.current++;
        setExpLogCategories(prev => {
            const toSave = { ...prev, [teamName]: cats };
            saveSection("experimentLogCategories", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    // ── Analysis Log entry handlers (flat) ──
    const handleSaveAnalysisLogEntry = useCallback((teamName: string, entry: AnalysisLogEntry) => {
        pendingSavesRef.current++;
        setAnalysisLogs(prev => {
            const entries = prev[teamName] || [];
            const found = entries.find(e => e.id === entry.id);
            const updated = found ? entries.map(e => e.id === entry.id ? entry : e) : [...entries, entry];
            const toSave = { ...prev, [teamName]: updated };
            saveSection("analysisLogs", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleDeleteAnalysisLogEntry = useCallback((teamName: string, entryId: number) => {
        pendingSavesRef.current++;
        setAnalysisLogs(prev => {
            const toSave = { ...prev, [teamName]: (prev[teamName] || []).filter(e => e.id !== entryId) };
            saveSection("analysisLogs", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleSaveAnalysisLogCategories = useCallback((teamName: string, cats: Array<{name: string; members: string[]}>) => {
        pendingSavesRef.current++;
        setAnalysisLogCategories(prev => {
            const toSave = { ...prev, [teamName]: cats };
            saveSection("analysisLogCategories", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleRenameExpLogCategory = useCallback((teamName: string, oldName: string, newName: string) => {
        if (!newName.trim() || newName === oldName) return;
        setExpLogCategories(prev => {
            const cats = (prev[teamName] || []).map(c => c.name === oldName ? { ...c, name: newName } : c);
            const toSave = { ...prev, [teamName]: cats };
            pendingSavesRef.current++; saveSection("experimentLogCategories", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
        // Update entries referencing old category
        pendingSavesRef.current++;
        setExperimentLogs(prev => {
            const entries = (prev[teamName] || []).map(e => e.category === oldName ? { ...e, category: newName } : e);
            const toSave = { ...prev, [teamName]: entries };
            saveSection("experimentLogs", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
        setActiveTab(prev => prev === `expLog_${teamName}_${oldName}` ? `expLog_${teamName}_${newName}` : prev);
    }, [saveSection]);
    const handleRenameAnalysisLogCategory = useCallback((teamName: string, oldName: string, newName: string) => {
        if (!newName.trim() || newName === oldName) return;
        setAnalysisLogCategories(prev => {
            const cats = (prev[teamName] || []).map(c => c.name === oldName ? { ...c, name: newName } : c);
            const toSave = { ...prev, [teamName]: cats };
            pendingSavesRef.current++; saveSection("analysisLogCategories", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
        pendingSavesRef.current++;
        setAnalysisLogs(prev => {
            const entries = (prev[teamName] || []).map(e => e.category === oldName ? { ...e, category: newName } : e);
            const toSave = { ...prev, [teamName]: entries };
            saveSection("analysisLogs", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
        setActiveTab(prev => prev === `analysisLog_${teamName}_${oldName}` ? `analysisLog_${teamName}_${newName}` : prev);
    }, [saveSection]);
    const handleAddTeamChat = useCallback((teamName: string, msg: TeamChatMsg) => {
        pendingSavesRef.current++;
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const newChat = [...data.chat, { ...msg, _sending: true }];
            const next = { ...prev, [teamName]: { ...data, chat: newChat } };
            const cleanToSave = { ...next, [teamName]: { ...next[teamName], chat: stripMsgFlags(newChat) } };
            saveSection("teamMemos", cleanToSave).then(ok => {
                pendingSavesRef.current--;
                setTeamMemos(p => {
                    const td = p[teamName] || { kanban: [], chat: [] };
                    return { ...p, [teamName]: { ...td, chat: td.chat.map(m => m.id === msg.id ? (ok ? { ...m, _sending: undefined } : { ...m, _sending: undefined, _failed: true }) : m) } };
                });
            });
            return next;
        });
    }, [saveSection]);
    const handleRetryTeamChat = useCallback((teamName: string, msgId: number) => {
        pendingSavesRef.current++;
        setTeamMemos(prev => {
            const td = prev[teamName] || { kanban: [], chat: [] };
            const updated = { ...prev, [teamName]: { ...td, chat: td.chat.map(m => m.id === msgId ? { ...m, _sending: true, _failed: undefined } : m) } };
            saveSection("teamMemos", { ...updated, [teamName]: { ...updated[teamName], chat: stripMsgFlags(updated[teamName].chat) } }).then(ok => {
                pendingSavesRef.current--;
                setTeamMemos(p => {
                    const d = p[teamName] || { kanban: [], chat: [] };
                    return { ...p, [teamName]: { ...d, chat: d.chat.map(m => m.id === msgId ? (ok ? { ...m, _sending: undefined } : { ...m, _sending: undefined, _failed: true }) : m) } };
                });
            });
            return updated;
        });
    }, [saveSection]);
    const handleUpdateTeamChat = useCallback((teamName: string, msg: TeamChatMsg) => {
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const toSave = { ...prev, [teamName]: { ...data, chat: data.chat.map(c => c.id === msg.id ? msg : c) } };
            pendingSavesRef.current++;
            saveSection("teamMemos", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleDeleteTeamChat = useCallback((teamName: string, id: number) => {
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const toSave = { ...prev, [teamName]: { ...data, chat: data.chat.filter(c => c.id !== id) } };
            pendingSavesRef.current++;
            saveSection("teamMemos", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleClearTeamChat = useCallback((teamName: string) => {
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const toSave = { ...prev, [teamName]: { ...data, chat: [] } };
            pendingSavesRef.current++;
            saveSection("teamMemos", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);
    const handleAddTeamFile = useCallback((teamName: string, file: LabFile) => {
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            const toSave = { ...prev, [teamName]: { ...data, files: [...(data.files || []), file] } };
            trackSave(file.id, "teamMemos", toSave, () => setTeamMemos(p => { const d = p[teamName] || { kanban: [], chat: [] }; return { ...p, [teamName]: { ...d, files: (d.files || []).filter(f => f.id !== file.id) } }; }));
            return toSave;
        });
    }, [trackSave]);
    const handleDeleteTeamFile = useCallback((teamName: string, id: number) => {
        pendingSavesRef.current++;
        setTeamMemos(prev => {
            const data = prev[teamName] || { kanban: [], chat: [], files: [] };
            // Delete blob first (fire-and-forget)
            const fileToDelete = (data.files || []).find(f => f.id === id);
            if (fileToDelete?.url?.startsWith("https://")) { fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: fileToDelete.url }), headers: getAuthHeaders() }).catch(e => console.warn("Background request failed:", e)); }
            const toSave = { ...prev, [teamName]: { ...data, files: (data.files || []).filter(f => f.id !== id) } };
            saveSection("teamMemos", toSave).then(() => { pendingSavesRef.current--; });
            return toSave;
        });
    }, [saveSection]);

    const handleAddLabChat = useCallback((msg: TeamChatMsg) => {
        setLabChat(prev => [...prev, { ...msg, _sending: true }]);
        pendingSavesRef.current++;
        setLabChat(cur => {
            saveSection("labChat", stripMsgFlags(cur)).then(ok => {
                pendingSavesRef.current--;
                setLabChat(p => p.map(m => m.id === msg.id ? { ...m, _sending: undefined, ...(ok ? {} : { _failed: true }) } : m));
            });
            return cur;
        });
    }, [saveSection]);
    const handleRetryLabChat = useCallback((msgId: number) => {
        pendingSavesRef.current++;
        setLabChat(prev => {
            const updated = prev.map(m => m.id === msgId ? { ...m, _sending: true, _failed: undefined } : m);
            saveSection("labChat", stripMsgFlags(updated)).then(ok => {
                pendingSavesRef.current--;
                setLabChat(p => p.map(m => m.id === msgId ? { ...m, _sending: undefined, ...(ok ? {} : { _failed: true }) } : m));
            });
            return updated;
        });
    }, [saveSection]);
    const handleDeleteLabChat = useCallback((id: number) => {
        pendingSavesRef.current++;
        setLabChat(prev => {
            const u = prev.filter(c => c.id !== id);
            saveSection("labChat", stripMsgFlags(u)).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleClearLabChat = useCallback(() => {
        pendingSavesRef.current++;
        setLabChat([]);
        saveSection("labChat", []).then(() => { pendingSavesRef.current--; });
    }, [saveSection]);
    const handleUpdateLabChat = useCallback((msg: TeamChatMsg) => {
        pendingSavesRef.current++;
        setLabChat(prev => {
            const u = prev.map(m => m.id === msg.id ? msg : m);
            saveSection("labChat", stripMsgFlags(u)).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    // ─── Casual Chat (잡담) handlers ─────────────────────────────────
    const handleAddCasualChat = useCallback((msg: TeamChatMsg) => {
        setCasualChat(prev => [...prev, { ...msg, _sending: true }]);
        pendingSavesRef.current++;
        setCasualChat(cur => {
            saveSection("casualChat", stripMsgFlags(cur)).then(ok => {
                pendingSavesRef.current--;
                setCasualChat(p => p.map(m => m.id === msg.id ? { ...m, _sending: undefined, ...(ok ? {} : { _failed: true }) } : m));
            });
            return cur;
        });
    }, [saveSection]);
    const handleRetryCasualChat = useCallback((msgId: number) => {
        pendingSavesRef.current++;
        setCasualChat(prev => {
            const updated = prev.map(m => m.id === msgId ? { ...m, _sending: true, _failed: undefined } : m);
            saveSection("casualChat", stripMsgFlags(updated)).then(ok => {
                pendingSavesRef.current--;
                setCasualChat(p => p.map(m => m.id === msgId ? { ...m, _sending: undefined, ...(ok ? {} : { _failed: true }) } : m));
            });
            return updated;
        });
    }, [saveSection]);
    const handleDeleteCasualChat = useCallback((id: number) => {
        pendingSavesRef.current++;
        setCasualChat(prev => {
            const u = prev.filter(c => c.id !== id);
            saveSection("casualChat", stripMsgFlags(u)).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleClearCasualChat = useCallback(() => {
        pendingSavesRef.current++;
        setCasualChat([]);
        saveSection("casualChat", []).then(() => { pendingSavesRef.current--; });
    }, [saveSection]);
    const handleUpdateCasualChat = useCallback((msg: TeamChatMsg) => {
        pendingSavesRef.current++;
        setCasualChat(prev => {
            const u = prev.map(m => m.id === msg.id ? msg : m);
            saveSection("casualChat", stripMsgFlags(u)).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    // ─── AI Bot Chat Handlers ────────────────────────────────────────────────
    const handleAddAiBotChat = useCallback((msg: TeamChatMsg) => {
        setAiBotChat(prev => [...prev, { ...msg, _sending: true }]);
        pendingSavesRef.current++;
        setAiBotChat(cur => {
            saveSection("aiBotChat", stripMsgFlags(cur)).then(ok => {
                pendingSavesRef.current--;
                setAiBotChat(p => p.map(m => m.id === msg.id ? { ...m, _sending: undefined, ...(ok ? {} : { _failed: true }) } : m));
            });
            return cur;
        });
    }, [saveSection]);
    const handleUpdateAiBotChat = useCallback((msg: TeamChatMsg) => {
        pendingSavesRef.current++;
        setAiBotChat(prev => {
            const u = prev.map(m => m.id === msg.id ? msg : m);
            saveSection("aiBotChat", stripMsgFlags(u)).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleDeleteAiBotChat = useCallback((id: number) => {
        pendingSavesRef.current++;
        setAiBotChat(prev => {
            const u = prev.filter(c => c.id !== id);
            saveSection("aiBotChat", stripMsgFlags(u)).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleClearAiBotChat = useCallback(() => {
        pendingSavesRef.current++;
        setAiBotChat([]);
        saveSection("aiBotChat", []).then(() => { pendingSavesRef.current--; });
    }, [saveSection]);
    // ─── AI Bot Board Handlers ──────────────────────────────────────────────
    const handleSaveAiBotBoard = useCallback((card: TeamMemoCard) => {
        pendingSavesRef.current++;
        setAiBotBoard(prev => {
            const exists = prev.some(c => c.id === card.id);
            const u = exists ? prev.map(c => c.id === card.id ? card : c) : [...prev, card];
            if (exists) {
                saveSection("aiBotBoard", u).then(() => { pendingSavesRef.current--; });
            } else {
                trackSave(card.id, "aiBotBoard", u, () => setAiBotBoard(p => p.filter(c => c.id !== card.id)));
                pendingSavesRef.current--;
            }
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteAiBotBoard = useCallback((id: number) => {
        pendingSavesRef.current++;
        setAiBotBoard(prev => {
            const u = prev.filter(c => c.id !== id);
            saveSection("aiBotBoard", u).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleSaveLabBoard = useCallback((card: TeamMemoCard) => {
        pendingSavesRef.current++;
        setLabBoard(prev => {
            const exists = prev.some(c => c.id === card.id);
            const u = exists ? prev.map(c => c.id === card.id ? card : c) : [...prev, card];
            if (exists) {
                saveSection("labBoard", u).then(() => { pendingSavesRef.current--; });
            } else {
                trackSave(card.id, "labBoard", u, () => setLabBoard(p => p.filter(c => c.id !== card.id)));
                pendingSavesRef.current--; // trackSave manages its own ref
            }
            return u;
        });
    }, [saveSection, trackSave]);
    const handleDeleteLabBoard = useCallback((id: number) => {
        pendingSavesRef.current++;
        setLabBoard(prev => {
            const u = prev.filter(c => c.id !== id);
            saveSection("labBoard", u).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleAddLabFile = useCallback((file: LabFile) => {
        setLabFiles(prev => {
            const u = [...prev, file];
            trackSave(file.id, "labFiles", u, () => setLabFiles(pp => pp.filter(f => f.id !== file.id)));
            return u;
        });
    }, [trackSave]);
    const handleDeleteLabFile = useCallback((id: number) => {
        pendingSavesRef.current++;
        setLabFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.url?.startsWith("https://")) { fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: file.url }), headers: getAuthHeaders() }).catch(e => console.warn("파일 삭제 실패:", e)); }
            const u = prev.filter(f => f.id !== id);
            saveSection("labFiles", u).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleDispatchSave = useCallback((d: { id: number; name: string; start: string; end: string; description: string }) => {
        pendingSavesRef.current++;
        setDispatches(prev => {
            const u = d.id && prev.find(x => x.id === d.id) ? prev.map(x => x.id === d.id ? d : x) : [...prev, d];
            saveSection("dispatches", u).then(() => { pendingSavesRef.current--; });
            return u;
        });
    }, [saveSection]);
    const handleDispatchDelete = useCallback((id: number) => {
        pendingSavesRef.current++; setDispatches(prev => { const u = prev.filter(x => x.id !== id); saveSection("dispatches", u).then(() => { pendingSavesRef.current--; }); return u; });
    }, [saveSection]);
    // ─── Notification Center helpers ─────────────────────────────────────────
    const NOTI_SECTION_MAP: Record<string, { label: string; icon: string; tabId: string }> = {
        papers: { label: "논문", icon: "📄", tabId: "papers" },
        reports: { label: "보고서", icon: "📋", tabId: "reports" },
        experiments: { label: "실험", icon: "🧪", tabId: "experiments" },
        analyses: { label: "해석", icon: "🖥️", tabId: "analysis" },
        todos: { label: "할일", icon: "✅", tabId: "todos" },
        patents: { label: "특허", icon: "💡", tabId: "ip" },
        announcements: { label: "공지", icon: "📢", tabId: "announcements" },
        conferences: { label: "학회", icon: "✈️", tabId: "conferenceTrips" },
        meetings: { label: "회의", icon: "📝", tabId: "meetings" },
        resources: { label: "자료", icon: "📁", tabId: "resources" },
        ideas: { label: "아이디어", icon: "💡", tabId: "ideas" },
        chatPosts: { label: "잡담 with AI", icon: "💡", tabId: "chat" },
        aiBotChat: { label: "AI 봇", icon: "🤖", tabId: "chat" },
        aiBotBoard: { label: "잡담 보드", icon: "📌", tabId: "chat" },
        teams: { label: "팀", icon: "👥", tabId: "teams" },
        dailyTargets: { label: "오늘 목표", icon: "🎯", tabId: "daily" },
        schedule: { label: "일정", icon: "📅", tabId: "calendar" },
        philosophy: { label: "연구 철학", icon: "📢", tabId: "announcements" },
        labChat: { label: "연구실 채팅", icon: "💬", tabId: "labChat" },
        labBoard: { label: "게시판", icon: "📌", tabId: "labChat" },
        teamMemos: { label: "팀 메모", icon: "📌", tabId: "overview" },
        piChat: { label: "PI 채팅", icon: "💬", tabId: "overview" },
        personalMemos: { label: "메모", icon: "📝", tabId: "overview" },
        timetable: { label: "시간표", icon: "📚", tabId: "lectures" },
        vacations: { label: "휴가", icon: "🏖️", tabId: "calendar" },
        lectures: { label: "수업", icon: "📚", tabId: "lectures" },
        dispatches: { label: "출장", icon: "✈️", tabId: "calendar" },
        equipmentList: { label: "장비", icon: "🔧", tabId: "experiments" },
        analysisToolList: { label: "해석 도구", icon: "🛠️", tabId: "analysis" },
        paperTagList: { label: "태그", icon: "🏷️", tabId: "papers" },
        personalFiles: { label: "파일", icon: "📎", tabId: "overview" },
        labFiles: { label: "파일", icon: "📎", tabId: "labChat" },
        statusMessages: { label: "한마디", icon: "💬", tabId: "overview" },
        customEmojis: { label: "이모지", icon: "😀", tabId: "settings" },
        experimentLogs: { label: "실험 일지", icon: "🧪", tabId: "experiments" },
        analysisLogs: { label: "해석 일지", icon: "🖥️", tabId: "analysis" },
        members: { label: "멤버", icon: "👥", tabId: "overview" },
    };
    // Comprehensive alerts: @mentions, chats, board posts, announcements, updates
    type AlertItem = { author: string; text: string; section: string; tabId: string; timestamp: number; type: "mention" | "chat" | "announcement" | "board" | "update" };
    const alerts = useMemo(() => {
        const items: AlertItem[] = [];
        const seen = new Set<string>(); // prevent duplicates (mention + chat)
        const mentionTag = `@${userName}`;
        const myTeams = userName === "박일웅" ? teamNames : teamNames.filter(t => teams[t]?.lead === userName || teams[t]?.members?.includes(userName));

        // Single-pass helper: classify each message as mention or chat
        const addMsgs = (msgs: typeof labChat, keyPrefix: string, section: string, tabId: string) => {
            for (const m of msgs) {
                if (m.author === userName || m.deleted) continue;
                const isMention = m.text?.includes(mentionTag);
                items.push({ author: m.author, text: m.text, section, tabId, timestamp: m.id, type: isMention ? "mention" : "chat" });
            }
        };

        // 1) Lab chat + casual chat (single pass each)
        addMsgs(labChat, "lab", "연구실 채팅", "labChat");
        addMsgs(aiBotChat, "aibot", "AI 봇", "chat");

        // 2) Team chat (user's teams)
        myTeams.forEach(tName => addMsgs(teamMemos[tName]?.chat || [], `tm_${tName}`, tName, `teamMemo_${tName}`));

        // 3) PI chat
        if (userName === "박일웅") {
            Object.entries(piChat).forEach(([name, msgs]) => addMsgs(msgs, `pi_${name}`, `${name} 채팅`, `memo_${name}`));
        } else {
            addMsgs(piChat[userName] || [], `pi_${userName}`, "PI 채팅", `memo_${userName}`);
        }

        // 4) Announcements
        announcements.filter(a => a.author !== userName)
            .forEach(a => items.push({ author: a.author, text: a.text, section: "공지사항", tabId: "announcements", timestamp: new Date(a.date).getTime() * 100, type: "announcement" }));

        // 6) Lab board new posts
        labBoard.filter(b => b.author !== userName)
            .forEach(b => items.push({ author: b.author, text: b.title, section: "게시판", tabId: "labChat", timestamp: b.id, type: "board" }));

        // 6b) AI bot board new posts
        aiBotBoard.filter(b => b.author !== userName)
            .forEach(b => items.push({ author: b.author, text: b.title, section: "잡담 보드", tabId: "chat", timestamp: b.id, type: "board" }));

        // 7) Team board new posts (user's teams)
        myTeams.forEach(tName => {
            (teamMemos[tName]?.kanban || []).filter(c => c.author !== userName)
                .forEach(c => items.push({ author: c.author, text: c.title, section: `${tName} 보드`, tabId: `teamMemo_${tName}`, timestamp: c.id, type: "board" }));
        });

        // 8) Modification logs as "update" alerts (non-chat sections only)
        const chatSections = new Set(["labChat", "teamMemos", "piChat", "labBoard", "aiBotBoard", "announcements"]);
        notiLogs.filter(l => l.userName !== userName && !chatSections.has(l.section)).slice(0, 100)
            .forEach(l => {
                const sec = NOTI_SECTION_MAP[l.section] || { label: l.section, icon: "📋", tabId: "overview" };
                const tabId = l.section === "personalMemos" ? `memo_${l.detail || l.userName}` : sec.tabId;
                const label = l.section === "personalMemos" ? `${l.detail || l.userName} 메모` : sec.label;
                items.push({ author: l.userName, text: `${label}을(를) 업데이트했습니다`, section: label, tabId, timestamp: l.timestamp * 100, type: "update" });
            });

        return items.sort((a, b) => b.timestamp - a.timestamp);
    }, [labChat, aiBotChat, teamMemos, piChat, userName, announcements, labBoard, aiBotBoard, teams, teamNames, notiLogs]);

    const notiUnreadCount = useMemo(() => alerts.filter(a => a.timestamp > notiLastSeen).length, [alerts, notiLastSeen]);
    const [notiFilter, setNotiFilter] = useState<"all" | "mention" | "chat" | "announcement" | "board" | "update">("all");
    const filteredAlerts = useMemo(() => notiFilter === "all" ? alerts : alerts.filter(a => a.type === notiFilter), [alerts, notiFilter]);
    const openNoti = () => {
        setNotiOpen(true);
        markNotiRead();
    };
    const markNotiRead = () => {
        // genId() = Date.now()*100 + seq, so notiLastSeen must use same scale
        const now = Date.now() * 100 + 99;
        setNotiLastSeen(now);
        try { localStorage.setItem(`mftel_notiLastSeen_${userName}`, String(now)); } catch (e) { console.warn("notiLastSeen save failed:", e); }
    };
    const PUSH_CATEGORIES = [
        { key: "chat", label: "채팅", desc: "연구실 채팅, 팀 메모, PI 채팅" },
        { key: "aibot", label: "AI 봇", desc: "잡담 with AI 봇 응답" },
        { key: "announcement", label: "공지", desc: "공지사항" },
        { key: "board", label: "게시판", desc: "게시판, 파일" },
        { key: "research", label: "연구", desc: "논문, 보고서, 실험, 해석, 특허" },
        { key: "other", label: "기타", desc: "일정, 할일, 목표, 학회 등" },
    ];
    const myPushPrefs = pushPrefs[userName] || {};
    const togglePushPref = (cat: string) => {
        const current = myPushPrefs[cat] !== false; // default true
        const next = { ...pushPrefs, [userName]: { ...myPushPrefs, [cat]: !current } };
        setPushPrefs(next);
        const tk = localStorage.getItem("dashToken");
        if (tk) fetch("/api/dashboard", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tk}` }, body: JSON.stringify({ section: "pushPrefs", data: next, userName }) }).catch(e => console.warn("Background request failed:", e));
    };
    const notiTimeAgo = (ts: number) => {
        const ms = Math.floor(ts / 100); // convert genId-scale (Date.now()*100) back to ms
        const diff = Math.floor((Date.now() - ms) / 1000);
        if (diff < 60) return "방금 전";
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
        return new Date(ms).toLocaleDateString("ko-KR");
    };

    // Tab notification: flash title + favicon badge when hidden & unread
    const totalUnread = useMemo(() => {
        const labNew = labChat.filter(m => m.author !== userName && m.id > (chatReadTs.labChat || 0)).length;
        const annNew = announcements.filter(a => a.author !== userName && a.id > (chatReadTs.announcements || 0)).length;
        const aiNew = aiBotChat.filter(m => m.author !== userName && m.id > (chatReadTs.chat || 0)).length + aiBotBoard.filter(c => c.author !== userName && c.id > (chatReadTs.chat || 0)).length;
        const teamNew = teamNames.reduce((sum, t) => {
            const ts = chatReadTs[`teamMemo_${t}`] || 0;
            return sum + (teamMemos[t]?.chat || []).filter(m => m.author !== userName && m.id > ts).length;
        }, 0);
        const piNew = memberNames.reduce((sum, n) => sum + (piChat[n] || []).filter(m => m.author !== userName && m.id > (chatReadTs[`memo_${n}`] || 0)).length, 0);
        const total = labNew + annNew + aiNew + teamNew + piNew;
        return total;
    }, [labChat, announcements, aiBotChat, aiBotBoard, teamMemos, piChat, chatReadTs, userName, teamNames, memberNames]);

    const lastBadgeCountRef = useRef(-1);
    useEffect(() => {
        const ORIGINAL_TITLE = "MFTEL Dashboard";
        let intervalId: ReturnType<typeof setInterval> | null = null;
        let isOriginal = true;
        // Favicon badge helper (cached — skip if count unchanged)
        const setFaviconBadge = (count: number) => {
            if (lastBadgeCountRef.current === count) return;
            lastBadgeCountRef.current = count;
            const canvas = document.createElement("canvas");
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.fillStyle = "#3B82F6"; ctx.beginPath(); ctx.roundRect(2, 2, 28, 28, 6); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("M", 16, 17);
            if (count > 0) {
                const label = count > 99 ? "99+" : String(count);
                ctx.fillStyle = "#EF4444"; ctx.beginPath(); ctx.arc(26, 6, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff"; ctx.font = `bold ${count > 99 ? 7 : 9}px sans-serif`; ctx.fillText(label, 26, 7);
            }
            let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
            if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
            link.href = canvas.toDataURL("image/png");
        };

        const startFlash = () => {
            if (intervalId) return;
            intervalId = setInterval(() => {
                document.title = isOriginal ? `(${totalUnread}) 새 알림 — MFTEL` : ORIGINAL_TITLE;
                isOriginal = !isOriginal;
            }, 1500);
        };
        const stopFlash = () => {
            if (intervalId) { clearInterval(intervalId); intervalId = null; }
            document.title = ORIGINAL_TITLE;
            isOriginal = true;
        };
        const onVisChange = () => {
            if (document.hidden && totalUnread > 0) startFlash();
            else stopFlash();
        };
        setFaviconBadge(totalUnread);
        if (document.hidden && totalUnread > 0) startFlash();
        document.addEventListener("visibilitychange", onVisChange);
        return () => { stopFlash(); document.removeEventListener("visibilitychange", onVisChange); };
    }, [totalUnread]);

    const discussionCounts = useMemo<Record<string, number>>(() => ({
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
    }), [todos, papers, reports, ipPatents, experiments, analyses, resources, ideas, chatPosts, meetings, teamNames, teamMemos, memberNames, personalMemos]);

    const unreadCounts = useMemo<Record<string, number>>(() => ({
        labChat: labChat.filter(m => m.author !== userName && m.id > (chatReadTs.labChat || 0)).length + labBoard.filter(c => c.author !== userName && c.id > (chatReadTs.labChat || 0)).length,
        chat: aiBotChat.filter(m => m.author !== userName && m.id > (chatReadTs.chat || 0)).length + aiBotBoard.filter(c => c.author !== userName && c.id > (chatReadTs.chat || 0)).length,
        announcements: announcements.filter(a => a.author !== userName && a.id > (chatReadTs.announcements || 0)).length,
        ...Object.fromEntries(teamNames.map(t => {
            const ts = chatReadTs[`teamMemo_${t}`] || 0;
            const chatNew = (teamMemos[t]?.chat || []).filter(m => m.author !== userName && m.id > ts).length;
            const boardNew = (teamMemos[t]?.kanban || []).filter(c => c.author !== userName && c.id > ts).length;
            return [`teamMemo_${t}`, chatNew + boardNew];
        })),
        ...Object.fromEntries(memberNames.map(name => [`memo_${name}`, (piChat[name] || []).filter(m => m.author !== userName && m.id > (chatReadTs[`memo_${name}`] || 0)).length])),
    }), [labChat, aiBotChat, aiBotBoard, labBoard, announcements, teamNames, teamMemos, memberNames, piChat, chatReadTs, userName]);

    if (!authChecked) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white animate-pulse" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>M</div>
                <p className="text-slate-400 text-[14px]">로그인 확인 중...</p>
            </div>
        </div>
    );
    if (!loggedIn && !mustChangePassword) return <LoginScreen onLogin={handleLogin} members={displayMembers} />;

    if (mustChangePassword) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full" style={{ maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl" style={{ background: "#FEF3C7" }}>🔒</div>
                    <h2 className="text-[18px] font-bold text-slate-800">비밀번호 변경 필요</h2>
                    <p className="text-[13px] text-slate-400 mt-1">보안을 위해 기본 비밀번호를 변경해주세요.</p>
                </div>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const newPw = (form.elements.namedItem("newPw") as HTMLInputElement).value;
                    const confirmPw = (form.elements.namedItem("confirmPw") as HTMLInputElement).value;
                    if (newPw.length < 4) { showToast("비밀번호는 4자 이상이어야 합니다."); return; }
                    if (newPw === "0000") { showToast("기본 비밀번호와 같은 비밀번호는 사용할 수 없습니다."); return; }
                    if (newPw !== confirmPw) { showToast("비밀번호가 일치하지 않습니다."); return; }
                    try {
                        const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "changePassword", userName, currentPassword: "0000", newPassword: newPw }) });
                        const data = await res.json();
                        if (!res.ok) { showToast(data.error || "변경 실패"); return; }
                        setMustChangePassword(false); setLoggedIn(true);
                        const token = localStorage.getItem("mftel-auth-token");
                        if (token) {
                            const authH = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
                            fetchData(); fetchOnline(); fetchLogs();
                            fetch("/api/dashboard", { method: "POST", headers: authH, body: JSON.stringify({ section: "online", action: "join", userName }) }).catch(() => {});
                        }
                        showToast("비밀번호가 변경되었습니다!", "success");
                    } catch { showToast("서버 연결 실패"); }
                }} className="space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium text-slate-600 mb-1">새 비밀번호</label>
                        <input name="newPw" type="password" required minLength={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="4자 이상" />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium text-slate-600 mb-1">비밀번호 확인</label>
                        <input name="confirmPw" type="password" required minLength={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="다시 입력" />
                    </div>
                    <button type="submit" className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-colors" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>비밀번호 변경</button>
                </form>
            </div>
            {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 text-white text-[13px] rounded-full shadow-lg" style={{ background: toastType === "success" ? "#10B981" : "#334155", animation: "toastSlideIn 0.25s ease" }}>{toastType === "success" ? "✓ " : ""}{toast}</div>}
        </div>
    );

    const isFullHeightTab = activeTab === "labChat" || activeTab === "chat" || activeTab.startsWith("teamMemo_") || activeTab.startsWith("memo_");

    return (
        <MembersContext.Provider value={displayMembers}>
        <SavingContext.Provider value={savingIds}>
        <ConfirmDeleteContext.Provider value={confirmDel}>
        <ErrorBoundary>
        <div className="dashboard-root min-h-screen bg-[#F8FAFC] text-slate-800 leading-normal" style={{ fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}>

            {/* Mobile top header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-[56px] px-4" style={{background:"#0F172A", boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
                <button onClick={() => setMobileMenuOpen(true)} className="text-[22px] text-white w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/10">☰</button>
                <span className="text-[15px] font-bold text-white truncate">{(() => { const found = tabs.find(t => t.id === activeTab); const extra: Record<string, string> = { teams: "팀 관리", settings: "설정", admin_members: "🔑 멤버 관리", admin_backups: "💾 백업 관리", admin_access: "🔐 접속 로그", admin_menus: "📋 메뉴 관리" }; return found ? `${found.icon} ${found.label}` : extra[activeTab] || "대시보드"; })()}</span>
                <div className="flex items-center gap-2">
                    <button onClick={openNoti} className="relative w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        {notiUnreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-0.5">{notiUnreadCount > 99 ? "99+" : notiUnreadCount}</span>}
                    </button>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] flex-shrink-0" style={{background:"rgba(59,130,246,0.1)", border:"1.5px solid rgba(59,130,246,0.25)"}}>{displayMembers[userName]?.emoji || "👤"}</div>
                </div>
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
                                <div className="text-[11px] truncate" style={{color:"#64748B"}}>Multiphase Flow & Thermal Energy</div>
                            </div>
                        </button>
                        <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-2 dark-scrollbar">
                            {tabs.map((tab, i) => {
                                const tabSection = menuConfigMap.get(tab.id)?.section;
                                const prevTabSection = i > 0 ? menuConfigMap.get(tabs[i - 1].id)?.section : undefined;
                                const sectionLabels: Record<string, string> = { "운영": "운영", "내 노트": "내 노트", "연구": "연구", "커뮤니케이션": "커뮤니케이션" };
                                const showBreak = !tab.id.startsWith("memo_") && !tab.id.startsWith("teamMemo_") && tabSection && sectionLabels[tabSection] && tabSection !== prevTabSection && tabSection !== "대시보드";
                                const showTeamMemoBreak = tab.id.startsWith("teamMemo_") && i > 0 && !tabs[i - 1].id.startsWith("teamMemo_");
                                const isActive = activeTab === tab.id;
                                return (
                                    <div key={tab.id}>
                                        {showBreak && <div className="mt-5 mb-1.5 px-4"><div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>{sectionLabels[tabSection!]}</div></div>}
                                        {showTeamMemoBreak && <div className="mt-5 mb-1.5 px-4"><div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>팀 워크</div></div>}
                                        <button onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                                            className="relative w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] whitespace-nowrap transition-all"
                                            style={{ fontWeight: isActive ? 600 : 450, color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                            <span className="text-[15px]">{tab.icon}</span><span>{tab.label}</span>
                                        </button>
                                    </div>
                                );
                            })}
                            {userName === "박일웅" && <div className="mt-5 mb-1.5 px-4"><div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>관리</div></div>}
                            {userName === "박일웅" && <button onClick={() => { setActiveTab("teams"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13px] whitespace-nowrap" style={{ fontWeight: activeTab === "teams" ? 600 : 450, color: activeTab === "teams" ? "#FFFFFF" : "#94A3B8", background: activeTab === "teams" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">👥</span><span>팀 관리</span>
                            </button>}
                            {userName === "박일웅" && <button onClick={() => { setActiveTab("admin_members"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13px] whitespace-nowrap" style={{ fontWeight: activeTab === "admin_members" ? 600 : 450, color: activeTab === "admin_members" ? "#FFFFFF" : "#94A3B8", background: activeTab === "admin_members" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">🔑</span><span>멤버 관리</span>
                            </button>}
                            {userName === "박일웅" && <button onClick={() => { setActiveTab("admin_backups"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13px] whitespace-nowrap" style={{ fontWeight: activeTab === "admin_backups" ? 600 : 450, color: activeTab === "admin_backups" ? "#FFFFFF" : "#94A3B8", background: activeTab === "admin_backups" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">💾</span><span>백업 관리</span>
                            </button>}
                            {userName === "박일웅" && <button onClick={() => { setActiveTab("admin_access"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13px] whitespace-nowrap" style={{ fontWeight: activeTab === "admin_access" ? 600 : 450, color: activeTab === "admin_access" ? "#FFFFFF" : "#94A3B8", background: activeTab === "admin_access" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">🔐</span><span>접속 로그</span>
                            </button>}
                            {userName === "박일웅" && <button onClick={() => { setActiveTab("admin_menus"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13px] whitespace-nowrap" style={{ fontWeight: activeTab === "admin_menus" ? 600 : 450, color: activeTab === "admin_menus" ? "#FFFFFF" : "#94A3B8", background: activeTab === "admin_menus" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">📋</span><span>메뉴 관리</span>
                            </button>}
                            <button onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }} className="relative w-full flex items-center gap-2.5 px-4 py-2 rounded-[10px] text-[13px] whitespace-nowrap" style={{ fontWeight: activeTab === "settings" ? 600 : 450, color: activeTab === "settings" ? "#FFFFFF" : "#94A3B8", background: activeTab === "settings" ? "rgba(59,130,246,0.15)" : "transparent" }}>
                                <span className="text-[15px]">⚙️</span><span>설정</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] flex-shrink-0" style={{background:"rgba(59,130,246,0.1)", border:"1.5px solid rgba(59,130,246,0.25)"}}>{displayMembers[userName]?.emoji || "👤"}</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] truncate text-white" style={{fontWeight:650}}>{userName}</div>
                                <div className="text-[11px]" style={{color:"#64748B"}}>{displayMembers[userName]?.role || "학생"}</div>
                            </div>
                            <button onClick={handleLogout} className="text-[16px]" style={{color:"#64748B"}} title="로그아웃">⏻</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col h-[100dvh] overflow-hidden md:flex-row md:h-screen pt-[56px] md:pt-0">
                {/* Desktop Sidebar */}
                <div className="hidden md:flex md:w-[180px] md:h-screen flex-shrink-0 flex-col" style={{background:"#0F172A", borderRight:"1px solid #1E293B", boxShadow:"2px 0 8px rgba(0,0,0,0.05)"}}>
                    {/* Sidebar top: MFTEL logo */}
                    <button onClick={() => setActiveTab("overview")} className="flex items-center gap-2.5 px-3 pt-4 pb-3 relative z-10 flex-shrink-0 cursor-pointer w-full text-left" style={{borderBottom:"1px solid rgba(255,255,255,0.08)", background:"#0F172A"}}>
                        <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}>M</div>
                        <div className="text-[13px] tracking-tight text-white" style={{fontWeight:750}}>MFTEL</div>
                    </button>
                    {/* Cmd+K Search Button */}
                    <button onClick={() => { setCmdKOpen(true); setCmdKQuery(""); setCmdKIdx(0); }}
                        className="hidden md:flex items-center gap-2 mx-2 mt-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94A3B8"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#64748B"; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <span className="flex-1 text-left">검색</span>
                        <kbd className="px-1 py-0.5 text-[11px] rounded" style={{ background: "rgba(255,255,255,0.1)", color: "#475569" }}>⌘K</kbd>
                    </button>
                    {/* Notification Bell */}
                    <button onClick={openNoti}
                        className="hidden md:flex items-center gap-2 mx-2 mt-1 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
                        style={{ background: "transparent", color: "#64748B" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94A3B8"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        <span className="flex-1 text-left">알림</span>
                        {notiUnreadCount > 0 && <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold" style={{ background: "#EF4444", color: "#fff" }}>{notiUnreadCount > 99 ? "99+" : notiUnreadCount}</span>}
                    </button>
                    {/* Sidebar nav */}
                    <div className="flex-1 min-h-0 flex flex-wrap md:flex-nowrap md:flex-col overflow-y-auto overflow-x-hidden md:overflow-x-visible p-3 md:p-0 md:pt-2 md:pb-2 md:px-1 gap-px dark-scrollbar">
                        {tabs.map((tab, i) => {
                            // Section break logic: check menuConfig section for this tab
                            const tabSection = menuConfigMap.get(tab.id)?.section;
                            const prevTabSection = i > 0 ? menuConfigMap.get(tabs[i - 1].id)?.section : undefined;
                            // Show section break when this tab belongs to a different menuConfig section than the previous
                            const sectionLabels: Record<string, string> = { "운영": "운영", "내 노트": "내 노트", "연구": "연구", "커뮤니케이션": "커뮤니케이션" };
                            const showBreak = !tab.id.startsWith("memo_") && !tab.id.startsWith("teamMemo_") && tabSection && sectionLabels[tabSection] && tabSection !== prevTabSection && tabSection !== "대시보드";
                            const showTeamMemoBreak = tab.id.startsWith("teamMemo_") && i > 0 && !tabs[i - 1].id.startsWith("teamMemo_");
                            const isActive = activeTab === tab.id;
                            return (
                                <div key={tab.id}>
                                    {showBreak && (
                                        <div className="hidden md:block mt-4 mb-1 px-3">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>{sectionLabels[tabSection!]}</div>
                                        </div>
                                    )}
                                    {showTeamMemoBreak && (
                                        <div className="hidden md:block mt-4 mb-1 px-3">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>팀 워크</div>
                                        </div>
                                    )}
                                    <button onClick={() => setActiveTab(tab.id)}
                                        className="relative w-full flex items-center gap-2 px-3 py-1.5 rounded-[10px] whitespace-nowrap transition-all"
                                        style={{ fontSize: "12.5px", fontWeight: isActive ? 600 : 450, letterSpacing: "-0.01em", color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#E2E8F0"; } }}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}>
                                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                        <span className="text-[14px]">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        {((unreadCounts[tab.id] || 0) > 0 || (discussionCounts[tab.id] || 0) > 0) && (
                                            <div className="flex items-center gap-1.5">
                                                {(unreadCounts[tab.id] || 0) > 0 && <span className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold" style={{background:"rgba(59,130,246,0.2)", color:"#60A5FA"}}>{unreadCounts[tab.id]}</span>}
                                                {(discussionCounts[tab.id] || 0) > 0 && <span className="w-[6px] h-[6px] rounded-full bg-orange-400" />}
                                            </div>
                                        )}
                                    </button>
                                    {/* Sub-menus for team log categories */}
                                    {tab.id.startsWith("teamMemo_") && (() => {
                                        const tName = tab.id.replace("teamMemo_", "");
                                        const expCats = (expLogCategories[tName] || []).filter(c => c.members.length === 0 || c.members.includes(userName));
                                        const anaCats = (analysisLogCategories[tName] || []).filter(c => c.members.length === 0 || c.members.includes(userName));
                                        if (expCats.length === 0 && anaCats.length === 0) return null;
                                        return (
                                            <div>
                                                {expCats.map(cat => {
                                                    const subId = `expLog_${tName}_${cat.name}`;
                                                    const isSubActive = activeTab === subId;
                                                    return (
                                                        <button key={subId} onClick={() => setActiveTab(subId)}
                                                            className="relative w-full flex items-center gap-1.5 pl-7 pr-3 py-1 rounded-[8px] whitespace-nowrap transition-all"
                                                            style={{ fontSize: "11.5px", fontWeight: isSubActive ? 600 : 400, color: isSubActive ? "#FFFFFF" : "#64748B", background: isSubActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                                            onMouseEnter={e => { if (!isSubActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94A3B8"; } }}
                                                            onMouseLeave={e => { if (!isSubActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isSubActive ? "#FFFFFF" : "#64748B"; } }}>
                                                            {isSubActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-sm bg-blue-400" />}
                                                            <span className="text-[12px]">✏️</span>
                                                            <span>{cat.name}</span>
                                                        </button>
                                                    );
                                                })}
                                                {anaCats.map(cat => {
                                                    const subId = `analysisLog_${tName}_${cat.name}`;
                                                    const isSubActive = activeTab === subId;
                                                    return (
                                                        <button key={subId} onClick={() => setActiveTab(subId)}
                                                            className="relative w-full flex items-center gap-1.5 pl-7 pr-3 py-1 rounded-[8px] whitespace-nowrap transition-all"
                                                            style={{ fontSize: "11.5px", fontWeight: isSubActive ? 600 : 400, color: isSubActive ? "#FFFFFF" : "#64748B", background: isSubActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                                            onMouseEnter={e => { if (!isSubActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94A3B8"; } }}
                                                            onMouseLeave={e => { if (!isSubActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isSubActive ? "#FFFFFF" : "#64748B"; } }}>
                                                            {isSubActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-sm bg-blue-400" />}
                                                            <span className="text-[12px]">💻</span>
                                                            <span>{cat.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                        {/* Admin: 관리 section */}
                        {userName === "박일웅" && (
                            <div className="hidden md:block mt-4 mb-1 px-3">
                                <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{color:"#475569"}}>관리</div>
                            </div>
                        )}
                        {userName === "박일웅" && [
                            { id: "teams", icon: "👥", label: "팀 관리" },
                            { id: "admin_members", icon: "🔑", label: "멤버 관리" },
                            { id: "admin_backups", icon: "💾", label: "백업 관리" },
                            { id: "admin_access", icon: "🔐", label: "접속 로그" },
                            { id: "admin_menus", icon: "📋", label: "메뉴 관리" },
                        ].map(t => {
                            const isActive = activeTab === t.id;
                            return (
                                <button key={t.id} onClick={() => setActiveTab(t.id)}
                                    className="relative w-full flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[13px] whitespace-nowrap transition-all"
                                    style={{ fontWeight: isActive ? 600 : 450, letterSpacing: "-0.01em", color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#E2E8F0"; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}>
                                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                    <span className="text-[14px]">{t.icon}</span>
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                        {(() => {
                            const isActive = activeTab === "settings";
                            return (
                                <button onClick={() => setActiveTab("settings")}
                                    className="relative w-full flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-[13px] whitespace-nowrap transition-all"
                                    style={{ fontWeight: isActive ? 600 : 450, letterSpacing: "-0.01em", color: isActive ? "#FFFFFF" : "#94A3B8", background: isActive ? "rgba(59,130,246,0.15)" : "transparent" }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#E2E8F0"; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}>
                                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-sm bg-blue-400" />}
                                    <span className="text-[14px]">⚙️</span>
                                    <span>설정</span>
                                </button>
                            );
                        })()}
                    </div>
                    {/* Sidebar bottom: user profile */}
                    <div className="hidden md:flex items-center gap-2 px-2.5 py-2.5 relative z-10 flex-shrink-0" style={{borderTop:"1px solid rgba(255,255,255,0.08)", background:"#0F172A"}}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[14px] flex-shrink-0" style={{background:"rgba(59,130,246,0.1)", border:"1.5px solid rgba(59,130,246,0.25)"}}>{displayMembers[userName]?.emoji || "👤"}</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] truncate text-white" style={{fontWeight:650}}>{userName}</div>
                            <div className="text-[11px]" style={{color:"#64748B"}}>{displayMembers[userName]?.role || "학생"}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                            <button onClick={handleLogout} className="text-[16px] transition-colors" style={{color:"#64748B"}} onMouseEnter={e => e.currentTarget.style.color = "#EF4444"} onMouseLeave={e => e.currentTarget.style.color = "#64748B"} title="로그아웃">⏻</button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div key={activeTab} ref={mainContentRef} onScroll={e => { scrollPositionsRef.current[activeTab] = (e.target as HTMLDivElement).scrollTop; }} className={`flex-1 p-4 ${isFullHeightTab ? "pb-4 md:pb-5" : "pb-20 md:pb-7"} md:py-7 md:px-9 ${isFullHeightTab ? "overflow-hidden" : "overflow-y-auto"} flex flex-col min-h-0`} style={{ animation: "fadeIn 0.15s ease" }}>
                    {activeTab !== "overview" && activeTab !== "overview_me" && !activeTab.startsWith("expLog_") && !activeTab.startsWith("analysisLog_") && (() => {
                        const extraTabs: Record<string, { icon: string; label: string }> = { teams: { icon: "👥", label: "팀 관리" }, settings: { icon: "⚙️", label: "설정" }, admin_members: { icon: "🔑", label: "멤버 관리" }, admin_backups: { icon: "💾", label: "백업 관리" }, admin_access: { icon: "🔐", label: "접속 로그" }, admin_menus: { icon: "📋", label: "메뉴 관리" } };
                        const found = tabs.find(t => t.id === activeTab) || extraTabs[activeTab];
                        const isTeamPage = activeTab.startsWith("teamMemo_");
                        const isMemoPage = activeTab.startsWith("memo_");
                        const teamName4Header = isTeamPage ? activeTab.replace("teamMemo_", "") : "";
                        return found ? (
                            <div className={`${isTeamPage || isMemoPage ? "mb-3" : "mb-6"} flex-shrink-0 hidden md:flex items-center justify-between`}>
                                <h2 className="text-[24px] font-bold tracking-tight" style={{color:"#0F172A", letterSpacing:"-0.02em", lineHeight:"1.3"}}>
                                    {found.icon} {found.label}
                                </h2>
                                {isTeamPage && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setShowExpMgr(true); setShowAnalysisMgr(false); }} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-medium hover:bg-slate-200 whitespace-nowrap">✏️ 실험일지 관리</button>
                                        <button onClick={() => { setShowAnalysisMgr(true); setShowExpMgr(false); }} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-medium hover:bg-slate-200 whitespace-nowrap">💻 해석일지 관리</button>
                                        <button onClick={() => setShowTeamLayoutSettings(true)} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-medium hover:bg-slate-200 whitespace-nowrap">⚙️ 보드 설정</button>
                                    </div>
                                )}
                                {isMemoPage && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setShowPersonalLayoutSettings(true)} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-medium hover:bg-slate-200 whitespace-nowrap">⚙️ 보드 설정</button>
                                    </div>
                                )}
                            </div>
                        ) : null;
                    })()}
                    {/* Experiment log management — overlay modal */}
                    {showExpMgr && (() => {
                        const tName = activeTab.replace("teamMemo_", "");
                        const cats = expLogCategories[tName] || [];
                        const teamInfo = teams[tName];
                        const teamMembers = teamInfo ? [...new Set(teamInfo.members)].filter(Boolean) : [];
                        const toggleExpMember = (catIdx: number, member: string) => {
                            const updated = cats.map((c, i) => {
                                if (i !== catIdx) return c;
                                const ms = c.members.includes(member) ? c.members.filter(m => m !== member) : [...c.members, member];
                                return { ...c, members: ms };
                            });
                            handleSaveExpLogCategories(tName, updated);
                        };
                        const toggleExpAll = (catIdx: number) => {
                            const updated = cats.map((c, i) => i !== catIdx ? c : { ...c, members: [] });
                            handleSaveExpLogCategories(tName, updated);
                        };
                        return (
                            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" style={{ animation: "backdropIn 0.15s ease" }} onClick={() => { setShowExpMgr(false); setEditingCat(null); }}>
                                <div className="bg-white rounded-xl w-full shadow-2xl p-5" style={{maxWidth:520, animation: "modalIn 0.2s ease"}} onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[15px] font-bold text-slate-800">실험일지 관리</h3>
                                        <button onClick={() => { setShowExpMgr(false); setEditingCat(null); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                                    </div>
                                    <div className="mb-4">
                                        {cats.map((cat, i) => (
                                            <div key={cat.name} style={i < cats.length - 1 ? { borderBottom: "1px solid #F1F5F9" } : {}}>
                                                <div className="flex items-center gap-2 px-2 py-2">
                                                    <span className="text-[12px] text-slate-400 w-5 text-right shrink-0">{i + 1}.</span>
                                                    {editingCat === `exp_${cat.name}` ? (
                                                        <input autoFocus value={editingCatVal} onChange={e => setEditingCatVal(e.target.value)}
                                                            className="flex-1 border border-blue-300 rounded px-2 py-0.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                            onKeyDown={e => { if (e.key === "Enter") { const nv = editingCatVal.trim(); if (nv && nv !== cat.name) handleRenameExpLogCategory(tName, cat.name, nv); setEditingCat(null); } if (e.key === "Escape") setEditingCat(null); }}
                                                            onBlur={() => { const nv = editingCatVal.trim(); if (nv && nv !== cat.name) handleRenameExpLogCategory(tName, cat.name, nv); setEditingCat(null); }} />
                                                    ) : (
                                                        <span className="flex-1 text-[13px] text-slate-700">{cat.name}</span>
                                                    )}
                                                    <button onClick={() => { setEditingCat(`exp_${cat.name}`); setEditingCatVal(cat.name); }}
                                                        className="text-[13px] text-slate-300 hover:text-blue-500 transition-colors p-0.5" title="이름 수정">✏️</button>
                                                    <button onClick={() => { if (confirm(`'${cat.name}' 일지를 삭제하시겠습니까?`)) { handleSaveExpLogCategories(tName, cats.filter(x => x.name !== cat.name)); } }}
                                                        className="text-[13px] text-slate-300 hover:text-red-500 transition-colors p-0.5" title="삭제">🗑️</button>
                                                </div>
                                                {teamMembers.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 px-2 pb-2 ml-7">
                                                        <button onClick={() => toggleExpAll(i)}
                                                            className="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                                                            style={{ background: cat.members.length === 0 ? "#3B82F6" : "transparent", color: cat.members.length === 0 ? "#FFF" : "#64748B", border: cat.members.length === 0 ? "1px solid #3B82F6" : "1px solid #CBD5E1" }}>전체</button>
                                                        {teamMembers.map(m => {
                                                            const sel = cat.members.includes(m);
                                                            const emoji = displayMembers[m]?.emoji || "";
                                                            return (
                                                                <button key={m} onClick={() => toggleExpMember(i, m)}
                                                                    className="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                                                                    style={{ background: sel ? "#3B82F6" : "transparent", color: sel ? "#FFF" : "#64748B", border: sel ? "1px solid #3B82F6" : "1px solid #CBD5E1" }}>
                                                                    {emoji} {m}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {cats.length === 0 && <p className="text-[13px] text-slate-400 text-center py-4">등록된 실험일지가 없습니다</p>}
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <input value={newExpCat} onChange={e => setNewExpCat(e.target.value)} placeholder="새 실험일지 이름 입력"
                                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                            onKeyDown={e => { if (e.key === "Enter" && newExpCat.trim() && !cats.some(c => c.name === newExpCat.trim())) { handleSaveExpLogCategories(tName, [...cats, { name: newExpCat.trim(), members: [] }]); setNewExpCat(""); } }} />
                                        <button onClick={() => { if (newExpCat.trim() && !cats.some(c => c.name === newExpCat.trim())) { handleSaveExpLogCategories(tName, [...cats, { name: newExpCat.trim(), members: [] }]); setNewExpCat(""); } }}
                                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={() => { setShowExpMgr(false); setEditingCat(null); }} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-200">닫기</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    {showAnalysisMgr && (() => {
                        const tName = activeTab.replace("teamMemo_", "");
                        const cats = analysisLogCategories[tName] || [];
                        const teamInfo = teams[tName];
                        const teamMembers = teamInfo ? [...new Set(teamInfo.members)].filter(Boolean) : [];
                        const toggleAnaMember = (catIdx: number, member: string) => {
                            const updated = cats.map((c, i) => {
                                if (i !== catIdx) return c;
                                const ms = c.members.includes(member) ? c.members.filter(m => m !== member) : [...c.members, member];
                                return { ...c, members: ms };
                            });
                            handleSaveAnalysisLogCategories(tName, updated);
                        };
                        const toggleAnaAll = (catIdx: number) => {
                            const updated = cats.map((c, i) => i !== catIdx ? c : { ...c, members: [] });
                            handleSaveAnalysisLogCategories(tName, updated);
                        };
                        return (
                            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" style={{ animation: "backdropIn 0.15s ease" }} onClick={() => { setShowAnalysisMgr(false); setEditingCat(null); }}>
                                <div className="bg-white rounded-xl w-full shadow-2xl p-5" style={{maxWidth:520, animation: "modalIn 0.2s ease"}} onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[15px] font-bold text-slate-800">해석일지 관리</h3>
                                        <button onClick={() => { setShowAnalysisMgr(false); setEditingCat(null); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                                    </div>
                                    <div className="mb-4">
                                        {cats.map((cat, i) => (
                                            <div key={cat.name} style={i < cats.length - 1 ? { borderBottom: "1px solid #F1F5F9" } : {}}>
                                                <div className="flex items-center gap-2 px-2 py-2">
                                                    <span className="text-[12px] text-slate-400 w-5 text-right shrink-0">{i + 1}.</span>
                                                    {editingCat === `ana_${cat.name}` ? (
                                                        <input autoFocus value={editingCatVal} onChange={e => setEditingCatVal(e.target.value)}
                                                            className="flex-1 border border-blue-300 rounded px-2 py-0.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                            onKeyDown={e => { if (e.key === "Enter") { const nv = editingCatVal.trim(); if (nv && nv !== cat.name) handleRenameAnalysisLogCategory(tName, cat.name, nv); setEditingCat(null); } if (e.key === "Escape") setEditingCat(null); }}
                                                            onBlur={() => { const nv = editingCatVal.trim(); if (nv && nv !== cat.name) handleRenameAnalysisLogCategory(tName, cat.name, nv); setEditingCat(null); }} />
                                                    ) : (
                                                        <span className="flex-1 text-[13px] text-slate-700">{cat.name}</span>
                                                    )}
                                                    <button onClick={() => { setEditingCat(`ana_${cat.name}`); setEditingCatVal(cat.name); }}
                                                        className="text-[13px] text-slate-300 hover:text-blue-500 transition-colors p-0.5" title="이름 수정">✏️</button>
                                                    <button onClick={() => { if (confirm(`'${cat.name}' 일지를 삭제하시겠습니까?`)) { handleSaveAnalysisLogCategories(tName, cats.filter(x => x.name !== cat.name)); } }}
                                                        className="text-[13px] text-slate-300 hover:text-red-500 transition-colors p-0.5" title="삭제">🗑️</button>
                                                </div>
                                                {teamMembers.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 px-2 pb-2 ml-7">
                                                        <button onClick={() => toggleAnaAll(i)}
                                                            className="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                                                            style={{ background: cat.members.length === 0 ? "#3B82F6" : "transparent", color: cat.members.length === 0 ? "#FFF" : "#64748B", border: cat.members.length === 0 ? "1px solid #3B82F6" : "1px solid #CBD5E1" }}>전체</button>
                                                        {teamMembers.map(m => {
                                                            const sel = cat.members.includes(m);
                                                            const emoji = displayMembers[m]?.emoji || "";
                                                            return (
                                                                <button key={m} onClick={() => toggleAnaMember(i, m)}
                                                                    className="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                                                                    style={{ background: sel ? "#3B82F6" : "transparent", color: sel ? "#FFF" : "#64748B", border: sel ? "1px solid #3B82F6" : "1px solid #CBD5E1" }}>
                                                                    {emoji} {m}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {cats.length === 0 && <p className="text-[13px] text-slate-400 text-center py-4">등록된 해석일지가 없습니다</p>}
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <input value={newAnalysisCat} onChange={e => setNewAnalysisCat(e.target.value)} placeholder="새 해석일지 이름 입력"
                                            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                            onKeyDown={e => { if (e.key === "Enter" && newAnalysisCat.trim() && !cats.some(c => c.name === newAnalysisCat.trim())) { handleSaveAnalysisLogCategories(tName, [...cats, { name: newAnalysisCat.trim(), members: [] }]); setNewAnalysisCat(""); } }} />
                                        <button onClick={() => { if (newAnalysisCat.trim() && !cats.some(c => c.name === newAnalysisCat.trim())) { handleSaveAnalysisLogCategories(tName, [...cats, { name: newAnalysisCat.trim(), members: [] }]); setNewAnalysisCat(""); } }}
                                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">추가</button>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={() => { setShowAnalysisMgr(false); setEditingCat(null); }} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[13px] font-medium hover:bg-slate-200">닫기</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === "overview" && <OverviewDashboard papers={papers} reports={reports} experiments={experiments} analyses={analyses} todos={todos} ipPatents={ipPatents} announcements={announcements} dailyTargets={dailyTargets} ideas={ideas} resources={resources} chatPosts={chatPosts} personalMemos={personalMemos} teamMemos={teamMemos} meetings={meetings} conferenceTrips={conferenceTrips} onlineUsers={onlineUsers} currentUser={userName} onNavigate={setActiveTab} mode="team" statusMessages={statusMessages} members={displayMembers} teams={teams} dataLoaded={dataLoaded} />}
                    {activeTab === "overview_me" && <OverviewDashboard papers={papers} reports={reports} experiments={experiments} analyses={analyses} todos={todos} ipPatents={ipPatents} announcements={announcements} dailyTargets={dailyTargets} ideas={ideas} resources={resources} chatPosts={chatPosts} personalMemos={personalMemos} teamMemos={teamMemos} meetings={meetings} conferenceTrips={conferenceTrips} onlineUsers={onlineUsers} currentUser={userName} onNavigate={setActiveTab} mode="personal" statusMessages={statusMessages} members={displayMembers} teams={teams} dataLoaded={dataLoaded} />}
                    {activeTab === "announcements" && <AnnouncementView announcements={announcements} onAdd={handleAddAnn} onDelete={handleDelAnn} onUpdate={handleUpdateAnn} onReorder={handleReorderAnn} philosophy={philosophy} onAddPhilosophy={handleAddPhil} onDeletePhilosophy={handleDelPhil} onUpdatePhilosophy={handleUpdatePhil} onReorderPhilosophy={handleReorderPhil} currentUser={userName} />}
                    {activeTab === "daily" && <DailyTargetView targets={dailyTargets} onSave={handleSaveDailyTargets} currentUser={userName} />}
                    {activeTab === "papers" && <KanbanView papers={papers} filter={selectedPerson} onFilterPerson={setSelectedPerson} allPeople={allPeople} onClickPaper={p => setPaperModal({ paper: p, mode: "edit" })} onAddPaper={() => setPaperModal({ paper: null, mode: "add" })} onSavePaper={handleSavePaper} onDeletePaper={handleDeletePaper} onReorder={handleReorderPapers} tagList={paperTagList} onSaveTags={handleSavePaperTags} teamNames={teamNames} currentUser={userName} />}
                    {activeTab === "reports" && <ReportView reports={reports} currentUser={userName} onSave={handleSaveReport} onDelete={handleDeleteReport} onToggleDiscussion={r => handleSaveReport({ ...r, needsDiscussion: !r.needsDiscussion })} onReorder={handleReorderReports} teamNames={teamNames} />}
                    {activeTab === "experiments" && <ExperimentView experiments={experiments} onSave={handleSaveExperiment} onDelete={handleDeleteExperiment} currentUser={userName} equipmentList={equipmentList} onSaveEquipment={handleSaveEquipment} onToggleDiscussion={e => handleSaveExperiment({ ...e, needsDiscussion: !e.needsDiscussion })} onReorder={handleReorderExperiments} teamNames={teamNames} />}
                    {activeTab === "analysis" && <AnalysisView analyses={analyses} onSave={handleSaveAnalysis} onDelete={handleDeleteAnalysis} currentUser={userName} toolList={analysisToolList} onSaveTools={handleSaveAnalysisTools} onToggleDiscussion={a => handleSaveAnalysis({ ...a, needsDiscussion: !a.needsDiscussion })} onReorder={handleReorderAnalyses} teamNames={teamNames} />}
                    {activeTab === "todos" && <TodoList todos={todos} onToggle={handleToggleTodo} onAdd={handleAddTodo} onUpdate={handleUpdateTodo} onDelete={handleDeleteTodo} onReorder={handleReorderTodos} currentUser={userName} />}
                    {activeTab === "teams" && <TeamOverview papers={papers} todos={todos} experiments={experiments} analyses={analyses} teams={teams} onSaveTeams={handleSaveTeams} currentUser={userName} />}
                    {activeTab === "calendar" && (() => {
                        const calDl: Array<{ title: string; date: string; type: string; color: string; icon: string; tab: string }> = [];
                        papers.filter(p => p.deadline && p.status !== "completed").forEach(p => calDl.push({ title: p.title, date: p.deadline, type: "논문", color: CATEGORY_COLORS.paper, icon: "📄", tab: "papers" }));
                        reports.filter(r => r.deadline && r.status !== "done").forEach(r => calDl.push({ title: r.title, date: r.deadline, type: "보고서", color: CATEGORY_COLORS.report, icon: "📋", tab: "reports" }));
                        todos.filter(t => t.deadline && !t.done).forEach(t => calDl.push({ title: t.text, date: t.deadline, type: "할일", color: "#F59E0B", icon: "✅", tab: "todos" }));
                        experiments.filter(e => e.endDate && e.status !== "completed").forEach(e => calDl.push({ title: e.title, date: e.endDate, type: "실험", color: CATEGORY_COLORS.experiment, icon: "🧪", tab: "experiments" }));
                        analyses.filter(a => a.endDate && a.status !== "completed").forEach(a => calDl.push({ title: a.title, date: a.endDate, type: "해석", color: CATEGORY_COLORS.analysis, icon: "🖥️", tab: "analysis" }));
                        ipPatents.filter(p => p.deadline && p.status !== "completed").forEach(p => calDl.push({ title: p.title, date: p.deadline, type: "특허", color: CATEGORY_COLORS.ip, icon: "💡", tab: "ip" }));
                        conferenceTrips.forEach(c => calDl.push({ title: c.title, date: c.startDate, type: "학회", color: "#60A5FA", icon: "✈️", tab: "conferenceTrips" }));
                        return <CalendarGrid data={[...vacations.map(v => ({ ...v, description: undefined })), ...schedule]} currentUser={userName} types={CALENDAR_TYPES} onToggle={handleCalendarToggle} dispatches={dispatches} onDispatchSave={handleDispatchSave} onDispatchDelete={handleDispatchDelete} deadlines={calDl} onNavigate={setActiveTab} />;
                    })()}
                    {activeTab === "lectures" && <TimetableView blocks={timetable} onSave={handleTimetableSave} onDelete={handleTimetableDelete} currentUser={userName} />}
                    {activeTab === "ip" && <IPView patents={ipPatents} onSave={handleSavePatent} onDelete={handleDeletePatent} currentUser={userName} onToggleDiscussion={p => handleSavePatent({ ...p, needsDiscussion: !p.needsDiscussion })} onReorder={handleReorderPatents} teamNames={teamNames} />}
                    {activeTab === "conferenceTrips" && <ConferenceTripView items={conferenceTrips} onSave={handleSaveConference} onDelete={handleDeleteConference} onReorder={handleReorderConferences} currentUser={userName} />}
                    {activeTab === "meetings" && <MeetingView meetings={meetings} onSave={handleSaveMeeting} onDelete={handleDeleteMeeting} currentUser={userName} teamNames={teamNames} />}
                    {activeTab === "resources" && <ResourceView resources={resources} onSave={handleSaveResource} onDelete={handleDeleteResource} onReorder={handleReorderResources} currentUser={userName} />}
                    {activeTab === "ideas" && <IdeasView ideas={ideas} onSave={handleSaveIdea} onDelete={handleDeleteIdea} onReorder={handleReorderIdeas} currentUser={userName} />}
                    {activeTab === "chat" && <ChatWithAiTab userName={userName} aiBotChat={aiBotChat} handleAddAiBotChat={handleAddAiBotChat} handleUpdateAiBotChat={handleUpdateAiBotChat} handleDeleteAiBotChat={handleDeleteAiBotChat} handleClearAiBotChat={handleClearAiBotChat} dashboardData={dashboardData} handleCalendarToggle={handleCalendarToggle} readReceipts={readReceipts["chat"]} board={aiBotBoard} onSaveBoard={handleSaveAiBotBoard} onDeleteBoard={handleDeleteAiBotBoard} />}
                    {activeTab === "settings" && <SettingsView currentUser={userName} customEmojis={customEmojis} onSaveEmoji={handleSaveEmoji} statusMessages={statusMessages} onSaveStatusMsg={handleSaveStatusMsg} />}
                    {activeTab === "admin_members" && userName === "박일웅" && <AdminMemberView />}
                    {activeTab === "admin_backups" && userName === "박일웅" && <AdminBackupView />}
                    {activeTab === "admin_access" && userName === "박일웅" && <AdminAccessLogView />}
                    {activeTab === "admin_menus" && userName === "박일웅" && <AdminMenuView menuConfig={menuConfig} onSave={handleSaveMenuConfig} />}
                    {activeTab === "labChat" && <LabChatView chat={labChat} currentUser={userName} onAdd={handleAddLabChat} onUpdate={handleUpdateLabChat} onDelete={handleDeleteLabChat} onClear={handleClearLabChat} onRetry={handleRetryLabChat} files={labFiles} onAddFile={handleAddLabFile} onDeleteFile={handleDeleteLabFile} board={labBoard} onSaveBoard={handleSaveLabBoard} onDeleteBoard={handleDeleteLabBoard} readReceipts={readReceipts["labChat"]} />}
                    {activeTab.startsWith("teamMemo_") && (() => {
                        const tName = activeTab.replace("teamMemo_", "");
                        const data = teamMemos[tName] || { kanban: [], chat: [] };
                        return <TeamMemoView teamName={tName} kanban={data.kanban} chat={data.chat} files={data.files || []} currentUser={userName} onSaveCard={c => handleSaveTeamMemo(tName, c)} onDeleteCard={id => handleDeleteTeamMemo(tName, id)} onReorderCards={cards => handleReorderTeamMemo(tName, cards)} onAddChat={msg => handleAddTeamChat(tName, msg)} onUpdateChat={msg => handleUpdateTeamChat(tName, msg)} onDeleteChat={id => handleDeleteTeamChat(tName, id)} onClearChat={() => handleClearTeamChat(tName)} onRetryChat={id => handleRetryTeamChat(tName, id)} onAddFile={f => handleAddTeamFile(tName, f)} onDeleteFile={id => handleDeleteTeamFile(tName, id)} readReceipts={readReceipts[`teamMemo_${tName}`]} externalLayoutOpen={showTeamLayoutSettings} onExternalLayoutClose={() => setShowTeamLayoutSettings(false)} />;
                    })()}
                    {activeTab.startsWith("memo_") && (() => {
                        const name = activeTab.replace("memo_", "");
                        return <PersonalMemoView memos={personalMemos[name] || []} onSave={m => handleSaveMemo(name, m)} onDelete={id => handleDeleteMemo(name, id)} files={personalFiles[name] || []} onAddFile={f => handleAddPersonalFile(name, f)} onDeleteFile={id => handleDeletePersonalFile(name, id)} chat={piChat[name] || []} onAddChat={msg => handleAddPiChat(name, msg)} onUpdateChat={msg => handleUpdatePiChat(name, msg)} onDeleteChat={id => handleDeletePiChat(name, id)} onClearChat={() => handleClearPiChat(name)} onRetryChat={id => handleRetryPiChat(name, id)} currentUser={userName} readReceipts={readReceipts[`memo_${name}`]} externalLayoutOpen={showPersonalLayoutSettings} onExternalLayoutClose={() => setShowPersonalLayoutSettings(false)} />;
                    })()}
                    {activeTab.startsWith("expLog_") && (() => {
                        const rest = activeTab.replace("expLog_", "");
                        const idx = rest.indexOf("_");
                        const tName = rest.substring(0, idx);
                        const catName = rest.substring(idx + 1);
                        const entries = (experimentLogs[tName] || []).filter(e => e.category === catName);
                        return <ExpLogView teamName={catName} entries={entries} onSave={entry => {
                            const tagged = { ...entry, category: catName };
                            handleSaveExpLogEntry(tName, tagged);
                        }} onDelete={id => handleDeleteExpLogEntry(tName, id)} currentUser={userName} categories={(expLogCategories[tName] || []).map(c => c.name)} />;
                    })()}
                    {activeTab.startsWith("analysisLog_") && (() => {
                        const rest = activeTab.replace("analysisLog_", "");
                        const idx = rest.indexOf("_");
                        const tName = rest.substring(0, idx);
                        const catName = rest.substring(idx + 1);
                        const entries = (analysisLogs[tName] || []).filter(e => e.category === catName);
                        return <AnalysisLogView bookName={catName} entries={entries} onSave={entry => {
                            const tagged = { ...entry, category: catName };
                            handleSaveAnalysisLogEntry(tName, tagged);
                        }} onDelete={id => handleDeleteAnalysisLogEntry(tName, id)} currentUser={userName} categories={(analysisLogCategories[tName] || []).map(c => c.name)} />;
                    })()}
                </div>
            </div>

            {/* Paper Modal */}
            {paperModal && <PaperFormModal paper={paperModal.paper} onSave={handleSavePaper} onDelete={handleDeletePaper} onClose={() => setPaperModal(null)} currentUser={userName} tagList={paperTagList} teamNames={teamNames} />}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-5 py-3 rounded-xl text-[14px] font-medium text-white shadow-lg flex items-center gap-2" style={{ background: toastType === "success" ? "#10B981" : "#EF4444", animation: "toastSlideIn 0.25s ease" }}>
                    {toastType === "success" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                    {toast}
                </div>
            )}
            {/* Keyboard Shortcuts */}
            {shortcutsOpen && (
                <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4" onClick={() => setShortcutsOpen(false)} style={{ animation: "backdropIn 0.15s ease" }}>
                    <div className="bg-white rounded-2xl w-full shadow-xl p-6" style={{ maxWidth: 420, animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[16px] font-bold text-slate-800">키보드 단축키</h3>
                            <button onClick={() => setShortcutsOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
                        </div>
                        <div className="space-y-3">
                            {[
                                ["Cmd + K", "빠른 검색"],
                                ["?", "단축키 도움말"],
                                ["Esc", "모달/패널 닫기"],
                                ["@ + 이름", "멘션"],
                                ["Ctrl + V", "이미지 붙여넣기"],
                                ["Enter", "메시지 전송 / 항목 확인"],
                            ].map(([key, desc]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-[13px] text-slate-600">{desc}</span>
                                    <kbd className="px-2.5 py-1 bg-slate-100 rounded-lg text-[12px] font-mono text-slate-500 border border-slate-200">{key}</kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        {/* Notification Panel — PC: right slide panel, Mobile: center modal */}
        {notiOpen && (
            <div className="fixed inset-0 z-[80]" onClick={() => setNotiOpen(false)}>
                {/* Backdrop */}
                <div className="absolute inset-0 md:bg-black/20" style={{ background: "rgba(0,0,0,0.5)" }} />
                {/* Mobile: center modal */}
                <div className="md:hidden absolute inset-0 flex items-start justify-center pt-[8vh]">
                    <div className="bg-white rounded-2xl w-full mx-4 overflow-hidden" style={{ maxWidth: 520, boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 border-b border-slate-200" style={{ height: 48 }}>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-semibold" style={{ color: "#1E293B" }}>알림</span>
                                {notiUnreadCount > 0 && <span className="px-1.5 py-0.5 rounded text-[11px] font-bold" style={{ background: "#EF4444", color: "#fff" }}>{notiUnreadCount > 99 ? "99+" : notiUnreadCount}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => markNotiRead()}
                                    className="text-[12px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                                    읽음
                                </button>
                                <button onClick={() => setNotiOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                            </div>
                        </div>
                        {/* Filter chips */}
                        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 overflow-x-auto">
                            {([
                                { key: "all" as const, label: "전체", color: "#334155" },
                                { key: "mention" as const, label: "멘션", color: "#EF4444" },
                                { key: "chat" as const, label: "채팅", color: "#3B82F6" },
                                { key: "announcement" as const, label: "공지", color: "#F59E0B" },
                                { key: "board" as const, label: "게시글", color: "#10B981" },
                                { key: "update" as const, label: "업데이트", color: "#8B5CF6" },
                            ]).map(f => {
                                const active = notiFilter === f.key;
                                const count = f.key === "all" ? alerts.length : alerts.filter(a => a.type === f.key).length;
                                if (f.key !== "all" && count === 0) return null;
                                return (
                                    <button key={f.key} onClick={() => setNotiFilter(f.key)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap"
                                        style={{ background: active ? f.color : "#F1F5F9", color: active ? "#fff" : "#64748B" }}>
                                        {f.label}
                                        {count > 0 && <span className="text-[11px] opacity-75">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="max-h-[55vh] overflow-y-auto modal-scroll">
                            {filteredAlerts.slice(0, 50).map((alert, i) => {
                                const isNew = alert.timestamp > notiLastSeen;
                                const typeIcon = alert.type === "mention" ? "💬" : alert.type === "announcement" ? "📢" : alert.type === "board" ? "📌" : alert.type === "update" ? "🔄" : "💬";
                                return (
                                    <button key={`${alert.type}-${alert.timestamp}-${i}`} className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                                        onClick={() => { if (window.getSelection()?.toString()) return; setActiveTab(alert.tabId); setNotiOpen(false); markNotiRead(); }}>
                                        <span className="text-[16px] mt-0.5 flex-shrink-0">{alert.type === "mention" ? (MEMBERS[alert.author]?.emoji || "👤") : typeIcon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] text-slate-700"><span className="font-semibold">{alert.author}</span><span className="text-slate-400"> · {alert.section}</span></div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{alert.text.slice(0, 60)}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] px-1 py-0.5 rounded-full font-medium" style={{
                                                    background: alert.type === "mention" ? "rgba(239,68,68,0.1)" : alert.type === "announcement" ? "rgba(245,158,11,0.1)" : alert.type === "board" ? "rgba(16,185,129,0.1)" : alert.type === "update" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                                                    color: alert.type === "mention" ? "#EF4444" : alert.type === "announcement" ? "#F59E0B" : alert.type === "board" ? "#10B981" : alert.type === "update" ? "#8B5CF6" : "#3B82F6",
                                                }}>{alert.type === "mention" ? "멘션" : alert.type === "announcement" ? "공지" : alert.type === "board" ? "게시글" : alert.type === "update" ? "업데이트" : "채팅"}</span>
                                                <span className="text-[11px] text-slate-400">{notiTimeAgo(alert.timestamp)}</span>
                                            </div>
                                        </div>
                                        {isNew && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                                    </button>
                                );
                            })}
                            {filteredAlerts.length === 0 && <div className="py-10 text-center"><div className="text-3xl mb-2 opacity-40">🔔</div><div className="text-[13px] text-slate-400">알림이 없습니다</div></div>}
                        </div>
                    </div>
                </div>
                {/* PC: right slide panel */}
                <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-[420px] flex-col bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.12)] animate-[slideInRight_0.2s_ease]"
                    onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 flex-shrink-0" style={{ height: 56, borderBottom: "1px solid #E2E8F0" }}>
                        <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold" style={{ color: "#1E293B" }}>알림</span>
                            {notiUnreadCount > 0 && <span className="px-1.5 py-0.5 rounded text-[11px] font-bold" style={{ background: "#EF4444", color: "#fff" }}>{notiUnreadCount > 99 ? "99+" : notiUnreadCount}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {!notiSettingsOpen && <button onClick={() => markNotiRead()}
                                className="text-[12px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                                모두 읽음
                            </button>}
                            <button onClick={() => setNotiSettingsOpen(v => !v)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                title="푸시 알림 설정">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                            </button>
                            <button onClick={() => { setNotiOpen(false); setNotiSettingsOpen(false); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-lg transition-colors">✕</button>
                        </div>
                    </div>

                    {/* Filter chips (hide when settings open) */}
                    {!notiSettingsOpen && <div className="flex items-center gap-1 px-5 py-2 border-b border-slate-100 flex-shrink-0 overflow-x-auto">
                        {([
                            { key: "all" as const, label: "전체", color: "#334155" },
                            { key: "mention" as const, label: "멘션", color: "#EF4444" },
                            { key: "chat" as const, label: "채팅", color: "#3B82F6" },
                            { key: "announcement" as const, label: "공지", color: "#F59E0B" },
                            { key: "board" as const, label: "게시글", color: "#10B981" },
                            { key: "update" as const, label: "업데이트", color: "#8B5CF6" },
                        ]).map(f => {
                            const active = notiFilter === f.key;
                            const count = f.key === "all" ? alerts.length : alerts.filter(a => a.type === f.key).length;
                            return (
                                <button key={f.key} onClick={() => setNotiFilter(f.key)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap"
                                    style={{ background: active ? f.color : "#F1F5F9", color: active ? "#fff" : "#64748B" }}>
                                    {f.label}
                                    {count > 0 && <span className="text-[11px] opacity-75">{count}</span>}
                                </button>
                            );
                        })}
                    </div>}

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto modal-scroll">
                        {/* Push settings view */}
                        {notiSettingsOpen && (
                            <div className="px-5 py-4">
                                <div className="text-[13px] font-semibold mb-1" style={{ color: "#1E293B" }}>푸시 알림 설정</div>
                                <div className="text-[11px] text-slate-400 mb-4">카테고리별로 모바일/데스크톱 푸시 알림을 켜거나 끌 수 있습니다</div>
                                <div className="space-y-1">
                                    {PUSH_CATEGORIES.map(cat => {
                                        const enabled = myPushPrefs[cat.key] !== false;
                                        return (
                                            <button key={cat.key} onClick={() => togglePushPref(cat.key)}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors hover:bg-slate-50"
                                                style={{ background: enabled ? "rgba(59,130,246,0.04)" : "transparent" }}>
                                                <div className="text-left">
                                                    <div className="text-[13px] font-medium" style={{ color: "#334155" }}>{cat.label}</div>
                                                    <div className="text-[11px]" style={{ color: "#94A3B8" }}>{cat.desc}</div>
                                                </div>
                                                <div className="relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ml-3"
                                                    style={{ background: enabled ? "#3B82F6" : "#CBD5E1" }}>
                                                    <div className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
                                                        style={{ left: enabled ? 20 : 2 }} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 px-2 text-[11px] text-slate-400">
                                    설정은 자동 저장됩니다. 꺼진 카테고리의 알림은 앱 내에서는 보이지만 푸시 알림은 발송되지 않습니다.
                                </div>
                            </div>
                        )}
                        {!notiSettingsOpen && filteredAlerts.length === 0 && (
                            <div className="py-16 text-center">
                                <div className="text-[32px] mb-3">🔔</div>
                                <div className="text-[14px] text-slate-400 font-medium">알림이 없습니다</div>
                                <div className="text-[12px] text-slate-300 mt-1">멘션, 채팅, 공지, 업데이트 알림이 여기에 표시됩니다</div>
                            </div>
                        )}
                        {!notiSettingsOpen && filteredAlerts.slice(0, 100).map((alert, i) => {
                            const isNew = alert.timestamp > notiLastSeen;
                            const prev = filteredAlerts[i - 1];
                            const prevDate = prev ? new Date(Math.floor(prev.timestamp / 100)).toLocaleDateString("ko-KR") : "";
                            const currDate = new Date(Math.floor(alert.timestamp / 100)).toLocaleDateString("ko-KR");
                            const showDate = currDate !== prevDate;
                            const typeIcon = alert.type === "mention" ? "💬" : alert.type === "announcement" ? "📢" : alert.type === "board" ? "📌" : alert.type === "update" ? "🔄" : "💬";
                            const typeLabel = alert.type === "mention" ? "에서 멘션했습니다"
                                : alert.type === "announcement" ? "을(를) 등록했습니다"
                                : alert.type === "board" ? "에 새 글을 작성했습니다"
                                : alert.type === "update" ? "을(를) 업데이트했습니다"
                                : "에서 메시지를 보냈습니다";
                            return (
                                <div key={`${alert.type}-${alert.timestamp}-${i}`}>
                                    {showDate && <div className="px-5 pt-3.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{currDate}</div>}
                                    <button className="w-full flex items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                                        onClick={() => { if (window.getSelection()?.toString()) return; setActiveTab(alert.tabId); setNotiOpen(false); markNotiRead(); }}>
                                        <span className="text-[18px] mt-0.5 flex-shrink-0">{alert.type === "mention" ? (MEMBERS[alert.author]?.emoji || "👤") : typeIcon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] text-slate-700">
                                                <span className="font-semibold">{alert.author}</span>
                                                <span className="text-slate-500">님이 </span>
                                                <span className="font-medium" style={{ color: isNew ? "#3B82F6" : "#64748B" }}>{alert.section}</span>
                                                <span className="text-slate-500">{typeLabel}</span>
                                            </div>
                                            <div className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{alert.text.slice(0, 120)}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium" style={{
                                                    background: alert.type === "mention" ? "rgba(239,68,68,0.1)" : alert.type === "announcement" ? "rgba(245,158,11,0.1)" : alert.type === "board" ? "rgba(16,185,129,0.1)" : alert.type === "update" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)",
                                                    color: alert.type === "mention" ? "#EF4444" : alert.type === "announcement" ? "#F59E0B" : alert.type === "board" ? "#10B981" : alert.type === "update" ? "#8B5CF6" : "#3B82F6",
                                                }}>{alert.type === "mention" ? "멘션" : alert.type === "announcement" ? "공지" : alert.type === "board" ? "게시글" : alert.type === "update" ? "업데이트" : "채팅"}</span>
                                                <span className="text-[11px] text-slate-400">{notiTimeAgo(alert.timestamp)}</span>
                                            </div>
                                        </div>
                                        {isNew && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-center px-4 py-2.5 border-t border-slate-100 flex-shrink-0" style={{ background: "#FAFBFC" }}>
                        <span className="text-[11px] text-slate-400">멘션 · 채팅 · 공지 · 게시글 · 업데이트</span>
                    </div>
                </div>
            </div>
        )}

        {/* Cmd+K Search Palette */}
        {cmdKOpen && (
            <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh]" style={{background:"rgba(0,0,0,0.5)"}} role="dialog" aria-modal="true" onClick={() => setCmdKOpen(false)}>
                <div className="bg-white rounded-2xl w-full overflow-hidden" style={{ maxWidth: 560, boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 px-4 border-b border-slate-200" style={{height:52}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input ref={cmdKRef} value={cmdKQuery} onChange={e => { setCmdKQuery(e.target.value); setCmdKIdx(0); }}
                            onKeyDown={e => {
                                if (e.key === "Escape") { setCmdKOpen(false); return; }
                                if (e.key === "ArrowDown") { e.preventDefault(); setCmdKIdx(i => Math.min(i + 1, cmdKResults.length - 1)); return; }
                                if (e.key === "ArrowUp") { e.preventDefault(); setCmdKIdx(i => Math.max(i - 1, 0)); return; }
                                if (e.key === "Enter" && cmdKResults[cmdKIdx]) { e.preventDefault(); handleCmdKSelect(cmdKResults[cmdKIdx].tabId); return; }
                            }}
                            placeholder="검색하거나 이동할 페이지 입력..."
                            className="flex-1 text-[15px] bg-transparent outline-none placeholder:text-slate-400" />
                        <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">ESC</kbd>
                    </div>
                    <div ref={cmdKListRef} className="max-h-[50vh] overflow-y-auto modal-scroll py-1">
                        {!cmdKQuery.trim() && <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 pt-2 pb-1">빠른 이동</div>}
                        {cmdKResults.length === 0 && cmdKQuery.trim() && <div className="py-10 text-center"><div className="text-3xl mb-2 opacity-40">🔍</div><div className="text-[14px] text-slate-400">검색 결과가 없습니다</div></div>}
                        {(() => {
                            const groups: Record<string, typeof cmdKResults> = {};
                            cmdKResults.forEach(item => { (groups[item.type] ||= []).push(item); });
                            let gi = 0;
                            return Object.entries(groups).map(([type, items]) => (
                                <div key={type}>
                                    {cmdKQuery.trim() && <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 pt-3 pb-1">{type}</div>}
                                    {items.map(item => {
                                        const idx = gi++;
                                        const active = idx === cmdKIdx;
                                        return (
                                            <button key={`${item.tabId}-${idx}`} data-cmdk-idx={idx}
                                                className="w-full flex items-center gap-3 px-5 py-2 text-left transition-colors"
                                                style={{ background: active ? "#F1F5F9" : "transparent" }}
                                                onMouseEnter={() => setCmdKIdx(idx)}
                                                onClick={() => handleCmdKSelect(item.tabId)}>
                                                <span className="text-[16px] flex-shrink-0">{item.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[14px] text-slate-700 truncate" style={{ fontWeight: active ? 600 : 400 }}>{item.title}</div>
                                                    {item.subtitle && <div className="text-[12px] text-slate-400 truncate">{item.subtitle}</div>}
                                                </div>
                                                {active && <span className="text-[12px] text-slate-400 flex-shrink-0">↵</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100" style={{background:"#FAFBFC"}}>
                        <span className="text-[11px] text-slate-400"><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] mr-1">↑↓</kbd> 이동</span>
                        <span className="text-[11px] text-slate-400"><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] mr-1">↵</kbd> 선택</span>
                        <span className="text-[11px] text-slate-400"><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] mr-1">ESC</kbd> 닫기</span>
                    </div>
                </div>
            </div>
        )}

        {confirmDialog}
        </div>
        </ErrorBoundary>
        </ConfirmDeleteContext.Provider>
        </SavingContext.Provider>
        </MembersContext.Provider>
    );
}
