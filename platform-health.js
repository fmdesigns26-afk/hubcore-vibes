(()=>{
  const cacheKey='hubcore-community-reach-v1';
  const readCached=()=>{try{const value=JSON.parse(localStorage.getItem(cacheKey)||'null');return value&&typeof value==='object'?value:null;}catch{return null;}};
  const saveCached=value=>{try{localStorage.setItem(cacheKey,JSON.stringify(value));}catch{}};
  const render=reach=>{document.querySelectorAll('[data-live-reach]').forEach(el=>{const value=Number(reach?.[el.dataset.liveReach]);if(Number.isFinite(value))el.textContent=value.toLocaleString();});};
  async function sync(){
    const note=document.querySelector('.live-reach-note');
    try{
      const r=await fetch('/api/platform',{cache:'no-store',headers:{Accept:'application/json'}});
      const type=r.headers.get('content-type')||'';
      if(!r.ok||!type.includes('application/json'))throw new Error('Platform API unavailable');
      const d=await r.json();
      if(d.live!==true)throw new Error('Platform database unavailable');
      const reach=d.communityReach||{};
      render(reach);saveCached(reach);
      if(note){const total=Number(reach.posts||0)+Number(reach.comments||0)+Number(reach.reactions||0)+Number(reach.shares||0);note.textContent=total?'Community totals only: posts, comments, reactions and contributors. Website visits are shown separately below.':'HubCore Vibes community activity is connected. Be the first to post, comment or react.';note.classList.remove('data-warning');}
    }catch(error){
      const cached=readCached();if(cached)render(cached);
      if(note){note.textContent=cached?'Showing the latest confirmed Community totals while live data reconnects.':'Live community data is reconnecting. Activity figures will appear as soon as the database connection is available.';note.classList.add('data-warning');}
      console.warn('HubCore Community health check failed:',error);
    }
  }
  function init(){const cached=readCached();if(cached)render(cached);sync();setInterval(sync,5000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
