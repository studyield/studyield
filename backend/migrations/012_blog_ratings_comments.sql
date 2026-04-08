-- Blog Ratings table
CREATE TABLE IF NOT EXISTS blog_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blog_post_id, user_id)
);

-- Blog Comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_ratings_post ON blog_ratings(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_ratings_user ON blog_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created ON blog_comments(blog_post_id, created_at DESC);

-- Update triggers
CREATE OR REPLACE FUNCTION update_blog_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_blog_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_ratings_updated_at ON blog_ratings;
CREATE TRIGGER trg_blog_ratings_updated_at
  BEFORE UPDATE ON blog_ratings
  FOR EACH ROW EXECUTE FUNCTION update_blog_ratings_updated_at();

DROP TRIGGER IF EXISTS trg_blog_comments_updated_at ON blog_comments;
CREATE TRIGGER trg_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_blog_comments_updated_at();

-- Seed sample ratings and comments using first user and first few posts
DO $$
DECLARE
  v_user_id UUID;
  v_post1 UUID;
  v_post2 UUID;
  v_post3 UUID;
BEGIN
  SELECT id INTO v_user_id FROM users LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_post1 FROM blog_posts WHERE is_published = true ORDER BY published_at DESC LIMIT 1;
  SELECT id INTO v_post2 FROM blog_posts WHERE is_published = true ORDER BY published_at DESC LIMIT 1 OFFSET 1;
  SELECT id INTO v_post3 FROM blog_posts WHERE is_published = true ORDER BY published_at DESC LIMIT 1 OFFSET 2;

  IF v_post1 IS NOT NULL THEN
    INSERT INTO blog_ratings (blog_post_id, user_id, rating) VALUES (v_post1, v_user_id, 5) ON CONFLICT DO NOTHING;
    INSERT INTO blog_comments (blog_post_id, user_id, content) VALUES (v_post1, v_user_id, 'Great article! Really helped me understand the concepts better.') ON CONFLICT DO NOTHING;
  END IF;

  IF v_post2 IS NOT NULL THEN
    INSERT INTO blog_ratings (blog_post_id, user_id, rating) VALUES (v_post2, v_user_id, 4) ON CONFLICT DO NOTHING;
    INSERT INTO blog_comments (blog_post_id, user_id, content) VALUES (v_post2, v_user_id, 'Very informative. Would love to see more content like this!') ON CONFLICT DO NOTHING;
  END IF;

  IF v_post3 IS NOT NULL THEN
    INSERT INTO blog_ratings (blog_post_id, user_id, rating) VALUES (v_post3, v_user_id, 5) ON CONFLICT DO NOTHING;
  END IF;
END $$;
