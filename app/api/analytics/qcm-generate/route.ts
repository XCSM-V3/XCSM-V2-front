// ─────────────────────────────────────────────
// XCSM V3 — Route API Génération QCM
// app/api/analytics/qcm-generate/route.ts
// Utilise Gemini pour générer des QCM à partir du contenu réel
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const MODELS = [

    "gemini-3-flash-preview",
    "gemini-3.1-pro-preview",
    "gemini-pro",
    "gemini-2.5-flash-preview-04-17",  // 🧠 RAISONNEMENT - Dernier modèle avancé
    "gemini-2.0-flash",                 // ⚡ PUISSANT - Standard rapide
    "gemini-2.0-flash-lite",            // 🚀 RAPIDE - Version légère
    "gemini-1.5-flash",                 // ✅ STABLE - Fallback sûr
];

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return Response.json({ error: "Clé API Gemini non configurée" }, { status: 500 });
    }

    const body = await req.json();
    const {
        granule_content,    // Contenu texte du/des granule(s)
        granule_titles,     // Titres des granules
        course_title,
        num_questions = 5,  // Nombre de questions (3-10)
        difficulty = "mixte", // "facile" | "moyen" | "difficile" | "mixte"
    } = body;

    if (!granule_content || !course_title) {
        return Response.json({ error: "granule_content et course_title requis" }, { status: 400 });
    }

    const count = Math.min(Math.max(parseInt(num_questions), 3), 10);

    const prompt = `Tu es un expert en conception pédagogique. Génère ${count} questions QCM de qualité basées STRICTEMENT sur le contenu fourni ci-dessous.

## Cours : ${course_title}
## Notions : ${granule_titles ?? "Non spécifiées"}
## Niveau de difficulté demandé : ${difficulty}

## Contenu source :
${granule_content.slice(0, 4000)}

## Instructions STRICTES :
- Génère EXACTEMENT ${count} questions
- Chaque question doit avoir 4 options de réponse (A, B, C, D)
- La réponse correcte doit être clairement basée sur le contenu fourni
- Inclure une brève explication pédagogique pour chaque réponse
- Varier les niveaux : compréhension, application, analyse
- NE PAS inventer de contenu hors du texte fourni

## Format de réponse JSON STRICT (rien d'autre, pas de markdown autour) :
{
  "title": "QCM — [Titre descriptif basé sur le contenu]",
  "questions": [
    {
      "id": "q1",
      "question": "Question précise et claire ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Explication courte pourquoi A est correct.",
      "difficulty": "facile",
      "granule_source": "${granule_titles ?? course_title}"
    }
  ]
}`;

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    for (const model of MODELS) {
        try {
            const result = await ai.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.4, // Bas pour cohérence et précision
                    maxOutputTokens: 3000,
                    responseMimeType: "application/json",
                },
            });

            const rawText = result.text ?? "";

            // Nettoyer le JSON si Gemini ajoute des backticks
            const cleaned = rawText
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();

            const parsed = JSON.parse(cleaned);

            return Response.json({
                ...parsed,
                course_title,
                generated_at: new Date().toISOString(),
                granule_ids: body.granule_ids ?? [],
                model_used: model,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
                return Response.json({ error: "Quota Gemini épuisé" }, { status: 429 });
            }
            console.warn(`[QCM] Modèle ${model} échoué :`, msg.slice(0, 100));
            continue;
        }
    }

    return Response.json({ error: "Impossible de générer le QCM" }, { status: 503 });
}