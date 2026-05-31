// Shared LLM helper: Groq (primary) → Gemini (fallback).
// Used by demo API routes across all 47 LPs.

type Msg = { role: "system" | "user" | "assistant"; content: string };

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.0-flash";

async function callGroq(messages: Msg[], maxTokens = 900): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no_groq_key");
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
  });
  if (!r.ok) throw new Error(`groq_${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGemini(messages: Msg[], maxTokens = 900): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no_gemini_key");
  // Gemini uses a slightly different shape: contents with role + parts
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const userTurns = messages.filter((m) => m.role !== "system");
  const contents = userTurns.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) throw new Error(`gemini_${r.status}`);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

/** Run an LLM completion. Tries Groq first, falls back to Gemini. */
export async function chat(messages: Msg[], maxTokens = 900): Promise<{ text: string; model: string }> {
  // Try Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const text = await callGroq(messages, maxTokens);
      if (text) return { text, model: GROQ_MODEL };
    } catch (e) {
      // fall through
    }
  }
  // Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await callGemini(messages, maxTokens);
      if (text) return { text, model: GEMINI_MODEL };
    } catch (e) {
      // fall through
    }
  }
  throw new Error("no_llm_available");
}

export function isConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
}
