// src/ai/openai_client.js
const WORKER_URL = "https://train-mystery-proxy.andrewaposhian.workers.dev";

export async function sendChat(messages, opts = {}) {
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: opts.max_tokens ?? 256,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Proxy error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    console.error("OpenAI client error:", err);
    return "(NPC is silent — communication error.)";
  }
}
