import { NextResponse } from "next/server";
import { requireUser } from "../../lib/supabase/auth-helper";
import { invalidateUserSessionsAndStats, invalidateSessionCache } from "../../lib/redis/cache";
import { groqChat, parseJsonResponse } from "../../lib/ai/ai";
import { rateLimit } from "../../lib/rate-limit";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const { messages, concept, session_id }: { messages: Message[]; concept: string; session_id: string } = await req.json();

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!concept || !session_id) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Cap total message content to prevent AI cost explosion
    const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalChars > 100_000) {
      return NextResponse.json({ error: "Conversation too long" }, { status: 400 });
    }

    // Get authenticated user and verify session ownership
    const { user, supabase, error } = await requireUser();
    if (error) return error

    const { allowed } = await rateLimit(`coach:${user.id}`, 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

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

    type CoachResponse = {
      done: boolean;
      passed: number[];
      question?: string;
      praise?: string;
      gaps?: string[];
    };

    let parsed: CoachResponse;
    try {
      const response = await groqChat([
        { role: "system", content: systemInstruction },
        ...messages,
      ]);
      parsed = parseJsonResponse<CoachResponse>(response.choices[0]?.message?.content);
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

      // Update session status (final_score is set later by /api/rate)
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          question_count: messages.length,
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
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
