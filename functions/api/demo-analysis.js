const DEMO_SYSTEM_PROMPT = `You are an expert HCM sales analyst reviewing a product demonstration meeting transcript between a VensureHR / UKG Ready sales team and a prospect.

Your job is to extract and categorize ONLY what the PROSPECT said — not the seller — and identify all open items and follow-up commitments made during the meeting.

Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON:

{
  "summary": "2-3 sentence executive summary of the prospect's overall reaction to the demo — their energy, key areas of validation, and primary concerns",
  "functional_areas": [
    {
      "area": "Functional area name (e.g. Payroll, Time & Labor, Onboarding, etc.)",
      "positive": [
        { "quote": "Exact or near-exact prospect quote showing enthusiasm, validation, or approval", "context": "One sentence on why this is a positive buying signal" }
      ],
      "negative": [
        { "quote": "Exact or near-exact prospect quote showing an objection, gap, or dissatisfaction with what was shown", "context": "One sentence on the concern and potential deal impact" }
      ],
      "neutral": [
        { "quote": "Exact or near-exact prospect quote that is exploratory, clarifying, or requires further discussion — not clearly positive or negative", "context": "One sentence on what needs to be explored or confirmed" }
      ]
    }
  ],
  "open_items": {
    "unanswered": [
      { "question": "Question the prospect asked that was NOT answered during the meeting", "asked_by": "Name or role if mentioned, or null" }
    ],
    "answered": [
      { "question": "Question the prospect asked that WAS answered during the meeting", "answer_summary": "Brief summary of the answer given" }
    ],
    "followup": [
      { "item": "Action, commitment, or follow-up explicitly designated during the meeting", "owner": "BC / SE / Prospect / etc. if stated", "due": "Date or timeframe mentioned, or null" }
    ]
  },
  "other": [
    { "quote": "Prospect quote about non-product topics — company background, service model, implementation, compliance, pricing, contract, culture, references, or anything that doesn't fit a product functional area", "topic": "Brief label for what category this belongs to (e.g. Implementation, Pricing, Customer Service, Compliance, Company Culture)", "context": "One sentence explaining what the prospect is asking or expressing" }
  ]
}

Rules:
- Use ONLY prospect/buyer statements — ignore seller/rep dialogue
- Prefer verbatim quotes; stay as close as possible when paraphrasing
- functional_areas: only include areas where the prospect actually commented — do not create empty sections
- Common functional areas to look for: Payroll, Time & Labor, Applicant Tracking / ATS, Onboarding, General HR / Employee Records, Performance Management, Compensation, Benefits Enrollment, Carrier Feeds, 401(k) / Retirement, Reporting & Analytics, Compliance, Scheduling, Mobile / Self-Service, Integrations / API
- open_items.unanswered: questions the prospect raised that were deferred, skipped, or explicitly marked for later
- open_items.answered: questions that were asked AND resolved in the meeting
- open_items.followup: explicit commitments made — demos, docs, sandbox access, pricing, reference calls, etc.
- other: company questions, service model questions, implementation, pricing, contract, culture, references — anything non-product-feature
- If a section has no items, return an empty array []
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
        { role: 'system', content: DEMO_SYSTEM_PROMPT },
        { role: 'user', content: 'Here is the Demo meeting transcript to analyze:\n\n' + text.slice(0, 12000) }
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
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: corsHeaders });
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
