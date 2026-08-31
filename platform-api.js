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
    const response = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_post', post })
    });
    if (!response.ok) throw new Error('Unable to sync post');
    return response.json();
  },

  async createComment(postId, comment) {
    const response = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_comment',
        comment: { ...comment, postId }
      })
    });
    if (!response.ok) throw new Error('Unable to sync comment');
    return response.json();
  },

  async toggleReaction(postId, reaction) {
    return { postId, reaction, synced: false };
  },

  async subscribeToActivity() {
    return () => {};
  }
};
