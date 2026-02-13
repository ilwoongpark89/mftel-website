"use client";

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import type { LabFile } from "../lib/types";
import { EMOJI_CATEGORIES, MEMO_COLORS, FILE_MAX } from "../lib/constants";
import { genId, uploadFile, isImageFile, isPdfFile, renderChatMessage, extractFirstUrl, sendMentionPush, saveDraft, loadDraft, clearDraft, hasDraft } from "../lib/utils";
import { MembersContext, SavingContext, ConfirmDeleteContext } from "../lib/contexts";
import { useCommentImg, useMention, MentionPopup } from "../lib/hooks";
import { OgPreviewCard } from "./OgPreviewCard";

// ─── Mobile Reorder Helper ────────────────────────────────────────────────────

export function moveInColumn<T extends { id: number }>(
    fullList: T[],
    itemId: number,
    direction: -1 | 1,
    columnItems: T[],
): T[] {
    const idx = columnItems.findIndex(x => x.id === itemId);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= columnItems.length) return fullList;
    const swapped = [...columnItems];
    [swapped[idx], swapped[targetIdx]] = [swapped[targetIdx], swapped[idx]];
    const colIds = new Set(columnItems.map(x => x.id));
    let ci = 0;
    return fullList.map(x => colIds.has(x.id) ? swapped[ci++] : x);
}

// ─── MobileReorderButtons ────────────────────────────────────────────────────

