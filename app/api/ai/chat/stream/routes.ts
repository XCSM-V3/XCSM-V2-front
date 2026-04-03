// ─────────────────────────────────────────────
// XCSM V3 — Route API Streaming Gemini
// app/api/ai/chat/stream/route.ts
//
// La clé GEMINI_API_KEY reste CÔTÉ SERVEUR (jamais exposée au client)
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ── Prompt système XCSM ──────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant pédagogique intelligent de la plateforme XCSM (eXtended Content Structured Module).

## Qui tu es
XCSM est une plateforme de gestion et diffusion de contenus pédagogiques pour l'enseignement supérieur, développée par des étudiants de l'ENSPY (École Nationale Supérieure Polytechnique de Yaoundé I, Cameroun), sous la supervision du Professeur BATCHAKUI Bernabé.

## La plateforme XCSM — ce que tu SAIS
- **Rôles** : Enseignant (crée des cours, importe des documents) et Étudiant (s'inscrit aux cours, consulte les granules)
- **Structure hiérarchique** : Cours → Parties → Chapitres → Sections → Notions (granules atomiques)
- **Import de documents** : PDF et DOCX sont automatiquement découpés en granules pédagogiques via un moteur de parsing
- **Bases de données** : MySQL pour les utilisateurs/auth, MongoDB pour les granules (contenus pédagogiques)
- **Backend** : Serveur applicatif Django (Python) déployé sur Render (https://granule.onrender.com)
- **Frontend** : Next.js 15 (App Router) déployé sur Vercel (https://xcsm-frontend-app.vercel.app)
- **Fonctionnalités** : Éditeur de cours, import PDF/DOCX, recherche de granules, dashboard étudiant/enseignant, navigation hiérarchique, export DOCX, mode lecture immersif
- **Version actuelle** : V3 (en cours de développement) — ajoute l'IA pédagogique (toi !), les analytics, la collaboration et la segmentation ML

## Tes responsabilités
1. Répondre aux questions sur le **contenu pédagogique** affiché (notion, chapitre, cours)
2. Générer des **résumés** clairs et structurés
3. **Expliquer** simplement des concepts complexes avec des exemples concrets
4. **Suggérer** des notions connexes à explorer pour approfondir
5. Répondre aux questions **générales sur XCSM** (fonctionnement, navigation, fonctionnalités)
6. Aider les étudiants à **comprendre comment utiliser la plateforme**

## Règles
- Réponds TOUJOURS en **français**, ton bienveillant et pédagogique
- Si le contenu d'une notion est fourni dans le contexte, base tes réponses dessus en priorité
- Utilise **Markdown** : titres, listes, gras pour structurer tes réponses
- Sois concis (max 400 mots sauf pour les résumés complets)
- Si tu ne sais pas quelque chose de précis sur XCSM, dis-le honnêtement
- Pour les questions hors périmètre, redirige vers le contenu XCSM disponible`;

// ── Injection du contexte pédagogique ────────
function contextBlock(ctx: Record<string, string> | null): string {
  if (!ctx) return "";

  const lines: string[] = ["\n\n---\n## Contexte pédagogique actuel"];
  if (ctx.courseTitle)   lines.push(`📚 **Cours** : ${ctx.courseTitle}`);
  if (ctx.partTitle)     lines.push(`📂 **Partie** : ${ctx.partTitle}`);
  if (ctx.chapterTitle)  lines.push(`📖 **Chapitre** : ${ctx.chapterTitle}`);
  if (ctx.sectionTitle)  lines.push(`📑 **Section** : ${ctx.sectionTitle}`);
  if (ctx.notionTitle)   lines.push(`🔬 **Notion** : ${ctx.notionTitle}`);

  if (ctx.notionContent) {
    // Extraire le texte brut du HTML, limiter à 3000 chars
    const text = ctx.notionContent
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    lines.push(`\n📝 **Contenu de la notion** :\n${text}`);
  }

  lines.push("---");
  return lines.join("\n");
}

// ── POST handler ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      context = null,
      history = [],
    } = body as {
      message: string;
      context: Record<string, string> | null;
      history: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      return Response.json({ error: "Message manquant" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT + contextBlock(context),
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,   threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,  threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1500,
      },
    });

    // Historique au format Gemini
    const geminiHistory = history
      .slice(-10)
      .filter((m) => m.role === "user" || m.role === "model")
      .map((m) => ({
        role: m.role as "user" | "model",
        parts: [{ text: m.content }],
      }));

    const chat   = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessageStream(message);

    const encoder = new TextEncoder();
    const stream  = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: text, done: false })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erreur Gemini";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta: "", done: true, error: msg })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection":    "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[XCSM AI]", err);
    return Response.json({ error: "Erreur interne du serveur IA" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "ok", model: "gemini-1.5-flash" });
}



// // ================================================================
// // XCSM V3 — Route API Streaming : /api/ai/chat/stream
// // Fichier : app/api/ai/chat/stream/route.ts
// //
// // ⚠️  La clé GEMINI_API_KEY doit être dans .env.local
// //     Elle n'est JAMAIS exposée au client.
// // ================================================================

// import { NextRequest } from "next/server";
// import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// // ─── Client Gemini (côté serveur uniquement) ──────────────────
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// // ─── Prompt système XCSM ─────────────────────────────────────
// const SYSTEM_INSTRUCTION = `Tu es l'assistant pédagogique intelligent de la plateforme XCSM (eXtended Content Structured Module).
// XCSM est une plateforme de gestion et diffusion de contenus pédagogiques pour l'enseignement supérieur, développée à l'ENSPY (École Nationale Supérieure Polytechnique de Yaoundé).

// Tes responsabilités :
// - Aider les étudiants à comprendre et maîtriser les contenus pédagogiques (Cours → Parties → Chapitres → Sections → Notions)
// - Générer des résumés clairs, structurés et pédagogiquement pertinents
// - Expliquer les concepts de façon progressive, du simple au complexe
// - Suggérer des notions connexes à explorer pour approfondir la compréhension
// - Répondre avec précision aux questions portant sur le contenu affiché

// Règles impératives :
// - Réponds TOUJOURS en français, avec un ton bienveillant et pédagogique
// - Adapte ton niveau de langage au contexte fourni (lycée, licence, master…)
// - Si le contenu d'une notion est fourni, base-toi prioritairement dessus
// - Structure tes réponses : utilise des **titres**, des listes et des exemples concrets
// - Sois concis (max 400 mots) sauf pour les résumés complets
// - N'invente pas d'information hors du contexte fourni
// - Si une question est hors périmètre pédagogique, redirige poliment vers le contenu XCSM`;

// // ─── Construction du contexte pédagogique injecté ─────────────
// function buildContextBlock(ctx: Record<string, string> | null): string {
//   if (!ctx) return "";
//   const parts: string[] = ["\n\n=== CONTEXTE PÉDAGOGIQUE ACTUEL ==="];
//   if (ctx.courseTitle) parts.push(`📚 Cours : ${ctx.courseTitle}`);
//   if (ctx.partTitle) parts.push(`📂 Partie : ${ctx.partTitle}`);
//   if (ctx.chapterTitle) parts.push(`📖 Chapitre : ${ctx.chapterTitle}`);
//   if (ctx.sectionTitle) parts.push(`📑 Section : ${ctx.sectionTitle}`);
//   if (ctx.notionTitle) parts.push(`🔬 Notion : ${ctx.notionTitle}`);
//   if (ctx.notionContent) {
//     // Tronquer le HTML au texte brut et limiter à 3000 caractères
//     const textContent = ctx.notionContent
//       .replace(/<[^>]+>/g, " ")
//       .replace(/\s+/g, " ")
//       .trim()
//       .slice(0, 3000);
//     parts.push(`\n📝 Contenu de la notion :\n${textContent}`);
//   }
//   parts.push("===================================");
//   return parts.join("\n");
// }

// // ─── POST handler ─────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { message, context, history = [] } = body as {
//       message: string;
//       context: Record<string, string> | null;
//       history: { role: string; content: string }[];
//     };

//     if (!message?.trim()) {
//       return new Response(JSON.stringify({ error: "Message manquant" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Construire le prompt système enrichi avec le contexte pédagogique
//     const systemWithContext = SYSTEM_INSTRUCTION + buildContextBlock(context);

//     // Instancier le modèle Gemini
//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",          // Rapide + streaming + contexte long
//       systemInstruction: systemWithContext,
//       safetySettings: [
//         {
//           category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//           threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//           threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//         },
//       ],
//       generationConfig: {
//         temperature: 0.7,
//         topK: 40,
//         topP: 0.95,
//         maxOutputTokens: 1500,
//       },
//     });

//     // Convertir l'historique au format Gemini (role: "user" | "model")
//     const geminiHistory = history
//       .slice(-10) // Garder les 10 derniers messages
//       .filter((m) => m.role === "user" || m.role === "model")
//       .map((m) => ({
//         role: m.role as "user" | "model",
//         parts: [{ text: m.content }],
//       }));

//     // Démarrer une session de chat avec l'historique
//     const chat = model.startChat({ history: geminiHistory });

//     // Appel streaming
//     const result = await chat.sendMessageStream(message);

//     // ── Créer le ReadableStream SSE ──────────────────────────
//     const encoder = new TextEncoder();

//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           for await (const chunk of result.stream) {
//             const text = chunk.text();
//             if (text) {
//               const sseData = `data: ${JSON.stringify({ delta: text, done: false })}\n\n`;
//               controller.enqueue(encoder.encode(sseData));
//             }
//           }
//           // Signal fin de stream
//           controller.enqueue(encoder.encode("data: [DONE]\n\n"));
//         } catch (err) {
//           const errMsg = err instanceof Error ? err.message : "Erreur Gemini";
//           controller.enqueue(
//             encoder.encode(
//               `data: ${JSON.stringify({ delta: "", done: true, error: errMsg })}\n\n`
//             )
//           );
//         } finally {
//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache, no-transform",
//         Connection: "keep-alive",
//         "X-Accel-Buffering": "no",   // Désactive le buffering Nginx si présent
//       },
//     });
//   } catch (err) {
//     console.error("[XCSM AI Stream] Erreur:", err);
//     return new Response(
//       JSON.stringify({ error: "Erreur interne du serveur IA" }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// }

// // GET pour vérification santé
// export async function GET() {
//   return new Response(
//     JSON.stringify({
//       status: "ok",
//       model: "gemini-1.5-flash",
//       endpoint: "/api/ai/chat/stream",
//     }),
//     { headers: { "Content-Type": "application/json" } }
//   );
// }