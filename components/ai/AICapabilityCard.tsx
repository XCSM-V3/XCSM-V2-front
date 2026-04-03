"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Carte action rapide
// components/ai/AICapabilityCard.tsx
// ─────────────────────────────────────────────

import React from "react";
import type { AICapability } from "@/types/ai.types";

interface Props {
  capability: AICapability;
  onClick: () => void;
  disabled?: boolean;
}

export default function AICapabilityCard({ capability, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="
        flex flex-col items-start gap-2 p-3.5 w-full text-left
        bg-muted border border-border rounded-xl
        transition-all duration-150
        hover:bg-primary/5 hover:border-primary hover:-translate-y-px
        active:translate-y-0
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-muted
        disabled:hover:border-border disabled:hover:translate-y-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
      "
    >
      <span className="text-xl leading-none">{capability.icon}</span>
      <span className="text-[13px] font-medium text-primary leading-tight">
        {capability.label}
      </span>
    </button>
  );
}