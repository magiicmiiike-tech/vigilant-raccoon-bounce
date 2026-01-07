-- migrations/telephony/003_initial_telephony_schema.sql
-- UP Migration
BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Create enum types
CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE call_status AS ENUM ('ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer');
CREATE TYPE recording_format AS ENUM ('wav', 'mp3', 'ogg');
CREATE TYPE transcription_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE phone_number_status AS ENUM ('available', 'assigned', 'porting', 'released');

-- Create calls table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    user_id UUID, -- Soft reference to auth.users.id
    call_sid VARCHAR(100) UNIQUE NOT NULL,
    direction call_direction NOT NULL,
    status call_status NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    answer_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    sip_trunk_id VARCHAR(100), -- Soft reference to sip_trunks.id
    metadata JSONB DEFAULT '{}',
    cost NUMERIC(10,2),
    currency VARCHAR(3),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE UNIQUE INDEX idx_calls_call_sid 
    ON calls(call_sid) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_calls_tenant_start_time 
    ON calls(tenant_id, start_time) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_calls_phone_number_direction 
    ON calls(from_number, direction) 
    WHERE deleted_at IS NULL;

-- Create call_recordings table
CREATE TABLE call_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    call_id UUID NOT NULL,
    storage_url VARCHAR(255) NOT NULL,
    encryption_key_id VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    format recording_format NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_encrypted BOOLEAN DEFAULT FALSE,
    transcription_status transcription_status,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_call_recordings_call FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_call_recordings_call_id_start_time 
    ON call_recordings(call_id, start_time) 
    WHERE deleted_at IS NULL;

-- Create call_transcripts table
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    call_id UUID NOT NULL,
    content TEXT NOT NULL,
    speaker_diarization JSONB DEFAULT '[]',
    language VARCHAR(10),
    embedding VECTOR(1536), -- Assuming OpenAI embeddings
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_call_transcripts_call FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_call_transcripts_call_id 
    ON call_transcripts(call_id) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_call_transcripts_embedding ON call_transcripts USING ivfflat (embedding vector_l2_ops) WITH (lists = 100) WHERE deleted_at IS NULL;


-- Create phone_numbers table
CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    number VARCHAR(20) NOT NULL,
    status phone_number_status DEFAULT 'available',
    country_code VARCHAR(10),
    capabilities JSONB DEFAULT '{}',
    assigned_to_user_id UUID, -- Soft reference to auth.users.id
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    UNIQUE (tenant_id, number) WHERE deleted_at IS NULL
);

-- Create sip_trunks table (basic structure)
CREATE TABLE sip_trunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    port INTEGER DEFAULT 5060,
    username VARCHAR(100),
    password VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create call_routing_rules table (basic structure)
CREATE TABLE call_routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    name VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0,
    conditions JSONB DEFAULT '{}', -- e.g., { "from": "+123...", "time": "business_hours" }
    action JSONB DEFAULT '{}', -- e.g., { "type": "forward", "target": "+1456..." }
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create dtmf_events table (basic structure)
CREATE TABLE dtmf_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    call_id UUID NOT NULL,
    digit VARCHAR(10) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_dtmf_events_call FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

COMMIT;

-- DOWN Migration (for rollback)
BEGIN;
DROP TABLE IF EXISTS dtmf_events;
DROP TABLE IF EXISTS call_routing_rules;
DROP TABLE IF EXISTS sip_trunks;
DROP TABLE IF EXISTS phone_numbers;
DROP TABLE IF EXISTS call_transcripts;
DROP TABLE IF EXISTS call_recordings;
DROP TABLE IF EXISTS calls;
DROP TYPE IF EXISTS phone_number_status;
DROP TYPE IF EXISTS transcription_status;
DROP TYPE IF EXISTS recording_format;
DROP TYPE IF EXISTS call_status;
DROP TYPE IF EXISTS call_direction;
COMMIT;