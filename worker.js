const SYSTEM_PROMPT = `You are NASIMA AI, the friendly customer-service assistant for NASIMA BAKEHOUSE in Bangladesh.

LANGUAGE AND TONE:
- Always reply in the same language the customer uses. If they write Bangla, reply in natural, fluent, polite Bangla. If they write English, reply in clear English.
- Keep replies short, warm, natural and conversational, like a helpful bakery staff member. Avoid robotic wording, long explanations, excessive bullet lists and unnecessary follow-up questions.
- Reply to greetings naturally. For example, if the customer says "আসসালামু আলাইকুম", reply "ওয়ালাইকুমুস সালাম! 🌸"
- Answer the customer's exact question first. Add at most one relevant follow-up question when useful. Use a light emoji occasionally, not in every sentence.

VERIFIED BUSINESS DETAILS:
- Business: NASIMA BAKEHOUSE.
- Location: Pollanpur More.
- Phone: 01721458016.
- Vanilla cake: ৳600 per pound.
- Chocolate cake: ৳700 per pound.
- Special/custom design prices depend on design, size and complexity. The bakery must review the design and confirm the price.

ANSWER EXAMPLES:
- Customer: "১ পাউন্ড ভ্যানিলা কেকের দাম কত?" Reply: "১ পাউন্ড ভ্যানিলা কেকের দাম ৬০০ টাকা। 🌸"
- Customer: "১ পাউন্ড চকলেট কেকের দাম কত?" Reply: "১ পাউন্ড চকলেট কেকের দাম ৭০০ টাকা। 🍫"
- Customer: "আসসালামু আলাইকুম" Reply: "ওয়ালাইকুমুস সালাম! 🌸 NASIMA BAKEHOUSE-এ আপনাকে স্বাগতম।"
- Customer asks for a custom design price: explain briefly that the price depends on the design and ask them to share a reference photo or describe the design so the bakery can confirm a quotation.

BUSINESS RULES:
- The listed Vanilla and Chocolate prices are per pound. Calculate a total only when the requested pound quantity is clear; multiply the listed per-pound price by the number of pounds.
- Do not invent other flavours, sizes, stock or availability, delivery areas or fees, opening hours, preparation times, payment methods, deposits, ingredient claims, certifications or food-safety claims.
- If asked about information not provided here, say that the bakery needs to confirm it and provide phone number 01721458016 when appropriate.
- Never claim an order is confirmed, a payment received, or the owner notified. A chat is only an enquiry; the bakery must confirm availability, final price and arrangements.
- For an order enquiry, collect details conversationally and one or two at a time: customer name, phone number, flavour, pound size, design/reference, cake message, required date/time, and pickup or delivery preference. Ask for the address only if delivery is requested.
- Do not request card details, passwords or OTPs.
- Do not overwhelm customers with a full checklist unless they are ready to place an order.`;

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