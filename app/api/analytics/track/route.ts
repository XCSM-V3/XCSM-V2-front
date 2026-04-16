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

        // Validation minimale
        if (!event.event_type || !event.course_id || !event.session_id) {
            return Response.json({ error: "Événement invalide" }, { status: 400 });
        }

        // Enrichir l'événement avec le timestamp serveur
        const enrichedEvent = {
            ...event,
            server_timestamp: new Date().toISOString(),
            ip_hash: null, // RGPD : pas d'IP stockée
        };

        // Tenter d'envoyer au backend Django
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/analytics/events/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(enrichedEvent),
                signal: AbortSignal.timeout(3000), // Timeout 3s
            });

            if (response.ok) {
                return Response.json({ status: "ok", stored: "backend" });
            }
        } catch {
            // Backend indisponible → fallback mémoire
        }

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