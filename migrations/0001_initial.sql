PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT,
  avatar_key TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  author_name TEXT NOT NULL,
  author_country TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  author_name TEXT,
  body TEXT NOT NULL,
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  visitor_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (user_id IS NOT NULL OR visitor_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_visitor ON likes(post_id, visitor_id) WHERE visitor_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id) WHERE user_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  channel TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reporter_visitor_id TEXT,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS moderation_actions (
  id TEXT PRIMARY KEY,
  moderator_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('early_access','investor')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visitor ON posts(visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_shares_post_created ON shares(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_type_created ON contact_submissions(type, created_at DESC);
