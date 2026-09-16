(() => {
  const section = document.getElementById('reel-vibes');
  if (!section || document.getElementById('reelAiStudio')) return;

  const composer = section.querySelector('.reel-composer');
  if (!composer) return;

  const studio = document.createElement('section');
  studio.className = 'reel-ai-studio glass-panel';
  studio.id = 'reelAiStudio';
  studio.innerHTML = `
    <div class="reel-ai-top">
      <div>
        <div class="eyebrow">AI CREATION · REEL VIBES</div>
        <h3>Create your Reel with AI.</h3>
        <p>Upload photos or clips, tell HubCore what you want, and prepare a short-form video workflow for Auto Cut, Photo-to-Reel, Smart Captions or Music Sync.</p>
      </div>
      <span class="reel-ai-badge">Beta · Coming Next</span>
    </div>
    <div class="reel-ai-actions">
      <button class="btn ghost" id="openReelAiStudio" type="button">✨ Open AI Reel Studio</button>
      <span class="reel-ai-note">Normal Reel upload is live now. AI rendering is being connected.</span>
    </div>
    <form class="reel-ai-panel" id="reelAiForm" hidden>
      <div class="reel-ai-grid">
        <label class="reel-ai-field reel-ai-field-wide">Photos or video clips
          <input name="media" type="file" accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" multiple required>
        </label>
        <label class="reel-ai-field">AI mode
          <select name="mode">
            <option value="auto_cut">Auto Cut</option>
            <option value="photo_reel">Photo-to-Reel</option>
            <option value="captions">Smart Captions</option>
            <option value="music_sync">Music Sync</option>
          </select>
        </label>
        <label class="reel-ai-field">Target length
          <select name="duration">
            <option value="15">15 seconds</option>
            <option value="30" selected>30 seconds</option>
            <option value="60">60 seconds</option>
          </select>
        </label>
        <label class="reel-ai-field reel-ai-field-wide">Tell the AI what you want
          <textarea name="prompt" maxlength="1000" placeholder="Example: Make this energetic, keep the best moments, add clean captions and finish with the HubCore Vibes logo."></textarea>
        </label>
      </div>
      <div class="reel-ai-tools" aria-label="Planned AI tools">
        <span>✂ Auto Cut</span><span>🖼 Photo-to-Reel</span><span>💬 Smart Captions</span><span>🎵 Music Sync</span><span>✨ AI transitions</span>
      </div>
      <div class="reel-ai-submit-row">
        <button class="btn primary" type="submit">Prepare AI Draft</button>
        <button class="btn ghost" id="closeReelAiStudio" type="button">Close</button>
        <span class="reel-ai-status" id="reelAiStatus" role="status" aria-live="polite"></span>
      </div>
      <p class="reel-ai-safety">Your files are not published automatically. When AI rendering is enabled, you will preview and approve the result before posting it to Reel Vibes.</p>
      <div class="reel-ai-preview" id="reelAiPreview"></div>
    </form>`;

  composer.insertAdjacentElement('afterend', studio);

  const panel = studio.querySelector('#reelAiForm');
  const openButton = studio.querySelector('#openReelAiStudio');
  const closeButton = studio.querySelector('#closeReelAiStudio');
  const status = studio.querySelector('#reelAiStatus');
  const preview = studio.querySelector('#reelAiPreview');

  openButton.addEventListener('click', () => {
    panel.hidden = false;
    openButton.setAttribute('aria-expanded', 'true');
    panel.querySelector('input,select,textarea')?.focus();
  });

  closeButton.addEventListener('click', () => {
    panel.hidden = true;
    openButton.setAttribute('aria-expanded', 'false');
    status.textContent = '';
  });

  panel.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = panel.querySelector('button[type="submit"]');
    const files = [...panel.querySelector('input[name="media"]').files];
    if (!files.length) {
      status.textContent = 'Choose at least one photo or video first.';
      return;
    }

    submit.disabled = true;
    status.textContent = 'Checking AI rendering availability…';
    preview.innerHTML = '';

    try {
      const capability = await fetch('/api/ai-video?status=1', {cache: 'no-store'});
      if (!capability.ok) {
        status.textContent = 'AI rendering is being connected now. Your files have not been uploaded.';
        return;
      }

      const capabilityData = await capability.json().catch(() => ({}));
      if (!capabilityData.enabled) {
        status.textContent = 'AI rendering is not enabled yet. Your files have not been uploaded.';
        return;
      }

      const data = new FormData(panel);
      files.forEach(file => data.append('files', file));
      status.textContent = 'Starting your AI draft…';

      const response = await fetch('/api/ai-video', {method: 'POST', body: data});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'AI draft could not be started.');

      status.textContent = result.message || 'AI draft started. Your preview will appear when it is ready.';
      if (result.previewUrl) {
        const video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.src = result.previewUrl;
        preview.replaceChildren(video);
      }
    } catch (error) {
      status.textContent = error.message || 'AI draft could not be started.';
    } finally {
      submit.disabled = false;
    }
  });
})();

/* Load VibePromote beside Reel Vibes without touching the organic feed. */
(() => {
  if (document.querySelector('script[data-vibepromote]')) return;
  const script = document.createElement('script');
  script.src = 'vibepromote.js?v=20260916-income1';
  script.defer = true;
  script.dataset.vibepromote = 'true';
  document.body.appendChild(script);
})();
