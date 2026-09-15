(() => {
  const TRAILER_ONE='assets/videos/reality-switch-trailer-01.mp4';
  const TRAILER_TWO='assets/videos/reality-switch-trailer-02-fullscreen.mp4';
  const STORYBOARD='assets/reality/reality-storyboard.png';
  const TOKEN='hubcore_member_token';
  const USER='hubcore_member';
  const COMMENTS='/api/reality-comments';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const token=()=>{try{return localStorage.getItem(TOKEN)||''}catch{return''}};
  const member=()=>{try{return JSON.parse(localStorage.getItem(USER)||'null')}catch{return null}};
  const timeAgo=value=>{const diff=Math.max(0,Date.now()-Number(value||Date.now())),mins=Math.floor(diff/60000);if(mins<1)return'just now';if(mins<60)return`${mins}m ago`;const hours=Math.floor(mins/60);if(hours<24)return`${hours}h ago`;return`${Math.floor(hours/24)}d ago`;};

  function build(){
    const reality=document.getElementById('reality');
    if(!reality||reality.dataset.realityRedesign==='2')return;
    reality.dataset.realityRedesign='2';
    reality.innerHTML=`
      <div class="rs-story-intro">
        <div class="eyebrow">GAME DEVELOPMENT · HUBCORE VIBES</div>
        <div class="rs-title-row">
          <h2>REALITY <span>SWITCH</span></h2>
          <span class="status">IN DEVELOPMENT</span>
        </div>
        <p class="rs-bigcopy">One Choice. Infinite Realities.</p>
        <p class="rs-brandline">A game experience in development that may become part of HubCore Vibes — while also having the potential to grow into a standalone game of its own.</p>
        <p class="rs-manifesto">Every decision changes your path.<br>Every path changes your reality.<br>And every reality changes what comes next.</p>
        <p class="rs-description">Reality Switch is being created and developed by Yutani Pretorius as a major game concept connected to the HubCore Vibes universe. It may eventually become a live game experience inside HubCore Vibes, potentially through HubPlay, while also remaining capable of evolving into a standalone game of its own. Your decisions influence future events, missions, consequences, relationships, environments, available paths and what happens next. You are not selecting a static reality; the reality you experience is shaped by what you decide and what those decisions set in motion.</p>
        <p class="rs-credit"><strong>Created and developed by Yutani Pretorius</strong><span>Founder · HubCore Vibes</span></p>
      </div>

      <div class="rs-feature-grid" aria-label="Reality Switch core features">
        <div><strong>01</strong><span>Decisions create consequences</span></div>
        <div><strong>∞</strong><span>Paths evolve over time</span></div>
        <div><strong>4</strong><span>Evolving reality directions</span></div>
        <div><strong>?</strong><span>What happens next is yours</span></div>
      </div>

      <div class="rs-world-grid" aria-label="Reality Switch worlds">
        <article><h3>Modern City</h3><p>A familiar world that can open into new missions, alliances and conflicts as your choices accumulate.</p></article>
        <article><h3>Cyber Dystopia</h3><p>A high-tech reality where surveillance, power and resistance shift with the decisions you make.</p></article>
        <article><h3>Ancient Lost Realm</h3><p>Ruins and forgotten histories reveal different routes depending on who you trust and what you pursue.</p></article>
        <article><h3>Shadow Dimension</h3><p>A darker reality where relationships, consequences and perception can transform the world around you.</p></article>
      </div>

      <figure class="rs-storyboard">
        <img src="${STORYBOARD}" alt="Reality Switch cinematic storyboard" loading="lazy">
        <figcaption>Reality Switch · cinematic concept storyboard</figcaption>
      </figure>

      <div class="rs-trailer-heading">
        <div class="eyebrow">WATCH THE STORY UNFOLD</div>
        <h3>Two trailers. One evolving reality.</h3>
        <p>Trailer 1 introduces the cinematic world. Trailer 2 continues the story with the latest Reality Switch sequence.</p>
      </div>

      <div class="rs-trailer-grid" aria-label="Reality Switch trailers">
        <article class="rs-trailer-card">
          <div class="rs-trailer-head"><span>TRAILER 1</span><strong>Original Cinematic Reveal</strong></div>
          <video controls playsinline preload="metadata" src="${TRAILER_ONE}" aria-label="Reality Switch Trailer 1"></video>
        </article>
        <article class="rs-trailer-card rs-trailer-new">
          <div class="rs-trailer-head"><span>TRAILER 2 · LATEST</span><strong>The story continues</strong></div>
          <video controls playsinline preload="metadata" src="${TRAILER_TWO}" aria-label="Reality Switch Trailer 2"></video>
        </article>
      </div>

      <section class="rs-choice-panel" aria-labelledby="rsChoiceTitle">
        <div class="rs-choice-copy">
          <div class="eyebrow">YOUR CHOICE</div>
          <h3 id="rsChoiceTitle">They thought it was something else.<br>But it's data. <span aria-hidden="true">👀</span></h3>
          <p>They have two choices:</p>
          <strong>Call Heisenberg and drop it off or open the drive first?</strong>
          <p class="rs-choice-question">Whats your choice?</p>
          <p class="rs-choice-cta">Comment your choice.</p>
        </div>
        <div class="rs-choice-buttons" role="group" aria-label="Choose what happens next">
          <button type="button" data-rs-choice="Call Heisenberg and drop it off">Call Heisenberg and drop it off</button>
          <button type="button" data-rs-choice="Open the drive first">Open the drive first</button>
        </div>
      </section>

      <section class="rs-comments" aria-label="Reality Switch comments">
        <div class="rs-comments-head"><div><div class="eyebrow">COMMENTS</div><h3>Community choices</h3></div><span id="rsCommentCount">0 comments</span></div>
        <div id="rsCommentsList" class="rs-comments-list"><p class="rs-comment-empty">Loading comments…</p></div>
        <form id="rsCommentForm" class="rs-comment-form">
          <div id="rsCommentIdentity" class="rs-comment-identity"></div>
          <input id="rsChoiceValue" type="hidden" name="choice" value="">
          <textarea name="text" rows="4" maxlength="1600" placeholder="Comment your choice…" required></textarea>
          <div class="rs-comment-actions"><span id="rsCommentStatus" role="status" aria-live="polite"></span><button class="btn primary" type="submit">Post comment</button></div>
        </form>
      </section>

      <p class="rs-independent">Reality Switch is a developing game concept connected to the HubCore Vibes universe. Its final direction may see it become a playable HubCore Vibes experience, a standalone game, or both.</p>`;
    bind(reality);
    loadComments();
  }

  function paintIdentity(){
    const box=document.getElementById('rsCommentIdentity'),u=member();
    if(!box)return;
    box.innerHTML=u?`Commenting as <strong>${esc(u.name)}</strong> <span>@${esc(u.username)}</span>`:`<strong>Sign up or log in to comment.</strong> Everyone can still read the choices.`;
  }

  function selectChoice(button){
    document.querySelectorAll('[data-rs-choice]').forEach(b=>b.classList.toggle('selected',b===button));
    const choice=document.getElementById('rsChoiceValue');if(choice)choice.value=button.dataset.rsChoice||'';
    const box=document.querySelector('#rsCommentForm textarea');
    if(box&&!box.value.trim())box.value=`My choice: ${button.dataset.rsChoice}. `;
    box?.focus();
  }

  function renderComments(comments){
    const list=document.getElementById('rsCommentsList'),count=document.getElementById('rsCommentCount');
    if(!list)return;
    const rows=Array.isArray(comments)?comments:[];
    if(count)count.textContent=`${rows.length} comment${rows.length===1?'':'s'}`;
    list.innerHTML=rows.length?rows.map(c=>`<article class="rs-comment"><div class="rs-comment-top"><strong>${esc(c.name)}</strong><span>@${esc(c.username)} · ${timeAgo(c.createdAt)}</span></div>${c.choice?`<div class="rs-comment-choice">${esc(c.choice)}</div>`:''}<p>${esc(c.text)}</p></article>`).join(''):`<p class="rs-comment-empty">No comments yet. Be the first to choose what happens next.</p>`;
  }

  async function loadComments(){
    try{const r=await fetch(`${COMMENTS}?t=${Date.now()}`,{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load comments.');renderComments(d.comments||[]);}catch(error){const list=document.getElementById('rsCommentsList');if(list)list.innerHTML=`<p class="rs-comment-empty">${esc(error.message)}</p>`;}
  }

  async function submitComment(form){
    const status=document.getElementById('rsCommentStatus'),button=form.querySelector('button[type="submit"]'),u=member(),t=token();
    if(!u||!t){if(status)status.textContent='Please sign up or log in first.';location.hash='member-access';return;}
    const fd=new FormData(form),text=String(fd.get('text')||'').trim(),choice=String(fd.get('choice')||'').trim();
    if(!text){if(status)status.textContent='Write your comment first.';return;}
    if(button)button.disabled=true;if(status)status.textContent='Posting…';
    try{
      const r=await fetch(COMMENTS,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${t}`},body:JSON.stringify({text,choice})}),d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Unable to post comment.');
      form.reset();document.querySelectorAll('[data-rs-choice]').forEach(b=>b.classList.remove('selected'));
      if(status)status.textContent='Comment posted.';await loadComments();
    }catch(error){if(status)status.textContent=error.message;}finally{if(button)button.disabled=false;}
  }

  function bind(reality){
    paintIdentity();
    reality.querySelectorAll('[data-rs-choice]').forEach(button=>button.addEventListener('click',()=>selectChoice(button)));
    document.getElementById('rsCommentForm')?.addEventListener('submit',event=>{event.preventDefault();submitComment(event.currentTarget)});
    window.addEventListener('hubcore-auth',paintIdentity);
  }

  build();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
})();
