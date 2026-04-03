"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Modal IA Plein Écran
// components/ai/AIAgentModal.tsx
//
// 100% Tailwind CSS — variables XCSM respectées
// primary = vert (#16a34a en light, #4ade80 en dark)
// ─────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAIAgent } from "@/contexts/AIAgentContext";
import { buildQuickPrompt } from "@/services/aiService";
import type { AICapability } from "@/types/ai.types";
import AIMessage from "./AIMessage";
import AIContextBadge from "./AIContextBadge";
import AICapabilityCard from "./AICapabilityCard";

const CAPABILITIES: AICapability[] = [
  { id: "answer", label: "Poser une question", icon: "💬", promptType: null, },
  { id: "summarize", label: "Résumer ce contenu", icon: "📋", promptType: "summarize" },
  { id: "explain", label: "Expliquer simplement", icon: "💡", promptType: "explain" },
  { id: "suggest", label: "Notions connexes", icon: "🔗", promptType: "suggest" },
];

export default function AIAgentModal() {
  const { state, closeAgent, sendMessage, clearMessages } = useAIAgent();
  const { isOpen, isLoading, messages, context, error } = state;

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea à l'ouverture
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [isOpen]);

  // Fermeture Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) closeAgent(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeAgent]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(msg);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleCapability = async (cap: AICapability) => {
    if (cap.id === "answer" || !cap.promptType) {
      textareaRef.current?.focus();
      return;
    }
    await sendMessage(buildQuickPrompt(cap.promptType, context));
  };

  if (!isOpen) return null;

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Overlay ── */}
      <div
        aria-hidden="true"
        onClick={closeAgent}
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* ── Modal ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Assistant pédagogique XCSM"
        className="
          fixed inset-0 z-[9999] m-auto
          w-[min(800px,96vw)] h-[min(84vh,780px)]
          flex flex-col
          bg-background border border-border rounded-2xl
          shadow-2xl overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        "
      >

        {/* ── HEADER ── */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0 bg-background">
          <div className="flex items-center gap-3">
            {/* Icône XCSM */}
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="m-0 text-[15px] font-semibold text-foreground tracking-tight">
                Assistant XCSM
              </p>
              <p className="m-0 text-xs text-muted-foreground">
                Propulsé par Gemini · IA pédagogique
              </p>
            </div>
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearMessages}
                title="Nouvelle conversation"
                className="
                  flex items-center gap-1.5 px-3 py-1.5
                  text-xs text-black border border-border rounded-lg
                  hover:bg-primary hover:text-foreground transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                "
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12a9 9 0 1 1 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 7v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Nouvelle discussion
              </button>
            )}
            <button
              type="button"
              onClick={closeAgent}
              aria-label="Fermer l'assistant"
              className="
                w-8 h-8 flex items-center justify-center rounded-lg
                text-black border border-border
                hover:bg-red-500 hover:text-foreground transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              "
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── BADGE CONTEXTE ── */}
        {context && <AIContextBadge context={context} />}

        {/* ── CORPS ── */}
        <div className="flex-2 overflow-y-auto">

          {/* ── ÉCRAN D'ACCUEIL ── */}
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-full px-7 py-11 text-center">
              {/* Icône décorative */}
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-primary tracking-tight mb-2">
                Bonjour ! Je suis votre Assistant IA Pédagogique XCSM.
              </h2>

              <h2 className="text-xl font-semibold text-foreground tracking-tight mb-2">
                Comment puis-je vous aider aujourd'hui ?
              </h2>

              <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-7">
                {context
                  ? `Je connais le contenu de "${context.notionTitle ?? context.chapterTitle ?? context.courseTitle}". Posez vos questions ou utilisez une action rapide.`
                  : "Naviguez vers un cours pour que je puisse contextualiser mes réponses. Je peux répondre à vos questions, résumer des notions ou vous expliquer des concepts complexes.."}
              </p>

              {/* Grille des capacités */}
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-[460px]">
                {CAPABILITIES.map((cap) => (
                  <AICapabilityCard
                    key={cap.id}
                    capability={cap}
                    onClick={() => handleCapability(cap)}
                    disabled={isLoading || (cap.id !== "answer" && !context)}
                  />
                ))}
              </div>

              {/* Exemples de questions */}
              <div className="mt-7 w-full max-w-[460px]">
                <p className="text-xs text-muted-foreground mb-2.5 text-left font-medium">
                  Questions fréquentes sur XCSM :
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Comment importer un document ?",
                    "Qu'est-ce qu'un granule ?",
                    "Comment rejoindre un cours ?",
                    "Comment exporter en DOCX ?",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                      className="
                        text-xs px-3 py-1.5 rounded-full
                        bg-muted text-muted-foreground border border-border
                        hover:bg-primary/5 hover:text-primary hover:border-primary
                        transition-colors disabled:opacity-40
                      "
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          ) : (
            /* ── MESSAGES ── */
            <div className="flex flex-col gap-4 px-5 py-5">
              {messages.map((m) => (
                <AIMessage key={m.id} message={m} />
              ))}

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Indicateur de chargement */}
              {isLoading && messages.at(-1)?.content === "" && (
                <div className="flex items-center gap-1.5 px-4 py-3 bg-muted rounded-2xl rounded-bl-sm w-fit">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {/* ── ACTIONS RAPIDES (après 1er message) ── */}
        {!isEmpty && context && (
          <div className="flex gap-2 px-4 py-2 border-t border-border flex-shrink-0 overflow-x-auto scrollbar-none">
            {CAPABILITIES.filter((c) => c.id !== "answer").map((cap) => (
              <button
                key={cap.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleCapability(cap)}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0
                  text-xs text-muted-foreground border border-border rounded-full
                  bg-background whitespace-nowrap
                  hover:bg-primary/5 hover:text-primary hover:border-primary
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                "
              >
                <span>{cap.icon}</span>
                {cap.label}
              </button>
            ))}
          </div>
        )}

        {/* ── ZONE DE SAISIE ── */}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2.5 px-4 py-3 border-t border-border flex-shrink-0 bg-background"
        >
          <textarea
            ref={textareaRef}
            value={input}
            disabled={isLoading}
            rows={1}
            placeholder={
              context
                ? `Question sur "${context.notionTitle ?? context.courseTitle}"…`
                : "Posez votre question…"
            }
            onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
            onKeyDown={handleKeyDown}
            className="
              flex-1 min-h-[42px] max-h-[120px] px-4 py-2.5 resize-none
              rounded-xl border border-input bg-muted
              text-sm text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors leading-relaxed
            "
            aria-label="Message à l'assistant"
          />

          {/* Bouton envoi */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Envoyer"
            className="
              w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center rounded-xl
              bg-primary text-primary-foreground
              hover:opacity-90 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            "
          >
            {isLoading ? (
              <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity=".3" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-muted-foreground pb-2.5 flex-shrink-0">
          L&apos;Assistant XCSM peut faire des erreurs. Vérifiez les informations importantes.
        </p>

      </div>
    </>
  );
}