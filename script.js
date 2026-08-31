const nav = document.querySelector(".nav");
const menu = document.querySelector(".menu");
menu?.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add("visible");
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const relativeTime = value => {
  const stamp = new Date(String(value).replace(" ", "T") + (String(value).includes("Z") ? "" : "Z")).getTime();
  const mins = Math.floor(Math.max(0, Date.now() - stamp) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
};

function removeDemoSections() {
  document.getElementById("community-metrics")?.remove();
  document.querySelector(".creators")?.remove();

  const platform = document.getElementById("platform");
  if (platform) platform.innerHTML =
    '<div class="section-heading"><div class="eyebrow">EARLY COMMUNITY ACCESS</div><h2>The conversation is <span>real.</span></h2><p class="lead">This is the first live layer of HubCore Vibes. People can share their thoughts, read the community, like comments and share the conversation. No public profile is required yet.</p></div><div class="live-community-status glass-panel" id="liveCommunityStatus"><strong>Loading the community…</strong></div>';

  const trailer = document.querySelector(".trailer-section");
  if (trailer) trailer.outerHTML =
    '<div class="trailer-coming glass-panel"><div class="eyebrow">REALITY SWITCH</div><h3>TRAILER COMING SOON</h3><p>The reveal is being prepared.</p></div>';
}

function buildCommunity() {
  const section = document.getElementById("community");
  if (!section) return;
  section.innerHTML =
    '<div class="section-heading"><div class="eyebrow">LIVE COMMUNITY</div><h2>What do you think?<br><span>Join the conversation.</span></h2><p class="lead">Tell the HubCore Vibes community what you think. Your comment can be seen by other visitors around the world.</p></div>' +
    '<div class="community-shell glass-panel">' +
    '<form id="communityForm" class="composer" aria-label="Share your thoughts">' +
    '<div class="community-fields"><input id="commentName" maxlength="40" placeholder="Your name" required><input id="commentCountry" maxlength="80" placeholder="Country (optional)"></div>' +
    '<textarea id="composerInput" rows="4" maxlength="500" placeholder="What do you think about HubCore Vibes?" required></textarea>' +
    '<div class="composer-actions"><span class="countdown" id="composerCount">500</span><button class="btn primary" type="submit">Share your thoughts</button></div>' +
    '<p class="form-message" id="communityMessage" aria-live="polite"></p></form>' +
    '<div class="community-main"><div class="feed-heading"><h3>Community thoughts</h3><span id="commentTotal">Live</span></div><div id="communityFeed" class="community-feed" aria-live="polite"></div></div></div>';
}

function buildContact() {
  const section = document.getElementById("contact");
  if (!section) return;
  section.innerHTML =
    '<div class="eyebrow">JOIN THE JOURNEY</div><h2>Be part of what comes next.</h2><p>Request early access for the future HubCore Vibes platform, or contact HubCore Vibes about a potential investment opportunity. Your email address is collected privately and is never displayed publicly on this website.</p>' +
    '<div class="contact-grid">' +
    '<form id="earlyAccessForm" class="contact-form glass-panel"><h3>Request Early Access</h3><p>Reserve your place and tell us the username you may want when the full platform launches.</p><input name="fullName" maxlength="80" placeholder="Full name" required><input name="email" type="email" maxlength="254" placeholder="Email address" required><input name="desiredUsername" maxlength="40" placeholder="Desired future username (optional)"><input name="country" maxlength="80" placeholder="Country (optional)"><textarea name="interests" rows="3" maxlength="500" placeholder="What are you most excited about? Videos, movies, mobility, music, community..."></textarea><textarea name="message" rows="3" maxlength="800" placeholder="Anything else you would like us to know?"></textarea><button class="btn primary" type="submit">Request Early Access</button><p class="form-message" aria-live="polite"></p></form>' +
    '<form id="investorForm" class="contact-form glass-panel"><h3>Investor Enquiry</h3><p>Interested in the HubCore Vibes vision? Send a private enquiry directly to the HubCore Vibes team.</p><input name="fullName" maxlength="100" placeholder="Full name" required><input name="email" type="email" maxlength="254" placeholder="Email address" required><input name="company" maxlength="120" placeholder="Company or organisation (optional)"><input name="country" maxlength="80" placeholder="Country (optional)"><input name="investmentInterest" maxlength="120" placeholder="Area of interest (optional)"><textarea name="message" rows="5" maxlength="3000" placeholder="Tell us how you would like to connect or invest." required></textarea><button class="btn ghost" type="submit">Contact About Investment</button><p class="form-message" aria-live="polite"></p></form>' +
    '</div>';
}

removeDemoSections();
buildCommunity();
buildContact();

let comments = [];
let loading = false;

function renderComments() {
  const feed = document.getElementById("communityFeed");
  const total = document.getElementById("commentTotal");
  if (!feed) return;
  if (total) total.textContent = comments.length ? comments.length + " visible" : "Be the first";
  if (!comments.length) {
    feed.innerHTML = '<div class="empty-state">No community thoughts yet. Be the first person to share what you think about HubCore Vibes.</div>';
    return;
  }
  feed.innerHTML = comments.map(comment => {
    const id = escapeHTML(comment.id);
    const name = escapeHTML(comment.display_name);
    const country = comment.country ? escapeHTML(comment.country) + " · " : "";
    const initials = escapeHTML((comment.display_name || "?").slice(0, 2).toUpperCase());
    return '<article class="post-card glass-panel" id="community-comment-' + id + '">' +
      '<div class="post-head"><div class="avatar">' + initials + '</div><div class="post-author"><strong>' + name + '</strong><span>' + country + relativeTime(comment.created_at) + '</span></div></div>' +
      '<p class="post-text">' + escapeHTML(comment.body) + '</p>' +
      '<div class="reaction-row"><button class="reaction-btn ' + (Number(comment.liked_by_me) ? "active" : "") + '" data-like="' + id + '" type="button">❤️ <span>' + Number(comment.likes || 0) + '</span></button>' +
      '<button class="post-action" data-share="' + id + '" type="button">↗ Share <span>' + Number(comment.shares || 0) + '</span></button>' +
      '<button class="mini-btn" data-report="' + id + '" type="button">Report</button></div></article>';
  }).join("");
}

async function loadComments(options = {}) {
  if (loading) return;
  loading = true;
  try {
    const data = await window.HubCoreAPI.community();
    comments = data.comments || [];
    renderComments();
    const status = document.getElementById("liveCommunityStatus");
    if (status) status.innerHTML = '<strong>' + Number(data.total || 0) + '</strong><span> public community comments are currently live.</span>';
  } catch (error) {
    if (!options.silent) {
      const feed = document.getElementById("communityFeed");
      if (feed) feed.innerHTML = '<div class="empty-state">The live community is temporarily unavailable. Please try again shortly.</div>';
    }
  } finally { loading = false; }
}

document.getElementById("composerInput")?.addEventListener("input", event => {
  document.getElementById("composerCount").textContent = String(500 - event.target.value.length);
});

document.getElementById("communityForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.getElementById("communityMessage");
  const submit = event.currentTarget.querySelector("button[type=submit]");
  submit.disabled = true;
  message.textContent = "Posting your thought…";
  try {
    await window.HubCoreAPI.addComment({
      displayName: document.getElementById("commentName").value,
      country: document.getElementById("commentCountry").value,
      text: document.getElementById("composerInput").value
    });
    event.currentTarget.reset();
    document.getElementById("composerCount").textContent = "500";
    message.textContent = "Your thought is now live for the community to see.";
    await loadComments();
  } catch (error) {
    message.textContent = error.message;
  } finally { submit.disabled = false; }
});

