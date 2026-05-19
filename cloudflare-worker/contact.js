/**
 * Worker opcional (Cloudflare) — envio sem Web3Forms via Mailchannels.
 *
 * Deploy: Workers & Pages → Create Worker → colar este código
 * Rota: rafaelgois.com/api/contact  (ou subdomínio api.*)
 *
 * DNS / Email: adicione SPF se ainda não tiver:
 *   v=spf1 include:relay.mailchannels.net ~all
 *
 * No contact-config.js use:
 *   customEndpoint: "https://rafaelgois.com/api/contact"
 * e deixe web3formsAccessKey vazio.
 */

const ALLOWED_ORIGINS = new Set([
  "https://rafaelgois.com",
  "https://www.rafaelgois.com",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);

const TO_EMAIL = "contato@rafaelgois.com";
const FROM_EMAIL = "noreply@rafaelgois.com";

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://rafaelgois.com";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(corsOrigin) });
    }

    if (request.method !== "POST") {
      return json({ success: false, message: "Method not allowed" }, 405, corsOrigin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ success: false, message: "JSON inválido" }, 400, corsOrigin);
    }

    const { name, email, subject, message, botcheck } = payload;
    if (botcheck) {
      return json({ success: true }, 200, corsOrigin);
    }

    if (!name || !email || !message) {
      return json({ success: false, message: "Campos obrigatórios ausentes" }, 400, corsOrigin);
    }

    const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL, name: "Rafael Gois" }] }],
        from: { email: FROM_EMAIL, name: "Portfolio — Contato" },
        reply_to: { email, name },
        subject: subject ? `[Site] ${subject}` : `[Site] Contato de ${name}`,
        content: [
          {
            type: "text/plain",
            value: `Nome: ${name}\nE-mail: ${email}\nAssunto: ${subject || "—"}\n\n${message}`,
          },
        ],
      }),
    });

    if (mailRes.ok) {
      return json({ success: true }, 200, corsOrigin);
    }

    const errText = await mailRes.text().catch(() => "");
    console.error("Mailchannels error", mailRes.status, errText);
    return json({ success: false, message: "Falha ao enviar e-mail" }, 502, corsOrigin);
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}
