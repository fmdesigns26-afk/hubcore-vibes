(() => {
  const section=document.getElementById('reel-vibes');
  if(!section||document.getElementById('reelAiStudio'))return;
  const composer=section.querySelector('.reel-composer');
  if(!composer)return;

  const studio=document.createElement('section');
  studio.className='reel-ai-studio glass-panel';
  studio.id='reelAiStudio';
  studio.innerHTML=`
    <div class="reel-ai-top">
      <div>
        <div class="eyebrow">AI CREATION · REEL VIBES</div>
        <h3>AI Reel Studio is coming next.</h3>
        <p>Photo-to-Reel, Auto Cut, Smart Captions and Music Sync are being connected to a real rendering service.</p>
      </div>
      <span class="reel-ai-badge">COMING NEXT</span>
    </div>
    <div class="reel-ai-actions">
      <a class="btn primary" href="#reel-vibes">📸 Post a photo now</a>
      <span class="reel-ai-note">Photo posting is live. AI animation will appear here only when it can actually render and return a preview.</span>
    </div>`;
  composer.insertAdjacentElement('afterend',studio);
})();

/* Load promoteVibe beside Reel Vibes without touching the organic feed. */
(() => {
  if(document.querySelector('script[data-vibepromote]'))return;
  const script=document.createElement('script');
  script.src='vibepromote.js?v=20260916-income3';
  script.defer=true;
  script.dataset.vibepromote='true';
  script.onload=()=>{
    const promote=document.getElementById('vibe-promote');
    if(promote){
      promote.classList.add('visible');
      promote.style.opacity='1';
      promote.style.transform='none';
    }
  };
  document.body.appendChild(script);
})();
