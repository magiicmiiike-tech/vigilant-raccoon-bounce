-- migrations/tenants/002_initial_tenants_schema.sql
-- UP Migration
BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE tenant_plan_tier AS ENUM ('starter', 'business', 'enterprise');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'pending', 'inactive');
CREATE TYPE api_key_environment AS ENUM ('live', 'test', 'development');

-- Create tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    plan_tier tenant_plan_tier DEFAULT 'starter',
    status tenant_status DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    trial_ends_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE UNIQUE INDEX idx_tenants_domain 
    ON tenants(domain) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_tenants_status_created_at 
    ON tenants(status, created_at) 
    WHERE deleted_at IS NULL;

-- Create tenant_configs table
CREATE TABLE tenant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL,
    voice_settings JSONB DEFAULT '{}',
    agent_settings JSONB DEFAULT '{}',
    telephony_settings JSONB DEFAULT '{}',
    integration_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_tenant_configs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(512) UNIQUE NOT NULL,
    environment api_key_environment DEFAULT 'live',
    scopes JSONB DEFAULT '[]',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_used_ip VARCHAR(45),
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_api_keys_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes
CREATE UNIQUE INDEX idx_api_keys_key_hash 
    ON api_keys(key_hash) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_api_keys_tenant_name 
    ON api_keys(tenant_id, name) 
    WHERE deleted_at IS NULL;

-- Create webhooks table (basic structure)
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255),
    events JSONB DEFAULT '[]', -- e.g., ['call.completed', 'invoice.paid']
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_webhooks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_webhooks_tenant_events ON webhooks(tenant_id, events) WHERE deleted_at IS NULL AND is_active IS TRUE;

-- Create feature_flags table (basic structure)
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_feature_flags_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, feature_name) WHERE deleted_at IS NULL
);

-- Create usage_quotas table (basic structure)
CREATE TABLE usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    metric_name VARCHAR(100) NOT NULL, -- e.g., 'call_minutes', 'api_requests'
    limit_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    period VARCHAR(20) DEFAULT 'monthly', -- e.g., 'daily', 'monthly'
    resets_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_usage_quotas_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, metric_name, period) WHERE deleted_at IS NULL
);

COMMIT;

-- DOWN Migration (for rollback)
BEGIN;
DROP TABLE IF EXISTS usage_quotas;
DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS tenant_configs;
DROP TABLE IF EXISTS tenants;
DROP TYPE IF EXISTS api_key_environment;
DROP TYPE IF EXISTS tenant_status;
DROP TYPE IF EXISTS tenant_plan_tier;
COMMIT;