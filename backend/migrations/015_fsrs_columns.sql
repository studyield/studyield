-- Migration 015: Add FSRS (Free Spaced Repetition Scheduler) columns to flashcards
--
-- FSRS replaces the legacy SM-2 algorithm. SM-2 (1987) uses fixed
-- interval multipliers; FSRS uses machine-learning-derived parameters
-- that reduce total reviews by 20-40% at the same retention rate.
--
-- New columns:
--   stability   - FSRS memory stability estimate (days until 90% recall)
--   difficulty  - FSRS item difficulty (0-10 scale)
--   fsrs_state  - FSRS card state: 0=New, 1=Learning, 2=Review, 3=Relearning
--   lapses      - number of times the card was forgotten (Again pressed in Review state)
--
-- The existing SM-2 columns (interval, repetitions, ease_factor) are kept
-- for backward compatibility. The FSRS review path writes to both sets
-- of columns, so existing analytics queries and mastery calculations
-- continue to work.

ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS stability DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS difficulty DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS fsrs_state INTEGER NOT NULL DEFAULT 0;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0;
