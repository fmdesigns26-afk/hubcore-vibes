import { json } from "../../lib/community.js";
export async function onRequestPost() {
  return json({ ok: true }, { headers: { "Set-Cookie": "hcv_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict" } });
}
