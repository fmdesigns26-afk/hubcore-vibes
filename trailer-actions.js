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

(() => {
  const trailerTwoSrc = 'assets/videos/reality-switch-trailer-two-release-20260915.mp4';

  async function assetExists() {
    try {
      const response = await fetch(trailerTwoSrc, {method: 'HEAD', cache: 'no-store'});
      return response.ok;
    } catch {
      return false;
    }
  }

  function buildTrailerTwo() {
    if (document.getElementById('realityTrailerTwo')) return;
    const reality = document.getElementById('reality');
    if (!reality) return;

    const originalSection = reality.querySelector('.video-section.trailer-section');
    if (originalSection && !originalSection.querySelector('[data-trailer-one-label]')) {
      const heading = originalSection.querySelector('.eyebrow');
      if (heading) {
        heading.textContent = 'TRAILER 1 · ORIGINAL CINEMATIC REVEAL';
        heading.setAttribute('data-trailer-one-label', 'true');
      }
    }

    const section = document.createElement('div');
    section.className = 'video-section trailer-section reality-trailer-two-release';
    section.id = 'realityTrailerTwo';
    section.style.marginTop = '32px';
    section.innerHTML = `
      <div>
        <div class="eyebrow">NEW TRAILER JUST RELEASED · TRAILER 2</div>
        <h3>Reality Switch — Trailer 2</h3>
        <p>A new look at <strong>Reality Switch</strong>, currently in development. Watch the latest trailer and see where the choices, consequences and realities are heading next.</p>
      </div>
      <div class="trailer-player" aria-label="Reality Switch Trailer 2">
        <video controls preload="metadata" playsinline src="${trailerTwoSrc}" style="width:100%;height:100%;object-fit:contain;background:#05030a"></video>
      </div>`;

    const engagement = reality.querySelector('.trailer-engagement');
    if (engagement) engagement.insertAdjacentElement('beforebegin', section);
    else reality.appendChild(section);
  }

  async function initTrailerTwo() {
    if (await assetExists()) buildTrailerTwo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrailerTwo, {once: true});
  } else {
    initTrailerTwo();
  }
})();
