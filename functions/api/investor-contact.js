import { json, body, cleanText, optionalText, validEmail, verifyTurnstile, sendEmail, writeAnalytics } from "../lib/common.js";

export async function onRequestPost(context) {
  try {
    const data = await body(context.request);
    if (!(await verifyTurnstile(context, data.turnstileToken))) return json({ error: "Verification failed" }, { status: 403 });
    const fullName = cleanText(data.fullName, 100, "full name");
    const email = String(data.email || "").trim().toLowerCase();
    if (!validEmail(email)) throw new Error("A valid email is required");
    const company = optionalText(data.company, 120);
    const country = optionalText(data.country, 80);
    const investmentInterest = optionalText(data.investmentInterest, 120);
    const message = cleanText(data.message, 3000, "message");
    const id = crypto.randomUUID();

    await context.env.DB.prepare(
      "INSERT INTO investor_inquiries (id, full_name, email, company, country, investment_interest, message) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, fullName, email, company, country, investmentInterest, message).run();

    const delivery = await sendEmail(context.env, {
      subject: "HubCore Vibes — Investor Enquiry",
      replyTo: email,
      text: ["Name: " + fullName, "Email: " + email, "Company: " + (company || "-"), "Country: " + (country || "-"), "Interest: " + (investmentInterest || "-"), "", message].join("\n")
    });
    await writeAnalytics(context, "investor_contact");
    return json({ ok: true, emailConfigured: delivery.configured, message: "Thank you. Your investor enquiry has been received." });
  } catch (error) {
    return json({ error: error.message || "Unable to submit enquiry" }, { status: 400 });
  }
}
