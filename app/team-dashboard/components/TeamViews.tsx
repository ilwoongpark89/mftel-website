"use client";

import { useState, useEffect, useRef, useCallback, useContext, memo } from "react";
import type { Paper, Todo, Experiment, Analysis, TeamData, LabFile, TeamChatMsg, TeamMemoCard } from "../lib/types";
import { MEMBERS, MEMBER_NAMES, TEAM_COLORS, TEAM_EMOJIS, TEAM_MEMO_COLORS, MEMO_COL_MIGRATE, ANALYSIS_STATUS_MIGRATE, EXP_STATUS_MIGRATE } from "../lib/constants";
import { genId, toggleArr, chatKeyDown, renderChatMessage, extractFirstUrl, sendMentionPush, saveDraft, loadDraft, clearDraft, hasDraft, calcDropIdx, reorderKanbanItems, uploadFile } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useMention, MentionPopup, useCommentImg, useTypingIndicator, TypingIndicator } from "../lib/hooks";
import { ChatImageLightbox, ChatSearchBar, ColorPicker, DropLine, EmojiPickerPopup, FileBox, PillSelect, ReadReceiptBadge, ReactionBadges, SavingBadge, useChatSearch, useLayoutSettings, LayoutSettingsOverlay } from "./shared";
import { OgPreviewCard } from "./OgPreviewCard";

const NewMessagesDivider = memo(function NewMessagesDivider() {
    return (
        <div className="flex items-center gap-2 my-3 new-messages-divider">
            <div className="flex-1 h-px bg-red-400" />
            <span className="text-[11px] text-red-500 font-medium whitespace-nowrap">여기서부터 새 메시지</span>
            <div className="flex-1 h-px bg-red-400" />
        </div>
    );
});

