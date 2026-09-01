(() => {
  const API=()=>window.HubCoreAPI;
  const reactionKey='hubcore-live-reactions-v2';
  const profileKey='hubcore-community-profile-v1';
  const founderTokenKey='hubcore-founder-token-v1';
  const esc=value=>String(value??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const timeAgo=value=>{const mins=Math.floor((Date.now()-Number(value))/60000);if(mins<1)return'just now';if(mins<60)return`${mins}m ago`;const hours=Math.floor(mins/60);if(hours<24)return`${hours}h ago`;return`${Math.floor(hours/24)}d ago`;};
  const readJSON=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;}};
  const saveJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const normalizeHandle=value=>{const clean=String(value||'').trim().replace(/\s+/g,'').slice(0,30);return clean?`@${clean.replace(/^@+/,'')}`:'';};
  const founderSession=()=>Boolean(localStorage.getItem(founderTokenKey));
  const founderBadge=()=>'<span class="founder-badge">✓ Founder</span>';
  let posts=[];

  function profile(){return readJSON(profileKey,{name:'',handle:''});}
  function saveProfile(name,handle){const p={name:String(name||'').trim().slice(0,60),handle:normalizeHandle(handle)};saveJSON(profileKey,p);return p;}
  function initials(name){return String(name||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'U';}
  function displayCommentAuthor(c){
    if(c?.isFounder)return `${founderBadge()}<span class="founder-comment-name">Yutani Pretorius</span><span class="founder-comment-role">Founder · @yutanipretorius</span>`;
    return `<strong>${esc(c?.author||'Visitor')}</strong>`;
  }

  function updateCommunityIntro(){
    const section=document.getElementById('community');if(!section)return;
    const heading=section.querySelector('.section-heading h2');if(heading)heading.innerHTML='What do you <span>think?</span>';
    let intro=section.querySelector('.community-feedback-intro');
    if(!intro){intro=document.createElement('p');intro.className='community-feedback-intro';section.querySelector('.section-heading')?.appendChild(intro);}
    intro.textContent='Tell us what you like about HubCore Vibes, what you would improve, and what you would love to see next. Your post is shared with the community.';
    const input=document.getElementById('composerInput');if(input)input.placeholder='What do you like? What should we improve? What would you like to see next?';
  }

  function ensureComposerIdentity(){
    const form=document.getElementById('communityForm');if(!form||form.querySelector('.identity-row'))return;
    const p=profile();
    const row=document.createElement('div');row.className='identity-row';
    row.innerHTML=`<label><span>Your name</span><input name="displayName" maxlength="60" autocomplete="name" placeholder="Name people will see" value="${esc(p.name)}" required></label><label><span>Username</span><input name="username" maxlength="30" autocomplete="username" placeholder="@username" value="${esc(p.handle)}" required></label>`;
    form.insertBefore(row,form.firstChild);
  }

  function previewComments(post){
    const comments=post.comments||[];if(!comments.length)return'';
    return `<div class="comment-preview"><div class="comment-preview-title">Latest comments</div>${comments.slice(-2).map(c=>`<div class="comment-preview-item${c.isFounder?' founder-comment':''}">${c.isFounder?`${founderBadge()}<strong>Yutani Pretorius</strong><small>Founder · @yutanipretorius</small>`:`<strong>${esc(c.author)}</strong>`}<span>${esc(c.text)}</span></div>`).join('')}</div>`;
  }

  function render(){
    const feed=document.getElementById('communityFeed');if(!feed)return;
    const selected=readJSON(reactionKey,{}),p=profile(),founder=founderSession();
    feed.innerHTML=posts.length?posts.map(post=>{
      const mine=selected[post.id]||null,counts=post.reactions||{},commentCount=(post.comments||[]).length,shareCount=Number(post.shares||0);
      return `<article class="post-card glass-panel" id="community-post-${esc(post.id)}" data-post-id="${esc(post.id)}">
        <div class="post-head"><div class="avatar">${esc(post.avatar||initials(post.name))}</div><div class="post-author">${post.isFounder?founderBadge():''}<strong>${esc(post.name)}</strong><span>${esc(post.handle)} · ${timeAgo(post.timestamp)}</span></div></div>
        <p class="post-text">${esc(post.text)}</p>
        <div class="reaction-row" role="group" aria-label="Post reactions">${[['like','❤️'],['hub','💜'],['fire','🔥'],['inspire','✨']].map(([key,icon])=>`<button class="reaction-btn${mine===key?' active':''}" data-post-id="${esc(post.id)}" data-reaction="${key}" type="button" aria-label="React with ${key}"><span>${icon}</span><span>${Number(counts[key]||0)}</span></button>`).join('')}</div>
        ${previewComments(post)}
        <div class="post-actions"><button class="post-action comment-toggle" data-post-id="${esc(post.id)}" type="button">💬 Comments <span>${commentCount}</span></button><button class="post-action share-toggle" data-post-id="${esc(post.id)}" type="button">↗ Share <span>${shareCount}</span></button><button class="post-action bookmark-btn" data-post-id="${esc(post.id)}" type="button">🔖 Bookmark</button><div class="share-group"><button class="post-action share-option" data-share="facebook" data-post-id="${esc(post.id)}" type="button">Facebook</button><button class="post-action share-option" data-share="x" data-post-id="${esc(post.id)}" type="button">X</button><button class="post-action share-option" data-share="linkedin" data-post-id="${esc(post.id)}" type="button">LinkedIn</button><button class="post-action share-option" data-share="copy" data-post-id="${esc(post.id)}" type="button">Copy Link</button><button class="post-action share-option" data-share="native" data-post-id="${esc(post.id)}" type="button">Share</button></div></div>
        <div class="comment-panel" data-post-id="${esc(post.id)}"><div class="comment-list">${(post.comments||[]).map(c=>`<div class="comment-item${c.isFounder?' founder-comment':''}" data-comment-id="${esc(c.id)}"><div class="comment-bubble">${displayCommentAuthor(c)}<span>${esc(c.text)}</span><small>${timeAgo(c.timestamp)}</small></div><div class="comment-tools"><button class="mini-btn reply-btn" type="button" data-post-id="${esc(post.id)}" data-comment-id="${esc(c.id)}" data-author="${esc(c.isFounder?'Yutani Pretorius':c.author)}">Reply</button></div></div>`).join('')||'<div class="empty-state compact">No comments yet. Start the conversation.</div>'}</div><form class="comment-form" data-post-id="${esc(post.id)}">${founder?`<div class="comment-identity founder-comment-identity"><div class="founder-identity-lock">${founderBadge()}<div><strong>Yutani Pretorius</strong><span>Founder · @yutanipretorius</span></div></div></div>`:`<div class="comment-identity"><input name="commentName" maxlength="60" placeholder="Your name" value="${esc(p.name)}" required><input name="commentUsername" maxlength="30" placeholder="@username" value="${esc(p.handle)}" required></div>`}<textarea name="comment" rows="5" placeholder="Write your comment — long comments are welcome…" required></textarea><button class="btn primary comment-send" type="submit">Send comment</button></form></div>
      </article>`;
    }).join(''):'<div class="empty-state">No live posts yet. Be the first to tell the community what you think.</div>';
  }

  async function refresh(){try{posts=await API().getCommunityPosts();render();}catch(error){console.warn('HubCore live community unavailable:',error);}}
  async function changeReaction(postId,key){const state=readJSON(reactionKey,{}),previous=state[postId]||null;if(previous===key){await API().setReaction(postId,key,-1);delete state[postId];}else{if(previous)await API().setReaction(postId,previous,-1);await API().setReaction(postId,key,1);state[postId]=key;}saveJSON(reactionKey,state);await refresh();}
  async function recordShare(postId,channel){try{await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'record_share',id:`share-${crypto.randomUUID?.()||Date.now()}`,postId,channel})});await refresh();}catch(error){console.warn('Unable to record share',error);}}
  async function sharePost(postId,type){
    const url=`${location.origin}${location.pathname}#community-post-${encodeURIComponent(postId)}`,post=posts.find(p=>p.id===postId),text=post?.text||'Check out this post on HubCore Vibes';
    if(type==='copy'){try{await navigator.clipboard?.writeText(url);await recordShare(postId,'copy');}catch{}return;}
    if(type==='native'&&navigator.share){try{await navigator.share({title:'HubCore Vibes',text,url});await recordShare(postId,'native');}catch{}return;}
    const u=encodeURIComponent(url),t=encodeURIComponent(text.slice(0,120)),links={facebook:`https://www.facebook.com/sharer/sharer.php?u=${u}`,x:`https://twitter.com/intent/tweet?url=${u}&text=${t}`,linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${u}`};
    if(links[type]){window.open(links[type],'_blank','noopener,noreferrer');await recordShare(postId,type);}
  }

  document.addEventListener('click',async event=>{
    const reaction=event.target.closest('.reaction-btn');if(reaction){event.preventDefault();event.stopImmediatePropagation();await changeReaction(reaction.dataset.postId,reaction.dataset.reaction);return;}
    const commentToggle=event.target.closest('.comment-toggle');if(commentToggle){event.preventDefault();event.stopImmediatePropagation();const panel=document.querySelector(`.comment-panel[data-post-id="${commentToggle.dataset.postId}"]`);panel?.classList.toggle('active');if(panel?.classList.contains('active'))panel.querySelector('textarea')?.focus();return;}
    const shareToggle=event.target.closest('.share-toggle');if(shareToggle){event.preventDefault();event.stopImmediatePropagation();document.querySelector(`.post-card[data-post-id="${shareToggle.dataset.postId}"] .share-group`)?.classList.toggle('active');return;}
    const share=event.target.closest('.share-option');if(share){event.preventDefault();event.stopImmediatePropagation();await sharePost(share.dataset.postId,share.dataset.share);return;}
    const reply=event.target.closest('.reply-btn');if(reply){event.preventDefault();event.stopImmediatePropagation();const box=document.querySelector(`.comment-panel[data-post-id="${reply.dataset.postId}"] textarea`);if(box){box.dataset.replyTo=reply.dataset.commentId;box.placeholder=`Reply to ${reply.dataset.author}…`;box.focus();}return;}
    const bookmark=event.target.closest('.bookmark-btn');if(bookmark){event.preventDefault();event.stopImmediatePropagation();bookmark.classList.toggle('active');bookmark.textContent=bookmark.classList.contains('active')?'🔖 Saved':'🔖 Bookmark';}
  },true);

  document.addEventListener('submit',async event=>{
    const commentForm=event.target.closest('.comment-form');
    if(commentForm){event.preventDefault();event.stopImmediatePropagation();const textarea=commentForm.querySelector('textarea'),founder=founderSession();let name='Yutani Pretorius',handle='@yutanipretorius';if(!founder){name=commentForm.querySelector('[name="commentName"]')?.value.trim();handle=normalizeHandle(commentForm.querySelector('[name="commentUsername"]')?.value);if(!name||!handle)return;saveProfile(name,handle);}const text=textarea.value.trim();if(!text)return;const comment={id:`comment-${crypto.randomUUID?.()||Date.now()}`,author:founder?'Founder · Yutani Pretorius · @yutanipretorius':`${name} · ${handle}`,text,timestamp:Date.now(),replyTo:textarea.dataset.replyTo||null};await API().createComment(commentForm.dataset.postId,comment);textarea.value='';delete textarea.dataset.replyTo;textarea.placeholder='Write your comment…';await refresh();return;}
    const composer=event.target.closest('#communityForm');
    if(composer){event.preventDefault();event.stopImmediatePropagation();const input=document.getElementById('composerInput'),founder=founderSession();let name='Yutani Pretorius',handle='@yutanipretorius';if(!founder){name=composer.querySelector('[name="displayName"]')?.value.trim();handle=normalizeHandle(composer.querySelector('[name="username"]')?.value);if(!name||!handle)return;saveProfile(name,handle);}const text=input?.value.trim();if(!text)return;const post={id:`post-${crypto.randomUUID?.()||Date.now()}`,name,handle,avatar:initials(name),timestamp:Date.now(),text,reactions:{like:0,hub:0,fire:0,inspire:0},comments:[],shares:0};await API().createPost(post);input.value='';const count=document.getElementById('composerCount');if(count)count.textContent='280';await refresh();return;}
  },true);

  function init(){try{localStorage.removeItem('hubcore-community-posts-v1');}catch{}updateCommunityIntro();ensureComposerIdentity();refresh();setInterval(refresh,3000);}
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
