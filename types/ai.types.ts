// ─────────────────────────────────────────────
// XCSM V3 — Types Agent IA
// ─────────────────────────────────────────────

/** Gemini utilise "model", pas "assistant" */
export type MessageRole = "user" | "model";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

/** Contexte pédagogique courant injecté depuis les pages */
export interface GranuleContext {
  courseId: string;
  courseTitle: string;
  partTitle?: string;
  chapterTitle?: string;
  sectionTitle?: string;
  notionTitle?: string;
  notionContent?: string;
  level: "cours" | "partie" | "chapitre" | "section" | "notion";
}

export interface AICapability {
  id: "answer" | "summarize" | "explain" | "suggest";
  label: string;
  icon: string;
  promptType: "summarize" | "explain" | "suggest" | null;
}

export interface AIAgentState {
  isOpen: boolean;
  isLoading: boolean;
  messages: ChatMessage[];
  context: GranuleContext | null;
  error: string | null;
}

export interface AIStreamChunk {
  delta: string;
  done: boolean;
  error?: string;
}



// // ================================================================
// // XCSM V3 — Types pour l'Agent IA Pédagogique (Gemini)
// // Fichier : types/ai.types.ts
// // ================================================================

// export type MessageRole = "user" | "model"; // Gemini utilise "model" (pas "assistant")

// export interface ChatMessage {
//   id: string;
//   role: MessageRole;
//   content: string;
//   timestamp: Date;
//   isStreaming?: boolean;
// }

// /**
//  * Contexte pédagogique courant — alimenté depuis les pages de cours
//  * via le hook useGranuleContext()
//  */
// export interface GranuleContext {
//   courseId: string;
//   courseTitle: string;
//   partTitle?: string;
//   chapterTitle?: string;
//   sectionTitle?: string;
//   notionTitle?: string;
//   notionContent?: string;
//   level: "cours" | "partie" | "chapitre" | "section" | "notion";
// }

// export interface AICapability {
//   id: "answer" | "summarize" | "explain" | "suggest";
//   label: string;
//   icon: string;
//   promptTemplate: string | null; // null = saisie libre
// }

// export interface AIAgentState {
//   isOpen: boolean;
//   isLoading: boolean;
//   messages: ChatMessage[];
//   context: GranuleContext | null;
//   error: string | null;
// }

// export interface AIRequestPayload {
//   message: string;
//   context: GranuleContext | null;
//   history: { role: MessageRole; content: string }[];
// }

// export interface AIStreamChunk {
//   delta: string;
//   done: boolean;
//   error?: string;
// }