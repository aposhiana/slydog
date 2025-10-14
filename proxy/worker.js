export default {
    async fetch(request, env) {
      // Universal CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
  
      // Handle CORS preflight request
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
  
      // Only allow POST requests for actual data
      if (request.method !== "POST") {
        return new Response("Only POST allowed", { status: 405, headers: corsHeaders });
      }
  
      try {
        const body = await request.json();
  
        // Forward to OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...body,
            max_tokens: Math.min(body.max_tokens || 256, 512),
          }),
        });
  
        const text = await response.text();
  
        // Mirror OpenAI’s response + add CORS headers
        return new Response(text, {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    },
  };
  