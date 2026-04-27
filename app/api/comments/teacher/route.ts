// ─────────────────────────────────────────────────────────────
// XCSM V3 — Route API Commentaires Vue Enseignant
// app/api/comments/teacher/route.ts
//
// Agrège les commentaires de TOUS les cours de l'enseignant connecté
// Supporte : filtres type/status, tri, sélection par cours
// ─────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Données démo enrichies avec infos cours + granule
const DEMO_TEACHER: any[] = [
    {
        id: "tc1",
        granule_id: "g1",
        granule_title: "Théorèmes avancés et démonstrations",
        course_id: "demo1",
        course_title: "Mathématiques Avancées",
        type: "question",
        content: "Je ne comprends pas pourquoi le théorème de Pythagore s'applique uniquement aux triangles rectangles. Pouvez-vous clarifier ?",
        author: { id: "s1", display_name: "Aline K.", role: "etudiant", initials: "AK" },
        status: "approved", upvotes: 8, downvotes: 0, user_vote: null,
        replies: [], replies_count: 0,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        is_pinned: false, is_resolved: false,
    },
    {
        id: "tc2",
        granule_id: "g2",
        granule_title: "Introduction aux graphes",
        course_id: "demo2",
        course_title: "Algorithmique",
        type: "suggestion",
        content: "Il serait utile d'ajouter un exemple d'algorithme de Dijkstra sur un graphe pondéré plus complexe, avec au moins 8 noeuds.",
        author: { id: "s2", display_name: "Marc T.", role: "etudiant", initials: "MT" },
        status: "pending", upvotes: 15, downvotes: 0, user_vote: null,
        replies: [], replies_count: 0,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        is_pinned: false, is_resolved: false,
    },
    {
        id: "tc3",
        granule_id: "g1",
        granule_title: "Théorèmes avancés et démonstrations",
        course_id: "demo1",
        course_title: "Mathématiques Avancées",
        type: "correction",
        content: "La formule à la ligne 3 de la démonstration contient une erreur de signe : il faut -2ab, pas +2ab dans le développement de (a-b)².",
        author: { id: "s3", display_name: "Sophie M.", role: "etudiant", initials: "SM" },
        status: "pending", upvotes: 22, downvotes: 0, user_vote: null,
        replies: [], replies_count: 0,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        is_pinned: false, is_resolved: false,
    },
    {
        id: "tc4",
        granule_id: "g3",
        granule_title: "Complexité algorithmique",
        course_id: "demo2",
        course_title: "Algorithmique",
        type: "suggestion",
        // ── Suggestion d'un COLLÈGUE ENSEIGNANT (distingué par le rôle) ──
        content: "Collègue, je suggère d'aborder la complexité amortie dans cette section, car elle est souvent mal comprise par les étudiants. J'ai un exemple de code que je peux te partager.",
        author: { id: "p1", display_name: "Dr. Nguemo E.", role: "enseignant", initials: "NE" },
        status: "pending", upvotes: 3, downvotes: 0, user_vote: null,
        replies: [], replies_count: 0,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        is_pinned: false, is_resolved: false,
    },
    {
        id: "tc5",
        granule_id: "g1",
        granule_title: "Théorèmes avancés et démonstrations",
        course_id: "demo1",
        course_title: "Mathématiques Avancées",
        type: "comment",
        content: "Excellente explication ! Le schéma visuel aide vraiment à comprendre la démonstration. Merci.",
        author: { id: "s4", display_name: "Paul N.", role: "etudiant", initials: "PN" },
        status: "approved", upvotes: 6, downvotes: 0, user_vote: null,
        replies: [], replies_count: 0,
        created_at: new Date(Date.now() - 43200000).toISOString(),
        updated_at: new Date(Date.now() - 43200000).toISOString(),
        is_pinned: false, is_resolved: false,
    },
];

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
        if (res.ok) return Response.json(await res.json());
    } catch {
        // Backend offline → mode démo
    }

    // Mode démo : filtrer + trier
    let data = [...DEMO_TEACHER];
    if (courseId) data = data.filter(c => c.course_id === courseId);
    if (type) data = data.filter(c => c.type === type);
    if (status) data = data.filter(c => c.status === status);

    if (sort === "top") data.sort((a, b) => b.upvotes - a.upvotes);
    else if (sort === "pending") {
        data.sort((a, b) => {
            const pa = a.status === "pending" ? 1 : 0;
            const pb = b.status === "pending" ? 1 : 0;
            return pb - pa || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } else {
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const pending = data.filter(c => c.status === "pending").length;
    const suggestions = data.filter(c => c.type === "suggestion" || c.type === "correction").length;

    return Response.json({
        comments: data,
        total: data.length,
        pending,
        suggestions,
        mode: "demo",
    });
}