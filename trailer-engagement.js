(() => {
  if (window.__hubcoreTrailerEngagement) return;
  window.__hubcoreTrailerEngagement = true;

  const endpoint = '/api/analytics';
  const visitorKey = 'hubcore-analytics-visitor-v1';
  const likedKey = 'hubcore-reality-trailer-liked-v1';
  const trailerUrl = 'https://hubcorevibes.com/#reality';
  const visitorId = (() => {
    try {
      let id = localStorage.getItem(visitorKey);
      if (!id) {
        id = `visitor-${crypto.randomUUID?.() || Date.now() + '-' + Math.random().toString(16).slice(2)}`;
        localStorage.setItem(visitorKey, id);
      }
      return id;
    } catch {
      return `session-${crypto.randomUUID?.() || Date.now()}`;
    }
  })();

  const status = message => {
    const el = document.getElementById('trailerEngagementStatus');
    if (!el) return;
    el.textContent = message;
    clearTimeout(status.timer);
    status.timer = setTimeout(() => { el.textContent = ''; }, 4500);
  };

  const isLiked = () => {
    try { return localStorage.getItem(likedKey) === '1'; } catch { return false; }
  };

  const paintLiked = () => {
    const button = document.getElementById('trailerLike');
    if (!button) return;
    const liked = isLiked();
    button.classList.toggle('is-liked', liked);
    button.setAttribute('aria-pressed', String(liked));
    const label = button.querySelector('.trailer-action-label');
    if (label) label.textContent = liked ? 'Liked' : 'Like trailer';
  };

  async function record(eventName) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({eventName, visitorId, path: location.pathname + location.hash}),
        keepalive: true
      });
      return response.ok;
    } catch { return false; }
  }

  async function refresh() {
    try {
      const response = await fetch(`${endpoint}?public=1&trailer=${Date.now()}`, {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) return;
      document.querySelectorAll('[data-trailer-likes]').forEach(el => {
        el.textContent = Number(data.engagement?.trailerLikes || 0).toLocaleString();
      });
      document.querySelectorAll('[data-trailer-shares]').forEach(el => {
        el.textContent = Number(data.engagement?.trailerShares || 0).toLocaleString();
      });
    } catch {}
  }

  async function handleLike() {
    const button = document.getElementById('trailerLike');
    if (!button || button.disabled) return;
    if (isLiked()) {
      status('You already liked this trailer.');
      return;
    }
    button.disabled = true;
    const saved = await record('trailer_like');
    button.disabled = false;
    if (!saved) {
      status('Your like could not be saved. Please try again.');
      return;
    }
    try { localStorage.setItem(likedKey, '1'); } catch {}
    paintLiked();
    status('Thanks for liking the trailer!');
    await refresh();
  }

  async function handleShare() {
    const data = {
      title: 'Reality Switch — HubCore Vibes',
      text: 'Watch the Reality Switch cinematic teaser on HubCore Vibes.',
      url: trailerUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trailerUrl);
        status('Trailer link copied — ready to share.');
      } else {
        window.prompt('Copy this trailer link:', trailerUrl);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') status('Sharing was not completed. Please try again.');
      return;
    }
    await record('trailer_share');
    await refresh();
  }

  function init() {
    const like = document.getElementById('trailerLike');
    const share = document.getElementById('trailerShare');
    if (!like || !share) return;
    paintLiked();
    like.addEventListener('click', handleLike);
    share.addEventListener('click', handleShare);
    refresh();
    setInterval(refresh, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
})();
