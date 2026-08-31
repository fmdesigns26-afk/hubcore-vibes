export async function onRequest(context) {
  try {
    const { DB } = context.env;
    const [comments, likes, shares, earlyAccess] = await Promise.all([
      DB.prepare("SELECT COUNT(*) AS count FROM community_comments WHERE status='visible'").first(),
      DB.prepare("SELECT COUNT(*) AS count FROM comment_likes").first(),
      DB.prepare("SELECT COUNT(*) AS count FROM comment_shares").first(),
      DB.prepare("SELECT COUNT(*) AS count FROM early_access_requests").first()
    ]);
    return Response.json({
      metrics: {
        comments: Number(comments?.count || 0),
        likes: Number(likes?.count || 0),
        shares: Number(shares?.count || 0),
        earlyAccess: Number(earlyAccess?.count || 0)
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (_) {
    return Response.json({ error: "Live metrics are not configured yet" }, { status: 503 });
  }
}
