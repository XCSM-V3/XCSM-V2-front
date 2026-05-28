// ─────────────────────────────────────────────
// XCSM V3 — Route API : Tracking des événements
// app/api/analytics/track/route.ts
//
// Reçoit les événements anonymisés du frontend
// Les transmet au backend Django OU les stocke localement
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Stockage en mémoire pour fallback si backend indisponible
// En production, tout passe au backend Django
const eventBuffer: any[] = [];
const MAX_BUFFER = 1000;

export async function POST(req: NextRequest) {
    try {
        const event = await req.json();

        const authHeader = req.headers.get("Authorization");

        // 1) Mode "tracking temps sur granule" (payload minimal pour alimenter TrackingSession)
        // Attendu côté backend :
        // { course_id, granule_id, time_spent, success_rate? }
        if (event && event.course_id && event.granule_id && event.time_spent !== undefined) {
            const response = await fetch(`${BACKEND_URL}/api/v1/analytics/track/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
                body: JSON.stringify({
                    course_id: event.course_id,
                    granule_id: event.granule_id,
                    time_spent: event.time_spent,
                    success_rate: event.success_rate ?? null,
                }),
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                return Response.json({ status: "ok", stored: "backend" });
            }

            const text = await response.text().catch(() => "");
            return Response.json(
                { error: "Tracking backend en erreur", detail: text || response.statusText },
                { status: response.status }
            );
        }

        // 2) Mode "événements IA / navigation" : backend n'ayant pas encore d'endpoint events,
        // on bufferise pour ne pas perdre l'info (dev/offline).
        if (!event.event_type || !event.course_id || !event.session_id) {
            return Response.json({ error: "Événement invalide" }, { status: 400 });
        }

        // Enrichir l'événement avec le timestamp serveur
        const enrichedEvent = {
            ...event,
            server_timestamp: new Date().toISOString(),
            ip_hash: null, // RGPD : pas d'IP stockée
        };

        // Fallback : stockage en mémoire (développement / backend offline)
        if (eventBuffer.length < MAX_BUFFER) {
            eventBuffer.push(enrichedEvent);
        }

        return Response.json({ status: "ok", stored: "memory", buffer_size: eventBuffer.length });
    } catch {
        return Response.json({ error: "Erreur traitement événement" }, { status: 500 });
    }
}

// GET : récupérer les événements en mémoire (utile en dev)
export async function GET() {
    return Response.json({
        buffer_size: eventBuffer.length,
        recent_events: eventBuffer.slice(-20),
        note: "En production, les données sont dans le backend Django",
    });
}

// Export pour les autres routes (ex: dashboard)
export { eventBuffer };