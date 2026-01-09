-- V007__dukat_initial_schema.sql
-- Consolidated Dukat Voice initial schema (calls, conversation, kb, audit, voice agents, phone numbers)
-- NOTE: This file is meant to be applied after existing auth/tenant/billing/telephony migrations

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Enable Row-Level Security at DB level (app should set app.current_tenant)
ALTER DATABASE dukat_voice SET row_security = on;

-- ========== CORE TENANT TABLES (if not defined by earlier migrations) ==========
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'suspended', 'terminated')),
    tier VARCHAR(50) NOT NULL DEFAULT 'starter'
        CHECK (tier IN ('starter', 'business', 'enterprise')),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    billing_email VARCHAR(255),
    max_users INTEGER DEFAULT 10,
    max_concurrent_calls INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 10,
    voice_clones_allowed INTEGER DEFAULT 1,
    requires_hipaa BOOLEAN DEFAULT false,
    requires_gdpr BOOLEAN DEFAULT false,
    requires_pci BOOLEAN DEFAULT false,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    monthly_retention_days INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenants_external_id ON tenants(external_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- ========== USERS & SESSIONS ==========
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    mfa_secret VARCHAR(100),
    mfa_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    title VARCHAR(100),
    department VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en-US',
    role VARCHAR(50) NOT NULL DEFAULT 'user'
        CHECK (role IN ('super_admin', 'tenant_admin', 'agent', 'user', 'viewer')),
    permissions JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (tenant_id, email),
    UNIQUE (tenant_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(100),
    device_type VARCHAR(50),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    invalidated_at TIMESTAMPTZ,
    invalidated_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- ========== VOICE AGENTS ==========
CREATE TABLE IF NOT EXISTS voice_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    voice_model VARCHAR(100) DEFAULT 'elevenlabs',
    voice_id VARCHAR(100),
    voice_characteristics JSONB DEFAULT '{}',
    speaking_rate DECIMAL(3,2) DEFAULT 1.0,
    pitch DECIMAL(3,2) DEFAULT 1.0,
    llm_model VARCHAR(100) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    system_prompt TEXT,
    greeting_message TEXT,
    fallback_message TEXT,
    escalation_message TEXT,
    timeout_seconds INTEGER DEFAULT 30,
    max_conversation_minutes INTEGER DEFAULT 30,
    inbound_numbers TEXT[],
    outbound_enabled BOOLEAN DEFAULT false,
    working_hours JSONB DEFAULT '{"enabled": false, "timezone": "UTC", "schedule": {}}',
    status VARCHAR(50) DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_voice_agents_tenant_id ON voice_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voice_agents_status ON voice_agents(status);

-- ========== KNOWLEDGE BASE ==========
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    voice_agent_id UUID REFERENCES voice_agents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) CHECK (source_type IN ('upload', 'crm', 'website', 'api', 'manual')),
    source_url TEXT,
    file_type VARCHAR(50),
    file_size BIGINT,
    raw_text TEXT,
    processed_text TEXT,
    chunk_count INTEGER DEFAULT 0,
    embedding_model VARCHAR(100),
    embedding_status VARCHAR(50) DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
    last_embedded_at TIMESTAMPTZ,
    vector_collection_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_kb_docs_tenant_id ON knowledge_base_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_agent_id ON knowledge_base_documents(voice_agent_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_status ON knowledge_base_documents(status);

CREATE TABLE IF NOT EXISTS knowledge_base_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_base_documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_size INTEGER,
    token_count INTEGER,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding_hash VARCHAR(64),
    search_tsvector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', content)
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks_document_id ON knowledge_base_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_tenant_id ON knowledge_base_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding_hash ON knowledge_base_chunks(embedding_hash);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_search ON knowledge_base_chunks USING GIN(search_tsvector);

-- ========== CALLS (Timescale hypertable) ==========
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    voice_agent_id UUID REFERENCES voice_agents(id),
    external_call_id VARCHAR(100) UNIQUE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    call_type VARCHAR(50) NOT NULL CHECK (call_type IN ('voice', 'video', 'conference')),
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    caller_name VARCHAR(255),
    caller_id VARCHAR(100),
    call_time TIMESTAMPTZ NOT NULL,
    answer_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    queue_time_seconds INTEGER,
    status VARCHAR(50) NOT NULL CHECK (status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer')),
    termination_reason VARCHAR(100),
    mos_score DECIMAL(3,2),
    jitter_ms DECIMAL(6,2),
    packet_loss_percent DECIMAL(5,2),
    latency_ms INTEGER,
    ai_handled BOOLEAN DEFAULT false,
    human_escalated BOOLEAN DEFAULT false,
    escalation_reason VARCHAR(100),
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    recording_url TEXT,
    recording_duration_seconds INTEGER,
    transcription_url TEXT,
    summary_text TEXT,
    cost_cents INTEGER,
    cost_currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable
SELECT create_hypertable('calls', 'call_time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- Compression policy
ALTER TABLE calls SET (timescaledb.compress, timescaledb.compress_segmentby = 'tenant_id,voice_agent_id', timescaledb.compress_orderby = 'call_time DESC');
SELECT add_compression_policy('calls', INTERVAL '7 days');

CREATE INDEX IF NOT EXISTS idx_calls_tenant_id ON calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calls_voice_agent_id ON calls(voice_agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_time ON calls(call_time);
CREATE INDEX IF NOT EXISTS idx_calls_from_number ON calls(from_number);
CREATE INDEX IF NOT EXISTS idx_calls_to_number ON calls(to_number);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_tenant_time_status ON calls(tenant_id, call_time, status);

-- ========== CONVERSATION TURNS ==========
CREATE TABLE IF NOT EXISTS conversation_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    turn_index INTEGER NOT NULL,
    speaker VARCHAR(50) NOT NULL CHECK (speaker IN ('agent', 'customer', 'system')),
    message TEXT NOT NULL,
    message_type VARCHAR(50) CHECK (message_type IN ('text', 'audio', 'intent', 'action')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(4,3),
    entities JSONB DEFAULT '[]',
    sentiment_score DECIMAL(3,2),
    speech_rate_wpm INTEGER,
    emotion_detected VARCHAR(50),
    processing_latency_ms INTEGER,
    llm_model_used VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_turns_call_id ON conversation_turns(call_id);
CREATE INDEX IF NOT EXISTS idx_conversation_turns_tenant_id ON conversation_turns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_turns_speaker ON conversation_turns(speaker);
CREATE INDEX IF NOT EXISTS idx_conversation_turns_start_time ON conversation_turns(start_time);

-- ========== PHONE NUMBERS ==========
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    number_type VARCHAR(20) NOT NULL CHECK (number_type IN ('local', 'toll-free', 'mobile', 'short-code')),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('twilio', 'bandwidth', 'vonage', 'local')),
    provider_sid VARCHAR(100),
    voice_agent_id UUID REFERENCES voice_agents(id),
    ivr_menu_id UUID,
    emergency_enabled BOOLEAN DEFAULT true,
    recording_enabled BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'pending', 'porting', 'inactive')),
    porting_status VARCHAR(50),
    porting_request_id VARCHAR(100),
    porting_eta TIMESTAMPTZ,
    monthly_cost_cents INTEGER,
    per_minute_cost_cents INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_tenant_id ON phone_numbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers(status);

-- ========== TENANT ANALYTICS DAILY ==========
CREATE TABLE IF NOT EXISTS tenant_analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    inbound_calls INTEGER DEFAULT 0,
    outbound_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    missed_calls INTEGER DEFAULT 0,
    total_duration_seconds BIGINT DEFAULT 0,
    avg_duration_seconds DECIMAL(10,2),
    max_duration_seconds INTEGER,
    ai_handled_calls INTEGER DEFAULT 0,
    ai_handled_percent DECIMAL(5,2),
    human_escalations INTEGER DEFAULT 0,
    escalation_rate DECIMAL(5,2),
    avg_mos_score DECIMAL(3,2),
    avg_satisfaction_score DECIMAL(3,2),
    total_cost_cents BIGINT DEFAULT 0,
    avg_cost_per_call_cents INTEGER,
    unique_caller_count INTEGER DEFAULT 0,
    repeat_caller_count INTEGER DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_tenant_analytics_date ON tenant_analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_tenant_id ON tenant_analytics_daily(tenant_id);

-- ========== AUDIT LOGS ==========
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    resource_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'unauthorized')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

SELECT create_hypertable('audit_logs', 'created_at', chunk_time_interval => INTERVAL '7 days', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ========== VIEWS ==========
CREATE OR REPLACE VIEW tenant_dashboard_metrics AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.tier,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT va.id) as agent_count,
    COUNT(DISTINCT pn.id) as phone_number_count,
    COALESCE(SUM(calls_day.total_calls), 0) as total_calls_30d,
    COALESCE(AVG(calls_day.avg_satisfaction_score), 0) as avg_satisfaction_30d
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.status = 'active'
LEFT JOIN voice_agents va ON va.tenant_id = t.id AND va.status = 'active'
LEFT JOIN phone_numbers pn ON pn.tenant_id = t.id AND pn.status = 'active'
LEFT JOIN tenant_analytics_daily calls_day ON calls_day.tenant_id = t.id AND calls_day.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE t.status = 'active'
GROUP BY t.id, t.name, t.tier;

-- ========== TRIGGERS / UTILS ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('schema_migrations')
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = table_name AND column_name = 'updated_at') THEN
            EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;', table_name, table_name);
            EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', table_name, table_name);
        END IF;
    END LOOP;
END $$;

-- Policies for tenant-scoped tables
CREATE POLICY IF NOT EXISTS calls_tenant_isolation ON calls
    USING (tenant_id IN (SELECT id FROM tenants WHERE external_id = current_setting(''app.current_tenant'', true)));

CREATE POLICY IF NOT EXISTS user_tenant_isolation ON users
    USING (
        tenant_id IN (SELECT id FROM tenants WHERE external_id = current_setting(''app.current_tenant'', true))
    );

-- Final comments
COMMENT ON TABLE tenants IS 'Multi-tenant isolation and configuration';
COMMENT ON TABLE users IS 'User authentication and permissions';
COMMENT ON TABLE voice_agents IS 'AI voice agent configurations';
COMMENT ON TABLE knowledge_base_documents IS 'RAG knowledge base storage';
COMMENT ON TABLE calls IS 'Call records and voice quality metrics';
COMMENT ON TABLE conversation_turns IS 'Detailed conversation logs';
COMMENT ON TABLE phone_numbers IS 'Telephony number management';
COMMENT ON TABLE audit_logs IS 'Compliance and security audit trail';
