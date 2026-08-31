const nav=document.querySelector(".nav"),menu=document.querySelector(".menu");
menu?.addEventListener("click",()=>nav.classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function relativeTime(value){const d=Date.now()-new Date(value+"Z").getTime();const m=Math.floor(d/60000);if(m<1)return"just now";if(m<60)return m+"m ago";const h=Math.floor(m/60);if(h<24)return h+"h ago";return Math.floor(h/24)+"d ago";}
function shareUrl(postId){const u=new URL(location.href);u.hash="community-"+postId;return u.toString();}
let posts=[];

function renderPosts(){
 const feed=document.getElementById("communityFeed");if(!feed)return;
 if(!posts.length){feed.innerHTML='<div class="empty-state">Be the first person to share your thoughts about HubCore Vibes.</div>';return;}
 feed.innerHTML=posts.map(post=>`<article class="post-card glass-panel" id="community-${escapeHTML(post.id)}" data-post-id="${escapeHTML(post.id)}">
 <div class="post-head"><div class="avatar">${escapeHTML(post.avatar)}</div><div class="post-author"><strong>${escapeHTML(post.name)}</strong><span>${escapeHTML(post.country||"HubCore community")} · ${relativeTime(post.createdAt)}</span></div></div>
 <p class="post-text">${escapeHTML(post.text)}</p>
 <div class="post-actions"><button class="reaction-btn${post.liked?" active":""}" data-like="${escapeHTML(post.id)}" type="button">❤️ <span>${Number(post.likes||0)}</span></button>
 <button class="post-action" data-share="${escapeHTML(post.id)}" type="button">↗ Share <span>${Number(post.shares||0)}</span></button></div></article>`).join("");
}

function setNumber(ids,value){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=Number(value||0).toLocaleString();});}
async function loadStats(){
 const d=await window.HubCoreAPI.getCommunityStats();
 setNumber(["communityPostCount","counterComments"],d.comments);
 setNumber(["communityLikeCount","counterLikes"],d.likes);
 setNumber(["communityShareCount","counterShares"],d.shares);
 setNumber(["communityCountryCount","counterCountries"],d.countries);
}
async function loadCommunity(){
 try{const d=await window.HubCoreAPI.getCommunity();posts=d.posts||[];renderPosts();await loadStats();}catch(e){const feed=document.getElementById("communityFeed");if(feed)feed.innerHTML='<div class="empty-state">The live community is being connected. Please check back shortly.</div>';}
}

const composer=document.getElementById("communityForm"),composerInput=document.getElementById("composerInput"),composerCount=document.getElementById("composerCount"),communityStatus=document.getElementById("communityStatus");
composerInput?.addEventListener("input",()=>{const left=500-composerInput.value.length;composerCount.textContent=left;composerCount.classList.toggle("warning",left<40);});
composer?.addEventListener("submit",async e=>{
 e.preventDefault();const button=composer.querySelector("button[type=submit]");communityStatus.textContent="";
 const payload={name:document.getElementById("guestName").value,country:document.getElementById("guestCountry").value,text:composerInput.value};
 button.disabled=true;button.textContent="Sharing...";
 try{await window.HubCoreAPI.createCommunityPost(payload);composer.reset();composerCount.textContent="500";communityStatus.textContent="Your comment is now live for the HubCore Vibes community.";await loadCommunity();}
 catch(err){communityStatus.textContent=err.message||"Unable to share your comment.";}
 finally{button.disabled=false;button.textContent="Share with the community";}
});

document.addEventListener("click",async e=>{
 const like=e.target.closest("[data-like]");if(like){const post=posts.find(p=>p.id===like.dataset.like);if(!post)return;like.disabled=true;try{const result=await window.HubCoreAPI.like(post.id,!post.liked);post.liked=result.liked;post.likes=result.likes;renderPosts();await loadStats();}catch(err){alert(err.message)}return;}
 const share=e.target.closest("[data-share]");if(share){const post=posts.find(p=>p.id===share.dataset.share);if(!post)return;let channel="copy";const url=shareUrl(post.id);try{if(navigator.share){channel="native";await navigator.share({title:"HubCore Vibes community",text:post.text,url});}else{await navigator.clipboard.writeText(url);}}catch(_){}try{const result=await window.HubCoreAPI.share(post.id,channel);post.shares=result.shares;renderPosts();await loadStats();}catch(_){}}
});

document.querySelectorAll(".contact-form").forEach(form=>form.addEventListener("submit",async e=>{
 e.preventDefault();const button=form.querySelector("button"),status=form.querySelector(".form-status");button.disabled=true;status.textContent="";
 try{const data=await window.HubCoreAPI.contact({type:form.dataset.contactType,name:form.elements.name.value,email:form.elements.email.value,message:form.elements.message.value});status.textContent=data.message;form.reset();}catch(err){status.textContent=err.message||"Unable to send your request.";}finally{button.disabled=false;}
}));

const navLinks=[...document.querySelectorAll('.nav a[href^="#"]')],sections=[...document.querySelectorAll("main section[id]")];
const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const id=entry.target.id;navLinks.forEach(link=>link.classList.toggle("active",link.getAttribute("href")==="#"+id));}),{rootMargin:"-35% 0px -55% 0px",threshold:.1});
sections.forEach(section=>navObserver.observe(section));

document.getElementById("platformSearch")?.addEventListener("input",event=>{const q=event.target.value.trim().toLowerCase();document.querySelectorAll(".post-card").forEach(item=>item.hidden=Boolean(q&&!item.textContent.toLowerCase().includes(q)));});

loadCommunity();
setInterval(loadCommunity,30000);
