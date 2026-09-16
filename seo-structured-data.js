(()=>{
  const addJsonLd=(id,data)=>{if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.type='application/ld+json';s.textContent=JSON.stringify(data);document.head.appendChild(s)};

  addJsonLd('hubcore-org-schema',{
    '@context':'https://schema.org','@type':'Organization',
    name:'HubCore Vibes',url:'https://hubcorevibes.com/',
    logo:'https://hubcorevibes.com/hubcore-logo.png',
    image:'https://hubcorevibes.com/hubcore-logo.png',
    description:'South African-founded digital platform in development connecting community, creators, entertainment, gaming, discovery and future digital services.',
    founder:{'@type':'Person',name:'Yutani Pretorius'},
    foundingLocation:{'@type':'Country',name:'South Africa'}
  });

  addJsonLd('hubcore-site-schema',{
    '@context':'https://schema.org','@type':'WebSite',
    name:'HubCore Vibes',url:'https://hubcorevibes.com/',
    description:'One connected digital universe for community, creators, entertainment, gaming and discovery.',
    publisher:{'@type':'Organization',name:'HubCore Vibes',url:'https://hubcorevibes.com/'}
  });

  const improveImages=()=>{
    const logo=document.querySelector('.brand-mark img');
    if(logo){logo.alt='HubCore Vibes official logo';logo.setAttribute('decoding','async')}
    const founder=document.getElementById('profileImage');
    if(founder){founder.alt='Yutani Pretorius, founder and creator of HubCore Vibes';founder.setAttribute('loading','lazy');founder.setAttribute('decoding','async')}
    document.querySelectorAll('#reality img').forEach(img=>{img.setAttribute('decoding','async')});
  };

  const addDiscoveryLinks=()=>{
    const trust=document.getElementById('hubcoreTrust');
    if(!trust||document.getElementById('hubcoreDiscoveryLinks'))return false;
    const block=document.createElement('nav');
    block.id='hubcoreDiscoveryLinks';
    block.setAttribute('aria-label','Explore HubCore Vibes');
    block.style.marginTop='12px';
    block.innerHTML='<a href="/about/">About HubCore</a><a href="/community/">Community</a><a href="/reel-vibes/">Reel Vibes</a><a href="/reality-switch/">Reality Switch</a><a href="/promote-vibe/">promoteVibe</a>';
    trust.appendChild(block);
    return true;
  };

  const init=()=>{improveImages();if(addDiscoveryLinks())return;const o=new MutationObserver(()=>{improveImages();if(addDiscoveryLinks())o.disconnect()});o.observe(document.body,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),15000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
