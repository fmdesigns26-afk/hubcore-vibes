(()=>{
  const esc=v=>String(v??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt',"'":'&#39;','"':'&quot;'}[c]));
  async function api(payload){const r=await fetch('/api/early-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Unable to complete that request.');return d;}
  function markup(){return `<div class="early-access-shell glass-panel" id="earlyAccessShell">
    <div class="early-access-copy"><div class="eyebrow">EARLY ACCESS · HUBCORE VIBES</div><h3>Be first in line.</h3><p>Reserve your HubCore Vibes username and join the early-access list. The Founder receives your request directly by email.</p></div>
    <form id="earlyAccessApplyForm" class="early-form"><div class="field-row"><label>Email address<input name="email" type="email" autocomplete="email" maxlength="200" placeholder="you@example.com" required></label><label>Choose a username<input name="username" autocomplete="username" maxlength="40" placeholder="@yourname" required></label></div><button class="btn primary" type="submit">Request early access</button><div class="early-status" id="earlyApplyStatus" role="status" aria-live="polite"></div></form>
  </div>`;}
  function install(){const section=document.getElementById('contact');if(!section||document.getElementById('earlyAccessShell'))return;section.insertAdjacentHTML('afterbegin',markup());
    document.getElementById('earlyAccessApplyForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,status=document.getElementById('earlyApplyStatus'),button=form.querySelector('button[type="submit"]');if(!form.reportValidity())return;button.disabled=true;status.className='early-status';status.textContent='Sending your request…';try{const data=Object.fromEntries(new FormData(form).entries()),result=await api({action:'apply',...data});form.reset();status.className='early-status success';status.textContent=result.notificationSent?'You’re on the list! Your early-access request has been sent to the Founder.':'You’re on the list! Your request has been saved.';}catch(err){status.className='early-status error';status.textContent=err.message;}finally{button.disabled=false;}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
