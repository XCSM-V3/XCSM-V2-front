// ─────────────────────────────────────────────────────────────────
// XCSM V3 — Route API Streaming Gemini
// app/api/ai/chat/stream/route.ts
//
// SDK : @google/genai (nouvelle génération)
// Streaming SSE natif — compatible Vercel + localhost
// ─────────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY ?? "";

// Modèles par ordre de priorité — le premier disponible sera utilisé
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-preview-04-17",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

// ── Prompt système XCSM ───────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant pédagogique intelligent de la plateforme XCSM (eXtended Content Structured Module).

## Qui tu es
XCSM est une plateforme de gestion et diffusion de contenus pédagogiques pour l'enseignement supérieur, développée par des étudiants de l'ENSPY (École Nationale Supérieure Polytechnique de Yaoundé I, Cameroun), sous la supervision du Professeur BATCHAKUI Bernabé.

## Ce que tu sais sur XCSM

### La plateforme
- Site déployé : https://xcsm-frontend-app.vercel.app
- Backend : Django (Python) sur Render
- Frontend : Next.js 15 sur Vercel
- Bases de données : MySQL (utilisateurs/auth) + MongoDB (granules)

### Les rôles
- **Enseignant** : crée des cours, importe des PDF/DOCX, gère les étudiants, consulte les analytics
- **Étudiant** : s'inscrit aux cours avec un code, consulte les granules, utilise le mode lecture

### Structure hiérarchique
Cours → Parties → Chapitres → Sections → Notions (granules atomiques)

### Fonctionnalités principales
- **Import de documents** : PDF/DOCX → parsing automatique → granules pédagogiques
- **Éditeur** : éditeur riche pour créer et modifier le contenu
- **Mode lecture** : navigation immersive avec barre de progression
- **Recherche** : full-text dans tous les cours accessibles
- **Export DOCX** : export du cours complet en Word
- **Dashboard** : statistiques pour enseignants et étudiants

### Comment utiliser XCSM
- **Créer un cours** : Dashboard → "Créer un cours" → titre + description
- **Importer un document** : "Importer un document" → choisir PDF/DOCX → parsing automatique
- **Rejoindre un cours** : "Rejoindre un cours" → code fourni par l'enseignant
- **Lire un cours** : Catalogue → ouvrir le cours → "Commencer la lecture"
- **Rechercher** : "Rechercher des granules" → mot-clé → résultats localisés

### Version V3 (en développement)
- Agent IA pédagogique contextuel (toi !)
- Analytics avancés
- Commentaires et collaboration
- Segmentation ML des documents
- Plugin XCSM pour plateformes tierces

## Tes capacités
Tu peux répondre à TOUTES les questions :
- Questions générales sur XCSM (navigation, fonctionnalités, aide)
- Questions sur le contenu pédagogique affiché (si contexte fourni)
- Résumés de cours ou notions
- Explications de concepts avec exemples
- Questions générales (mathématiques, sciences, histoire, langues, etc.)
- Tu es un assistant pédagogique universel, pas limité à XCSM

