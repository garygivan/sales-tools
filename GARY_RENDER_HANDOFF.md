# Gary — Sales Tools Render/GitHub Handoff

Duder recovered/wrapped the local Quick Assess source and pushed it to GitHub/Render.

## Live assets

- GitHub repo: https://github.com/garygivan/sales-tools
- Render service: https://dashboard.render.com/web/srv-db2kv9142hec738t6d30
- Live URL: https://sales-tools-838w.onrender.com
- Health check: https://sales-tools-838w.onrender.com/health

## Render settings

- Service type: Web Service
- Runtime: Node
- Branch: main
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Auto-deploy: on commit to `main`
- Database: not needed for this app
- Persistent disk: not needed for this app

## AI/API setup still needed

The webpage is live now. The AI endpoints are wired, but Render needs one AI provider configured as environment variables.

Pick one:

### Option A — Cloudflare Workers AI

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- Optional: `CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.3-70b-instruct-fp8-fast`

### Option B — OpenAI

- `OPENAI_API_KEY`
- Optional: `OPENAI_MODEL=gpt-4o-mini`

### Option C — Anthropic

- `ANTHROPIC_API_KEY`
- Optional: `ANTHROPIC_MODEL=claude-haiku-4-5-20251001`

Until one of those is set, the app loads but API calls return a clear provider-not-configured error.

## Local development

```bash
npm install
npm test
npm start
```

## Notes

- Do not commit `auth.txt`; it is intentionally gitignored.
- The app does not require Postgres or a persistent disk unless future features need saved user data or file uploads.
