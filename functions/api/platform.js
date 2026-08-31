export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({ error: "Database is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const [comments, likes, shares, countries] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM posts WHERE status='published'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM likes").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM shares").first(),
    env.DB.prepare("SELECT COUNT(DISTINCT author_country) AS count FROM posts WHERE status='published' AND author_country IS NOT NULL AND TRIM(author_country) <> ''").first()
  ]);
  return Response.json({
    comments: Number(comments.count),
    likes: Number(likes.count),
    shares: Number(shares.count),
    countries: Number(countries.count)
  }, { headers: { "Cache-Control": "no-store" } });
}
