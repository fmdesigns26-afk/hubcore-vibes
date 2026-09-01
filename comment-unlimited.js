(()=>{
  const install=()=>{
    if(!window.HubCoreAPI?.createComment)return setTimeout(install,50);
    if(window.HubCoreAPI.__longCommentsEnabled)return;
    window.HubCoreAPI.__longCommentsEnabled=true;

    window.HubCoreAPI.createComment=async function(postId,comment){
      const r=await fetch('/api/community-long',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_comment',comment:{...comment,postId}})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Unable to sync comment');
      return d;
    };

    const unlock=root=>{
      root.querySelectorAll?.('#community textarea[name="comment"]').forEach(el=>{
        el.removeAttribute('maxlength');
        el.dataset.longComments='1';
        el.setAttribute('aria-label','Write your comment — long comments are welcome');
      });
    };

    unlock(document);
    new MutationObserver(()=>unlock(document)).observe(document.documentElement,{childList:true,subtree:true});
  };
  install();
})();
