import { NextResponse } from "next/server";
import { requireUser } from "../../lib/supabase/auth-helper";
import { invalidateUserSessionsAndStats, invalidateSessionCache } from "../../lib/redis/cache";
import { groqChat, parseJsonResponse } from "../../lib/ai/ai";
import { rateLimit } from "../../lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { user, supabase, error } = await requireUser();
    if (error) return error;

    const { allowed } = await rateLimit(`rate:${user.id}`, 5, 60);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

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

    // Cap input size — prevent AI API cost explosion
    const maxExplanationLength = 50_000;
    if (finalExplanation.length > maxExplanationLength) {
      return NextResponse.json(
        { error: "Explanation too long" },
        { status: 400 }
      );
    }

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
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "bestMoment": "The user's strongest sentence or analogy from their explanation."
      }
    `;

    type RateResponse = {
      score: number;
      label: string;
      description: string;
      strengths?: string[];
      bestMoment?: string;
    };

    let parsed: RateResponse;
    try {
      const response = await groqChat([
        { role: "system", content: systemInstruction },
        { 
          role: "user", 
          content: `Concept: "${concept}"\n\nFinal explanation:\n\n${finalExplanation}` 
        },
      ], { temperature: 0.3 });
      parsed = parseJsonResponse<RateResponse>(response.choices[0]?.message?.content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate and sanitize AI response before DB write
    const VALID_LABELS = [
      "Expert-level clarity",
      "Strong understanding", 
      "Good grasp",
      "Developing understanding",
      "Keep exploring",
    ];

    const score = Math.min(100, Math.max(1, Math.round(Number(parsed.score) || 0)));
    const label = VALID_LABELS.includes(parsed.label) ? parsed.label : "Developing understanding";
    const description = typeof parsed.description === "string" ? parsed.description.slice(0, 1000) : "";
    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.filter((s): s is string => typeof s === "string").slice(0, 5)
      : [];
    const bestMoment = typeof parsed.bestMoment === "string" ? parsed.bestMoment.slice(0, 500) : null;

    // Persist score to sessions table
    if (session_id) {
      // Verify session belongs to user before updating
      const { data: ownedSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .single();

      if (ownedSession) {
        await supabase
          .from('sessions')
          .update({
            final_score: score,
            score_label: label,
            score_description: description,
          })
          .eq('id', session_id)
          .eq('user_id', user.id);

        await invalidateUserSessionsAndStats(user.id);
        await invalidateSessionCache(session_id);
      }
    }

    return NextResponse.json({
      score,
      label,
      description,
      strengths,
      bestMoment,
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
