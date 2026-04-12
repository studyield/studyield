-- LTI 1.3 Provider Support
-- Stores registered LMS platforms and LTI launch contexts

-- Registered LMS platforms (Canvas, Moodle, Blackboard, etc.)
CREATE TABLE IF NOT EXISTS lti_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    platform_url TEXT NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    auth_endpoint TEXT NOT NULL,
    token_endpoint TEXT NOT NULL,
    jwks_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_lti_platforms_client_url ON lti_platforms(client_id, platform_url);

-- LTI launch contexts linking LTI users to Studyield users
CREATE TABLE IF NOT EXISTS lti_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,
    lti_user_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(255),
    resource_link_id VARCHAR(255),
    roles JSONB DEFAULT '[]',
    last_launch_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_lti_contexts_user_platform ON lti_contexts(user_id, platform_id);
CREATE INDEX idx_lti_contexts_user_id ON lti_contexts(user_id);
CREATE INDEX idx_lti_contexts_platform_id ON lti_contexts(platform_id);
CREATE INDEX idx_lti_contexts_lti_user_id ON lti_contexts(lti_user_id);
