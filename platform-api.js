/* Cloudflare Pages Functions client for live HubCore Vibes community data. */
window.HubCoreAPI={
  async getPlatformSnapshot(){const response=await fetch('/api/platform',{cache:'no-store'});if(!response.ok)throw new Error('Platform API unavailable');return response.json();},
  async getCommunityPosts(){const response=await fetch('/api/community',{cache:'no-store'});if(!response.ok)throw new Error('Community API unavailable');const data=await response.json();return Array.isArray(data.posts)?data.posts:[];},
  async createPost(post){const response=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_post',post})});if(!response.ok)throw new Error('Unable to sync post');return response.json();},
  async createComment(postId,comment){const response=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_comment',comment:{...comment,postId}})});if(!response.ok)throw new Error('Unable to sync comment');return response.json();},
  async setReaction(postId,reaction,delta){const response=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set_reaction',postId,reaction,delta})});if(!response.ok)throw new Error('Unable to sync reaction');return response.json();},
  async deleteComment(commentId){const response=await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete_comment',commentId})});if(!response.ok)throw new Error('Unable to delete comment');return response.json();},
  async subscribeToActivity(){return()=>{};}
};
(function loadHubCoreProductionLayers(){
  const version='20260901-live-final2';
  const styles=[['/live-fixes.css','hubcore-live-fixes'],['/site-polish.css','hubcore-site-polish'],['/final-fixes.css','hubcore-final-fixes']];
  for(const [href,id] of styles){const existing=document.getElementById(id);if(existing){existing.href=`${href}?v=${version}`;continue;}const link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=`${href}?v=${version}`;document.head.appendChild(link);}
  const scripts=[['/live-community.js','hubcore-live-community'],['/site-polish.js','hubcore-site-polish']];
  for(const [src,id] of scripts){const existing=document.getElementById(id);if(existing){existing.src=`${src}?v=${version}`;continue;}const script=document.createElement('script');script.id=id;script.src=`${src}?v=${version}`;script.defer=true;document.head.appendChild(script);}
})();
