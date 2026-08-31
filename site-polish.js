(() => {
  const API = window.HubCoreAPI;

  function ensureAssets() {
    if (!document.querySelector('link[data-hubcore-polish]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/site-polish.css?v=20260831e';
      link.dataset.hubcorePolish = '1';
      document.head.appendChild(link);
    }
  }

  function ensureInvestorNav() {
    const nav = document.querySelector('.nav nav');
    if (!nav || nav.querySelector('a[href="#investors"]')) return;
    const early = nav.querySelector('a[href="#contact"]');
    const link = document.createElement('a');
    link.href = '#investors';
    link.textContent = 'Investors';
    if (early) nav.insertBefore(link, early);
    else nav.appendChild(link);
  }

  function buildInvestorSection() {
    if (document.getElementById('investors')) return;
    const contact = document.getElementById('contact');
    if (!contact) return;

    const section = document.createElement('section');
    section.id = 'investors';
    section.className = 'investor-section reveal visible';
    section.innerHTML = `
      <div class="investor-layout">
        <div class="investor-copy">
          <div class="eyebrow">INVEST WITH HUBCORE VIBES</div>
          <h2>Help shape what comes next.</h2>
          <p>HubCore Vibes is building toward a connected social, creator, entertainment and gaming ecosystem. Investors and strategic partners can register interest, share what they care about and start a private conversation about the next stage.</p>
          <div class="investor-points">
            <span>Early-stage investor interest</span>
            <span>Strategic partnerships and introductions</span>
            <span>Product, creator and gaming ecosystem opportunities</span>
            <span>Room to share your view on what HubCore should build next</span>
          </div>
        </div>
        <div class="investor-form-card">
          <div class="eyebrow">PRIVATE INVESTOR ENQUIRY</div>
          <form id="investorForm" class="investor-form" novalidate>
            <div class="field-row">
              <label>Full name<input name="name" autocomplete="name" maxlength="120" required></label>
              <label>Company / fund<input name="company" autocomplete="organization" maxlength="160"></label>
            </div>
            <div class="field-row">
              <label>Email<input type="email" name="email" autocomplete="email" maxlength="200" required></label>
              <label>Phone<input name="phone" autocomplete="tel" maxlength="80"></label>
            </div>
            <div class="field-row">
              <label>Country<input name="country" autocomplete="country-name" maxlength="120"></label>
              <label>Investor type
                <select name="investorType">
                  <option value="">Select one</option>
                  <option>Angel investor</option>
                  <option>Venture capital</option>
                  <option>Private equity / family office</option>
                  <option>Strategic corporate partner</option>
                  <option>Individual supporter</option>
                  <option>Other</option>
                </select>
              </label>
            </div>
            <div class="field-row">
              <label>Potential investment range
                <select name="investmentRange">
                  <option value="">Prefer not to say yet</option>
                  <option>Under R100k</option>
                  <option>R100k – R500k</option>
                  <option>R500k – R2m</option>
                  <option>R2m – R10m</option>
                  <option>R10m+</option>
                </select>
              </label>
              <label>Area of interest
                <select name="interestArea">
                  <option value="">Select one</option>
                  <option>HubCore Vibes social platform</option>
                  <option>Reality Switch</option>
                  <option>Creator / entertainment ecosystem</option>
                  <option>AI / Harmony AI</option>
                  <option>Commerce / marketplace</option>
                  <option>General strategic investment</option>
                </select>
              </label>
            </div>
            <label>What interests you, and what would you like to have a say in?<textarea name="message" rows="5" maxlength="1200" placeholder="Tell us what caught your attention, what you could bring, and what you would like to discuss."></textarea></label>
            <label class="investor-consent"><input type="checkbox" name="consent" required><span>I agree that HubCore Vibes may use these details to contact me about this investor enquiry.</span></label>
            <button class="btn primary" type="submit">Submit investor interest</button>
            <p class="investor-privacy">Your enquiry is sent securely to the HubCore backend. The owner contact email is not shown on this page.</p>
            <div id="investorStatus" class="investor-status" role="status" aria-live="polite"></div>
          </form>
        </div>
      </div>`;
    contact.before(section);
  }

  async function updateReach() {
    if (!API?.getPlatformSnapshot) return;
    try {
      const data = await API.getPlatformSnapshot();
      const reach = data.communityReach || {};
      const cards = [...document.querySelectorAll('.counter-card')].slice(0, 4);
      if (cards.length < 4) return;
      const values = [
        [reach.posts ?? data.metrics?.posts ?? 0, 'LIVE POSTS'],
        [reach.comments ?? data.metrics?.messages ?? 0, 'LIVE COMMENTS'],
        [reach.reactions ?? 0, 'LIVE REACTIONS'],
        [reach.contributors ?? 0, 'CONTRIBUTORS']
      ];
      cards.forEach((card, index) => {
        const counter = card.querySelector('.counter');
        const label = card.querySelector('label');
        if (counter) {
          counter.dataset.target = String(values[index][0]);
          counter.dataset.suffix = '';
          counter.textContent = Number(values[index][0]).toLocaleString();
        }
        if (label) label.textContent = values[index][1];
      });

      const parent = cards[0]?.parentElement;
      if (parent && !document.querySelector('.live-reach-note')) {
        const note = document.createElement('p');
        note.className = 'live-reach-note';
        note.textContent = 'Live figures are read directly from HubCore Vibes community activity stored in Cloudflare D1.';
        parent.after(note);
      }
    } catch (error) {
      console.warn('Unable to refresh live reach figures', error);
    }
  }

  function simplifyTrailer() {
    const player = document.getElementById('realityTrailer');
    const play = document.getElementById('trailerPlay');
    if (player) player.setAttribute('aria-label', 'Reality Switch gameplay and cinematic preview');
    if (play) play.textContent = 'Play game preview';
  }

  function bindInvestorForm() {
    const form = document.getElementById('investorForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const status = document.getElementById('investorStatus');
      const button = form.querySelector('button[type="submit"]');
      const data = Object.fromEntries(new FormData(form).entries());
      data.consent = Boolean(form.querySelector('[name="consent"]')?.checked);
      status.className = 'investor-status';
      status.textContent = 'Sending your private enquiry…';
      button.disabled = true;
      try {
        const response = await fetch('/api/investors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Unable to submit your enquiry.');
        form.reset();
        status.className = 'investor-status success';
        status.textContent = result.notificationSent
          ? 'Thank you. Your investor enquiry was received and a private notification was sent.'
          : 'Thank you. Your investor enquiry was received securely.';
      } catch (error) {
        status.className = 'investor-status error';
        status.textContent = error.message || 'Unable to submit your enquiry right now.';
      } finally {
        button.disabled = false;
      }
    });
  }

  function init() {
    ensureAssets();
    buildInvestorSection();
    ensureInvestorNav();
    simplifyTrailer();
    bindInvestorForm();
    updateReach();
    setInterval(updateReach, 5000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
