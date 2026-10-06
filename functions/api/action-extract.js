const ACTION_EXTRACT_PROMPT = `You are an expert HCM sales assistant. You have just reviewed a meeting transcript between a VensureHR / UKG Ready sales team and a prospect.

Your job is to extract ONLY real, actionable items — things that someone on the sales team (BC, SE, SDR) or the prospect explicitly committed to doing, or that clearly need to be done based on the meeting.

IMPORTANT — Do NOT include:
- Information gaps or missing prospect data (those belong in Open Items / qualification tracking)
- Things like "identify decision maker" or "find out current vendor" — those are info gaps, not action items
- Checklist qualification items

DO include:
- Explicit commitments made in the meeting ("I'll send that over", "let's schedule a reference call")
- Follow-up tasks clearly implied by unanswered questions
- Documents, proposals, or materials to send
- Meetings or calls to schedule
- Internal tasks (loop in SC, prepare customized demo, build pricing)
- Prospect-side commitments ("they're going to check with IT")

Return ONLY a valid JSON object — no markdown, no code fences:

{
  "action_items": [
    {
      "item": "Clear, specific description of what needs to be done",
      "owner": "BC or SE or SDR or Prospect or SC or null",
      "due": "Specific date YYYY-MM-DD if mentioned, or timeframe like 'by EOW' or null",
      "priority": "high or medium or low",
      "context": "One sentence explaining why this action is needed — what it's tied to in the meeting"
    }
  ]
}

Priority guidance:
- high: blocking next step, explicitly urgent, or directly tied to deal advancement
- medium: important but not blocking immediate next step
- low: nice to have, background task, or longer-horizon item

If no real action items exist (information-only meeting), return: {"action_items": []}

Return ONLY the JSON object.`;

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

  const { text, meeting_type } = body;
  if (!text) return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: corsHeaders });
  if (!env.AI) return new Response(JSON.stringify({ error: 'AI binding not configured' }), { status: 503, headers: corsHeaders });

  const meetingLabel = { ia: 'Initial Appointment (IA)', diagnostic: 'Diagnostic / Discovery', demo: 'Demo', email: 'Email thread' }[meeting_type] || 'meeting';

  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: ACTION_EXTRACT_PROMPT },
        { role: 'user', content: `Meeting type: ${meetingLabel}\n\nTranscript:\n\n${text.slice(0, 10000)}` }
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
