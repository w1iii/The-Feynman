import Groq from "groq-sdk";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatOptions = {
  model?: string;
  fallbackModel?: string;
  maxTokens?: number;
  temperature?: number;
};

const MODELS = {
  primary: "openai/gpt-oss-120b",
  fallback: "openai/gpt-oss-20b",
} as const;

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function isRetryableError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return !!(
    e?.status === 429 ||
    e?.status === 404 ||
    e?.message?.includes("rate_limit") ||
    e?.message?.includes("model_not_found")
  );
}

export async function groqChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
) {
  const {
    model = MODELS.primary,
    fallbackModel = MODELS.fallback,
    maxTokens = 1024,
    temperature = 0.4,
  } = options;

  const client = getClient();

  try {
    return await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });
  } catch (err) {
    if (!isRetryableError(err)) throw err;

    console.warn(`Primary model ${model} unavailable, falling back to ${fallbackModel}`);

    return client.chat.completions.create({
      model: fallbackModel,
      messages,
      max_tokens: maxTokens,
      temperature,
    });
  }
}

export function parseJsonResponse<T = Record<string, unknown>>(
  content: string | null | undefined,
): T {
  const cleaned = (content ?? "").replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
