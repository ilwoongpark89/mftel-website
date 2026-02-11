"use client";

import { useState, useEffect, useRef, useCallback, useContext, memo } from "react";
import type { LabFile, Memo, TeamChatMsg, TeamMemoCard } from "../lib/types";
import { MEMBERS, MEMO_COLORS } from "../lib/constants";
import { genId, chatKeyDown, renderWithMentions, saveDraft, loadDraft, clearDraft, hasDraft, uploadFile } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useMention, MentionPopup, useCommentImg } from "../lib/hooks";
import { ColorPicker, EmojiPickerPopup, FileBox, ReadReceiptBadge, SavingBadge } from "./shared";

const SimpleChatPanel = memo(function SimpleChatPanel({ chat, currentUser, onAdd, onUpdate, onDelete, onClear, onRetry, readReceipts }: {
    chat: TeamChatMsg[]; currentUser: string; onAdd: (msg: TeamChatMsg) => void; onUpdate: (msg: TeamChatMsg) => void; onDelete: (id: number) => void; onClear: () => void; onRetry: (id: number) => void;
    readReceipts?: Record<string, number>;
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [text, setText] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const didInit = useRef(false);
    const composingRef = useRef(false);
    const [replyTo, setReplyTo] = useState<TeamChatMsg | null>(null);
    const [moreMenuMsgId, setMoreMenuMsgId] = useState<number | null>(null);
    const mention = useMention();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const selectMention = (name: string) => {
        const el = inputRef.current;
        const pos = el?.selectionStart ?? text.length;
        const result = mention.apply(text, pos, name);
        if (result) { setText(result.newText); mention.close(); setTimeout(() => { el?.focus(); el?.setSelectionRange(result.cursorPos, result.cursorPos); }, 10); }
    };
    const scrollBottom = useCallback(() => { const el = containerRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);
    useEffect(() => { if (!didInit.current && chat.length > 0) { didInit.current = true; setTimeout(scrollBottom, 150); } else { requestAnimationFrame(scrollBottom); } }, [chat.length, scrollBottom]);
    const sendMsg = () => {
        if (!text.trim()) return;
        const now = new Date();
        const h = now.getHours(); const ampm = h < 12 ? "오전" : "오후"; const h12 = h % 12 || 12;
        const dateStr = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${ampm} ${h12}:${String(now.getMinutes()).padStart(2, "0")}`;
        onAdd({ id: genId(), author: currentUser, text: text.trim(), date: dateStr, reactions: {}, ...(replyTo ? { replyTo: { id: replyTo.id, author: replyTo.author, text: replyTo.text?.slice(0, 50) } } : {}) });
        setText(""); setReplyTo(null);
    };
    const toggleReaction = (msgId: number, emoji: string) => {
        const msg = chat.find(m => m.id === msgId); if (!msg) return;
        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] || [];
        reactions[emoji] = users.includes(currentUser) ? users.filter(u => u !== currentUser) : [...users, currentUser];
        if (reactions[emoji].length === 0) delete reactions[emoji];
        onUpdate({ ...msg, reactions });
    };

    return (
        <div className="flex flex-col h-full border border-slate-200 rounded-xl bg-white">
            <div className="flex px-3 py-2.5 border-b border-slate-100 items-center justify-between">
                <h3 className="text-[14px] font-bold text-slate-700">🗣️ 잡담 채팅</h3>
                {currentUser === "박일웅" && (
                    <button onClick={() => confirmDel(() => onClear())} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                )}
            </div>
            <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2">
                {chat.length === 0 && <div className="text-center py-16 text-slate-400 text-[13px]">자유롭게 대화해 보세요!</div>}
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
                    if (msg.deleted) return (
                        <div key={msg.id} className={`${sameAuthor && !showDateSep ? "mt-[5px]" : "mt-3"} text-center`}>
                            <span className="text-[12px] text-slate-400 italic">{msg.author}님이 메시지를 삭제했습니다.</span>
                        </div>
                    );
                    return (
                        <div key={msg.id} data-chat-id={msg.id}>
                            {showDateSep && (
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-[12px] text-slate-400 whitespace-nowrap">{currDate}</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>
                            )}
                            <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameAuthor && !showDateSep ? "mt-[5px]" : "mt-[18px]"} group/msg`}
                                style={{ opacity: msg._sending ? 0.7 : 1 }}>
                                {!isMe && (
                                    <div className="w-8 flex-shrink-0 mr-1.5 self-start">
                                        {showAvatar ? (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[14px]">
                                                {MEMBERS[msg.author]?.emoji || msg.author[0]}
                                            </div>
                                        ) : <div className="w-8" />}
                                    </div>
                                )}
                                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    {!isMe && showAvatar && (
                                        <div className="flex items-baseline gap-1.5 mb-0.5 px-1">
                                            <span className="text-[12px] font-semibold" style={{color:"#64748B"}}>{msg.author}</span>
                                            <span className="text-[11px]" style={{color:"#94A3B8"}}>{timeStr}</span>
                                        </div>
                                    )}
                                    {isMe && showMyTime && !msg._sending && !msg._failed && (
                                        <div className="flex justify-end mb-0.5 px-1"><span className="text-[11px]" style={{color:"#94A3B8"}}>{timeStr}</span></div>
                                    )}
                                    {msg.replyTo && (
                                        <div className="text-[11px] text-slate-400 mb-1 px-2 py-1 rounded-lg border-l-[3px] max-w-full truncate cursor-pointer hover:bg-slate-100 transition-colors" style={{background:"#F8F9FA", borderLeftColor:"#CBD5E1"}}
                                            onClick={() => { const el = document.querySelector(`[data-chat-id="${msg.replyTo?.id}"]`); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("bg-blue-50"); setTimeout(() => el.classList.remove("bg-blue-50"), 1500); } }}>
                                            <span className="font-semibold text-slate-500">{msg.replyTo.author}</span>: {msg.replyTo.text || "📷 이미지"}
                                        </div>
                                    )}
                                    <div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                        <div className="relative" style={{ marginBottom: Object.keys(reactions).length > 0 ? 12 : 0 }}>
                                            {!msg._sending && !msg._failed && (
                                                <div className="absolute -top-3 right-0 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10">
                                                    <div className="flex items-center bg-white rounded-full px-1.5 py-1 gap-0.5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                                                        {["👍","✅","😂"].map(em => (
                                                            <button key={em} onClick={() => toggleReaction(msg.id, em)}
                                                                className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] transition-colors ${reactions[em]?.includes(currentUser) ? "bg-blue-50" : "hover:bg-slate-100"}`}>{em}</button>
                                                        ))}
                                                        <button onClick={() => setReplyTo(msg)} className="w-6 h-6 flex items-center justify-center rounded-full text-[12px] hover:bg-slate-100">↩</button>
                                                        {(isMe || currentUser === "박일웅") && (
                                                            <div className="relative">
                                                                <button onClick={() => setMoreMenuMsgId(moreMenuMsgId === msg.id ? null : msg.id)}
                                                                    className="w-6 h-6 flex items-center justify-center rounded-full text-[12px] hover:bg-slate-100 text-slate-400">⋯</button>
                                                                {moreMenuMsgId === msg.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-20" onClick={() => setMoreMenuMsgId(null)} />
                                                                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-30 min-w-[80px]">
                                                                            <button onClick={() => { onDelete(msg.id); setMoreMenuMsgId(null); }} className="w-full px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50 text-left">삭제</button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap ${isMe ? "rounded-tr-md" : "rounded-tl-md"}`}
                                                style={{ background: isMe ? "#3B82F6" : "#F1F5F9", color: isMe ? "#FFFFFF" : "#1E293B" }}>
                                                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full rounded-lg mb-1 max-h-[200px] object-contain cursor-pointer" />}
                                                {msg.text && renderWithMentions(msg.text)}
                                            </div>
                                            {Object.keys(reactions).length > 0 && (
                                                <div className="flex flex-wrap gap-0.5 mt-0.5 absolute -bottom-3 left-0">
                                                    {Object.entries(reactions).filter(([, u]) => u.length > 0).map(([em, users]) => (
                                                        <button key={em} onClick={() => toggleReaction(msg.id, em)}
                                                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border ${users.includes(currentUser) ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"}`}>
                                                            {em} {users.length}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {!msg._sending && !msg._failed && <ReadReceiptBadge msgId={msg.id} currentUser={currentUser} readReceipts={readReceipts} showZero={!isMe} />}
                                    </div>
                                    {msg._failed && <button onClick={() => onRetry(msg.id)} className="text-[11px] text-red-500 mt-1 px-1 hover:underline">전송 실패 · 다시 시도</button>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {replyTo && (
                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[12px]">
                    <span className="text-slate-500 truncate flex-1">↩ <span className="font-medium">{replyTo.author}</span>: {replyTo.text?.slice(0, 40)}</span>
                    <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-red-500">✕</button>
                </div>
            )}
            {mention.open && <MentionPopup m={mention} onSelect={selectMention} />}
            <div className="px-2 py-2 border-t border-slate-100 flex items-end gap-1.5">
                <textarea ref={inputRef} value={text}
                    onChange={e => { setText(e.target.value); mention.check(e.target.value, e.target.selectionStart || 0); }}
                    onKeyDown={e => chatKeyDown(e, sendMsg, composingRef)}
                    onCompositionStart={() => { composingRef.current = true; }}
                    onCompositionEnd={() => { composingRef.current = false; }}
                    placeholder="메시지 입력..."
                    className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-400 max-h-[80px]" rows={1} />
                <button onClick={sendMsg} disabled={!text.trim()} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium disabled:opacity-30 hover:bg-blue-600 transition-colors">전송</button>
            </div>
        </div>
    );
});

// ─── Ideas / Chat View ──────────────────────────────────────────────────────


const LabChatView = memo(function LabChatView({ chat, currentUser, onAdd, onUpdate, onDelete, onClear, onRetry, files, onAddFile, onDeleteFile, board, onSaveBoard, onDeleteBoard, readReceipts }: {
    chat: TeamChatMsg[]; currentUser: string; onAdd: (msg: TeamChatMsg) => void; onUpdate: (msg: TeamChatMsg) => void; onDelete: (id: number) => void; onClear: () => void; onRetry: (id: number) => void;
    files: LabFile[]; onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
    board: TeamMemoCard[]; onSaveBoard: (c: TeamMemoCard) => void; onDeleteBoard: (id: number) => void;
    readReceipts?: Record<string, number>;
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
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
    const boardImg = useCommentImg();
    const boardCmtImg = useCommentImg();
    // Lab board comment draft
    const openBoardDetail = (card: TeamMemoCard) => { setSelectedCard(card); setBoardComment(loadDraft(`comment_labboard_${card.id}`)); };
    useEffect(() => { if (selectedCard) saveDraft(`comment_labboard_${selectedCard.id}`, boardComment); }, [boardComment, selectedCard?.id]);
    const [mobileTab, setMobileTab] = useState<"chat"|"board"|"files">("chat");
    const [replyTo, setReplyTo] = useState<TeamChatMsg | null>(null);
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<number | null>(null);
    const [moreMenuMsgId, setMoreMenuMsgId] = useState<number | null>(null);
    const mention = useMention();
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const selectMention = (name: string) => {
        const el = chatInputRef.current;
        const pos = el?.selectionStart ?? text.length;
        const result = mention.apply(text, pos, name);
        if (result) { setText(result.newText); mention.close(); setTimeout(() => { el?.focus(); el?.setSelectionRange(result.cursorPos, result.cursorPos); }, 10); }
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
        onUpdate({ ...msg, reactions });
    };

    const send = () => {
        if (!text.trim() && !chatImg) return;
        onAdd({ id: genId(), author: currentUser, text: text.trim(), date: new Date().toLocaleString("ko-KR"), imageUrl: chatImg || undefined, replyTo: replyTo ? { id: replyTo.id, author: replyTo.author, text: replyTo.text } : undefined });
        setText(""); setChatImg(""); setReplyTo(null);
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
    const openBoardAdd = () => { setBoardAdding(true); setBoardTitle(""); setBoardContent(""); setBoardColor(MEMO_COLORS[0]); boardImg.clear(); };
    const saveBoard = () => {
        onSaveBoard({ id: genId(), title: boardTitle.trim() || "제목 없음", content: boardContent, status: "left", color: boardColor, author: currentUser, updatedAt: new Date().toISOString().split("T")[0], imageUrl: boardImg.img || undefined });
        setBoardAdding(false); boardImg.clear();
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
                    <button onClick={openBoardAdd} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 추가</button>
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
                                    <span className={`text-[11px] font-medium ${card.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                </label>
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="text-[13px] font-semibold text-slate-800 break-words flex-1">{card.title}<SavingBadge id={card.id} /></h4>
                                    <span className="text-[11px] text-slate-400 ml-1 whitespace-nowrap">{card.updatedAt}</span>
                                </div>
                                {card.content && <div className="text-[11px] text-slate-600 mb-2 line-clamp-2 break-words">{card.content}</div>}
                                <div className="text-[11px] text-slate-400 mb-1">{MEMBERS[card.author]?.emoji || "👤"} {card.author}</div>
                                {cmts.length > 0 ? (
                                    <div className="border-t border-slate-100 pt-1.5 mt-auto space-y-0.5">
                                        <div className="text-[11px] font-semibold text-slate-400">💬 댓글 {cmts.length}개</div>
                                        {cmts.slice(-2).map(c => (
                                            <div key={c.id} className="text-[11px] text-slate-500 truncate">
                                                <span className="font-medium text-slate-600">{MEMBERS[c.author]?.emoji}{c.author}</span> {renderWithMentions(c.text)}{c.imageUrl && " 📷"}
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
            <div className={`flex-col min-w-0 md:border md:border-slate-200 md:rounded-xl ${mobileTab === "chat" ? "flex flex-1 min-h-0" : "hidden"} md:flex`} style={{ background: "#FFFFFF" }}>
                <div className="hidden md:flex px-3 py-2.5 border-b border-slate-100 items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">💬 연구실 채팅</h3>
                    {currentUser === "박일웅" && (
                        <button onClick={() => confirmDel(() => onClear())} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                    )}
                </div>
                <div ref={labChatContainerRef} className="flex-1 overflow-y-auto px-3 py-2">
                    {chat.length === 0 && <div className="text-center py-16 text-slate-400 text-[13px]">메시지가 없습니다. 자유롭게 대화해 보세요!</div>}
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
                        if (msg.deleted) return (
                            <div key={msg.id} className={`${sameAuthor && !showDateSep ? "mt-[5px]" : "mt-3"} text-center`}>
                                <span className="text-[12px] text-slate-400 italic">{msg.author}님이 메시지를 삭제했습니다.</span>
                            </div>
                        );
                        return (
                            <div key={msg.id} data-chat-id={msg.id}>
                                {showDateSep && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <span className="text-[12px] text-slate-400 whitespace-nowrap">{currDate}</span>
                                        <div className="flex-1 h-px bg-slate-200" />
                                    </div>
                                )}
                                <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameAuthor && !showDateSep ? "mt-[5px]" : "mt-[18px]"} group/msg`}
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
                                            <div className="relative" style={{ marginBottom: Object.keys(reactions).length > 0 ? 14 : 0 }}>
                                                {/* Hover action bar — fixed to top-right of bubble */}
                                                {!msg._sending && !msg._failed && (
                                                    <div className="absolute -top-3 right-0 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10">
                                                        <div className="flex items-center bg-white rounded-full px-2 py-1.5 gap-0.5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                                                            {["👍","✅","😂"].map(em => (
                                                                <button key={em} onClick={() => toggleReaction(msg.id, em)}
                                                                    className={`w-7 h-7 flex items-center justify-center rounded-full text-[14px] transition-colors ${reactions[em]?.includes(currentUser) ? "bg-blue-50" : "hover:bg-slate-100"}`}>{em}</button>
                                                            ))}
                                                            <div className="relative">
                                                                <button onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-[14px] transition-colors">😊</button>
                                                                {emojiPickerMsgId === msg.id && (
                                                                    <EmojiPickerPopup onSelect={(em) => { toggleReaction(msg.id, em); setEmojiPickerMsgId(null); }} />
                                                                )}
                                                            </div>
                                                            <button onClick={() => setReplyTo(msg)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-[14px] text-slate-500 transition-colors" title="답장">↩</button>
                                                            <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                                            <div className="relative">
                                                                <button onClick={() => setMoreMenuMsgId(moreMenuMsgId === msg.id ? null : msg.id)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-[14px] text-slate-400 transition-colors" title="더보기">⋮</button>
                                                                {moreMenuMsgId === msg.id && (
                                                                    <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 min-w-[160px] z-30">
                                                                        <button onClick={() => { onSaveBoard({ id: genId(), title: `💬 ${msg.author}`, content: msg.text || "📷 이미지", status: "left", color: "#DBEAFE", author: msg.author, updatedAt: new Date().toISOString().split("T")[0], comments: [] }); setMoreMenuMsgId(null); }}
                                                                            className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"><span>📌</span> 보드에 고정</button>
                                                                        {msg.author === currentUser && (<>
                                                                            <div className="h-px bg-slate-100 my-1" />
                                                                            <button onClick={() => confirmDel(() => { onUpdate({ ...msg, deleted: true, text: "", imageUrl: undefined }); setMoreMenuMsgId(null); })}
                                                                                className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 flex items-center gap-2"><span className="text-red-400">🗑</span> 삭제</button>
                                                                        </>)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div style={{ background: isMe ? "#E3F2FD" : "#F1F3F5", borderRadius: "18px", padding: "12px 16px", lineHeight: "1.65" }}
                                                    className="text-[13px] text-slate-800">
                                                    {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-h-[300px] rounded-md mb-1.5 cursor-pointer" style={{maxWidth:"min(80%, 400px)"}} onLoad={scrollLabChat} onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
                                                    {msg.text && <div className="whitespace-pre-wrap break-words">{renderWithMentions(msg.text)}</div>}
                                                </div>
                                                {Object.keys(reactions).length > 0 && (
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
                                            {!msg._sending && !msg._failed && <ReadReceiptBadge msgId={msg.id} currentUser={currentUser} readReceipts={readReceipts} showZero={!isMe} />}
                                        </div>
                                        {isMe && (msg._sending || msg._failed) && (
                                            <div className="text-[11px] text-slate-400 mt-0.5 px-1">
                                                {msg._sending ? <span className="animate-pulse">전송 중...</span> : <span className="text-red-500">⚠️ 전송 실패 <button onClick={() => onRetry(msg.id)} className="underline hover:text-red-600 ml-0.5">재전송</button> <span className="mx-0.5">|</span> <button onClick={() => onDelete(msg.id)} className="underline hover:text-red-600">삭제</button></span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={endRef} />
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
                    {chatImg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[80px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-1.5 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        <button onClick={() => chatFileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[18px]" title="파일 첨부">{imgUploading ? "⏳" : "+"}</button>
                        <div className="flex-1 relative">
                            <textarea ref={chatInputRef} value={text} onChange={e => { setText(e.target.value); mention.check(e.target.value, e.target.selectionStart ?? e.target.value.length); }} onPaste={handlePaste}
                                onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                onKeyDown={e => { const mr = mention.handleKey(e); if (typeof mr === "string") { selectMention(mr); return; } if (mr === true) return; chatKeyDown(e, send, composingRef); }}
                                placeholder="메시지 입력..." rows={1}
                                className="w-full border border-slate-200 rounded-2xl px-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                            <MentionPopup m={mention} onSelect={selectMention} />
                        </div>
                        <button onClick={send} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors flex-shrink-0 text-[16px]" title="전송">›</button>
                    </div>
                </div>
            </div>
            {/* Dismiss more menu on click outside */}
            {moreMenuMsgId && <div className="fixed inset-0 z-[5]" onClick={() => setMoreMenuMsgId(null)} />}
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
                            <div className="text-[12px] text-slate-400 mb-3">{MEMBERS[selectedCard.author]?.emoji || "👤"} {selectedCard.author} · {selectedCard.updatedAt}</div>
                            {selectedCard.content && <div className="text-[14px] text-slate-700 mb-4 whitespace-pre-wrap break-words">{selectedCard.content}</div>}
                            {selectedCard.imageUrl && <img src={selectedCard.imageUrl} alt="" className="max-w-full max-h-[300px] rounded-md mb-4 cursor-pointer" onClick={() => setPreviewImg(selectedCard.imageUrl!)} />}
                            <div className="border-t border-slate-200 pt-4">
                                <div className="text-[13px] font-semibold text-slate-600 mb-3">💬 댓글 ({(selectedCard.comments || []).length})</div>
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    {(selectedCard.comments || []).map(c => (
                                        <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2.5 group/c relative">
                                            <button onClick={() => { const updated = { ...selectedCard, comments: (selectedCard.comments || []).filter(x => x.id !== c.id) }; onSaveBoard(updated); setSelectedCard(updated); }}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-[12px] opacity-0 group-hover/c:opacity-100 transition-opacity">✕</button>
                                            <div className="text-[13px] text-slate-700 pr-4 break-words">{renderWithMentions(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mt-1" />}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{MEMBERS[c.author]?.emoji} {c.author} · {c.date}</div>
                                        </div>
                                    ))}
                                    {(selectedCard.comments || []).length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">아직 댓글이 없습니다</div>}
                                </div>
                                {boardCmtImg.preview}
                                <div className="flex gap-2 items-center">
                                    <input value={boardComment} onChange={e => setBoardComment(e.target.value)} placeholder="댓글 작성... (Ctrl+V 이미지)"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onPaste={boardCmtImg.onPaste}
                                        onKeyDown={e => chatKeyDown(e, () => { if (!boardComment.trim() && !boardCmtImg.img) return; clearDraft(`comment_labboard_${selectedCard.id}`); const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: genId(), author: currentUser, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: boardCmtImg.img || undefined }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); boardCmtImg.clear(); })} />
                                    <button onClick={() => { if (!boardComment.trim() && !boardCmtImg.img) return; clearDraft(`comment_labboard_${selectedCard.id}`); const updated = { ...selectedCard, comments: [...(selectedCard.comments || []), { id: genId(), author: currentUser, text: boardComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: boardCmtImg.img || undefined }] }; onSaveBoard(updated); setSelectedCard(updated); setBoardComment(""); boardCmtImg.clear(); }}
                                        className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">{boardCmtImg.uploading ? "⏳" : "전송"}</button>
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

            {previewImg && (
                <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4 cursor-pointer" role="dialog" aria-modal="true" onClick={() => setPreviewImg("")}>
                    <img src={previewImg} alt="" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
                </div>
            )}
        </div>
    );
});

// ─── Team Memo View ──────────────────────────────────────────────────────────


export { SimpleChatPanel, LabChatView };
