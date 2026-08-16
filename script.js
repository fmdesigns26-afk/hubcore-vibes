const nav=document.querySelector('.nav'),menu=document.querySelector('.menu');
menu?.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
const upload=document.getElementById('profileUpload'),img=document.getElementById('profileImage');
upload?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)img.src=URL.createObjectURL(f)});

const platformSeed={
  membersOnlineNow: 1842,
  newMembersToday: 318,
  postsToday: 962,
  activeConversations: 126,
  videosWatched: 8604,
  communityGrowth: 27,
  trends:[
    {name:'Reality Switch', delta:'+18.4%'},
    {name:'Creator collabs', delta:'+12.9%'},
    {name:'Vibes Chat', delta:'+9.2%'},
    {name:'HubBeats drops', delta:'+7.8%'}
  ],
  onlineUsers:[
    {name:'Avery Voss', status:'in creative sync'},
    {name:'Mila Kade', status:'reviewing concepts'},
    {name:'Jalen North', status:'building worlds'},
    {name:'Sera Ellis', status:'curating tracks'}
  ],
  notifications:[
    {title:'New follower', detail:'Avery followed you'},
    {title:'Creator collab', detail:'Mila shared a new concept'},
    {title:'Reality Switch', detail:'93 new watchers in the last hour'}
  ]
};

async function fetchPlatformData(){
  try {
    const response=await fetch('/api/platform', {cache:'no-store'});
    if(!response.ok) throw new Error('API unavailable');
    return await response.json();
  } catch (error) {
    return platformSeed;
  }
}

function renderPlatformData(data){
  const metricMap={
    membersOnlineNow: data.membersOnlineNow,
    newMembersToday: data.newMembersToday,
    postsToday: data.postsToday,
    activeConversations: data.activeConversations,
    videosWatched: data.videosWatched,
    communityGrowth: data.communityGrowth
  };

  Object.entries(metricMap).forEach(([key,value])=>{
    const el=document.querySelector(`[data-metric="${key}"]`);
    if(!el) return;
    el.textContent = key === 'communityGrowth' ? `${value}%` : value.toLocaleString();
  });

  const onlineCount=document.getElementById('onlineCount');
  if(onlineCount) onlineCount.textContent = String(data.membersOnlineNow || 0);

  const notificationCount=document.getElementById('notificationCount');
  if(notificationCount) notificationCount.textContent = String((data.notifications || []).length || 0);

  const trendList=document.getElementById('trendList');
  if(trendList){
    trendList.innerHTML = (data.trends || []).map(item => `
      <li><strong>${item.name}</strong><span>${item.delta}</span></li>
    `).join('');
  }

  const onlineList=document.getElementById('onlineList');
  if(onlineList){
    onlineList.innerHTML = (data.onlineUsers || []).map(user => `
      <li><div><strong>${user.name}</strong><span>${user.status}</span></div></li>
    `).join('');
  }

  const notificationList=document.getElementById('notificationList');
  if(notificationList){
    notificationList.innerHTML = (data.notifications || []).map(item => `
      <li><div><strong>${item.title}</strong><span>${item.detail}</span></div></li>
    `).join('');
  }
}

async function updatePlatformMetrics(){
  const data=await fetchPlatformData();
  renderPlatformData(data);
}

setInterval(updatePlatformMetrics, 8000);
updatePlatformMetrics();

const communityKey='hubcore-community-posts-v1';
const defaultPosts=[
  {id:'seed-1',name:'Nia Vega',handle:'@neonnomad',avatar:'NV',timestamp:Date.now()-1000*60*40,text:'The HubCore universe feels bigger every day. I love seeing creators, communities and ideas collide in one place.',reactions:{like:42,hub:29,fire:17,inspire:33},userReaction:null,comments:[{id:'c-1',author:'Ari',text:'This is the energy the platform needs.',timestamp:Date.now()-1000*60*22,replyTo:null}]},
  {id:'seed-2',name:'Jalen North',handle:'@portalcraft',avatar:'JN',timestamp:Date.now()-1000*60*115,text:'Reality Switch has the kind of worldbuilding that makes you want to explore every path. The community energy is unreal.',reactions:{like:51,hub:45,fire:27,inspire:48},userReaction:'hub',comments:[{id:'c-2',author:'You',text:'The world-building is genuinely cinematic.',timestamp:Date.now()-1000*60*7,replyTo:null}]}
];

function safeStorageGet(){
  try { const stored=localStorage.getItem(communityKey); return stored ? JSON.parse(stored) : null; } catch { return null; }
}

function safeStorageSet(posts){
  try { localStorage.setItem(communityKey, JSON.stringify(posts)); return true; } catch { return false; }
}

function getCommunityPosts(){
  const saved=safeStorageGet();
  if(Array.isArray(saved)&&saved.length) return saved;
  safeStorageSet(defaultPosts);
  return defaultPosts;
}

let communityPosts=getCommunityPosts();

