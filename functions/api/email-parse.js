const EMAIL_PARSE_PROMPT = `You are an expert HCM sales assistant. You will receive:
1. The text of an email thread or email message
2. A list of currently OPEN action items from the deal

Your job is to:
- Identify which open action items were addressed, resolved, or closed by this email thread
- Identify any NEW action items that emerge from the email
- Extract a brief summary of what the email accomplished for this deal

Return ONLY a valid JSON object — no markdown, no code fences:

{
  "summary": "1-2 sentences describing what this email thread accomplished for the deal",
  "resolved_ids": ["item_id1", "item_id2"],
  "resolved_notes": {
    "item_id1": "Brief note on how/what was resolved — e.g. 'Pricing proposal sent on Jan 12'"
  },
  "new_actions": [
    {
      "item": "Clear description of new action item found in the email",
      "owner": "BC or SE or SDR or Prospect or null",
      "due": "YYYY-MM-DD or timeframe or null",
      "priority": "high or medium or low",
      "context": "One sentence explaining what this is tied to"
    }
  ]
}

Rules:
- Only mark an item as resolved if the email clearly addresses it (sent the doc, scheduled the call, answered the question, etc.)
- Be conservative — if ambiguous, don't mark it resolved
- New actions follow the same rules as action extraction — real tasks only, no info gaps
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
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: corsHeaders }); }

  const { text, open_items } = body;
  if (!text) return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: corsHeaders });
  if (!env.AI) return new Response(JSON.stringify({ error: 'AI binding not configured' }), { status: 503, headers: corsHeaders });

  // Build a readable list of open items for the AI
  const itemsList = (open_items || []).map((a, i) =>
    `ID: ${a.id_str || i} | ${a.desc} | Owner: ${a.owner || 'TBD'} | Source: ${a.source_label || 'Manual'}`
  ).join('\n');

  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: EMAIL_PARSE_PROMPT },
        { role: 'user', content: `OPEN ACTION ITEMS:\n${itemsList || '(none)'}\n\nEMAIL CONTENT:\n\n${text.slice(0, 8000)}` }
      ],
      max_tokens: 2048,
    });

    let parsed;
    if (response && typeof response.response === 'object' && response.response !== null) {
      parsed = response.response;
    } else {
      let raw = typeof response === 'string' ? response
        : response?.choices?.[0]?.message?.content || JSON.stringify(response);
      const cleaned = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
      const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
      if (s === -1 || e === -1) throw new Error('AI returned non-JSON');
      parsed = JSON.parse(cleaned.slice(s, e+1));
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }});
}
