"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Hook Commentaires & Notifications
// hooks/useComments.ts
// ─────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { Comment, CommentType } from "@/types/comments.types";

// ── Helpers auth ─────────────────────────────
function getToken(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("access_token") ?? "";
}

function authHeaders(): Record<string, string> {
    const token = getToken();
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

function isUuidLike(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function buildAuthor(user: any) {
    if (!user) {
        return { id: "anon", display_name: "Anonyme", role: "etudiant", initials: "AN" };
    }
    const first = user.prenom ?? "";
    const last = user.nom ?? "";
    const lastInitial = last ? `${last[0].toUpperCase()}.` : "";
    return {
        id: user.id ?? "current",
        display_name: `${first} ${lastInitial}`.trim() || "Utilisateur",
        role: user.role ?? "etudiant",
        initials: `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?",
    };
}

// ── Hook principal commentaires ───────────────
export function useComments(granuleId: string, courseId: string) {
    const { user } = useAuth();

    const [comments, setComments] = useState<Comment[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<"top" | "recent">("top");
    const [typeFilter, setTypeFilter] = useState<CommentType | "all">("all");
    const isPersistedGranule = isUuidLike(granuleId);

    // Charger les commentaires
    const load = useCallback(async () => {
        if (!granuleId) return;
        if (!isPersistedGranule) {
            // Granule synthétique (format XCCM) : pas de persistance commentaires côté backend.
            setComments([]);
            setTotal(0);
            setError("Commentaires indisponibles pour ce granule (ID non persisté).");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ granule_id: granuleId, sort });
            if (courseId) params.set("course_id", courseId);
            if (typeFilter !== "all") params.set("type", typeFilter);

            const res = await fetch(`/api/comments?${params}`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            setComments(data.comments ?? []);
            setTotal(data.total ?? 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur de chargement");
        } finally {
            setIsLoading(false);
        }
    }, [granuleId, courseId, sort, typeFilter, isPersistedGranule]);

    useEffect(() => {
        load();
    }, [load]);

    // Poster un commentaire
    const postComment = useCallback(
        async (type: CommentType, content: string): Promise<boolean> => {
            if (!isPersistedGranule) {
                setError("Impossible de commenter ce granule tant qu'il n'a pas d'identifiant valide.");
                return false;
            }
            setIsSubmitting(true);
            setError(null);
            try {
                const res = await fetch("/api/comments", {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        granule_id: granuleId,
                        course_id: courseId,
                        type,
                        content,
                        author: buildAuthor(user),
                    }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error ?? "Erreur lors de la publication");
                }
                const data = await res.json();
                setComments((prev) => [data.comment, ...prev]);
                setTotal((t) => t + 1);
                return true;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue");
                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [granuleId, courseId, user, isPersistedGranule]
    );

    // Voter sur un commentaire
    const vote = useCallback(
        async (commentId: string, voteType: "up" | "down" | null) => {
            try {
                const res = await fetch(`/api/comments/${commentId}/vote`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({ vote: voteType }),
                });
                if (!res.ok) return;
                const data = await res.json();
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === commentId
                            ? {
                                ...c,
                                upvotes: data.upvotes,
                                downvotes: data.downvotes,
                                user_vote: data.user_vote,
                            }
                            : c
                    )
                );
            } catch {
                // silencieux
            }
        },
        []
    );

    // Répondre à un commentaire
    const reply = useCallback(
        async (commentId: string, content: string): Promise<boolean> => {
            setIsSubmitting(true);
            try {
                const res = await fetch(`/api/comments/${commentId}/replies`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({ content, author: buildAuthor(user) }),
                });
                if (!res.ok) throw new Error("Erreur lors de la réponse");
                const data = await res.json();
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === commentId
                            ? {
                                ...c,
                                replies: [...c.replies, data.reply],
                                replies_count: c.replies_count + 1,
                            }
                            : c
                    )
                );
                return true;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue");
                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [user]
    );

    // Modérer un commentaire (enseignant/admin)
    const moderate = useCallback(
        async (commentId: string, update: Record<string, unknown>) => {
            try {
                const res = await fetch(`/api/comments/${commentId}`, {
                    method: "PATCH",
                    headers: authHeaders(),
                    body: JSON.stringify(update),
                });
                if (!res.ok) return;
                setComments((prev) =>
                    prev.map((c) => (c.id === commentId ? { ...c, ...update } : c))
                );
            } catch {
                // silencieux
            }
        },
        []
    );

    // Supprimer un commentaire
    const deleteComment = useCallback(async (commentId: string) => {
        try {
            await fetch(`/api/comments/${commentId}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setTotal((t) => Math.max(0, t - 1));
        } catch {
            // silencieux
        }
    }, []);

    return {
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
        reload: load,
    };
}

