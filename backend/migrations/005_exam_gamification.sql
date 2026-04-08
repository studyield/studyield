-- Exam Gamification Features Migration
-- Adds: bookmarks, badges, leaderboard support

-- Question Bookmarks (for flagging difficult questions)
CREATE TABLE IF NOT EXISTS exam_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
    note TEXT, -- Optional personal note
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_bookmarks_user ON exam_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_bookmarks_question ON exam_bookmarks(question_id);

-- User Badges/Achievements
CREATE TABLE IF NOT EXISTS exam_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL, -- Icon name (lucide icon)
    color VARCHAR(20) NOT NULL, -- Tailwind color class
    category VARCHAR(30), -- accuracy, consistency, speed, milestone
    requirement_type VARCHAR(30) NOT NULL, -- score, count, streak, time
    requirement_value INTEGER NOT NULL, -- The threshold to earn this badge
    xp_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User earned badges
CREATE TABLE IF NOT EXISTS user_exam_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES exam_badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exam_clone_id UUID REFERENCES exam_clones(id) ON DELETE SET NULL, -- Which exam triggered it
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_exam_badges_user ON user_exam_badges(user_id);

-- Insert default badges
INSERT INTO exam_badges (id, slug, name, description, icon, color, category, requirement_type, requirement_value, xp_reward)
SELECT * FROM (VALUES
-- Milestone badges
(uuid_generate_v4(), 'first_exam', 'First Steps', 'Complete your first practice exam', 'Trophy', 'amber', 'milestone', 'count', 1, 50),
(uuid_generate_v4(), 'ten_exams', 'Getting Serious', 'Complete 10 practice exams', 'Award', 'blue', 'milestone', 'count', 10, 100),
(uuid_generate_v4(), 'fifty_exams', 'Exam Warrior', 'Complete 50 practice exams', 'Medal', 'purple', 'milestone', 'count', 50, 250),
(uuid_generate_v4(), 'hundred_exams', 'Exam Master', 'Complete 100 practice exams', 'Crown', 'yellow', 'milestone', 'count', 100, 500),

-- Accuracy badges
(uuid_generate_v4(), 'perfect_score', 'Perfectionist', 'Score 100% on any exam', 'Star', 'yellow', 'accuracy', 'score', 100, 100),
(uuid_generate_v4(), 'high_scorer', 'High Achiever', 'Score 90%+ on 5 exams', 'TrendingUp', 'green', 'accuracy', 'score', 90, 150),
(uuid_generate_v4(), 'consistent', 'Consistent Performer', 'Score 80%+ on 10 consecutive exams', 'Target', 'blue', 'accuracy', 'score', 80, 200),

-- Streak badges
(uuid_generate_v4(), 'three_day_streak', 'Getting Started', 'Practice 3 days in a row', 'Flame', 'orange', 'consistency', 'streak', 3, 30),
(uuid_generate_v4(), 'seven_day_streak', 'Week Warrior', 'Practice 7 days in a row', 'Flame', 'orange', 'consistency', 'streak', 7, 75),
(uuid_generate_v4(), 'thirty_day_streak', 'Monthly Master', 'Practice 30 days in a row', 'Flame', 'red', 'consistency', 'streak', 30, 300),

-- Speed badges
(uuid_generate_v4(), 'speed_demon', 'Speed Demon', 'Complete an exam in under 5 minutes with 80%+ score', 'Zap', 'yellow', 'speed', 'time', 300, 100),
(uuid_generate_v4(), 'quick_learner', 'Quick Learner', 'Answer 10 questions correctly in under 1 minute each', 'Clock', 'cyan', 'speed', 'time', 60, 75),

-- Review badges
(uuid_generate_v4(), 'review_starter', 'Review Rookie', 'Complete 10 review sessions', 'Brain', 'purple', 'milestone', 'count', 10, 50),
(uuid_generate_v4(), 'review_master', 'Memory Master', 'Complete 100 review sessions', 'Brain', 'indigo', 'milestone', 'count', 100, 200),

-- Question count badges
(uuid_generate_v4(), 'hundred_questions', 'Century', 'Answer 100 questions correctly', 'CheckCircle', 'green', 'milestone', 'count', 100, 100),
(uuid_generate_v4(), 'thousand_questions', 'Question Crusher', 'Answer 1000 questions correctly', 'Rocket', 'purple', 'milestone', 'count', 1000, 500)
) AS v(id, slug, name, description, icon, color, category, requirement_type, requirement_value, xp_reward)
WHERE NOT EXISTS (SELECT 1 FROM exam_badges WHERE exam_badges.slug = v.slug);

-- Leaderboard view (for easy querying)
CREATE OR REPLACE VIEW exam_leaderboard AS
SELECT
    u.id as user_id,
    u.name,
    u.avatar_url,
    COUNT(DISTINCT ea.id) as total_exams,
    COALESCE(AVG(ea.score), 0)::INTEGER as avg_score,
    COALESCE(SUM(ea.correct_count), 0)::INTEGER as total_correct,
    COALESCE(MAX(ea.score), 0) as best_score,
    COUNT(DISTINCT DATE(ea.created_at)) as active_days,
    MAX(ea.created_at) as last_active
FROM users u
LEFT JOIN exam_attempts ea ON u.id = ea.user_id
GROUP BY u.id, u.name, u.avatar_url
HAVING COUNT(ea.id) > 0
ORDER BY avg_score DESC, total_correct DESC;

-- Weekly leaderboard function
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    name VARCHAR,
    avatar_url TEXT,
    total_exams BIGINT,
    avg_score INTEGER,
    total_correct BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id as user_id,
        u.name,
        u.avatar_url,
        COUNT(DISTINCT ea.id) as total_exams,
        COALESCE(AVG(ea.score), 0)::INTEGER as avg_score,
        COALESCE(SUM(ea.correct_count), 0)::BIGINT as total_correct,
        ROW_NUMBER() OVER (ORDER BY AVG(ea.score) DESC, SUM(ea.correct_count) DESC) as rank
    FROM users u
    INNER JOIN exam_attempts ea ON u.id = ea.user_id
    WHERE ea.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY u.id, u.name, u.avatar_url
    ORDER BY avg_score DESC, total_correct DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
