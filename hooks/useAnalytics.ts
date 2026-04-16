"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Hook de tracking Analytics
// hooks/useAnalytics.ts
//
// RGPD : session_id anonymisé (hash, pas d'ID utilisateur)
// Les données sont agrégées côté serveur avant stockage
// ─────────────────────────────────────────────

import { useCallback, useEffect, useRef } from "react";
import type { EventType, TrackingEvent } from "@/types/analytics.types";

// Génère un ID de session anonyme persistant dans sessionStorage
function getAnonymousSessionId(): string {
    if (typeof window === "undefined") return "ssr";
    const key = "xcsm_anon_session";
    let id = sessionStorage.getItem(key);
    if (!id) {
        // Hash aléatoire non réversible — pas de lien avec l'utilisateur
        id = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(key, id);
    }
    return id;
}

// Envoie un événement à la route API interne Next.js
async function sendEvent(event: TrackingEvent): Promise<void> {
    try {
        await fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
            // keepalive permet l'envoi même si la page se ferme
            keepalive: true,
        });
    } catch {
        // Tracking non-bloquant : on ignore les erreurs silencieusement
    }
}

interface UseAnalyticsOptions {
    course_id: string;
    granule_id?: string;
    granule_title?: string;
}

export function useAnalytics({ course_id, granule_id, granule_title }: UseAnalyticsOptions) {
    const session_id = getAnonymousSessionId();
    const startTimeRef = useRef<number>(Date.now());
    const hasTrackedStartRef = useRef(false);

    // Tracker le début de consultation d'un granule
    useEffect(() => {
        if (!granule_id || hasTrackedStartRef.current) return;
        hasTrackedStartRef.current = true;
        startTimeRef.current = Date.now();

        sendEvent({
            event_type: "granule_view_start",
            session_id,
            course_id,
            granule_id,
            granule_title,
            timestamp: new Date().toISOString(),
        });

        // Tracker la fin quand l'utilisateur quitte (unmount ou fermeture de page)
        return () => {
            const duration_seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
            // Ignorer les durées trop courtes (<2s = accidentel)
            if (duration_seconds < 2) return;

            sendEvent({
                event_type: "granule_view_end",
                session_id,
                course_id,
                granule_id,
                granule_title,
                duration_seconds,
                timestamp: new Date().toISOString(),
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [granule_id]);

    // Tracker une question posée à l'IA
    const trackAIQuestion = useCallback((questionText?: string) => {
        sendEvent({
            event_type: "ai_question_asked",
            session_id,
            course_id,
            granule_id,
            granule_title,
            metadata: questionText ? { question_length: questionText.length } : {},
            timestamp: new Date().toISOString(),
        });
    }, [session_id, course_id, granule_id, granule_title]);

    // Tracker une action rapide IA (résumer, expliquer, suggérer)
    const trackAIAction = useCallback((action: "summarize" | "explain" | "suggest") => {
        sendEvent({
            event_type: "ai_quick_action",
            session_id,
            course_id,
            granule_id,
            granule_title,
            metadata: { action },
            timestamp: new Date().toISOString(),
        });
    }, [session_id, course_id, granule_id, granule_title]);

    // Tracker une recherche
    const trackSearch = useCallback((query: string) => {
        sendEvent({
            event_type: "search_performed",
            session_id,
            course_id,
            metadata: { query_length: query.length },
            timestamp: new Date().toISOString(),
        });
    }, [session_id, course_id]);

    return { trackAIQuestion, trackAIAction, trackSearch };
}

// Hook simplifié pour les pages sans granule (ex: page accueil cours)
export function usePageTracking(course_id: string) {
    return useAnalytics({ course_id });
}