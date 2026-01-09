-- migrations/analytics/005_initial_analytics_schema.sql
-- UP Migration
BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Create call_metrics table (hypertable)
CREATE TABLE call_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    call_id UUID NOT NULL, -- Soft reference to telephony.calls.id
    timestamp TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(10,4) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

SELECT create_hypertable('call_metrics', 'timestamp');

-- Create indexes
CREATE INDEX idx_call_metrics_tenant_timestamp 
    ON call_metrics(tenant_id, timestamp) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_call_metrics_call_id_timestamp 
    ON call_metrics(call_id, timestamp) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_call_metrics_time ON call_metrics USING BRIN (timestamp);


-- Create voice_quality_logs table
CREATE TABLE voice_quality_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    call_id UUID NOT NULL, -- Soft reference to telephony.calls.id
    timestamp TIMESTAMPTZ NOT NULL,
    mos_score NUMERIC(5,2),
    latency_ms NUMERIC(5,2),
    jitter_ms NUMERIC(5,2),
    packet_loss NUMERIC(5,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_voice_quality_logs_tenant_timestamp 
    ON voice_quality_logs(tenant_id, timestamp) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_voice_quality_logs_call_id_timestamp 
    ON voice_quality_logs(call_id, timestamp) 
    WHERE deleted_at IS NULL;

-- Create tenant_analytics table
CREATE TABLE tenant_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    date DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    total_cost NUMERIC(10,2) DEFAULT 0,
    call_status_distribution JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    UNIQUE (tenant_id, date) WHERE deleted_at IS NULL
);

-- Create conversation_analytics table (basic structure)
CREATE TABLE conversation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    call_id UUID NOT NULL, -- Soft reference to telephony.calls.id
    timestamp TIMESTAMPTZ NOT NULL,
    sentiment_score NUMERIC(5,2),
    emotion_detection JSONB DEFAULT '{}',
    key_phrases JSONB DEFAULT '[]',
    intent_detected VARCHAR(255),
    resolution_status VARCHAR(50), -- e.g., 'resolved', 'unresolved'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create system_metrics table (basic structure, hypertable)
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(10,4) NOT NULL,
    host_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

SELECT create_hypertable('system_metrics', 'timestamp');

-- Create business_metrics table (basic structure)
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- Optional: system-wide or tenant-specific
    date DATE NOT NULL,
    kpi_name VARCHAR(100) NOT NULL,
    kpi_value NUMERIC(10,4) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    UNIQUE (tenant_id, date, kpi_name) WHERE deleted_at IS NULL
);

COMMIT;

-- DOWN Migration (for rollback)
BEGIN;
DROP TABLE IF EXISTS business_metrics;
DROP TABLE IF EXISTS system_metrics;
DROP TABLE IF EXISTS conversation_analytics;
DROP TABLE IF EXISTS tenant_analytics;
DROP TABLE IF EXISTS voice_quality_logs;
DROP TABLE IF EXISTS call_metrics;
DROP EXTENSION IF EXISTS "timescaledb";
COMMIT;