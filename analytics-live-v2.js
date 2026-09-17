(() => {
  if (window.__hubcoreAnalyticsLive) return;
  window.__hubcoreAnalyticsLive = true;

  const VISITOR_KEY = 'hubcore-analytics-visitor-v1';
  const TRAILER_LIKED_KEY = 'hubcore-reality-trailer-liked-v1';
  const REALITY_VIEW_SESSION_KEY = 'hubcore-reality-video-session-v1';
  const endpoint = '/api/analytics';
  const realityViewsEndpoint = '/api/reality-views';
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
  const realityViewSessionId = (() => {
    try {
      let value = sessionStorage.getItem(REALITY_VIEW_SESSION_KEY);
      if (!value) {
        value = `video-session-${crypto.randomUUID?.() || Date.now() + '-' + Math.random().toString(16).slice(2)}`;
        sessionStorage.setItem(REALITY_VIEW_SESSION_KEY, value);
      }
      return value;
    } catch {
      return `video-session-${crypto.randomUUID?.() || Date.now()}`;
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

  function ensureRealityViewStyles() {
    if (document.getElementById('hubcoreRealityViewStyles')) return;
    const style = document.createElement('style');
    style.id = 'hubcoreRealityViewStyles';
    style.textContent = `
      .rs-trailer-viewbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 15px 13px;border-top:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.025);color:#a99fb8;font-size:.78rem}
      .rs-trailer-viewbar strong{display:inline-flex;align-items:center;gap:7px;color:#f3ecff;font-size:.83rem;font-weight:800}
      .rs-trailer-viewbar strong::before{content:'◉';color:#b88cff;font-size:.72rem}
      .rs-trailer-new .rs-trailer-viewbar strong::before{color:#75c9ff}
      .rs-trailer-viewbar span{color:#887e97;font-size:.72rem;text-align:right}
      .rs-trailer-view-note{margin:-18px auto 30px;max-width:900px;padding:0 12px;color:#82788f;font-size:.73rem;line-height:1.5;text-align:center}
      @media(max-width:520px){.rs-trailer-viewbar{align-items:flex-start;flex-direction:column}.rs-trailer-viewbar span{text-align:left}}
    `;
    document.head.appendChild(style);
  }

  function ensureRealityViewUI() {
    ensureRealityViewStyles();
    const cards = [...document.querySelectorAll('.rs-trailer-card')];
    cards.forEach((card, index) => {
      const videoId = index === 0 ? 'trailer-1' : index === 1 ? 'trailer-2' : '';
      if (!videoId) return;
      const video = card.querySelector('video');
      if (video) video.dataset.realityVideoId = videoId;
      if (!card.querySelector('.rs-trailer-viewbar')) {
        const footer = document.createElement('div');
        footer.className = 'rs-trailer-viewbar';
        footer.innerHTML = `<strong><span data-reality-view-count="${videoId}">—</span>&nbsp;views</strong><span>Live public count</span>`;
        card.appendChild(footer);
      }
    });
    const grid = document.querySelector('.rs-trailer-grid');
    if (grid && !document.getElementById('realityViewTrackingNote')) {
      const note = document.createElement('p');
      note.id = 'realityViewTrackingNote';
      note.className = 'rs-trailer-view-note';
      note.textContent = 'Loading per-trailer view tracking…';
      grid.insertAdjacentElement('afterend', note);
    }
  }

  function paintRealityViews(data) {
    if (!data?.videos) return;
    for (const videoId of ['trailer-1','trailer-2']) {
      const views = Number(data.videos?.[videoId]?.views || 0);
      document.querySelectorAll(`[data-reality-view-count="${videoId}"]`).forEach(el => {
        el.textContent = views.toLocaleString();
      });
    }
    const note = document.getElementById('realityViewTrackingNote');
    if (!note) return;
    const trackingDate = data.trackingStartedAt ? new Date(data.trackingStartedAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}) : 'now';
    const legacy = Number(data.legacy?.playsSinceSep1 || 0);
    note.textContent = legacy > 0
      ? `Per-trailer view tracking is live from ${trackingDate}. Before that, ${legacy.toLocaleString()} teaser play${legacy === 1 ? '' : 's'} were logged since 1 Sep, but the older data did not identify which trailer was watched.`
      : `Per-trailer view tracking is live from ${trackingDate}. Earlier analytics did not identify Trailer 1 and Trailer 2 separately.`;
  }

  async function refreshRealityViews() {
    ensureRealityViewUI();
    try {
      const response = await fetch(`${realityViewsEndpoint}?_=${Date.now()}`, {cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Trailer views unavailable');
      paintRealityViews(data);
      return data;
    } catch (error) {
      console.warn('Reality Switch trailer views unavailable:', error);
      const note = document.getElementById('realityViewTrackingNote');
      if (note) note.textContent = 'Live trailer view counts are reconnecting.';
      return null;
    }
  }

  async function recordRealityView(videoId) {
    const viewedKey = `hubcore-reality-viewed-${videoId}-v1`;
    try { if (sessionStorage.getItem(viewedKey) === '1') return; } catch {}
    try {
      const response = await fetch(realityViewsEndpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({videoId,visitorId,sessionId:realityViewSessionId}),
        keepalive:true
      });
      const data = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(data.error || 'Unable to record trailer view');
      try { sessionStorage.setItem(viewedKey,'1'); } catch {}
      paintRealityViews(data);
    } catch (error) {
      console.warn('Reality Switch trailer view could not be recorded:', error);
    }
  }

  function bindRealityViewTracking() {
    ensureRealityViewUI();
    document.querySelectorAll('video[data-reality-video-id]').forEach(video => {
      if (video.dataset.realityViewBound === '1') return;
      video.dataset.realityViewBound = '1';
      let timer = 0;
      const clearTimer = () => { if (timer) window.clearTimeout(timer); timer = 0; };
      const armTimer = () => {
        clearTimer();
        const videoId = video.dataset.realityVideoId;
        if (!videoId) return;
        let alreadyCounted = false;
        try { alreadyCounted = sessionStorage.getItem(`hubcore-reality-viewed-${videoId}-v1`) === '1'; } catch {}
        if (alreadyCounted) return;
        timer = window.setTimeout(() => {
          timer = 0;
          if (!video.paused && !video.ended) recordRealityView(videoId);
        }, 3000);
      };
      video.addEventListener('playing', armTimer);
      video.addEventListener('pause', clearTimer);
      video.addEventListener('waiting', clearTimer);
      video.addEventListener('ended', clearTimer);
    });
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
    ['a[href="#community"]', 'enter_community'],
    ['#shareHubcore', 'site_share']
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
    bindRealityViewTracking();
    const params = new URLSearchParams(location.search);
    const isAutomatedCheck = params.has('monitor') || params.has('review');
    if (!isAutomatedCheck) await record('page_view');
    await Promise.all([refreshPublicTotals(), refreshRealityViews()]);
    setInterval(() => {
      refreshPublicTotals();
      refreshRealityViews();
      bindRealityViewTracking();
    }, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
})();
