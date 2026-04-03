"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Bulle de message avec Markdown
// components/ai/AIMessage.tsx
// ─────────────────────────────────────────────

import React from "react";
import type { ChatMessage } from "@/types/ai.types";

// ── Markdown léger (sans lib externe) ────────
function md(raw: string): string {
  return raw
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="ai-code-block" data-lang="${lang || ""}"><code>${esc(code.trim())}</code></pre>`
    )
    .replace(/`([^`\n]+)`/g, '<code class="ai-code-inline">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/^### (.+)$/gm,   '<h3 class="ai-h3">$1</h3>')
    .replace(/^## (.+)$/gm,    '<h2 class="ai-h2">$1</h2>')
    .replace(/^# (.+)$/gm,     '<h1 class="ai-h1">$1</h1>')
    .replace(/^[\-\*] (.+)$/gm,'<li class="ai-li">$1</li>')
    .replace(/(<li[\s\S]+?<\/li>\n?)+/g, (m) => `<ul class="ai-ul">${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li class="ai-ol-li">$1</li>')
    .replace(/(<li class="ai-ol[\s\S]+?<\/li>\n?)+/g, (m) => `<ol class="ai-ol">${m}</ol>`)
    .replace(/^---$/gm,        '<hr class="ai-hr" />')
    .replace(/\n\n/g,          '</p><p class="ai-p">')
    .replace(/^(.)/m,          '<p class="ai-p">$1')
    .replace(/$/,               "</p>");
}
function esc(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

interface Props { message: ChatMessage }

export default function AIMessage({ message }: Props) {
  const isUser = message.role === "user";
  const time   = new Date(message.timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={`flex gap-2 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar modèle */}
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      {/* Bulle + timestamp */}
      <div className={`flex flex-col gap-1 max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={
            isUser
              ? "px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm leading-relaxed"
              : "px-4 py-2.5 rounded-2xl rounded-bl-sm bg-muted border border-border text-foreground text-sm leading-relaxed"
          }
        >
          {isUser ? (
            <p className="m-0 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <div
                className="ai-md-content"
                dangerouslySetInnerHTML={{ __html: md(message.content) }}
              />
              {message.isStreaming && (
                <span className="inline-block w-0.5 h-3.5 bg-primary align-middle ml-0.5 animate-pulse rounded-sm" />
              )}
            </>
          )}
        </div>

        {!message.isStreaming && (
          <span className="text-[11px] text-muted-foreground px-0.5">{time}</span>
        )}
      </div>
    </div>
  );
}