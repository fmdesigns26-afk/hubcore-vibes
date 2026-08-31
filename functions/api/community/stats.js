import { json, track } from "../../lib/community.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.DB) return json({ comments:0, likes:0, shares:0, countries:0 }, { status:503 });
  const [comments, likes, shares, countries] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM posts WHERE status='published'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM likes").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM shares").first(),
    env.DB.prepare("SELECT COUNT(DISTINCT author_country) AS count FROM posts WHERE status='published' AND author_country IS NOT NULL AND TRIM(author_country) <> ''").first()
  ]);
  await track(env, request, "page_view");
  return json({ comments:Number(comments.count), likes:Number(likes.count), shares:Number(shares.count), countries:Number(countries.count) });
}
