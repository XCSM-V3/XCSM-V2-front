"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Générateur de QCM par IA
// components/analytics/QCMGenerator.tsx
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
    Sparkles, Download, RefreshCw, CheckCircle,
    XCircle, ChevronDown, ChevronUp, Loader2, BookOpen
} from "lucide-react";
import type { GeneratedQCM, QCMQuestion } from "../../types/analytics.types";

interface Props {
    courseId: string;
    courseTitle: string;
    /** Granules disponibles pour sélection */
    availableGranules: { id: string; title: string; content: string }[];
}

export default function QCMGenerator({ courseId, courseTitle, availableGranules }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState<"facile" | "moyen" | "difficile" | "mixte">("mixte");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQCM, setGeneratedQCM] = useState<GeneratedQCM | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedQ, setExpandedQ] = useState<string | null>(null);
    const [showAnswers, setShowAnswers] = useState(false);

    const toggleGranule = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (selectedIds.length === 0) {
            setError("Sélectionnez au moins une notion");
            return;
        }
        setError(null);
        setIsGenerating(true);
        setGeneratedQCM(null);

        const selected = availableGranules.filter((g) => selectedIds.includes(g.id));
        const granule_content = selected.map((g) => `${g.title}:\n${g.content}`).join("\n\n---\n\n");
        const granule_titles = selected.map((g) => g.title).join(", ");

        try {
            const res = await fetch("/api/analytics/qcm-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    granule_content,
                    granule_titles,
                    course_title: courseTitle,
                    num_questions: numQuestions,
                    difficulty,
                    granule_ids: selectedIds,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Erreur génération");
            }

            const data = await res.json();
            setGeneratedQCM(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = () => {
        if (!generatedQCM) return;
        const text = generatedQCM.questions
            .map((q, i) => {
                const opts = q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}) ${o}`).join("\n");
                const answer = `Réponse : ${String.fromCharCode(65 + q.correct_index)}) ${q.options[q.correct_index]}`;
                const expl = `Explication : ${q.explanation}`;
                return `${i + 1}. ${q.question}\n${opts}\n${showAnswers ? `\n${answer}\n${expl}` : ""}`;
            })
            .join("\n\n");

        const full = `${generatedQCM.title}\nCours : ${generatedQCM.course_title}\nGénéré le : ${new Date(generatedQCM.generated_at).toLocaleDateString("fr-FR")}\n\n${"=".repeat(50)}\n\n${text}`;
        const blob = new Blob([full], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `QCM_${courseTitle.replace(/\s+/g, "_")}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            {/* Configuration */}
            {!generatedQCM && (
                <div className="space-y-4">
                    {/* Sélection des notions */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Notions source
                            <span className="text-muted-foreground font-normal ml-1">
                                ({selectedIds.length} sélectionnée{selectedIds.length > 1 ? "s" : ""})
                            </span>
                        </label>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {availableGranules.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-3 text-center">
                                    Aucune notion disponible — importez d&apos;abord un document
                                </p>
                            ) : (
                                availableGranules.map((g) => (
                                    <label
                                        key={g.id}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedIds.includes(g.id)
                                            ? "bg-primary/5 border-primary/40"
                                            : "bg-muted/30 border-border hover:bg-muted/60"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(g.id)}
                                            onChange={() => toggleGranule(g.id)}
                                            className="w-4 h-4 accent-primary"
                                        />
                                        <span className="text-sm text-foreground truncate">{g.title}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Paramètres */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                                Nombre de questions
                            </label>
                            <input
                                type="range"
                                min={3}
                                max={10}
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full accent-primary"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                                <span>3</span>
                                <span className="font-semibold text-primary">{numQuestions} questions</span>
                                <span>10</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                                Difficulté
                            </label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                                className="w-full rounded-lg border border-input bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="mixte">Mixte (recommandé)</option>
                                <option value="facile">Facile</option>
                                <option value="moyen">Moyen</option>
                                <option value="difficile">Difficile</option>
                            </select>
                        </div>
                    </div>

                    {/* Erreur */}
                    {error && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                            ⚠ {error}
                        </p>
                    )}

                    {/* Bouton générer */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || selectedIds.length === 0 || availableGranules.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Génération en cours…
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Générer le QCM avec l&apos;IA
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* QCM généré */}
            {generatedQCM && (
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-semibold text-foreground">{generatedQCM.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {generatedQCM.questions.length} questions • Généré le{" "}
                                {new Date(generatedQCM.generated_at).toLocaleDateString("fr-FR")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showAnswers}
                                    onChange={(e) => setShowAnswers(e.target.checked)}
                                    className="accent-primary w-3.5 h-3.5"
                                />
                                Corrigé
                            </label>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Exporter
                            </button>
                            <button
                                onClick={() => setGeneratedQCM(null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary hover:bg-primary/20 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Nouveau
                            </button>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                        {generatedQCM.questions.map((q, i) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                index={i}
                                showAnswer={showAnswers}
                                isExpanded={expandedQ === q.id}
                                onToggle={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function QuestionCard({
    question, index, showAnswer, isExpanded, onToggle,
}: {
    question: QCMQuestion;
    index: number;
    showAnswer: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const diffColor = {
        facile: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        moyen: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        difficile: "bg-destructive/10 text-destructive",
    }[question.difficulty];

    return (
        <div className="border border-border rounded-xl overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {index + 1}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-snug">{question.question}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor}`}>
                        {question.difficulty}
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-border bg-muted/20">
                    <div className="pt-3 space-y-1.5">
                        {question.options.map((opt, j) => {
                            const letter = String.fromCharCode(65 + j);
                            const isCorrect = j === question.correct_index;
                            return (
                                <div
                                    key={j}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${showAnswer && isCorrect
                                        ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                                        : "bg-background border border-border text-foreground"
                                        }`}
                                >
                                    <span className={`font-semibold w-5 flex-shrink-0 ${showAnswer && isCorrect ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                                        }`}>
                                        {letter}
                                    </span>
                                    {opt}
                                    {showAnswer && isCorrect && (
                                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {showAnswer && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">💡 Explication</p>
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{question.explanation}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}