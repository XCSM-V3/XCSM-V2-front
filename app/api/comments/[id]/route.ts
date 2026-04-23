// ─────────────────────────────────────────────
// XCSM V3 — Route API Commentaire [id]
// app/api/comments/[id]/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const body = await req.json();
    const auth = req.headers.get("Authorization") ?? "";

    const allowed = ["status", "is_pinned", "is_resolved"];
    const update = Object.fromEntries(
        Object.entries(body).filter(([k]) => allowed.includes(k))
    );

    try {
        const res = await fetch(`${BACKEND}/api/v1/comments/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: auth },
            body: JSON.stringify(update),
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json(await res.json());
    } catch { /* mode démo */ }

    return Response.json({
        id, ...update,
        updated_at: new Date().toISOString(),
        mode: "demo",
    });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const auth = req.headers.get("Authorization") ?? "";

    try {
        const res = await fetch(`${BACKEND}/api/v1/comments/${id}/`, {
            method: "DELETE",
            headers: { Authorization: auth },
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return Response.json({ deleted: true });
    } catch { /* mode démo */ }

    return Response.json({ deleted: true, mode: "demo" });
}