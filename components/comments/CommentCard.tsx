"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Carte Commentaire (vote, thread, modération)
// components/comments/CommentCard.tsx
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Pin,
    CheckCircle,
    Trash2,
    ChevronDown,
    ChevronUp,
    Send,
    Loader2,
    Shield,
} from "lucide-react";
import { TypeBadge, StatusBadge } from "./CommentBadge";
import type { Comment } from "@/types/comments.types";

// ── Helper date ───────────────────────────────
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
}

interface Props {
    comment: Comment;
    currentUserId?: string;
    currentUserRole?: string;
    onVote: (id: string, vote: "up" | "down" | null) => void;
    onReply: (id: string, content: string) => Promise<boolean>;
    onModerate: (id: string, update: Record<string, unknown>) => void;
    onDelete: (id: string) => void;
    isSubmitting: boolean;
}

export default function CommentCard({
    comment,
    currentUserId,
    currentUserRole,
    onVote,
    onReply,
    onModerate,
    onDelete,
    isSubmitting,
}: Props) {
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    const isModerator =
        currentUserRole === "enseignant" || currentUserRole === "admin";
    const isAuthor = comment.author.id === currentUserId;
    const showActions = isModerator || isAuthor;

    const handleVote = (v: "up" | "down") => {
        const newVote = comment.user_vote === v ? null : v;
        onVote(comment.id, newVote);
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || replyContent.trim().length < 5) return;
        setIsReplying(true);
        const ok = await onReply(comment.id, replyContent.trim());
        if (ok) {
            setReplyContent("");
            setShowReplyForm(false);
            setShowReplies(true);
        }
        setIsReplying(false);
    };

    // Couleur avatar selon rôle
    const avatarClass =
        comment.author.role === "enseignant"
            ? "bg-primary text-primary-foreground"
            : comment.author.role === "admin"
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary text-secondary-foreground";

    return (
        <div
            className={`rounded-xl border transition-colors ${comment.is_pinned
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
                }`}
        >
            {/* ── En-tête ── */}
            <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                    {/* Auteur */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarClass}`}
                        >
                            {comment.author.initials}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="text-sm font-semibold text-foreground">
                                    {comment.author.display_name}
                                </span>
                                {comment.author.role === "enseignant" && (
                                    <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                                        <Shield className="w-2.5 h-2.5" />
                                        Enseignant
                                    </span>
                                )}
                                <span className="text-muted-foreground text-[11px]">·</span>
                                <span className="text-[11px] text-muted-foreground">
                                    {timeAgo(comment.created_at)}
                                </span>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                <TypeBadge type={comment.type} />
                                {(comment.type === "suggestion" ||
                                    comment.type === "correction") && (
                                        <StatusBadge status={comment.status} />
                                    )}
                                {comment.is_pinned && (
                                    <span className="flex items-center gap-0.5 text-[11px] text-primary font-medium">
                                        <Pin className="w-3 h-3" />
                                        Épinglé
                                    </span>
                                )}
                                {comment.is_resolved && (
                                    <span className="flex items-center gap-0.5 text-[11px] text-green-600 dark:text-green-400 font-medium">
                                        <CheckCircle className="w-3 h-3" />
                                        Résolu
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions modération */}
                    {showActions && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {isModerator && (
                                <>
                                    {/* Épingler */}
                                    <button
                                        onClick={() =>
                                            onModerate(comment.id, { is_pinned: !comment.is_pinned })
                                        }
                                        title={comment.is_pinned ? "Désépingler" : "Épingler"}
                                        className={`p-1.5 rounded-lg transition-colors ${comment.is_pinned
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                            }`}
                                    >
                                        <Pin className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Résoudre */}
                                    {!comment.is_resolved && (
                                        <button
                                            onClick={() =>
                                                onModerate(comment.id, { is_resolved: true })
                                            }
                                            title="Marquer comme résolu"
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {/* Approuver / Intégrer (suggestions & corrections en attente) */}
                                    {(comment.type === "suggestion" ||
                                        comment.type === "correction") &&
                                        comment.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        onModerate(comment.id, { status: "approved" })
                                                    }
                                                    title="Approuver"
                                                    className="px-2 py-1 text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                >
                                                    ✓ Approuver
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        onModerate(comment.id, { status: "implemented" })
                                                    }
                                                    title="Marquer comme intégré"
                                                    className="px-2 py-1 text-[11px] font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                                >
                                                    ⬆ Intégrer
                                                </button>
                                            </>
                                        )}
                                </>
                            )}

                            {/* Supprimer */}
                            {(isAuthor || isModerator) && (
                                <button
                                    onClick={() => onDelete(comment.id)}
                                    title="Supprimer"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Contenu du commentaire */}
                <p className="mt-3 ml-11 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                </p>
            </div>

            {/* ── Pied : votes + répondre + voir réponses ── */}
            <div className="px-4 pb-3 flex items-center gap-4">
                {/* Votes */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleVote("up")}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${comment.user_vote === "up"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {comment.upvotes > 0 && <span>{comment.upvotes}</span>}
                    </button>
                    <button
                        onClick={() => handleVote("down")}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${comment.user_vote === "down"
                            ? "bg-destructive/10 text-destructive"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        {comment.downvotes > 0 && <span>{comment.downvotes}</span>}
                    </button>
                </div>

                {/* Répondre */}
                <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Répondre
                </button>

                {/* Voir réponses */}
                {comment.replies_count > 0 && (
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline ml-auto transition-colors"
                    >
                        {showReplies ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        {comment.replies_count} réponse
                        {comment.replies_count > 1 ? "s" : ""}
                    </button>
                )}
            </div>

            {/* ── Formulaire de réponse ── */}
            {showReplyForm && (
                <div className="px-4 pb-4 border-t border-border pt-3 bg-muted/20">
                    <form onSubmit={handleReply} className="flex gap-2">
                        <input
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Votre réponse… (min. 5 caractères)"
                            maxLength={500}
                            disabled={isReplying}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            disabled={isReplying || replyContent.trim().length < 5}
                            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                            {isReplying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* ── Liste des réponses ── */}
            {showReplies && comment.replies.length > 0 && (
                <div className="border-t border-border bg-muted/20 divide-y divide-border/50">
                    {comment.replies.map((r) => (
                        <div key={r.id} className="flex gap-3 px-4 py-3">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${r.author.role === "enseignant"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                                    }`}
                            >
                                {r.author.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs font-semibold text-foreground">
                                        {r.author.display_name}
                                    </span>
                                    {r.author.role === "enseignant" && (
                                        <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                                            <Shield className="w-2 h-2" />
                                            Enseignant
                                        </span>
                                    )}
                                    <span className="text-[11px] text-muted-foreground ml-auto">
                                        {timeAgo(r.created_at)}
                                    </span>
                                </div>
                                <p className="text-xs text-foreground/80 leading-relaxed">
                                    {r.content}
                                </p>
                                {r.upvotes > 0 && (
                                    <span className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-0.5">
                                        <ThumbsUp className="w-2.5 h-2.5" />
                                        {r.upvotes}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}