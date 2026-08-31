import { json, visitorId, visitorCookie, clientIp, rateLimit, track } from "../../../lib/community.js";

export async function onRequestPost(context) {
  const { env, request, params } = context;
  const visitor = await visitorId(request);
  const limit = await rateLimit(env, `like:${clientIp(request)}`, 120, 3600);
  if (!limit.ok) return json({ error: limit.reason }, { status: 429 });
  const post = await env.DB.prepare("SELECT id FROM posts WHERE id=? AND status='published'").bind(params.id).first();
  if (!post) return json({ error: "Post not found." }, { status: 404 });
  await env.DB.prepare("INSERT OR IGNORE INTO likes(id, post_id, visitor_id, created_at) VALUES(?, ?, ?, CURRENT_TIMESTAMP)").bind(crypto.randomUUID(), params.id, visitor).run();
  await track(env, request, "like", { postId: params.id });
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM likes WHERE post_id=?").bind(params.id).first();
  return json({ liked: true, likes: Number(count.count) }, { headers: { "Set-Cookie": visitorCookie(visitor) } });
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const visitor = await visitorId(request);
  await env.DB.prepare("DELETE FROM likes WHERE post_id=? AND visitor_id=?").bind(params.id, visitor).run();
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM likes WHERE post_id=?").bind(params.id).first();
  return json({ liked: false, likes: Number(count.count) }, { headers: { "Set-Cookie": visitorCookie(visitor) } });
}
