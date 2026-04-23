"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Formulaire Commentaire / Suggestion
// components/comments/CommentForm.tsx
// ─────────────────────────────────────────────

import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import type { CommentType } from "@/types/comments.types";

interface TypeOption {
    value: CommentType;
    label: string;
    icon: string;
    placeholder: string;
}

const TYPE_OPTIONS: TypeOption[] = [
    {
        value: "comment",
        label: "Commentaire",
        icon: "💬",
        placeholder: "Partagez votre avis sur cette notion…",
    },
    {
        value: "question",
        label: "Question",
        icon: "❓",
        placeholder: "Posez votre question sur ce contenu…",
    },
    {
        value: "suggestion",
        label: "Suggestion",
        icon: "💡",
        placeholder: "Suggérez une amélioration ou un ajout au cours…",
    },
    {
        value: "correction",
        label: "Correction",
        icon: "✏️",
        placeholder: "Signalez une erreur précise dans le contenu…",
    },
];

interface Props {
    onSubmit: (type: CommentType, content: string) => Promise<boolean>;
    isSubmitting: boolean;
    userRole?: string;
}

export default function CommentForm({ onSubmit, isSubmitting, userRole }: Props) {
    const [type, setType] = useState<CommentType>("comment");
    const [content, setContent] = useState("");
    const [localError, setLocalError] = useState("");

    const currentOption = TYPE_OPTIONS.find((t) => t.value === type)!;
    const remaining = 1000 - content.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");
        if (content.trim().length < 10) {
            setLocalError("Le commentaire doit faire au moins 10 caractères.");
            return;
        }
        const ok = await onSubmit(type, content.trim());
        if (ok) setContent("");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Sélecteur de type */}
            <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-all ${type === opt.value
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                            }`}
                    >
                        <span className="text-[13px]">{opt.icon}</span>
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Textarea */}
            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={currentOption.placeholder}
                    rows={3}
                    maxLength={1000}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 leading-relaxed"
                />
                <span
                    className={`absolute bottom-2.5 right-3 text-[11px] ${remaining < 50 ? "text-destructive" : "text-muted-foreground"
                        }`}
                >
                    {remaining}
                </span>
            </div>

            {/* Info contextuelle pour suggestion/correction */}
            {(type === "suggestion" || type === "correction") && (
                <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                    {type === "suggestion"
                        ? "💡 Votre suggestion sera soumise à l'enseignant pour validation avant publication."
                        : "✏️ Les corrections signalées seront examinées par l'enseignant. Soyez précis."}
                </p>
            )}

            {/* Erreur locale */}
            {localError && (
                <p className="text-xs text-destructive">{localError}</p>
            )}

            {/* Bouton soumettre */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting || content.trim().length < 10}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Envoi…
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Publier
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}