import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { requireUser } from "../../lib/supabase/auth-helper";
import { invalidateUserSessionsAndStats, invalidateSessionCache } from "../../lib/redis/cache";

export async function POST(req: Request) {
  try {
    const { user, supabase, error } = await requireUser();
    if (error) return error;

    const { concept, finalExplanation, session_id }: { 
      concept: string; 
      finalExplanation: string;
      session_id?: string;
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

    let response;

    try {
      response = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: `Concept: "${concept}"\n\nFinal explanation:\n\n${finalExplanation}` 
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });
    } catch (primaryError: unknown) {
      // Check for rate limit (429) or model not found (404) error
      const err = primaryError as { status?: number; message?: string }
      if (err?.status === 429 || err?.status === 404 || err?.message?.includes('rate_limit') || err?.message?.includes('model_not_found')) {
        console.warn("Primary model unavailable, falling back to openai/gpt-oss-20b");
        
        response = await client.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemInstruction },
            { 
              role: "user", 
              content: `Concept: "${concept}"\n\nFinal explanation:\n\n${finalExplanation}` 
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        });
      } else {
        throw primaryError;
      }
    }

    // Parse response with error handling
    let parsed;
    try {
      const raw = response.choices[0]?.message?.content ?? "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Persist score to sessions table
    if (session_id) {
      await supabase
        .from('sessions')
        .update({
          final_score: parsed.score,
          score_label: parsed.label,
          score_description: parsed.description,
        })
        .eq('id', session_id);

      await invalidateUserSessionsAndStats(user.id);
      await invalidateSessionCache(session_id);
    }

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
