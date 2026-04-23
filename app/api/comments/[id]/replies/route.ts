// ─────────────────────────────────────────────
// XCSM V3 — Route Réponses à un Commentaire
// app/api/comments/[id]/replies/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function genId() {
    return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const body = await req.json();
    const { content, author } = body;
    const auth = req.headers.get("Authorization") ?? "";

    if (!content?.trim() || content.trim().length < 5) {
        return Response.json(
            { error: "La réponse doit faire au moins 5 caractères" },
            { status: 400 }
        );
    }
    if (content.trim().length > 500) {
        return Response.json(
            { error: "La réponse ne peut pas dépasser 500 caractères" },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(`${BACKEND}/api/v1/comments/${id}/replies/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: auth },
            body: JSON.stringify({ content: content.trim(), author }),
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json(), { status: 201 });
    } catch { /* mode démo */ }

    const reply = {
        id: genId(),
        content: content.trim(),
        author: author ?? {
            id: "current",
            display_name: "Vous",
            role: "etudiant",
            initials: "VO",
        },
        created_at: new Date().toISOString(),
        upvotes: 0,
        user_has_upvoted: false,
    };

    return Response.json(
        { reply, comment_id: id, mode: "demo" },
        { status: 201 }
    );
}