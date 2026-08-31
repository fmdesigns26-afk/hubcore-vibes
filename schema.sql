CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  avatar TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  text TEXT NOT NULL,
  reactions_json TEXT NOT NULL DEFAULT '{"like":0,"hub":0,"fire":0,"inspire":0}'
);

CREATE TABLE IF NOT EXISTS community_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  reply_to TEXT,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_posts_timestamp ON community_posts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id, timestamp ASC);
