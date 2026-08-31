import { json, escapeText, clientIp, rateLimit, verifyTurnstile, track } from "../lib/community.js";

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) return json({ error: "Contact service is not configured yet." }, { status: 503 });
  const limit = await rateLimit(env, `contact:${clientIp(request)}`, 8, 3600);
  if (!limit.ok) return json({ error: limit.reason }, { status: 429 });
  let body; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, { status: 400 }); }
  const type = ["early_access", "investor"].includes(body.type) ? body.type : "early_access";
  const name = escapeText(body.name, 80);
  const email = escapeText(body.email, 180);
  const message = escapeText(body.message, 2000);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter your name and a valid email address." }, { status: 400 });
  if (!(await verifyTurnstile(request, env, body.turnstileToken))) return json({ error: "Security verification failed. Please try again." }, { status: 403 });
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO contact_submissions(id, type, name, email, message, status, created_at) VALUES(?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP)").bind(id, type, name, email, message).run();
  if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL) {
    try {
      await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || "HubCore Vibes <onboarding@resend.dev>",
        to: [env.CONTACT_TO_EMAIL],
        subject: `HubCore Vibes: ${type === "investor" ? "Investor enquiry" : "Early access request"}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      })});
    } catch (_) {}
  }
  await track(env, request, type === "investor" ? "investor_contact" : "signup");
  return json({ ok: true, message: type === "investor" ? "Thank you. Your investor enquiry has been received." : "Thank you. Your early access request has been received." }, { status: 201 });
}
