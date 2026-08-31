window.HubCoreAPI = {
  async getCommunity() {
    const response = await fetch("/api/community", { cache: "no-store" });
    if (!response.ok) throw new Error("Community unavailable");
    return response.json();
  },
  async getCommunityStats() {
    const response = await fetch("/api/community/stats", { cache: "no-store" });
    if (!response.ok) throw new Error("Stats unavailable");
    return response.json();
  },
  async createCommunityPost(payload) {
    const response = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to publish your comment");
    return data;
  },
  async like(postId, liked) {
    const response = await fetch("/api/posts/" + encodeURIComponent(postId) + "/like", { method: liked ? "POST" : "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to update like");
    return data;
  },
  async share(postId, channel) {
    const response = await fetch("/api/posts/" + encodeURIComponent(postId) + "/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to record share");
    return data;
  },
  async contact(payload) {
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to send your request");
    return data;
  }
};