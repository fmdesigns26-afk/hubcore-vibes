import { json, body, cleanText, optionalText, validEmail, verifyTurnstile, sendEmail, writeAnalytics } from "../lib/common.js";

export async function onRequestPost(context) {
  try {
    const data = await body(context.request);
    if (!(await verifyTurnstile(context, data.turnstileToken))) return json({ error: "Verification failed" }, { status: 403 });
    const fullName = cleanText(data.fullName, 80, "full name");
    const email = String(data.email || "").trim().toLowerCase();
    if (!validEmail(email)) throw new Error("A valid email is required");
    const desiredUsername = optionalText(data.desiredUsername, 40);
    const country = optionalText(data.country, 80);
    const interests = optionalText(data.interests, 500);
    const message = optionalText(data.message, 800);
    const id = crypto.randomUUID();

    await context.env.DB.prepare(
      "INSERT INTO early_access_requests (id, full_name, email, desired_username, country, interests, message) VALUES (?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(email) DO UPDATE SET full_name=excluded.full_name, desired_username=excluded.desired_username, country=excluded.country, interests=excluded.interests, message=excluded.message"
    ).bind(id, fullName, email, desiredUsername, country, interests, message).run();

    const delivery = await sendEmail(context.env, {
      subject: "HubCore Vibes — Early Access Request",
      replyTo: email,
      text: ["Name: " + fullName, "Email: " + email, "Desired username: " + (desiredUsername || "-"), "Country: " + (country || "-"), "Interests: " + (interests || "-"), "Message: " + (message || "-")].join("\n")
    });
    await writeAnalytics(context, "early_access");
    return json({ ok: true, emailConfigured: delivery.configured, message: "Your early access request has been received." });
  } catch (error) {
    return json({ error: error.message || "Unable to submit request" }, { status: 400 });
  }
}
