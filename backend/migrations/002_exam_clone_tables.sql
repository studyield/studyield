-- Migration 002: Add missing exam-clone related tables
-- Run this on production to add tables needed for review queue, attempts, bookmarks, and badges

-- Exam Review Queue table (spaced repetition)
CREATE TABLE IF NOT EXISTS exam_review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    repetitions INTEGER DEFAULT 0,
    interval_days INTEGER DEFAULT 1,
    ease_factor DOUBLE PRECISION DEFAULT 2.5,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_review_queue_user_id ON exam_review_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_review_queue_next_review ON exam_review_queue(next_review_at);

-- Exam Attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_clone_id UUID NOT NULL REFERENCES exam_clones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score DOUBLE PRECISION DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_clone_id ON exam_attempts(exam_clone_id);

-- Exam Bookmarks table
CREATE TABLE IF NOT EXISTS exam_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_bookmarks_user_id ON exam_bookmarks(user_id);

-- User Exam Badges table
CREATE TABLE IF NOT EXISTS user_exam_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(255) NOT NULL,
    exam_clone_id UUID REFERENCES exam_clones(id) ON DELETE SET NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_exam_badges_user_id ON user_exam_badges(user_id);

-- Exam Sessions table (collaborative live sessions)
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_clone_id UUID NOT NULL REFERENCES exam_clones(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) DEFAULT 'Practice Session',
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'waiting',
    question_ids JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_code ON exam_sessions(code);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_host_id ON exam_sessions(host_id);

-- Exam Session Participants table
CREATE TABLE IF NOT EXISTS exam_session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(255),
    score DOUBLE PRECISION DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    current_question INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_session_participants_session_id ON exam_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_session_participants_user_id ON exam_session_participants(user_id);
