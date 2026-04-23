// ─────────────────────────────────────────────
// XCSM V3 — Route API Commentaires (GET + POST)
// app/api/comments/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Données démo en mémoire (actives si backend Django offline)
const DEMO: any[] = [
    {
        id: "c1", granule_id: "demo", course_id: "demo",
        type: "question",
        content: "Je ne comprends pas bien la différence entre une section et une notion. Quelqu'un peut expliquer ?",
        author: { id: "u1", display_name: "Aline K.", role: "etudiant", initials: "AK" },
        status: "approved", upvotes: 8, downvotes: 0, user_vote: null,
        replies: [{
            id: "r1",
            content: "Une notion est l'unité atomique de contenu — elle ne peut pas être subdivisée. Une section regroupe plusieurs notions thématiquement liées.",
            author: { id: "u2", display_name: "Prof. B.", role: "enseignant", initials: "PB" },
            created_at: new Date(Date.now() - 7200000).toISOString(),
            upvotes: 12, user_has_upvoted: false,
        }],
        replies_count: 1,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        is_pinned: false, is_resolved: true,
    },
    {
        id: "c2", granule_id: "demo", course_id: "demo",
        type: "suggestion",
        content: "Il serait utile d'ajouter un exemple concret avec des matrices 3x3. Les exemples 2x2 sont trop simples pour les cas réels.",
        author: { id: "u3", display_name: "Marc T.", role: "etudiant", initials: "MT" },
        status: "pending", upvotes: 15, downvotes: 1, user_vote: null,
        replies: [], replies_count: 0,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        is_pinned: false, is_resolved: false,
    },
    {
        id: "c3", granule_id: "demo", course_id: "demo",
        type: "correction",
        content: "Petite erreur : la formule devrait être f(x) = 2x² + 3x, pas 2x + 3x².",
        author: { id: "u4", display_name: "Sophie M.", role: "etudiant", initials: "SM" },
        status: "implemented", upvotes: 22, downvotes: 0, user_vote: null,
        replies: [{
            id: "r2",
            content: "Merci Sophie, correction effectuée dans la V2 du document !",
            author: { id: "u2", display_name: "Prof. B.", role: "enseignant", initials: "PB" },
            created_at: new Date(Date.now() - 1800000).toISOString(),
            upvotes: 5, user_has_upvoted: false,
        }],
        replies_count: 1,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        is_pinned: true, is_resolved: true,
    },
];

function genId() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function auth(req: NextRequest) {
    return req.headers.get("Authorization") ?? "";
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const granuleId = searchParams.get("granule_id");
    const courseId = searchParams.get("course_id");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") ?? "top";

    if (!granuleId) {
        return Response.json({ error: "granule_id requis" }, { status: 400 });
    }

    try {
        const params = new URLSearchParams({ granule_id: granuleId, sort });
        if (courseId) params.set("course_id", courseId);
        if (type) params.set("type", type);
        const res = await fetch(`${BACKEND}/api/v1/comments/?${params}`, {
            headers: { Authorization: auth(req) },
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json());
    } catch { /* backend offline → mode démo */ }

    let data = DEMO.filter((c) => c.granule_id === granuleId || granuleId === "demo");
    if (type) data = data.filter((c) => c.type === type);
    data = sort === "top"
        ? [...data].sort((a, b) => b.upvotes - a.upvotes)
        : [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    data.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

    return Response.json({ comments: data, total: data.length, mode: "demo" });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { granule_id, course_id, type, content, author } = body;

    if (!granule_id || !content?.trim() || !type) {
        return Response.json({ error: "granule_id, type et content requis" }, { status: 400 });
    }
    if (content.trim().length < 10) {
        return Response.json({ error: "Minimum 10 caractères requis" }, { status: 400 });
    }
    if (content.trim().length > 1000) {
        return Response.json({ error: "Maximum 1000 caractères" }, { status: 400 });
    }

    try {
        const res = await fetch(`${BACKEND}/api/v1/comments/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: auth(req) },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json(), { status: 201 });
    } catch { /* mode démo */ }

    const newComment = {
        id: genId(), granule_id, course_id: course_id ?? "demo",
        type, content: content.trim(),
        author: author ?? { id: "current", display_name: "Vous", role: "etudiant", initials: "VO" },
        status: type === "suggestion" || type === "correction" ? "pending" : "approved",
        upvotes: 0, downvotes: 0, user_vote: null,
        replies: [], replies_count: 0,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        is_pinned: false, is_resolved: false,
    };
    DEMO.unshift(newComment);
    return Response.json({ comment: newComment, mode: "demo" }, { status: 201 });
}