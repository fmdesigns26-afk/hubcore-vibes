const nav=document.querySelector('.nav'),menu=document.querySelector('.menu');
menu?.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const trailerVideo=document.getElementById('trailerVideo');
const trailerProgress=document.getElementById('trailerProgress');
const trailerPlay=document.getElementById('trailerPlay');
const trailerScenes=[
  'assets/videos/reality-switch-title.mp4',
  'assets/videos/reality-switch-trailer-01.mp4',
  'assets/videos/reality-switch-character.mp4',
  'assets/videos/reality-switch-trailer-02.mp4'
];
let trailerSceneIndex=0;
function loadTrailerScene(index,autoplay=false){
  if(!trailerVideo)return;
  trailerSceneIndex=index%trailerScenes.length;
  trailerVideo.src=trailerScenes[trailerSceneIndex];
  trailerVideo.load();
  if(autoplay)trailerVideo.play().catch(()=>{});
}
trailerVideo?.addEventListener('ended',()=>loadTrailerScene(trailerSceneIndex+1,true));
trailerVideo?.addEventListener('timeupdate',()=>{if(trailerProgress&&trailerVideo.duration)trailerProgress.style.width=`${(trailerVideo.currentTime/trailerVideo.duration)*100}%`;});
trailerPlay?.addEventListener('click',()=>{trailerVideo?.play().then(()=>{trailerPlay.textContent='Playing preview';trailerPlay.classList.add('is-playing')}).catch(()=>{});});
loadTrailerScene(0);

function emptyPlatform(){return {membersOnlineNow:0,newMembersToday:0,postsToday:0,activeConversations:0,videosWatched:0,communityGrowth:0,trends:[],onlineUsers:[],notifications:[],metrics:{members:0,creators:0,posts:0,projects:0,events:0,games:0,messages:0},communityReach:{posts:0,comments:0,reactions:0,contributors:0},activity:[]};}
async function fetchPlatformData(){
  try{return await window.HubCoreAPI.getPlatformSnapshot();}
  catch(error){console.warn('Live platform data unavailable',error);return emptyPlatform();}
}
function renderPlatformData(data){
  const metrics=data.metrics||{};
  Object.entries(metrics).forEach(([key,value])=>{const el=document.querySelector(`[data-metric="${key}"]`);if(el)el.textContent=Number(value||0).toLocaleString();});
  const reach=data.communityReach||{};
  const reactionMetric=document.querySelector('[data-metric="reactions"]');
  const contributorMetric=document.querySelector('[data-metric="contributors"]');
  if(reactionMetric)reactionMetric.textContent=Number(reach.reactions||0).toLocaleString();
  if(contributorMetric)contributorMetric.textContent=Number(reach.contributors||0).toLocaleString();
  const metricMap={membersOnlineNow:data.membersOnlineNow,newMembersToday:data.newMembersToday,postsToday:data.postsToday,activeConversations:data.activeConversations,videosWatched:data.videosWatched,communityGrowth:data.communityGrowth};
  Object.entries(metricMap).forEach(([key,value])=>{const el=document.querySelector(`[data-metric="${key}"]`);if(!el)return;el.textContent=key==='communityGrowth'?`${Number(value||0)}%`:Number(value||0).toLocaleString();});
  const trendList=document.getElementById('trendList');if(trendList)trendList.innerHTML=(data.trends||[]).map(item=>`<li><strong>${item.name}</strong><span>${item.delta}</span></li>`).join('')||'<li><span>No live trends yet</span></li>';
  const timeline=document.getElementById('activityTimeline');if(timeline)timeline.innerHTML=(data.activity||[]).map(item=>`<li><strong>${item.label}</strong><span>${item.time}</span></li>`).join('')||'<li><span>No live activity yet</span></li>';
}
async function updatePlatformMetrics(){renderPlatformData(await fetchPlatformData());}
setInterval(updatePlatformMetrics,5000);updatePlatformMetrics();

const composerInput=document.getElementById('composerInput'),composerCount=document.getElementById('composerCount');
composerInput?.addEventListener('input',()=>{const remaining=280-composerInput.value.length;if(composerCount){composerCount.textContent=remaining;composerCount.classList.toggle('warning',remaining<25);}});

const navLinks=[...document.querySelectorAll('.nav a[href^="#"]')];
const sections=[...document.querySelectorAll('main section[id]')];
const navObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const id=entry.target.id;navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${id}`));});},{rootMargin:'-35% 0px -55% 0px',threshold:.1});
sections.forEach(section=>navObserver.observe(section));

document.getElementById('platformSearch')?.addEventListener('input',event=>{const query=event.target.value.trim().toLowerCase();document.querySelectorAll('.post-card').forEach(item=>{item.hidden=Boolean(query&&!item.textContent.toLowerCase().includes(query));});});
