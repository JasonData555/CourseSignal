-- Add launch_id column to purchases table for explicit launch association
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS launch_id UUID REFERENCES launches(id) ON DELETE SET NULL;

-- Create indexes for fast filtering and analytics queries
CREATE INDEX IF NOT EXISTS idx_purchases_launch_id ON purchases(launch_id);
CREATE INDEX IF NOT EXISTS idx_purchases_launch_source ON purchases(launch_id, first_touch_source) WHERE launch_id IS NOT NULL;
