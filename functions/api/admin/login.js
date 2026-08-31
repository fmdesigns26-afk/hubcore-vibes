import { json, body, createAdminSession, adminCookie } from "../../lib/common.js";

export async function onRequestPost(context) {
  try {
    if (!context.env.ADMIN_PASSWORD || !context.env.ADMIN_SESSION_SECRET) return json({ error: "Admin login is not configured" }, { status: 503 });
    const data = await body(context.request);
    if (typeof data.password !== "string" || data.password !== context.env.ADMIN_PASSWORD) return json({ error: "Invalid password" }, { status: 401 });
    const token = await createAdminSession(context.env);
    const response = json({ ok: true });
    response.headers.append("Set-Cookie", adminCookie(token));
    return response;
  } catch (error) {
    return json({ error: "Unable to sign in" }, { status: 400 });
  }
}
