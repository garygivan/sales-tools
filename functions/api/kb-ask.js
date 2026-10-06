/**
 * kb-ask.js — Tool 7: Ask the UKG Ready Knowledge Base
 * Answers seller questions grounded in the proprietary KB.
 * Also used for competitive intel, implementation guidance, module questions.
 */

const KB_ASK_SYSTEM = (kbText) => `You are an expert UKG Ready HCM product and sales assistant for Mosaic HCM / Evolve HCM / VensureHR sellers.

You have access to a proprietary UKG Ready Knowledge Base below. Answer the seller's question using ONLY information from this KB. If the answer is not in the KB, say so clearly — do not invent or guess from general training data.

Format your answer for a sales rep reading on a phone or laptop:
- Lead with the direct answer in 1-2 sentences
- Use bullet points for lists
- Keep it under 400 words unless the question genuinely requires depth
- If relevant, include a "Seller tip:" line with a practical selling implication

---
KNOWLEDGE BASE:
${kbText}
---`;

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  let body;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: corsHeaders }); }

  const { question, kbText } = body;
  if (!question) return new Response(JSON.stringify({ error: 'Missing question' }), { status: 400, headers: corsHeaders });
  if (!kbText) return new Response(JSON.stringify({ error: 'Missing kbText' }), { status: 400, headers: corsHeaders });
  if (!env.AI) return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503, headers: corsHeaders });

  try {
    const response = await env.AI.run('model', {
      messages: [
        { role: 'system', content: KB_ASK_SYSTEM(kbText.slice(0, 14000)) },
        { role: 'user', content: question }
      ],
      max_tokens: 1024,
    });

    let answer = '';
    if (response?.choices?.[0]?.message?.content) {
      answer = response.choices[0].message.content;
    } else if (typeof response?.response === 'string') {
      answer = response.response;
    } else {
      answer = JSON.stringify(response);
    }

    return new Response(JSON.stringify({ answer }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 502, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }});
}
