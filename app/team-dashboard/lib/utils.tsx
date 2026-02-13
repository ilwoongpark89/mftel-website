import React from "react";
import type { TeamChatMsg, LabFile } from "./types";
import { ALL_MEMBER_NAMES, DRAFT_PFX, FILE_MAX } from "./constants";
import katex from "katex";
import "katex/dist/katex.min.css";

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
export const MENTION_ALL_NAMES = ["전체", "all"];

export function renderWithMentions(text: string) {
    if (!text) return null;
    const allTargets = [...MENTION_ALL_NAMES, ...ALL_MEMBER_NAMES];
    const regex = new RegExp(`(@(?:${allTargets.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}))(?=\\s|$|[.,!?])`, "g");
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
        if (part.startsWith("@")) {
            const name = part.slice(1);
            if (MENTION_ALL_NAMES.includes(name)) {
                return <span key={i} className="bg-red-100 text-red-600 rounded px-0.5 font-medium">{part}</span>;
            }
            if (ALL_MEMBER_NAMES.includes(name)) {
                return <span key={i} className="bg-blue-100 text-blue-600 rounded px-0.5 font-medium">{part}</span>;
            }
        }
        return part;
    });
}

// ─── @Mention helpers ────────────────────────────────────────────────────
export function extractMentionedNames(text: string): string[] {
    if (!text) return [];
    const allTargets = [...MENTION_ALL_NAMES, ...ALL_MEMBER_NAMES];
    const regex = new RegExp(`@(${allTargets.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=\\s|$|[.,!?])`, "g");
    const names: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        names.push(match[1]);
    }
    return names;
}

export function sendMentionPush(messageText: string, sender: string, chatName: string) {
    const mentioned = extractMentionedNames(messageText);
    if (mentioned.length === 0) return;
    const isAll = mentioned.some(n => MENTION_ALL_NAMES.includes(n));
    const targetUsers = isAll ? ALL_MEMBER_NAMES : ALL_MEMBER_NAMES.filter(n => mentioned.includes(n));
    if (targetUsers.length === 0) return;
    const preview = messageText.length > 50 ? messageText.slice(0, 50) + "..." : messageText;
    const tk = typeof window !== "undefined" ? localStorage.getItem("mftel-auth-token") || "" : "";
    fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
        body: JSON.stringify({
            targetUsers,
            title: `${sender}님이 멘션했습니다`,
            body: `${chatName}에서: ${preview}`,
            tag: "mention",
            url: "/team-dashboard",
            excludeUser: sender,
        }),
    }).catch(e => console.warn("Mention push failed:", e));
}

