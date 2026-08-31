import { json, body, cleanText, optionalText, visitor, addVisitorCookie } from "../lib/common.js";

export async function onRequestPost(context) {
  const v = visitor(context);
  try {
    const data = await body(context.request);
    const targetType = cleanText(data.targetType, 30, "target type");
    const targetId = cleanText(data.targetId, 100, "target id");
    const reason = cleanText(data.reason, 120, "reason");
    const details = optionalText(data.details, 1000);
    await context.env.DB.prepare(
      "INSERT INTO reports (id, visitor_id, target_type, target_id, reason, details) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), v.id, targetType, targetId, reason, details).run();
    return addVisitorCookie(json({ ok: true, message: "Thank you. Your report has been received." }), v);
  } catch (error) {
    return addVisitorCookie(json({ error: error.message || "Unable to submit report" }, { status: 400 }), v);
  }
}
