import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_CITATION = `Tu es un consommateur qui cherche des informations sur des marques et des produits.
Réponds naturellement à la question posée, comme tu le ferais vraiment.
Sois concis (3-4 phrases maximum). Ne mentionne que les marques que tu connais bien.`;

function buildAnalysisPrompt(
  brand: string,
  sector: string,
  competitors: string[],
  query: string,
  response: string
): string {
  const competitorsList = competitors.join(", ");
  return `Tu es un analyste GEO (Generative Engine Optimization).
Analyse cette réponse d'un LLM et évalue la présence de la marque "${brand}" dans le secteur "${sector}".
Les concurrents principaux sont : ${competitorsList}.

REQUÊTE : "${query}"
RÉPONSE : "${response}"

Retourne UNIQUEMENT un objet JSON valide, sans texte avant ou après :
{
  "cited": true,
  "citation_type": "primary",
  "sentiment": "positive",
  "sentiment_reason": "explication courte ou null",
  "competitors_cited": ["concurrents mentionnés dans la réponse"],
  "geo_opportunity": "action concrète en 1 phrase"
}

Définitions :
- cited : true si la marque "${brand}" est mentionnée, false sinon
- citation_type : "primary" si citée en premier ou recommandation principale, "secondary" si mentionnée mais pas en leader, "none" si non citée
- sentiment : "none" si la marque n'est pas citée
- competitors_cited : uniquement les concurrents de la liste présents dans la réponse`;
}

export async function POST(req: NextRequest) {
  const { brand, sector, competitors, queries } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const results: {
        query: string;
        llm_response: string;
        analysis: {
          cited: boolean;
          citation_type: "primary" | "secondary" | "none";
          sentiment: "positive" | "neutral" | "negative" | "none";
          sentiment_reason: string | null;
          competitors_cited: string[];
          geo_opportunity: string;
        };
      }[] = [];

      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];

        try {
          // Appel 1 — Claude joue le consommateur
          const llmRes = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 300,
            system: SYSTEM_CITATION,
            messages: [{ role: "user", content: query }],
          });
          const llmResponse = (llmRes.content[0] as { text: string }).text;

          // Appel 2 — Claude analyse la réponse
          const analysisRes = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: buildAnalysisPrompt(
                  brand,
                  sector,
                  competitors,
                  query,
                  llmResponse
                ),
              },
            ],
          });

          const raw = (analysisRes.content[0] as { text: string }).text
            .replace(/```json|```/g, "")
            .trim();
          const analysis = JSON.parse(raw);

          const result = { query, llm_response: llmResponse, analysis };
          results.push(result);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "result",
                index: i,
                total: queries.length,
                result,
              })}\n\n`
            )
          );

          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", index: i, query })}\n\n`
            )
          );
        }
      }

      // Calcul du score GEO final
      const cited = results.filter((r) => r.analysis.cited).length;
      const primary = results.filter(
        (r) => r.analysis.citation_type === "primary"
      ).length;
      const sentiments = results
        .filter((r) => r.analysis.sentiment !== "none")
        .map((r) => r.analysis.sentiment);
      const posCount = sentiments.filter((s) => s === "positive").length;
      const citationRate = cited / results.length;
      const geoScore =
        Math.round(
          (citationRate * 50 +
            (primary / results.length) * 30 +
            (posCount / Math.max(sentiments.length, 1)) * 20) *
            10
        ) / 10;

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "done",
            geoScore,
            citationRate: Math.round(citationRate * 100),
            cited,
            total: results.length,
            results,
          })}\n\n`
        )
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}