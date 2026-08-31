function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function cleanText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env?.DB) return json({ error: 'D1 database binding DB is not configured yet.' }, 503);

  try {
    const posts = await env.DB.prepare(`
      SELECT id, name, handle, avatar, timestamp, text, reactions_json
      FROM community_posts
      ORDER BY timestamp DESC
      LIMIT 100
    `).all();

    const ids = posts.results.map(p => p.id);
    let comments = [];
    if (ids.length) {
      const placeholders = ids.map(() => '?').join(',');
      const result = await env.DB.prepare(`
        SELECT id, post_id, author, text, timestamp, reply_to
        FROM community_comments
        WHERE post_id IN (${placeholders})
        ORDER BY timestamp ASC
      `).bind(...ids).all();
      comments = result.results;
    }

    const commentMap = new Map();
    for (const comment of comments) {
      if (!commentMap.has(comment.post_id)) commentMap.set(comment.post_id, []);
      commentMap.get(comment.post_id).push({
        id: comment.id,
        author: comment.author,
        text: comment.text,
        timestamp: comment.timestamp,
        replyTo: comment.reply_to || null
      });
    }

    return json({
      posts: posts.results.map(post => ({
        id: post.id,
        name: post.name,
        handle: post.handle,
        avatar: post.avatar,
        timestamp: Number(post.timestamp),
        text: post.text,
        reactions: JSON.parse(post.reactions_json || '{"like":0,"hub":0,"fire":0,"inspire":0}'),
        userReaction: null,
        comments: commentMap.get(post.id) || []
      }))
    });
  } catch (error) {
    return json({ error: 'Unable to load community data.' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env?.DB) return json({ error: 'D1 database binding DB is not configured yet.' }, 503);

  try {
    const body = await request.json();
    const action = cleanText(body.action, 20);

    if (action === 'create_post') {
      const post = body.post || {};
      const id = cleanText(post.id, 120);
      const text = cleanText(post.text, 280);
      if (!id || !text) return json({ error: 'Post id and text are required.' }, 400);

      await env.DB.prepare(`
        INSERT OR IGNORE INTO community_posts
        (id, name, handle, avatar, timestamp, text, reactions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        cleanText(post.name, 80) || 'You',
        cleanText(post.handle, 80) || '@visitor',
        cleanText(post.avatar, 20) || 'Y',
        Number(post.timestamp) || Date.now(),
        text,
        JSON.stringify({ like: 0, hub: 0, fire: 0, inspire: 0 })
      ).run();

      return json({ ok: true, synced: true, id });
    }

    if (action === 'create_comment') {
      const comment = body.comment || {};
      const id = cleanText(comment.id, 120);
      const postId = cleanText(comment.postId, 120);
      const text = cleanText(comment.text, 180);
      if (!id || !postId || !text) return json({ error: 'Comment id, post id and text are required.' }, 400);

      await env.DB.prepare(`
        INSERT OR IGNORE INTO community_comments
        (id, post_id, author, text, timestamp, reply_to)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        postId,
        cleanText(comment.author, 80) || 'You',
        text,
        Number(comment.timestamp) || Date.now(),
        cleanText(comment.replyTo, 120) || null
      ).run();

      return json({ ok: true, synced: true, id });
    }

    return json({ error: 'Unknown community action.' }, 400);
  } catch (error) {
    return json({ error: 'Unable to save community data.' }, 500);
  }
}
