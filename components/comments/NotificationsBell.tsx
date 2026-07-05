"use client";
// ─────────────────────────────────────────────────────────────
// XCSM V3 — Cloche Notifications
// components/comments/NotificationsBell.tsx
//
// Passe par lib/api.ts (comme le reste de l'app) au lieu de fetch()
// bruts vers une route proxy Next.js avec fallback démo silencieux.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Bell, MessageSquare, ThumbsUp, CheckCircle, X,
    Users, BookOpen, FileCheck, FileWarning, UserPlus, UserMinus,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { api, Notification } from "@/lib/api";
import Link from "next/link";

// ── Icônes selon type (alignées sur les types réellement produits par le backend) ──
function NotifIcon({ type }: { type: string }) {
    switch (type) {
        case "new_comment":
            return <MessageSquare className="w-4 h-4 text-primary" />;
        case "reply":
            return <MessageSquare className="w-4 h-4 text-blue-500" />;
        case "upvote":
            return <ThumbsUp className="w-4 h-4 text-amber-500" />;
        case "suggestion_approved":
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        case "suggestion_rejected":
            return <X className="w-4 h-4 text-destructive" />;
        case "document_traite":
            return <FileCheck className="w-4 h-4 text-green-500" />;
        case "document_erreur":
            return <FileWarning className="w-4 h-4 text-destructive" />;
        case "co_teacher_added":
            return <UserPlus className="w-4 h-4 text-blue-500" />;
        case "co_teacher_removed":
            return <UserMinus className="w-4 h-4 text-muted-foreground" />;
        default:
            return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
}

// ── Badge rôle auteur ─────────────────────────────────────────
function ActorBadge({ role }: { role?: string | null }) {
    if (!role) return null;
    return role === "enseignant" ? (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
            <Users className="w-2.5 h-2.5" />Collègue
        </span>
    ) : (
        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
            <BookOpen className="w-2.5 h-2.5" />Étudiant
        </span>
    );
}

function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "maintenant";
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
}

// ── Composant principal ───────────────────────────────────────
export default function NotificationsBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [isMarking, setIsMarking] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } catch {
            /* silencieux : le poll suivant réessaiera */
        }
    }, []);

    // Polling 30s
    useEffect(() => {
        if (!user) return;
        load();
        const iv = setInterval(load, 30000);
        return () => clearInterval(iv);
    }, [load, user]);

    // Fermer au clic extérieur
    useEffect(() => {
        function out(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", out);
        return () => document.removeEventListener("mousedown", out);
    }, [open]);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || isMarking) return;
        setIsMarking(true);
        try {
            await api.markAllNotificationsRead();
            setNotifications(p => p.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {
            // Échec réel (backend down/erreur) : on ne fait PAS croire que c'est marqué lu.
        } finally {
            setIsMarking(false);
        }
    };

    const handleToggle = () => {
        setOpen(v => !v);
    };

    const isTeacher = user?.role === "enseignant" || user?.role === "admin";

    return (
        <div ref={ref} className="relative">
            {/* ── Bouton cloche ── */}
            <button
                onClick={handleToggle}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* ── Dropdown ── */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-84 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                        <div className="flex items-center gap-2">
                            {isTeacher && (
                                <Link
                                    href="/dashboard/commentaires"
                                    onClick={() => setOpen(false)}
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    Tout gérer →
                                </Link>
                            )}
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={isMarking}
                                    className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                                >
                                    Tout lire
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Liste */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center py-8 text-center px-4">
                                <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">Aucune notification</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${!notif.is_read ? "bg-primary/5" : "hover:bg-muted/50"
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <NotifIcon type={notif.type} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Ligne titre + badge rôle */}
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                            <p className={`text-xs font-medium ${!notif.is_read ? "text-foreground" : "text-foreground/80"}`}>
                                                {notif.title}
                                            </p>
                                            {/* Badge rôle auteur — visible uniquement pour l'enseignant */}
                                            {isTeacher && <ActorBadge role={notif.actor_role} />}
                                        </div>

                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                            {timeAgo(notif.created_at)}
                                        </p>

                                        {notif.link && (
                                            <Link
                                                href={notif.link}
                                                onClick={() => setOpen(false)}
                                                className="text-[11px] text-primary hover:underline mt-0.5 inline-block"
                                            >
                                                Voir →
                                            </Link>
                                        )}
                                    </div>

                                    {!notif.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
