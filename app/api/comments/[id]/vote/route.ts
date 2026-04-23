// ─────────────────────────────────────────────
// XCSM V3 — Route Vote Commentaire
// app/api/comments/[id]/vote/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Store en mémoire pour le mode démo
const voteStore: Record<
    string,
    { upvotes: number; downvotes: number; session_vote: "up" | "down" | null }
> = {};

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const body = await req.json();
    const { vote } = body as { vote: "up" | "down" | null };
    const auth = req.headers.get("Authorization") ?? "";

    if (vote !== "up" && vote !== "down" && vote !== null) {
        return Response.json(
            { error: "vote doit être 'up', 'down' ou null" },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(`${BACKEND}/api/v1/comments/${id}/vote/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: auth },
            body: JSON.stringify({ vote }),
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json());
    } catch { /* mode démo */ }

    // Mode démo : simuler les votes
    if (!voteStore[id]) {
        voteStore[id] = { upvotes: 0, downvotes: 0, session_vote: null };
    }
    const current = voteStore[id];
    const prev = current.session_vote;

    // Annuler le vote précédent
    if (prev === "up") current.upvotes = Math.max(0, current.upvotes - 1);
    if (prev === "down") current.downvotes = Math.max(0, current.downvotes - 1);

    // Appliquer le nouveau vote
    if (vote === "up") current.upvotes += 1;
    if (vote === "down") current.downvotes += 1;
    current.session_vote = vote;

    return Response.json({
        comment_id: id,
        upvotes: current.upvotes,
        downvotes: current.downvotes,
        user_vote: vote,
        mode: "demo",
    });
}