const TeamOverview = memo(function TeamOverview({ papers, todos, experiments, analyses, teams, onSaveTeams, currentUser }: { papers: Paper[]; todos: Todo[]; experiments: Experiment[]; analyses: Analysis[]; teams: Record<string, TeamData>; onSaveTeams: (t: Record<string, TeamData>) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const isPI = currentUser === "박일웅";
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [editingTeam, setEditingTeam] = useState<string | null>(null);
    const [addingTeam, setAddingTeam] = useState(false);
    const [formName, setFormName] = useState("");
    const [formLead, setFormLead] = useState("");
    const [formMembers, setFormMembers] = useState<string[]>([]);
    const [formColor, setFormColor] = useState(TEAM_COLORS[0]);
    const [formEmoji, setFormEmoji] = useState(TEAM_EMOJIS[0]);

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
        if (!confirm(`"${name}" 팀을 삭제하시겠습니까?`)) return;
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
                {isPI && <button onClick={openAdd} className="flex items-center gap-1 px-3 py-1.5 text-[13px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"><span className="text-[14px]">+</span> 팀 추가</button>}
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
                                                        {m === team.lead && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 font-semibold">팀장</span>}
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
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setEditingTeam(null); setAddingTeam(false); }}>
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">{editingTeam ? "팀 수정" : "팀 추가"}</h3>
                            <button onClick={() => { setEditingTeam(null); setAddingTeam(false); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[12px] font-semibold text-slate-500 block mb-1">팀 이름 *</label>
                                <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
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
                            {editingTeam && isPI && <button onClick={() => confirmDel(() => { handleDelete(editingTeam); setEditingTeam(null); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});


const TeamMemoView = memo(function TeamMemoView({ teamName, kanban, chat, files, currentUser, onSaveCard, onDeleteCard, onReorderCards, onAddChat, onUpdateChat, onDeleteChat, onClearChat, onRetryChat, onAddFile, onDeleteFile, readReceipts, externalLayoutOpen, onExternalLayoutClose }: {
    teamName: string; kanban: TeamMemoCard[]; chat: TeamChatMsg[]; files: LabFile[]; currentUser: string;
    onSaveCard: (card: TeamMemoCard) => void; onDeleteCard: (id: number) => void; onReorderCards: (cards: TeamMemoCard[]) => void;
    onAddChat: (msg: TeamChatMsg) => void; onUpdateChat: (msg: TeamChatMsg) => void; onDeleteChat: (id: number) => void; onClearChat: () => void; onRetryChat: (id: number) => void;
    onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
    readReceipts?: Record<string, number>;
    externalLayoutOpen?: boolean; onExternalLayoutClose?: () => void;
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
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
    const [showLayoutSettings, setShowLayoutSettings] = useState(false);
    const layoutOpen = showLayoutSettings || !!externalLayoutOpen;
    const closeLayout = () => { setShowLayoutSettings(false); onExternalLayoutClose?.(); };
    const { settings: layoutSettings, update: updateLayout, reset: resetLayout, gridTemplate } = useLayoutSettings("team");
    const [chatImg, setChatImg] = useState("");
    const [imgUploading, setImgUploading] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const chatFileRef = useRef<HTMLInputElement>(null);
    const [newComment, setNewComment] = useState("");
    const cImg = useCommentImg();
    const boardImg = useCommentImg();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const teamChatContainerRef = useRef<HTMLDivElement>(null);
    const teamChatDidInit = useRef(false);
    const scrollTeamChat = useCallback(() => { const el = teamChatContainerRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);
    const teamInitialLastReadRef = useRef<number | null>(null);
    const teamLastReadLoaded = useRef(false);
    const teamChatKey = `lastRead_team_${teamName}_${currentUser}`;
    useEffect(() => {
        if (!teamLastReadLoaded.current) {
            teamLastReadLoaded.current = true;
            try { const v = localStorage.getItem(teamChatKey); if (v) teamInitialLastReadRef.current = Number(v); } catch {}
        }
        return () => {
            if (chat.length > 0) {
                const lastId = chat[chat.length - 1].id;
                try { localStorage.setItem(teamChatKey, String(lastId)); } catch {}
            }
        };
    }, [chat, teamChatKey]);
    const composingRef = useRef(false);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<{ col: string; idx: number } | null>(null);
    const [mobileTab, setMobileTab] = useState<"chat"|"board"|"files">("chat");
    const [replyTo, setReplyTo] = useState<TeamChatMsg | null>(null);
    const [editingMsg, setEditingMsg] = useState<TeamChatMsg | null>(null);
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<number | null>(null);
    const [activeMenuMsgId, setActiveMenuMsgId] = useState<number | null>(null);
    const mention = useMention();
    const { typingUsers: teamTypingUsers, reportTyping: teamReportTyping } = useTypingIndicator(`teamMemo_${teamName}`, currentUser);
    const teamSearch = useChatSearch();
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const selectMention = (name: string) => {
        const el = chatInputRef.current;
        const pos = el?.selectionStart ?? chatText.length;
        const result = mention.apply(chatText, pos, name);
        if (result) { setChatText(result.newText); mention.close(); setTimeout(() => { el?.focus(); el?.setSelectionRange(result.cursorPos, result.cursorPos); }, 10); }
    };

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
        const updated = { ...editing, title: title.trim() || "제목 없음", content, status: col, color, borderColor: borderClr, updatedAt: now, imageUrl: boardImg.img || editing.imageUrl };
        onSaveCard(updated); setSelected(updated); setIsEditing(false); boardImg.clear();
    };
    const saveNew = () => {
        const now = new Date().toISOString().split("T")[0];
        onSaveCard({ id: genId(), title: title.trim() || "제목 없음", content, status: col, color, borderColor: borderClr, author: currentUser, updatedAt: now, comments: [], imageUrl: boardImg.img || undefined });
        setShowForm(false); clearDraft(cardDraftKey); setCardDraftLoaded(false); boardImg.clear();
    };
    // Team memo comment draft
    useEffect(() => { if (selected && !isEditing) saveDraft(teamMemoDraftKey(selected.id), newComment); }, [newComment, selected?.id, isEditing]);

    const addComment = () => {
        if (!selected || (!newComment.trim() && !cImg.img)) return;
        clearDraft(teamMemoDraftKey(selected.id));
        const updated = { ...selected, comments: [...(selected.comments || []), { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }] };
        onSaveCard(updated); setSelected(updated); setNewComment(""); cImg.clear();
    };
    const deleteComment = (cid: number) => {
        if (!selected) return;
        const updated = { ...selected, comments: (selected.comments || []).filter(c => c.id !== cid) };
        onSaveCard(updated); setSelected(updated);
    };
    const sendChat = () => {
        if (editingMsg) {
            if (!chatText.trim()) return;
            onUpdateChat({ ...editingMsg, text: chatText.trim(), edited: true });
            setEditingMsg(null); setChatText(""); return;
        }
        if (!chatText.trim() && !chatImg) return;
        onAddChat({ id: genId(), author: currentUser, text: chatText.trim(), date: new Date().toLocaleString("ko-KR"), imageUrl: chatImg || undefined, replyTo: replyTo ? { id: replyTo.id, author: replyTo.author, text: replyTo.text } : undefined });
        if (chatText.trim()) sendMentionPush(chatText.trim(), currentUser, `${teamName} 채팅`);
        setChatText(""); setChatImg(""); setReplyTo(null);
    };
    // Collect all images from chat messages for lightbox gallery
    const chatImages = chat.filter(m => m.imageUrl && !m.deleted).map(m => m.imageUrl!);
    const openLightbox = (url: string) => {
        const idx = chatImages.indexOf(url);
        setLightboxIdx(idx >= 0 ? idx : 0);
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
        try { const url = await uploadFile(file); setChatImg(url); } catch { alert("이미지 업로드에 실패했습니다."); }
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
                try { const url = await uploadFile(file); setChatImg(url); } catch { alert("이미지 업로드에 실패했습니다."); }
                setImgUploading(false); return;
            }
        }
    };

    useEffect(() => {
        if (!teamChatDidInit.current && chat.length > 0) {
            teamChatDidInit.current = true;
            setTimeout(() => {
                const divider = teamChatContainerRef.current?.querySelector('.new-messages-divider');
                if (divider) { divider.scrollIntoView({ behavior: 'auto', block: 'center' }); }
                else { scrollTeamChat(); }
            }, 150);
        } else { requestAnimationFrame(scrollTeamChat); }
    }, [chat.length, scrollTeamChat]);

    return (
        <div className="flex flex-col md:grid md:gap-3 flex-1 min-h-0 overflow-hidden relative" style={{gridTemplateColumns: gridTemplate}}>
            {layoutOpen && (
                <LayoutSettingsOverlay settings={layoutSettings} onUpdate={updateLayout} onReset={resetLayout}
                    onClose={closeLayout} />
            )}
            {/* Mobile tab bar — 3 tabs (mobile only) */}
            <div className="md:hidden flex border-b border-slate-200 bg-white flex-shrink-0 -mt-1">
                {([["chat","💬","채팅"],["board","📌","보드"],["files","📎","파일"]] as const).map(([id,icon,label]) => (
                    <button key={id} onClick={() => setMobileTab(id)}
                        className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors whitespace-nowrap ${mobileTab === id ? "text-blue-600 border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-600"}`}>
                        {icon} {label}
                    </button>
                ))}
            </div>
            {/* Board */}
            <div className={`flex-col min-w-0 ${mobileTab === "board" ? "flex flex-1 min-h-0" : "hidden"} md:flex md:min-h-0`}>
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <h3 className="text-[14px] font-bold text-slate-700">📌 보드</h3>
                    <button onClick={() => openNew()} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-600 transition-colors"><span className="text-[14px]">+</span> 추가</button>
                </div>
                {showForm && !editing && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setShowForm(false); boardImg.clear(); }}>
                        <div className="bg-white rounded-xl w-full shadow-2xl" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                                <h3 className="text-[15px] font-bold text-slate-800">새 글 작성</h3>
                                <button onClick={() => { setShowForm(false); boardImg.clear(); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                            </div>
                            <div className="p-4 space-y-3">
                                {cardDraftLoaded && (title.trim() || content.trim()) && (
                                    <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A"}}>
                                        <span>임시저장된 글이 있습니다</span>
                                        <button onClick={() => { setTitle(""); setContent(""); clearDraft(cardDraftKey); setCardDraftLoaded(false); }} className="text-amber-600 hover:text-amber-800 font-medium ml-2">삭제</button>
                                    </div>
                                )}
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40" style={{height:48}} onPaste={boardImg.onPaste} />
                                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요... (Ctrl+V로 이미지 붙여넣기)" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" style={{minHeight:200}} onPaste={boardImg.onPaste} onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.max(200, t.scrollHeight) + "px"; }} />
                                {boardImg.preview}
                                <ColorPicker color={color} onColor={setColor} />
                            </div>
                            <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                                <button onClick={() => { setShowForm(false); boardImg.clear(); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                                <button onClick={saveNew} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardImg.uploading ? "⏳" : "저장"}</button>
                            </div>
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
                                    className={`rounded-xl p-3 cursor-pointer transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col group relative overflow-hidden ${draggedId === card.id ? "opacity-40" : ""}`}
                                    style={{ background: card.color || "#fff", border: card.borderColor ? `2px solid ${card.borderColor}` : "1px solid #E2E8F0", borderLeft: card.needsDiscussion && !card.borderColor ? "3px solid #EF4444" : undefined, maxWidth: '100%' }}>
                                    <label className="flex items-center gap-1 mb-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={!!card.needsDiscussion} onChange={() => onSaveCard({ ...card, needsDiscussion: !card.needsDiscussion })} className="w-3 h-3 accent-red-500" />
                                        <span className={`text-[11px] font-medium ${card.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                    </label>
                                    <div className="flex items-start justify-between mb-1 min-w-0">
                                        <h4 className="text-[13px] font-semibold text-slate-800 flex-1 min-w-0" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{card.title}<SavingBadge id={card.id} /></h4>
                                        <span className="text-[11px] text-slate-400 ml-1 whitespace-nowrap flex-shrink-0">{card.updatedAt}</span>
                                    </div>
                                    {card.content && <div className="text-[11px] text-slate-600 mb-2 line-clamp-2" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{card.content}</div>}
                                    {card.imageUrl && <img src={card.imageUrl} alt="" className="w-full rounded-lg mt-2 mb-2" style={{ maxHeight: 300, objectFit: 'cover' }} />}
                                    <div className="text-[11px] text-slate-400 mb-1">{MEMBERS[card.author]?.emoji || "👤"} {card.author}</div>
                                    {cmts.length > 0 ? (
                                        <div className="border-t border-slate-100 pt-1.5 mt-auto space-y-0.5">
                                            <div className="text-[11px] font-semibold text-slate-400">💬 댓글 {cmts.length}개</div>
                                            {cmts.slice(-2).map(c => (
                                                <div key={c.id} className="text-[11px] text-slate-500 truncate">
                                                    <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {renderChatMessage(c.text)}{c.imageUrl && " 📷"}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border-t border-slate-100 pt-1.5 mt-auto">
                                            <div className="text-[11px] text-slate-300">💬 댓글 없음</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {dropTarget?.col === "left" && dropTarget.idx >= kanban.length && draggedId != null && <DropLine />}
                    {kanban.length === 0 && !draggedId && (
                        <button onClick={() => openNew()} className="w-full py-6 flex items-center justify-center gap-1 text-[13px] text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><span className="text-[14px]">+</span> 추가</button>
                    )}
                </div>
            </div>

            {/* Files */}
            <div className={`flex-col min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden ${mobileTab === "files" ? "flex flex-1 min-h-0" : "hidden"} md:flex md:min-h-0`}>
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <h4 className="text-[14px] font-bold text-slate-700">📎 파일</h4>
                    <span className="text-[12px] text-slate-400">{files.length}개</span>
                </div>
                <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} compact />
            </div>
            {/* Chat */}
            <div className={`flex-col min-w-0 md:border md:border-slate-200 md:rounded-xl overflow-hidden ${mobileTab === "chat" ? "flex flex-1 min-h-0" : "hidden"} md:flex md:min-h-0`} style={{ background: "#FFFFFF" }}>
                <div className="hidden md:flex px-3 py-2.5 border-b border-slate-100 items-center justify-between flex-shrink-0">
                    <h4 className="text-[14px] font-bold text-slate-700">💬 채팅</h4>
                    <div className="flex items-center gap-2">
                        <button onClick={teamSearch.openSearch} className="text-[14px] text-slate-400 hover:text-blue-500 transition-colors" title="메시지 검색">🔍</button>
                        {currentUser === "박일웅" && (
                            <button onClick={() => confirmDel(() => onClearChat())} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                        )}
                    </div>
                </div>
                {teamSearch.searchOpen && (
                    <ChatSearchBar messages={chat} onClose={teamSearch.closeSearch} onScrollTo={teamSearch.scrollToMsg} />
                )}
                <div ref={teamChatContainerRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
                    {chat.length === 0 && <div className="text-center py-6 text-slate-400 text-[12px]">메시지가 없습니다</div>}
                    {chat.map((msg, idx) => {
                        const prev = idx > 0 ? chat[idx - 1] : null;
                        const isMe = msg.author === currentUser;
                        const sameAuthor = prev && prev.author === msg.author && !prev.deleted;
                        const prevDate = prev ? prev.date.split(/오[전후]/)[0].trim() : "";
                        const currDate = msg.date.split(/오[전후]/)[0].trim();
                        const showDateSep = !prev || prevDate !== currDate;
                        const showAvatar = !isMe && (!sameAuthor || showDateSep);
                        const tm = msg.date.match(/(오[전후])\s*(\d+:\d+)/);
                        const timeStr = tm ? `${tm[1] === "오전" ? "AM" : "PM"} ${tm[2]}` : "";
                        const showMyTime = isMe && (!sameAuthor || showDateSep);
                        const reactions = msg.reactions || {};
                        const teamLastReadId = teamInitialLastReadRef.current;
                        const showTeamNewDivider = teamLastReadId != null && msg.id > teamLastReadId && (!prev || prev.id <= teamLastReadId || prev.deleted) && chat[chat.length - 1].id > teamLastReadId;
                        if (msg.deleted) return (
                            <div key={msg.id} className={`${sameAuthor && !showDateSep ? "mt-[5px]" : "mt-3"} text-center`}>
                                {showTeamNewDivider && <NewMessagesDivider />}
                                <span className="text-[12px] text-slate-400 italic">{msg.author}님이 메시지를 삭제했습니다.</span>
                            </div>
                        );
                        return (
                            <div key={msg.id} id={`msg-${msg.id}`} data-chat-id={msg.id}>
                                {showTeamNewDivider && <NewMessagesDivider />}
                                {showDateSep && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <span className="text-[12px] text-slate-400 whitespace-nowrap">{currDate}</span>
                                        <div className="flex-1 h-px bg-slate-200" />
                                    </div>
                                )}
                                <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameAuthor && !showDateSep ? "mt-[3px]" : "mt-3"} group/msg`}
                                    style={{ opacity: msg._sending ? 0.7 : 1 }}>
                                    {!isMe && (
                                        <div className="w-9 flex-shrink-0 mr-2 self-start">
                                            {showAvatar ? (
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[16px]">
                                                    {MEMBERS[msg.author]?.emoji || msg.author[0]}
                                                </div>
                                            ) : <div className="w-9" />}
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        {!isMe && showAvatar && (
                                            <div className="flex items-baseline gap-2 mb-1 px-1">
                                                <span className="text-[13px] font-semibold" style={{color:"#64748B"}}>{msg.author}</span>
                                                {MEMBERS[msg.author]?.team && <span className="text-[11px]" style={{color:"#94A3B8"}}>· {MEMBERS[msg.author]?.role ? `${MEMBERS[msg.author].role}/${MEMBERS[msg.author].team}` : MEMBERS[msg.author].team}</span>}
                                                <span className="text-[11px] ml-auto" style={{color:"#94A3B8"}}>{timeStr}</span>
                                            </div>
                                        )}
                                        {isMe && showMyTime && !msg._sending && !msg._failed && (
                                            <div className="flex justify-end mb-0.5 px-1">
                                                <span className="text-[11px]" style={{color:"#94A3B8"}}>{timeStr}</span>
                                            </div>
                                        )}
                                        {msg.replyTo && (
                                            <div className="text-[11px] text-slate-400 mb-1 px-3 py-1.5 rounded-lg border-l-[3px] max-w-full truncate cursor-pointer hover:bg-slate-100 transition-colors" style={{background:"#F8F9FA", borderLeftColor:"#CBD5E1"}}
                                                onClick={() => { const el = document.querySelector(`[data-chat-id="${msg.replyTo?.id}"]`); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("bg-blue-50"); setTimeout(() => el.classList.remove("bg-blue-50"), 1500); } }}>
                                                <span className="font-semibold text-slate-500">{msg.replyTo.author}</span>: {msg.replyTo.text || "📷 이미지"}
                                            </div>
                                        )}
                                        <div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                            <div className="relative" style={{ marginBottom: (!msg._sending && !msg._failed && Object.keys(reactions).length > 0) ? 14 : 0 }}>
                                                {/* Hover: show only ⋯ button */}
                                                {!msg._sending && !msg._failed && (
                                                    <div className={`absolute -top-3 ${isMe ? "left-0" : "right-0"} ${activeMenuMsgId === msg.id ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"} transition-opacity z-10`}>
                                                        <div className="relative">
                                                            <button onClick={() => { setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id); setEmojiPickerMsgId(null); }}
                                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[14px] text-slate-400 hover:bg-slate-100 transition-colors" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>⋯</button>
                                                            {activeMenuMsgId === msg.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-20" onClick={() => setActiveMenuMsgId(null)} />
                                                                    <div className={`absolute ${isMe ? "left-0" : "right-0"} top-9 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 min-w-[160px] z-30`}>
                                                                        <button onClick={() => { setReplyTo(msg); setActiveMenuMsgId(null); }}
                                                                            className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"><span>↩</span> 답장</button>
                                                                        {isMe && (
                                                                            <button onClick={() => { setEditingMsg(msg); setChatText(msg.text); setActiveMenuMsgId(null); }}
                                                                                className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"><span>✏️</span> 수정</button>
                                                                        )}
                                                                        <button onClick={() => { setEmojiPickerMsgId(msg.id); setActiveMenuMsgId(null); }}
                                                                            className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"><span>😊</span> 이모지</button>
                                                                        <button onClick={() => { onSaveCard({ id: genId(), title: `💬 ${msg.author}`, content: msg.text || "📷 이미지", status: "left", color: "#DBEAFE", author: msg.author, updatedAt: new Date().toISOString().split("T")[0], comments: [] }); setActiveMenuMsgId(null); }}
                                                                            className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"><span>📌</span> 보드에 고정</button>
                                                                        {(msg.author === currentUser || currentUser === "박일웅") && (<>
                                                                            <div className="h-px bg-slate-100 my-1" />
                                                                            <button onClick={() => confirmDel(() => { onUpdateChat({ ...msg, deleted: true, text: "", imageUrl: undefined }); setActiveMenuMsgId(null); })}
                                                                                className="w-full text-left px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2"><span>🗑</span> 삭제</button>
                                                                        </>)}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {emojiPickerMsgId === msg.id && (
                                                    <div className={`absolute -top-3 ${isMe ? "left-0" : "right-0"} z-10`}>
                                                        <EmojiPickerPopup onSelect={(em) => { toggleReaction(msg.id, em); setEmojiPickerMsgId(null); }} />
                                                    </div>
                                                )}
                                                <div style={{ background: isMe ? "#E3F2FD" : "#F1F3F5", borderRadius: "18px", padding: "7px 14px", lineHeight: "1.5", wordBreak: 'break-all', overflowWrap: 'break-word' }}
                                                    className="text-[13px] text-slate-800">
                                                    {msg.imageUrl && <img src={msg.imageUrl} alt="" className="w-full rounded-md mb-1.5 cursor-pointer" style={{ maxHeight: 300, objectFit: 'cover' }} onLoad={scrollTeamChat} onClick={(e) => { e.stopPropagation(); openLightbox(msg.imageUrl!); }} />}
                                                    {msg.text && <div className="whitespace-pre-wrap break-words">{renderChatMessage(msg.text)}{extractFirstUrl(msg.text) && <OgPreviewCard url={extractFirstUrl(msg.text)!} />}</div>}
                                                    {msg.edited && <span className="text-[10px] text-slate-400 ml-1">(수정됨)</span>}
                                                </div>
                                                {!msg._sending && !msg._failed && <ReactionBadges reactions={reactions} currentUser={currentUser} onToggle={(em) => toggleReaction(msg.id, em)} align={isMe ? "right" : "left"} />}
                                            </div>
                                            {!msg._sending && !msg._failed && <ReadReceiptBadge msgId={msg.id} currentUser={currentUser} readReceipts={readReceipts} showZero={!isMe} />}
                                        </div>
                                        {isMe && (msg._sending || msg._failed) && (
                                            <div className="text-[11px] text-slate-400 mt-0.5 px-1">
                                                {msg._sending ? <span className="animate-pulse">전송 중...</span> : <span className="text-red-500">⚠️ 전송 실패 <button onClick={() => onRetryChat(msg.id)} className="underline hover:text-red-600 ml-0.5">재전송</button> <span className="mx-0.5">|</span> <button onClick={() => onDeleteChat(msg.id)} className="underline hover:text-red-600">삭제</button></span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>
                {replyTo && !editingMsg && (
                    <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50 flex items-center gap-2 flex-shrink-0">
                        <div className="flex-1 min-w-0 text-[12px] text-slate-500 truncate">
                            <span className="font-semibold text-slate-600">{replyTo.author}</span>에게 답장: {replyTo.text || "📷 이미지"}
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 text-[14px] flex-shrink-0">✕</button>
                    </div>
                )}
                {editingMsg && (
                    <div className="px-3 pt-2 pb-1 border-t border-amber-200 bg-amber-50 flex items-center gap-2 flex-shrink-0">
                        <div className="flex-1 min-w-0 text-[12px] text-amber-700 truncate">
                            ✏️ 메시지 수정 중
                        </div>
                        <button onClick={() => { setEditingMsg(null); setChatText(""); }} className="text-slate-400 hover:text-red-500 text-[14px] flex-shrink-0">✕</button>
                    </div>
                )}
                <TypingIndicator typingUsers={teamTypingUsers} />
                <div className={`p-2.5 ${replyTo || editingMsg ? "" : "border-t border-slate-100"} flex-shrink-0 bg-white`}>
                    {chatImg && !editingMsg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[80px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-1.5 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        {!editingMsg && <button onClick={() => chatFileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[18px]" title="파일 첨부">{imgUploading ? "⏳" : "+"}</button>}
                        <div className="flex-1 relative">
                            <textarea ref={chatInputRef} value={chatText} onChange={e => { setChatText(e.target.value); mention.check(e.target.value, e.target.selectionStart ?? e.target.value.length); if (!editingMsg) teamReportTyping(); }} onPaste={editingMsg ? undefined : handlePaste}
                                onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                onKeyDown={e => { const mr = mention.handleKey(e); if (typeof mr === "string") { selectMention(mr); return; } if (mr === true) return; chatKeyDown(e, sendChat, composingRef); }}
                                placeholder={editingMsg ? "메시지 수정..." : "메시지 입력..."} rows={1}
                                className={`w-full border rounded-2xl px-4 py-2 text-[13px] focus:outline-none focus:ring-2 resize-none ${editingMsg ? "border-amber-300 focus:ring-amber-400/40" : "border-slate-200 focus:ring-blue-500/40"}`} />
                            <MentionPopup m={mention} onSelect={selectMention} />
                        </div>
                        <button onClick={sendChat} className={`w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors flex-shrink-0 text-[16px] ${editingMsg ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"}`} title={editingMsg ? "수정" : "전송"}>{editingMsg ? "✓" : "›"}</button>
                    </div>
                </div>
            </div>
            {/* Dismiss emoji picker on click outside */}
            {emojiPickerMsgId && <div className="fixed inset-0 z-[5]" onClick={() => setEmojiPickerMsgId(null)} />}

            {/* Detail modal */}
            {selected && !isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selected.title}</h3>
                            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg flex-shrink-0">✕</button>
                        </div>
                        <div className="p-4" style={{ overflow: 'hidden' }}>
                            <div className="text-[12px] text-slate-400 mb-3">{MEMBERS[selected.author]?.emoji || "👤"} {selected.author} · {selected.updatedAt}</div>
                            {selected.content && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{selected.content}</div>}
                            {selected.imageUrl && <img src={selected.imageUrl} alt="" className="rounded-lg mb-4 cursor-pointer" style={{ maxWidth: '100%', height: 'auto' }} onClick={() => openLightbox(selected.imageUrl!)} />}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({(selected.comments || []).length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {(selected.comments || []).map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group/c relative">
                                            <button onClick={() => deleteComment(c.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover/c:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{renderChatMessage(c.text)}{c.text && extractFirstUrl(c.text) && <OgPreviewCard url={extractFirstUrl(c.text)!} />}{c.imageUrl && <img src={c.imageUrl} alt="" className="rounded-md mt-1" style={{ maxWidth: '100%', height: 'auto' }} />}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {(selected.comments || []).length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                {cImg.preview}
                                <div className="flex gap-2 items-center">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글 작성... (Ctrl+V 이미지)"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onPaste={cImg.onPaste} onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                                    <button onClick={addComment} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex-shrink-0">{cImg.uploading ? "⏳" : "전송"}</button>
                                </div>
                                {newComment && hasDraft(teamMemoDraftKey(selected.id)) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-200">
                            <button onClick={startEdit} className="px-3 py-1.5 text-[13px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                <button onClick={() => confirmDel(() => { onDeleteCard(selected.id); setSelected(null); })} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                <button onClick={() => setSelected(null)} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {selected && isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => { setIsEditing(false); boardImg.clear(); }}>
                    <div className="bg-white rounded-xl w-full shadow-2xl" style={{maxWidth:560}} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">카드 수정</h3>
                            <button onClick={() => { setIsEditing(false); boardImg.clear(); }} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40" style={{height:48}} onPaste={boardImg.onPaste} />
                            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요... (Ctrl+V로 이미지 붙여넣기)" className="w-full border border-slate-200 rounded-lg px-3 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" style={{minHeight:200}} onPaste={boardImg.onPaste} onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.max(200, t.scrollHeight) + "px"; }} />
                            {boardImg.preview}
                            <ColorPicker color={color} onColor={setColor} />
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
                            <button onClick={() => { setIsEditing(false); boardImg.clear(); }} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">취소</button>
                            <button onClick={saveEdit} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardImg.uploading ? "⏳" : "저장"}</button>
                        </div>
                    </div>
                </div>
            )}

            {lightboxIdx !== null && chatImages.length > 0 && (
                <ChatImageLightbox images={chatImages} currentIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}

        </div>
    );
});


export { TeamOverview, TeamMemoView };
