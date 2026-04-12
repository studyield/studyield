-- Gamification system tables

-- XP ledger: every XP award is recorded here
CREATE TABLE IF NOT EXISTS xp_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_xp_ledger_user_id ON xp_ledger(user_id);
CREATE INDEX idx_xp_ledger_created_at ON xp_ledger(created_at);
CREATE INDEX idx_xp_ledger_user_action ON xp_ledger(user_id, action);

-- User gamification profile: aggregated stats
CREATE TABLE IF NOT EXISTS user_gamification (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_study_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL DEFAULT 'trophy',
    condition_type VARCHAR(100) NOT NULL,
    condition_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements: which achievements a user has earned
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- Seed achievement definitions
INSERT INTO achievement_definitions (id, name, description, icon, condition_type, condition_value, xp_reward)
VALUES
    (uuid_generate_v4(), 'First Steps', 'Review 10 flashcards', 'star', 'total_reviews', 10, 10),
    (uuid_generate_v4(), 'Card Shark', 'Review 100 flashcards', 'cards', 'total_reviews', 100, 50),
    (uuid_generate_v4(), 'Quiz Master', 'Complete 10 quizzes', 'brain', 'quizzes_completed', 10, 50),
    (uuid_generate_v4(), 'Perfect Score', 'Get 100% on any quiz', 'bullseye', 'perfect_score_count', 1, 25),
    (uuid_generate_v4(), 'Week Warrior', '7-day study streak', 'fire', 'streak', 7, 100),
    (uuid_generate_v4(), 'Month Master', '30-day study streak', 'calendar', 'streak', 30, 500),
    (uuid_generate_v4(), 'Knowledge Builder', 'Upload 5 study materials', 'upload', 'materials_uploaded', 5, 50),
    (uuid_generate_v4(), 'Teacher', 'Complete 5 teach-back sessions', 'chalkboard', 'teach_back_completed', 5, 75),
    (uuid_generate_v4(), 'Exam Ready', 'Complete 10 practice exams', 'clipboard', 'exams_completed', 10, 100),
    (uuid_generate_v4(), 'Scholar', 'Reach Level 10', 'graduation-cap', 'level', 10, 200)
ON CONFLICT DO NOTHING;
