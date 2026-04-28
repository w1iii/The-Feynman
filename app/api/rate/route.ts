import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { concept, finalExplanation }: { 
      concept: string; 
      finalExplanation: string 
    } = await req.json();

    if (!concept || !finalExplanation) {
      return NextResponse.json(
        { error: "concept and finalExplanation are required" }, 
        { status: 400 }
      );
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemInstruction = `
      You are evaluating a final Feynman explanation for depth of understanding.

      Score 1–100 based on:
      - Accuracy of the concept
      - Depth of understanding shown
      - Quality and relevance of analogies
      - Clarity and simplicity of language
      - Whether a non-expert could genuinely learn from this

      Labels by score:
      90–100 → "Expert-level clarity"
      75–89  → "Strong understanding"
      60–74  → "Good grasp"
      45–59  → "Developing understanding"
      below 45 → "Keep exploring"

      Respond ONLY in valid JSON, no markdown fences, no other text:
      {
        "score": 85,
        "label": "Strong understanding",
        "description": "2–3 sentence summary of strengths and minor gaps.",
        "strengths": ["strength 1", "strength 2", "strength 3"]
      }
    `;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemInstruction },
        { 
          role: "user", 
          content: `Concept: "${concept}"\n\nFinal explanation:\n\n${finalExplanation}` 
        }
      ],
      max_tokens: 300,
      temperature: 0.3, // lower = more consistent scoring
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      score: parsed.score,
      label: parsed.label,
      description: parsed.description,
      strengths: parsed.strengths ?? [],
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
