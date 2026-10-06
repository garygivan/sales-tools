/**
 * kb.js — UKG Ready Knowledge Base loader
 * Reads the KB markdown file once at startup, chunks it by section,
 * and exports helpers to retrieve relevant context for AI prompts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_PATH = path.join(__dirname, 'kb', 'ukg-ready-kb.md');

let _kbFull = '';
let _sections = [];

export function loadKB() {
  try {
    _kbFull = fs.readFileSync(KB_PATH, 'utf8');
    // Split into sections by H2 headings
    _sections = _kbFull.split(/^## /m).filter(Boolean).map(s => {
      const lines = s.split('\n');
      const title = lines[0].trim();
      const body = lines.slice(1).join('\n').trim();
      return { title, body };
    });
    console.log(`[kb] loaded ${_sections.length} sections (${_kbFull.length} chars)`);
  } catch (err) {
    console.warn('[kb] KB file not found — AI will run without product context:', err.message);
  }
}

/** Return full KB text (for Tool 7 / Ask KB). */
export function getFullKB() { return _kbFull; }

/** Return all section titles. */
export function getSectionTitles() { return _sections.map(s => s.title); }

/**
 * Get KB sections relevant to a set of keywords.
 * Used to inject product context into transcript analysis prompts.
 */
export function getRelevantContext(keywords = [], maxChars = 3000) {
  if (!_sections.length) return '';
  const kw = keywords.map(k => k.toLowerCase());
  const scored = _sections.map(s => {
    const text = (s.title + ' ' + s.body).toLowerCase();
    const hits = kw.filter(k => text.includes(k)).length;
    return { ...s, hits };
  }).filter(s => s.hits > 0).sort((a, b) => b.hits - a.hits);

  let out = '';
  for (const sec of scored) {
    const chunk = `## ${sec.title}\n${sec.body}\n\n`;
    if (out.length + chunk.length > maxChars) break;
    out += chunk;
  }
  return out;
}

/**
 * Keywords to extract from a transcript or note block
 * so we can retrieve relevant KB sections.
 */
const MODULE_KEYWORDS = [
  'payroll','time','attendance','scheduling','benefits','onboarding','recruiting','ats',
  'performance','compensation','learning','lms','reporting','analytics','compliance',
  'multi-state','california','colorado','washington','cannabis','integration',
  'carrier','401k','retirement','gl','general ledger','implementation','go-live',
  'parallel','bryte','ai','mobile','self-service','paycom','paylocity','adp',
  'rippling','bamboo','gusto','carrier feed','edi','sso','okta','azure',
];

export function extractKeywords(text) {
  const lower = text.toLowerCase();
  return MODULE_KEYWORDS.filter(k => lower.includes(k));
}
