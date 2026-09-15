const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

export async function onRequestGet({ env }) {
  const enabled = env.AI_VIDEO_ENABLED === '1' && Boolean(env.RUNWAY_API_KEY);
  return json({
    enabled,
    studio: 'reel-vibes-ai',
    modes: ['auto_cut', 'photo_reel', 'captions', 'music_sync'],
    message: enabled
      ? 'AI Reel Studio rendering is enabled.'
      : 'AI Reel Studio interface is live, but rendering is not enabled yet.'
  });
}

export async function onRequestPost({ env }) {
  const enabled = env.AI_VIDEO_ENABLED === '1' && Boolean(env.RUNWAY_API_KEY);
  if (!enabled) {
    return json({
      error: 'AI rendering is not enabled yet. Your media was not processed or published.'
    }, 503);
  }

  return json({
    error: 'AI rendering is configured but the generation pipeline is not live yet.'
  }, 501);
}