// ─── URL detection regex ──────────────────────────────────────────────────
const URL_REGEX = /(https?:\/\/[^\s<>"')\]]+)/g;

// ─── Extract first URL from text ──────────────────────────────────────────
export function extractFirstUrl(text: string): string | null {
    if (!text) return null;
    const match = text.match(URL_REGEX);
    return match ? match[0] : null;
}

// ─── Render text with URLs auto-linked + mentions ─────────────────────────
export function renderMessageText(text: string): React.ReactNode {
    if (!text) return null;

    // Split text by URLs first
    const urlParts = text.split(URL_REGEX);
    if (urlParts.length === 1) {
        // No URLs found, just render with mentions
        return renderWithMentions(text);
    }

    return urlParts.map((part, i) => {
        if (URL_REGEX.test(part)) {
            // Reset regex lastIndex
            URL_REGEX.lastIndex = 0;
            return (
                <a
                    key={`url-${i}`}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline break-all"
                    onClick={e => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        // Non-URL part: render with mentions
        const mentioned = renderWithMentions(part);
        if (typeof mentioned === "string") return mentioned;
        return <span key={`txt-${i}`}>{mentioned}</span>;
    });
}

// ─── Code Block & Math Rendering (renderChatMessage) ─────────────────────────

type Segment =
    | { type: "codeblock"; lang: string; code: string }
    | { type: "inlinecode"; code: string }
    | { type: "blockmath"; tex: string }
    | { type: "inlinemath"; tex: string }
    | { type: "text"; text: string };

/** Parse raw text into typed segments: code blocks, inline code, block math, inline math, plain text */
function parseSegments(text: string): Segment[] {
    const segments: Segment[] = [];
    let remaining = text;

    // Regex patterns (order matters: block patterns before inline)
    // Code block:  ```lang\ncode\n```
    const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/;
    // Inline code: `code`
    const inlineCodeRe = /`([^`\n]+)`/;
    // Block math:  $$tex$$
    const blockMathRe = /\$\$([\s\S]*?)\$\$/;
    // Inline math: $tex$ (not preceded/followed by $, not empty)
    const inlineMathRe = /(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/;

    while (remaining.length > 0) {
        // Find the earliest match among all patterns
        const cbMatch = codeBlockRe.exec(remaining);
        const icMatch = inlineCodeRe.exec(remaining);
        const bmMatch = blockMathRe.exec(remaining);
        const imMatch = inlineMathRe.exec(remaining);

        type MatchInfo = { kind: Segment["type"]; match: RegExpExecArray };
        const candidates: MatchInfo[] = [];
        if (cbMatch) candidates.push({ kind: "codeblock", match: cbMatch });
        if (icMatch) candidates.push({ kind: "inlinecode", match: icMatch });
        if (bmMatch) candidates.push({ kind: "blockmath", match: bmMatch });
        if (imMatch) candidates.push({ kind: "inlinemath", match: imMatch });

        if (candidates.length === 0) {
            // No more patterns, rest is plain text
            if (remaining) segments.push({ type: "text", text: remaining });
            break;
        }

        // Pick the earliest match (leftmost)
        candidates.sort((a, b) => a.match.index! - b.match.index!);
        const winner = candidates[0];
        const idx = winner.match.index!;

        // Push text before the match
        if (idx > 0) {
            segments.push({ type: "text", text: remaining.slice(0, idx) });
        }

        // Push the matched segment
        switch (winner.kind) {
            case "codeblock":
                segments.push({ type: "codeblock", lang: winner.match[1] || "", code: winner.match[2] });
                break;
            case "inlinecode":
                segments.push({ type: "inlinecode", code: winner.match[1] });
                break;
            case "blockmath":
                segments.push({ type: "blockmath", tex: winner.match[1].trim() });
                break;
            case "inlinemath":
                segments.push({ type: "inlinemath", tex: winner.match[1].trim() });
                break;
        }

        // Advance past the match
        remaining = remaining.slice(idx + winner.match[0].length);
    }

    return segments;
}

/** Copy-to-clipboard helper for code blocks */
function CodeBlockCopyBtn({ code }: { code: string }) {
    const [copied, setCopied] = React.useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
    };
    return (
        <button onClick={handleCopy} className="text-[11px] text-slate-400 hover:text-white transition-colors">
            {copied ? "✅ 복사됨" : "📋 복사"}
        </button>
    );
}

/** Render a plain-text segment with URL auto-linking and @mentions */
function renderPlainSegment(text: string, key: string | number): React.ReactNode {
    if (!text) return null;

    // Split text by URLs first
    const urlParts = text.split(URL_REGEX);
    if (urlParts.length === 1) {
        // No URLs found, just render with mentions
        const result = renderWithMentions(text);
        if (typeof result === "string") return result;
        return <span key={key}>{result}</span>;
    }

    return (
        <span key={key}>
            {urlParts.map((part, i) => {
                if (URL_REGEX.test(part)) {
                    URL_REGEX.lastIndex = 0;
                    return (
                        <a
                            key={`url-${i}`}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline break-all"
                            onClick={e => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    );
                }
                const mentioned = renderWithMentions(part);
                if (typeof mentioned === "string") return mentioned;
                return <span key={`txt-${i}`}>{mentioned}</span>;
            })}
        </span>
    );
}

/** Render KaTeX math safely (returns HTML string) */
function renderKatex(tex: string, displayMode: boolean): string {
    try {
        return katex.renderToString(tex, { displayMode, throwOnError: false });
    } catch {
        return tex;
    }
}

/**
 * Comprehensive chat message renderer.
 * Processes code blocks, inline code, block math, inline math, URLs, and @mentions.
 * Use this function for ALL chat message text rendering.
 */
export function renderChatMessage(text: string): React.ReactNode {
    if (!text) return null;

    const segments = parseSegments(text);

    // If there's only one text segment, fall back to renderMessageText for simple cases
    if (segments.length === 1 && segments[0].type === "text") {
        return renderMessageText(segments[0].text);
    }

    return (
        <>
            {segments.map((seg, i) => {
                switch (seg.type) {
                    case "codeblock":
                        return (
                            <div key={`cb-${i}`} className="bg-slate-800 text-slate-100 rounded-lg p-3 my-1.5 font-mono text-[13px] overflow-x-auto">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] text-slate-400">{seg.lang || "code"}</span>
                                    <CodeBlockCopyBtn code={seg.code} />
                                </div>
                                <pre className="whitespace-pre overflow-x-auto"><code>{seg.code}</code></pre>
                            </div>
                        );
                    case "inlinecode":
                        return (
                            <code key={`ic-${i}`} className="bg-slate-100 text-red-600 px-1 py-0.5 rounded text-[13px] font-mono">
                                {seg.code}
                            </code>
                        );
                    case "blockmath":
                        return (
                            <div
                                key={`bm-${i}`}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-1.5 text-center overflow-x-auto"
                                dangerouslySetInnerHTML={{ __html: renderKatex(seg.tex, true) }}
                            />
                        );
                    case "inlinemath":
                        return (
                            <span
                                key={`im-${i}`}
                                className="inline-block"
                                dangerouslySetInnerHTML={{ __html: renderKatex(seg.tex, false) }}
                            />
                        );
                    case "text":
                        return renderPlainSegment(seg.text, `t-${i}`);
                    default:
                        return null;
                }
            })}
        </>
    );
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
    const tk = typeof window !== "undefined" ? localStorage.getItem("mftel-auth-token") || "" : "";
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
