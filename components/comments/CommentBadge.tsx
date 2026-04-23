"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Badges Type et Status Commentaire
// components/comments/CommentBadge.tsx
// ─────────────────────────────────────────────

import React from "react";
import type { CommentType, CommentStatus } from "@/types/comments.types";

// ── Config par type ───────────────────────────
const TYPE_CONFIG: Record<
    CommentType,
    { label: string; icon: string; className: string }
> = {
    comment: {
        label: "Commentaire",
        icon: "💬",
        className:
            "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    question: {
        label: "Question",
        icon: "❓",
        className:
            "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    },
    suggestion: {
        label: "Suggestion",
        icon: "💡",
        className:
            "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    },
    correction: {
        label: "Correction",
        icon: "✏️",
        className:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    },
};

// ── Config par status ─────────────────────────
const STATUS_CONFIG: Record<
    CommentStatus,
    { label: string; className: string }
> = {
    pending: {
        label: "En attente",
        className:
            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
    approved: {
        label: "Approuvé",
        className:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    rejected: {
        label: "Rejeté",
        className:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    implemented: {
        label: "Intégré ✓",
        className: "bg-primary/10 text-primary",
    },
};

// ── Composant TypeBadge ───────────────────────
export function TypeBadge({ type }: { type: CommentType }) {
    const cfg = TYPE_CONFIG[type];
    return (
        <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}
        >
            <span className="text-[12px]">{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

// ── Composant StatusBadge ─────────────────────
export function StatusBadge({ status }: { status: CommentStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}
        >
            {cfg.label}
        </span>
    );
}