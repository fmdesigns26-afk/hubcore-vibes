import { json, body, cleanText, optionalText, visitor, addVisitorCookie, verifyTurnstile, writeAnalytics, rateLimit } from "../../lib/common.js";

export async function onRequestGet(context) {
  const v = visitor(context);
  const rows = await context.env.DB.prepare(
    "SELECT c.id, c.display_name, c.country, c.body, c.created_at, " +
    "(SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id = c.id) AS likes, " +
    "(SELECT COUNT(*) FROM comment_shares s WHERE s.comment_id = c.id) AS shares, " +
    "EXISTS(SELECT 1 FROM comment_likes l WHERE l.comment_id = c.id AND l.visitor_id = ?) AS liked_by_me " +
    "FROM community_comments c WHERE c.status = 'visible' ORDER BY c.created_at DESC LIMIT 100"
  ).bind(v.id).all();
  const count = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM community_comments WHERE status='visible'").first();
  const response = json({ comments: rows.results || [], total: Number(count?.count || 0) });
  return addVisitorCookie(response, v);
}

export async function onRequestPost(context) {
  const v = visitor(context);
  try {
    const data = await body(context.request);
    if (!(await verifyTurnstile(context, data.turnstileToken))) return addVisitorCookie(json({ error: "Verification failed" }, { status: 403 }), v);
    if (!(await rateLimit(context, "community_comments", v.id, 8, 60))) return addVisitorCookie(json({ error: "Please wait before posting again" }, { status: 429 }), v);

    const displayName = cleanText(data.displayName, 40, "display name");
    const country = optionalText(data.country, 80);
    const text = cleanText(data.text, 500, "comment");
    const id = crypto.randomUUID();
    await context.env.DB.prepare(
      "INSERT INTO community_comments (id, visitor_id, display_name, country, body) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, v.id, displayName, country, text).run();

    await writeAnalytics(context, "comment");
    const row = await context.env.DB.prepare(
      "SELECT id, display_name, country, body, created_at, 0 AS likes, 0 AS shares, 0 AS liked_by_me FROM community_comments WHERE id = ?"
    ).bind(id).first();
    return addVisitorCookie(json({ comment: row }, { status: 201 }), v);
  } catch (error) {
    return addVisitorCookie(json({ error: error.message || "Unable to post comment" }, { status: 400 }), v);
  }
}
