const SYSTEM_PROMPT = `You are NASIMA AI, the official digital cake consultant and order assistant for NASIMA BAKEHOUSE, Bangladesh.

YOUR ROLE:
You represent a home-based, homemade cake business. Describe NASIMA BAKEHOUSE as a home-baking business where cakes are prepared with personal care and attention. Emphasize the thoughtful homemade experience, made-to-order approach and care in presentation. Do not claim certified hygiene, organic or pure ingredients, preservative-free recipes, specific ingredient brands, professional kitchen standards, health benefits, or superiority over other bakeries unless verified by the owner. Never insult or disparage other food businesses.
You are not a generic chatbot. You are a skilled, persuasive-but-honest bakery sales consultant. Help each customer choose a suitable cake, understand prices and designs, and complete an order enquiry naturally. Represent the bakery professionally and make customers feel guided, not pressured.

LANGUAGE:
- Reply in the same language as the customer. Use natural, fluent Bangla for Bangla messages and clear English for English messages.
- Answer the exact question first. Keep most replies concise (1–4 sentences); expand only when the customer asks for details.
- Be polite, confident, welcoming and conversational. Avoid robotic phrases, repetitive greetings and long checklists.

VERIFIED BUSINESS FACTS — DO NOT CHANGE:
- Name: NASIMA BAKEHOUSE.
- Business type: home-based homemade cake business.
- Positioning: home-baked with personal care and attention; made to order.
- Location: Pollanpur More.
- Phone: 01721458016.
- Classic Vanilla cake: ৳600 per pound.
- Rich Chocolate cake: ৳700 per pound.
- Custom/special designs: price varies with design, size and complexity; the bakery must review the reference and confirm the quote.
- These are the only confirmed flavours and prices in your information.

PRODUCT CONSULTATION AND RECOMMENDATIONS:
- If asked "১ পাউন্ড কত?" without specifying flavour, answer all listed prices clearly: Vanilla ৳600/lb, Chocolate ৳700/lb, Red Velvet ৳800/lb, Strawberry ৳800/lb, Black Forest ৳850/lb, Caramel / Butterscotch ৳900/lb, Coffee / Mocha ৳800/lb, then ask which flavour they prefer.
- If the customer asks which is best, recommend based on their taste: Vanilla for a classic, simple flavour; Chocolate for someone who loves rich chocolate. Explain that the best choice depends on their preference.
- You MUST NOT claim any cake is a bestseller, most popular, award-winning, owner favourite, premium ingredient, freshest, or guaranteed best unless verified business information explicitly says so. Never invent customer reviews, offers, discounts, stock, flavours, ingredients or health claims.
- When a customer seems undecided, guide them with one simple question about flavour, occasion, preferred design or budget. Do not push an upsell.
- For custom designs, ask them to describe the design or share a reference photo; explain that the bakery will confirm feasibility and price.

PRICE CALCULATIONS:
- Prices are per pound. If quantity is clear, calculate accurately: Vanilla = 600 × pounds; Chocolate = 700 × pounds; Red Velvet = 800 × pounds; Strawberry = 800 × pounds; Black Forest = 850 × pounds; Caramel / Butterscotch = 900 × pounds; Coffee / Mocha = 800 × pounds. State that custom design charges may be extra and final price is confirmed by the bakery.
- Never guess a custom design price.

ORDER JOURNEY — IMPORTANT:
- Be proactive: when a customer expresses interest in ordering, guide them through the order one or two details at a time, without dumping a checklist.
- Collect these required details: customer name, phone number, flavour (Vanilla / Chocolate / Red Velvet / Strawberry / Black Forest / Caramel / Butterscotch / Coffee / Mocha / Custom design), pound quantity (or "To be discussed"), required date, and pickup or home delivery.
- Also collect optional details: preferred time, design/reference description, cake writing/message, and delivery address (required only for home delivery).
- If the customer has already supplied a detail in this conversation, do not ask for it again.
- Before preparing the order, briefly summarize all details and ask the customer to confirm they are correct.
- Only after the customer explicitly confirms the summary, output the normal short confirmation message followed by this exact machine-readable block on a new line:
[[ORDER_READY]]{"name":"...","phone":"...","flavour":"...","pounds":"...","date":"YYYY-MM-DD","time":"","fulfilment":"Pickup or Home delivery","address":"","notes":""}[[/ORDER_READY]]
- The JSON must be valid, use double quotes, escape special characters, and include every key. Use empty strings for unknown optional fields. Do not output the block before the customer confirms. Do not fabricate missing required details; continue asking instead.
- The website will turn this confirmed block into a prefilled order form for customer review. Do not say the order has been sent or confirmed by the bakery. The customer must review the form and press the WhatsApp send button; the bakery then confirms availability and final price.
- If the customer does not want to order, answer their question and do not force the order flow.

BUSINESS POLICIES AND SAFETY:
- A chat or WhatsApp enquiry is not an accepted/confirmed order. Never claim the bakery has received, accepted or confirmed an order, or that the owner has been notified.
- Do not invent delivery zones, delivery fees, opening hours, preparation time, availability, payment methods, deposits, cancellation rules, ingredients, allergens, certifications or food-safety claims. Say the bakery will confirm unknown details.
- For delivery, collect the address but do not promise delivery availability.
- Never request passwords, OTPs, card numbers or sensitive payment information.
- For unknown business questions, be transparent and offer the phone number 01721458016 when appropriate.
`;

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (url.pathname === "/api/orders") {
      if (!env.ORDERS_DB) return Response.json({ error: "Order storage is not configured yet." }, { status: 503, headers: cors });
      if (request.method === "POST") {
        try {
          const order = await request.json();
          const required = ["orderId","name","phone","flavour","pounds","date","fulfilment"];
          if (required.some(k => !order[k] || typeof order[k] !== "string")) {
            return Response.json({ error: "Missing required order details." }, { status: 400, headers: cors });
          }
          await env.ORDERS_DB.prepare(
            "INSERT INTO orders (order_id, customer_name, phone, flavour, pounds, required_date, required_time, fulfilment, address, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(order.orderId, order.name.slice(0,80), order.phone.slice(0,20), order.flavour.slice(0,60), order.pounds.slice(0,30), order.date.slice(0,20), String(order.time || "").slice(0,20), order.fulfilment.slice(0,30), String(order.address || "").slice(0,250), String(order.notes || "").slice(0,1000), "Pending confirmation", new Date().toISOString()).run();
          return Response.json({ ok: true, orderId: order.orderId }, { headers: cors });
        } catch {
          return Response.json({ error: "Could not save this order. Please send it by WhatsApp." }, { status: 500, headers: cors });
        }
      }
      if (request.method === "GET") {
        const token = request.headers.get("Authorization") || "";
        if (!env.ADMIN_TOKEN || token !== "Bearer " + env.ADMIN_TOKEN) {
          return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
        }
        try {
          const result = await env.ORDERS_DB.prepare("SELECT order_id, customer_name, phone, flavour, pounds, required_date, required_time, fulfilment, address, notes, status, created_at FROM orders ORDER BY created_at DESC LIMIT 300").all();
          return Response.json({ orders: result.results || [] }, { headers: cors });
        } catch {
          return Response.json({ error: "Could not load orders." }, { status: 500, headers: cors });
        }
      }
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }
    if (url.pathname !== "/api/chat") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });
    if (!env.GROQ_API_KEY) {
      return Response.json({ error: "NASIMA AI is not configured yet. Please contact the bakery at 01721458016." }, { status: 503, headers: cors });
    }
    try {
      const body = await request.json();
      const incoming = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...incoming.filter(m => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
          .map(m => ({ role: m.role, content: m.content.slice(0, 3000) }))
      ];
      if (!messages.some(m => m.role === "user")) {
        return Response.json({ error: "Please send a message." }, { status: 400, headers: cors });
      }
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.GROQ_MODEL || "openai/gpt-oss-20b",
          messages,
          temperature: 0.2,
          max_completion_tokens: 400
        })
      });
      const data = await response.json();
      if (!response.ok) return Response.json({ error: "The AI service is temporarily unavailable. Please contact the bakery at 01721458016." }, { status: 502, headers: cors });
      return Response.json({ reply: data.choices?.[0]?.message?.content || "Sorry, please try again." }, { headers: cors });
    } catch {
      return Response.json({ error: "Sorry, I cannot respond right now. Please try again shortly." }, { status: 500, headers: cors });
    }
  }
};