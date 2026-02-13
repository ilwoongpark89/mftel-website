"use client";

import { useState, useEffect, useRef, useCallback, useContext, memo, useMemo } from "react";
import type { TeamChatMsg } from "../lib/types";
import type { DashboardData, BotResponse } from "../lib/aiBot";
import { parseCommand, generateResponse, SLASH_COMMANDS } from "../lib/aiBot";
import { ALL_MEMBER_NAMES } from "../lib/constants";
import { genId, chatKeyDown, renderWithMentions } from "../lib/utils";
import { MembersContext, ConfirmDeleteContext } from "../lib/contexts";
import { useMention, MentionPopup, useCommentImg } from "../lib/hooks";
import { ReadReceiptBadge } from "./shared";

// ─── Simple Markdown-like Renderer ──────────────────────────────────────────

function renderBotText(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            // Inline code `text`
            const codeParts = part.split(/(`[^`]+`)/g);
            return codeParts.map((cp, k) => {
                if (cp.startsWith("`") && cp.endsWith("`")) {
                    return <code key={`${j}-${k}`} className="px-1 py-0.5 bg-slate-200 rounded text-[12px] font-mono">{cp.slice(1, -1)}</code>;
                }
                return cp;
            });
        });
        return <div key={i}>{rendered}</div>;
    });
}

// ─── /command Highlight ─────────────────────────────────────────────────────

function renderUserText(text: string) {
    // Highlight /command at the start of messages, then run renderWithMentions on remaining parts
    const slashRegex = /(^\/\S+)/;
    const parts = text.split(slashRegex);
    if (parts.length === 1) return renderWithMentions(text);
    return parts.map((part, i) => {
        if (/^\/\S+/.test(part)) {
            return <span key={i} className="px-1 py-0.5 rounded text-blue-600 font-bold" style={{ background: "rgba(59,130,246,0.15)" }}>{part}</span>;
        }
        return <span key={i}>{renderWithMentions(part)}</span>;
    });
}

// ─── Slash Command Autocomplete ─────────────────────────────────────────────

function SlashAutocomplete({ query, selectedIdx, onSelect }: { query: string; selectedIdx: number; onSelect: (cmd: string) => void }) {
    // Filter commands based on query (the part after /)
    const filtered = useMemo(() => {
        const q = query.replace(/^\//, "");
        if (!q) return SLASH_COMMANDS;
        return SLASH_COMMANDS.filter(c => c.command.slice(1).includes(q));
    }, [query]);

    if (filtered.length === 0) return null;

    return (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-[260px] overflow-y-auto">
            {filtered.map((item, idx) => (
                <button
                    key={item.command}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-[13px] transition-colors ${idx === selectedIdx ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"}`}
                    onMouseDown={e => { e.preventDefault(); onSelect(item.command); }}
                >
                    <span className="font-mono font-semibold text-blue-600 min-w-[60px]">{item.command}</span>
                    <span className="text-slate-500">{item.description}</span>
                </button>
            ))}
        </div>
    );
}

// ─── AiBotChat Component ────────────────────────────────────────────────────

