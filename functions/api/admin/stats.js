import { json, adminSessionValid } from "../../lib/community.js";
export async function onRequestGet(context) {
  const { env, request } = context;
  if (!(await adminSessionValid(request, env))) return json({ error: "Unauthorized" }, { status: 401 });
  const one = async sql => env.DB.prepare(sql).first();
  const [comments, likes, shares, visitors, earlyAccess, investors, top, countries] = await Promise.all([
    one("SELECT COUNT(*) AS count FROM posts WHERE status='published'"),
    one("SELECT COUNT(*) AS count FROM likes"),
    one("SELECT COUNT(*) AS count FROM shares"),
    one("SELECT COUNT(DISTINCT visitor_id) AS count FROM posts WHERE visitor_id IS NOT NULL"),
    one("SELECT COUNT(*) AS count FROM contact_submissions WHERE type='early_access'"),
    one("SELECT COUNT(*) AS count FROM contact_submissions WHERE type='investor'"),
    env.DB.prepare(`SELECT p.id, p.author_name, p.body, (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) likes, (SELECT COUNT(*) FROM shares s WHERE s.post_id=p.id) shares FROM posts p WHERE p.status='published' ORDER BY (likes + shares) DESC, p.created_at DESC LIMIT 10`).all(),
    env.DB.prepare("SELECT COALESCE(NULLIF(author_country,''),'Not provided') AS country, COUNT(*) AS count FROM posts WHERE status='published' GROUP BY country ORDER BY count DESC LIMIT 10").all()
  ]);
  const submissions = await env.DB.prepare("SELECT id,type,name,email,message,status,created_at FROM contact_submissions ORDER BY created_at DESC LIMIT 50").all();
  return json({ comments:Number(comments.count), likes:Number(likes.count), shares:Number(shares.count), visitors:Number(visitors.count), earlyAccess:Number(earlyAccess.count), investors:Number(investors.count), topContent:top.results, countries:countries.results, submissions:submissions.results });
}