## Règles
- Réponds TOUJOURS en **français**
- Ton bienveillant, pédagogique, professionnel
- Utilise le Markdown : **gras**, listes, titres ## pour structurer
- Sois concis (max 400 mots) sauf pour les résumés complets
- Si contexte pédagogique fourni → base tes réponses dessus en priorité
- Si tu ne sais pas → dis-le honnêtement`;

// ── Contexte pédagogique courant ──────────────────────────────
function buildContext(ctx: Record<string, string> | null): string {
  if (!ctx) return "";
  const lines: string[] = ["\n\n---\n## Contexte de la page actuelle"];
  if (ctx.courseTitle) lines.push(`📚 **Cours** : ${ctx.courseTitle}`);
  if (ctx.partTitle) lines.push(`📂 **Partie** : ${ctx.partTitle}`);
  if (ctx.chapterTitle) lines.push(`📖 **Chapitre** : ${ctx.chapterTitle}`);
  if (ctx.sectionTitle) lines.push(`📑 **Section** : ${ctx.sectionTitle}`);
  if (ctx.notionTitle) lines.push(`🔬 **Notion** : ${ctx.notionTitle}`);
  if (ctx.notionContent) {
    const plain = ctx.notionContent
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
    lines.push(`\n📝 **Contenu** :\n${plain}`);
  }
  lines.push("---");
  return lines.join("\n");
}

// ── POST : stream de réponse ──────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Vérification clé API
  if (!API_KEY) {
    console.error("[XCSM AI] ❌ GEMINI_API_KEY manquante dans .env.local");
    return Response.json(
      { error: "Clé API Gemini non configurée. Ajoutez GEMINI_API_KEY dans .env.local" },
      { status: 500 }
    );
  }

  // 2. Parsing du body
  let message: string;
  let context: Record<string, string> | null = null;
  let history: { role: string; content: string }[] = [];

  try {
    const body = await req.json();
    message = body.message ?? "";
    context = body.context ?? null;
    history = body.history ?? [];
  } catch {
    return Response.json({ error: "Corps de requête invalide (JSON attendu)" }, { status: 400 });
  }

  if (!message.trim()) {
    return Response.json({ error: "Message vide" }, { status: 400 });
  }

  // 3. Construire les contenus (historique + message courant)
  const contents = [
    ...history
      .slice(-10)
      .filter((m) => m.role === "user" || m.role === "model")
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    { role: "user", parts: [{ text: message }] },
  ];

  const systemInstruction = SYSTEM_PROMPT + buildContext(context);
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const encoder = new TextEncoder();

  // 4. Essayer chaque modèle jusqu'au premier qui répond
  for (const modelName of MODELS) {
    try {
      console.log(`[XCSM AI] 🔄 Tentative avec ${modelName}...`);

      // Appel streaming
      const geminiStream = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        },
      });

      // Créer le ReadableStream SSE
      const sseStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of geminiStream) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ delta: text, done: false })}\n\n`
                  )
                );
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            console.log(`[XCSM AI] ✅ Réponse complète — ${modelName}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[XCSM AI] ❌ Erreur stream (${modelName}):`, msg);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ delta: "", done: true, error: msg })}\n\n`
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
          "X-AI-Model": modelName,
        },
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[XCSM AI] ⚠️ ${modelName} indisponible : ${msg.slice(0, 150)}`);
      // Passer au modèle suivant
      continue;
    }
  }

  // Tous les modèles ont échoué
  console.error("[XCSM AI] ❌ Tous les modèles ont échoué");
  return Response.json(
    {
      error:
        "Aucun modèle Gemini disponible. Vérifiez que votre clé API est active sur https://aistudio.google.com/app/apikey",
    },
    { status: 503 }
  );
}

// ── GET : diagnostic santé ────────────────────────────────────
export async function GET() {
  if (!API_KEY) {
    return Response.json({
      status: "error",
      message: "GEMINI_API_KEY manquante dans .env.local",
    });
  }

  // Tester la clé avec un appel minimal
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  for (const modelName of MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: "Réponds uniquement : OK" }] }],
        config: { maxOutputTokens: 10 },
      });

      return Response.json({
        status: "ok",
        message: "API Gemini opérationnelle ✅",
        active_model: modelName,
        test_response: result.text?.trim() ?? "",
        all_models: MODELS,
      });
    } catch {
      continue;
    }
  }

  return Response.json({
    status: "error",
    message:
      "Clé présente mais aucun modèle accessible. Vérifiez les droits de la clé sur https://aistudio.google.com/app/apikey",
    models_tried: MODELS,
  });
}

























// // ─────────────────────────────────────────────────────────────────
// // XCSM V3 — Route API Streaming Gemini (VERSION CORRIGÉE)
// // app/api/ai/chat/stream/route.ts
// //
// // Correction : modèles compatibles + fallback automatique
// // ─────────────────────────────────────────────────────────────────

