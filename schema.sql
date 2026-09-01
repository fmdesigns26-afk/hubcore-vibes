CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  avatar TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  text TEXT NOT NULL,
  reactions_json TEXT NOT NULL DEFAULT '{"like":0,"hub":0,"fire":0,"inspire":0}',
  is_founder INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS community_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  reply_to TEXT,
  is_founder INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_shares (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  channel TEXT,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'XX',
  path TEXT NOT NULL DEFAULT '/',
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_posts_timestamp ON community_posts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_community_shares_post_id ON community_shares(post_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON analytics_events(event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_country_time ON analytics_events(country, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_time ON analytics_events(visitor_id, timestamp DESC);
