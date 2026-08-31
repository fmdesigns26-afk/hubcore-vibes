(() => {
  const API = () => window.HubCoreAPI;
  const reactionKey = 'hubcore-live-reactions-v1';
  const clientState = () => {
    try { return JSON.parse(localStorage.getItem(reactionKey) || '{}'); } catch { return {}; }
  };
  const saveClientState = state => { try { localStorage.setItem(reactionKey, JSON.stringify(state)); } catch {} };
  const esc = value => String(value ?? '').replace(/[&<>\'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const timeAgo = value => {
    const mins = Math.floor((Date.now() - Number(value)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  let posts = [];

  function render() {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;
    const reactions = clientState();
    feed.innerHTML = posts.length ? posts.map(post => {
      const mine = reactions[post.id] || null;
      const counts = post.reactions || {};
      return `<article class="post-card glass-panel" id="community-post-${esc(post.id)}" data-post-id="${esc(post.id)}">
        <div class="post-head"><div class="avatar">${esc(post.avatar)}</div><div class="post-author"><strong>${esc(post.name)}</strong><span>${esc(post.handle)} · ${timeAgo(post.timestamp)}</span></div></div>
        <p class="post-text">${esc(post.text)}</p>
        <div class="reaction-row" role="group" aria-label="Post reactions">
          ${[['like','❤️'],['hub','💜'],['fire','🔥'],['inspire','✨']].map(([key,icon]) => `<button class="reaction-btn${mine===key?' active':''}" data-post-id="${esc(post.id)}" data-reaction="${key}" type="button"><span>${icon}</span><span>${Number(counts[key]||0)}</span></button>`).join('')}
        </div>
        <div class="post-actions">
          <button class="post-action comment-toggle" data-post-id="${esc(post.id)}" type="button">💬 Comment</button>
          <button class="post-action share-toggle" data-post-id="${esc(post.id)}" type="button">↗ Share</button>
          <button class="post-action bookmark-btn" data-post-id="${esc(post.id)}" type="button">🔖 Bookmark</button>
          <div class="share-group"><button class="post-action share-option" data-share="facebook" data-post-id="${esc(post.id)}" type="button">Facebook</button><button class="post-action share-option" data-share="x" data-post-id="${esc(post.id)}" type="button">X</button><button class="post-action share-option" data-share="linkedin" data-post-id="${esc(post.id)}" type="button">LinkedIn</button><button class="post-action share-option" data-share="copy" data-post-id="${esc(post.id)}" type="button">Copy Link</button><button class="post-action share-option" data-share="native" data-post-id="${esc(post.id)}" type="button">Native Share</button></div>
        </div>
        <div class="comment-panel" data-post-id="${esc(post.id)}"><div class="comment-list">${(post.comments||[]).map(c => `<div class="comment-item${c.author==='You'?' own':''}" data-comment-id="${esc(c.id)}"><div class="comment-bubble"><strong>${esc(c.author)}</strong><span>${esc(c.text)}</span></div><div class="comment-tools"><button class="mini-btn reply-btn" type="button" data-post-id="${esc(post.id)}" data-comment-id="${esc(c.id)}" data-author="${esc(c.author)}">Reply</button>${c.author==='You'?`<button class="mini-btn delete-btn" type="button" data-post-id="${esc(post.id)}" data-comment-id="${esc(c.id)}">Delete</button>`:''}</div></div>`).join('')}</div><form class="comment-form" data-post-id="${esc(post.id)}"><textarea name="comment" rows="2" maxlength="180" placeholder="Add a comment..."></textarea><button class="btn ghost" type="submit">Add</button></form></div>
      </article>`;
    }).join('') : '<div class="empty-state">No posts yet. Start the conversation.</div>';
  }

  async function refresh() {
    try { posts = await API().getCommunityPosts(); render(); } catch (error) { console.warn('HubCore live community:', error); }
  }

  async function changeReaction(postId, key) {
    const state = clientState();
    const previous = state[postId] || null;
    if (previous === key) {
      await fetch('/api/community', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set_reaction',postId,reaction:key,delta:-1})});
      delete state[postId];
    } else {
      if (previous) await fetch('/api/community', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set_reaction',postId,reaction:previous,delta:-1})});
      await fetch('/api/community', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set_reaction',postId,reaction:key,delta:1})});
      state[postId] = key;
    }
    saveClientState(state);
    await refresh();
  }

  function sharePost(postId, type) {
    const url = `${location.origin}${location.pathname}#community-post-${encodeURIComponent(postId)}`;
    const post = posts.find(p => p.id === postId);
    const text = post?.text || 'Check out this post on HubCore Vibes';
    if (type === 'copy') { navigator.clipboard?.writeText(url); return; }
    if (type === 'native' && navigator.share) { navigator.share({title:'HubCore Vibes',text,url}).catch(()=>{}); return; }
    const u=encodeURIComponent(url), t=encodeURIComponent(text.slice(0,120));
    const links={facebook:`https://www.facebook.com/sharer/sharer.php?u=${u}`,x:`https://twitter.com/intent/tweet?url=${u}&text=${t}`,linkedin:`https://www.linkedin.com/sharing/share-offsite/?url=${u}`};
    if(links[type]) window.open(links[type],'_blank','noopener,noreferrer');
  }

  document.addEventListener('click', async event => {
    const reaction = event.target.closest('.reaction-btn');
    if (reaction) { event.preventDefault(); event.stopImmediatePropagation(); await changeReaction(reaction.dataset.postId, reaction.dataset.reaction); return; }
    const commentToggle = event.target.closest('.comment-toggle');
    if (commentToggle) { event.preventDefault(); event.stopImmediatePropagation(); document.querySelector(`.comment-panel[data-post-id="${commentToggle.dataset.postId}"]`)?.classList.toggle('active'); return; }
    const shareToggle = event.target.closest('.share-toggle');
    if (shareToggle) { event.preventDefault(); event.stopImmediatePropagation(); document.querySelector(`.post-card[data-post-id="${shareToggle.dataset.postId}"] .share-group`)?.classList.toggle('active'); return; }
    const share = event.target.closest('.share-option');
    if (share) { event.preventDefault(); event.stopImmediatePropagation(); sharePost(share.dataset.postId, share.dataset.share); return; }
    const reply = event.target.closest('.reply-btn');
    if (reply) { event.preventDefault(); event.stopImmediatePropagation(); const box=document.querySelector(`.comment-panel[data-post-id="${reply.dataset.postId}"] textarea`); if(box){box.dataset.replyTo=reply.dataset.commentId;box.placeholder=`Reply to ${reply.dataset.author}...`;box.focus();} return; }
    const del = event.target.closest('.delete-btn');
    if (del) { event.preventDefault(); event.stopImmediatePropagation(); await API().deleteComment(del.dataset.commentId); await refresh(); return; }
  }, true);

  document.addEventListener('submit', async event => {
    const commentForm=event.target.closest('.comment-form');
    if(commentForm){
      event.preventDefault(); event.stopImmediatePropagation();
      const textarea=commentForm.querySelector('textarea'), text=textarea.value.trim(); if(!text)return;
      const comment={id:`comment-${crypto.randomUUID?.()||Date.now()}`,author:'You',text,timestamp:Date.now(),replyTo:textarea.dataset.replyTo||null};
      await API().createComment(commentForm.dataset.postId,comment); textarea.value=''; delete textarea.dataset.replyTo; textarea.placeholder='Add a comment...'; await refresh(); return;
    }
    const composer=event.target.closest('#communityForm');
    if(composer){
      event.preventDefault(); event.stopImmediatePropagation();
      const input=document.getElementById('composerInput'), text=input?.value.trim(); if(!text)return;
      const post={id:`post-${crypto.randomUUID?.()||Date.now()}`,name:'You',handle:'@visitor',avatar:'Y',timestamp:Date.now(),text,reactions:{like:0,hub:0,fire:0,inspire:0},comments:[]};
      await API().createPost(post); composer.reset(); const count=document.getElementById('composerCount'); if(count)count.textContent='280'; await refresh(); return;
    }
  }, true);

  window.addEventListener('DOMContentLoaded', () => { refresh(); setInterval(refresh, 3000); });
})();
