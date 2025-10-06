-- Launch views table for tracking public recap page views
CREATE TABLE IF NOT EXISTS launch_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
  share_token VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  referrer TEXT,
  user_agent TEXT
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_launch_views_launch_id ON launch_views(launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_views_token ON launch_views(share_token);
CREATE INDEX IF NOT EXISTS idx_launch_views_viewed_at ON launch_views(viewed_at);
