"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Panneau Commentaires & Collaboration
// components/comments/CommentsPanel.tsx
//
// Intégration dans lecture/page.tsx :
//   <CommentsPanel granuleId={currentGranule.id} courseId={id as string} compact />
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
    MessageSquare,
    Loader2,
    AlertCircle,
    SlidersHorizontal,
    RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useComments } from "@/hooks/useComments";
import CommentForm from "./CommentForm";
import CommentCard from "./CommentCard";
import type { CommentType } from "@/types/comments.types";

// ── Filtres disponibles ───────────────────────
const TYPE_FILTERS: { value: CommentType | "all"; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "question", label: "Questions" },
    { value: "suggestion", label: "Suggestions" },
    { value: "correction", label: "Corrections" },
    { value: "comment", label: "Commentaires" },
];

interface Props {
    granuleId: string;
    courseId: string;
    /** Mode compact : panneau latéral dans lecture/page.tsx */
    compact?: boolean;
}

export default function CommentsPanel({
    granuleId,
    courseId,
    compact = false,
}: Props) {
    const { user } = useAuth();
    const {
        comments,
        total,
        isLoading,
        isSubmitting,
        error,
        sort,
        setSort,
        typeFilter,
        setTypeFilter,
        postComment,
        vote,
        reply,
        moderate,
        deleteComment,
        reload,
    } = useComments(granuleId, courseId);

    const [showForm, setShowForm] = useState(false);

    // Nombre de suggestions/corrections en attente (pour l'enseignant)
    const pendingCount = comments.filter(
        (c) =>
            (c.type === "suggestion" || c.type === "correction") &&
            c.status === "pending"
    ).length;

    return (
        <div className={`flex flex-col ${compact ? "h-full" : "space-y-5"}`}>

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                        Discussions
                    </h3>
                    {total > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {total}
                        </span>
                    )}
                    {pendingCount > 0 && user?.role === "enseignant" && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                            {pendingCount} en attente
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={reload}
                        disabled={isLoading}
                        title="Actualiser"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                        />
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${showForm
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                            }`}
                    >
                        {showForm ? "Annuler" : "+ Commenter"}
                    </button>
                </div>
            </div>

            {/* ── Formulaire ── */}
            {showForm && (
                <div className="bg-muted/30 border border-border rounded-xl p-4 flex-shrink-0">
                    <CommentForm
                        onSubmit={async (type, content) => {
                            const ok = await postComment(type, content);
                            if (ok) setShowForm(false);
                            return ok;
                        }}
                        isSubmitting={isSubmitting}
                        userRole={user?.role}
                    />
                </div>
            )}

            {/* ── Filtres & tri ── */}
            {!compact && (
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />

                    {/* Filtre par type */}
                    <div className="flex gap-1 flex-wrap">
                        {TYPE_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setTypeFilter(f.value as CommentType | "all")}
                                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${typeFilter === f.value
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Tri */}
                    <div className="flex gap-0 ml-auto border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setSort("top")}
                            className={`text-xs px-2.5 py-1 transition-colors ${sort === "top"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Top
                        </button>
                        <button
                            onClick={() => setSort("recent")}
                            className={`text-xs px-2.5 py-1 transition-colors ${sort === "recent"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Récent
                        </button>
                    </div>
                </div>
            )}

            {/* ── Chargement ── */}
            {isLoading && (
                <div className="flex items-center justify-center py-8 flex-shrink-0">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {/* ── Erreur ── */}
            {error && !isLoading && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex-shrink-0">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* ── Liste des commentaires ── */}
            {!isLoading && !error && (
                <div
                    className={`space-y-3 ${compact ? "overflow-y-auto flex-1 pr-0.5" : ""}`}
                >
                    {comments.length === 0 ? (
                        /* État vide */
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-foreground">
                                Aucune discussion
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                Soyez le premier à commenter cette notion, poser une question
                                ou suggérer une amélioration.
                            </p>
                            {!showForm && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="mt-3 text-xs text-primary hover:underline font-medium"
                                >
                                    + Démarrer la discussion
                                </button>
                            )}
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <CommentCard
                                key={comment.id}
                                comment={comment}
                                currentUserId={user?.id}
                                currentUserRole={user?.role}
                                onVote={vote}
                                onReply={reply}
                                onModerate={moderate}
                                onDelete={deleteComment}
                                isSubmitting={isSubmitting}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}