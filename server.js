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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}
app.use(cors);

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
    const [system, ...rest] = payload.messages || [];
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest', system: system?.content || undefined, messages: rest, max_tokens: payload.max_tokens || 4096 }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || `Anthropic HTTP ${r.status}`);
    return { choices: [{ message: { content: (data.content || []).map(x => x.text || '').join('\n') } }] };
  }

  throw new Error('AI provider not configured. Set CLOUDFLARE_ACCOUNT_ID+CLOUDFLARE_API_TOKEN, OPENAI_API_KEY, or ANTHROPIC_API_KEY in Render environment variables.');
}

const env = { AI: { run: callAI } };

async function adapt(handler, req, res) {
  try {
    const response = await handler.onRequestPost({ request: makeRequest(req), env });
    const status = response.status || 200;
    if (response.headers) Object.entries(response.headers).forEach(([k, v]) => res.setHeader(k, v));
    res.status(status).send(response.body ?? '');
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
}

app.get('/health', (req, res) => res.json({ ok: true, service: 'quick-assess-better-tools' }));
app.post('/api/interpret', (req, res) => adapt(interpret, req, res));
app.post('/api/ia-analysis', (req, res) => adapt(iaAnalysis, req, res));
app.post('/api/diagnostic-analysis', (req, res) => adapt(diagnosticAnalysis, req, res));
app.post('/api/demo-analysis', (req, res) => adapt(demoAnalysis, req, res));
app.post('/api/email-parse', (req, res) => adapt(emailParse, req, res));
app.post('/api/action-extract', (req, res) => adapt(actionExtract, req, res));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(__dirname, { extensions: ['html'] }));

app.listen(PORT, () => console.log(`Quick Assess running on :${PORT}`));
