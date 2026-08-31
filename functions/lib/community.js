export const json = (data, init = {}) => Response.json(data, { ...init, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(init.headers || {}) } });

export function escapeText(value, max = 280) {
  return String(value ?? "").trim().replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max);
}

export function initials(name) {
  return escapeText(name, 60).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "HV";
}

export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  return Object.fromEntries(header.split(";").map(v => v.trim()).filter(Boolean).map(v => {
    const index = v.indexOf("=");
    return index === -1 ? [v, ""] : [v.slice(0, index), decodeURIComponent(v.slice(index + 1))];
  }));
}

export function randomId(prefix = "") {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return prefix + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export async function visitorId(request) {
  return parseCookies(request).hcv_visitor || randomId("v_");
}

export function visitorCookie(id) {
  return `hcv_visitor=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}

export async function verifyTurnstile(request, env, token) {
  const required = String(env.TURNSTILE_REQUIRED || "").toLowerCase() === "true";
  if (!env.TURNSTILE_SECRET_KEY) return !required;
  if (!token) return false;
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body
  }).then(r => r.json()).catch(() => ({ success: false }));
  return Boolean(result.success);
}

export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export async function rateLimit(env, key, limit, windowSeconds) {
  if (!env.DB) return { ok: false, reason: "Database is not configured." };
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT window_started_at, hits FROM rate_limits WHERE rate_key = ?").bind(key).first();
  if (!row || now - Number(row.window_started_at) >= windowSeconds) {
    await env.DB.prepare(`INSERT INTO rate_limits(rate_key, window_started_at, hits) VALUES(?, ?, 1)
      ON CONFLICT(rate_key) DO UPDATE SET window_started_at=excluded.window_started_at, hits=1`).bind(key, now).run();
    return { ok: true, remaining: limit - 1 };
  }
  if (Number(row.hits) >= limit) return { ok: false, reason: "Too many requests. Please try again shortly." };
  await env.DB.prepare("UPDATE rate_limits SET hits = hits + 1 WHERE rate_key = ?").bind(key).run();
  return { ok: true, remaining: limit - Number(row.hits) - 1 };
}

export async function track(env, request, event, fields = {}) {
  try {
    if (env.ANALYTICS && typeof env.ANALYTICS.writeDataPoint === "function") {
      env.ANALYTICS.writeDataPoint({
        blobs: [event, fields.source || "direct", fields.country || request.cf?.country || "XX", fields.device || request.headers.get("Sec-CH-UA-Mobile") || "unknown"],
        doubles: [1],
        indexes: [fields.postId || ""]
      });
    }
  } catch (_) {}
  try {
    if (env.EVENTS_QUEUE && typeof env.EVENTS_QUEUE.send === "function") {
      await env.EVENTS_QUEUE.send({ event, at: Date.now(), ...fields });
    }
  } catch (_) {}
}

export async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function adminSessionValid(request, env) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return false;
  const token = parseCookies(request).hcv_admin;
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const expected = await hmac(expires, env.ADMIN_SESSION_SECRET);
  return signature === expected;
}

export async function adminCookie(env) {
  const expires = Date.now() + 1000 * 60 * 60 * 12;
  const signature = await hmac(String(expires), env.ADMIN_SESSION_SECRET);
  return `hcv_admin=${expires}.${signature}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Strict`;
}
