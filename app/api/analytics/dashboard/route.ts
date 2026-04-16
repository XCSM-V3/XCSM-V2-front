// ─────────────────────────────────────────────
// XCSM V3 — Route API Dashboard Analytics
// app/api/analytics/dashboard/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";
import type { CourseAnalytics, GranuleMetric, PedagogicalAlert } from "../../../../types/analytics.types"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Génère des données réalistes pour le mode démo / backend offline
function generateDemoAnalytics(courseId: string, period: number): CourseAnalytics {
    const seed = courseId.length + period;
    const rng = (min: number, max: number) =>
        Math.floor(min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min));

    const granuleData: GranuleMetric[] = [
        {
            granule_id: "g1",
            granule_title: "Introduction et concepts fondamentaux",
            chapter_title: "Chapitre 1",
            views: rng(45, 120),
            unique_sessions: rng(30, 80),
            avg_time_seconds: rng(180, 600),
            ai_questions_count: rng(5, 25),
            difficulty_score: rng(20, 45),
            completion_rate: rng(75, 95),
            is_difficult_zone: false,
        },
        {
            granule_id: "g2",
            granule_title: "Théorèmes avancés et démonstrations",
            chapter_title: "Chapitre 2",
            views: rng(30, 90),
            unique_sessions: rng(20, 60),
            avg_time_seconds: rng(300, 900),
            ai_questions_count: rng(20, 55),
            difficulty_score: rng(68, 90),
            completion_rate: rng(35, 60),
            is_difficult_zone: true,
        },
        {
            granule_id: "g3",
            granule_title: "Applications pratiques et exercices",
            chapter_title: "Chapitre 2",
            views: rng(55, 130),
            unique_sessions: rng(40, 90),
            avg_time_seconds: rng(240, 720),
            ai_questions_count: rng(15, 40),
            difficulty_score: rng(50, 70),
            completion_rate: rng(55, 75),
            is_difficult_zone: false,
        },
        {
            granule_id: "g4",
            granule_title: "Cas particuliers et exceptions",
            chapter_title: "Chapitre 3",
            views: rng(20, 60),
            unique_sessions: rng(15, 45),
            avg_time_seconds: rng(400, 1000),
            ai_questions_count: rng(25, 65),
            difficulty_score: rng(75, 95),
            completion_rate: rng(25, 50),
            is_difficult_zone: true,
        },
        {
            granule_id: "g5",
            granule_title: "Révision et synthèse",
            chapter_title: "Chapitre 4",
            views: rng(60, 140),
            unique_sessions: rng(45, 100),
            avg_time_seconds: rng(150, 480),
            ai_questions_count: rng(8, 30),
            difficulty_score: rng(15, 40),
            completion_rate: rng(80, 98),
            is_difficult_zone: false,
        },
    ];

    const difficultZones = granuleData.filter((g) => g.is_difficult_zone);
    const sorted = [...granuleData].sort((a, b) => b.views - a.views);

    return {
        course_id: courseId,
        course_title: "Cours analysé",
        total_views: granuleData.reduce((s, g) => s + g.views, 0),
        unique_learners: rng(15, 60),
        avg_completion_rate: Math.round(
            granuleData.reduce((s, g) => s + g.completion_rate, 0) / granuleData.length
        ),
        avg_session_duration: Math.round(
            granuleData.reduce((s, g) => s + g.avg_time_seconds, 0) / granuleData.length
        ),
        total_ai_interactions: granuleData.reduce((s, g) => s + g.ai_questions_count, 0),
        difficult_zones: difficultZones,
        most_consulted: sorted.slice(0, 3),
        least_consulted: sorted.slice(-2),
        granule_metrics: granuleData,
        alert_count: difficultZones.length,
        period_days: period,
    };
}

function generateAlerts(analytics: CourseAnalytics): PedagogicalAlert[] {
    const alerts: PedagogicalAlert[] = [];

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
                percentage: Math.round((zone.ai_questions_count / analytics.total_ai_interactions) * 100),
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
                signal: AbortSignal.timeout(5000),
            }
        );

        if (response.ok) {
            const data = await response.json();
            return Response.json(data);
        }
    } catch {
        // Backend indisponible → mode démo
    }

    // Mode démo : données simulées réalistes
    const analytics = generateDemoAnalytics(courseId, period);
    const alerts = generateAlerts(analytics);

    return Response.json({
        analytics,
        alerts,
        mode: "demo",
        message: "Données de démonstration (backend Analytics non connecté)",
    });
}