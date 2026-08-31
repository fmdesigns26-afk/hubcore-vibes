import { json, escapeText, initials, visitorId, visitorCookie, clientIp, rateLimit, track, verifyTurnstile } from "../lib/community.js";

function postView(row) {
  return {
    id: row.id,
    name: row.author_name,
    country: row.author_country || "",
    avatar: initials(row.author_name),
    text: row.body,
    createdAt: row.created_at,
    likes: Number(row.like_count || 0),
    shares: Number(row.share_count || 0),
    liked: Boolean(row.liked)
  };
}

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.DB) return json({ error: "Community database is not configured yet." }, { status: 503 });
  const visitor = await visitorId(request);
  const rows = await env.DB.prepare(`SELECT p.id, p.author_name, p.author_country, p.body, p.created_at,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) AS like_count,
    (SELECT COUNT(*) FROM shares s WHERE s.post_id=p.id) AS share_count,
    EXISTS(SELECT 1 FROM likes l WHERE l.post_id=p.id AND l.visitor_id=?) AS liked
    FROM posts p WHERE p.status='published' ORDER BY p.created_at DESC LIMIT 100`).bind(visitor).all();
  return json({ posts: rows.results.map(postView) }, { headers: { "Set-Cookie": visitorCookie(visitor) } });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) return json({ error: "Community database is not configured yet." }, { status: 503 });
  const visitor = await visitorId(request);
  const limit = await rateLimit(env, `post:${clientIp(request)}`, 6, 3600);
  if (!limit.ok) return json({ error: limit.reason }, { status: 429 });
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, { status: 400 }); }
  const name = escapeText(body.name, 60);
  const country = escapeText(body.country, 80);
  const text = escapeText(body.text, 500);
  if (name.length < 2 || text.length < 2) return json({ error: "Please enter your name and a community comment." }, { status: 400 });
  if (!(await verifyTurnstile(request, env, body.turnstileToken))) return json({ error: "Security verification failed. Please try again." }, { status: 403 });
  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO posts(id, user_id, visitor_id, author_name, author_country, body, status, created_at, updated_at)
    VALUES(?, NULL, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(id, visitor, name, country, text).run();
  await track(env, request, "comment", { postId: id, country });
  const row = await env.DB.prepare(`SELECT p.id, p.author_name, p.author_country, p.body, p.created_at, 0 AS like_count, 0 AS share_count, 0 AS liked FROM posts p WHERE p.id=?`).bind(id).first();
  return json({ post: postView(row) }, { status: 201, headers: { "Set-Cookie": visitorCookie(visitor) } });
}
