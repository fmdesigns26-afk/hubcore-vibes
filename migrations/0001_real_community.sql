PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS community_comments (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  country TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK(status IN ('visible','hidden','deleted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_visible_created ON community_comments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_visitor_created ON community_comments(visitor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (comment_id, visitor_id),
  FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

CREATE TABLE IF NOT EXISTS comment_shares (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comment_shares_comment ON comment_shares(comment_id);

CREATE TABLE IF NOT EXISTS early_access_requests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  desired_username TEXT,
  country TEXT,
  interests TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(email)
);
CREATE INDEX IF NOT EXISTS idx_early_access_created ON early_access_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS investor_inquiries (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  country TEXT,
  investment_interest TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_investor_created ON investor_inquiries(created_at DESC);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_moderation_created ON moderation_actions(created_at DESC);
