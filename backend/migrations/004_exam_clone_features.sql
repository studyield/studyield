-- Exam Clone Advanced Features Migration
-- Adds: exam_attempts (analytics), exam_review_queue (spaced repetition), exam_templates

-- Exam Attempts table (for performance analytics)
CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_clone_id UUID NOT NULL REFERENCES exam_clones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    unanswered_count INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    time_spent INTEGER NOT NULL, -- seconds
    answers JSONB NOT NULL, -- Array of {questionId, answer, timeSpent}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam ON exam_attempts(exam_clone_id);
CREATE INDEX idx_exam_attempts_created ON exam_attempts(created_at DESC);

-- Spaced Repetition Review Queue
CREATE TABLE IF NOT EXISTS exam_review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    repetitions INTEGER NOT NULL DEFAULT 0,
    interval_days INTEGER NOT NULL DEFAULT 1,
    ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    next_review_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_review_queue_user ON exam_review_queue(user_id);
CREATE INDEX idx_review_queue_due ON exam_review_queue(next_review_at);

-- Exam Templates table
CREATE TABLE IF NOT EXISTS exam_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50), -- standardized_test, academic, professional
    question_types JSONB NOT NULL, -- ["multiple_choice", "essay", etc.]
    difficulty_distribution JSONB NOT NULL, -- {easy: 30, medium: 50, hard: 20}
    time_per_question INTEGER, -- seconds
    total_questions INTEGER,
    format_patterns JSONB, -- Style patterns for generation
    subjects JSONB, -- Available subjects for this template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO exam_templates (id, name, slug, description, category, question_types, difficulty_distribution, time_per_question, total_questions, format_patterns, subjects) VALUES
(uuid_generate_v4(), 'SAT', 'sat', 'SAT standardized test format', 'standardized_test',
 '["multiple_choice", "grid_in"]'::jsonb,
 '{"easy": 25, "medium": 50, "hard": 25}'::jsonb,
 75, 154,
 '["Passage-based questions", "Data analysis", "Problem solving"]'::jsonb,
 '["Math", "Reading", "Writing"]'::jsonb),

(uuid_generate_v4(), 'GRE', 'gre', 'GRE Graduate Record Examination format', 'standardized_test',
 '["multiple_choice", "numeric_entry", "text_completion"]'::jsonb,
 '{"easy": 20, "medium": 50, "hard": 30}'::jsonb,
 90, 80,
 '["Analytical writing", "Quantitative reasoning", "Verbal reasoning"]'::jsonb,
 '["Verbal", "Quantitative", "Analytical Writing"]'::jsonb),

(uuid_generate_v4(), 'IELTS', 'ielts', 'IELTS English proficiency test format', 'standardized_test',
 '["multiple_choice", "matching", "fill_blank", "short_answer", "essay"]'::jsonb,
 '{"easy": 30, "medium": 50, "hard": 20}'::jsonb,
 60, 40,
 '["Listening comprehension", "Reading passages", "Writing tasks"]'::jsonb,
 '["Listening", "Reading", "Writing", "Speaking"]'::jsonb),

(uuid_generate_v4(), 'TOEFL', 'toefl', 'TOEFL English proficiency test format', 'standardized_test',
 '["multiple_choice", "integrated_writing", "independent_writing"]'::jsonb,
 '{"easy": 25, "medium": 55, "hard": 20}'::jsonb,
 90, 60,
 '["Academic reading", "Campus conversations", "Integrated tasks"]'::jsonb,
 '["Reading", "Listening", "Speaking", "Writing"]'::jsonb),

(uuid_generate_v4(), 'AP Exam', 'ap', 'Advanced Placement exam format', 'academic',
 '["multiple_choice", "free_response", "document_based"]'::jsonb,
 '{"easy": 20, "medium": 50, "hard": 30}'::jsonb,
 120, 55,
 '["Stimulus-based MCQ", "Short answer", "Long essay"]'::jsonb,
 '["Biology", "Chemistry", "Physics", "History", "English", "Math", "Computer Science"]'::jsonb),

(uuid_generate_v4(), 'University Midterm', 'midterm', 'Standard university midterm format', 'academic',
 '["multiple_choice", "short_answer", "essay"]'::jsonb,
 '{"easy": 30, "medium": 50, "hard": 20}'::jsonb,
 90, 30,
 '["Conceptual questions", "Problem solving", "Application"]'::jsonb,
 '["General"]'::jsonb),

(uuid_generate_v4(), 'SSC', 'ssc', 'Secondary School Certificate exam format', 'academic',
 '["multiple_choice", "short_answer", "essay"]'::jsonb,
 '{"easy": 40, "medium": 45, "hard": 15}'::jsonb,
 120, 50,
 '["Objective questions", "Descriptive answers", "Comprehension"]'::jsonb,
 '["Bangla", "English", "Math", "Science", "Social Science"]'::jsonb),

(uuid_generate_v4(), 'HSC', 'hsc', 'Higher Secondary Certificate exam format', 'academic',
 '["multiple_choice", "short_answer", "essay", "problem_solving"]'::jsonb,
 '{"easy": 30, "medium": 50, "hard": 20}'::jsonb,
 180, 60,
 '["MCQ section", "Written section", "Practical application"]'::jsonb,
 '["Bangla", "English", "Physics", "Chemistry", "Biology", "Math", "Accounting", "Economics"]'::jsonb);

-- Collaborative Exam Sessions (for live group practice)
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_clone_id UUID NOT NULL REFERENCES exam_clones(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL UNIQUE, -- Join code
    name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, completed
    settings JSONB NOT NULL DEFAULT '{}', -- {questionCount, timeLimit, showLeaderboard}
    question_ids JSONB, -- Selected question IDs for this session
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exam_sessions_code ON exam_sessions(code);
CREATE INDEX idx_exam_sessions_host ON exam_sessions(host_id);

-- Session Participants
CREATE TABLE IF NOT EXISTS exam_session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(50),
    score INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    current_question INTEGER DEFAULT 0,
    answers JSONB DEFAULT '[]',
    finished_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_session_participants_session ON exam_session_participants(session_id);
CREATE INDEX idx_session_participants_user ON exam_session_participants(user_id);
