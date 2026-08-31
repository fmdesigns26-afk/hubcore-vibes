import { json, clearAdminCookie } from "../../lib/common.js";
export async function onRequestPost() {
  const response = json({ ok: true });
  response.headers.append("Set-Cookie", clearAdminCookie());
  return response;
}
