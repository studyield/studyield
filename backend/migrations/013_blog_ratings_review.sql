-- Add review text column to blog_ratings
ALTER TABLE blog_ratings ADD COLUMN IF NOT EXISTS review TEXT;
