// ─────────────────────────────────────────────────────────────
// XCSM V3 — Route API Commentaires Vue Enseignant
// app/api/comments/teacher/route.ts
//
// Agrège les commentaires de TOUS les cours de l'enseignant connecté
// Supporte : filtres type/status, tri, sélection par cours
// ─────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic"; // Désactive le cache de Next.js


const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Les données mockées ont été retirées comme demandé.

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course_id");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") ?? "recent";
    const auth = req.headers.get("Authorization") ?? "";

    // Tenter le backend Django
    try {
        const params = new URLSearchParams({ teacher_view: "true", sort });
        if (courseId) params.set("course_id", courseId);
        if (type) params.set("type", type);
        if (status) params.set("status", status);

        const res = await fetch(`${BACKEND}/api/v1/comments/teacher/?${params}`, {
            headers: { Authorization: auth },
            signal: AbortSignal.timeout(3000),
        });
        
        if (res.ok) {
            return Response.json(await res.json());
        } else {
            console.warn(`[Teacher API] Backend returned ${res.status}`);
            return Response.json({ error: "Non autorisé ou erreur serveur" }, { status: res.status });
        }
    } catch (err) {
        console.error("[Teacher API] Fetch error:", err);
        return Response.json({ comments: [], total: 0, pending: 0, suggestions: 0, error: "Backend offline" }, { status: 500 });
    }

}