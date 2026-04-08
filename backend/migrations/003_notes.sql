-- Notes table for AI-generated and manual notes within study sets
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_json JSONB,  -- For rich text editor (stored as JSON)
    summary TEXT,        -- AI-generated summary

    -- Source tracking
    source_type VARCHAR(30) DEFAULT 'manual',  -- manual, ai_generated, pdf, youtube, audio, website, handwriting
    source_url TEXT,
    source_metadata JSONB,  -- Additional source info (video title, page numbers, etc.)

    -- Organization
    tags JSONB DEFAULT '[]',
    is_pinned BOOLEAN DEFAULT FALSE,
    color VARCHAR(20),  -- For visual categorization

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notes_study_set_id ON notes(study_set_id);
CREATE INDEX IF NOT EXISTS idx_notes_source_type ON notes(source_type);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(study_set_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notes_updated_at ON notes;
CREATE TRIGGER trigger_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_updated_at();
