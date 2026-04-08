-- Migration: Create user_fcm_tokens table for push notifications
-- Created: 2026-02-19

CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL, -- 'android', 'ios', 'web'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_fcm_token ON user_fcm_tokens(fcm_token);

-- Add comment
COMMENT ON TABLE user_fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications';
