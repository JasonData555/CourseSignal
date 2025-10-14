-- Add AI recommendations preference to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_recommendations_enabled BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN users.ai_recommendations_enabled IS 'Whether user has enabled AI-powered recommendations (default: true)';
