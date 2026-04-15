import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { brand, sector, competitors } = await req.json();

    const prompt = `Tu es un expert en GEO (Generative Engine Optimization) et en comportement consommateur.

Génère exactement 15 requêtes que de vrais consommateurs poseraient à un LLM (ChatGPT, Claude, Gemini) 
en lien avec la marque "${brand}" dans le secteur "${sector}".
Les concurrents principaux sont : ${(competitors || []).join(", ")}.

Couvre ces 5 angles, 3 requêtes par angle :

1. DÉCOUVERTE — le consommateur ne connaît pas encore la marque, il cherche une solution générique
2. COMPARAISON — il hésite entre plusieurs marques et veut qu'on l'aide à choisir
3. VALEURS — il cherche une marque alignée avec ses convictions (durabilité, éthique, naturalité...)
4. USAGE / SITUATION — il a un besoin très précis lié à un contexte de vie particulier
5. RÉASSURANCE — il est presque convaincu mais cherche une confirmation avant d'acheter

Règles :
- Chaque requête doit être en langage naturel, comme une vraie question posée à un LLM
- Ne mentionne pas la marque "${brand}" dans les requêtes de découverte et de valeurs
- Mentionne la marque dans les requêtes de comparaison et de réassurance
- Varie les formulations, évite les répétitions

Retourne UNIQUEMENT un objet JSON valide :
{
  "queries": [
    { "angle": "découverte", "query": "..." }
  ]
}`;

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (res.content[0] as { text: string }).text
      .replace(/```json|```/g, "")
      .trim();

    const data = JSON.parse(raw);

    return Response.json(data);

  } catch (err) {
    console.error("Erreur generate-queries:", err);
    return Response.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}