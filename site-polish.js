(() => {
  const API = window.HubCoreAPI;

  async function updateReach() {
    if (!API?.getPlatformSnapshot) return;
    try {
      const data = await API.getPlatformSnapshot();
      const reach = data.communityReach || {};
      const map = { posts: reach.posts || 0, comments: reach.comments || 0, reactions: reach.reactions || 0, contributors: reach.contributors || 0 };
      document.querySelectorAll('[data-live-reach]').forEach(el => {
        const key = el.dataset.liveReach;
        el.textContent = Number(map[key] || 0).toLocaleString();
      });
      const reactionsMetric = document.querySelector('[data-metric="reactions"]');
      const contributorsMetric = document.querySelector('[data-metric="contributors"]');
      if (reactionsMetric) reactionsMetric.textContent = Number(map.reactions).toLocaleString();
      if (contributorsMetric) contributorsMetric.textContent = Number(map.contributors).toLocaleString();
    } catch (error) {
      console.warn('Unable to refresh live reach figures', error);
    }
  }

  function bindInvestorForm() {
    const form = document.getElementById('investorForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const status = document.getElementById('investorStatus');
      const button = form.querySelector('button[type="submit"]');
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      data.consent = Boolean(form.querySelector('[name="consent"]')?.checked);
      status.className = 'investor-status';
      status.textContent = 'Sending your private enquiry…';
      button.disabled = true;
      try {
        const response = await fetch('/api/investors', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Unable to submit your enquiry.');
        form.reset();
        status.className = 'investor-status success';
        status.textContent = result.notificationSent ? 'Thank you. Your investor enquiry was received and a private notification was sent.' : 'Thank you. Your investor enquiry was received securely.';
      } catch (error) {
        status.className = 'investor-status error';
        status.textContent = error.message || 'Unable to submit your enquiry right now.';
      } finally { button.disabled = false; }
    });
  }

  function simplifyTrailer() {
    document.getElementById('trailerCard')?.remove();
    document.querySelector('#reality .trailer-vignette')?.remove();
    const play = document.getElementById('trailerPlay');
    if (play) play.textContent = 'Play preview';
  }

  function init() {
    bindInvestorForm();
    simplifyTrailer();
    updateReach();
    setInterval(updateReach, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
