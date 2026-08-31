import { json, isAdmin } from "../../../../lib/common.js";

export async function onRequestPost(context) {
  if (!(await isAdmin(context.request, context.env))) return json({ error: "Unauthorized" }, { status: 401 });
  const id = context.params.id;
  await context.env.DB.batch([
    context.env.DB.prepare("UPDATE community_comments SET status='hidden', updated_at=datetime('now') WHERE id=?").bind(id),
    context.env.DB.prepare("INSERT INTO moderation_actions (id, action_type, target_type, target_id, details) VALUES (?, 'hide', 'comment', ?, 'Hidden from admin dashboard')").bind(crypto.randomUUID(), id)
  ]);
  return json({ ok: true });
}
