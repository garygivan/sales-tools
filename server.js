import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import * as interpret from './functions/api/interpret.js';
import * as iaAnalysis from './functions/api/ia-analysis.js';
import * as diagnosticAnalysis from './functions/api/diagnostic-analysis.js';
import * as demoAnalysis from './functions/api/demo-analysis.js';
import * as emailParse from './functions/api/email-parse.js';
import * as actionExtract from './functions/api/action-extract.js';
import * as kbAsk from './functions/api/kb-ask.js';
import { dealsHandler } from './functions/api/deals.js';
import { actionsHandler } from './functions/api/actions.js';
import { getPool, initSchema } from './db.js';
import { loadKB, getFullKB, getRelevantContext, extractKeywords } from './kb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── CORS ──────────────────────────────────────────────────────────────────────
function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}
app.use(cors);

// ── AI provider ───────────────────────────────────────────────────────────────
async function callAI(model, payload) {
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfModel = process.env.CLOUDFLARE_AI_MODEL || model || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${encodeURIComponent(cfModel)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.success === false) throw new Error(data?.errors?.[0]?.message || `Cloudflare AI HTTP ${r.status}`);
    return data.result ?? data;
  }

  if (process.env.OPENAI_API_KEY) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: payload.messages, temperature: 0.1, max_tokens: payload.max_tokens || 4096 }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${r.status}`);
    return { choices: data.choices };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const msgs = payload.messages || [];
    const systemMsg = msgs.find(m => m.role === 'system');
    const userMsgs = msgs.filter(m => m.role !== 'system');
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        system: systemMsg?.content || undefined,
        messages: userMsgs,
        max_tokens: payload.max_tokens || 4096
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || `Anthropic HTTP ${r.status}`);
    return { choices: [{ message: { content: (data.content || []).map(x => x.text || '').join('\n') } }] };
  }

  throw new Error('AI provider not configured. Set CLOUDFLARE_ACCOUNT_ID+CLOUDFLARE_API_TOKEN, OPENAI_API_KEY, or ANTHROPIC_API_KEY.');
}

// ── Request adapter (Cloudflare → Node) ──────────────────────────────────────
function makeRequest(req) {
  return {
    json: async () => req.body,
    text: async () => typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}),
    method: req.method,
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    headers: req.headers,
  };
}

class NodeResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = init.headers || {};
  }
}
globalThis.Response = globalThis.Response || NodeResponse;

const env = { AI: { run: callAI } };

async function adapt(handler, req, res) {
  try {
    const response = await handler.onRequestPost({ request: makeRequest(req), env });
    const status = response.status || 200;
    if (response.headers) {
      if (typeof response.headers.forEach === 'function') {
        response.headers.forEach((v, k) => res.setHeader(k, v));
      } else {
        Object.entries(response.headers).forEach(([k, v]) => res.setHeader(k, v));
      }
    }
    let body = '';
    if (typeof response.text === 'function') {
      body = await response.text();
    } else {
      body = response.body ?? '';
    }
    res.status(status).send(body);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const db = getPool();
  res.json({
    ok: true,
    service: 'quick-assess-better-tools',
    aiProvider: process.env.CLOUDFLARE_ACCOUNT_ID ? 'cloudflare'
      : process.env.OPENAI_API_KEY ? 'openai'
      : process.env.ANTHROPIC_API_KEY ? 'anthropic'
      : 'not_configured',
    db: db ? 'connected' : 'not_configured',
    kb: getFullKB().length > 0 ? 'loaded' : 'not_loaded',
  });
});

// ── AI tools (original 6, KB-enhanced) ────────────────────────────────────────
app.post('/api/interpret', (req, res) => adapt(interpret, req, res));
app.post('/api/ia-analysis', (req, res) => adapt(iaAnalysis, req, res));
app.post('/api/diagnostic-analysis', (req, res) => adapt(diagnosticAnalysis, req, res));
app.post('/api/demo-analysis', (req, res) => adapt(demoAnalysis, req, res));
app.post('/api/email-parse', (req, res) => adapt(emailParse, req, res));
app.post('/api/action-extract', (req, res) => adapt(actionExtract, req, res));

// ── Tool 7: KB Ask ─────────────────────────────────────────────────────────────
app.post('/api/kb-ask', async (req, res) => {
  // Inject KB text server-side so client doesn't have to send it
  req.body.kbText = getFullKB();
  adapt(kbAsk, req, res);
});

// ── KB context endpoint (for front-end to enrich prompts) ────────────────────
app.post('/api/kb-context', (req, res) => {
  const { text } = req.body || {};
  const keywords = extractKeywords(text || '');
  const context = getRelevantContext(keywords);
  res.json({ context, keywords });
});

// ── Deal persistence ──────────────────────────────────────────────────────────
app.all('/api/deals', (req, res) => dealsHandler(req, res, getPool()));
app.all('/api/deals/:id', (req, res) => dealsHandler(req, res, getPool()));

// ── Action items ──────────────────────────────────────────────────────────────
app.all('/api/actions', (req, res) => actionsHandler(req, res, getPool()));
app.all('/api/actions/:id', (req, res) => actionsHandler(req, res, getPool()));

// ── Deal events log ───────────────────────────────────────────────────────────
app.post('/api/deals/:id/events', async (req, res) => {
  const db = getPool();
  if (!db) return res.status(503).json({ error: 'No database' });
  const { event_type, summary, payload } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO deal_events (deal_id, event_type, summary, payload)
       VALUES ($1,$2,$3,$4::jsonb) RETURNING *`,
      [req.params.id, event_type, summary, JSON.stringify(payload || {})]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Matrix score editor API ───────────────────────────────────────────────────