// import { NextRequest } from "next/server";
// import {
//   GoogleGenerativeAI,
//   HarmCategory,
//   HarmBlockThreshold,
// } from "@google/generative-ai";

// const API_KEY = process.env.GEMINI_API_KEY ?? "";

// // Modèles par ordre de priorité (le premier disponible sera utilisé)
// const MODEL_CANDIDATES = [
//   "gemini-3-flash-preview",
//   "gemini-3.1-pro-preview",
//   "gemini-pro",
// ];

// const SYSTEM_PROMPT = `Tu es l'assistant pédagogique intelligent de la plateforme XCSM (eXtended Content Structured Module).

// ## Qui tu es
// XCSM est une plateforme de gestion et diffusion de contenus pédagogiques pour l'enseignement supérieur, développée par des étudiants de l'ENSPY (École Nationale Supérieure Polytechnique de Yaoundé I, Cameroun), sous la supervision du Professeur BATCHAKUI Bernabé.

// ## Ce que tu sais sur XCSM
// - **Rôles** : Enseignant (crée des cours, importe des documents PDF/DOCX) et Étudiant (s'inscrit aux cours, consulte les granules)
// - **Structure hiérarchique** : Cours → Parties → Chapitres → Sections → Notions (granules atomiques)
// - **Import** : Les PDF et DOCX sont automatiquement découpés en granules pédagogiques via un moteur de parsing intelligent
// - **Bases de données** : MySQL pour les utilisateurs/auth, MongoDB pour les granules (contenus pédagogiques)
// - **Backend** : Django (Python) déployé sur Render
// - **Frontend** : Next.js 15 (App Router) déployé sur Vercel (https://xcsm-frontend-app.vercel.app)
// - **Fonctionnalités** : Éditeur de cours, import PDF/DOCX, recherche de granules, dashboard étudiant/enseignant, navigation hiérarchique, export DOCX, mode lecture immersif
// - **Version actuelle** : V3 — ajoute l'IA pédagogique, les analytics, la collaboration et la segmentation ML

// ## Comment utiliser XCSM
// - **Enseignant** : Créer un cours → Importer un document → Le système génère les granules automatiquement → Partager le code du cours aux étudiants
// - **Étudiant** : Se connecter → Rejoindre un cours avec le code → Consulter les granules dans le mode lecture → Rechercher du contenu
// - **Import de document** : Aller dans "Importer un document" → Choisir PDF ou DOCX → Le backend parse et structure automatiquement le contenu
// - **Recherche** : La barre de recherche dans "Rechercher des granules" permet de trouver du contenu précis dans tous les cours accessibles
// - **Export** : Depuis le mode lecture, bouton DOCX pour exporter le cours complet

// ## Tes responsabilités
// 1. Répondre aux questions générales sur XCSM et son fonctionnement
// 2. Répondre aux questions sur le contenu pédagogique affiché (si contexte fourni)
// 3. Générer des résumés clairs et structurés
// 4. Expliquer simplement des concepts avec des exemples
// 5. Suggérer des notions connexes à explorer
// 6. Aider les utilisateurs à naviguer sur la plateforme

// ## Règles
// - Réponds TOUJOURS en français, ton bienveillant et pédagogique
// - Si le contenu d'une notion est fourni dans le contexte, base tes réponses dessus en priorité
// - Utilise le Markdown : gras, listes, titres pour structurer
// - Sois concis (max 400 mots) sauf pour les résumés complets
// - Si tu ne sais pas quelque chose de précis, dis-le honnêtement`;

