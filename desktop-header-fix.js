(()=>{
  const mq=window.matchMedia('(min-width:1100px)');
  let ready=false;

  function targetForNotice(title){
    const text=String(title||'').toLowerCase();
    if(text.includes('join hubcore'))return document.getElementById('contact');
    if(text.includes('complete your vibe'))return document.getElementById('hubcore-profile')||document.getElementById('member-home');
    if(text.includes('promotevibe'))return document.getElementById('vibe-promote');
    if(text.includes('early access'))return document.getElementById('member-home')||document.getElementById('contact');
    return null;
  }

  function wireNotificationItems(panel){
    panel.querySelectorAll('#notificationList article').forEach(article=>{
      if(article.dataset.desktopNoticeReady)return;
      article.dataset.desktopNoticeReady='1';
      article.tabIndex=0;
      article.setAttribute('role','button');
      const open=()=>{
        const target=targetForNotice(article.querySelector('strong')?.textContent);
        if(target){
          panel.classList.remove('open');
          const bell=document.getElementById('hubcoreNotificationButton');
          bell?.setAttribute('aria-expanded','false');
          target.scrollIntoView({behavior:'smooth',block:'start'});
        }
      };
      article.addEventListener('click',open);
      article.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }

  function positionBell(header,nav,bell){
    const chip=document.getElementById('memberProfileChip');
    const toggle=header.querySelector('.mobile-menu-toggle');
    if(mq.matches){
      if(nav.nextElementSibling!==bell)nav.insertAdjacentElement('afterend',bell);
    }else{
      const anchor=chip||toggle||nav;
      if(bell.nextElementSibling!==anchor)header.insertBefore(bell,anchor);
    }
  }

  function setup(){
    const header=document.querySelector('header.nav');
    const nav=header?.querySelector('.launch-nav');
    const bell=document.getElementById('hubcoreNotificationButton');
    const panel=document.getElementById('notificationPanel');
    if(!header||!nav||!bell||!panel)return false;

    let vision=nav.querySelector('a[href="#vision"]');
    if(!vision){
      vision=document.createElement('a');
      vision.href='#vision';
      vision.textContent='Vision';
      nav.insertBefore(vision,nav.firstChild);
    }

    positionBell(header,nav,bell);
    bell.type='button';
    bell.setAttribute('aria-label','Open notifications');
    bell.setAttribute('aria-controls','notificationPanel');
    bell.setAttribute('aria-expanded',panel.classList.contains('open')?'true':'false');

    bell.onclick=null;
    bell.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const open=!panel.classList.contains('open');
      panel.classList.toggle('open',open);
      bell.setAttribute('aria-expanded',open?'true':'false');
    });

    const close=panel.querySelector('[data-close-notifications]');
    if(close){
      close.onclick=null;
      close.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        panel.classList.remove('open');
        bell.setAttribute('aria-expanded','false');
      });
    }

    panel.addEventListener('click',e=>e.stopPropagation());
    document.addEventListener('click',()=>{
      if(panel.classList.contains('open')){
        panel.classList.remove('open');
        bell.setAttribute('aria-expanded','false');
      }
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&panel.classList.contains('open')){
        panel.classList.remove('open');
        bell.setAttribute('aria-expanded','false');
        bell.focus();
      }
    });

    wireNotificationItems(panel);
    const list=panel.querySelector('#notificationList');
    if(list&&!list.dataset.desktopObserver){
      list.dataset.desktopObserver='1';
      new MutationObserver(()=>wireNotificationItems(panel)).observe(list,{childList:true,subtree:true});
    }

    if(!ready){
      ready=true;
      const reposition=()=>positionBell(header,nav,bell);
      if(mq.addEventListener)mq.addEventListener('change',reposition);else mq.addListener(reposition);
      window.addEventListener('resize',reposition,{passive:true});
    }
    return true;
  }

  function boot(){
    if(setup())return;
    const observer=new MutationObserver(()=>{if(setup())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),15000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
