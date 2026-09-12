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

const MAX_RETRIES = 2;
const TIMEOUT_MS = 30_000;

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function isRetryableError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return !!(
    e?.status === 429 ||
    e?.status === 404 ||
    e?.status === 500 ||
    e?.status === 502 ||
    e?.status === 503 ||
    e?.message?.includes("rate_limit") ||
    e?.message?.includes("model_not_found") ||
    e?.message?.includes("ECONNRESET") ||
    e?.message?.includes("ETIMEDOUT") ||
    e?.message?.includes("network")
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function callWithRetry(
  client: Groq,
  params: Record<string, unknown>,
  retries = MAX_RETRIES
): Promise<any> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(
        client.chat.completions.create(params as any),
        TIMEOUT_MS
      );
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRetryableError(err)) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`AI call attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export async function groqChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<any> {
  const {
    model = MODELS.primary,
    fallbackModel = MODELS.fallback,
    maxTokens = 1024,
    temperature = 0.4,
  } = options;

  const client = getClient();
  const params = { messages, max_tokens: maxTokens, temperature };

  try {
    return await callWithRetry(client, { model, ...params });
  } catch (err) {
    console.warn(`Primary model ${model} failed after retries, trying ${fallbackModel}:`, err);

    try {
      return await callWithRetry(client, { model: fallbackModel, ...params }, 1);
    } catch (fallbackErr) {
      console.error(`Both models failed. Primary: ${err}, Fallback: ${fallbackErr}`);
      throw new Error("AI service is temporarily unavailable. Please try again in a moment.");
    }
  }
}

export function parseJsonResponse<T = Record<string, unknown>>(
  content: string | null | undefined,
): T {
  const cleaned = (content ?? "").replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
