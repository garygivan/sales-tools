# Gary — Sales Tools Render/GitHub Handoff (v2)

## Live assets

- GitHub repo: https://github.com/garygivan/sales-tools
- Render service: https://dashboard.render.com/web/srv-db2kv9142hec738t6d30
- Live URL: https://sales-tools-838w.onrender.com
- Health check: https://sales-tools-838w.onrender.com/health
- Render DB dashboard: https://dashboard.render.com/d/dpg-db2n06navr4c73dbvj2g-a

## Render settings

- Service type: Web Service
- Runtime: Node
- Branch: main
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Auto-deploy: on commit to `main`

## Environment variables (set in Render dashboard)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key (set) |
| `ANTHROPIC_MODEL` | claude-haiku-4-5-20251001 (set) |
| `DATABASE_URL` | Render internal Postgres URL (set) |
| `NODE_ENV` | production (set) |

## Architecture (v2)

### AI Tools (7 total)
1. `/api/interpret` — Note interpreter → Quick Assess form
2. `/api/ia-analysis` — Initial Appointment transcript analysis
3. `/api/diagnostic-analysis` — Discovery meeting analysis by HCM module
4. `/api/demo-analysis` — Demo meeting reactions + open items
5. `/api/email-parse` — Email thread → resolve/create action items (paste from Gmail/Outlook)
6. `/api/action-extract` — Meeting transcript → action items
7. `/api/kb-ask` — Ask the UKG Ready Knowledge Base (proprietary KB grounded answers)

### Persistence (PostgreSQL)
- `GET/POST /api/deals` — list / upsert deals
- `GET/PUT/DELETE /api/deals/:id` — deal CRUD
- `POST/PUT/DELETE /api/actions` — action item CRUD
- `POST /api/deals/:id/events` — deal event log

### KB enrichment
- `POST /api/kb-context` — returns relevant KB sections for a given text block
- KB file: `kb/ukg-ready-kb.md` (proprietary Mosaic/Evolve knowledge)
- Loaded at server startup, injected into AI prompts and Tool 7

## Local development

```bash
npm install
# Set env vars:
export ANTHROPIC_API_KEY=...
export DATABASE_URL=...  # external Render postgres URL for local dev
npm start
```

## Notes

- `auth.txt` is gitignored — do not commit
- DB is Render free tier (expires 90 days, free plan) — upgrade to starter ($7/mo) for always-on
- Internal DB URL used in Render; external URL for local dev
- KB file committed to repo (proprietary but needed by server at runtime)
