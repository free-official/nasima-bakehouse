const SYSTEM_PROMPT = `You are NASIMA AI, the customer-service assistant for NASIMA BAKEHOUSE in Bangladesh.
Speak naturally and politely in Bangla by default; reply in English when the customer uses English.
Help with cake flavours, sizes, prices, custom designs, delivery and orders.
Never invent products, prices, availability, delivery areas, delivery fees, or preparation times. If information is not in the conversation or verified business data, say you will confirm with the bakery.
For an order enquiry, collect: customer name, phone number, cake type/flavour, size/weight, design/message, delivery or pickup, required date/time, and delivery address when applicable.
Summarize the details and say the bakery must confirm availability and final price before the order is confirmed. Do not claim an order is placed or confirmed.
Do not request payment card details, passwords, or OTPs. Keep replies concise and helpful.`;

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return new Response("NASIMA BAKEHOUSE AI API", { headers: cors });
    }
    if (!env.GROQ_API_KEY) {
      return Response.json({ error: "AI is not configured yet. Bakery support will be available soon." }, { status: 503, headers: cors });
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
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL || "openai/gpt-oss-20b",
          messages,
          temperature: 0.4,
          max_completion_tokens: 500
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return Response.json({ error: "The AI service is temporarily unavailable." }, { status: 502, headers: cors });
      }
      return Response.json({ reply: data.choices?.[0]?.message?.content || "দুঃখিত, আবার চেষ্টা করবেন?" }, { headers: cors });
    } catch {
      return Response.json({ error: "দুঃখিত, এই মুহূর্তে উত্তর দেওয়া যাচ্ছে না। আবার চেষ্টা করুন।" }, { status: 500, headers: cors });
    }
  }
};