document.addEventListener("click", async event => {
  const like = event.target.closest("[data-like]");
  if (like) {
    try { await window.HubCoreAPI.toggleLike(like.dataset.like); await loadComments({ silent: true }); } catch (_) {}
    return;
  }
  const share = event.target.closest("[data-share]");
  if (share) {
    const comment = comments.find(item => item.id === share.dataset.share);
    const url = new URL(window.location.href);
    url.hash = "community-comment-" + share.dataset.share;
    try {
      if (navigator.share) await navigator.share({ title: "HubCore Vibes", text: comment?.body || "HubCore Vibes", url: url.toString() });
      else await navigator.clipboard.writeText(url.toString());
      await window.HubCoreAPI.share(share.dataset.share);
      await loadComments({ silent: true });
    } catch (_) {}
    return;
  }
  const report = event.target.closest("[data-report]");
  if (report) {
    const reason = window.prompt("Briefly tell us why you are reporting this comment.");
    if (!reason) return;
    try {
      await window.HubCoreAPI.report({ targetType: "comment", targetId: report.dataset.report, reason });
      window.alert("Thank you. Your report has been sent privately for review.");
    } catch (_) {}
  }
});

async function submitContact(form, method) {
  const message = form.querySelector(".form-message");
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  message.textContent = "Sending privately…";
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const result = await method.call(window.HubCoreAPI, payload);
    form.reset();
    message.textContent = result.message || "Thank you. Your request has been received.";
  } catch (error) {
    message.textContent = error.message;
  } finally { button.disabled = false; }
}

document.getElementById("earlyAccessForm")?.addEventListener("submit", event => { event.preventDefault(); submitContact(event.currentTarget, window.HubCoreAPI.earlyAccess); });
document.getElementById("investorForm")?.addEventListener("submit", event => { event.preventDefault(); submitContact(event.currentTarget, window.HubCoreAPI.investorContact); });

const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const sections = [...document.querySelectorAll("main section[id]")];
const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const id = entry.target.getAttribute("id");
  navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + id));
}), { rootMargin: "-35% 0px -55% 0px", threshold: 0.1 });
sections.forEach(section => navObserver.observe(section));

loadComments();
setInterval(() => loadComments({ silent: true }), 15000);
