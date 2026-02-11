"use client";

import { useState, useEffect, useRef, useCallback, useContext, memo } from "react";
import type { LabFile, Memo, TeamChatMsg } from "../lib/types";
import { MEMBERS, MEMO_COLORS } from "../lib/constants";
import { genId, chatKeyDown, renderWithMentions, uploadFile } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useMention, MentionPopup, useCommentImg } from "../lib/hooks";
import { ColorPicker, EmojiPickerPopup, FileBox, ReadReceiptBadge, SavingBadge } from "./shared";

const PersonalMemoView = memo(function PersonalMemoView({ memos, onSave, onDelete, files, onAddFile, onDeleteFile, chat, onAddChat, onUpdateChat, onDeleteChat, onClearChat, onRetryChat, currentUser, readReceipts }: {
    memos: Memo[]; onSave: (m: Memo) => void; onDelete: (id: number) => void;
    files: LabFile[]; onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void;
    chat: TeamChatMsg[]; onAddChat: (msg: TeamChatMsg) => void; onUpdateChat: (msg: TeamChatMsg) => void; onDeleteChat: (id: number) => void; onClearChat: () => void; onRetryChat: (id: number) => void;
    currentUser: string;
    readReceipts?: Record<string, number>;
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [selected, setSelected] = useState<Memo | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [color, setColor] = useState(MEMO_COLORS[0]);
    const [borderColor, setBorderColor] = useState("");
    const [newComment, setNewComment] = useState("");
    const cImg = useCommentImg();
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
    const [chatReplyTo, setChatReplyTo] = useState<TeamChatMsg | null>(null);
    const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<number | null>(null);
    const [piMoreMenuMsgId, setPiMoreMenuMsgId] = useState<number | null>(null);
    const mention = useMention();
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const selectMention = (name: string) => {
        const el = chatInputRef.current;
        const pos = el?.selectionStart ?? chatText.length;
        const result = mention.apply(chatText, pos, name);
        if (result) { setChatText(result.newText); mention.close(); setTimeout(() => { el?.focus(); el?.setSelectionRange(result.cursorPos, result.cursorPos); }, 10); }
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
        onSave({ id: genId(), title: title.trim() || "제목 없음", content, color, borderColor, updatedAt: now, comments: [] });
        setAdding(false);
    };
    const addComment = () => {
        if (!selected || (!newComment.trim() && !cImg.img)) return;
        const updated = { ...selected, comments: [...(selected.comments || []), { id: genId(), author: currentUser, text: newComment.trim(), date: new Date().toLocaleDateString("ko-KR"), imageUrl: cImg.img || undefined }] };
        onSave(updated); setSelected(updated); setNewComment(""); cImg.clear();
    };
    const deleteComment = (cid: number) => {
        if (!selected) return;
        const updated = { ...selected, comments: (selected.comments || []).filter(c => c.id !== cid) };
        onSave(updated); setSelected(updated);
    };
    const sendChat = () => {
        if (!chatText.trim() && !chatImg) return;
        onAddChat({ id: genId(), author: currentUser, text: chatText.trim(), date: new Date().toLocaleString("ko-KR"), imageUrl: chatImg || undefined, replyTo: chatReplyTo ? { id: chatReplyTo.id, author: chatReplyTo.author, text: chatReplyTo.text } : undefined });
        setChatText(""); setChatImg(""); setChatReplyTo(null);
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
        if (!piChatDidInit.current && chat.length > 0) { piChatDidInit.current = true; setTimeout(scrollPiChat, 150); }
        else { requestAnimationFrame(scrollPiChat); }
    }, [chat.length, scrollPiChat]);

    return (
        <div className="grid gap-3 flex-1 min-h-0" style={{gridTemplateColumns:"1.2fr 0.8fr 1fr"}}>
            {/* Board */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[14px] font-bold text-slate-700">📝 노트</h3>
                    <button onClick={openAdd} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600">+ 추가</button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {memos.length === 0 && !adding && <div className="text-center py-12"><div className="text-3xl mb-2 opacity-40">📒</div><div className="text-slate-400 text-[13px]">노트가 없습니다</div></div>}
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
                                        <span className={`text-[11px] font-medium ${m.needsDiscussion ? "text-red-500" : "text-slate-400"}`}>논의 필요</span>
                                    </label>
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="text-[13px] font-semibold text-slate-800 break-words flex-1">{m.title}<SavingBadge id={m.id} /></div>
                                        <span className="text-[11px] text-slate-400 ml-1 whitespace-nowrap">{m.updatedAt}</span>
                                    </div>
                                    {m.content && <div className="text-[11px] text-slate-600 mb-2 line-clamp-3 break-words">{m.content}</div>}
                                    {cmts.length > 0 ? (
                                        <div className="border-t border-slate-100 pt-1.5 mt-auto space-y-0.5">
                                            <div className="text-[11px] font-semibold text-slate-400">💬 댓글 {cmts.length}개</div>
                                            {cmts.slice(-2).map(c => (
                                                <div key={c.id} className="text-[11px] text-slate-500 truncate">
                                                    <span className="font-medium text-slate-600">{c.author}</span> {renderWithMentions(c.text)}{c.imageUrl && " 📷"}
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
            <div className="flex flex-col min-w-0 border border-slate-200 rounded-xl min-h-0" style={{ background: "#FFFFFF" }}>
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-slate-700">💬 PI 채팅</h3>
                    {currentUser === "박일웅" && (
                        <button onClick={() => confirmDel(() => onClearChat())} className="text-[11px] text-slate-400 hover:text-red-500">초기화</button>
                    )}
                </div>
                <div ref={piChatContainerRef} className="flex-1 overflow-y-auto px-3 py-2">
                    {chat.length === 0 && <div className="text-center py-12 text-slate-400 text-[12px]">PI와 대화를 시작하세요</div>}
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
                                    <div className={`max-w-[85%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
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
                                                            <button onClick={() => setChatReplyTo(msg)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-[14px] text-slate-500 transition-colors" title="답장">↩</button>
                                                            <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                                            <div className="relative">
                                                                <button onClick={() => setPiMoreMenuMsgId(piMoreMenuMsgId === msg.id ? null : msg.id)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-[14px] text-slate-400 transition-colors" title="더보기">⋮</button>
                                                                {piMoreMenuMsgId === msg.id && (
                                                                    <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 min-w-[160px] z-30">
                                                                        <button onClick={() => { onSave({ id: genId(), title: `💬 ${msg.author}`, content: msg.text || "📷 이미지", color: "#DBEAFE", updatedAt: new Date().toISOString().split("T")[0], comments: [] }); setPiMoreMenuMsgId(null); }}
                                                                            className="w-full text-left px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"><span>📌</span> 노트에 저장</button>
                                                                        {msg.author === currentUser && (<>
                                                                            <div className="h-px bg-slate-100 my-1" />
                                                                            <button onClick={() => confirmDel(() => { onUpdateChat({ ...msg, deleted: true, text: "", imageUrl: undefined }); setPiMoreMenuMsgId(null); })}
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
                                                    {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-h-[300px] rounded-md mb-1 cursor-pointer" style={{maxWidth:"min(80%, 400px)"}} onLoad={scrollPiChat} onClick={(e) => { e.stopPropagation(); setPreviewImg(msg.imageUrl!); }} />}
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
                {chatReplyTo && (
                    <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
                        <div className="flex-1 min-w-0 text-[12px] text-slate-500 truncate">
                            <span className="font-semibold text-slate-600">{chatReplyTo.author}</span>에게 답장: {chatReplyTo.text || "📷 이미지"}
                        </div>
                        <button onClick={() => setChatReplyTo(null)} className="text-slate-400 hover:text-slate-600 text-[14px] flex-shrink-0">✕</button>
                    </div>
                )}
                <div className={`p-2.5 ${chatReplyTo ? "" : "border-t border-slate-100"} flex-shrink-0 bg-white`}>
                    {chatImg && <div className="mb-2 relative inline-block"><img src={chatImg} alt="" className="max-h-[80px] rounded-md" /><button onClick={() => setChatImg("")} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button></div>}
                    <div className="flex gap-1.5 items-center">
                        <input ref={chatFileRef} type="file" accept="image/*" className="hidden" onChange={handleChatImg} />
                        <button onClick={() => chatFileRef.current?.click()} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 text-[18px]" title="파일 첨부">{imgUploading ? "⏳" : "+"}</button>
                        <div className="flex-1 relative">
                            <textarea ref={chatInputRef} value={chatText} onChange={e => { setChatText(e.target.value); mention.check(e.target.value, e.target.selectionStart ?? e.target.value.length); }} onPaste={handlePaste}
                                onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                onKeyDown={e => { const mr = mention.handleKey(e); if (typeof mr === "string") { selectMention(mr); return; } if (mr === true) return; chatKeyDown(e, sendChat, composingRef); }}
                                placeholder="메시지 입력..." rows={1}
                                className="w-full border border-slate-200 rounded-2xl px-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                            <MentionPopup m={mention} onSelect={selectMention} />
                        </div>
                        <button onClick={sendChat} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors flex-shrink-0 text-[16px]" title="전송">›</button>
                    </div>
                </div>
            </div>
            {/* Dismiss more menu */}
            {piMoreMenuMsgId && <div className="fixed inset-0 z-[5]" onClick={() => setPiMoreMenuMsgId(null)} />}

            {/* Add modal */}
            {adding && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setAdding(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">새 노트</h3>
                            <button onClick={() => setAdding(false)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용..." rows={5} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
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
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800 break-words flex-1 pr-2">{selected.title}</h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={startEdit} className="text-[13px] text-blue-500 hover:text-blue-600 font-medium">수정</button>
                                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
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
                                            <div className="text-[13px] text-slate-700 pr-4 break-words">{renderWithMentions(c.text)}{c.imageUrl && <img src={c.imageUrl} alt="" className="max-w-full max-h-[200px] rounded-md mt-1" />}</div>
                                            <div className="text-[11px] text-slate-400 mt-1">{c.date}</div>
                                        </div>
                                    ))}
                                    {(selected.comments || []).length === 0 && <div className="text-[12px] text-slate-300 py-3 text-center">댓글이 없습니다</div>}
                                </div>
                                {cImg.preview}
                                <div className="flex gap-2">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="댓글... (Ctrl+V 이미지)"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                                        onPaste={cImg.onPaste} onKeyDown={e => chatKeyDown(e, addComment, composingRef)} />
                                    <button onClick={addComment} className="px-4 py-2 text-[14px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex-shrink-0">{cImg.uploading ? "⏳" : "전송"}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {selected && isEditing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setIsEditing(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="text-[15px] font-bold text-slate-800">노트 수정</h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용..." rows={5} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
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
                <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4 cursor-pointer" role="dialog" aria-modal="true" onClick={() => setPreviewImg("")}>
                    <img src={previewImg} alt="" className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl object-contain" />
                </div>
            )}
        </div>
    );
});

// ─── Meeting View ────────────────────────────────────────────────────────────


export { PersonalMemoView };
