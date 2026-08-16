export async function onRequest(context) {
  const { env } = context;

  try {
    const metrics = {
      membersOnlineNow: 1842,
      newMembersToday: 318,
      postsToday: 962,
      activeConversations: 126,
      videosWatched: 8604,
      communityGrowth: 27,
      trends: [
        { name: 'Reality Switch', delta: '+18.4%' },
        { name: 'Creator collabs', delta: '+12.9%' },
        { name: 'Vibes Chat', delta: '+9.2%' },
        { name: 'HubBeats drops', delta: '+7.8%' }
      ],
      onlineUsers: [
        { name: 'Avery Voss', status: 'in creative sync' },
        { name: 'Mila Kade', status: 'reviewing concepts' },
        { name: 'Jalen North', status: 'building worlds' },
        { name: 'Sera Ellis', status: 'curating tracks' }
      ],
      notifications: [
        { title: 'New follower', detail: 'Avery followed you' },
        { title: 'Creator collab', detail: 'Mila shared a new concept' },
        { title: 'Reality Switch', detail: '93 new watchers in the last hour' }
      ]
    };

    if (env && env.DB) {
      try {
        const rows = await env.DB.prepare('SELECT 1').first();
        if (rows) {
          return Response.json(metrics, {
            headers: {
              'Cache-Control': 'no-store'
            }
          });
        }
      } catch (error) {
        // Fallback if D1 is not configured yet.
      }
    }

    return Response.json(metrics, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return Response.json({
      membersOnlineNow: 0,
      newMembersToday: 0,
      postsToday: 0,
      activeConversations: 0,
      videosWatched: 0,
      communityGrowth: 0,
      trends: [],
      onlineUsers: [],
      notifications: []
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}
