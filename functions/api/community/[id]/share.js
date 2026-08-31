import { json, visitor, addVisitorCookie, writeAnalytics } from "../../../lib/common.js";

export async function onRequestPost(context) {
  const v = visitor(context);
  const id = context.params.id;
  const comment = await context.env.DB.prepare("SELECT id FROM community_comments WHERE id=? AND status='visible'").bind(id).first();
  if (!comment) return addVisitorCookie(json({ error: "Comment not found" }, { status: 404 }), v);

  await context.env.DB.prepare("INSERT INTO comment_shares (id, comment_id, visitor_id) VALUES (?, ?, ?)").bind(crypto.randomUUID(), id, v.id).run();
  await writeAnalytics(context, "share");
  const count = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM comment_shares WHERE comment_id=?").bind(id).first();
  return addVisitorCookie(json({ shares: Number(count?.count || 0) }), v);
}
