import { json, visitorId, visitorCookie, clientIp, rateLimit, track } from "../../../lib/community.js";

export async function onRequestPost(context) {
  const { env, request, params } = context;
  const visitor = await visitorId(request);
  const limit = await rateLimit(env, `share:${clientIp(request)}`, 60, 3600);
  if (!limit.ok) return json({ error: limit.reason }, { status: 429 });
  const post = await env.DB.prepare("SELECT id FROM posts WHERE id=? AND status='published'").bind(params.id).first();
  if (!post) return json({ error: "Post not found." }, { status: 404 });
  let body = {}; try { body = await request.json(); } catch (_) {}
  await env.DB.prepare("INSERT INTO shares(id, post_id, visitor_id, channel, created_at) VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP)").bind(crypto.randomUUID(), params.id, visitor, String(body.channel || "unknown").slice(0, 30)).run();
  await track(env, request, "share", { postId: params.id });
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM shares WHERE post_id=?").bind(params.id).first();
  return json({ shares: Number(count.count) }, { headers: { "Set-Cookie": visitorCookie(visitor) } });
}