const MATRIX_FILE = path.join(__dirname, 'hcm-matrix.html');

app.get('/api/matrix-scores', (req, res) => {
  try {
    const html = fs.readFileSync(MATRIX_FILE, 'utf8');
    const match = html.match(/const SCORES = (\{[\s\S]*?\});\n\nconst LABELS/);
    if (!match) return res.status(500).json({ error: 'Could not find SCORES block in matrix file' });
    // eslint-disable-next-line no-new-func
    const scores = new Function('return ' + match[1])();
    res.json(scores);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/matrix-update', (req, res) => {
  try {
    const { scores } = req.body;
    if (!scores || typeof scores !== 'object') return res.status(400).json({ error: 'Missing scores object' });

    // Format the new SCORES block
    const lines = ['const SCORES = {'];
    const qKeys = Object.keys(scores);
    qKeys.forEach((qid, qi) => {
      const aKeys = Object.keys(scores[qid]);
      const pairs = aKeys.map(ak => {
        const pts = scores[qid][ak];
        return `    '${ak}': [${pts[0]},${pts[1]},${pts[2]}]`;
      }).join(', ');
      lines.push(`  ${qid}: { ${pairs.trim()} }${qi < qKeys.length - 1 ? ',' : ''}`);
    });
    lines.push('};');
    const newBlock = lines.join('\n');

    let html = fs.readFileSync(MATRIX_FILE, 'utf8');
    const replaced = html.replace(
      /const SCORES = \{[\s\S]*?\};\n\nconst LABELS/,
      newBlock + '\n\nconst LABELS'
    );
    if (replaced === html) return res.status(500).json({ error: 'SCORES block not found — file may be malformed' });

    fs.writeFileSync(MATRIX_FILE, replaced, 'utf8');
    res.json({ ok: true, message: 'Matrix updated' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Static ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/matrix', (req, res) => res.sendFile(path.join(__dirname, 'hcm-matrix.html')));
app.get('/matrix-editor', (req, res) => res.sendFile(path.join(__dirname, 'hcm-editor.html')));
app.use(express.static(__dirname, { extensions: ['html'] }));

// ── Startup ────────────────────────────────────────────────────────────────────
async function start() {
  loadKB();
  await initSchema();
  app.listen(PORT, () => console.log(`Quick Assess running on :${PORT}`));
}
start();
