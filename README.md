# NASIMA BAKEHOUSE

Customer-facing bakery website and Groq-powered NASIMA AI assistant.

## Website features
- English premium-style bakery website with menu, prices, design inspiration gallery, policies and contact details.
- NASIMA AI answers in the customer's language (Bangla or English), explains verified menu prices, guides flavour/design selection, and collects order details conversationally.
- After the customer confirms the AI's order summary, the website pre-fills the order form for review and WhatsApp submission.
- WhatsApp order destination: 01571507618.
- Customer enquiries and order confirmation are handled by the bakery; an AI chat or WhatsApp message is not an accepted order.
- Private order manager page: `/orders.html` (requires D1 and ADMIN_TOKEN).

## Verified business information
- NASIMA BAKEHOUSE, Pollanpur More.
- Business phone: 01721458016.
- Vanilla: ৳600 per pound.
- Chocolate: ৳700 per pound.
- Custom cake prices vary by design and size and must be confirmed by the bakery.

Do not add claims about best-selling products, ingredients, delivery coverage, fees, availability, discounts, opening hours or preparation times unless the bakery verifies them.

## Cloudflare Worker configuration
1. Deploy `worker.js` with `wrangler.jsonc`.
2. Add Worker secret `GROQ_API_KEY`. Never commit API keys to GitHub or expose them in frontend code.
3. Optional Worker variable: `GROQ_MODEL`; default is `openai/gpt-oss-20b`.
4. For central order storage, create a Cloudflare D1 database, execute `schema.sql`, and bind it to the Worker as `ORDERS_DB`.
5. Add a strong Worker secret named `ADMIN_TOKEN`. Keep it private. The order manager uses it to authenticate requests to `GET /api/orders`.
6. The public website submits order details to `POST /api/orders` and opens WhatsApp. Customers must press Send in WhatsApp.

## Deployment and verification
The repository is configured for Cloudflare Workers static assets, with `worker.js` as the Worker entry point and the repository root as the assets directory. A Git push alone does not prove that production deployment succeeded. Verify the latest Cloudflare Workers Builds deployment and test the public website, NASIMA AI, WhatsApp handoff and D1 order manager before announcing launch.

## Important limitations
- Central order history is unavailable until D1 is created and bound as `ORDERS_DB`.
- The admin order page requires `ADMIN_TOKEN`.
- Search-engine indexing is separate from deployment; configure a sitemap, robots.txt and Google Search Console after the final public domain is confirmed.
