"use client";

import { useState, useMemo, useCallback, useContext, useRef } from "react";
import { ALL_MEMBER_NAMES, DEFAULT_MEMBERS } from "./constants";
import { uploadFile } from "./utils";
import { MembersContext } from "./contexts";

// ─── Delete Confirm Dialog ──────────────────────────────────────────────────

export function useConfirmDelete() {
    const [pending, setPending] = useState<(() => void) | null>(null);
    const confirm = (action: () => void) => setPending(() => action);
    const dialog = pending ? (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setPending(null)} style={{ animation: "backdropIn 0.15s ease" }}>
            <div className="bg-white rounded-2xl w-full shadow-xl" style={{ maxWidth: 400, padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", animation: "modalIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#FEE2E2" }}>
                        <span className="text-[22px]">🗑</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">정말 삭제하시겠습니까?</h3>
                    <p className="text-[13px] text-slate-400 mb-6">삭제된 항목은 복구할 수 없습니다.</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setPending(null)}
                            className="flex-1 py-2.5 rounded-xl text-[14px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">취소</button>
                        <button onClick={() => { pending(); setPending(null); }}
                            className="flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-colors" style={{ background: "#FEE2E2", color: "#DC2626" }}>삭제</button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;
    return { confirm, dialog };
}

// ─── @Mention Hook ──────────────────────────────────────────────────────────

export function useMention() {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const [idx, setIdx] = useState(0);
    const filtered = useMemo(() => {
        const q = filter.toLowerCase();
        const list = q ? ALL_MEMBER_NAMES.filter(n => n.includes(q) || (DEFAULT_MEMBERS[n]?.team || "").toLowerCase().includes(q)) : ALL_MEMBER_NAMES;
        return list.slice(0, 6);
    }, [filter]);
    const check = useCallback((text: string, pos: number) => {
        const before = text.slice(0, pos);
        const match = before.match(/@([^\s@]*)$/);
        if (match) { setOpen(true); setFilter(match[1]); setIdx(0); }
        else setOpen(false);
    }, []);
    const handleKey = useCallback((e: React.KeyboardEvent): string | boolean => {
        if (!open || filtered.length === 0) return false;
        if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); return true; }
        if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); return true; }
        if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); e.stopPropagation(); return filtered[idx] || false; }
        if (e.key === "Escape") { e.preventDefault(); setOpen(false); return true; }
        return false;
    }, [open, filtered, idx]);
    const apply = useCallback((text: string, pos: number, name: string) => {
        const before = text.slice(0, pos);
        const match = before.match(/@([^\s@]*)$/);
        if (!match) return null;
        const atIdx = pos - match[0].length;
        return { newText: text.slice(0, atIdx) + `@${name} ` + text.slice(pos), cursorPos: atIdx + name.length + 2 };
    }, []);
    return { open, filtered, idx, setIdx, check, handleKey, apply, close: () => setOpen(false) };
}

// ─── Mention Popup Component ────────────────────────────────────────────────

export function MentionPopup({ m, onSelect }: { m: ReturnType<typeof useMention>; onSelect: (name: string) => void }) {
    if (!m.open || m.filtered.length === 0) return null;
    return (
        <div className="absolute bottom-full left-0 right-0 z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 mb-1" onWheel={e => e.stopPropagation()}>
            {m.filtered.map((name, i) => (
                <button key={name} type="button" onMouseDown={e => e.preventDefault()} onClick={() => onSelect(name)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors"
                    style={{ background: i === m.idx ? "#F1F5F9" : "transparent" }}
                    onMouseEnter={() => m.setIdx(i)}>
                    <span className="text-[14px]">{DEFAULT_MEMBERS[name]?.emoji || "👤"}</span>
                    <span className="text-[13px] text-slate-700 font-medium">{name}</span>
                    <span className="text-[11px] text-slate-400">{DEFAULT_MEMBERS[name]?.team}</span>
                </button>
            ))}
        </div>
    );
}

// ─── Comment Image Paste Helper ─────────────────────────────────────────────

export function useCommentImg() {
    const [img, setImg] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(false);
    const [localPreview, setLocalPreview] = useState("");
    const lastFileRef = useRef<File | null>(null);
    const doUpload = async (file: File) => {
        lastFileRef.current = file;
        // Create local preview
        const reader = new FileReader();
        reader.onload = (ev) => setLocalPreview(ev.target?.result as string || "");
        reader.readAsDataURL(file);
        setUploading(true);
        setUploadError(false);
        try {
            const url = await uploadFile(file);
            setImg(url);
            setLocalPreview("");
        } catch {
            setUploadError(true);
        }
        setUploading(false);
    };
    const retry = () => { if (lastFileRef.current) doUpload(lastFileRef.current); };
    const onPaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile(); if (!file) return;
                if (file.size > 50 * 1024 * 1024) { alert("50MB 이하 이미지만 첨부 가능합니다."); return; }
                doUpload(file); return;
            }
        }
    };
    const clear = () => { setImg(""); setLocalPreview(""); setUploadError(false); lastFileRef.current = null; };
    const previewSrc = img || localPreview;
    const preview = previewSrc || uploadError ? (
        <div className="mb-1.5 relative inline-block">
            {previewSrc && (
                <div className="relative">
                    <img src={previewSrc} alt="" className={`max-h-[80px] rounded-md transition-all ${uploading ? "blur-sm opacity-60" : ""}`} />
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            )}
            {uploadError && (
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-red-500">업로드 실패</span>
                    <button onClick={retry} className="text-[11px] text-blue-500 hover:text-blue-600 font-medium">재시도</button>
                </div>
            )}
            {!uploading && <button onClick={clear} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button>}
        </div>
    ) : null;
    return { img, clear, onPaste, uploading, preview };
}
