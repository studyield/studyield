-- Study Set Exam Dates table
-- Allows students to set exam dates for study sets so the SRS can optimize review scheduling

CREATE TABLE IF NOT EXISTS study_set_exam_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, study_set_id)
);

CREATE INDEX idx_study_set_exam_dates_user_id ON study_set_exam_dates(user_id);
CREATE INDEX idx_study_set_exam_dates_exam_date ON study_set_exam_dates(exam_date);