// function buildContextBlock(ctx: Record<string, string> | null): string {
//   if (!ctx) return "";
//   const lines: string[] = ["\n\n---\n## Contexte pédagogique actuel"];
//   if (ctx.courseTitle) lines.push(`Cours : ${ctx.courseTitle}`);
//   if (ctx.partTitle) lines.push(`Partie : ${ctx.partTitle}`);
//   if (ctx.chapterTitle) lines.push(`Chapitre : ${ctx.chapterTitle}`);
//   if (ctx.sectionTitle) lines.push(`Section : ${ctx.sectionTitle}`);
//   if (ctx.notionTitle) lines.push(`Notion : ${ctx.notionTitle}`);
//   if (ctx.notionContent) {
//     const text = ctx.notionContent
//       .replace(/<[^>]+>/g, " ")
//       .replace(/\s+/g, " ")
//       .trim()
//       .slice(0, 3000);
//     lines.push(`Contenu :\n${text}`);
//   }
//   lines.push("---");
//   return lines.join("\n");
// }

// export async function POST(req: NextRequest) {
//   if (!API_KEY) {
//     console.error("[XCSM AI] GEMINI_API_KEY manquante dans .env.local");
//     return Response.json(
//       { error: "Clé API Gemini non configurée. Ajoutez GEMINI_API_KEY dans .env.local" },
//       { status: 500 }
//     );
//   }

//   try {
//     const body = await req.json();
//     const { message, context = null, history = [] } = body as {
//       message: string;
//       context: Record<string, string> | null;
//       history: { role: string; content: string }[];
//     };

//     if (!message?.trim()) {
//       return Response.json({ error: "Message manquant" }, { status: 400 });
//     }

//     const genAI = new GoogleGenerativeAI(API_KEY);

//     const geminiHistory = history
//       .slice(-10)
//       .filter((m) => m.role === "user" || m.role === "model")
//       .map((m) => ({
//         role: m.role as "user" | "model",
//         parts: [{ text: m.content }],
//       }));

//     const safetySettings = [
//       {
//         category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//         threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//       },
//       {
//         category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//         threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
//       },
//     ];

//     const generationConfig = {
//       temperature: 0.7,
//       topK: 40,
//       topP: 0.95,
//       maxOutputTokens: 1500,
//     };

//     const systemInstruction = SYSTEM_PROMPT + buildContextBlock(context);

//     // Essayer chaque modèle jusqu'à succès
//     for (const modelName of MODEL_CANDIDATES) {
//       try {
//         const model = genAI.getGenerativeModel({
//           model: modelName,
//           systemInstruction,
//           safetySettings,
//           generationConfig,
//         });

//         const chat = model.startChat({ history: geminiHistory });
//         const result = await chat.sendMessageStream(message);

//         const encoder = new TextEncoder();
//         const stream = new ReadableStream({
//           async start(controller) {
//             try {
//               for await (const chunk of result.stream) {
//                 const text = chunk.text();
//                 if (text) {
//                   controller.enqueue(
//                     encoder.encode(
//                       `data: ${JSON.stringify({ delta: text, done: false })}\n\n`
//                     )
//                   );
//                 }
//               }
//               controller.enqueue(encoder.encode("data: [DONE]\n\n"));
//             } catch (streamErr) {
//               const errMsg = streamErr instanceof Error ? streamErr.message : "Erreur streaming";
//               controller.enqueue(
//                 encoder.encode(
//                   `data: ${JSON.stringify({ delta: "", done: true, error: errMsg })}\n\n`
//                 )
//               );
//             } finally {
//               controller.close();
//             }
//           },
//         });

//         console.log(`[XCSM AI] OK — modèle : ${modelName}`);

//         return new Response(stream, {
//           headers: {
//             "Content-Type": "text/event-stream",
//             "Cache-Control": "no-cache, no-transform",
//             Connection: "keep-alive",
//             "X-Accel-Buffering": "no",
//             "X-AI-Model": modelName,
//           },
//         });

//       } catch (modelErr) {
//         console.warn(
//           `[XCSM AI] Modèle ${modelName} indisponible :`,
//           modelErr instanceof Error ? modelErr.message.slice(0, 100) : modelErr
//         );
//         continue;
//       }
//     }