function formatRelativeTime(time){
  const diff=Date.now()-Number(time);
  const mins=Math.floor(diff/60000);
  if(mins<1) return 'just now';
  if(mins<60) return `${mins}m ago`;
  const hours=Math.floor(mins/60);
  if(hours<24) return `${hours}h ago`;
  const days=Math.floor(hours/24);
  return `${days}d ago`;
}

function createShareUrl(postId){
  const url=new URL(window.location.href);
  url.hash=`community-post-${postId}`;
  return url.toString();
}

function renderPosts(){
  const feed=document.getElementById('communityFeed');
  if(!feed) return;
  if(!communityPosts.length){
    feed.innerHTML='<div class="empty-state">No posts yet. Start the conversation.</div>';
    return;
  }
  feed.innerHTML=communityPosts.map(post=>`
    <article class="post-card glass-panel" id="community-post-${post.id}" data-post-id="${post.id}">
      <div class="post-head">
        <div class="avatar">${post.avatar}</div>
        <div class="post-author">
          <strong>${post.name}</strong>
          <span>${post.handle} · ${formatRelativeTime(post.timestamp)}</span>
        </div>
      </div>
      <p class="post-text">${post.text}</p>
      <div class="reaction-row" role="group" aria-label="Post reactions">
        <button class="reaction-btn${post.userReaction==='like'?' active':''}" data-post-id="${post.id}" data-reaction="like" type="button" aria-label="Like post"><span>❤️</span><span>${post.reactions.like||0}</span></button>
        <button class="reaction-btn${post.userReaction==='hub'?' active':''}" data-post-id="${post.id}" data-reaction="hub" type="button" aria-label="Hub post"><span>💜</span><span>${post.reactions.hub||0}</span></button>
        <button class="reaction-btn${post.userReaction==='fire'?' active':''}" data-post-id="${post.id}" data-reaction="fire" type="button" aria-label="Fire post"><span>🔥</span><span>${post.reactions.fire||0}</span></button>
        <button class="reaction-btn${post.userReaction==='inspire'?' active':''}" data-post-id="${post.id}" data-reaction="inspire" type="button" aria-label="Inspire post"><span>✨</span><span>${post.reactions.inspire||0}</span></button>
      </div>
      <div class="post-actions">
        <button class="post-action comment-toggle" data-post-id="${post.id}" type="button">💬 Comment</button>
        <div class="share-group">
          <button class="post-action share-option" data-share="facebook" data-post-id="${post.id}" type="button">Facebook</button>
          <button class="post-action share-option" data-share="x" data-post-id="${post.id}" type="button">X</button>
          <button class="post-action share-option" data-share="linkedin" data-post-id="${post.id}" type="button">LinkedIn</button>
          <button class="post-action share-option" data-share="copy" data-post-id="${post.id}" type="button">Copy Link</button>
          <button class="post-action share-option" data-share="native" data-post-id="${post.id}" type="button">Native Share</button>
        </div>
      </div>
      <div class="comment-panel" data-post-id="${post.id}">
        <div class="comment-list">
          ${(post.comments||[]).map(comment=>`
            <div class="comment-item${comment.author==='You'?' own':''}" data-comment-id="${comment.id}">
              <div class="comment-bubble">
                <strong>${comment.author}</strong>
                <span>${comment.text}</span>
              </div>
              <div class="comment-tools">
                <button class="mini-btn reply-btn" type="button" data-post-id="${post.id}" data-comment-id="${comment.id}" data-author="${comment.author}">Reply</button>
                ${comment.author==='You' ? `<button class="mini-btn delete-btn" type="button" data-post-id="${post.id}" data-comment-id="${comment.id}">Delete</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <form class="comment-form" data-post-id="${post.id}">
          <textarea name="comment" rows="2" maxlength="180" placeholder="Add a comment..."></textarea>
          <button class="btn ghost" type="submit">Add</button>
        </form>
      </div>
    </article>
  `).join('');
}

function persistPosts(){
  safeStorageSet(communityPosts);
}

function addComment(postId, text, replyTo=null){
  const post=communityPosts.find(item=>item.id===postId);
  if(!post) return;
  const trimmed=text.trim();
  if(!trimmed) return;
  post.comments=(post.comments||[]);
  post.comments.push({
    id:`comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    author:'You',
    text:trimmed,
    timestamp:Date.now(),
    replyTo
  });
  persistPosts();
  renderPosts();
}

const composer=document.getElementById('communityForm');
const composerInput=document.getElementById('composerInput');
const composerCount=document.getElementById('composerCount');

composerInput?.addEventListener('input',()=>{
  const remaining=280 - composerInput.value.length;
  composerCount.textContent = remaining;
  composerCount.classList.toggle('warning', remaining < 25);
});

composer?.addEventListener('submit',e=>{
  e.preventDefault();
  const value=composerInput.value.trim();
  if(!value) return;
  const newPost={
    id:`post-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name:'You',
    handle:'@visitor',
    avatar:'Y',
    timestamp:Date.now(),
    text:value,
    reactions:{like:0,hub:0,fire:0,inspire:0},
    userReaction:null,
    comments:[]
  };
  communityPosts.unshift(newPost);
  persistPosts();
  renderPosts();
  composer.reset();
  composerCount.textContent='280';
  composerCount.classList.remove('warning');
});

document.addEventListener('click',e=>{
  const reaction=e.target.closest('.reaction-btn');
  if(reaction){
    const postId=reaction.dataset.postId;
    const reactionKey=reaction.dataset.reaction;
    const post=communityPosts.find(entry=>entry.id===postId);
    if(!post) return;
    const current=post.userReaction;
    if(current===reactionKey){
      post.reactions[reactionKey] = Math.max((post.reactions[reactionKey]||0)-1,0);
      post.userReaction=null;
    } else {
      if(current && current !== reactionKey){
        post.reactions[current] = Math.max((post.reactions[current]||0)-1,0);
      }
      post.reactions[reactionKey] = (post.reactions[reactionKey]||0)+1;
      post.userReaction=reactionKey;
    }
    persistPosts();
    renderPosts();
    return;
  }

  const share=e.target.closest('.share-option');
  if(share){
    const postId=share.dataset.postId;
    const post=communityPosts.find(entry=>entry.id===postId);
    if(!post) return;
    const shareUrl=createShareUrl(postId);
    const type=share.dataset.share;
    const encodedUrl=encodeURIComponent(shareUrl);
    const text=encodeURIComponent(post.text.slice(0,120));

    if(type==='copy'){
      navigator.clipboard?.writeText(shareUrl).catch(()=>{});
      return;
    }

    if(type==='native' && navigator.share){
      navigator.share({title:'HubCore Vibes',text:post.text,url:shareUrl}).catch(()=>{});
      return;
    }

    const urls={
      facebook:`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x:`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    };

    if(urls[type]) window.open(urls[type],'_blank','noopener,noreferrer');
    return;
  }

  const commentToggle=e.target.closest('.comment-toggle');
  if(commentToggle){
    const postId=commentToggle.dataset.postId;
    const panel=document.querySelector(`.comment-panel[data-post-id="${postId}"]`);
    panel?.classList.toggle('active');
    return;
  }

  const replyButton=e.target.closest('.reply-btn');
  if(replyButton){
    const postId=replyButton.dataset.postId;
    const commentId=replyButton.dataset.commentId;
    const panel=document.querySelector(`.comment-panel[data-post-id="${postId}"]`);
    const textarea=panel?.querySelector('textarea');
    if(textarea){
      textarea.dataset.replyTo=commentId;
      textarea.placeholder='Reply to this comment...';
      textarea.focus();
    }
    return;
  }

  const deleteButton=e.target.closest('.delete-btn');
  if(deleteButton){
    const postId=deleteButton.dataset.postId;
    const commentId=deleteButton.dataset.commentId;
    const post=communityPosts.find(entry=>entry.id===postId);
    if(!post) return;
    post.comments=(post.comments||[]).filter(comment=>comment.id!==commentId || comment.author!=='You');
    persistPosts();
    renderPosts();
  }
});

document.addEventListener('submit',e=>{
  const form=e.target.closest('.comment-form');
  if(!form) return;
  e.preventDefault();
  const postId=form.dataset.postId;
  const textarea=form.querySelector('textarea');
  const value=textarea.value.trim();
  if(!value) return;
  const replyTo=textarea.dataset.replyTo || null;
  addComment(postId, value, replyTo);
  textarea.value='';
  delete textarea.dataset.replyTo;
  textarea.placeholder='Add a comment...';
});

const navLinks=[...document.querySelectorAll('.nav a[href^="#"]')];
const sections=[...document.querySelectorAll('main section[id]')];
const navObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const id=entry.target.getAttribute('id');
    navLinks.forEach(link=>{
      const active=link.getAttribute('href')===`#${id}`;
      link.classList.toggle('active', active);
    });
  });
},{rootMargin:'-35% 0px -55% 0px', threshold:0.1});
sections.forEach(section=>navObserver.observe(section));

const counterObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const el=entry.target;
    const target=Number(el.dataset.target || 0);
    const suffix=el.dataset.suffix || '';
    const start=performance.now();
    const duration=1400;

    const step=(now)=>{
      const progress=Math.min((now-start)/duration,1);
      const eased=1-Math.pow(1-progress,3);
      const value=Math.round(target*eased);
      el.textContent=`${value}${suffix}`;
      if(progress<1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    counterObserver.unobserve(el);
  });
},{threshold:0.5});

document.querySelectorAll('.counter').forEach(counter=>counterObserver.observe(counter));

document.querySelectorAll('.follow-btn').forEach(button=>button.addEventListener('click',()=>{
  const isFollowing = button.classList.toggle('following');
  button.textContent = isFollowing ? 'Following' : 'Follow';
}));

renderPosts();