export function MobileReorderButtons({ idx, total, onMove }: { idx: number; total: number; onMove: (dir: -1 | 1) => void }) {
    if (total <= 1) return null;
    return (
        <div className="flex gap-1 md:hidden">
            {idx > 0 && <button onClick={e => { e.stopPropagation(); onMove(-1); }} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-500 text-[12px] hover:bg-slate-200 active:bg-slate-300">▲</button>}
            {idx < total - 1 && <button onClick={e => { e.stopPropagation(); onMove(1); }} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-500 text-[12px] hover:bg-slate-200 active:bg-slate-300">▼</button>}
        </div>
    );
}

// ─── SavingBadge ─────────────────────────────────────────────────────────────

export function SavingBadge({ id }: { id: number }) {
    const s = useContext(SavingContext);
    if (!s.has(id)) return null;
    return <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-full animate-pulse ml-1">저장 중</span>;
}

// ─── ReadReceiptBadge ────────────────────────────────────────────────────────

export function ReadReceiptBadge({ msgId, currentUser, readReceipts, showZero }: { msgId: number; currentUser: string; readReceipts?: Record<string, number>; showZero?: boolean }) {
    const MEMBERS = useContext(MembersContext);
    const [show, setShow] = useState(false);
    if (!readReceipts) return null;
    const readers = Object.entries(readReceipts).filter(([user, ts]) => user !== currentUser && ts >= msgId);
    if (readers.length === 0 && !showZero) return null;
    return (
        <div className="relative inline-block flex-shrink-0 self-end">
            <button onClick={(e) => { e.stopPropagation(); setShow(!show); }} className="text-[11px] text-blue-400 px-0.5 hover:text-blue-600 cursor-pointer whitespace-nowrap leading-none">
                {readers.length}
            </button>
            {show && (
                <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 px-1 min-w-[120px] z-50" onClick={e => e.stopPropagation()}>
                    <div className="text-[11px] font-semibold text-slate-500 px-2 pb-1 border-b border-slate-100 mb-1">읽은 사람</div>
                    {readers.map(([user]) => (
                        <div key={user} className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-slate-700">
                            <span className="text-[14px]">{MEMBERS[user]?.emoji || "👤"}</span>
                            <span>{user}</span>
                        </div>
                    ))}
                </div>
            )}
            {show && <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />}
        </div>
    );
}

// ─── PillSelect ──────────────────────────────────────────────────────────────

export function PillSelect({ options, selected, onToggle, emojis }: { options: string[]; selected: string[]; onToggle: (v: string) => void; emojis?: Record<string, string> }) {
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

// ─── ReactionBadges (shared reaction display with tooltip / long-press) ──────

function formatReactors(users: string[]): string {
    if (!Array.isArray(users) || users.length === 0) return "";
    if (users.length <= 3) return users.join(", ");
    return `${users[0]}, ${users[1]} 외 ${users.length - 2}명`;
}

export function ReactionBadges({ reactions, currentUser, onToggle, align = "left" }: {
    reactions: Record<string, string[] | number>;
    currentUser: string;
    onToggle: (emoji: string) => void;
    align?: "left" | "right";
}) {
    const [longPressEmoji, setLongPressEmoji] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const entries = Object.entries(reactions).filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return typeof v === "number" && v > 0;
    });
    if (entries.length === 0) return null;

    const startLongPress = (emoji: string) => {
        timerRef.current = setTimeout(() => setLongPressEmoji(emoji), 500);
    };
    const cancelLongPress = () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    return (
        <>
            <div className={`absolute -bottom-3 ${align === "right" ? "right-1" : "left-1"} flex flex-wrap gap-0.5`}>
                {entries.map(([emoji, val]) => {
                    const users = Array.isArray(val) ? val : [];
                    const count = Array.isArray(val) ? val.length : val;
                    const isMine = users.includes(currentUser);
                    const tooltip = users.length > 0 ? formatReactors(users) : `${count}명`;
                    return (
                        <button key={emoji}
                            onClick={() => onToggle(emoji)}
                            onTouchStart={() => startLongPress(emoji)}
                            onTouchEnd={cancelLongPress}
                            onTouchCancel={cancelLongPress}
                            title={tooltip}
                            className={`group/rb relative inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[11px] border shadow-sm transition-colors ${isMine ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                            {emoji}{count}
                            {/* PC hover tooltip */}
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/rb:flex whitespace-nowrap bg-slate-800 text-white text-[11px] px-2 py-1 rounded-lg shadow-lg z-50 max-w-[200px] text-center leading-tight"
                                style={{ wordBreak: "keep-all" }}>
                                {tooltip}
                            </span>
                        </button>
                    );
                })}
            </div>
            {/* Mobile long-press bottom sheet */}
            {longPressEmoji && (() => {
                const val = reactions[longPressEmoji];
                const users = Array.isArray(val) ? val : [];
                const count = Array.isArray(val) ? val.length : (val as number);
                return (
                    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={() => setLongPressEmoji(null)}>
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="relative bg-white rounded-t-2xl w-full max-w-sm pb-6 pt-3 px-5 animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
                            <div className="text-center text-2xl mb-2">{longPressEmoji}</div>
                            {users.length > 0 ? (
                                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                                    {users.map(u => (
                                        <div key={u} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{u[0]}</div>
                                            <span className="text-sm text-slate-700">{u}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-slate-500">{count}명이 반응했습니다</p>
                            )}
                            <button onClick={() => setLongPressEmoji(null)} className="mt-4 w-full py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">닫기</button>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}

// ─── EmojiPickerPopup ────────────────────────────────────────────────────────

const POPUP_WIDTH = 320;

export function EmojiPickerPopup({ onSelect }: { onSelect: (emoji: string) => void }) {
    const [tab, setTab] = useState(0);
    const cat = EMOJI_CATEGORIES[tab];
    const popupRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top?: number | string; bottom?: number | string; left?: number | string; right?: number | string }>({ top: "100%", right: 0 });

    useEffect(() => {
        const el = popupRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const next: typeof pos = {};

        // Vertical: if popup clips bottom, open above trigger instead
        if (rect.bottom > vh - 8) {
            next.bottom = "100%";
        } else {
            next.top = "100%";
        }

        // Horizontal: if popup clips right edge, align to right; if clips left, align to left
        if (rect.right > vw - 8) {
            next.right = 0;
        } else if (rect.left < 8) {
            next.left = 0;
            next.right = undefined;
        } else {
            next.right = 0;
        }

        setPos(next);
    }, []);

    return (
        <div ref={popupRef}
            className="absolute bg-white rounded-xl shadow-lg border border-slate-200 z-20"
            style={{ width: POPUP_WIDTH, marginTop: pos.top !== undefined ? 4 : undefined, marginBottom: pos.bottom !== undefined ? 4 : undefined, ...pos }}
            onClick={e => e.stopPropagation()}>
            <div className="flex border-b border-slate-100 px-1 pt-1 overflow-x-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                {EMOJI_CATEGORIES.map((c, i) => (
                    <button key={i} onClick={() => setTab(i)}
                        className={`shrink-0 px-2 py-1.5 text-[15px] rounded-t-lg transition-colors ${tab === i ? "bg-slate-100" : "hover:bg-slate-50"}`}
                        title={c.name}>{c.label}</button>
                ))}
            </div>
            <div className="px-2 pt-1 pb-0.5">
                <span className="text-[11px] text-slate-400 font-medium">{cat.name}</span>
            </div>
            <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[260px] overflow-y-auto modal-scroll">
                {cat.emojis.map(em => (
                    <button key={em} onClick={() => onSelect(em)}
                        className="w-[34px] h-[34px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-[18px] transition-colors">{em}</button>
                ))}
            </div>
        </div>
    );
}

// ─── DropLine ────────────────────────────────────────────────────────────────

export function DropLine() {
    return <div className="h-[6px] bg-blue-500 rounded-full mx-1 my-1 transition-all" style={{ animation: "dropPulse 1s ease-in-out infinite", boxShadow: "0 0 8px rgba(59,130,246,0.4)" }} />;
}

// ─── TeamFilterBar ───────────────────────────────────────────────────────────

export function TeamFilterBar({ teamNames, selected, onSelect }: { teamNames: string[]; selected: string; onSelect: (team: string) => void }) {
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

// ─── TeamSelect ──────────────────────────────────────────────────────────────

export function TeamSelect({ teamNames, selected, onSelect }: { teamNames: string[]; selected: string; onSelect: (v: string) => void }) {
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

// ─── FilePreviewModal ────────────────────────────────────────────────────────

export function FilePreviewModal({ file, onClose }: { file: LabFile; onClose: () => void }) {
    const img = isImageFile(file);
    const pdf = isPdfFile(file);
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <span className="text-[14px] truncate flex-1 pr-4" style={{fontWeight:650, color:"#334155"}}>{file.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                        <a href={file.url} download={file.name} className="text-[13px] text-blue-500 hover:text-blue-600 font-medium">다운로드</a>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg" title="닫기">✕</button>
                    </div>
                </div>
                <div className="overflow-auto" style={{ maxHeight: "calc(90vh - 60px)" }}>
                    {img && <img src={file.url} alt={file.name} className="rounded-lg mx-auto p-4" style={{ maxWidth: '100%', height: 'auto' }} />}
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

// ─── ItemFiles ───────────────────────────────────────────────────────────────

export function ItemFiles({ files, onChange, currentUser }: { files: LabFile[]; onChange: (files: LabFile[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<LabFile | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > FILE_MAX) { alert("50MB 이하 파일만 업로드 가능합니다."); return; }
        setUploading(true);
        try {
            const url = await uploadFile(file);
            onChange([...files, { id: genId(), name: file.name, size: file.size, url, type: file.type, uploader: currentUser, date: new Date().toLocaleString("ko-KR") }]);
        } catch { alert("파일 업로드에 실패했습니다."); }
        setUploading(false);
        e.target.value = "";
    };

    const handleDelete = async (id: number) => {
        const f = files.find(x => x.id === id);
        if (f?.url?.startsWith("https://")) { try { const tk = typeof window !== "undefined" ? localStorage.getItem("dashToken") || "" : ""; await fetch("/api/dashboard-files", { method: "DELETE", body: JSON.stringify({ url: f.url }), headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {}) } }); } catch (e) { console.warn("파일 삭제 실패:", e); } }
        onChange(files.filter(x => x.id !== id));
    };

    return (
        <div>
            <label className="text-[12px] font-semibold text-slate-500 block mb-1">첨부파일 ({files.length})</label>
            {files.length > 0 && (
                <div className="space-y-1 mb-2">
                    {files.map(f => (
                        <div key={f.id} className="group flex items-center gap-2 bg-slate-50 rounded-md px-2.5 py-1.5">
                            <span className="text-[14px] shrink-0 cursor-pointer" onClick={() => { if (isImageFile(f) || isPdfFile(f)) setPreview(f); else { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); } }}>
                                {isImageFile(f) ? "🖼️" : isPdfFile(f) ? "📄" : "📎"}
                            </span>
                            <button onClick={() => { if (isImageFile(f) || isPdfFile(f)) setPreview(f); else { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); } }}
                                className="text-[12px] font-medium text-blue-600 hover:text-blue-800 truncate flex-1 text-left">{f.name}</button>
                            <span className="text-[11px] text-slate-400 shrink-0">{(f.size / 1024).toFixed(0)}KB · {MEMBERS[f.uploader]?.emoji || ""}{f.uploader}</span>
                            {(f.uploader === currentUser || currentUser === "박일웅") && (
                                <button onClick={() => handleDelete(f.id)} className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">✕</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {uploading ? "업로드 중..." : "📎 파일 첨부"}
            </button>
            {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
        </div>
    );
}

// ─── FileBox ─────────────────────────────────────────────────────────────────

export function FileBox({ files, currentUser, onAddFile, onDeleteFile, compact }: {
    files: LabFile[]; currentUser: string; onAddFile: (f: LabFile) => void; onDeleteFile: (id: number) => void; compact?: boolean;
}) {
    const MEMBERS = useContext(MembersContext);
    const confirmDel = useContext(ConfirmDeleteContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<LabFile | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > FILE_MAX) { alert("50MB 이하 파일만 업로드 가능합니다."); return; }
        setUploading(true);
        try {
            const url = await uploadFile(file);
            onAddFile({ id: genId(), name: file.name, size: file.size, url, type: file.type, uploader: currentUser, date: new Date().toLocaleString("ko-KR") });
        } catch { alert("파일 업로드에 실패했습니다."); }
        setUploading(false);
        e.target.value = "";
    };

    const sorted = [...files].sort((a, b) => b.id - a.id);

    return (
        <>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {sorted.length === 0 && <div className={`text-center ${compact ? "py-6" : "py-12"}`}><div className="text-3xl mb-2">📁</div><div className="text-[13px]" style={{color:"#94A3B8"}}>파일을 업로드하세요 (50MB 이하)</div></div>}
                {sorted.map(f => (
                    <div key={f.id} className="group bg-slate-50 rounded-lg p-2.5 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start gap-2">
                            <span className="text-[16px] mt-0.5 shrink-0 cursor-pointer" onClick={() => { if (isImageFile(f) || isPdfFile(f)) setPreview(f); else { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); } }}>
                                {isImageFile(f) ? "🖼️" : isPdfFile(f) ? "📄" : "📎"}
                            </span>
                            <div className="flex-1 min-w-0">
                                <button onClick={() => { if (isImageFile(f) || isPdfFile(f)) setPreview(f); else { const a = document.createElement("a"); a.href = f.url; a.download = f.name; a.click(); } }}
                                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 truncate block w-full text-left">{f.name}</button>
                                <div className="text-[11px] text-slate-400 mt-0.5">{(f.size / 1024).toFixed(0)} KB · {MEMBERS[f.uploader]?.emoji || ""}{f.uploader}</div>
                            </div>
                            {(f.uploader === currentUser || currentUser === "박일웅") && (
                                <button onClick={() => confirmDel(() => onDeleteFile(f.id))}
                                    className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">✕</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2.5 border-t border-slate-100">
                <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {uploading ? "업로드 중..." : "📎 파일 업로드"}
                </button>
            </div>
            {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
        </>
    );
}

// ─── ColorPicker ─────────────────────────────────────────────────────────────

export function ColorPicker({ color, onColor, compact }: { color: string; onColor: (c: string) => void; compact?: boolean }) {
    return (
        <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">배경색</label>
            <div className="flex flex-wrap gap-1">{MEMO_COLORS.map(c => (
                <button key={c} onClick={() => onColor(c)} className={`${compact ? "w-5 h-5" : "w-6 h-6"} rounded border-2 transition-all ${color === c ? "border-blue-500 scale-110" : "border-slate-200"}`} style={{ background: c }} />
            ))}</div>
        </div>
    );
}

// ─── MiniBar ─────────────────────────────────────────────────────────────────

export function MiniBar({ items, maxVal }: { items: Array<{ label: string; count: number; color: string }>; maxVal: number }) {
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

// ─── Layout Settings ─────────────────────────────────────────────────────────

export interface LayoutSettings {
    boardRatio: number;
    filesRatio: number;
    chatRatio: number;
    boardColumns: number;
}

const LAYOUT_DEFAULTS: Record<string, LayoutSettings> = {
    personal: { boardRatio: 3, filesRatio: 2, chatRatio: 2.5, boardColumns: 2 },
    team: { boardRatio: 2, filesRatio: 2, chatRatio: 4, boardColumns: 1 },
};

export function useLayoutSettings(key: "personal" | "team") {
    const storageKey = `mftel_layout_${key}`;
    const defaults = LAYOUT_DEFAULTS[key];
    const [settings, setSettings] = useState<LayoutSettings>(defaults);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) setSettings(JSON.parse(saved));
        } catch { /* ignore */ }
    }, [storageKey]);

    const update = useCallback((patch: Partial<LayoutSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    }, [storageKey]);

    const reset = useCallback(() => {
        setSettings(defaults);
        try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }, [storageKey, defaults]);

    const gridTemplate = `${settings.boardRatio}fr ${settings.filesRatio}fr ${settings.chatRatio}fr`;

    return { settings, update, reset, gridTemplate };
}

export function LayoutSettingsOverlay({ settings, onUpdate, onReset, onClose, showBoardColumns }: {
    settings: LayoutSettings;
    onUpdate: (patch: Partial<LayoutSettings>) => void;
    onReset: () => void;
    onClose: () => void;
    showBoardColumns?: boolean;
}) {
    const backdropRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={backdropRef} className="fixed inset-0 z-50" onClick={e => { if (e.target === backdropRef.current) onClose(); }}>
            <div className="absolute top-12 right-4 w-[280px] bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-slate-700">⚙️ 레이아웃 설정</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-[16px] leading-none">✕</button>
                </div>
                <div className="px-4 py-3 space-y-4">
                    <div>
                        <div className="text-[12px] font-semibold text-slate-500 mb-2">패널 너비 비율</div>
                        <RatioSlider label="📝 보드" value={settings.boardRatio} onChange={v => onUpdate({ boardRatio: v })} />
                        <RatioSlider label="📎 파일" value={settings.filesRatio} onChange={v => onUpdate({ filesRatio: v })} />
                        <RatioSlider label="💬 채팅" value={settings.chatRatio} onChange={v => onUpdate({ chatRatio: v })} />
                    </div>
                    {showBoardColumns && (
                        <div>
                            <div className="text-[12px] font-semibold text-slate-500 mb-2">보드 열 개수</div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4].map(n => (
                                    <button key={n} onClick={() => onUpdate({ boardColumns: n })}
                                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${settings.boardColumns === n ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                                        {n}열
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 flex justify-end">
                    <button onClick={onReset} className="text-[11px] text-slate-400 hover:text-red-500 transition-colors">초기화</button>
                </div>
            </div>
        </div>
    );
}

function RatioSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-slate-500 w-[52px] shrink-0">{label}</span>
            <input type="range" min={1} max={5} step={0.5} value={value} onChange={e => onChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 accent-blue-500 cursor-pointer" />
            <span className="text-[11px] text-slate-400 w-[24px] text-right">{value}</span>
        </div>
    );
}

// ─── ChatImageLightbox ─────────────────────────────────────────────────────

export function ChatImageLightbox({ images, currentIndex, onClose }: {
    images: string[];
    currentIndex: number;
    onClose: () => void;
}) {
    const [idx, setIdx] = useState(currentIndex);
    const total = images.length;

    const goPrev = useCallback(() => setIdx(i => (i > 0 ? i - 1 : total - 1)), [total]);
    const goNext = useCallback(() => setIdx(i => (i < total - 1 ? i + 1 : 0)), [total]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowLeft") goPrev();
            else if (e.key === "ArrowRight") goNext();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose, goPrev, goNext]);

    // Sync when opened at a new index
    useEffect(() => { setIdx(currentIndex); }, [currentIndex]);

    if (total === 0) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center" role="dialog" aria-modal="true"
            onClick={onClose}>
            {/* Close button */}
            <button onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-[20px] transition-colors"
                title="닫기 (ESC)">
                ✕
            </button>
            {/* Counter */}
            {total > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-[13px] font-medium">
                    {idx + 1} / {total}
                </div>
            )}
            {/* Previous arrow */}
            {total > 1 && (
                <button onClick={e => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-[20px] transition-colors"
                    title="이전 (←)">
                    ‹
                </button>
            )}
            {/* Next arrow */}
            {total > 1 && (
                <button onClick={e => { e.stopPropagation(); goNext(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-[20px] transition-colors"
                    title="다음 (→)">
                    ›
                </button>
            )}
            {/* Image */}
            <img
                src={images[idx]}
                alt=""
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
                style={{ transition: "opacity 0.15s ease" }}
                onClick={e => e.stopPropagation()}
                draggable={false}
            />
        </div>
    );
}

// ─── ChatSearchBar ──────────────────────────────────────────────────────────

export function ChatSearchBar({ messages, onClose, onScrollTo }: {
    messages: { id: number; text: string; deleted?: boolean }[];
    onClose: () => void;
    onScrollTo: (id: number) => void;
}) {
    const [query, setQuery] = useState("");
    const [matchIdx, setMatchIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const matches = query.trim()
        ? messages.filter(m => !m.deleted && m.text && m.text.toLowerCase().includes(query.toLowerCase())).map(m => m.id)
        : [];

    const total = matches.length;

    // Reset to first match when query changes
    useEffect(() => { setMatchIdx(0); }, [query]);

    // Scroll to current match when matchIdx or matches change
    useEffect(() => {
        if (total > 0 && matches[matchIdx] != null) {
            onScrollTo(matches[matchIdx]);
        }
    }, [matchIdx, total, query]);

    const goNext = () => { if (total > 0) { const next = (matchIdx + 1) % total; setMatchIdx(next); } };
    const goPrev = () => { if (total > 0) { const prev = (matchIdx - 1 + total) % total; setMatchIdx(prev); } };

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") { e.preventDefault(); onClose(); }
        else if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); goPrev(); }
        else if (e.key === "Enter") { e.preventDefault(); goNext(); }
        else if (e.key === "ArrowDown") { e.preventDefault(); goNext(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };

    return (
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지 검색..."
                className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {query.trim() && (
                <span className="text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">
                    {total > 0 ? `${matchIdx + 1} / ${total}개` : "0개"}
                </span>
            )}
            <button onClick={goPrev} disabled={total === 0} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 disabled:opacity-30 text-[12px] flex-shrink-0" title="이전">▲</button>
            <button onClick={goNext} disabled={total === 0} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-200 disabled:opacity-30 text-[12px] flex-shrink-0" title="다음">▼</button>
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500 text-[14px] flex-shrink-0" title="닫기">✕</button>
        </div>
    );
}

/** Highlight search query within text for chat search results */
export function highlightSearchText(text: string, query: string): React.ReactNode {
    if (!query.trim() || !text) return null;
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let idx = lower.indexOf(q, lastIdx);
    let key = 0;
    while (idx !== -1) {
        if (idx > lastIdx) parts.push(text.slice(lastIdx, idx));
        parts.push(<mark key={key++} className="bg-amber-200 text-inherit rounded-sm px-px">{text.slice(idx, idx + query.length)}</mark>);
        lastIdx = idx + query.length;
        idx = lower.indexOf(q, lastIdx);
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));
    return parts.length > 0 ? <>{parts}</> : null;
}

/** Hook to manage chat search state */
export function useChatSearch() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedMsgId, setHighlightedMsgId] = useState<number | null>(null);

    const openSearch = useCallback(() => { setSearchOpen(true); setSearchQuery(""); setHighlightedMsgId(null); }, []);
    const closeSearch = useCallback(() => { setSearchOpen(false); setSearchQuery(""); setHighlightedMsgId(null); }, []);

    const scrollToMsg = useCallback((id: number) => {
        setHighlightedMsgId(id);
        const el = document.getElementById(`msg-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("chat-search-highlight");
            setTimeout(() => el.classList.remove("chat-search-highlight"), 1800);
        }
    }, []);

    return { searchOpen, searchQuery, setSearchQuery, highlightedMsgId, openSearch, closeSearch, scrollToMsg };
}

// ─── DetailChatPanel ────────────────────────────────────────────────────────

export type ChatMessage = { id: number; date: string; author: string; text: string; imageUrl?: string };

export function DetailChatPanel({ messages, currentUser, onAdd, onDelete, title = "댓글", placeholder = "댓글 입력... (Ctrl+V 이미지)", emptyText, draftKey }: {
    messages: ChatMessage[];
    currentUser: string;
    onAdd: (msg: ChatMessage) => void;
    onDelete: (id: number) => void;
    title?: string;
    placeholder?: string;
    emptyText?: string;
    draftKey?: string;
}) {
    const MEMBERS = useContext(MembersContext);
    const [text, setText] = useState("");
    const cImg = useCommentImg();
    const composingRef = useRef(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const mention = useMention();
    const inputRef = useRef<HTMLInputElement>(null);
    const selectMention = (name: string) => {
        const el = inputRef.current;
        const pos = el?.selectionStart ?? text.length;
        const result = mention.apply(text, pos, name);
        if (result) { setText(result.newText); mention.close(); setTimeout(() => { el?.focus(); el?.setSelectionRange(result.cursorPos, result.cursorPos); }, 10); }
    };

    useEffect(() => { if (draftKey) { const d = loadDraft(draftKey); if (d) setText(d); } }, [draftKey]);
    useEffect(() => { if (draftKey) saveDraft(draftKey, text); }, [text, draftKey]);

    const handleAdd = () => {
        if (!text.trim() && !cImg.img) return;
        if (draftKey) clearDraft(draftKey);
        onAdd({ id: genId(), date: new Date().toLocaleDateString("ko-KR"), author: currentUser, text: text.trim(), imageUrl: cImg.img || undefined });
        if (text.trim()) sendMentionPush(text.trim(), currentUser, title);
        setText(""); cImg.clear();
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
                <span className="text-[13px] font-bold text-slate-700">💬 {title} ({messages.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 modal-scroll">
                {messages.map(c => (
                    <div key={c.id} className="flex gap-2 group">
                        <div className="flex-1 bg-slate-50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[12px] font-semibold text-slate-700">{MEMBERS[c.author]?.emoji} {c.author}</span>
                                <span className="text-[11px] text-slate-400">{c.date}</span>
                            </div>
                            <div className="text-[13px] text-slate-600 whitespace-pre-wrap" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{renderChatMessage(c.text)}{c.text && extractFirstUrl(c.text) && <OgPreviewCard url={extractFirstUrl(c.text)!} />}{c.imageUrl && <img src={c.imageUrl} alt="" className="rounded-md mt-1" style={{ maxWidth: '100%', height: 'auto' }} />}</div>
                        </div>
                        {(c.author === currentUser || currentUser === "박일웅") && (
                            <button onClick={() => onDelete(c.id)} className="text-[11px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 self-start mt-2 flex-shrink-0">삭제</button>
                        )}
                    </div>
                ))}
                {messages.length === 0 && <div className="text-center py-8"><div className="text-2xl mb-2 opacity-30">💬</div><div className="text-[12px] text-slate-300">{emptyText || "댓글이 없습니다"}</div></div>}
                <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-slate-100 flex-shrink-0">
                {cImg.preview}
                <div className="flex gap-2 items-center relative">
                    <MentionPopup m={mention} onSelect={selectMention} />
                    <input ref={inputRef} value={text} onChange={e => { setText(e.target.value); mention.check(e.target.value, e.target.selectionStart ?? e.target.value.length); }}
                        onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={() => { composingRef.current = false; }}
                        onPaste={cImg.onPaste} onKeyDown={e => { const mr = mention.handleKey(e); if (typeof mr === "string") { selectMention(mr); return; } if (mr === true) return; if (e.key === "Enter" && !composingRef.current) handleAdd(); }}
                        placeholder={placeholder} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                    <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 flex-shrink-0">{cImg.uploading ? "⏳" : "등록"}</button>
                </div>
                {text && draftKey && hasDraft(draftKey) && <div className="text-[11px] text-amber-500 mt-1">(임시저장)</div>}
            </div>
        </div>
    );
}

// ─── DetailModal3Col ────────────────────────────────────────────────────────

export function DetailModal3Col({ onClose, onEdit, onDelete, files, currentUser, onAddFile, onDeleteFile, chatMessages, onAddChat, onDeleteChat, chatTitle, chatPlaceholder, chatDraftKey, chatEmptyText, children }: {
    onClose: () => void;
    onEdit: () => void;
    onDelete?: () => void;
    files: LabFile[];
    currentUser: string;
    onAddFile: (f: LabFile) => void;
    onDeleteFile: (id: number) => void;
    chatMessages: ChatMessage[];
    onAddChat: (msg: ChatMessage) => void;
    onDeleteChat: (id: number) => void;
    chatTitle?: string;
    chatPlaceholder?: string;
    chatDraftKey?: string;
    chatEmptyText?: string;
    children: React.ReactNode;
}) {
    const confirmDel = useContext(ConfirmDeleteContext);
    const [mobileTab, setMobileTab] = useState<"detail" | "files" | "chat">("detail");

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose} style={{ animation: "backdropIn 0.15s ease" }}>
            <div className="bg-white rounded-2xl w-[90vw] max-w-6xl h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: "modalIn 0.2s ease" }}>
                {/* Mobile tab bar */}
                <div className="md:hidden flex border-b border-slate-200">
                    {([["detail", "📋 상세"], ["files", `📎 파일 (${files.length})`], ["chat", `💬 ${chatTitle || "댓글"} (${chatMessages.length})`]] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setMobileTab(key as "detail" | "files" | "chat")}
                            className={`flex-1 text-center py-3 text-[13px] font-semibold transition-colors ${mobileTab === key ? "border-b-2 border-blue-500 text-blue-600" : "text-slate-400"}`}>
                            {label}
                        </button>
                    ))}
                </div>
                {/* Desktop 3-col / Mobile single panel */}
                <div className="flex-1 min-h-0 md:grid overflow-hidden" style={{ gridTemplateColumns: "1fr 1.8fr 1.2fr" }}>
                    {/* Left: Files */}
                    <div className={`flex flex-col min-h-0 overflow-hidden border-r border-slate-200 ${mobileTab === "files" ? "" : "hidden md:flex"}`}>
                        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
                            <span className="text-[13px] font-bold text-slate-700">📎 파일 ({files.length})</span>
                        </div>
                        <FileBox files={files} currentUser={currentUser} onAddFile={onAddFile} onDeleteFile={onDeleteFile} />
                    </div>
                    {/* Center: Detail content */}
                    <div className={`flex flex-col min-h-0 min-w-0 overflow-hidden border-r border-slate-200 ${mobileTab === "detail" ? "" : "hidden md:flex"}`}>
                        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto px-5 py-4 space-y-4 modal-scroll" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                            {children}
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-slate-100 flex-shrink-0">
                            <button onClick={onEdit} className="text-[13px] text-blue-600 hover:text-blue-700 font-medium">수정</button>
                            <div className="flex items-center gap-3">
                                {onDelete && (
                                    <button onClick={() => confirmDel(onDelete)} className="text-[13px] text-red-500 hover:text-red-600">삭제</button>
                                )}
                                <button onClick={onClose} className="px-4 py-2 text-[14px] text-slate-500 hover:bg-slate-50 rounded-lg">닫기</button>
                            </div>
                        </div>
                    </div>
                    {/* Right: Chat */}
                    <div className={`flex flex-col min-h-0 overflow-hidden ${mobileTab === "chat" ? "" : "hidden md:flex"}`}>
                        <DetailChatPanel messages={chatMessages} currentUser={currentUser} onAdd={onAddChat} onDelete={onDeleteChat}
                            title={chatTitle} placeholder={chatPlaceholder} draftKey={chatDraftKey} emptyText={chatEmptyText} />
                    </div>
                </div>
            </div>
        </div>
    );
}
