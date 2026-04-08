-- 007: Problem Solver Enhancements
-- Adds bookmarks, practice quizzes, and alternative methods tables

-- Solution Bookmarks
CREATE TABLE IF NOT EXISTS solution_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES problem_solving_sessions(id) ON DELETE CASCADE,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_solution_bookmarks_user ON solution_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_solution_bookmarks_session ON solution_bookmarks(session_id);

-- Practice Quiz Questions (generated from solved problems)
CREATE TABLE IF NOT EXISTS practice_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES problem_solving_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL DEFAULT 'mcq',
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty VARCHAR(10) DEFAULT 'medium',
  user_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_quiz_session ON practice_quiz_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_quiz_user ON practice_quiz_questions(user_id);

-- Alternative solution methods cache
CREATE TABLE IF NOT EXISTS solution_alternative_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES problem_solving_sessions(id) ON DELETE CASCADE,
  method_name TEXT NOT NULL,
  method_description TEXT,
  solution_steps JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alt_methods_session ON solution_alternative_methods(session_id);

-- Add hint_mode and complexity_level columns to sessions
ALTER TABLE problem_solving_sessions
  ADD COLUMN IF NOT EXISTS hint_steps JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS complexity_level VARCHAR(20) DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS graph_data JSONB;
