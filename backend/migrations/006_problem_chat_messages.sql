-- Problem chat messages for Study Buddy feature
CREATE TABLE IF NOT EXISTS problem_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES problem_solving_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'tutor')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problem_chat_messages_session ON problem_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_problem_chat_messages_created ON problem_chat_messages(session_id, created_at);
