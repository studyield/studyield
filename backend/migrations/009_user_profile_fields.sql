-- Add profile fields for onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
