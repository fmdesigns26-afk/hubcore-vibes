(() => {
  const TOKEN_KEY='hubcore-founder-token-v1';
  const profileKey='hubcore-community-profile-v1';
  const token=()=>localStorage.getItem(TOKEN_KEY)||'';
  const isFounder=()=>Boolean(token());
  const badge=()=>'<span class="founder-badge">✓ Founder</span>';

  async function login(password){
    const r=await fetch('/api/founder-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||'Unable to sign in.');
    localStorage.setItem(TOKEN_KEY,d.token);
    localStorage.setItem(profileKey,JSON.stringify({name:'Yutani Pretorius',handle:'@yutanipretorius'}));
    location.reload();
  }
  function logout(){localStorage.removeItem(TOKEN_KEY);location.reload();}

  function installFounderControl(){
    if(document.getElementById('founderModeControl'))return;
    const wrap=document.createElement('div');wrap.id='founderModeControl';wrap.className='founder-mode-control';
    if(isFounder()){
      wrap.innerHTML=`<div class="founder-mode-chip">${badge()} <strong>Yutani Pretorius</strong><button type="button" id="founderLogout">Sign out</button></div>`;
    }else{
      wrap.innerHTML=`<button class="founder-login-link" type="button" id="founderLoginOpen" aria-label="Founder sign in">Founder sign in</button>`;
    }
    document.body.appendChild(wrap);
    wrap.querySelector('#founderLogout')?.addEventListener('click',logout);
    wrap.querySelector('#founderLoginOpen')?.addEventListener('click',openModal);
  }

  function openModal(){
    if(document.getElementById('founderLoginModal'))return;
    const modal=document.createElement('div');modal.id='founderLoginModal';modal.className='founder-login-modal';
    modal.innerHTML=`<div class="founder-login-card"><button class="founder-modal-close" type="button" aria-label="Close">×</button><div class="eyebrow">HUBCORE VIBES</div><h3>Founder sign in</h3><p>Private access for the official HubCore Vibes founder account.</p><form><label>Password<input type="password" name="password" autocomplete="current-password" required></label><button class="btn primary" type="submit">Sign in as Founder</button><div class="founder-login-status" role="status"></div></form></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.founder-modal-close').addEventListener('click',()=>modal.remove());
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    modal.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const status=modal.querySelector('.founder-login-status'),button=modal.querySelector('button[type="submit"]');button.disabled=true;status.textContent='Signing in…';try{await login(new FormData(e.currentTarget).get('password'));}catch(err){status.textContent=err.message||'Unable to sign in.';button.disabled=false;}});
  }

  function founderIdentityUI(){
    if(!isFounder())return;
    const observer=new MutationObserver(()=>{
      document.querySelectorAll('#communityForm .identity-row,.comment-form .comment-identity').forEach(row=>{
        if(row.dataset.founderLocked)return;row.dataset.founderLocked='1';
        row.innerHTML=`<div class="founder-identity-lock">${badge()}<div><strong>Yutani Pretorius</strong><span>@yutanipretorius</span></div></div>`;
      });
      document.querySelectorAll('.post-card').forEach(card=>{
        const author=card.querySelector('.post-author');
        const text=author?.textContent||'';
        if(text.includes('@yutanipretorius')&&!author.querySelector('.founder-badge'))author.querySelector('strong')?.insertAdjacentHTML('beforebegin',badge());
      });
      document.querySelectorAll('.comment-bubble').forEach(b=>{
        if((b.querySelector('strong')?.textContent||'').includes('Founder · Yutani Pretorius')&&!b.querySelector('.founder-badge'))b.querySelector('strong')?.insertAdjacentHTML('beforebegin',badge());
      });
    });
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }

  const originalFetch=window.fetch.bind(window);
  window.fetch=(input,init={})=>{
    try{
      const url=typeof input==='string'?input:input?.url||'';
      if(url.includes('/api/community')&&String(init.method||'GET').toUpperCase()==='POST'&&isFounder()){
        const body=JSON.parse(init.body||'{}');body.founderToken=token();init={...init,body:JSON.stringify(body)};
      }
    }catch{}
    return originalFetch(input,init);
  };

  function init(){installFounderControl();founderIdentityUI();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
