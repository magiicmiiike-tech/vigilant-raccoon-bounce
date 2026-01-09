-- migrations/emergency/006_initial_emergency_schema.sql
-- UP Migration
BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS postgis; -- Uncomment if PostGIS is needed for advanced geo-queries

-- Create enum types
CREATE TYPE emergency_call_status AS ENUM ('initiated', 'routed', 'answered', 'completed', 'failed');

-- Create emergency_calls table
CREATE TABLE emergency_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    e911_call_id VARCHAR(100) UNIQUE NOT NULL,
    original_call_id UUID, -- Soft reference to telephony.calls.id
    call_time TIMESTAMPTZ NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL, -- PSAP number
    caller_name VARCHAR(255),
    location_address VARCHAR(255),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    psap_id UUID, -- Soft reference to psap_info.id
    status emergency_call_status DEFAULT 'initiated',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE UNIQUE INDEX idx_emergency_calls_e911_call_id 
    ON emergency_calls(e911_call_id) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_emergency_calls_tenant_call_time 
    ON emergency_calls(tenant_id, call_time) 
    WHERE deleted_at IS NULL;

-- Create emergency_contacts table
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    user_id UUID NOT NULL, -- Soft reference to auth.users.id
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    relationship VARCHAR(50) DEFAULT 'primary',
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,

    UNIQUE (tenant_id, user_id, phone_number) WHERE deleted_at IS NULL
);

-- Create psap_info table
CREATE TABLE psap_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    service_area JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_psap_info_name 
    ON psap_info(name) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_psap_info_state_city 
    ON psap_info(state, city) 
    WHERE deleted_at IS NULL;

-- Create location_validations table (basic structure)
CREATE TABLE location_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    user_id UUID, -- Soft reference to auth.users.id
    address_input TEXT NOT NULL,
    validated_address JSONB,
    validation_status VARCHAR(50) NOT NULL, -- e.g., 'pending', 'valid', 'invalid'
    validation_provider VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create compliance_audits table (basic structure)
CREATE TABLE compliance_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    audit_type VARCHAR(100) NOT NULL, -- e.g., 'e911_report', 'hipaa_access_log'
    audit_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    audited_by UUID, -- Soft reference to auth.users.id
    report_url TEXT,
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create test_call_records table (basic structure)
CREATE TABLE test_call_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    test_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    test_number VARCHAR(20) NOT NULL,
    expected_psap_id UUID, -- Soft reference to psap_info.id
    actual_psap_id UUID, -- Soft reference to psap_info.id
    test_result VARCHAR(50) NOT NULL, -- 'pass', 'fail'
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

COMMIT;

-- DOWN Migration (for rollback)
BEGIN;
DROP TABLE IF EXISTS test_call_records;
DROP TABLE IF EXISTS compliance_audits;
DROP TABLE IF EXISTS location_validations;
DROP TABLE IF EXISTS psap_info;
DROP TABLE IF EXISTS emergency_contacts;
DROP TABLE IF EXISTS emergency_calls;
DROP TYPE IF EXISTS emergency_call_status;
-- DROP EXTENSION IF EXISTS postgis;
COMMIT;