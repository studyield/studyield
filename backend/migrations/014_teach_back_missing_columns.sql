-- Add missing columns to teach_back_sessions table
ALTER TABLE teach_back_sessions ADD COLUMN IF NOT EXISTS study_set_id UUID REFERENCES study_sets(id) ON DELETE SET NULL;
ALTER TABLE teach_back_sessions ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'classmate';
ALTER TABLE teach_back_sessions ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0;
ALTER TABLE teach_back_sessions ADD COLUMN IF NOT EXISTS challenge_messages JSONB DEFAULT '[]';
