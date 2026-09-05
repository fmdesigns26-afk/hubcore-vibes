(() => {
  if (window.__hubcoreAnalyticsLive) return;
  window.__hubcoreAnalyticsLive = true;

  const VISITOR_KEY = 'hubcore-analytics-visitor-v1';
  const TRAILER_LIKED_KEY = 'hubcore-reality-trailer-liked-v1';
  const endpoint = '/api/analytics';
  const trailerUrl = 'https://hubcorevibes.com/#reality';
  const visitorId = (() => {
    try {
      let value = localStorage.getItem(VISITOR_KEY);
      if (!value) {
        value = `visitor-${crypto.randomUUID?.() || Date.now() + '-' + Math.random().toString(16).slice(2)}`;
        localStorage.setItem(VISITOR_KEY, value);
      }
      return value;
    } catch {
      return `session-${crypto.randomUUID?.() || Date.now()}`;
    }
  })();

  async function record(eventName) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({eventName, visitorId, path: location.pathname + location.hash}),
        keepalive: true
      });
      return response.ok;
    } catch (error) {
      console.warn('HubCore analytics event could not be recorded:', error);
      return false;
    }
  }

  function setStatus(message) {
    const status = document.getElementById('trailerEngagementStatus');
    if (!status) return;
    status.textContent = message;
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => { status.textContent = ''; }, 4500);
  }

  function paintLikedState() {
    const button = document.getElementById('trailerLike');
    if (!button) return;
    let liked = false;
    try { liked = localStorage.getItem(TRAILER_LIKED_KEY) === '1'; } catch {}
    button.classList.toggle('is-liked', liked);
    button.setAttribute('aria-pressed', String(liked));
    const label = button.querySelector('.trailer-action-label');
    if (label) label.textContent = liked ? 'Liked' : 'Like trailer';
  }

  async function refreshPublicTotals() {
    try {
      const response = await fetch(`${endpoint}?public=1&_=${Date.now()}`, {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Visit totals unavailable');
      document.querySelectorAll('[data-site-stat="pageViews"]').forEach(el => {
        el.textContent = Number(data.summary?.pageViews || 0).toLocaleString();
      });
      document.querySelectorAll('[data-site-stat="uniqueVisitors"]').forEach(el => {
        el.textContent = Number(data.summary?.uniqueVisitors || 0).toLocaleString();
      });
      document.querySelectorAll('[data-trailer-likes]').forEach(el => {
        el.textContent = Number(data.engagement?.trailerLikes || 0).toLocaleString();
      });
      document.querySelectorAll('[data-trailer-shares]').forEach(el => {
        el.textContent = Number(data.engagement?.trailerShares || 0).toLocaleString();
      });
      const since = document.querySelector('[data-site-tracking-since]');
      if (since && data.trackingSince) {
        since.textContent = `Live HubCore tracking since ${new Date(data.trackingSince).toLocaleDateString()}.`;
      }
    } catch (error) {
      console.warn('HubCore public totals unavailable:', error);
    }
  }

  async function likeTrailer() {
    const button = document.getElementById('trailerLike');
    if (!button || button.disabled) return;
    let alreadyLiked = false;
    try { alreadyLiked = localStorage.getItem(TRAILER_LIKED_KEY) === '1'; } catch {}
    if (alreadyLiked) {
      setStatus('You already liked this trailer.');
      return;
    }
    button.disabled = true;
    const saved = await record('trailer_like');
    button.disabled = false;
    if (!saved) {
      setStatus('Your like could not be saved. Please try again.');
      return;
    }
    try { localStorage.setItem(TRAILER_LIKED_KEY, '1'); } catch {}
    paintLikedState();
    setStatus('Thanks for liking the trailer!');
    await refreshPublicTotals();
  }

  async function shareTrailer() {
    const shareData = {
      title: 'Reality Switch — HubCore Vibes',
      text: 'Watch the Reality Switch cinematic teaser on HubCore Vibes.',
      url: trailerUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(trailerUrl);
        setStatus('Trailer link copied — ready to share.');
      } else {
        window.prompt('Copy this trailer link:', trailerUrl);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setStatus('Sharing was not completed. Please try again.');
      return;
    }
    await record('trailer_share');
    await refreshPublicTotals();
  }

  const clickEvents = [
    ['a[href="#contact"], .nav-cta', 'early_access'],
    ['#trailerPlay', 'play_teaser'],
    ['a[href="#reality"]', 'reality_switch'],
    ['a[href="#investors"]', 'investors'],
    ['a[href="#community"]', 'enter_community']
  ];

  document.addEventListener('click', event => {
    if (event.target.closest('#trailerLike')) {
      likeTrailer();
      return;
    }
    if (event.target.closest('#trailerShare')) {
      shareTrailer();
      return;
    }
    for (const [selector, eventName] of clickEvents) {
      if (event.target.closest(selector)) {
        record(eventName);
        break;
      }
    }
  }, true);

  async function init() {
    paintLikedState();
    await record('page_view');
    await refreshPublicTotals();
    setInterval(refreshPublicTotals, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
})();
