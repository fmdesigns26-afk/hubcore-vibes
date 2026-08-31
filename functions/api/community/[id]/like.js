import { json, visitor, addVisitorCookie, writeAnalytics } from "../../../lib/common.js";

export async function onRequestPost(context) {
  const v = visitor(context);
  const id = context.params.id;
  const comment = await context.env.DB.prepare("SELECT id FROM community_comments WHERE id=? AND status='visible'").bind(id).first();
  if (!comment) return addVisitorCookie(json({ error: "Comment not found" }, { status: 404 }), v);

  const existing = await context.env.DB.prepare("SELECT 1 FROM comment_likes WHERE comment_id=? AND visitor_id=?").bind(id, v.id).first();
  let liked;
  if (existing) {
    await context.env.DB.prepare("DELETE FROM comment_likes WHERE comment_id=? AND visitor_id=?").bind(id, v.id).run();
    liked = false;
  } else {
    await context.env.DB.prepare("INSERT INTO comment_likes (comment_id, visitor_id) VALUES (?, ?)").bind(id, v.id).run();
    liked = true;
    await writeAnalytics(context, "like");
  }
  const count = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM comment_likes WHERE comment_id=?").bind(id).first();
  return addVisitorCookie(json({ liked, likes: Number(count?.count || 0) }), v);
}
