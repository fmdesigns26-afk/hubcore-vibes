import { json, isAdmin } from "../../lib/common.js";

export async function onRequestGet(context) {
  if (!(await isAdmin(context.request, context.env))) return json({ error: "Unauthorized" }, { status: 401 });

  const [comments, likes, shares, earlyAccess, investors, latestComments, latestEarly, latestInvestors] = await Promise.all([
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM community_comments WHERE status='visible'").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM comment_likes").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM comment_shares").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM early_access_requests").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS count FROM investor_inquiries").first(),
    context.env.DB.prepare("SELECT id, display_name, country, body, created_at FROM community_comments ORDER BY created_at DESC LIMIT 100").all(),
    context.env.DB.prepare("SELECT full_name, email, desired_username, country, interests, message, created_at FROM early_access_requests ORDER BY created_at DESC LIMIT 100").all(),
    context.env.DB.prepare("SELECT full_name, email, company, country, investment_interest, message, created_at FROM investor_inquiries ORDER BY created_at DESC LIMIT 100").all()
  ]);

  return json({
    totals: {
      comments: Number(comments?.count || 0),
      likes: Number(likes?.count || 0),
      shares: Number(shares?.count || 0),
      earlyAccess: Number(earlyAccess?.count || 0),
      investors: Number(investors?.count || 0)
    },
    comments: latestComments.results || [],
    earlyAccessRequests: latestEarly.results || [],
    investorInquiries: latestInvestors.results || []
  });
}
