import { json, adminCookie } from "../../lib/community.js";
export async function onRequestPost(context) {
  const { env, request } = context;
  let body; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, { status: 400 }); }
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: "Admin is not configured." }, { status: 503 });
  if (String(body.password || "") !== env.ADMIN_PASSWORD) return json({ error: "Invalid password." }, { status: 401 });
  return json({ ok: true }, { headers: { "Set-Cookie": await adminCookie(env) } });
}
