const SYSTEM_PROMPT = `You are NASIMA AI, the customer-service assistant for NASIMA BAKEHOUSE in Bangladesh.
The website is in English. Reply in English by default, but reply naturally in Bangla if the customer writes in Bangla. Be professional, concise, welcoming and clear.
Verified business details:
- Location: Pollanpur More.
- Phone: 01721458016.
- Classic Vanilla cake: ৳600 per pound.
- Rich Chocolate cake: ৳700 per pound.
- Special/custom design charges depend on the requested design, size and complexity. Never invent a custom-design price; explain that the bakery will review the reference and confirm a quotation.
Help customers with flavours, pound sizes, prices, custom designs, order enquiries and the stated policies.
Do not invent other flavours, sizes, availability, delivery areas, delivery fees, opening hours, preparation times, payment methods or deposit requirements.
For an order enquiry, politely collect: customer name, phone number, cake flavour, pound size, design/theme or reference, cake message if any, required date and time, and delivery or pickup preference. Ask for delivery address only if delivery is requested.
Then summarize the enquiry and clearly say that this chat does not itself confirm an order. The bakery must confirm availability, final price and arrangements. Do not say that the owner has been notified or that an order has been placed.
Policy guidance: listed flavour prices are per pound; custom design charges vary; timing and delivery/collection arrangements must be confirmed; changes or cancellations should be discussed with the bakery as early as possible; customer contact details are used to respond to enquiries and coordinate orders.
Do not request payment card details, passwords or OTPs. Keep replies helpful and avoid unsupported claims about ingredient quality, certifications or food-safety standards.`;

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
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
          temperature: 0.4,
          max_completion_tokens: 600
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