"use client";
// ─────────────────────────────────────────────────────────────
// XCSM V3 — Cloche Notifications (version complète)
// components/comments/NotificationsBell.tsx
//
// ← REMPLACE la version précédente
// Gère les notifs enseignant ET étudiant
// Envoie le rôle dans le header pour que l'API filtre correctement
// ─────────────────────────────────────────────────────────────

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Bell, MessageSquare, ThumbsUp, CheckCircle, X,
    Users, BookOpen, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

// ── Types locaux ─────────────────────────────────────────────
interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    badge?: string;       // type du commentaire source
    is_read: boolean;
    created_at: string;
    actor_name?: string;
    actor_role?: string;  // "etudiant" | "enseignant"
}

// ── Icônes selon type ─────────────────────────────────────────
function NotifIcon({ type, actorRole }: { type: string; actorRole?: string }) {
    if (type === "peer_suggestion")
        return <Users className="w-4 h-4 text-blue-500" />;
    if (type === "new_student_comment")
        return <MessageSquare className="w-4 h-4 text-primary" />;
    if (type === "reply")
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
    if (type === "suggestion_approved")
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (type === "suggestion_rejected")
        return <X className="w-4 h-4 text-destructive" />;
    if (type === "upvote")
        return <ThumbsUp className="w-4 h-4 text-amber-500" />;
    return <Bell className="w-4 h-4 text-muted-foreground" />;
}

// ── Badge rôle auteur ─────────────────────────────────────────
function ActorBadge({ role }: { role?: string }) {
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

function getToken() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("access_token") ?? "";
}

