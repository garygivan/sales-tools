const SYSTEM_PROMPT = `You are a sales qualification assistant for VensureHR UKG Ready Enterprise HCM deals.
You will receive raw account/prospect notes from a seller. Extract and structure the information to populate a Quick Assess deal qualification form.

You MUST return ONLY a valid JSON object — no explanation, no markdown, no code fences. Just the raw JSON.

JSON structure:
{
  "deal_fields": {
    "dh-prospect": "Company name or null",
    "dh-website": "Website URL or null",
    "dh-bc": "BC (Business Consultant) name or null",
    "dh-sdr": "SDR name or null",
    "dh-ees": "Number of employees or null",
    "dh-arr": "ARR / estimated annual contract value or null",
    "dh-close": "Target close date YYYY-MM-DD or null",
    "dh-sc": "SC (Solutions Consultant) name or null",
    "dh-bant-budget": "BANT Budget — budget range, confirmed/unconfirmed, amount if mentioned or null",
    "dh-bant-authority": "BANT Authority — decision maker name and/or title or null",
    "dh-bant-need": "BANT Need — primary pain point or business need in their words or null",
    "dh-bant-timing": "BANT Timing — timeline, urgency driver, target go-live, or renewal date or null"
  },
  "criteria": {
    "CRITERION_ID": {
      "checked": true or false,
      "note": "extracted text or null",
      "desc": "description for open-ended fields or null"
    }
  },
  "actions": [
    {"status": "Open", "type": "TYPE", "desc": "description", "owner": "owner", "due": "YYYY-MM-DD or null"}
  ],
  "seller_notes": "general observations or null"
}

Criterion IDs to extract (only include IDs where you found data):
s1_r1: Deal created in SFDC
s1_r2: Prospect website and LinkedIn reviewed
s1_t1: Current Payroll Provider (note=vendor name)
s1_t2: Current Time and Attendance system (note=vendor name)
s1_t3: Current HR / HRIS system (note=vendor name)
s1_t4: Current ATS / Applicant Tracking (note=vendor name)
s1_t5: Current Talent / Perf / LMS system (note=vendor name)
s1_t6: Current Benefits Admin system (note=vendor name)
s1_e1: Budget discussed (note=range and timing)
s1_e2: Pending event identified like renewal or compliance deadline (note=event and date)
s1_e3: Initial pain surfaced and acknowledged (note=their exact words)
s1_e4: Mutual next step agreed (note=step and date)
s1_e5: Decision maker identified (note=name and title)
s1_f1: Functional requirements can be met (note=any gaps)
s1_f2: Go-live date known (note=target date)
s1_f3: HR-driven decision (note=who is driving if not HR)
s1_f4: Segment identified SMB Mid-Market Enterprise (note=segment and vertical)
s1_p1: HR Director or CHRO identified (note=name and title)
s1_p2: Payroll Manager identified (note=name and title)
s1_p3: Benefits Administrator identified (note=name and title)
s1_p4: Talent Acquisition or Recruiter identified (note=name and title)
s1_p5: L&D or Talent Mgmt identified (note=name and title)
s1_p6: Performance or Comp Manager identified (note=name and title)
s1_p7: IT Director identified (note=name and title)
s1_p8: CFO or Finance lead identified (note=name and title)
s2_w1: HR win in prospect words (note=their words)
s2_w2: Payroll win in prospect words (note=their words)
s2_w3: Benefits win in prospect words (note=their words)
s2_w4: Recruitment win in prospect words (note=their words)
s2_w5: Talent L&D win in prospect words (note=their words)
s2_w6: Performance Comp win in prospect words (note=their words)
s2_w7: IT Technical win in prospect words (note=their words)
s2_w8: CFO Finance win in prospect words (note=their words)
s2_v1: Mobile self-service value validated (note=their response)
s2_v2: Onboarding workflow validated (note=their response)
s2_v3: Communications validated (note=their response)
s2_v4: Integrated single platform value validated (note=their response)
s2_v5: Service model validated (note=their response)
s2_v6: Key differentiator 1 validated (desc=differentiator name, note=response)
s2_v7: Key differentiator 2 validated (desc=differentiator name, note=response)
s2_s1: Key strength 1 (desc=strength description, note=evidence)
s2_s2: Key strength 2 (desc=strength description, note=evidence)
s2_s3: Key strength 3 (desc=strength description, note=evidence)
s2_rf1: Deal risk or red flag 1 - always checked:false (desc=risk, note=mitigation)
s2_rf2: Deal risk or red flag 2 - always checked:false (desc=risk, note=mitigation)
s2_rf3: Deal risk or red flag 3 - always checked:false (desc=risk, note=mitigation)
s3_d1: Demoed to all personas (note=who not yet demoed)
s3_d2: Open items addressed (note=unresolved)
s3_d3: Payroll Time gaps resolved (note=gaps)
s3_d4: HCM gaps resolved (note=gaps)
s3_d5: Price aligned to budget (note=delta)
s3_d6: References scheduled (note=names)
s3_d7: Champion tested (note=what they did)
s3_d8: Incumbent notice period known (note=period and end date)
s4_c1: Final decision process confirmed (note=date and steps)
s4_c2: Proposal to Economic Buyer (note=who and when)
s4_c3: Contract to legal (note=who and when)
s4_c4: Contract review process known (note=details)
s4_c5: Impl Manager introduced (note=confirmed with whom)
s4_c6: Commitments in contract (note=custom items)

Action types: Stakeholder Outreach, Red Flag Mitigation, Champion Development, Strength Validation, Technical Validation, Reference Management, Commercial / Legal, Other

Rules:
- checked:true ONLY when notes clearly confirm criterion is complete
- Red flags always checked:false
- Be conservative — ambiguous = checked:false but populate note
- Omit criteria with no relevant data
- For BANT fields: extract even partial information — if budget is "around $80k" put that; if authority is "the CFO will sign off" put "CFO (name TBD)"; if need is expressed as a pain, quote their words; if timing is a renewal date or go-live target, include it
- Return ONLY the JSON object, nothing else`;

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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Here are the account notes to extract from:\n\n' + text.slice(0, 8000) }
      ],
      max_tokens: 4096,
    });

    // CF AI returns an OpenAI-compatible object; .response is already parsed JSON
    let parsed;
    if (response && typeof response.response === 'object' && response.response !== null) {
      // Best case: CF already parsed it for us
      parsed = response.response;
    } else {
      // Fall back: extract text from choices and parse manually
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
