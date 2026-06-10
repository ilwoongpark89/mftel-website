"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TiptapImage from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import { useCallback, useEffect, useRef, useState } from "react";
import { uploadFile } from "../../lib/utils";
import "./editor.css";

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeContent(c?: string): string {
  if (!c) return "";
  if (/<[a-z][\s\S]*>/i.test(c)) return c;
  return c.split("\n").map(l => `<p>${l || "<br>"}</p>`).join("");
}

// ─── Slash command items ────────────────────────────────────────────────────

interface SlashItem {
  title: string;
  desc: string;
  icon: string;
  cat: string;
  action: (editor: ReturnType<typeof useEditor>) => void;
}

const SLASH_ITEMS: SlashItem[] = [
  { cat: "텍스트", title: "텍스트", desc: "일반 텍스트 블록", icon: "Aa",
    action: e => e?.chain().focus().setParagraph().run() },
  { cat: "제목", title: "제목 1", desc: "큰 제목", icon: "H1",
    action: e => e?.chain().focus().toggleHeading({ level: 1 }).run() },
  { cat: "제목", title: "제목 2", desc: "중간 제목", icon: "H2",
    action: e => e?.chain().focus().toggleHeading({ level: 2 }).run() },
  { cat: "제목", title: "제목 3", desc: "작은 제목", icon: "H3",
    action: e => e?.chain().focus().toggleHeading({ level: 3 }).run() },
  { cat: "리스트", title: "글머리 기호", desc: "순서 없는 목록", icon: "•",
    action: e => e?.chain().focus().toggleBulletList().run() },
  { cat: "리스트", title: "번호 목록", desc: "순서 있는 목록", icon: "1.",
    action: e => e?.chain().focus().toggleOrderedList().run() },
  { cat: "리스트", title: "체크리스트", desc: "할 일 목록", icon: "☑",
    action: e => e?.chain().focus().toggleTaskList().run() },
  { cat: "블록", title: "인용", desc: "인용문 블록", icon: "❝",
    action: e => e?.chain().focus().toggleBlockquote().run() },
  { cat: "블록", title: "코드 블록", desc: "코드 블록", icon: "<>",
    action: e => e?.chain().focus().toggleCodeBlock().run() },
  { cat: "블록", title: "구분선", desc: "가로 구분선", icon: "—",
    action: e => e?.chain().focus().setHorizontalRule().run() },
];

// ─── Props ──────────────────────────────────────────────────────────────────

interface RichEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RichEditor({ content, onChange, placeholder = "내용을 입력하세요...", minHeight = 120, compact }: RichEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIdx, setSlashIdx] = useState(0);
  const slashStartRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = slashFilter
    ? SLASH_ITEMS.filter(i => i.title.includes(slashFilter) || i.cat.includes(slashFilter) || i.desc.includes(slashFilter))
    : SLASH_ITEMS;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Typography,
      TiptapImage.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
    ],
    content: normalizeContent(content),
    onUpdate({ editor: ed }) {
      onChangeRef.current?.(ed.getHTML());
    },
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return true;
            uploadFile(file).then(url => {
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: url })
                )
              );
            }).catch(err => console.error("Image upload failed:", err));
            return true;
          }
        }
        return false;
      },
      handleKeyDown(view, event) {
        if (compact) return false;

        // Slash command trigger
        if (event.key === "/" && !slashStartRef.current) {
          const { from } = view.state.selection;
          const textBefore = view.state.doc.textBetween(Math.max(0, from - 1), from);
          // Only trigger at beginning of line or after whitespace
          if (from <= 1 || /\s/.test(textBefore) || textBefore === "") {
            setTimeout(() => {
              const coords = view.coordsAtPos(from);
              const editorRect = view.dom.closest(".rich-editor-wrap")?.getBoundingClientRect();
              if (editorRect) {
                setSlashPos({
                  top: coords.bottom - editorRect.top + 4,
                  left: coords.left - editorRect.left,
                });
              }
              slashStartRef.current = from;
              setSlashFilter("");
              setSlashIdx(0);
              setSlashOpen(true);
            }, 0);
          }
          return false;
        }

        if (slashStartRef.current !== null) {
          if (event.key === "Escape") {
            closeSlash();
            return true;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashIdx(i => (i + 1) % Math.max(filteredItems.length, 1));
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashIdx(i => (i - 1 + Math.max(filteredItems.length, 1)) % Math.max(filteredItems.length, 1));
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            selectSlashItem(filteredItems[slashIdx]);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Track typing after slash
  useEffect(() => {
    if (!editor || !slashOpen || slashStartRef.current === null) return;
    const handler = () => {
      const { from } = editor.state.selection;
      const start = slashStartRef.current!;
      if (from <= start) {
        closeSlash();
        return;
      }
      const text = editor.state.doc.textBetween(start + 1, from);
      if (text.includes(" ") || text.length > 20) {
        closeSlash();
        return;
      }
      setSlashFilter(text);
      setSlashIdx(0);
    };
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("update", handler);
    };
  }, [editor, slashOpen]);

  const closeSlash = useCallback(() => {
    setSlashOpen(false);
    slashStartRef.current = null;
    setSlashFilter("");
    setSlashIdx(0);
  }, []);

  const selectSlashItem = useCallback((item?: SlashItem) => {
    if (!item || !editor) { closeSlash(); return; }
    // Delete the slash + filter text
    const start = slashStartRef.current!;
    const { from } = editor.state.selection;
    editor.chain().focus().deleteRange({ from: start, to: from }).run();
    item.action(editor);
    closeSlash();
  }, [editor, closeSlash]);

  // Close slash menu on outside click
  useEffect(() => {
    if (!slashOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeSlash();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [slashOpen, closeSlash]);

  // Link prompt
  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("링크 URL", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const BtnClass = (active: boolean) =>
    `w-7 h-7 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
      active ? "text-blue-600 bg-blue-50/80" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
    }`;

  return (
    <div className="rich-editor-wrap relative">
      {/* Bubble Menu */}
      <BubbleMenu
        editor={editor}
        options={{ placement: "top" }}
        className="bubble-menu-anim flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-white/95 backdrop-blur shadow-lg border border-slate-200/80 z-50"
      >
        {/* Format group */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={BtnClass(editor.isActive("bold"))} title="Bold"><b>B</b></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={BtnClass(editor.isActive("italic"))} title="Italic"><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={BtnClass(editor.isActive("strike"))} title="Strikethrough"><s>S</s></button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={BtnClass(editor.isActive("code"))} title="Code"><span className="text-[11px] font-mono">&lt;/&gt;</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={BtnClass(editor.isActive("underline"))} title="Underline"><u>U</u></button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        {/* Heading group */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={BtnClass(editor.isActive("heading", { level: 1 }))} title="H1"><span className="text-[11px] font-bold">H1</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={BtnClass(editor.isActive("heading", { level: 2 }))} title="H2"><span className="text-[11px] font-bold">H2</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={BtnClass(editor.isActive("heading", { level: 3 }))} title="H3"><span className="text-[11px] font-bold">H3</span></button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        {/* Link */}
        <button type="button" onClick={setLink} className={BtnClass(editor.isActive("link"))} title="Link">🔗</button>
      </BubbleMenu>

      {/* Editor area */}
      <div
        className="border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-300 transition-shadow"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} className="rich-editor-content" />
      </div>

      {/* Slash Command Menu */}
      {slashOpen && filteredItems.length > 0 && (
        <div
          ref={menuRef}
          className="slash-menu-anim absolute z-50 w-[280px] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 max-h-[320px] overflow-y-auto"
          style={{ top: slashPos.top, left: slashPos.left }}
        >
          {(() => {
            let lastCat = "";
            return filteredItems.map((item, idx) => {
              const showCat = item.cat !== lastCat;
              lastCat = item.cat;
              return (
                <div key={item.title}>
                  {showCat && (
                    <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.cat}
                    </div>
                  )}
                  <button
                    type="button"
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${
                      idx === slashIdx ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                    onMouseEnter={() => setSlashIdx(idx)}
                    onMouseDown={e => { e.preventDefault(); selectSlashItem(item); }}
                  >
                    <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[13px] font-mono shrink-0">
                      {item.icon}
                    </span>
                    <span>
                      <span className="text-[13px] font-medium block leading-tight">{item.title}</span>
                      <span className="text-[11px] text-slate-400 block leading-tight">{item.desc}</span>
                    </span>
                  </button>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
