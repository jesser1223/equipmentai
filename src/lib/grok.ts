export const GROK_MODEL = process.env.GROK_MODEL || "grok-4.20";
const BASE = (process.env.XAI_API_BASE || "https://api.x.ai/v1").replace(/\/$/, "");

export function grokConfigured() {
  return !!process.env.XAI_API_KEY;
}

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
};

export async function grokChat(messages: ChatMessage[], tools: any[], timeoutMs = 45000) {
  if (!process.env.XAI_API_KEY) {
    throw new Error("AI is not configured. Set XAI_API_KEY in Vercel.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Grok request failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = JSON.parse(text);
    return {
      message: data.choices?.[0]?.message || { content: "" },
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0 },
      model: data.model || GROK_MODEL,
    };
  } finally {
    clearTimeout(timer);
  }
}
