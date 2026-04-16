// ─────────────────────────────────────────────
// XCSM V3 — Types Analytics & Navigation
// types/analytics.types.ts
// ─────────────────────────────────────────────

// ── Événements de tracking (RGPD : pas d'ID perso, session anonymisée) ──
export type EventType =
    | "granule_view_start"
    | "granule_view_end"
    | "ai_question_asked"
    | "ai_quick_action"
    | "course_completed"
    | "search_performed"
    | "navigation_jump";

export interface TrackingEvent {
    event_type: EventType;
    session_id: string;       // Hash anonyme côté client
    course_id: string;
    granule_id?: string;
    granule_title?: string;
    duration_seconds?: number; // Temps passé sur le granule
    metadata?: Record<string, string | number>;
    timestamp: string;         // ISO string
}

// ── Métriques agrégées pour le dashboard enseignant ──
export interface GranuleMetric {
    granule_id: string;
    granule_title: string;
    chapter_title?: string;
    section_title?: string;
    views: number;
    unique_sessions: number;
    avg_time_seconds: number;
    ai_questions_count: number;
    difficulty_score: number;    // 0-100 : basé sur questions IA + temps
    completion_rate: number;     // % sessions qui arrivent jusqu'à la fin
    is_difficult_zone: boolean;  // true si difficulty_score > 65
}

export interface CourseAnalytics {
    course_id: string;
    course_title: string;
    total_views: number;
    unique_learners: number;
    avg_completion_rate: number;
    avg_session_duration: number;
    total_ai_interactions: number;
    difficult_zones: GranuleMetric[];
    most_consulted: GranuleMetric[];
    least_consulted: GranuleMetric[];
    granule_metrics: GranuleMetric[];
    alert_count: number;
    period_days: number;
}

export interface PedagogicalAlert {
    id: string;
    type: "difficult_zone" | "low_completion" | "high_ai_demand" | "navigation_dropout";
    severity: "info" | "warning" | "critical";
    course_id: string;
    course_title: string;
    granule_id?: string;
    granule_title?: string;
    message: string;
    detail: string;
    percentage: number;        // Ex: 60% des étudiants ont demandé de l'aide
    created_at: string;
    is_read: boolean;
}

// ── QCM généré par IA ──
export interface QCMQuestion {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
    difficulty: "facile" | "moyen" | "difficile";
    granule_source: string;
}

export interface GeneratedQCM {
    title: string;
    course_title: string;
    questions: QCMQuestion[];
    generated_at: string;
    granule_ids: string[];
}

// ── Fiche de synthèse ──
export interface SynthesisSection {
    title: string;
    content: string;
    source_granule: string;
}

export interface GeneratedSynthesis {
    title: string;
    sections: SynthesisSection[];
    key_concepts: string[];
    exam_tips: string[];
    generated_at: string;
}

// ── Suggestions de navigation ──
export interface NavigationSuggestion {
    granule_id: string;
    granule_title: string;
    course_title: string;
    reason: string;
    popularity_score: number;
    relevance_score: number;
}

// ── Dashboard state ──
export interface DashboardState {
    analytics: CourseAnalytics | null;
    alerts: PedagogicalAlert[];
    isLoading: boolean;
    error: string | null;
    selectedCourseId: string | null;
    period: 7 | 14 | 30;
}