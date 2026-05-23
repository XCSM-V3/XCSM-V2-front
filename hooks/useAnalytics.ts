"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Hook de tracking Analytics
// hooks/useAnalytics.ts
//
// RGPD : session_id anonymisé (hash, pas d'ID utilisateur)
// Les données sont agrégées côté serveur avant stockage
// ─────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventType, TrackingEvent, AnalyticsData, SynthesisResponse } from "@/types/analytics.types";
import { useToast } from "@/components/ui/use-toast";

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

export function useAnalytics(course_id: string, session_id?: string, granule_id?: string, granule_title?: string) {
    const actual_session_id = session_id || getAnonymousSessionId();
    const { toast } = useToast();

    // ── AJOUT MODULE 3: États locaux pour le Dashboard et l'IA ──
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Tracker une question posée à l'IA
    const trackAIQuestion = useCallback((questionText?: string) => {
        sendEvent({
            event_type: "ai_question_asked",
            session_id: actual_session_id,
            course_id,
            granule_id,
            granule_title,
            metadata: questionText ? { question_length: questionText.length } : {},
            timestamp: new Date().toISOString(),
        });
    }, [actual_session_id, course_id, granule_id, granule_title]);

    // Tracker une action rapide IA (résumer, expliquer, suggérer)
    const trackAIAction = useCallback((action: "summarize" | "explain" | "suggest") => {
        sendEvent({
            event_type: "ai_quick_action",
            session_id: actual_session_id,
            course_id,
            granule_id,
            granule_title,
            metadata: { action },
            timestamp: new Date().toISOString(),
        });
    }, [actual_session_id, course_id, granule_id, granule_title]);

    // Tracker une recherche
    const trackSearch = useCallback((query: string) => {
        sendEvent({
            event_type: "search_performed",
            session_id: actual_session_id,
            course_id,
            metadata: { query_length: query.length },
            timestamp: new Date().toISOString(),
        });
    }, [actual_session_id, course_id]);


    // ========================================================================
    // --- AJOUTS MODULE 3 : FONCTIONS BACKEND DJANGO ---
    // ========================================================================

    const fetchDashboardData = useCallback(async () => {
        if (!course_id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/analytics/dashboard/?course_id=${course_id}`);
            const result = await response.json();
            if (response.ok) {
                setData(result);
                setError(null);
            } else {
                setError(result.error || "Erreur lors du chargement des statistiques");
            }
        } catch (err: any) {
            setError(err.message || "Erreur réseau");
        } finally {
            setIsLoading(false);
        }
    }, [course_id]);

    const generateSynthesis = async (): Promise<string | null> => {
        if (!course_id) return null;
        try {
            const response = await fetch('/api/v1/analytics/synthesis/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id })
            });
            const result = await response.json();
            return result.synthesis;
        } catch (err: any) {
            toast({
                title: "Erreur IA",
                description: "Impossible de générer la synthèse pédagogique via Gemini.",
                variant: "destructive",
            });
            return null;
        }
    };

    const trackSession = useCallback(async (timeSpentSeconds: number, successRate?: number, specificGranuleId?: string) => {
        const targetGranule = specificGranuleId || granule_id;
        if (!course_id || !targetGranule) return;
        try {
            await fetch('/api/v1/analytics/track/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: course_id,
                    granule_id: targetGranule,
                    time_spent: Math.round(timeSpentSeconds),
                    success_rate: successRate
                })
            });
            console.log(`[Analytics] Session Django trackée: ${timeSpentSeconds}s`);
        } catch (err) {
            console.error("[Analytics] Échec du tracking Django", err);
        }
    }, [course_id, granule_id]);

    return {
        trackAIQuestion,
        trackAIAction,
        trackSearch,
        // Nouveaux retours Module 3:
        data,
        isLoading,
        error,
        fetchDashboardData,
        generateSynthesis,
        trackSession
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































// "use client";
// // ─────────────────────────────────────────────
// // XCSM V3 — Hook de tracking Analytics
// // hooks/useAnalytics.ts
// //
// // RGPD : session_id anonymisé (hash, pas d'ID utilisateur)
// // Les données sont agrégées côté serveur avant stockage
// // ─────────────────────────────────────────────

// import { useCallback, useEffect, useRef } from "react";
// import type { EventType, TrackingEvent } from "@/types/analytics.types";

// // Génère un ID de session anonyme persistant dans sessionStorage
// function getAnonymousSessionId(): string {
//     if (typeof window === "undefined") return "ssr";
//     const key = "xcsm_anon_session";
//     let id = sessionStorage.getItem(key);
//     if (!id) {
//         // Hash aléatoire non réversible — pas de lien avec l'utilisateur
//         id = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
//         sessionStorage.setItem(key, id);
//     }
//     return id;
// }

// // Envoie un événement à la route API interne Next.js
// async function sendEvent(event: TrackingEvent): Promise<void> {
//     try {
//         await fetch("/api/analytics/track", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(event),
//             // keepalive permet l'envoi même si la page se ferme
//             keepalive: true,
//         });
//     } catch {
//         // Tracking non-bloquant : on ignore les erreurs silencieusement
//     }
// }

// interface UseAnalyticsOptions {
//     course_id: string;
//     granule_id?: string;
//     granule_title?: string;
// }

// export function useAnalytics({ course_id, granule_id, granule_title }: UseAnalyticsOptions) {
//     const session_id = getAnonymousSessionId();
//     const startTimeRef = useRef<number>(Date.now());
//     const hasTrackedStartRef = useRef(false);

//     // Tracker le début de consultation d'un granule
//     useEffect(() => {
//         if (!granule_id || hasTrackedStartRef.current) return;
//         hasTrackedStartRef.current = true;
//         startTimeRef.current = Date.now();

//         sendEvent({
//             event_type: "granule_view_start",
//             session_id,
//             course_id,
//             granule_id,
//             granule_title,
//             timestamp: new Date().toISOString(),
//         });

//         // Tracker la fin quand l'utilisateur quitte (unmount ou fermeture de page)
//         return () => {
//             const duration_seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
//             // Ignorer les durées trop courtes (<2s = accidentel)
//             if (duration_seconds < 2) return;

//             sendEvent({
//                 event_type: "granule_view_end",
//                 session_id,
//                 course_id,
//                 granule_id,
//                 granule_title,
//                 duration_seconds,
//                 timestamp: new Date().toISOString(),
//             });
//         };
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [granule_id]);

//     // Tracker une question posée à l'IA
//     const trackAIQuestion = useCallback((questionText?: string) => {
//         sendEvent({
//             event_type: "ai_question_asked",
//             session_id,
//             course_id,
//             granule_id,
//             granule_title,
//             metadata: questionText ? { question_length: questionText.length } : {},
//             timestamp: new Date().toISOString(),
//         });
//     }, [session_id, course_id, granule_id, granule_title]);

//     // Tracker une action rapide IA (résumer, expliquer, suggérer)
//     const trackAIAction = useCallback((action: "summarize" | "explain" | "suggest") => {
//         sendEvent({
//             event_type: "ai_quick_action",
//             session_id,
//             course_id,
//             granule_id,
//             granule_title,
//             metadata: { action },
//             timestamp: new Date().toISOString(),
//         });
//     }, [session_id, course_id, granule_id, granule_title]);

//     // Tracker une recherche
//     const trackSearch = useCallback((query: string) => {
//         sendEvent({
//             event_type: "search_performed",
//             session_id,
//             course_id,
//             metadata: { query_length: query.length },
//             timestamp: new Date().toISOString(),
//         });
//     }, [session_id, course_id]);

//     return { trackAIQuestion, trackAIAction, trackSearch };
// }

// // Hook simplifié pour les pages sans granule (ex: page accueil cours)
// export function usePageTracking(course_id: string) {
//     return useAnalytics({ course_id });
// }