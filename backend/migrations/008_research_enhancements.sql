-- Add depth and settings columns to research_sessions
ALTER TABLE research_sessions ADD COLUMN IF NOT EXISTS depth VARCHAR(20) DEFAULT 'standard';
ALTER TABLE research_sessions ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