export const AiBotChat = memo(function AiBotChat({
    messages, currentUser, onAddMessage, onUpdateMessage, onDeleteMessage, onClearChat,
    dashboardData, onCalendarToggle, readReceipts,
}: {
    messages: TeamChatMsg[];
    currentUser: string;
    onAddMessage: (msg: TeamChatMsg) => void;
    onUpdateMessage: (msg: TeamChatMsg) => void;
    onDeleteMessage: (id: number) => void;
    onClearChat: () => void;
    dashboardData: DashboardData;
    onCalendarToggle: (name: string, date: string, type: string | null, desc?: string) => void;
    readReceipts?: Record<string, number>;
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const [text, setText] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const didInit = useRef(false);
    const composingRef = useRef(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const mention = useMention();
    const commentImg = useCommentImg();

    // Pending confirms — Map<msgId, confirmAction>
    const [pendingConfirms, setPendingConfirms] = useState<Map<number, NonNullable<BotResponse["confirmAction"]>>>(new Map());

    // Slash command autocomplete state
    const [slashOpen, setSlashOpen] = useState(false);
    const [slashIdx, setSlashIdx] = useState(0);
    const [slashQuery, setSlashQuery] = useState("");

    const memberNames = ALL_MEMBER_NAMES;

    const selectMention = (name: string) => {
        const el = inputRef.current;
        const pos = el?.selectionStart ?? text.length;
        const result = mention.apply(text, pos, name);
        if (result) { setText(result.newText); mention.close(); setTimeout(() => { el?.focus(); el?.setSelectionRange(result.cursorPos, result.cursorPos); }, 10); }
    };

    const scrollBottom = useCallback(() => {
        const el = containerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, []);

    useEffect(() => {
        if (!didInit.current && messages.length > 0) { didInit.current = true; setTimeout(scrollBottom, 150); }
        else { requestAnimationFrame(scrollBottom); }
    }, [messages.length, scrollBottom]);

    // Show help on first visit
    const [showedWelcome, setShowedWelcome] = useState(false);
    useEffect(() => {
        if (messages.length === 0 && !showedWelcome) {
            setShowedWelcome(true);
            const helpCmd = parseCommand("도움말", currentUser, memberNames);
            const helpResp = generateResponse(helpCmd, dashboardData, MEMBERS);
            const now = new Date();
            const h = now.getHours(); const ampm = h < 12 ? "오전" : "오후"; const h12 = h % 12 || 12;
            const dateStr = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${ampm} ${h12}:${String(now.getMinutes()).padStart(2, "0")}`;
            onAddMessage({ id: genId(), author: "AI 봇", text: helpResp.text, date: dateStr });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const makeDate = () => {
        const now = new Date();
        const h = now.getHours(); const ampm = h < 12 ? "오전" : "오후"; const h12 = h % 12 || 12;
        return `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${ampm} ${h12}:${String(now.getMinutes()).padStart(2, "0")}`;
    };

    // ─── Slash autocomplete helpers ─────────────────────────────────────
    const checkSlash = useCallback((val: string) => {
        // Show autocomplete when text starts with / and is one "word" (the command being typed)
        if (/^\/\S*$/.test(val) && val.length >= 1) {
            setSlashOpen(true);
            setSlashQuery(val);
            setSlashIdx(0);
        } else {
            setSlashOpen(false);
        }
    }, []);

    const getFilteredSlash = useCallback(() => {
        const q = slashQuery.replace(/^\//, "");
        if (!q) return SLASH_COMMANDS;
        return SLASH_COMMANDS.filter(c => c.command.slice(1).includes(q));
    }, [slashQuery]);

    const insertSlashCommand = useCallback((cmd: string) => {
        setText(cmd + " ");
        setSlashOpen(false);
        setTimeout(() => {
            const el = inputRef.current;
            if (el) { el.focus(); el.setSelectionRange(cmd.length + 1, cmd.length + 1); }
        }, 10);
    }, []);

    const sendMsg = () => {
        const msgText = text.trim();
        const imgUrl = commentImg.img;
        if (!msgText && !imgUrl) return;

        setSlashOpen(false);

        const dateStr = makeDate();
        const userMsg: TeamChatMsg = { id: genId(), author: currentUser, text: msgText, date: dateStr, reactions: {}, imageUrl: imgUrl || undefined };
        onAddMessage(userMsg);
        setText("");
        commentImg.clear();

        // Check for / trigger (slash command)
        if (/^\//.test(msgText)) {
            setTimeout(() => {
                const cmd = parseCommand(msgText, currentUser, memberNames);
                const resp = generateResponse(cmd, dashboardData, MEMBERS);
                const botMsg: TeamChatMsg = { id: genId(), author: "AI 봇", text: resp.text, date: makeDate() };
                onAddMessage(botMsg);

                if (resp.needsConfirm && resp.confirmAction) {
                    setPendingConfirms(prev => {
                        const next = new Map(prev);
                        next.set(botMsg.id, resp.confirmAction!);
                        return next;
                    });
                }
            }, 300);
        }
    };

    const handleConfirm = (msgId: number) => {
        const action = pendingConfirms.get(msgId);
        if (!action) return;

        // Execute calendar action
        if (action.type === "calendar") {
            const dateStr = action.dates.join(",");
            if (action.calendarType === "") {
                // Delete action
                onCalendarToggle(action.name, dateStr, null);
            } else {
                onCalendarToggle(action.name, dateStr, action.calendarType, action.description);
            }
        }

        // Update bot message with confirmation
        const msg = messages.find(m => m.id === msgId);
        if (msg) {
            onUpdateMessage({ ...msg, text: msg.text + "\n\n✅ **등록 완료!**" });
        }

        // Remove from pending
        setPendingConfirms(prev => {
            const next = new Map(prev);
            next.delete(msgId);
            return next;
        });
    };

    const handleCancel = (msgId: number) => {
        const msg = messages.find(m => m.id === msgId);
        if (msg) {
            onUpdateMessage({ ...msg, text: msg.text + "\n\n❌ **취소되었습니다.**" });
        }
        setPendingConfirms(prev => {
            const next = new Map(prev);
            next.delete(msgId);
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full border border-slate-200 rounded-xl bg-white">
            {/* Header */}
            <div className="flex px-3 py-2.5 border-b border-slate-100 items-center justify-between">
                <h3 className="text-[14px] font-bold text-slate-700">🤖 AI 어시스턴트</h3>
                {currentUser === "박일웅" && (
                    <button onClick={() => confirmDel(() => onClearChat())} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                )}
            </div>

            {/* Messages */}
            <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2">
                {messages.length === 0 && (
                    <div className="text-center py-16 text-slate-400 text-[13px]">
                        / 로 봇을 호출해보세요!
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const prev = idx > 0 ? messages[idx - 1] : null;
                    const isBot = msg.author === "AI 봇";
                    const isMe = msg.author === currentUser;
                    const sameAuthor = prev && prev.author === msg.author && !prev.deleted;
                    const prevDate = prev ? prev.date.split(/오[전후]/)[0].trim() : "";
                    const currDate = msg.date.split(/오[전후]/)[0].trim();
                    const showDateSep = !prev || prevDate !== currDate;
                    const showAvatar = !isMe && (!sameAuthor || showDateSep);
                    const tm = msg.date.match(/(오[전후])\s*(\d+:\d+)/);
                    const timeStr = tm ? `${tm[1] === "오전" ? "AM" : "PM"} ${tm[2]}` : "";
                    const showMyTime = isMe && (!sameAuthor || showDateSep);
                    const isPending = pendingConfirms.has(msg.id);

                    if (msg.deleted) return (
                        <div key={msg.id} className={`${sameAuthor && !showDateSep ? "mt-[5px]" : "mt-3"} text-center`}>
                            <span className="text-[12px] text-slate-400 italic">{msg.author}님이 메시지를 삭제했습니다.</span>
                        </div>
                    );

                    return (
                        <div key={msg.id}>
                            {showDateSep && (
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-[12px] text-slate-400 whitespace-nowrap">{currDate}</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>
                            )}
                            <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameAuthor && !showDateSep ? "mt-[3px]" : "mt-3"} group/msg`}>
                                {/* Avatar for others/bot */}
                                {!isMe && (
                                    <div className="w-8 flex-shrink-0 mr-1.5 self-start">
                                        {showAvatar ? (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] ${isBot ? "bg-violet-100" : "bg-slate-100"}`}>
                                                {isBot ? "🤖" : (MEMBERS[msg.author]?.emoji || msg.author[0])}
                                            </div>
                                        ) : <div className="w-8" />}
                                    </div>
                                )}
                                <div className={`max-w-[85%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    {/* Author name + time */}
                                    {!isMe && showAvatar && (
                                        <div className="flex items-baseline gap-1.5 mb-0.5 px-1">
                                            <span className={`text-[12px] font-semibold ${isBot ? "text-violet-600" : ""}`} style={isBot ? {} : { color: "#64748B" }}>{msg.author}</span>
                                            <span className="text-[11px]" style={{ color: "#94A3B8" }}>{timeStr}</span>
                                        </div>
                                    )}
                                    {isMe && showMyTime && (
                                        <div className="flex justify-end mb-0.5 px-1"><span className="text-[11px]" style={{ color: "#94A3B8" }}>{timeStr}</span></div>
                                    )}

                                    {/* Message bubble */}
                                    <div className="flex items-end gap-1">
                                        {isMe && !msg._sending && !msg._failed && <ReadReceiptBadge msgId={msg.id} currentUser={currentUser} readReceipts={readReceipts} />}
                                        <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words whitespace-pre-wrap ${isMe ? "rounded-tr-md" : "rounded-tl-md"}`}
                                            style={{
                                                background: isBot ? "#F8F5FF" : isMe ? "#3B82F6" : "#EFF6FF",
                                                color: isMe ? "#FFFFFF" : "#1E293B",
                                                borderLeft: isBot ? "3px solid #8B5CF6" : "none",
                                            }}>
                                            {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-full rounded-lg mb-1 max-h-[200px] object-contain" />}
                                            {isBot ? renderBotText(msg.text) : renderUserText(msg.text)}
                                        </div>
                                        {!isMe && !isBot && !msg._sending && !msg._failed && <ReadReceiptBadge msgId={msg.id} currentUser={currentUser} readReceipts={readReceipts} showZero={true} />}
                                    </div>

                                    {/* Confirm/Cancel buttons */}
                                    {isPending && (
                                        <div className="flex gap-2 mt-1.5 px-1">
                                            <button
                                                onClick={() => handleConfirm(msg.id)}
                                                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 transition-colors"
                                            >
                                                확인
                                            </button>
                                            <button
                                                onClick={() => handleCancel(msg.id)}
                                                className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[12px] font-medium hover:bg-slate-300 transition-colors"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    )}

                                    {/* Delete button for admin */}
                                    {!isBot && (isMe || currentUser === "박일웅") && (
                                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity mt-0.5">
                                            <button onClick={() => onDeleteMessage(msg.id)} className="text-[11px] text-slate-400 hover:text-red-500 px-1">삭제</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Image preview */}
            {commentImg.preview && (
                <div className="px-3 py-1">{commentImg.preview}</div>
            )}

            {/* Mention popup */}
            <div className="relative">
                {mention.open && <MentionPopup m={mention} onSelect={selectMention} />}
            </div>

            {/* Input area with slash autocomplete */}
            <div className="relative px-2 py-2 border-t border-slate-100">
                {/* Slash command autocomplete dropdown */}
                {slashOpen && (
                    <SlashAutocomplete
                        query={slashQuery}
                        selectedIdx={slashIdx}
                        onSelect={insertSlashCommand}
                    />
                )}

                <div className="flex items-end gap-1.5">
                    <textarea
                        ref={inputRef}
                        value={text}
                        onChange={e => {
                            setText(e.target.value);
                            mention.check(e.target.value, e.target.selectionStart || 0);
                            checkSlash(e.target.value);
                        }}
                        onKeyDown={e => {
                            // Handle slash autocomplete navigation
                            if (slashOpen) {
                                const filtered = getFilteredSlash();
                                if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    setSlashIdx(prev => (prev + 1) % filtered.length);
                                    return;
                                }
                                if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    setSlashIdx(prev => (prev - 1 + filtered.length) % filtered.length);
                                    return;
                                }
                                if (e.key === "Enter" && !e.shiftKey && filtered.length > 0) {
                                    e.preventDefault();
                                    insertSlashCommand(filtered[slashIdx].command);
                                    return;
                                }
                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    setSlashOpen(false);
                                    return;
                                }
                                // Tab also selects
                                if (e.key === "Tab" && filtered.length > 0) {
                                    e.preventDefault();
                                    insertSlashCommand(filtered[slashIdx].command);
                                    return;
                                }
                            }

                            const r = mention.handleKey(e);
                            if (r === true) return;
                            if (typeof r === "string") { selectMention(r); return; }
                            chatKeyDown(e, sendMsg, composingRef);
                        }}
                        onCompositionStart={() => { composingRef.current = true; }}
                        onCompositionEnd={() => { composingRef.current = false; }}
                        onPaste={commentImg.onPaste}
                        placeholder="메시지 입력... ( / 로 봇 호출)"
                        className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-400 max-h-[80px]"
                        rows={1}
                    />
                    <button
                        onClick={sendMsg}
                        disabled={!text.trim() && !commentImg.img}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium disabled:opacity-30 hover:bg-blue-600 transition-colors"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
});
