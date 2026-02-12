"use client";

import { useState, useMemo, useCallback, useContext } from "react";
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
    const onPaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile(); if (!file) return;
                if (file.size > 10 * 1024 * 1024) { alert("10MB 이하 이미지만 첨부 가능합니다."); return; }
                setUploading(true);
                try { setImg(await uploadFile(file)); } catch { alert("이미지 업로드 실패"); }
                setUploading(false); return;
            }
        }
    };
    const clear = () => setImg("");
    const preview = img ? (
        <div className="mb-1.5 relative inline-block">
            <img src={img} alt="" className="max-h-[80px] rounded-md" />
            <button onClick={clear} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center">✕</button>
        </div>
    ) : null;
    return { img, clear, onPaste, uploading, preview };
}
