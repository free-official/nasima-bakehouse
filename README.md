# NASIMA BAKEHOUSE

Starter website and Groq-powered customer chat assistant.

## Files
- `index.html`: bakery landing page and floating chat UI.
- `worker.js`: Cloudflare Worker API proxy for Groq Chat Completions.

## Configure the Worker
1. Deploy `worker.js` as a Cloudflare Worker.
2. Add a Worker secret named `GROQ_API_KEY`. Never put this key in `index.html`, GitHub, or public chat.
3. Optional variable: `GROQ_MODEL`. Default: `openai/gpt-oss-20b`.
4. If the Worker uses a separate domain, set `apiBase` in `index.html` to its Worker URL and restrict CORS to the actual website domain before public launch.

## Important
This is an initial integration scaffold. Product catalog, confirmed prices, delivery zones, WhatsApp order forwarding, order storage, rate limiting, and final deployment still need configuration and testing. The assistant is instructed not to invent missing business information or claim an order is confirmed.

## Deployment
Cloudflare Workers Builds is connected to this repository. Push changes to the `main` branch to trigger a production build. The Worker entry point is `worker.js`, and the static site is served from the repository root as configured in `wrangler.jsonc`.
