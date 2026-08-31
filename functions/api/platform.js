function response(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
  });
}

export async function onRequest(context) {
  const { env } = context;

  if (!env?.DB) {
    return response({
      membersOnlineNow: 0,
      newMembersToday: 0,
      postsToday: 0,
      activeConversations: 0,
      videosWatched: 0,
      communityGrowth: 0,
      trends: [],
      onlineUsers: [],
      notifications: [],
      metrics: { members: 0, creators: 0, posts: 0, projects: 0, events: 0, games: 0, messages: 0 },
      activity: []
    });
  }

  try {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const start = startOfDay.getTime();

    const [postCount, commentCount, postsToday, activeConversations, recentPosts] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS count FROM community_posts').first(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM community_comments').first(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM community_posts WHERE timestamp >= ?').bind(start).first(),
      env.DB.prepare('SELECT COUNT(DISTINCT post_id) AS count FROM community_comments').first(),
      env.DB.prepare('SELECT name, text, timestamp FROM community_posts ORDER BY timestamp DESC LIMIT 4').all()
    ]);

    const posts = Number(postCount?.count || 0);
    const comments = Number(commentCount?.count || 0);
    const today = Number(postsToday?.count || 0);
    const conversations = Number(activeConversations?.count || 0);

    const activity = (recentPosts.results || []).map(item => {
      const mins = Math.max(0, Math.floor((now - Number(item.timestamp || now)) / 60000));
      const time = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
      return { label: `${item.name || 'Someone'} shared a post`, time };
    });

    return response({
      membersOnlineNow: 0,
      newMembersToday: 0,
      postsToday: today,
      activeConversations: conversations,
      videosWatched: 0,
      communityGrowth: 0,
      trends: posts ? [{ name: 'Community posts', delta: `${posts} total` }, { name: 'Comments', delta: `${comments} total` }] : [],
      onlineUsers: [],
      notifications: [],
      metrics: {
        members: 0,
        creators: 0,
        posts,
        projects: 0,
        events: 0,
        games: 0,
        messages: comments
      },
      activity
    });
  } catch (error) {
    return response({
      membersOnlineNow: 0,
      newMembersToday: 0,
      postsToday: 0,
      activeConversations: 0,
      videosWatched: 0,
      communityGrowth: 0,
      trends: [],
      onlineUsers: [],
      notifications: [],
      metrics: { members: 0, creators: 0, posts: 0, projects: 0, events: 0, games: 0, messages: 0 },
      activity: []
    });
  }
}
