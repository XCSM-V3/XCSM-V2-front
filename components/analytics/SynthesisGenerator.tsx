"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Générateur de Fiches de Synthèse
// components/analytics/SynthesisGenerator.tsx
// Pour les étudiants — révision transversale
// ─────────────────────────────────────────────

import React, { useState } from "react";
import {
    FileText, Sparkles, Download, RefreshCw,
    Loader2, BookOpen, Target, Lightbulb
} from "lucide-react";
import type { GeneratedSynthesis } from "@/types/analytics.types";
// Synthèse : appel direct vers la route Next (Gemini)

interface Props {
    courseTitle: string;
    availableGranules: { id: string; title: string; content: string }[];
    courseId?: string; // --- AJOUT MODULE 3 ---
}

export default function SynthesisGenerator({ courseTitle, availableGranules, courseId }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [examFocus, setExamFocus] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [synthesis, setSynthesis] = useState<GeneratedSynthesis | null>(null);
    const [error, setError] = useState<string | null>(null);

    // (Plus de hook : on appelle directement l'API Next côté serveur)

    const toggleGranule = (id: string) =>
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    const selectAll = () => setSelectedIds(availableGranules.map((g) => g.id));
    const clearAll = () => setSelectedIds([]);

    const handleGenerate = async () => {
        if (selectedIds.length === 0) {
            setError("Veuillez sélectionner au moins un granule.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        // ====================================================================
        // Appel réel Gemini via la route Next
        // ====================================================================
        try {
            const selectedGranules = availableGranules
                .filter((g) => selectedIds.includes(g.id))
                .map((g) => ({ title: g.title, content: g.content }));

            const res = await fetch("/api/analytics/synthesis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    granules: selectedGranules,
                    course_title: courseTitle,
                    exam_focus: examFocus,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Erreur génération synthèse");
            }

            const data = await res.json();
            setSynthesis(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la génération de la synthèse.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="bg-muted/30 p-4 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Générateur de Synthèse
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Créez des fiches de révision personnalisées via l'IA
                    </p>
                </div>
            </div>

            {/* Contenu principal */}
            {!synthesis ? (
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-foreground">
                                Sélection des granules ({selectedIds.length}/{availableGranules.length})
                            </h4>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-xs text-primary hover:underline">Tout sélectionner</button>
                                <span className="text-muted-foreground text-xs">|</span>
                                <button onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Effacer</button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableGranules.map((granule) => (
                                <div
                                    key={granule.id}
                                    onClick={() => toggleGranule(granule.id)}
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedIds.includes(granule.id)
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-muted/50"
                                        }`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${selectedIds.includes(granule.id)
                                        ? "bg-primary border-primary"
                                        : "border-input"
                                        }`}>
                                        {selectedIds.includes(granule.id) && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-medium ${selectedIds.includes(granule.id) ? "text-primary" : "text-foreground"}`}>
                                            {granule.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                            {granule.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                        <button
                            onClick={() => setExamFocus(!examFocus)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${examFocus
                                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                : "border-border text-muted-foreground hover:bg-muted/50"
                                }`}
                        >
                            <Target className="w-4 h-4" />
                            Focus Examen
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || selectedIds.length === 0}
                        className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Générer la fiche</>
                        )}
                    </button>
                </div>
            ) : (
                /* Affichage du Résultat */
                <div className="p-5 flex-1 overflow-y-auto bg-muted/10">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setSynthesis(null)}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            <RefreshCw className="w-4 h-4" /> Nouvelle fiche
                        </button>
                        <button className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                            <Download className="w-4 h-4" /> Exporter PDF
                        </button>
                    </div>

                    <h4 className="text-xl font-bold text-foreground mb-4">{synthesis.title}</h4>

                    <div className="space-y-6 mb-6">
                        {synthesis.sections.map((section, idx) => (
                            <div key={idx} className="bg-background border border-border p-4 rounded-xl">
                                <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary/70" />
                                    {section.title}
                                </h5>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Mots clés */}
                    <div className="mb-6">
                        <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            Concepts clés à retenir
                        </h5>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {synthesis.key_concepts.map((c, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Conseils examen */}
                    {synthesis.exam_tips.length > 0 && (
                        <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <h5 className="text-sm font-semibold text-foreground">Points importants</h5>
                            </div>
                            <ul className="space-y-1.5">
                                {synthesis.exam_tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                        <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">✓</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
















// "use client";
// // ─────────────────────────────────────────────
// // XCSM V3 — Générateur de Fiches de Synthèse
// // components/analytics/SynthesisGenerator.tsx
// // Pour les étudiants — révision transversale
// // ─────────────────────────────────────────────

// import React, { useState } from "react";
// import {
//     FileText, Sparkles, Download, RefreshCw,
//     Loader2, BookOpen, Target, Lightbulb
// } from "lucide-react";
// import type { GeneratedSynthesis } from "@/types/analytics.types";

// interface Props {
//     courseTitle: string;
//     availableGranules: { id: string; title: string; content: string }[];
// }

// export default function SynthesisGenerator({ courseTitle, availableGranules }: Props) {
//     const [selectedIds, setSelectedIds] = useState<string[]>([]);
//     const [examFocus, setExamFocus] = useState(false);
//     const [isGenerating, setIsGenerating] = useState(false);
//     const [synthesis, setSynthesis] = useState<GeneratedSynthesis | null>(null);
//     const [error, setError] = useState<string | null>(null);

//     const toggleGranule = (id: string) =>
//         setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

//     const selectAll = () => setSelectedIds(availableGranules.map((g) => g.id));
//     const clearAll = () => setSelectedIds([]);

//     const handleGenerate = async () => {
//         if (selectedIds.length === 0) { setError("Sélectionnez au moins une notion"); return; }
//         setError(null);
//         setIsGenerating(true);
//         setSynthesis(null);

//         const granules = availableGranules
//             .filter((g) => selectedIds.includes(g.id))
//             .map((g) => ({ title: g.title, content: g.content }));

//         try {
//             const res = await fetch("/api/analytics/synthesis", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ granules, course_title: courseTitle, exam_focus: examFocus }),
//             });
//             if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
//             setSynthesis(await res.json());
//         } catch (err) {
//             setError(err instanceof Error ? err.message : "Erreur inconnue");
//         } finally {
//             setIsGenerating(false);
//         }
//     };

//     const handleExport = () => {
//         if (!synthesis) return;
//         const sections = synthesis.sections.map((s) =>
//             `## ${s.title}\n${s.content}\n_(Source : ${s.source_granule})_`
//         ).join("\n\n");
//         const concepts = synthesis.key_concepts.map((c) => `• ${c}`).join("\n");
//         const tips = synthesis.exam_tips.map((t) => `✓ ${t}`).join("\n");
//         const text = `${synthesis.title}\nCours : ${courseTitle}\n\n${sections}\n\n## Concepts clés\n${concepts}\n\n## Points importants\n${tips}`;
//         const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
//         const a = document.createElement("a");
//         a.href = URL.createObjectURL(blob);
//         a.download = `Synthese_${courseTitle.replace(/\s+/g, "_")}.txt`;
//         a.click();
//     };

//     return (
//         <div className="space-y-5">
//             {!synthesis ? (
//                 <div className="space-y-4">
//                     {/* Sélection */}
//                     <div>
//                         <div className="flex items-center justify-between mb-2">
//                             <label className="text-sm font-medium text-foreground">
//                                 Notions à synthétiser
//                                 <span className="text-muted-foreground font-normal ml-1">
//                                     ({selectedIds.length}/{availableGranules.length})
//                                 </span>
//                             </label>
//                             <div className="flex gap-2">
//                                 <button onClick={selectAll} className="text-xs text-primary hover:underline">Tout</button>
//                                 <span className="text-muted-foreground text-xs">·</span>
//                                 <button onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Aucun</button>
//                             </div>
//                         </div>
//                         <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
//                             {availableGranules.map((g) => (
//                                 <label
//                                     key={g.id}
//                                     className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedIds.includes(g.id)
//                                         ? "bg-primary/5 border-primary/40"
//                                         : "bg-muted/30 border-border hover:bg-muted/60"
//                                         }`}
//                                 >
//                                     <input
//                                         type="checkbox"
//                                         checked={selectedIds.includes(g.id)}
//                                         onChange={() => toggleGranule(g.id)}
//                                         className="w-4 h-4 accent-primary"
//                                     />
//                                     <span className="text-sm text-foreground truncate">{g.title}</span>
//                                 </label>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Mode examen */}
//                     <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
//                         <input
//                             type="checkbox"
//                             checked={examFocus}
//                             onChange={(e) => setExamFocus(e.target.checked)}
//                             className="w-4 h-4 accent-primary"
//                         />
//                         <div>
//                             <p className="text-sm font-medium text-foreground">Mode préparation examen</p>
//                             <p className="text-xs text-muted-foreground">Ajoute des conseils et points-clés orientés examen</p>
//                         </div>
//                         <Target className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
//                     </label>

//                     {error && (
//                         <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">⚠ {error}</p>
//                     )}

//                     <button
//                         onClick={handleGenerate}
//                         disabled={isGenerating || selectedIds.length === 0}
//                         className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                     >
//                         {isGenerating ? (
//                             <><Loader2 className="w-4 h-4 animate-spin" />Génération en cours…</>
//                         ) : (
//                             <><Sparkles className="w-4 h-4" />Générer la fiche de révision</>
//                         )}
//                     </button>
//                 </div>
//             ) : (
//                 <div className="space-y-4">
//                     {/* Header */}
//                     <div className="flex items-start justify-between">
//                         <div>
//                             <h4 className="font-semibold text-foreground leading-tight">{synthesis.title}</h4>
//                             <p className="text-xs text-muted-foreground mt-0.5">
//                                 {synthesis.sections.length} sections • {synthesis.key_concepts.length} concepts clés
//                             </p>
//                         </div>
//                         <div className="flex gap-2">
//                             <button onClick={handleExport}
//                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground hover:bg-accent transition-colors">
//                                 <Download className="w-3.5 h-3.5" />Exporter
//                             </button>
//                             <button onClick={() => setSynthesis(null)}
//                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary hover:bg-primary/20 transition-colors">
//                                 <RefreshCw className="w-3.5 h-3.5" />Nouveau
//                             </button>
//                         </div>
//                     </div>

//                     {/* Sections */}
//                     <div className="space-y-3">
//                         {synthesis.sections.map((section, i) => (
//                             <div key={i} className="border border-border rounded-xl p-4">
//                                 <div className="flex items-center gap-2 mb-2">
//                                     <div className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
//                                         <span className="text-[10px] font-bold">{i + 1}</span>
//                                     </div>
//                                     <h5 className="text-sm font-semibold text-foreground">{section.title}</h5>
//                                 </div>
//                                 <p className="text-sm text-foreground/80 leading-relaxed">{section.content}</p>
//                                 <p className="text-xs text-muted-foreground mt-2 italic">Source : {section.source_granule}</p>
//                             </div>
//                         ))}
//                     </div>

//                     {/* Concepts clés */}
//                     <div className="border border-primary/20 bg-primary/5 rounded-xl p-4">
//                         <div className="flex items-center gap-2 mb-3">
//                             <BookOpen className="w-4 h-4 text-primary" />
//                             <h5 className="text-sm font-semibold text-foreground">Concepts clés à retenir</h5>
//                         </div>
//                         <ul className="space-y-1.5">
//                             {synthesis.key_concepts.map((c, i) => (
//                                 <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
//                                     <span className="text-primary mt-0.5 flex-shrink-0">•</span>
//                                     {c}
//                                 </li>
//                             ))}
//                         </ul>
//                     </div>

//                     {/* Conseils examen */}
//                     {synthesis.exam_tips.length > 0 && (
//                         <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
//                             <div className="flex items-center gap-2 mb-3">
//                                 <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
//                                 <h5 className="text-sm font-semibold text-foreground">Points importants</h5>
//                             </div>
//                             <ul className="space-y-1.5">
//                                 {synthesis.exam_tips.map((tip, i) => (
//                                     <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
//                                         <span className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">✓</span>
//                                         {tip}
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }