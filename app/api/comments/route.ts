// ─────────────────────────────────────────────
// XCSM V3 — Route API Commentaires (GET + POST)
// app/api/comments/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic"; // Désactive le cache de Next.js pour cette route


const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Les données mockées ont été supprimées.

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
        if (res.ok) {
            return Response.json(await res.json());
        } else {
            console.warn(`[Comments API] Backend returned ${res.status} ${res.statusText}`);
            return Response.json({ error: "Non autorisé ou erreur serveur" }, { status: res.status });
        }
    } catch (err) { 
        console.error("[Comments API] Erreur fetch backend:", err);
        return Response.json({ comments: [], total: 0, error: "Backend offline" }, { status: 500 });
    }
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
        return Response.json({ error: "Erreur lors de la création sur le backend" }, { status: res.status });
    } catch (err) {
        console.error("[Comments API] POST Error:", err);
        return Response.json({ error: "Backend offline" }, { status: 500 });
    }
}