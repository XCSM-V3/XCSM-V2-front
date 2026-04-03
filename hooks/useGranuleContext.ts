"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Hooks Agent IA
// ─────────────────────────────────────────────

import { useEffect } from "react";
import { useAIAgent } from "@/contexts/AIAgentContext";
import { buildQuickPrompt } from "@/services/aiService";
import type { GranuleContext } from "@/types/ai.types";

/**
 * Injecte automatiquement le contexte pédagogique courant dans l'agent.
 * À appeler dans les pages de cours / lecture.
 */
export function useGranuleContext(context: GranuleContext) {
  const { setContext } = useAIAgent();
  useEffect(() => {
    setContext(context);
    // Deps : on ne réagit qu'aux changements de contenu réels
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.courseId, context.notionTitle, context.sectionTitle, context.chapterTitle]);
}

/**
 * Actions rapides : ouvre le modal et envoie un prompt pré-rempli.
 */
export function useAIQuickAction() {
  const { openAgent, sendMessage, state } = useAIAgent();

  const ask = async (prompt: string) => {
    if (!state.isOpen) openAgent();
    await new Promise((r) => setTimeout(r, 180));
    await sendMessage(prompt);
  };

  return {
    ask,
    summarize:  () => ask(buildQuickPrompt("summarize", state.context)),
    explain:    () => ask(buildQuickPrompt("explain",   state.context)),
    suggest:    () => ask(buildQuickPrompt("suggest",   state.context)),
    isOpen:     state.isOpen,
    isLoading:  state.isLoading,
    hasContext:  !!state.context,
  };
}



// "use client";
// // ================================================================
// // XCSM V3 — Hooks utilitaires Agent IA
// // Fichier : hooks/useGranuleContext.ts
// // ================================================================

// import { useEffect } from "react";
// import { useAIAgent } from "@/contexts/AIAgentContext";
// import { GranuleContext } from "@/types/ai.types";
// import { buildQuickPrompt } from "@/services/aiService";

// /**
//  * À appeler dans les pages de cours/lecture pour injecter le contexte
//  * pédagogique courant dans l'Agent IA.
//  *
//  * @example
//  * useGranuleContext({
//  *   courseId: cours.id,
//  *   courseTitle: cours.titre,
//  *   chapterTitle: chapitre.titre,
//  *   notionTitle: granule.titre,
//  *   notionContent: granule.contenu?.html_content,
//  *   level: "notion",
//  * });
//  */
// export function useGranuleContext(context: GranuleContext) {
//   const { setContext } = useAIAgent();

//   useEffect(() => {
//     setContext(context);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     context.courseId,
//     context.notionTitle,
//     context.sectionTitle,
//     context.chapterTitle,
//   ]);
// }

// /**
//  * Ouvre le modal IA et envoie immédiatement un message.
//  * Utile pour les boutons "Demander à l'IA" positionnés sur une notion.
//  */
// export function useAIQuickAction() {
//   const { openAgent, sendMessage, state } = useAIAgent();

//   const askAbout = async (prompt: string) => {
//     if (!state.isOpen) openAgent();
//     // Légère pause pour laisser le modal s'ouvrir (animation)
//     await new Promise((r) => setTimeout(r, 180));
//     await sendMessage(prompt);
//   };

//   const summarizeCurrent = () =>
//     askAbout(buildQuickPrompt("summarize", state.context));

//   const explainCurrent = () =>
//     askAbout(buildQuickPrompt("explain", state.context));

//   const suggestRelated = () =>
//     askAbout(buildQuickPrompt("suggest", state.context));

//   return {
//     askAbout,
//     summarizeCurrent,
//     explainCurrent,
//     suggestRelated,
//     isOpen: state.isOpen,
//     isLoading: state.isLoading,
//     hasContext: !!state.context,
//   };
// }