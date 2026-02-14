"use client";

import "./editor.css";

const HAS_HTML = /<[a-z][\s\S]*>/i;

export function RichViewer({ content, className }: { content?: string; className?: string }) {
  if (!content) return null;

  if (!HAS_HTML.test(content)) {
    return (
      <div className={`text-[14px] text-slate-700 whitespace-pre-wrap break-words ${className ?? ""}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`rich-viewer-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
