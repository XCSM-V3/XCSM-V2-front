// ─────────────────────────────────────────────
// XCSM V3 — Route API Dashboard Analytics
// app/api/analytics/dashboard/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic"; // Désactive le cache de Next.js

import type { CourseAnalytics, PedagogicalAlert } from "../../../../types/analytics.types"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function generateAlerts(analytics: CourseAnalytics): PedagogicalAlert[] {
    const alerts: PedagogicalAlert[] = [];

    const totalAi = analytics.total_ai_interactions || 0;

    analytics.difficult_zones.forEach((zone, i) => {
        if (zone.ai_questions_count > 20) {
            alerts.push({
                id: `alert_ai_${zone.granule_id}`,
                type: "high_ai_demand",
                severity: zone.ai_questions_count > 40 ? "critical" : "warning",
                course_id: analytics.course_id,
                course_title: analytics.course_title,
                granule_id: zone.granule_id,
                granule_title: zone.granule_title,
                message: `Zone d'ombre détectée : "${zone.granule_title}"`,
                detail: `${zone.ai_questions_count} questions IA posées sur cette notion. Les étudiants ont du mal à comprendre ce contenu.`,
                percentage: totalAi > 0 ? Math.round((zone.ai_questions_count / totalAi) * 100) : 0,
                created_at: new Date(Date.now() - i * 3600000).toISOString(),
                is_read: false,
            });
        }

        if (zone.completion_rate < 50) {
            alerts.push({
                id: `alert_completion_${zone.granule_id}`,
                type: "low_completion",
                severity: zone.completion_rate < 30 ? "critical" : "warning",
                course_id: analytics.course_id,
                course_title: analytics.course_title,
                granule_id: zone.granule_id,
                granule_title: zone.granule_title,
                message: `Taux de complétion faible : "${zone.granule_title}"`,
                detail: `Seulement ${zone.completion_rate}% des étudiants terminent cette section. Envisagez de la simplifier ou d'ajouter des exemples.`,
                percentage: zone.completion_rate,
                created_at: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
                is_read: false,
            });
        }
    });

    return alerts;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course_id");
    const period = parseInt(searchParams.get("period") ?? "7");

    if (!courseId) {
        return Response.json({ error: "course_id requis" }, { status: 400 });
    }

    // Vérification auth token
    const authHeader = req.headers.get("Authorization");

    // Tenter de récupérer les données du backend Django
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/v1/analytics/dashboard/?course_id=${courseId}&period=${period}`,
            {
                headers: authHeader ? { Authorization: authHeader } : {},
                // Les calculs peuvent prendre un peu de temps selon la taille des données
                signal: AbortSignal.timeout(20000),
            }
        );

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            return Response.json(
                {
                    error: "Backend analytics en erreur",
                    status: response.status,
                    detail: text || response.statusText,
                },
                { status: response.status }
            );
        }

        const analytics = await response.json();
        const alerts = generateAlerts(analytics);

        return Response.json({
            analytics,
            alerts,
            mode: "live",
            message: "Données analytics live",
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json(
            { error: "Impossible de joindre le backend analytics", detail: msg },
            { status: 502 }
        );
    }
}