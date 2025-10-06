-- Launches table for tracking time-limited course launches
CREATE TABLE IF NOT EXISTS launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  revenue_goal DECIMAL(10,2),
  sales_goal INTEGER,
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, active, completed, archived

  -- Sharing settings
  share_enabled BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(255) UNIQUE,
  share_password_hash VARCHAR(255),
  share_expires_at TIMESTAMP,

  -- Cached metrics (for completed launches to improve performance)
  cached_revenue DECIMAL(10,2) DEFAULT 0,
  cached_students INTEGER DEFAULT 0,
  cached_conversion_rate DECIMAL(5,2) DEFAULT 0,
  metrics_updated_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: end_date must be after start_date
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes for performance
CREATE INDEX idx_launches_user_status ON launches(user_id, status);
CREATE INDEX idx_launches_user_dates ON launches(user_id, start_date, end_date);
CREATE INDEX idx_launches_share_token ON launches(share_token) WHERE share_enabled = TRUE;
CREATE INDEX idx_launches_active ON launches(user_id, status, end_date) WHERE status = 'active';
