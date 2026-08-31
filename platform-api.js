window.HubCoreAPI = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  },
  community() {
    return this.request("/api/community");
  },
  addComment(payload) {
    return this.request("/api/community", { method: "POST", body: JSON.stringify(payload) });
  },
  toggleLike(id) {
    return this.request("/api/community/" + encodeURIComponent(id) + "/like", { method: "POST", body: "{}" });
  },
  share(id) {
    return this.request("/api/community/" + encodeURIComponent(id) + "/share", { method: "POST", body: "{}" });
  },
  earlyAccess(payload) {
    return this.request("/api/early-access", { method: "POST", body: JSON.stringify(payload) });
  },
  investorContact(payload) {
    return this.request("/api/investor-contact", { method: "POST", body: JSON.stringify(payload) });
  },
  report(payload) {
    return this.request("/api/report", { method: "POST", body: JSON.stringify(payload) });
  }
};