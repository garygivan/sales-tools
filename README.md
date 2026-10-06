# Quick Assess / Better Tools — Render-ready Node app

This folder is a Render-ready wrapper around the locally recovered Quick Assess source.

## Render settings

- Service type: Web Service
- Runtime: Node
- Branch: main
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Persistent disk: not needed
- Database: not needed

## Required environment variables for AI features

Pick one AI provider:

### Cloudflare Workers AI
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- Optional: `CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.3-70b-instruct-fp8-fast`

### OpenAI
- `OPENAI_API_KEY`
- Optional: `OPENAI_MODEL=gpt-4o-mini`

### Anthropic
- `ANTHROPIC_API_KEY`
- Optional: `ANTHROPIC_MODEL=claude-haiku-4-5-20251001`

Without one of those, the webpage will load, but the AI API endpoints return a provider-not-configured error.

## Local test

```bash
npm install
npm test
npm start
```
