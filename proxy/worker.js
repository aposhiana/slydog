export default {
    async fetch(request, env) {
      if (request.method !== 'POST') {
        return new Response('Only POST allowed', { status: 405 });
      }
  
      const body = await request.json();
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...body,
          max_tokens: Math.min(body.max_tokens || 256, 512)
        })
      });
  
      const result = await resp.text();
      return new Response(result, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }
  };
  