//     // Aucun modèle n'a fonctionné
//     return Response.json(
//       {
//         error:
//           "Aucun modèle Gemini disponible. Vérifiez votre clé API sur https://aistudio.google.com/app/apikey",
//       },
//       { status: 503 }
//     );

//   } catch (err) {
//     console.error("[XCSM AI] Erreur :", err);
//     return Response.json({ error: "Erreur interne du serveur IA" }, { status: 500 });
//   }
// }

// export async function GET() {
//   return Response.json({
//     status: API_KEY ? "ok" : "missing_key",
//     message: API_KEY
//       ? "API Gemini configurée."
//       : "GEMINI_API_KEY manquante dans .env.local",
//     models_candidates: MODEL_CANDIDATES,
//   });
// }



































// // // ─────────────────────────────────────────────
// // // XCSM V3 — Route API Streaming Gemini
// // // app/api/ai/chat/stream/route.ts
// // //
// // // La clé GEMINI_API_KEY reste CÔTÉ SERVEUR (jamais exposée au client)
// // // ─────────────────────────────────────────────

// // import { NextRequest } from "next/server";
// // import {
// //   GoogleGenerativeAI,
// //   HarmCategory,
// //   HarmBlockThreshold,
// // } from "@google/generative-ai";

// // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// // // ── Prompt système XCSM ──────────────────────
// // const SYSTEM_PROMPT = `Tu es l'assistant pédagogique intelligent de la plateforme XCSM (eXtended Content Structured Module).

// // ## Qui tu es
// // XCSM est une plateforme de gestion et diffusion de contenus pédagogiques pour l'enseignement supérieur, développée par des étudiants de l'ENSPY (École Nationale Supérieure Polytechnique de Yaoundé I, Cameroun), sous la supervision du Professeur BATCHAKUI Bernabé.

// // ## La plateforme XCSM — ce que tu SAIS
// // - **Rôles** : Enseignant (crée des cours, importe des documents) et Étudiant (s'inscrit aux cours, consulte les granules)
// // - **Structure hiérarchique** : Cours → Parties → Chapitres → Sections → Notions (granules atomiques)
// // - **Import de documents** : PDF et DOCX sont automatiquement découpés en granules pédagogiques via un moteur de parsing
// // - **Bases de données** : MySQL pour les utilisateurs/auth, MongoDB pour les granules (contenus pédagogiques)
// // - **Backend** : Serveur applicatif Django (Python) déployé sur Render (https://granule.onrender.com)
// // - **Frontend** : Next.js 15 (App Router) déployé sur Vercel (https://xcsm-frontend-app.vercel.app)
// // - **Fonctionnalités** : Éditeur de cours, import PDF/DOCX, recherche de granules, dashboard étudiant/enseignant, navigation hiérarchique, export DOCX, mode lecture immersif
// // - **Version actuelle** : V3 (en cours de développement) — ajoute l'IA pédagogique (toi !), les analytics, la collaboration et la segmentation ML

// // ## Tes responsabilités
// // 1. Répondre aux questions sur le **contenu pédagogique** affiché (notion, chapitre, cours)
// // 2. Générer des **résumés** clairs et structurés
// // 3. **Expliquer** simplement des concepts complexes avec des exemples concrets
// // 4. **Suggérer** des notions connexes à explorer pour approfondir
// // 5. Répondre aux questions **générales sur XCSM** (fonctionnement, navigation, fonctionnalités)
// // 6. Aider les étudiants à **comprendre comment utiliser la plateforme**

// // ## Règles
// // - Réponds TOUJOURS en **français**, ton bienveillant et pédagogique
// // - Si le contenu d'une notion est fourni dans le contexte, base tes réponses dessus en priorité
// // - Utilise **Markdown** : titres, listes, gras pour structurer tes réponses
// // - Sois concis (max 400 mots sauf pour les résumés complets)
// // - Si tu ne sais pas quelque chose de précis sur XCSM, dis-le honnêtement
// // - Pour les questions hors périmètre, redirige vers le contenu XCSM disponible`;

