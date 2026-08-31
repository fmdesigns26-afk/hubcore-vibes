(() => {
  const API=window.HubCoreAPI;

  async function updateReach(){
    if(!API?.getPlatformSnapshot)return;
    try{const data=await API.getPlatformSnapshot(),reach=data.communityReach||{},map={posts:reach.posts||0,comments:reach.comments||0,reactions:reach.reactions||0,contributors:reach.contributors||0};document.querySelectorAll('[data-live-reach]').forEach(el=>{el.textContent=Number(map[el.dataset.liveReach]||0).toLocaleString();});const r=document.querySelector('[data-metric="reactions"]'),c=document.querySelector('[data-metric="contributors"]');if(r)r.textContent=Number(map.reactions).toLocaleString();if(c)c.textContent=Number(map.contributors).toLocaleString();}catch(error){console.warn('Unable to refresh live reach figures',error);}
  }

  function bindInvestorForm(){
    const form=document.getElementById('investorForm');if(!form||form.dataset.bound)return;form.dataset.bound='1';
    form.addEventListener('submit',async event=>{event.preventDefault();const status=document.getElementById('investorStatus'),button=form.querySelector('button[type="submit"]');if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form).entries());data.consent=Boolean(form.querySelector('[name="consent"]')?.checked);status.className='investor-status';status.textContent='Sending your private enquiry…';button.disabled=true;try{const response=await fetch('/api/investors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Unable to submit your enquiry.');form.reset();status.className='investor-status success';status.textContent=result.notificationSent?'Thank you. Your investor enquiry was received and sent privately to HubCore Vibes.':'Thank you. Your investor enquiry was received securely by HubCore Vibes.';}catch(error){status.className='investor-status error';status.textContent=error.message||'Unable to submit your enquiry right now.';}finally{button.disabled=false;}});
  }

  function installGeneralInquiry(){
    const section=document.getElementById('contact');if(!section||document.getElementById('generalInquiryForm'))return;
    section.querySelectorAll('a[href^="mailto:"]').forEach(link=>link.remove());
    const wrap=document.createElement('div');wrap.className='general-inquiry glass-panel';
    wrap.innerHTML=`<div class="eyebrow">PRIVATE HUBCORE VIBES ENQUIRY</div><h3>Send us a message</h3><p>Your message is sent through HubCore Vibes. No personal email address is shown.</p><form id="generalInquiryForm"><div class="field-row"><label>Your name<input name="name" maxlength="120" autocomplete="name" required></label><label>Your email<input name="email" type="email" maxlength="200" autocomplete="email" required></label></div><label>Subject<input name="subject" maxlength="160" placeholder="Early access, partnership, support…"></label><label>Your message<textarea name="message" rows="5" maxlength="2000" placeholder="Tell us what you would like to know…" required></textarea></label><button class="btn primary" type="submit">Send enquiry</button><div id="generalInquiryStatus" class="investor-status" role="status" aria-live="polite"></div></form>`;
    section.appendChild(wrap);
    const form=wrap.querySelector('form');form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const status=document.getElementById('generalInquiryStatus'),button=form.querySelector('button');button.disabled=true;status.className='investor-status';status.textContent='Sending…';try{const data=Object.fromEntries(new FormData(form).entries()),response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Unable to send enquiry.');form.reset();status.className='investor-status success';status.textContent=result.notificationSent?'Sent. HubCore Vibes has received your enquiry.':'Received securely. HubCore Vibes has your enquiry.';}catch(error){status.className='investor-status error';status.textContent=error.message||'Unable to send right now.';}finally{button.disabled=false;}});
  }

  function getVisitorId(){let id;try{id=localStorage.getItem('hubcore-reality-visitor');if(!id){id=crypto.randomUUID?.()||`visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;localStorage.setItem('hubcore-reality-visitor',id);}}catch{id=`visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;}return id;}
  function isFollowing(){try{return localStorage.getItem('hubcore-reality-following')==='1';}catch{return false;}}
  function setFollowing(v){try{localStorage.setItem('hubcore-reality-following',v?'1':'0');}catch{}}
  async function refreshRealityFollowers(){try{const r=await fetch('/api/reality',{cache:'no-store'}),d=await r.json();document.querySelectorAll('[data-reality-followers]').forEach(el=>el.textContent=Number(d.followers||0).toLocaleString());}catch{}}
  function installRealityFollow(){
    const section=document.getElementById('reality');if(!section||document.getElementById('realityFollow'))return;
    const box=document.createElement('div');box.id='realityFollow';box.className='reality-follow glass-panel';box.innerHTML=`<div><strong>Follow Reality Switch</strong><span><b data-reality-followers>0</b> real followers</span></div><button class="btn primary" type="button">${isFollowing()?'Following':'Follow Reality Switch'}</button>`;section.querySelector('.reality-announcement')?.appendChild(box);
    box.querySelector('button').addEventListener('click',async()=>{const next=!isFollowing(),button=box.querySelector('button');button.disabled=true;try{const r=await fetch('/api/reality',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitorId:getVisitorId(),action:next?'follow':'unfollow'})}),d=await r.json();if(!r.ok)throw new Error();setFollowing(next);button.textContent=next?'Following':'Follow Reality Switch';document.querySelectorAll('[data-reality-followers]').forEach(el=>el.textContent=Number(d.followers||0).toLocaleString());}finally{button.disabled=false;}});refreshRealityFollowers();setInterval(refreshRealityFollowers,4000);
  }

  function simplifyTrailer(){document.getElementById('trailerCard')?.remove();document.querySelector('#reality .trailer-vignette')?.remove();const play=document.getElementById('trailerPlay');if(play)play.textContent='Play preview';}
  function init(){bindInvestorForm();installGeneralInquiry();installRealityFollow();simplifyTrailer();updateReach();setInterval(updateReach,5000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
