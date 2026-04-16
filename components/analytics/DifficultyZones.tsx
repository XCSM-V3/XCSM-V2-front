"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Zones de Difficulté (Heatmap)
// components/analytics/DifficultyZones.tsx
// ─────────────────────────────────────────────

import React from "react";
import { AlertTriangle, MessageCircle, Clock, TrendingDown } from "lucide-react";
import type { GranuleMetric } from "@/types/analytics.types";

interface Props {
    granules: GranuleMetric[];
}

function DifficultyBar({ score }: { score: number }) {
    const color =
        score >= 75 ? "bg-destructive" :
            score >= 50 ? "bg-amber-500" :
                "bg-primary";

    return (
        <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className={`text-xs font-semibold w-8 text-right ${score >= 75 ? "text-destructive" :
                score >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-primary"
                }`}>
                {score}
            </span>
        </div>
    );
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${(seconds / 3600).toFixed(1)}h`;
}

export default function DifficultyZones({ granules }: Props) {
    const sorted = [...granules].sort((a, b) => b.difficulty_score - a.difficulty_score);
    const difficultZones = sorted.filter((g) => g.is_difficult_zone);
    const normalZones = sorted.filter((g) => !g.is_difficult_zone);

    return (
        <div className="space-y-4">
            {/* Zones difficiles */}
            {difficultZones.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <h4 className="text-sm font-semibold text-foreground">
                            Zones d&apos;ombre ({difficultZones.length})
                        </h4>
                        <span className="text-xs text-muted-foreground">Score de difficulté &gt; 65</span>
                    </div>
                    {difficultZones.map((g) => (
                        <GranuleRow key={g.granule_id} granule={g} isDifficult />
                    ))}
                </div>
            )}

            {/* Zones normales */}
            {normalZones.length > 0 && (
                <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h4 className="text-sm font-semibold text-foreground">
                            Contenu bien maîtrisé ({normalZones.length})
                        </h4>
                    </div>
                    {normalZones.map((g) => (
                        <GranuleRow key={g.granule_id} granule={g} isDifficult={false} />
                    ))}
                </div>
            )}

            {granules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune donnée disponible</p>
                    <p className="text-xs mt-1">Les métriques s&apos;afficheront une fois que des étudiants auront consulté ce cours</p>
                </div>
            )}
        </div>
    );
}

function GranuleRow({ granule, isDifficult }: { granule: GranuleMetric; isDifficult: boolean }) {
    return (
        <div className={`rounded-lg border p-3 transition-colors ${isDifficult
            ? "bg-destructive/5 border-destructive/20"
            : "bg-muted/50 border-border"
            }`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        {isDifficult && (
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-foreground truncate">
                            {granule.granule_title}
                        </p>
                    </div>
                    {granule.chapter_title && (
                        <p className="text-xs text-muted-foreground">{granule.chapter_title}</p>
                    )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${granule.completion_rate >= 70
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : granule.completion_rate >= 45
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                    {granule.completion_rate}% complété
                </span>
            </div>

            {/* Barre de difficulté */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Difficulté</span>
                <DifficultyBar score={granule.difficulty_score} />
            </div>

            {/* Métriques secondaires */}
            <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTime(granule.avg_time_seconds)} moy.
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="w-3 h-3" />
                    {granule.ai_questions_count} questions IA
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingDown className="w-3 h-3" />
                    {granule.views} vues
                </span>
            </div>
        </div>
    );
}