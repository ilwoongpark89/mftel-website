import type { TeamChatMsg, LabFile } from "./types";
import { ALL_MEMBER_NAMES, DRAFT_PFX, FILE_MAX } from "./constants";

// ─── Unique ID generator (collision-safe, monotonic) ────────────────────────
let _idSeq = 0;
export const genId = () => Date.now() * 100 + (_idSeq++ % 100);

// ─── Array toggle helper ────────────────────────────────────────────────────
export const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

// ─── Draft auto-save helpers ────────────────────────────────────────────────
export const saveDraft = (key: string, val: string) => { try { if (val.trim()) localStorage.setItem(DRAFT_PFX + key, val); else localStorage.removeItem(DRAFT_PFX + key); } catch (e) { console.warn("Draft save failed:", e); } };
export const loadDraft = (key: string) => { try { return localStorage.getItem(DRAFT_PFX + key) || ""; } catch (e) { console.warn("Draft load failed:", e); return ""; } };
export const clearDraft = (key: string) => { try { localStorage.removeItem(DRAFT_PFX + key); } catch (e) { console.warn("Draft clear failed:", e); } };
export const hasDraft = (key: string) => { try { return !!localStorage.getItem(DRAFT_PFX + key); } catch (e) { console.warn("Draft check failed:", e); return false; } };

// ─── Chat helpers ───────────────────────────────────────────────────────────
export const chatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, send: () => void, composing?: React.MutableRefObject<boolean>) => {
    if (composing?.current) return;
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault(); send();
};

export const stripMsgFlags = (msgs: TeamChatMsg[]): TeamChatMsg[] => msgs.map(({ _sending, _failed, ...rest }) => rest as TeamChatMsg);

// ─── Color helpers ──────────────────────────────────────────────────────────
export const statusText = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 160 ? "#FFFFFF" : "#1E293B";
};

// ─── @Mention rendering ────────────────────────────────────────────────────
export function renderWithMentions(text: string) {
    if (!text) return null;
    const regex = new RegExp(`(@(?:${ALL_MEMBER_NAMES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}))(?=\\s|$|[.,!?])`, "g");
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
        if (part.startsWith("@") && ALL_MEMBER_NAMES.includes(part.slice(1))) {
            return <span key={i} className="px-0.5 rounded text-blue-600 font-semibold" style={{ background: "rgba(59,130,246,0.1)" }}>{part}</span>;
        }
        return part;
    });
}

// ─── Kanban DnD helpers ─────────────────────────────────────────────────────
export function calcDropIdx(e: React.DragEvent<HTMLDivElement>, col: string) {
    const cards = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[draggable]'));
    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) { idx = i; break; }
    }
    return { col, idx };
}

export function reorderKanbanItems<T extends { id: number }>(
    allItems: T[],
    draggedItem: T,
    targetStatus: string,
    targetIdx: number,
    getStatus: (item: T) => string,
    setStatus: (item: T, status: string) => T
): T[] {
    const without = allItems.filter(i => i.id !== draggedItem.id);
    const updated = getStatus(draggedItem) !== targetStatus ? setStatus(draggedItem, targetStatus) : draggedItem;
    const colItems = without.filter(i => getStatus(i) === targetStatus);
    const origCol = allItems.filter(i => getStatus(i) === targetStatus);
    const origIdx = origCol.findIndex(i => i.id === draggedItem.id);
    let adjusted = targetIdx;
    if (origIdx >= 0 && origIdx < targetIdx) adjusted = targetIdx - 1;
    const clamped = Math.min(adjusted, colItems.length);
    if (colItems.length === 0) return [...without, updated];
    if (clamped >= colItems.length) {
        const pos = without.indexOf(colItems[colItems.length - 1]);
        const result = [...without]; result.splice(pos + 1, 0, updated); return result;
    }
    const pos = without.indexOf(colItems[clamped]);
    const result = [...without]; result.splice(pos, 0, updated); return result;
}

// ─── File helpers ───────────────────────────────────────────────────────────
export const isImageFile = (f: LabFile) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(f.name) || f.type?.startsWith("image/");
export const isPdfFile = (f: LabFile) => /\.pdf$/i.test(f.name) || f.type === "application/pdf";

export async function uploadFile(file: File): Promise<string> {
    const tk = typeof window !== "undefined" ? localStorage.getItem("dashToken") || "" : "";
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/dashboard-files", {
        method: "POST",
        body: form,
        headers: tk ? { Authorization: `Bearer ${tk}` } : {},
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "업로드 실패" }));
        throw new Error(err.error || "업로드 실패");
    }
    const { url } = await res.json();
    return url;
}
