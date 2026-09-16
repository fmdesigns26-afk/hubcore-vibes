(()=>{
  const section=document.getElementById('reel-vibes');
  if(!section)return;

  const TOKEN='hubcore_member_token',USER='hubcore_member';
  let uploadReady=true,imageUploadReady=true,videoUploadReady=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const member=()=>{try{return JSON.parse(localStorage.getItem(USER)||'null')}catch{return null}};
  const token=()=>localStorage.getItem(TOKEN)||'';
  const api=async body=>{const headers={'Content-Type':'application/json'};if(token())headers.Authorization='Bearer '+token();const r=await fetch('/api/reels',{method:'POST',headers,body:JSON.stringify(body)}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Something went wrong.');return d};

  section.innerHTML=`<div class="real-vibes-head"><div><div class="eyebrow">PHOTO + SHORT VIDEO · HUBCORE VIBES</div><h2>Meet <span>Reel Vibes.</span></h2></div><p>Post a photo today. Short-video uploads switch on automatically when HubCore media storage is connected.</p></div><div class="reel-composer glass-panel"><button class="btn primary" id="openReelComposer" type="button">⬆ Post a photo / video</button><span id="reelUploadHint">Checking upload availability…</span><form id="reelForm" hidden><div class="reel-fields"><input name="title" maxlength="120" required placeholder="Reel title"><input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov" required></div><textarea name="caption" maxlength="800" rows="3" placeholder="Write a caption…"></textarea><div class="reel-form-actions"><button class="btn primary" type="submit">Publish Reel Vibe</button><button class="btn ghost" id="cancelReel" type="button">Cancel</button><span id="reelFormStatus" role="status"></span></div></form></div><div class="real-vibes-shell"><div class="real-vibes-track" id="realVibesTrack" aria-label="Reel Vibes feed"></div><div class="real-vibes-nav"><button id="realVibesPrev" type="button" aria-label="Previous Reel">←</button><button id="realVibesNext" type="button" aria-label="Next Reel">→</button></div></div><p class="real-vibes-note">The spotlight is open. Who will post the next Reel Vibe?</p>`;

  const track=section.querySelector('#realVibesTrack'),status=section.querySelector('#reelFormStatus'),uploadButton=section.querySelector('#openReelComposer'),uploadHint=section.querySelector('#reelUploadHint');

  function syncUploadState(){
    if(uploadButton){uploadButton.disabled=!uploadReady;uploadButton.setAttribute('aria-disabled',String(!uploadReady));uploadButton.textContent=uploadReady?'⬆ Post a photo / video':'⬆ Upload unavailable';}
    if(uploadHint){
      if(imageUploadReady&&videoUploadReady)uploadHint.textContent='Photos + MP4, WebM or MOV video are ready.';
      else if(imageUploadReady)uploadHint.textContent='Photo posting is live now. Video storage is still being connected.';
      else uploadHint.textContent='Uploads are temporarily unavailable.';
    }
    const empty=track.querySelector('[data-empty-upload]');
    if(empty){empty.disabled=!uploadReady;empty.textContent=uploadReady?'Post the first Reel Vibe':'Uploads unavailable';}
  }

  const isImage=r=>r.theme==='photo'||/^data:image\//i.test(r.videoUrl||'')||/\.(jpe?g|png|webp|gif)(?:$|\?)/i.test(r.videoUrl||'');
  function card(r){
    const media=isImage(r)
      ?`<img class="reel-photo" loading="lazy" src="${esc(r.videoUrl)}" alt="${esc(r.title)}" style="position:absolute;inset:0;z-index:1;width:100%;height:100%;object-fit:cover;background:#080611">`
      :`<video controls playsinline preload="metadata" src="${esc(r.videoUrl)}"></video>`;
    return `<article class="real-vibe-card" id="reel-${esc(r.id)}" data-id="${esc(r.id)}">${media}<div class="real-vibe-overlay"><span>${isImage(r)?'COMMUNITY PHOTO':'COMMUNITY REEL'}</span><h3>${esc(r.title)}</h3><p>${esc(r.caption)}</p><small>${esc(r.author)} ${esc(r.handle)}</small></div><div class="reel-social"><button data-like type="button">♥ <b>${r.likes}</b></button><button data-comments type="button">● <b>${r.comments.length}</b></button><button data-share type="button">↗ <b>${r.shares}</b></button></div><div class="reel-comments" hidden><div class="reel-comment-list">${r.comments.map(c=>`<p><b>${esc(c.author)}</b> ${esc(c.text)}</p>`).join('')||'<p class="empty">Start the conversation.</p>'}</div><form data-comment-form><input name="text" maxlength="1000" required placeholder="Write a comment…"><button type="submit">Post</button></form></div></article>`;
  }

  async function load(){
    try{
      const r=await fetch('/api/reels',{cache:'no-store'}),d=await r.json();
      if(!r.ok)throw new Error(d.error);
      imageUploadReady=d.imageUploadReady!==false;
      videoUploadReady=Boolean(d.videoUploadReady);
      uploadReady=Boolean(d.uploadReady||imageUploadReady||videoUploadReady);
      track.innerHTML=d.reels.length?d.reels.map(card).join(''):`<div class="reel-empty"><div class="reel-empty-icon">＋</div><h3>Be the first to post a Reel Vibe</h3><p>Photos are live now. Share the first community photo while short-video storage is being connected.</p><button class="btn primary" data-empty-upload type="button">Post the first Reel Vibe</button></div>`;
      bind();syncUploadState();
    }catch(e){
      uploadReady=false;imageUploadReady=false;videoUploadReady=false;
      track.innerHTML='<div class="reel-error">Reel Vibes could not load. Please refresh and try again.</div>';
      syncUploadState();
    }
  }

  function open(){
    if(!member()||!token()){location.hash='member-access';setTimeout(()=>document.querySelector('#memberSignup input')?.focus(),400);return}
    if(!uploadReady){status.textContent='Uploads are temporarily unavailable.';return}
    section.querySelector('#reelForm').hidden=false;
    section.querySelector('#reelForm input')?.focus();
  }

  function bind(){
    track.querySelector('[data-empty-upload]')?.addEventListener('click',open);
    track.querySelectorAll('.real-vibe-card').forEach(card=>{
      const id=card.dataset.id,like=card.querySelector('[data-like]'),share=card.querySelector('[data-share]'),comments=card.querySelector('[data-comments]'),panel=card.querySelector('.reel-comments');
      like.onclick=async()=>{if(localStorage.getItem('hubcore-liked-'+id))return;try{const d=await api({action:'like',reelId:id});like.querySelector('b').textContent=d.total;localStorage.setItem('hubcore-liked-'+id,'1')}catch{}};
      comments.onclick=()=>panel.hidden=!panel.hidden;
      share.onclick=async()=>{const url=location.origin+location.pathname+'#reel-'+id;try{if(navigator.share)await navigator.share({title:'Reel Vibes',url});else await navigator.clipboard.writeText(url);const d=await api({action:'share',reelId:id});share.querySelector('b').textContent=d.total}catch{}};
      card.querySelector('[data-comment-form]').onsubmit=async e=>{e.preventDefault();if(!member()||!token()){location.hash='member-access';return}const fd=new FormData(e.currentTarget);try{await api({action:'comment',reelId:id,text:fd.get('text')});await load()}catch(err){alert(err.message)}};
    });
  }

  async function prepareImage(raw){
    if(!raw?.type?.startsWith('image/'))return raw;
    const bitmap=await createImageBitmap(raw);
    const max=1400,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    let quality=.82,blob;
    do{blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));quality-=.12}while(blob&&blob.size>900000&&quality>.34);
    if(!blob)throw new Error('Could not prepare that photo.');
    return new File([blob],'reel-photo.jpg',{type:'image/jpeg'});
  }

  const form=section.querySelector('#reelForm');
  uploadButton.onclick=open;
  section.querySelector('#cancelReel').onclick=()=>form.hidden=true;
  form.onsubmit=async e=>{
    e.preventDefault();
    const u=member(),raw=new FormData(form).get('file');
    if(!u||!token()){location.hash='member-access';return}
    if(!(raw instanceof File)||!raw.size){status.textContent='Choose a photo or video first.';return}
    const image=raw.type.startsWith('image/');
    if(!image&&!videoUploadReady){status.textContent='Photo posting is live now. Video uploads will switch on when HubCore media storage is connected.';return}
    status.textContent=image?'Preparing your photo…':'Uploading your Reel…';
    const button=form.querySelector('button[type="submit"]');button.disabled=true;
    try{
      const file=image?await prepareImage(raw):raw;
      const up=new FormData();up.append('kind',image?'reel-image':'reel');up.append('file',file);
      const rr=await fetch('/api/upload',{method:'POST',headers:{Authorization:'Bearer '+token()},body:up}),ud=await rr.json().catch(()=>({}));
      if(!rr.ok)throw new Error(ud.error||'Upload failed.');
      const fd=new FormData(form);
      await api({action:'create_reel',title:fd.get('title'),caption:fd.get('caption'),videoUrl:ud.url,mediaType:image?'image':'video'});
      form.reset();form.hidden=true;status.textContent='Published!';await load();
    }catch(err){status.textContent=err.message}
    finally{button.disabled=false}
  };

  section.querySelector('#realVibesPrev').onclick=()=>track.scrollBy({left:-track.clientWidth*.82,behavior:'smooth'});
  section.querySelector('#realVibesNext').onclick=()=>track.scrollBy({left:track.clientWidth*.82,behavior:'smooth'});
  syncUploadState();load();
})();

/* Load the AI status card next to the live upload flow. */
(() => {
  const cssId='hubcore-reel-ai-css';
  if(!document.getElementById(cssId)){
    const link=document.createElement('link');link.id=cssId;link.rel='stylesheet';link.href='reel-ai-studio.css?v=20260916-ai2';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-reel-ai-studio]')){
    const script=document.createElement('script');script.src='reel-ai-studio.js?v=20260916-ai2';script.defer=true;script.dataset.reelAiStudio='true';document.body.appendChild(script);
  }
})();
