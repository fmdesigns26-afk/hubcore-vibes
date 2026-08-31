/* Cloudflare Pages Functions client for live HubCore Vibes community data. */
window.HubCoreAPI = {
  async getPlatformSnapshot() {
    const response = await fetch('/api/platform', { cache: 'no-store' });
    if (!response.ok) throw new Error('Platform API unavailable');
    return response.json();
  },
  async getCommunityPosts() {
    const response = await fetch('/api/community', { cache: 'no-store' });
    if (!response.ok) throw new Error('Community API unavailable');
    const data = await response.json();
    return Array.isArray(data.posts) ? data.posts : [];
  },
  async createPost(post) {
    const response = await fetch('/api/community', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_post',post})});
    if (!response.ok) throw new Error('Unable to sync post');
    return response.json();
  },
  async createComment(postId, comment) {
    const response = await fetch('/api/community', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_comment',comment:{...comment,postId}})});
    if (!response.ok) throw new Error('Unable to sync comment');
    return response.json();
  },
  async toggleReaction(postId, reaction) {
    const response = await fetch('/api/community', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle_reaction',postId,reaction})});
    if (!response.ok) throw new Error('Unable to sync reaction');
    return response.json();
  },
  async deleteComment(commentId) {
    const response = await fetch('/api/community', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete_comment',commentId})});
    if (!response.ok) throw new Error('Unable to delete comment');
    return response.json();
  },
  async subscribeToActivity() { return () => {}; }
};

/* Load the live community layer before the legacy browser-only handlers. */
document.write('<link rel="stylesheet" href="live-fixes.css?v=20260831">');
document.write('<script src="live-community.js?v=20260831"><\\/script>');
