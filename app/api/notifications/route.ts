// ─────────────────────────────────────────────
// XCSM V3 — Route Notifications
// app/api/notifications/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEMO_NOTIFS = [
    {
        id: "n1",
        type: "reply",
        title: "Réponse à votre commentaire",
        message: "Prof. B. a répondu à votre question sur les notions",
        link: "/cours/demo/lecture",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        actor_name: "Prof. B.",
    },
    {
        id: "n2",
        type: "suggestion_approved",
        title: "Suggestion approuvée",
        message: "Votre suggestion a été approuvée et intégrée au cours",
        link: "/cours/demo/lecture",
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        id: "n3",
        type: "upvote",
        title: "Vote positif",
        message: "8 personnes ont trouvé votre commentaire utile",
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
];

// GET : récupérer les notifications
export async function GET(req: NextRequest) {
    const auth = req.headers.get("Authorization") ?? "";

    try {
        const res = await fetch(`${BACKEND}/api/v1/notifications/`, {
            headers: { Authorization: auth },
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json());
    } catch { /* mode démo */ }

    const unread = DEMO_NOTIFS.filter((n) => !n.is_read).length;
    return Response.json({
        notifications: DEMO_NOTIFS,
        unread_count: unread,
        mode: "demo",
    });
}

// PATCH : marquer tout comme lu
export async function PATCH(req: NextRequest) {
    const auth = req.headers.get("Authorization") ?? "";

    try {
        const res = await fetch(`${BACKEND}/api/v1/notifications/mark-all-read/`, {
            method: "PATCH",
            headers: { Authorization: auth },
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json());
    } catch { /* mode démo */ }

    return Response.json({
        marked_read: DEMO_NOTIFS.length,
        mode: "demo",
    });
}