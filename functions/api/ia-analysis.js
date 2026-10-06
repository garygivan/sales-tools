const IA_SYSTEM_PROMPT = `You are an expert HCM sales analyst reviewing an Initial Appointment (IA) meeting transcript between a VensureHR / UKG Ready sales team and a prospect.

Your job is to extract and categorize ONLY what the PROSPECT said — not the seller.

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences, just raw JSON):

{
  "summary": "2-3 sentence executive summary of the prospect's overall position and tone in this meeting",
  "project_goals": [
    {
      "goal": "Concise statement of a goal the prospect expressed",
      "quote": "Exact or near-exact quote from the prospect that supports this goal, or null if paraphrased"
    }
  ],
  "positive": [
    {
      "quote": "Exact or near-exact prospect quote showing enthusiasm, alignment, validation, or positive signal",
      "context": "One sentence explaining why this is a positive signal for the deal"
    }
  ],
  "negative": [
    {
      "quote": "Exact or near-exact prospect quote showing objection, pushback, dissatisfaction, or risk",
      "context": "One sentence explaining what the concern is and its potential deal impact"
    }
  ],
  "concerns": [
    {
      "quote": "Exact or near-exact prospect quote raising a question, uncertainty, or item needing follow-up — not necessarily negative",
      "context": "One sentence explaining what needs to be addressed or clarified"
    }
  ]
}

Rules:
- Use ONLY prospect/buyer statements — ignore seller/rep dialogue
- Prefer exact verbatim quotes where possible; if not verbatim, stay as close as possible
- project_goals: the prospect's stated reasons for evaluating a new HCM system — what they want to achieve
- positive: signals of interest, fit, enthusiasm, or alignment (e.g. "we really need that", "that's exactly what we're looking for")
- negative: objections, skepticism, competitive risks, budget pushback, bad prior experience, current system loyalty
- concerns: open questions, timeline pressures, process complexity, stakeholder dynamics, things that need follow-up but are not objections per se
- If a category has no examples, return an empty array []
- Return null for quote fields only if truly no supporting quote is available
- Return ONLY the JSON object`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: corsHeaders });
  }

  const { text } = body;
  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: corsHeaders });
  }

  if (!env.AI) {
    return new Response(JSON.stringify({ error: 'AI binding not configured' }), { status: 503, headers: corsHeaders });
  }

  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: IA_SYSTEM_PROMPT },
        { role: 'user', content: 'Here is the Initial Appointment transcript to analyze:\n\n' + text.slice(0, 10000) }
      ],
      max_tokens: 4096,
    });

    let parsed;
    if (response && typeof response.response === 'object' && response.response !== null) {
      parsed = response.response;
    } else {
      let raw = '';
      if (response && Array.isArray(response.choices) && response.choices[0]?.message?.content) {
        raw = response.choices[0].message.content;
      } else if (typeof response === 'string') {
        raw = response;
      } else {
        raw = JSON.stringify(response);
      }
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('AI did not return valid JSON — try again');
      parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders });

  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || String(e) || 'AI request failed' }), { status: 502, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
