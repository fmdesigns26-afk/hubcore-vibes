const enc = new TextEncoder();
const dec = new TextDecoder();

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function getCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  const item = raw.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

export function visitor(context) {
  let id = getCookie(context.request, "hc_vid");
  let fresh = false;
  if (!id || !/^[a-zA-Z0-9_-]{16,80}$/.test(id)) {
    id = crypto.randomUUID().replaceAll("-", "");
    fresh = true;
  }
  return { id, fresh };
}

export function visitorCookie(id) {
  return "hc_vid=" + encodeURIComponent(id) + "; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax";
}

export function addVisitorCookie(response, state) {
  if (state?.fresh) response.headers.append("Set-Cookie", visitorCookie(state.id));
  return response;
}

export function cleanText(value, max, field = "value") {
  if (typeof value !== "string") throw new Error(field + " is required");
  const out = value.trim().replace(/\s+/g, " ");
  if (!out) throw new Error(field + " is required");
  if (out.length > max) throw new Error(field + " is too long");
  return out;
}

export function optionalText(value, max) {
  if (value == null || value === "") return null;
  return cleanText(String(value), max);
}

export function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim()) && value.trim().length <= 254;
}

export async function body(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Expected JSON");
  return request.json();
}

export async function verifyTurnstile(context, token) {
  if (!context.env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const form = new FormData();
  form.set("secret", context.env.TURNSTILE_SECRET);
  form.set("response", token);
  form.set("remoteip", context.request.headers.get("CF-Connecting-IP") || "");
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form
  });
  const data = await res.json();
  return Boolean(data.success);
}

export async function writeAnalytics(context, event, value = 1) {
  try {
    if (context.env.ANALYTICS) {
      context.env.ANALYTICS.writeDataPoint({
        blobs: [event, new URL(context.request.url).pathname, context.request.headers.get("CF-IPCountry") || "XX"],
        doubles: [value],
        indexes: [context.request.headers.get("CF-Connecting-IP") || "anonymous"]
      });
    }
  } catch (_) {}
}

export async function rateLimit(context, table, visitorId, max, minutes) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const row = await context.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM " + table + " WHERE visitor_id = ? AND created_at >= ?"
  ).bind(visitorId, since).first();
  return Number(row?.count || 0) < max;
}

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

export async function sendEmail(env, { subject, text, replyTo }) {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) return { configured: false };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "HubCore-Vibes/1.0"
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      subject,
      text,
      reply_to: replyTo || undefined
    })
  });
  if (!res.ok) throw new Error("Email delivery failed");
  return { configured: true };
}

function b64(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function unb64(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const str = atob(padded);
  return Uint8Array.from(str, c => c.charCodeAt(0));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}

export async function createAdminSession(env) {
  if (!env.ADMIN_SESSION_SECRET) throw new Error("Admin session secret is not configured");
  const payload = b64(enc.encode(JSON.stringify({ role: "admin", exp: Date.now() + 12 * 60 * 60 * 1000 })));
  const sig = b64(await hmac(env.ADMIN_SESSION_SECRET, payload));
  return payload + "." + sig;
}

export async function isAdmin(request, env) {
  const token = getCookie(request, "hc_admin");
  if (!token || !env.ADMIN_SESSION_SECRET) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await hmac(env.ADMIN_SESSION_SECRET, payload);
  let actual;
  try { actual = unb64(sig); } catch (_) { return false; }
  if (actual.length !== expected.length) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(env.ADMIN_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("HMAC", key, actual, enc.encode(payload));
  if (!ok) return false;
  try {
    const data = JSON.parse(dec.decode(unb64(payload)));
    return data.role === "admin" && Number(data.exp) > Date.now();
  } catch (_) { return false; }
}

export function adminCookie(token) {
  return "hc_admin=" + encodeURIComponent(token) + "; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Strict";
}

export function clearAdminCookie() {
  return "hc_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
}
