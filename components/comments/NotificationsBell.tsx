"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Cloche Notifications
// components/comments/NotificationsBell.tsx
//
// À ajouter dans le header de lecture/page.tsx
// ou dans components/ui/site-header.tsx
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { Bell, MessageSquare, ThumbsUp, CheckCircle, X } from "lucide-react";
import { useNotifications } from "@/hooks/useComments";

// ── Icônes par type de notification ──────────
const NOTIF_ICONS: Record<string, React.ReactNode> = {
    reply: <MessageSquare className="w-4 h-4 text-blue-500" />,
    new_comment: <MessageSquare className="w-4 h-4 text-primary" />,
    upvote: <ThumbsUp className="w-4 h-4 text-amber-500" />,
    suggestion_approved: <CheckCircle className="w-4 h-4 text-green-500" />,
    suggestion_rejected: <X className="w-4 h-4 text-destructive" />,
    mention: <Bell className="w-4 h-4 text-purple-500" />,
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "maintenant";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
}

export default function NotificationsBell() {
    const { notifications, unreadCount, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fermer au clic extérieur
    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleOutsideClick);
        }
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [open]);

    // Marquer comme lus 2s après ouverture
    const handleOpen = () => {
        setOpen((prev) => !prev);
        if (!open && unreadCount > 0) {
            setTimeout(markAllRead, 2000);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* ── Bouton cloche ── */}
            <button
                onClick={handleOpen}
                aria-label={
                    unreadCount > 0
                        ? `Notifications (${unreadCount} non lues)`
                        : "Notifications"
                }
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
                <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header dropdown */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h4 className="text-sm font-semibold text-foreground">
                            Notifications
                        </h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    {/* Liste notifications */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center py-8 text-center px-4">
                                <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Aucune notification
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Vous serez notifié des réponses et activités
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${!notif.is_read ? "bg-primary/5" : "hover:bg-muted/50"
                                        }`}
                                >
                                    {/* Icône */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {NOTIF_ICONS[notif.type] ?? (
                                            <Bell className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-xs leading-snug ${!notif.is_read
                                                ? "font-medium text-foreground"
                                                : "text-foreground/80"
                                                }`}
                                        >
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {timeAgo(notif.created_at)}
                                        </p>
                                    </div>

                                    {/* Indicateur non-lu */}
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