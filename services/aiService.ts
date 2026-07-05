// ─────────────────────────────────────────────
// XCSM V3 — Service IA (streaming Gemini)
// ─────────────────────────────────────────────

import type { ChatMessage, GranuleContext, AIStreamChunk } from "@/types/ai.types";

export async function* streamAIResponse(
  message: string,
  context: GranuleContext | null,
  history: ChatMessage[]
): AsyncGenerator<AIStreamChunk> {
  let response: Response;

  try {
    response = await fetch("/api/ai/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context,
        history: history.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });
  } catch {
    yield { delta: "", done: true, error: "Impossible de contacter le serveur IA." };
    return;
  }

  if (!response.ok) {
    let errorMsg = `Erreur serveur (${response.status})`;
    try {
      const json = await response.json();
      errorMsg = json.error || errorMsg;
    } catch {
      /* ignore */
    }
    yield { delta: "", done: true, error: errorMsg };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { delta: "", done: true, error: "Flux de données indisponible." };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") { yield { delta: "", done: true }; return; }
        try {
          const chunk = JSON.parse(raw) as AIStreamChunk;
          if (chunk.error) { yield { delta: "", done: true, error: chunk.error }; return; }
          if (chunk.delta) yield { delta: chunk.delta, done: false };
        } catch { /* ligne malformée */ }
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { delta: "", done: true };
}

// ── Prompts prédéfinis ────────────────────────────────────────

/** Retire les balises HTML et décode les entités basiques pour donner du texte brut à l'IA. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildQuickPrompt(
  type: "summarize" | "explain" | "suggest",
  context: GranuleContext | null
): string {
  const title =
    context?.notionTitle ??
    context?.sectionTitle ??
    context?.chapterTitle ??
    context?.courseTitle ??
    "ce contenu";

  // Extrait le texte brut du contenu si disponible (max 4000 chars pour éviter de dépasser le contexte)
  const rawContent = context?.notionContent ? stripHtml(context.notionContent) : "";
  const contentBlock = rawContent.length > 20
    ? `\n\nVoici le contenu de cette notion :\n"""\n${rawContent.slice(0, 4000)}${rawContent.length > 4000 ? "\n[…]" : ""}\n"""`
    : "";

  const prompts = {
    summarize: `Génère un résumé clair et structuré de la notion "${title}".${contentBlock}\n\nUtilise des titres (##) et des listes à puces si pertinent. Sois concis et pédagogique.`,
    explain: `Explique la notion "${title}" de façon simple et accessible, avec des exemples concrets, comme si je débutais.${contentBlock}`,
    suggest: `Après avoir étudié "${title}", quelles notions connexes devrais-je explorer pour approfondir ma compréhension ?${contentBlock ? `\n\nContexte de la notion :${contentBlock}` : ""}`,
  } as const;

  return prompts[type];
}


// // ================================================================
// // XCSM V3 — Service IA : communication avec /api/ai/chat/stream
// // Fichier : services/aiService.ts
// // ================================================================

// import {
//   AIRequestPayload,
//   AIStreamChunk,
//   ChatMessage,
//   GranuleContext,
//   MessageRole,
// } from "@/types/ai.types";

// /**
//  * URL du endpoint streaming (route Next.js interne)
//  * Pas besoin de passer par le backend Python pour les appels Gemini.
//  * La clé API reste côté serveur dans les Route Handlers Next.js.
//  */
// const STREAM_URL = "/api/ai/chat/stream";

// // ─── Streaming SSE vers le Route Handler Next.js ──────────────
// export async function* streamMessageFromAI(
//   message: string,
//   context: GranuleContext | null,
//   history: ChatMessage[]
// ): AsyncGenerator<AIStreamChunk> {
//   const payload: AIRequestPayload = {
//     message,
//     context,
//     history: history.slice(-10).map((m) => ({
//       role: m.role as MessageRole,
//       content: m.content,
//     })),
//   };

//   let response: Response;
//   try {
//     response = await fetch(STREAM_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "text/event-stream",
//       },
//       body: JSON.stringify(payload),
//     });
//   } catch {
//     yield { delta: "", done: true, error: "Impossible de contacter le serveur IA." };
//     return;
//   }

//   if (!response.ok) {
//     let msg = `Erreur serveur (${response.status})`;
//     try {
//       const json = await response.json();
//       msg = json.error || msg;
//     } catch { /* ignore */ }
//     yield { delta: "", done: true, error: msg };
//     return;
//   }

//   const reader = response.body?.getReader();
//   if (!reader) {
//     yield { delta: "", done: true, error: "Flux de données indisponible." };
//     return;
//   }

//   const decoder = new TextDecoder();
//   let buffer = "";

//   try {
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) {
//         yield { delta: "", done: true };
//         break;
//       }

//       buffer += decoder.decode(value, { stream: true });
//       const lines = buffer.split("\n");
//       buffer = lines.pop() ?? "";

//       for (const line of lines) {
//         if (!line.startsWith("data: ")) continue;
//         const raw = line.slice(6).trim();
//         if (raw === "[DONE]") {
//           yield { delta: "", done: true };
//           return;
//         }
//         try {
//           const parsed = JSON.parse(raw) as AIStreamChunk;
//           if (parsed.error) {
//             yield { delta: "", done: true, error: parsed.error };
//             return;
//           }
//           if (parsed.delta) yield { delta: parsed.delta, done: false };
//         } catch { /* ligne malformée, on ignore */ }
//       }
//     }
//   } finally {
//     reader.releaseLock();
//   }
// }

// // ─── Helpers : prompts prédéfinis ─────────────────────────────
// export function buildQuickPrompt(
//   type: "summarize" | "explain" | "suggest",
//   context: GranuleContext | null
// ): string {
//   const target =
//     context?.notionTitle ||
//     context?.sectionTitle ||
//     context?.chapterTitle ||
//     context?.courseTitle ||
//     "ce contenu";

//   switch (type) {
//     case "summarize":
//       return `Génère un résumé clair et structuré de "${target}". Utilise des titres et des listes si nécessaire.`;
//     case "explain":
//       return `Explique "${target}" de façon simple et accessible, comme si je n'avais aucune base sur le sujet. Utilise des analogies concrètes.`;
//     case "suggest":
//       return `Quelles notions connexes ou complémentaires devrais-je consulter après "${target}" pour approfondir ma compréhension ?`;
//   }
// }