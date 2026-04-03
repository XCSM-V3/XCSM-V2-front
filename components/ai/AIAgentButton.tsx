"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Bouton FAB + variante inline
// components/ai/AIAgentButton.tsx
// ─────────────────────────────────────────────

import React from "react";
import { useAIAgent } from "@/contexts/AIAgentContext";

interface Props {
  variant?: "fab" | "inline";
  label?: string;
  className?: string;
}

export default function AIAgentButton({
  variant = "fab",
  label = "Assistant IA",
  className = "",
}: Props) {
  const { openAgent, state } = useAIAgent();
  const { isOpen, messages } = state;
  const hasHistory = messages.length > 0;

  if (isOpen && variant === "fab") return null;

  /* ── Variante inline (dans une page) ── */
  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={openAgent}
        className={`
          inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg
          bg-primary/10 text-primary border border-primary/30
          text-sm font-medium
          hover:bg-primary hover:text-primary-foreground hover:border-primary
          transition-all
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${className}
        `}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {label}
      </button>
    );
  }

  /* ── FAB flottant ── */
  return (
    <div className="fixed bottom-6 right-6 z-[9000]">
      <button
        type="button"
        onClick={openAgent}
        aria-label="Ouvrir l'assistant pédagogique XCSM"
        className="
          relative flex items-center gap-2.5 px-5 py-3.5
          bg-primary text-primary-foreground rounded-full
          text-sm font-medium shadow-lg shadow-primary/30
          hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 hover:opacity-95
          active:translate-y-0 active:scale-95
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          animate-in fade-in zoom-in-90 duration-300
        "
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="hidden sm:inline">{label}</span>

        {/* Point indicateur si historique existant */}
        {hasHistory && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background"
          />
        )}
      </button>
    </div>
  );
}