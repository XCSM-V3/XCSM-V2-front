// ─────────────────────────────────────────────────────────────
// XCSM V3 — Route API Notifications (version étendue)
// app/api/notifications/route.ts  ← REMPLACE la version précédente
//
// Pour les enseignants : inclut les nouvelles suggestions de collègues
// Pour les étudiants   : réponses, votes, approbations
// ─────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Démo — les notifications sont personnalisées selon le rôle
const DEMO_STUDENT_NOTIFS = [
    {
        id: "n1", type: "reply",
        title: "Réponse à votre commentaire",
        message: "L'enseignant a répondu à votre question sur les théorèmes",
        link: "/cours/demo1/lecture", is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        actor_name: "Prof. B.",
    },
    {
        id: "n2", type: "suggestion_approved",
        title: "Suggestion approuvée ✓",
        message: "Votre suggestion a été approuvée et sera intégrée au cours",
        link: "/cours/demo1/lecture", is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        id: "n3", type: "upvote",
        title: "Vote positif",
        message: "8 personnes ont trouvé votre commentaire utile",
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
];

const DEMO_TEACHER_NOTIFS = [
    {
        id: "tn1", type: "new_student_comment",
        title: "Nouveau commentaire étudiant",
        message: "Sophie M. a signalé une erreur dans « Théorèmes avancés »",
        link: "/dashboard/commentaires",
        badge: "correction",       // Pour colorier le badge côté client
        is_read: false,
        created_at: new Date(Date.now() - 1800000).toISOString(),
        actor_name: "Sophie M.",
        actor_role: "etudiant",
    },
    {
        id: "tn2", type: "peer_suggestion",
        title: "Suggestion d'un collègue",
        message: "Dr. Nguemo E. a suggéré un complément sur la complexité amortie",
        link: "/dashboard/commentaires",
        badge: "suggestion",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        actor_name: "Dr. Nguemo E.",
        actor_role: "enseignant",   // ← Distingue collègue enseignant
    },
    {
        id: "tn3", type: "new_student_comment",
        title: "Question étudiant",
        message: "Marc T. a posé une question sur le graphe de Dijkstra",
        link: "/dashboard/commentaires",
        badge: "question",
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        actor_name: "Marc T.",
        actor_role: "etudiant",
    },
    {
        id: "tn4", type: "new_student_comment",
        title: "Commentaire positif",
        message: "Paul N. a laissé un commentaire positif sur votre cours",
        link: "/dashboard/commentaires",
        badge: "comment",
        is_read: true,
        created_at: new Date(Date.now() - 43200000).toISOString(),
        actor_name: "Paul N.",
        actor_role: "etudiant",
    },
];

export async function GET(req: NextRequest) {
    const auth = req.headers.get("Authorization") ?? "";
    // Lire le rôle depuis le header personnalisé (le frontend doit l'envoyer)
    const role = req.headers.get("X-User-Role") ?? "etudiant";

    try {
        const res = await fetch(`${BACKEND}/api/v1/notifications/`, {
            headers: { Authorization: auth, "X-User-Role": role },
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json());
    } catch {
        // Mode démo
    }

    // Sélectionner les notifs selon le rôle
    const notifs = role === "enseignant" || role === "admin"
        ? DEMO_TEACHER_NOTIFS
        : DEMO_STUDENT_NOTIFS;

    const unread = notifs.filter(n => !n.is_read).length;
    return Response.json({ notifications: notifs, unread_count: unread, mode: "demo" });
}

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
    return Response.json({ marked_read: true, mode: "demo" });
}




// // ─────────────────────────────────────────────
// // XCSM V3 — Route Notifications
// // app/api/notifications/route.ts
// // ─────────────────────────────────────────────

// import { NextRequest } from "next/server";

// const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// const DEMO_NOTIFS = [
//     {
//         id: "n1",
//         type: "reply",
//         title: "Réponse à votre commentaire",
//         message: "Prof. B. a répondu à votre question sur les notions",
//         link: "/cours/demo/lecture",
//         is_read: false,
//         created_at: new Date(Date.now() - 3600000).toISOString(),
//         actor_name: "Prof. B.",
//     },
//     {
//         id: "n2",
//         type: "suggestion_approved",
//         title: "Suggestion approuvée",
//         message: "Votre suggestion a été approuvée et intégrée au cours",
//         link: "/cours/demo/lecture",
//         is_read: false,
//         created_at: new Date(Date.now() - 7200000).toISOString(),
//     },
//     {
//         id: "n3",
//         type: "upvote",
//         title: "Vote positif",
//         message: "8 personnes ont trouvé votre commentaire utile",
//         is_read: true,
//         created_at: new Date(Date.now() - 86400000).toISOString(),
//     },
// ];

// // GET : récupérer les notifications
// export async function GET(req: NextRequest) {
//     const auth = req.headers.get("Authorization") ?? "";

//     try {
//         const res = await fetch(`${BACKEND}/api/v1/notifications/`, {
//             headers: { Authorization: auth },
//             signal: AbortSignal.timeout(3000),
//         });
//         if (res.ok) return Response.json(await res.json());
//     } catch { /* mode démo */ }

//     const unread = DEMO_NOTIFS.filter((n) => !n.is_read).length;
//     return Response.json({
//         notifications: DEMO_NOTIFS,
//         unread_count: unread,
//         mode: "demo",
//     });
// }

// // PATCH : marquer tout comme lu
// export async function PATCH(req: NextRequest) {
//     const auth = req.headers.get("Authorization") ?? "";

//     try {
//         const res = await fetch(`${BACKEND}/api/v1/notifications/mark-all-read/`, {
//             method: "PATCH",
//             headers: { Authorization: auth },
//             signal: AbortSignal.timeout(3000),
//         });
//         if (res.ok) return Response.json(await res.json());
//     } catch { /* mode démo */ }

//     return Response.json({
//         marked_read: DEMO_NOTIFS.length,
//         mode: "demo",
//     });
// }