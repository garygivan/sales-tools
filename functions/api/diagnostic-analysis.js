const DIAGNOSTIC_SYSTEM_PROMPT = `You are an expert HCM sales analyst reviewing a Diagnostic (Discovery) meeting transcript between a VensureHR / UKG Ready sales team and a prospect.

Your job is to extract and summarize ONLY what the PROSPECT said — not the seller — organized by HCM module/functional area.

For each module where the prospect made relevant comments, provide:
- A 1-2 sentence summary of their current state, pain, or requirement in that area
- 1-3 direct quotes (verbatim or near-verbatim) from the prospect supporting the summary
- A signal rating: "pain" (expressing frustration, problem, or gap), "positive" (expressing satisfaction or validation), "neutral" (informational, no clear sentiment), or "emphasis" (prospect returned to this topic, pressed on it, or showed heightened interest)

Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON:

{
  "summary": "2-3 sentence executive summary of what the diagnostic revealed about the prospect's overall HCM environment and priorities",
  "modules": {
    "general": {
      "summary": "Summary of general/overall comments about their HR tech environment, company context, or evaluation criteria — or null if nothing relevant said",
      "quotes": ["quote1", "quote2"],
      "signal": "pain|positive|neutral|emphasis|null"
    },
    "payroll": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "time_and_labor": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "applicant_tracking": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "onboarding": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "general_hr": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "performance": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "compensation": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "benefits_enrollment": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "carrier_feeds": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "retirement_401k": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "reporting_analytics": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "compliance": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "customer_service": {
      "summary": "...",
      "quotes": [],
      "signal": "..."
    },
    "emphasized": {
      "summary": "Any topics the prospect returned to, pressed on, or showed notably heightened emotion or urgency about — even if already covered in another module",
      "quotes": [],
      "signal": "emphasis"
    }
  }
}

Rules:
- Use ONLY prospect/buyer statements — ignore seller/rep dialogue entirely
- Prefer exact verbatim quotes; if paraphrased, stay as close to their words as possible
- If the prospect said nothing relevant about a module, set summary to null, quotes to [], signal to null
- Do not invent or infer — only extract what was actually said
- "emphasized" captures cross-cutting themes the prospect kept coming back to regardless of which module they fell under
- signal: "pain" = frustration/problem/gap expressed; "positive" = satisfaction/validation; "neutral" = factual/informational; "emphasis" = high energy, repeated, or escalated interest
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
        { role: 'system', content: DIAGNOSTIC_SYSTEM_PROMPT },
        { role: 'user', content: 'Here is the Diagnostic meeting transcript to analyze:\n\n' + text.slice(0, 12000) }
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
