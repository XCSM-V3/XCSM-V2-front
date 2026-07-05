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
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'événement analytique:", error);
    }
}

type UseAnalyticsArgs = {
    course_id: string;
    session_id?: string;
    granule_id?: string;
    granule_title?: string;
};

function isUuidLike(value?: string | null) {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Supporte aussi `useAnalytics({ course_id, granule_id, ... })`
export function useAnalytics(
    course_id_or_args: string | UseAnalyticsArgs,
    session_id?: string,
    granule_id?: string,
    granule_title?: string
) {
    const args: UseAnalyticsArgs =
        typeof course_id_or_args === "string"
            ? { course_id: course_id_or_args, session_id, granule_id, granule_title }
            : course_id_or_args;

    const actual_session_id = args.session_id || getAnonymousSessionId();

    // Tracker une question posée à l'IA
    const trackAIQuestion = useCallback((questionText?: string) => {
        sendEvent({
            event_type: "ai_question_asked",
            session_id: actual_session_id,
            course_id: args.course_id,
            granule_id: args.granule_id,
            granule_title: args.granule_title,
            metadata: questionText ? { question_length: questionText.length } : {},
            timestamp: new Date().toISOString(),
        });
    }, [actual_session_id, args.course_id, args.granule_id, args.granule_title]);

    // Tracker une action rapide IA (résumer, expliquer, suggérer)
    const trackAIAction = useCallback((action: "summarize" | "explain" | "suggest") => {
        sendEvent({
            event_type: "ai_quick_action",
            session_id: actual_session_id,
            course_id: args.course_id,
            granule_id: args.granule_id,
            granule_title: args.granule_title,
            metadata: { action },
            timestamp: new Date().toISOString(),
        });
    }, [actual_session_id, args.course_id, args.granule_id, args.granule_title]);

    // Tracker une recherche
    const trackSearch = useCallback((query: string) => {
        sendEvent({
            event_type: "search_performed",
            session_id: actual_session_id,
            course_id: args.course_id,
            metadata: { query_length: query.length },
            timestamp: new Date().toISOString(),
        });
    }, [actual_session_id, args.course_id]);


    const trackSession = useCallback(async (timeSpentSeconds: number, successRate?: number, specificGranuleId?: string) => {
        const targetGranule = specificGranuleId || args.granule_id;
        if (!args.course_id || !targetGranule) return;
        if (!isUuidLike(targetGranule)) return;

        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    course_id: args.course_id,
                    granule_id: targetGranule,
                    time_spent: Math.round(timeSpentSeconds),
                    success_rate: successRate ?? null
                })
            });
            console.log(`[Analytics] Session trackée: ${timeSpentSeconds}s`);
        } catch (err) {
            console.error("[Analytics] Échec du tracking Django", err);
        }
    }, [args.course_id, args.granule_id]);

    // Tracking silencieux du temps passé sur un granule (granule time-on-page)
    const startTimeRef = useRef<number | null>(null);
    const lastGranuleIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Ne tracker que si granule_id est un UUID valide
        if (!args.granule_id || !isUuidLike(args.granule_id) || !args.course_id) return;

        const now = Date.now();
        if (startTimeRef.current === null) {
            startTimeRef.current = now;
            lastGranuleIdRef.current = args.granule_id;
            return;
        }

        // Si granule changé, on envoie le temps du granule précédent
        const prevGranuleId = lastGranuleIdRef.current;
        const prevStartTime = startTimeRef.current;

        if (prevGranuleId && prevStartTime && prevGranuleId !== args.granule_id) {
            const seconds = (now - prevStartTime) / 1000;
            if (seconds > 2) {
                trackSession(seconds, undefined, prevGranuleId);
            }
        }

        startTimeRef.current = now;
        lastGranuleIdRef.current = args.granule_id;
    }, [args.course_id, args.granule_id, trackSession]);

    useEffect(() => {
        return () => {
            const prevGranuleId = lastGranuleIdRef.current;
            const prevStartTime = startTimeRef.current;
            if (!prevGranuleId || !prevStartTime) return;
            const seconds = (Date.now() - prevStartTime) / 1000;
            if (seconds > 2) {
                trackSession(seconds, undefined, prevGranuleId);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackSession]);

    return {
        trackAIQuestion,
        trackAIAction,
        trackSearch,
        trackSession,
    };
}

// Hook simplifié pour les pages où on ne tracke qu'une recherche globale
export function useSearchAnalytics(session_id?: string) {
    const actual_session_id = session_id || getAnonymousSessionId();

    const trackSearch = useCallback((query: string) => {
        sendEvent({
            event_type: "search_performed",
            session_id: actual_session_id,
            course_id: "global",
            metadata: { query_length: query.length },
            timestamp: new Date().toISOString(),
        });
    }, [actual_session_id]);

    return { trackSearch };
}

