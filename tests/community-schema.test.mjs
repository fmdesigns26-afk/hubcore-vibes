import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("community migration contains the real shared-community tables", async () => {
  const sql = await readFile(new URL("../migrations/0001_real_community.sql", import.meta.url), "utf8");
  for (const table of ["community_comments", "comment_likes", "comment_shares", "early_access_requests", "investor_inquiries", "reports", "moderation_actions"]) {
    assert.match(sql, new RegExp("CREATE TABLE IF NOT EXISTS " + table));
  }
  assert.match(sql, /PRIMARY KEY \(comment_id, visitor_id\)/);
});

test("frontend no longer persists demo comments in localStorage", async () => {
  const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
  assert.doesNotMatch(script, /hubcore-community-posts-v1/);
  assert.doesNotMatch(script, /localStorage/);
  assert.match(script, /\/api\/community/);
});
