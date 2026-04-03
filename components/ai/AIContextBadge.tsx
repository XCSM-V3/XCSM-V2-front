"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Badge contexte pédagogique
// components/ai/AIContextBadge.tsx
// ─────────────────────────────────────────────

import React from "react";
import type { GranuleContext } from "@/types/ai.types";

const LABELS: Record<GranuleContext["level"], string> = {
  cours: "Cours", partie: "Partie", chapitre: "Chapitre",
  section: "Section", notion: "Notion",
};

export default function AIContextBadge({ context }: { context: GranuleContext }) {
  const title =
    context.notionTitle   ??
    context.sectionTitle  ??
    context.chapterTitle  ??
    context.partTitle     ??
    context.courseTitle;

  const breadcrumb = [
    context.courseTitle,
    context.partTitle,
    context.chapterTitle,
    context.sectionTitle,
    context.notionTitle,
  ].filter(Boolean).join(" › ");

  return (
    <div className="flex-shrink-0 px-4 py-2 bg-primary/5 border-b border-primary/20">
      <div className="flex items-center gap-2 flex-wrap">

        {/* icône */}
        <svg className="text-primary flex-shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* badge niveau */}
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
          {LABELS[context.level]}
        </span>
        
        {/* titre courant */}
        <span className="text-xs font-medium text-foreground truncate max-w-xs">
          {title}
        </span>
      </div>
      {/* fil d'ariane si différent du titre */}
      {breadcrumb !== title && (
        <p className="mt-0.5 ml-5 text-[11px] text-muted-foreground truncate">
          {breadcrumb}
        </p>
      )}
    </div>
  );
}