// ── Composant principal ───────────────────────────────────────
export default function NotificationsBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        const token = getToken();
        try {
            const res = await fetch("/api/notifications", {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    // Envoyer le rôle pour que l'API sache quelles notifs retourner
                    ...(user?.role ? { "X-User-Role": user.role } : {}),
                },
            });
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } catch { /* silencieux */ }
    }, [user?.role]);

    // Polling 30s
    useEffect(() => {
        load();
        const iv = setInterval(load, 30000);
        return () => clearInterval(iv);
    }, [load]);

    // Fermer au clic extérieur
    useEffect(() => {
        function out(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", out);
        return () => document.removeEventListener("mousedown", out);
    }, [open]);

    const handleOpen = () => {
        setOpen(v => !v);
        if (!open && unreadCount > 0) {
            setTimeout(async () => {
                const token = getToken();
                await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                });
                setNotifications(p => p.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }, 2000);
        }
    };

    const isTeacher = user?.role === "enseignant" || user?.role === "admin";

    return (
        <div ref={ref} className="relative">
            {/* ── Bouton cloche ── */}
            <button
                onClick={handleOpen}
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
                                    onClick={handleOpen}
                                    className="text-xs text-muted-foreground hover:underline"
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
                                        <NotifIcon type={notif.type} actorRole={notif.actor_role} />
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

                                        {/* Lien "Voir" pour enseignant */}
                                        {isTeacher && notif.link && (
                                            <Link
                                                href={notif.link}
                                                onClick={() => setOpen(false)}
                                                className="text-[11px] text-primary hover:underline mt-0.5 inline-block"
                                            >
                                                Voir le commentaire →
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




// "use client";
// // ─────────────────────────────────────────────
// // XCSM V3 — Cloche Notifications
// // components/comments/NotificationsBell.tsx
// //
// // À ajouter dans le header de lecture/page.tsx
// // ou dans components/ui/site-header.tsx
// // ─────────────────────────────────────────────

// import React, { useEffect, useRef, useState } from "react";
// import { Bell, MessageSquare, ThumbsUp, CheckCircle, X } from "lucide-react";
// import { useNotifications } from "@/hooks/useComments";

// // ── Icônes par type de notification ──────────
// const NOTIF_ICONS: Record<string, React.ReactNode> = {
//     reply: <MessageSquare className="w-4 h-4 text-blue-500" />,
//     new_comment: <MessageSquare className="w-4 h-4 text-primary" />,
//     upvote: <ThumbsUp className="w-4 h-4 text-amber-500" />,
//     suggestion_approved: <CheckCircle className="w-4 h-4 text-green-500" />,
//     suggestion_rejected: <X className="w-4 h-4 text-destructive" />,
//     mention: <Bell className="w-4 h-4 text-purple-500" />,
// };

// function timeAgo(dateStr: string): string {
//     const diff = Date.now() - new Date(dateStr).getTime();
//     const minutes = Math.floor(diff / 60000);
//     if (minutes < 1) return "maintenant";
//     if (minutes < 60) return `${minutes}min`;
//     const hours = Math.floor(minutes / 60);
//     if (hours < 24) return `${hours}h`;
//     return `${Math.floor(hours / 24)}j`;
// }

// export default function NotificationsBell() {
//     const { notifications, unreadCount, markAllRead } = useNotifications();
//     const [open, setOpen] = useState(false);
//     const containerRef = useRef<HTMLDivElement>(null);

//     // Fermer au clic extérieur
//     useEffect(() => {
//         function handleOutsideClick(e: MouseEvent) {
//             if (
//                 containerRef.current &&
//                 !containerRef.current.contains(e.target as Node)
//             ) {
//                 setOpen(false);
//             }
//         }
//         if (open) {
//             document.addEventListener("mousedown", handleOutsideClick);
//         }
//         return () => document.removeEventListener("mousedown", handleOutsideClick);
//     }, [open]);

//     // Marquer comme lus 2s après ouverture
//     const handleOpen = () => {
//         setOpen((prev) => !prev);
//         if (!open && unreadCount > 0) {
//             setTimeout(markAllRead, 2000);
//         }
//     };

//     return (
//         <div ref={containerRef} className="relative">
//             {/* ── Bouton cloche ── */}
//             <button
//                 onClick={handleOpen}
//                 aria-label={
//                     unreadCount > 0
//                         ? `Notifications (${unreadCount} non lues)`
//                         : "Notifications"
//                 }
//                 className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
//             >
//                 <Bell className="w-5 h-5" />
//                 {unreadCount > 0 && (
//                     <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
//                         {unreadCount > 9 ? "9+" : unreadCount}
//                     </span>
//                 )}
//             </button>

//             {/* ── Dropdown ── */}
//             {open && (
//                 <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
//                     {/* Header dropdown */}
//                     <div className="flex items-center justify-between px-4 py-3 border-b border-border">
//                         <h4 className="text-sm font-semibold text-foreground">
//                             Notifications
//                         </h4>
//                         {unreadCount > 0 && (
//                             <button
//                                 onClick={markAllRead}
//                                 className="text-xs text-primary hover:underline font-medium"
//                             >
//                                 Tout marquer lu
//                             </button>
//                         )}
//                     </div>

//                     {/* Liste notifications */}
//                     <div className="max-h-80 overflow-y-auto divide-y divide-border">
//                         {notifications.length === 0 ? (
//                             <div className="flex flex-col items-center py-8 text-center px-4">
//                                 <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
//                                 <p className="text-sm text-muted-foreground">
//                                     Aucune notification
//                                 </p>
//                                 <p className="text-xs text-muted-foreground/70 mt-1">
//                                     Vous serez notifié des réponses et activités
//                                 </p>
//                             </div>
//                         ) : (
//                             notifications.map((notif) => (
//                                 <div
//                                     key={notif.id}
//                                     className={`flex items-start gap-3 px-4 py-3 transition-colors ${!notif.is_read ? "bg-primary/5" : "hover:bg-muted/50"
//                                         }`}
//                                 >
//                                     {/* Icône */}
//                                     <div className="flex-shrink-0 mt-0.5">
//                                         {NOTIF_ICONS[notif.type] ?? (
//                                             <Bell className="w-4 h-4 text-muted-foreground" />
//                                         )}
//                                     </div>

//                                     {/* Contenu */}
//                                     <div className="flex-1 min-w-0">
//                                         <p
//                                             className={`text-xs leading-snug ${!notif.is_read
//                                                 ? "font-medium text-foreground"
//                                                 : "text-foreground/80"
//                                                 }`}
//                                         >
//                                             {notif.message}
//                                         </p>
//                                         <p className="text-[11px] text-muted-foreground mt-0.5">
//                                             {timeAgo(notif.created_at)}
//                                         </p>
//                                     </div>

//                                     {/* Indicateur non-lu */}
//                                     {!notif.is_read && (
//                                         <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
//                                     )}
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }