import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { requireUser } from "../../lib/supabase/auth-helper";
import { invalidateUserSessionsAndStats, invalidateSessionCache } from "../../lib/redis/cache";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const { messages, concept, session_id }: { messages: Message[]; concept: string; session_id: string } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    if (!session_id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Get authenticated user and verify session ownership
    const { user, supabase, error } = await requireUser();
    if (error) return error

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 403 });
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemInstruction = `
      You are a Feynman Technique coach helping the user understand: "${concept}".
      You are in an ongoing conversation — you remember everything said so far.

      Evaluate the user's FULL conversation history against 5 criteria:
      1. Plain language — no unexplained jargon
      2. Core mechanism explained (how + why)
      3. At least one analogy or concrete example
      4. No critical gaps or vague filler
      5. A 12-year-old with no background could follow it

      CRITICAL GRADING RULES:
      - Grade based on the ENTIRE conversation, not just the latest message
      - Criteria are CUMULATIVE — once a criterion is satisfied anywhere in the 
        conversation, it stays passed. Never remove a criterion from passed[]
      - The user does NOT need to repeat things they already explained well
      - Each answer only needs to address what is still missing
      - Ask ONE question per turn targeting the most critical UNMET criterion only

      Rules:
      - Respond ONLY in valid JSON, no markdown fences, no other text
      - Max 20 questions total. At question 20, always return done:true
      - If all 5 criteria are met at ANY point, immediately return done:true
      - Never give the answer. Friendly, conversational tone like a tutor

      If done: false →
      {"done": false, "passed": [0-indexed array of ALL criteria passed so far across entire conversation], "question": "One Socratic question targeting the most critical unmet criterion."}

      If done: true →
      {"done": true, "passed": [0,1,2,3,4], "praise": "2–3 sentence specific praise referencing their actual words.", "gaps": []}
    `;

    let response;

    try {
      // Try primary model first
      response = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemInstruction },
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.4,
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
            ...messages,
          ],
          max_tokens: 300,
          temperature: 0.4,
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
        { error: "Failed to parse AI response. Please try again.", done: false, passed: [], question: "Could you please try explaining that again?" },
        { status: 500 }
      );
    }

    // Append-only: get current turn count, insert only new messages
    const { count: existingCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session_id);

    const nextTurn = (existingCount ?? 0) + 1;
    const newMessages = [];

    // Only insert user messages not yet persisted
    for (let i = 0; i < messages.length; i++) {
      const turnNumber = i + 1;
      if (turnNumber >= nextTurn) {
        newMessages.push({
          session_id,
          role: messages[i].role,
          content: messages[i].content,
          turn_number: turnNumber,
        });
      }
    }

    // Add assistant response
    const assistantContent = parsed.done
      ? (parsed.praise || "Great job completing the session!")
      : (parsed.question || "Could you tell me more about that?");

    newMessages.push({
      session_id,
      role: "assistant",
      content: assistantContent,
      turn_number: messages.length + 1,
    });

    if (newMessages.length > 0) {
      const { error: insertError } = await supabase
        .from('messages')
        .insert(newMessages);

      if (insertError) {
        console.error("Failed to save messages:", insertError);
      }
    }

    // Invalidate session detail cache since messages changed
    await invalidateSessionCache(session_id);

    // If conversation is done, save criteria results and update session
    if (parsed.done) {
      const passedCount = (parsed.passed ?? []).length;
      
      // Determine score label
      let scoreLabel = "Needs Work";
      if (passedCount === 5) scoreLabel = "Mastered";
      else if (passedCount >= 3) scoreLabel = "Almost There";

      // Build score description from praise and gaps
      let scoreDescription = "";
      if (parsed.praise) scoreDescription += parsed.praise + " ";
      if (parsed.gaps && parsed.gaps.length > 0) {
        scoreDescription += "Areas to improve: " + parsed.gaps.join(", ");
      }

      // Save criteria results
      const passedIndices = parsed.passed ?? [];
      const totalTurns = messages.length;
      const criteriaResults = [];

      for (let i = 0; i < 5; i++) {
        criteriaResults.push({
          session_id: session_id,
          criterion_index: i,
          passed: passedIndices.includes(i),
          first_passed_turn: passedIndices.includes(i) ? totalTurns : null,
        });
      }

      const { error: criteriaError } = await supabase
        .from('criteria_results')
        .insert(criteriaResults);

      if (criteriaError) {
        console.error("Failed to save criteria results:", criteriaError);
      }

      // Update session with final score
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          final_score: passedCount,
          score_label: scoreLabel,
          score_description: scoreDescription.trim(),
          status: 'completed',
        })
        .eq('id', session_id);

      if (updateError) {
        console.error("Failed to update session:", updateError);
      }

      // Invalidate cached sessions and stats since session status changed
      await invalidateUserSessionsAndStats(user.id);
    }

    return NextResponse.json({
      done: parsed.done,
      passed: parsed.passed ?? [],
      question: parsed.question ?? null,
      praise: parsed.praise ?? null,
      gaps: parsed.gaps ?? [],
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
