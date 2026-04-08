-- Live Quiz Sessions table
CREATE TABLE IF NOT EXISTS live_quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) NOT NULL,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live Quiz Participants table
CREATE TABLE IF NOT EXISTS live_quiz_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_answers INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Live Quiz Answers table (optional - for detailed history)
CREATE TABLE IF NOT EXISTS live_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_quiz_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES live_quiz_participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_quiz_sessions_host ON live_quiz_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_sessions_study_set ON live_quiz_sessions(study_set_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_participants_session ON live_quiz_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_participants_user ON live_quiz_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_answers_session ON live_quiz_answers(session_id);
