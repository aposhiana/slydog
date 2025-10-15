// src/ai/openai_client.js
const WORKER_URL = "https://train-mystery-proxy.andrewaposhian.workers.dev";

export async function sendChat(messages, opts = {}) {
  try {
    const requestBody = {
      model: "gpt-4o-mini",
      messages,
      max_tokens: opts.max_tokens ?? 256,
      tools: opts.tools || undefined,
      tool_choice: opts.tool_choice || undefined,
    };
    
    console.log("🔍 OpenAI Request:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Proxy error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    console.log("🔍 OpenAI Response:", JSON.stringify(data, null, 2));
    
    const message = data?.choices?.[0]?.message;
    
    // Return both content and function calls if present
    return {
      content: message?.content ?? "",
      tool_calls: message?.tool_calls || []
    };
  } catch (err) {
    console.error("OpenAI client error:", err);
    return {
      content: "(NPC is silent — communication error.)",
      tool_calls: []
    };
  }
}