// // // ── Injection du contexte pédagogique ────────
// // function contextBlock(ctx: Record<string, string> | null): string {
// //   if (!ctx) return "";

// //   const lines: string[] = ["\n\n---\n## Contexte pédagogique actuel"];
// //   if (ctx.courseTitle) lines.push(`📚 **Cours** : ${ctx.courseTitle}`);
// //   if (ctx.partTitle) lines.push(`📂 **Partie** : ${ctx.partTitle}`);
// //   if (ctx.chapterTitle) lines.push(`📖 **Chapitre** : ${ctx.chapterTitle}`);
// //   if (ctx.sectionTitle) lines.push(`📑 **Section** : ${ctx.sectionTitle}`);
// //   if (ctx.notionTitle) lines.push(`🔬 **Notion** : ${ctx.notionTitle}`);

// //   if (ctx.notionContent) {
// //     // Extraire le texte brut du HTML, limiter à 3000 chars
// //     const text = ctx.notionContent
// //       .replace(/<[^>]+>/g, " ")
// //       .replace(/\s+/g, " ")
// //       .trim()
// //       .slice(0, 3000);
// //     lines.push(`\n📝 **Contenu de la notion** :\n${text}`);
// //   }

// //   lines.push("---");
// //   return lines.join("\n");
// // }

// // // ── POST handler ─────────────────────────────
// // export async function POST(req: NextRequest) {
// //   try {
// //     const body = await req.json();
// //     const {
// //       message,
// //       context = null,
// //       history = [],
// //     } = body as {
// //       message: string;
// //       context: Record<string, string> | null;
// //       history: { role: string; content: string }[];
// //     };

// //     if (!message?.trim()) {
// //       return Response.json({ error: "Message manquant" }, { status: 400 });
// //     }

// //     const model = genAI.getGenerativeModel({
// //       model: "gemini-1.5-flash",
// //       systemInstruction: SYSTEM_PROMPT + contextBlock(context),
// //       safetySettings: [
// //         { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
// //         { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
// //       ],
// //       generationConfig: {
// //         temperature: 0.7,
// //         topK: 40,
// //         topP: 0.95,
// //         maxOutputTokens: 1500,
// //       },
// //     });

// //     // Historique au format Gemini
// //     const geminiHistory = history
// //       .slice(-10)
// //       .filter((m) => m.role === "user" || m.role === "model")
// //       .map((m) => ({
// //         role: m.role as "user" | "model",
// //         parts: [{ text: m.content }],
// //       }));

// //     const chat = model.startChat({ history: geminiHistory });
// //     const result = await chat.sendMessageStream(message);

// //     const encoder = new TextEncoder();
// //     const stream = new ReadableStream({
// //       async start(controller) {
// //         try {
// //           for await (const chunk of result.stream) {
// //             const text = chunk.text();
// //             if (text) {
// //               controller.enqueue(
// //                 encoder.encode(`data: ${JSON.stringify({ delta: text, done: false })}\n\n`)
// //               );
// //             }
// //           }
// //           controller.enqueue(encoder.encode("data: [DONE]\n\n"));
// //         } catch (err) {
// //           const msg = err instanceof Error ? err.message : "Erreur Gemini";
// //           controller.enqueue(
// //             encoder.encode(`data: ${JSON.stringify({ delta: "", done: true, error: msg })}\n\n`)
// //           );
// //         } finally {
// //           controller.close();
// //         }
// //       },
// //     });

// //     return new Response(stream, {
// //       headers: {
// //         "Content-Type": "text/event-stream",
// //         "Cache-Control": "no-cache, no-transform",
// //         "Connection": "keep-alive",
// //         "X-Accel-Buffering": "no",
// //       },
// //     });
// //   } catch (err) {
// //     console.error("[XCSM AI]", err);
// //     return Response.json({ error: "Erreur interne du serveur IA" }, { status: 500 });
// //   }
// // }

// // export async function GET() {
// //   return Response.json({ status: "ok", model: "gemini-1.5-flash" });
// // }
