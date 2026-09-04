(() => {
  if (window.__hubcoreAnalyticsLive) return;
  window.__hubcoreAnalyticsLive = true;

  const VISITOR_KEY = 'hubcore-analytics-visitor-v1';
  const endpoint = '/api/analytics';
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
      await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({eventName, visitorId, path: location.pathname + location.hash}),
        keepalive: true
      });
    } catch (error) {
      console.warn('HubCore analytics event could not be recorded:', error);
    }
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
      const since = document.querySelector('[data-site-tracking-since]');
      if (since && data.trackingSince) {
        since.textContent = `Live HubCore tracking since ${new Date(data.trackingSince).toLocaleDateString()}. Cloudflare dashboard totals may differ.`;
      }
    } catch (error) {
      console.warn('HubCore visit totals unavailable:', error);
    }
  }

  const clickEvents = [
    ['a[href="#contact"], .nav-cta', 'early_access'],
    ['#trailerPlay', 'play_teaser'],
    ['a[href="#reality"]', 'reality_switch'],
    ['a[href="#investors"]', 'investors'],
    ['a[href="#community"]', 'enter_community']
  ];

  document.addEventListener('click', event => {
    for (const [selector, eventName] of clickEvents) {
      if (event.target.closest(selector)) {
        record(eventName);
        break;
      }
    }
  }, true);

  async function init() {
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
