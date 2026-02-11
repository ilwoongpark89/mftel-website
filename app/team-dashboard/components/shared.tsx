"use client";

import { useState, useContext, useRef } from "react";
import type { LabFile } from "../lib/types";
import { EMOJI_CATEGORIES, MEMO_COLORS, FILE_MAX } from "../lib/constants";
import { genId, uploadFile, isImageFile, isPdfFile } from "../lib/utils";
import { MembersContext, SavingContext } from "../lib/contexts";

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

// ─── EmojiPickerPopup ────────────────────────────────────────────────────────

export function EmojiPickerPopup({ onSelect }: { onSelect: (emoji: string) => void }) {
    const [tab, setTab] = useState(0);
    const cat = EMOJI_CATEGORIES[tab];
    return (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-20" style={{ width: 280 }} onClick={e => e.stopPropagation()}>
            <div className="flex border-b border-slate-100 px-1 pt-1">
                {EMOJI_CATEGORIES.map((c, i) => (
                    <button key={i} onClick={() => setTab(i)}
                        className={`flex-1 py-1.5 text-[15px] rounded-t-lg transition-colors ${tab === i ? "bg-slate-100" : "hover:bg-slate-50"}`}
                        title={c.name}>{c.label}</button>
                ))}
            </div>
            <div className="p-2 grid grid-cols-7 gap-0.5 max-h-[240px] overflow-y-auto modal-scroll">
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
    return <div className="h-[3px] bg-blue-500 rounded-full mx-1 my-0.5 transition-all" style={{ animation: "dropPulse 1s ease-in-out infinite" }} />;
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

// ─── ItemFiles ───────────────────────────────────────────────────────────────

export function ItemFiles({ files, onChange, currentUser }: { files: LabFile[]; onChange: (files: LabFile[]) => void; currentUser: string }) {
    const MEMBERS = useContext(MembersContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<LabFile | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > FILE_MAX) { alert("10MB 이하 파일만 업로드 가능합니다."); return; }
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
            onAddFile({ id: genId(), name: file.name, size: file.size, url, type: file.type, uploader: currentUser, date: new Date().toLocaleString("ko-KR") });
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
                                <div className="text-[11px] text-slate-400 mt-0.5">{(f.size / 1024).toFixed(0)} KB · {MEMBERS[f.uploader]?.emoji || ""}{f.uploader}</div>
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
