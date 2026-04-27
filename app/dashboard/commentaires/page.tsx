"use client";
// ─────────────────────────────────────────────────────────────
// XCSM V3 — Dashboard Commentaires Enseignant
// app/dashboard/commentaires/page.tsx
//
// Visible UNIQUEMENT pour role === "enseignant" | "admin"
// Agrège tous les commentaires de tous les cours de l'enseignant
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    MessageSquare, AlertTriangle, CheckCircle, Pin,
    Filter, RefreshCw, Loader2, BookOpen, Users,
    ThumbsUp, Clock, ChevronRight, Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { TypeBadge, StatusBadge } from "@/components/comments/CommentBadge";
import type { Comment } from "@/types/comments.types";

// ── Helpers ──────────────────────────────────────────────────
function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `il y a ${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
}
function getToken() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("access_token") ?? "";
}
function authH(): Record<string, string> {
    const t = getToken();
    return t
        ? { "Content-Type": "application/json", Authorization: `Bearer ${t}` }
        : { "Content-Type": "application/json" };
}

// ── Types locaux ─────────────────────────────────────────────
interface CourseWithComments {
    course_id: string;
    course_title: string;
    comments: Comment[];
    pending_count: number;
    total_count: number;
}

type FilterType = "all" | "pending" | "suggestion" | "correction" | "question";

export default function TeacherCommentsDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const [courses, setCourses] = useState<{ id: string; titre: string }[]>([]);
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("all");
    const [filter, setFilter] = useState<FilterType>("all");
    const [sort, setSort] = useState<"recent" | "top" | "pending">("pending");
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, suggestions: 0 });

    // Redirection si pas enseignant
    useEffect(() => {
        if (isAuthenticated && user?.role === "etudiant") router.push("/dashboard");
    }, [isAuthenticated, user, router]);

    // Charger les cours
    useEffect(() => {
        if (!isAuthenticated) return;
        fetch("/api/courses/my", { headers: authH() })
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : data.courses ?? data.results ?? [];
                setCourses(list.map((c: any) => ({ id: c.id, titre: c.titre ?? c.title ?? "Sans titre" })));
            })
            .catch(() => {
                // Démo : courses fictifs
                setCourses([
                    { id: "demo1", titre: "Mathématiques Avancées" },
                    { id: "demo2", titre: "Algorithmique et Structures de Données" },
                ]);
            });
    }, [isAuthenticated]);

    // Charger tous les commentaires de tous les cours de l'enseignant
    const loadComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ teacher_view: "true", sort });
            if (selectedCourse !== "all") params.set("course_id", selectedCourse);
            if (filter !== "all") params.set("type", filter === "pending" ? "" : filter);
            if (filter === "pending") params.set("status", "pending");

            const res = await fetch(`/api/comments/teacher?${params}`, { headers: authH() });
            const data = await res.json();
            const comments: Comment[] = data.comments ?? [];

            setAllComments(comments);
            setStats({
                total: comments.length,
                pending: comments.filter(c => c.status === "pending").length,
                resolved: comments.filter(c => c.is_resolved).length,
                suggestions: comments.filter(c => c.type === "suggestion" || c.type === "correction").length,
            });
        } catch {
            // Démo
            setAllComments([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCourse, filter, sort]);

    useEffect(() => { loadComments(); }, [loadComments]);

    // Actions modération
    const moderate = async (commentId: string, update: Record<string, unknown>) => {
        await fetch(`/api/comments/${commentId}`, { method: "PATCH", headers: authH(), body: JSON.stringify(update) });
        setAllComments(prev => prev.map(c => c.id === commentId ? { ...c, ...update } as Comment : c));
    };

    const deleteComment = async (commentId: string) => {
        await fetch(`/api/comments/${commentId}`, { method: "DELETE", headers: authH() });
        setAllComments(prev => prev.filter(c => c.id !== commentId));
    };

    // Filtrage affiché
    const displayed = allComments
        .filter(c => filter === "pending" ? c.status === "pending" : filter === "all" ? true : c.type === filter)
        .sort((a, b) => {
            if (sort === "top") return b.upvotes - a.upvotes;
            if (sort === "pending") return (b.status === "pending" ? 1 : 0) - (a.status === "pending" ? 1 : 0);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const FILTERS: { value: FilterType; label: string; count?: number }[] = [
        { value: "all", label: "Tous", count: stats.total },
        { value: "pending", label: "En attente", count: stats.pending },
        { value: "suggestion", label: "Suggestions", count: stats.suggestions },
        { value: "correction", label: "Corrections" },
        { value: "question", label: "Questions" },
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">

            {/* ── En-tête ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Commentaires & Collaboration
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Gérez les annotations, suggestions et questions de vos étudiants
                    </p>
                </div>
                <button
                    onClick={loadComments}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    Actualiser
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Total commentaires", value: stats.total, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
                    { label: "En attente", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
                    { label: "Résolus", value: stats.resolved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
                    { label: "Suggestions", value: stats.suggestions, icon: AlertTriangle, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground">{value}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filtres ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Sélecteur cours */}
                <select
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="text-sm px-3 py-1.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">Tous les cours</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                </select>

                {/* Filtre type */}
                <div className="flex gap-1 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full transition-colors ${filter === f.value
                                ? "bg-primary text-primary-foreground font-medium"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {f.label}
                            {f.count !== undefined && f.count > 0 && (
                                <span className={`text-[10px] px-1 rounded-full font-bold ${filter === f.value ? "bg-white/20" : "bg-muted-foreground/20"
                                    }`}>{f.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tri */}
                <div className="flex border border-border rounded-lg overflow-hidden ml-auto">
                    {(["pending", "recent", "top"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setSort(s)}
                            className={`text-xs px-2.5 py-1.5 transition-colors ${sort === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            {s === "pending" ? "En attente" : s === "recent" ? "Récent" : "Top"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Liste commentaires ── */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-foreground">Aucun commentaire</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {filter === "pending" ? "Aucune suggestion en attente — bien joué !" : "Aucun commentaire pour ce filtre."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayed.map(comment => (
                        <TeacherCommentRow
                            key={comment.id}
                            comment={comment}
                            onModerate={moderate}
                            onDelete={deleteComment}
                            onNavigate={(courseId, granuleId) =>
                                router.push(`/cours/${courseId}/lecture?granule=${granuleId}`)
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Composant ligne de commentaire pour l'enseignant ─────────
function TeacherCommentRow({
    comment, onModerate, onDelete, onNavigate,
}: {
    comment: Comment;
    onModerate: (id: string, update: Record<string, unknown>) => void;
    onDelete: (id: string) => void;
    onNavigate: (courseId: string, granuleId: string) => void;
}) {
    const isStudentComment = comment.author.role === "etudiant";
    const isPeerSuggestion = comment.author.role === "enseignant";
    const needsAction = (comment.type === "suggestion" || comment.type === "correction") && comment.status === "pending";

    return (
        <div className={`bg-card border rounded-xl p-4 transition-colors ${needsAction ? "border-amber-300 dark:border-amber-700" : "border-border"
            }`}>
            <div className="flex items-start gap-3">

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isPeerSuggestion
                    ? "bg-blue-600 text-white"         // Autre enseignant → bleu
                    : "bg-primary text-primary-foreground" // Étudiant → vert
                    }`}>
                    {comment.author.initials}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Ligne auteur */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-foreground">
                            {comment.author.display_name}
                        </span>

                        {/* ── Badge rôle auteur (distinction étudiant / collègue enseignant) ── */}
                        {isPeerSuggestion ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                <Users className="w-2.5 h-2.5" />
                                Collègue enseignant
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <BookOpen className="w-2.5 h-2.5" />
                                Étudiant
                            </span>
                        )}

                        <TypeBadge type={comment.type} />
                        {(comment.type === "suggestion" || comment.type === "correction") && (
                            <StatusBadge status={comment.status} />
                        )}
                        {comment.is_pinned && (
                            <span className="text-[11px] text-primary font-medium flex items-center gap-0.5">
                                <Pin className="w-3 h-3" />Épinglé
                            </span>
                        )}

                        {/* Granule source */}
                        {comment.granule_title && (
                            <span className="text-[11px] text-muted-foreground ml-auto">
                                📄 {comment.granule_title}
                            </span>
                        )}
                    </div>

                    {/* Contenu */}
                    <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                        {comment.content}
                    </p>

                    {/* Méta + réponses */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                        <span>{timeAgo(comment.created_at)}</span>
                        <span className="flex items-center gap-0.5">
                            <ThumbsUp className="w-3 h-3" />{comment.upvotes}
                        </span>
                        {comment.replies_count > 0 && (
                            <span className="flex items-center gap-0.5">
                                <MessageSquare className="w-3 h-3" />{comment.replies_count} réponse{comment.replies_count > 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* ── Actions enseignant ── */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* Aller voir dans le cours */}
                        <button
                            onClick={() => onNavigate(comment.course_id, comment.granule_id ?? "")}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-muted border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                        >
                            <ChevronRight className="w-3 h-3" />
                            Voir dans le cours
                        </button>

                        {/* Approuver */}
                        {needsAction && (
                            <>
                                <button
                                    onClick={() => onModerate(comment.id, { status: "approved" })}
                                    className="text-xs px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                                >
                                    ✓ Approuver
                                </button>
                                <button
                                    onClick={() => onModerate(comment.id, { status: "implemented" })}
                                    className="text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors font-medium"
                                >
                                    ⬆ Intégrer
                                </button>
                                <button
                                    onClick={() => onModerate(comment.id, { status: "rejected" })}
                                    className="text-xs px-2.5 py-1 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/20 transition-colors"
                                >
                                    ✗ Rejeter
                                </button>
                            </>
                        )}

                        {/* Épingler */}
                        <button
                            onClick={() => onModerate(comment.id, { is_pinned: !comment.is_pinned })}
                            className={`text-xs px-2.5 py-1 border rounded-lg transition-colors ${comment.is_pinned
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-muted text-muted-foreground border-border hover:text-foreground"
                                }`}
                        >
                            {comment.is_pinned ? "📌 Désépingler" : "📌 Épingler"}
                        </button>

                        {/* Résoudre */}
                        {!comment.is_resolved && (
                            <button
                                onClick={() => onModerate(comment.id, { is_resolved: true })}
                                className="text-xs px-2.5 py-1 bg-muted text-muted-foreground border border-border rounded-lg hover:text-green-600 hover:border-green-300 transition-colors"
                            >
                                ✓ Résoudre
                            </button>
                        )}

                        {/* Supprimer */}
                        <button
                            onClick={() => onDelete(comment.id)}
                            className="text-xs px-2.5 py-1 bg-muted text-muted-foreground border border-border rounded-lg hover:text-destructive hover:border-destructive/30 transition-colors ml-auto"
                        >
                            🗑 Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}