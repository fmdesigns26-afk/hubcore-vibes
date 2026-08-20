/* Client boundary for future Firebase, Supabase, D1, Workers, or WebSocket data. */
window.HubCoreAPI = {
  async getPlatformSnapshot() {
    const response = await fetch('/api/platform', { cache: 'no-store' });
    if (!response.ok) throw new Error('Platform API unavailable');
    return response.json();
  },
  async createPost(post) {
    return { ...post, synced: false };
  },
  async toggleReaction(postId, reaction) {
    return { postId, reaction, synced: false };
  },
  async subscribeToActivity() {
    return () => {};
  }
};