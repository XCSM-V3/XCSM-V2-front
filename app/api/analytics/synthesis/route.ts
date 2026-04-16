// ─────────────────────────────────────────────
// XCSM V3 — Route API Fiche de Synthèse
// app/api/analytics/synthesis/route.ts
// ─────────────────────────────────────────────

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY ?? "";
const MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-exp"];

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return Response.json({ error: "Clé API Gemini non configurée" }, { status: 500 });
    }

    const body = await req.json();
    const {
        granules,       // Array de { title, content }
        course_title,
        exam_focus = false, // Si true, orienté préparation examen
    } = body;

    if (!granules?.length || !course_title) {
        return Response.json({ error: "granules et course_title requis" }, { status: 400 });
    }

    // Construire le contenu consolidé
    const consolidatedContent = granules
        .slice(0, 8) // Max 8 granules pour rester dans les tokens
        .map((g: { title: string; content: string }) =>
            `### ${g.title}\n${g.content?.replace(/<[^>]+>/g, " ").trim().slice(0, 800)}`
        )
        .join("\n\n");

    const prompt = `Tu es un expert en pédagogie et synthèse documentaire. Crée une fiche de révision structurée et efficace.

## Cours : ${course_title}
## Nombre de notions : ${granules.length}
## Mode : ${exam_focus ? "Préparation examen" : "Révision générale"}

## Contenu des notions :
${consolidatedContent}

## Instructions :
- Crée une fiche de révision CLAIRE et MÉMORISABLE
- Identifie les CONCEPTS CLÉS essentiels à retenir
- Crée des sections thématiques cohérentes (pas une par granule)
- ${exam_focus ? "Ajoute des conseils spécifiques pour l'examen (pièges fréquents, formules importantes)" : "Oriente vers la compréhension profonde"}
- Utilise un langage accessible et précis

## Format JSON STRICT :
{
  "title": "Fiche de révision — [Titre descriptif]",
  "sections": [
    {
      "title": "Titre de la section thématique",
      "content": "Contenu condensé et clair (max 200 mots par section)",
      "source_granule": "Notion(s) source"
    }
  ],
  "key_concepts": [
    "Concept clé 1 — définition en 1 phrase",
    "Concept clé 2 — définition en 1 phrase"
  ],
  "exam_tips": [
    "Conseil ou point important à ne pas oublier",
    "Formule ou règle essentielle"
  ]
}`;

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    for (const model of MODELS) {
        try {
            const result = await ai.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.5,
                    maxOutputTokens: 3500,
                    responseMimeType: "application/json",
                },
            });

            const rawText = result.text ?? "";
            const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);

            return Response.json({
                ...parsed,
                course_title,
                generated_at: new Date().toISOString(),
                granule_count: granules.length,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
                return Response.json({ error: "Quota Gemini épuisé" }, { status: 429 });
            }
            continue;
        }
    }

    return Response.json({ error: "Impossible de générer la fiche" }, { status: 503 });
}