-- Add exam_date and exam_subject to study_sets
ALTER TABLE study_sets ADD COLUMN IF NOT EXISTS exam_date TIMESTAMP;
ALTER TABLE study_sets ADD COLUMN IF NOT EXISTS exam_subject VARCHAR(255);

-- Add type column to flashcards
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'standard';

-- Create user_xp_events table for gamification
CREATE TABLE IF NOT EXISTS user_xp_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_xp_events_user_id ON user_xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_events_created_at ON user_xp_events(created_at);
