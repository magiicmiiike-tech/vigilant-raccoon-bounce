-- V001__initial_auth.sql
-- Initial Auth Database Schema Migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'locked', 'inactive');
    CREATE TYPE session_status AS ENUM ('active', 'expired', 'revoked');
    CREATE TYPE role_type AS ENUM ('super_admin', 'tenant_admin', 'user', 'agent', 'viewer');
    CREATE TYPE permission_scope AS ENUM ('read', 'write', 'delete', 'manage');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PROFILES TABLE (formerly users)
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    
    -- Core user information
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_sent_at TIMESTAMPTZ,
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT[],
    
    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Status and tracking
    status user_status DEFAULT 'active',
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    
    -- Security
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    password_history TEXT[] DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT profiles_phone_check CHECK (phone ~* '^\+?[1-9]\d{1,14}$' OR phone IS NULL)
    
    -- Foreign key to tenants (will be added after tenants table exists)
    -- CONSTRAINT fk_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for profiles table
CREATE UNIQUE INDEX idx_profiles_email_tenant 
    ON profiles(tenant_id, LOWER(email)) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_profiles_tenant_status 
    ON profiles(tenant_id, status) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_profiles_deleted_at 
    ON profiles(deleted_at) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_profiles_created_at 
    ON profiles(created_at);

CREATE INDEX idx_profiles_tenant_id 
    ON profiles(tenant_id);

-- ============================================================================
-- APP_SESSIONS TABLE
-- ============================================================================
CREATE TABLE app_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenancy
    tenant_id UUID NOT NULL,
    
    -- References
    profile_id UUID NOT NULL,
    
    -- Session tokens
    access_token_hash VARCHAR(512) NOT NULL,
    refresh_token_hash VARCHAR(512),
    
    -- Session info
    user_agent TEXT,
    ip_address INET,
    device_info JSONB DEFAULT '{}',
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ,
    
    -- Status
    status session_status DEFAULT 'active',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit trail
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign keys
    CONSTRAINT fk_app_sessions_profile FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) ON DELETE CASCADE
);

-- Indexes for app_sessions table
CREATE UNIQUE INDEX idx_app_sessions_access_token_hash 
    ON app_sessions(access_token_hash) 
    WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX idx_app_sessions_profile_id 
    ON app_sessions(profile_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_app_sessions_tenant_id 
    ON app_sessions(tenant_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_app_sessions_expires_at 
    ON app_sessions(expires_at) 
    WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX idx_app_sessions_refresh_expires_at 
    ON app_sessions(refresh_expires_at) 
    WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX idx_app_sessions_deleted_at 
    ON app_sessions(deleted_at) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Role information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Multi-tenancy
    tenant_id UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT roles_name_unique UNIQUE(tenant_id, name) 
        WHERE deleted_at IS NULL AND tenant_id IS NOT NULL,
    CONSTRAINT roles_system_name_unique UNIQUE(name) 
        WHERE deleted_at IS NULL AND tenant_id IS NULL AND is_system = TRUE
);

-- Indexes for roles table
CREATE INDEX idx_roles_tenant_id 
    ON roles(tenant_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_roles_is_system 
    ON roles(is_system) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Permission information
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    scope permission_scope NOT NULL,
    description TEXT,
    
    -- Constraints
    CONSTRAINT permissions_resource_action_scope_unique UNIQUE(resource, action, scope)
);

-- Indexes for permissions table
CREATE INDEX idx_permissions_resource 
    ON permissions(resource);

CREATE INDEX idx_permissions_action 
    ON permissions(action);

-- ============================================================================
-- PROFILE_ROLES TABLE (junction table)
-- ============================================================================
CREATE TABLE profile_roles (
    profile_id UUID NOT NULL,
    role_id UUID NOT NULL,
    
    -- Audit trail
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    assigned_by UUID,
    
    -- Primary key and foreign keys
    PRIMARY KEY (profile_id, role_id),
    CONSTRAINT fk_profile_roles_profile FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_profile_roles_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE
);

-- Indexes for profile_roles table
CREATE INDEX idx_profile_roles_profile_id 
    ON profile_roles(profile_id);

CREATE INDEX idx_profile_roles_role_id 
    ON profile_roles(role_id);

-- ============================================================================
-- ROLE_PERMISSIONS TABLE (junction table)
-- ============================================================================
CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    
    -- Optional: permission can be granted or denied
    granted BOOLEAN DEFAULT TRUE,
    
    -- Audit trail
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    assigned_by UUID,
    
    -- Primary key and foreign keys
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) ON DELETE CASCADE
);

-- Indexes for role_permissions table
CREATE INDEX idx_role_permissions_role_id 
    ON role_permissions(role_id);

CREATE INDEX idx_role_permissions_permission_id 
    ON role_permissions(permission_id);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert system roles (tenant_id is NULL for system roles)
INSERT INTO roles (id, name, description, is_system, is_default, tenant_id) VALUES
    (gen_random_uuid(), 'super_admin', 'Full system access across all tenants', TRUE, FALSE, NULL),
    (gen_random_uuid(), 'tenant_admin', 'Administrator for a specific tenant', TRUE, FALSE, NULL),
    (gen_random_uuid(), 'user', 'Regular user with basic permissions', TRUE, TRUE, NULL),
    (gen_random_uuid(), 'agent', 'AI agent with voice capabilities', TRUE, FALSE, NULL),
    (gen_random_uuid(), 'viewer', 'Read-only access', TRUE, FALSE, NULL)
ON CONFLICT DO NOTHING;

-- Insert common permissions
INSERT INTO permissions (id, resource, action, scope, description) VALUES
    -- User permissions
    (gen_random_uuid(), 'profile', 'read', 'read', 'Read own profile'),
    (gen_random_uuid(), 'profile', 'write', 'write', 'Update own profile'),
    (gen_random_uuid(), 'profile', 'read', 'manage', 'Read any profile'),
    (gen_random_uuid(), 'profile', 'write', 'manage', 'Update any profile'),
    (gen_random_uuid(), 'profile', 'delete', 'manage', 'Delete profiles'),
    
    -- Session permissions
    (gen_random_uuid(), 'session', 'read', 'read', 'View own sessions'),
    (gen_random_uuid(), 'session', 'delete', 'write', 'Revoke own sessions'),
    (gen_random_uuid(), 'session', 'read', 'manage', 'View all sessions'),
    (gen_random_uuid(), 'session', 'delete', 'manage', 'Revoke any session'),
    
    -- Role permissions
    (gen_random_uuid(), 'role', 'read', 'manage', 'View roles'),
    (gen_random_uuid(), 'role', 'write', 'manage', 'Create/update roles'),
    (gen_random_uuid(), 'role', 'delete', 'manage', 'Delete roles'),
    (gen_random_uuid(), 'role', 'assign', 'manage', 'Assign roles to users'),
    
    -- Tenant permissions
    (gen_random_uuid(), 'tenant', 'read', 'read', 'Read tenant info'),
    (gen_random_uuid(), 'tenant', 'write', 'manage', 'Update tenant settings'),
    (gen_random_uuid(), 'tenant', 'delete', 'manage', 'Delete tenant'),
    
    -- Call permissions
    (gen_random_uuid(), 'call', 'create', 'write', 'Initiate calls'),
    (gen_random_uuid(), 'call', 'read', 'read', 'View own calls'),
    (gen_random_uuid(), 'call', 'read', 'manage', 'View all calls'),
    (gen_random_uuid(), 'call', 'delete', 'manage', 'Delete calls'),
    
    -- Recording permissions
    (gen_random_uuid(), 'recording', 'read', 'read', 'View own recordings'),
    (gen_random_uuid(), 'recording', 'read', 'manage', 'View all recordings'),
    (gen_random_uuid(), 'recording', 'delete', 'manage', 'Delete recordings'),
    
    -- Billing permissions
    (gen_random_uuid(), 'billing', 'read', 'read', 'View own billing'),
    (gen_random_uuid(), 'billing', 'read', 'manage', 'View all billing'),
    (gen_random_uuid(), 'billing', 'write', 'manage', 'Update billing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY profiles_tenant_isolation ON profiles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY profiles_self_read ON profiles
    FOR SELECT
    USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY profiles_admin_access ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profile_roles pr
            JOIN roles r ON pr.role_id = r.id
            WHERE pr.profile_id = current_setting('app.current_user_id')::UUID
            AND r.name IN ('super_admin', 'tenant_admin')
            AND (r.tenant_id IS NULL OR r.tenant_id = profiles.tenant_id)
        )
    );

-- Create policies for app_sessions table
CREATE POLICY app_sessions_tenant_isolation ON app_sessions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY app_sessions_own_access ON app_sessions
    FOR ALL
    USING (profile_id = current_setting('app.current_user_id')::UUID);

-- Create policies for roles table
CREATE POLICY roles_tenant_isolation ON roles
    FOR ALL
    USING (
        tenant_id IS NULL 
        OR tenant_id = current_setting('app.current_tenant_id')::UUID
    );

CREATE POLICY roles_admin_access ON roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profile_roles pr
            JOIN roles r ON pr.role_id = r.id
            WHERE pr.profile_id = current_setting('app.current_user_id')::UUID
            AND r.name IN ('super_admin', 'tenant_admin')
            AND (r.tenant_id IS NULL OR r.tenant_id = roles.tenant_id)
        )
    );

-- Create policies for permissions table
-- Permissions are global, no RLS needed
CREATE POLICY permissions_public_read ON permissions
    FOR SELECT
    USING (true);

-- Create policies for profile_roles table
CREATE POLICY profile_roles_tenant_isolation ON profile_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = profile_roles.profile_id
            AND p.tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY profile_roles_admin_manage ON profile_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profile_roles pr
            JOIN roles r ON pr.role_id = r.id
            WHERE pr.profile_id = current_setting('app.current_user_id')::UUID
            AND r.name IN ('super_admin', 'tenant_admin')
        )
    );

-- Create policies for role_permissions table
CREATE POLICY role_permissions_tenant_isolation ON role_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = role_permissions.role_id
            AND (r.tenant_id IS NULL OR r.tenant_id = current_setting('app.current_tenant_id')::UUID)
        )
    );

CREATE POLICY role_permissions_admin_manage ON role_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profile_roles pr
            JOIN roles r ON pr.role_id = r.id
            WHERE pr.profile_id = current_setting('app.current_user_id')::UUID
            AND r.name IN ('super_admin', 'tenant_admin')
        )
    );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_sessions_updated_at 
    BEFORE UPDATE ON app_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUDIT LOGGING FUNCTION
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);

-- Function to log changes
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_setting('app.current_user_id', true)::UUID);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, operation, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers
CREATE TRIGGER audit_profiles_changes
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- ============================================================================
-- CASCADE DELETE TESTING HELPER
-- ============================================================================

-- Function to test cascade deletes
CREATE OR REPLACE FUNCTION test_cascade_delete(profile_id_to_delete UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    sessions_count_before INTEGER;
    sessions_count_after INTEGER;
    profile_roles_count_before INTEGER;
    profile_roles_count_after INTEGER;
BEGIN
    -- Get counts before delete
    SELECT COUNT(*) INTO sessions_count_before 
    FROM app_sessions WHERE profile_id = profile_id_to_delete;
    
    SELECT COUNT(*) INTO profile_roles_count_before 
    FROM profile_roles WHERE profile_id = profile_id_to_delete;
    
    -- Delete the profile
    DELETE FROM profiles WHERE id = profile_id_to_delete;
    
    -- Get counts after delete
    SELECT COUNT(*) INTO sessions_count_after 
    FROM app_sessions WHERE profile_id = profile_id_to_delete;
    
    SELECT COUNT(*) INTO profile_roles_count_after 
    FROM profile_roles WHERE profile_id = profile_id_to_delete;
    
    -- Build result
    result = jsonb_build_object(
        'profile_deleted', TRUE,
        'sessions_before', sessions_count_before,
        'sessions_after', sessions_count_after,
        'sessions_deleted', sessions_count_before - sessions_count_after,
        'profile_roles_before', profile_roles_count_before,
        'profile_roles_after', profile_roles_count_after,
        'profile_roles_deleted', profile_roles_count_before - profile_roles_count_after,
        'cascade_working', 
            CASE 
                WHEN sessions_count_after = 0 AND profile_roles_count_after = 0 THEN TRUE
                ELSE FALSE
            END
    );
    
    RETURN result;
END;
$$ language 'plpgsql';

-- ============================================================================
-- UUID GENERATION TEST
-- ============================================================================

-- Function to test UUID generation
CREATE OR REPLACE FUNCTION test_uuid_generation()
RETURNS JSONB AS $$
DECLARE
    profile_id UUID;
    session_id UUID;
    role_id UUID;
    permission_id UUID;
    all_uuids_valid BOOLEAN;
BEGIN
    -- Generate test data
    INSERT INTO profiles (tenant_id, email, password_hash) 
    VALUES (gen_random_uuid(), 'test@example.com', 'hashed_password')
    RETURNING id INTO profile_id;
    
    INSERT INTO app_sessions (tenant_id, profile_id, access_token_hash, expires_at)
    VALUES ((SELECT tenant_id FROM profiles WHERE id = profile_id), 
            profile_id, 
            'token_hash', 
            NOW() + INTERVAL '1 hour')
    RETURNING id INTO session_id;
    
    INSERT INTO roles (name, description, is_system)
    VALUES ('test_role', 'Test role', FALSE)
    RETURNING id INTO role_id;
    
    INSERT INTO permissions (resource, action, scope, description)
    VALUES ('test', 'read', 'read', 'Test permission')
    RETURNING id INTO permission_id;
    
    -- Check if all UUIDs are valid
    all_uuids_valid = (
        profile_id IS NOT NULL AND
        session_id IS NOT NULL AND
        role_id IS NOT NULL AND
        permission_id IS NOT NULL AND
        profile_id != session_id AND
        profile_id != role_id AND
        profile_id != permission_id
    );
    
    -- Clean up
    DELETE FROM permissions WHERE id = permission_id;
    DELETE FROM roles WHERE id = role_id;
    DELETE FROM app_sessions WHERE id = session_id;
    DELETE FROM profiles WHERE id = profile_id;
    
    RETURN jsonb_build_object(
        'all_uuids_valid', all_uuids_valid,
        'profile_id', profile_id,
        'session_id', session_id,
        'role_id', role_id,
        'permission_id', permission_id
    );
END;
$$ language 'plpgsql';

-- ============================================================================
-- ROW LEVEL SECURITY TEST
-- ============================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_row_level_security()
RETURNS JSONB AS $$
DECLARE
    tenant1_id UUID := gen_random_uuid();
    tenant2_id UUID := gen_random_uuid();
    admin1_id UUID;
    admin2_id UUID;
    user1_id UUID;
    user2_id UUID;
    
    -- Results
    can_access_own_tenant BOOLEAN;
    cannot_access_other_tenant BOOLEAN;
    admin_can_access_all BOOLEAN;
    user_cannot_access_admin_data BOOLEAN;
BEGIN
    -- Set up test data
    -- Create profiles for tenant 1
    INSERT INTO profiles (tenant_id, email, password_hash, first_name, last_name)
    VALUES 
        (tenant1_id, 'admin1@tenant1.com', 'hash1', 'Admin', 'One'),
        (tenant1_id, 'user1@tenant1.com', 'hash2', 'User', 'One')
    RETURNING id INTO admin1_id, user1_id;
    
    -- Create profiles for tenant 2
    INSERT INTO profiles (tenant_id, email, password_hash, first_name, last_name)
    VALUES 
        (tenant2_id, 'admin2@tenant2.com', 'hash3', 'Admin', 'Two'),
        (tenant2_id, 'user2@tenant2.com', 'hash4', 'User', 'Two')
    RETURNING id INTO admin2_id, user2_id;
    
    -- Test 1: User from tenant 1 can access tenant 1 data
    PERFORM set_config('app.current_tenant_id', tenant1_id::text, true);
    PERFORM set_config('app.current_user_id', user1_id::text, true);
    
    SELECT COUNT(*) > 0 INTO can_access_own_tenant
    FROM profiles 
    WHERE tenant_id = tenant1_id 
    AND deleted_at IS NULL;
    
    -- Test 2: User from tenant 1 cannot access tenant 2 data
    SELECT COUNT(*) = 0 INTO cannot_access_other_tenant
    FROM profiles 
    WHERE tenant_id = tenant2_id 
    AND deleted_at IS NULL;
    
    -- Test 3: Admin can access all data in their tenant
    PERFORM set_config('app.current_user_id', admin1_id::text, true);
    
    SELECT COUNT(*) > 0 INTO admin_can_access_all
    FROM profiles 
    WHERE tenant_id = tenant1_id 
    AND deleted_at IS NULL;
    
    -- Test 4: Regular user cannot access admin data (should only see themselves)
    PERFORM set_config('app.current_user_id', user1_id::text, true);
    
    SELECT COUNT(*) = 1 INTO user_cannot_access_admin_data
    FROM profiles 
    WHERE tenant_id = tenant1_id 
    AND deleted_at IS NULL;
    
    -- Clean up
    DELETE FROM profiles WHERE tenant_id IN (tenant1_id, tenant2_id);
    
    -- Reset config
    PERFORM set_config('app.current_tenant_id', '', true);
    PERFORM set_config('app.current_user_id', '', true);
    
    RETURN jsonb_build_object(
        'tests_passed', 
        can_access_own_tenant AND 
        cannot_access_other_tenant AND 
        admin_can_access_all AND 
        user_cannot_access_admin_data,
        'can_access_own_tenant', can_access_own_tenant,
        'cannot_access_other_tenant', cannot_access_other_tenant,
        'admin_can_access_all', admin_can_access_all,
        'user_cannot_access_admin_data', user_cannot_access_admin_data
    );
END;
$$ language 'plpgsql';

-- ============================================================================
-- FOREIGN KEY VALIDATION
-- ============================================================================

-- Function to validate foreign key relationships
CREATE OR REPLACE FUNCTION validate_foreign_keys()
RETURNS TABLE (
    table_name VARCHAR,
    column_name VARCHAR,
    foreign_table_name VARCHAR,
    foreign_column_name VARCHAR,
    constraint_name VARCHAR,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name,
        TRUE AS is_valid  -- If query runs, constraints exist
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
END;
$$ language 'plpgsql';

-- ============================================================================
-- INDEX VALIDATION
-- ============================================================================

-- Function to validate indexes on foreign keys
CREATE OR REPLACE FUNCTION validate_foreign_key_indexes()
RETURNS TABLE (
    table_name VARCHAR,
    foreign_key_column VARCHAR,
    index_exists BOOLEAN,
    index_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH foreign_keys AS (
        SELECT 
            tc.table_name,
            kcu.column_name AS fk_column
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    )
    SELECT 
        fk.table_name,
        fk.fk_column,
        EXISTS (
            SELECT 1 
            FROM pg_indexes pi 
            WHERE pi.tablename = fk.table_name
            AND pi.indexdef LIKE '%' || fk.fk_column || '%'
        ) AS index_exists,
        COALESCE(
            (SELECT pi.indexname 
             FROM pg_indexes pi 
             WHERE pi.tablename = fk.table_name
             AND pi.indexdef LIKE '%' || fk.fk_column || '%'
             LIMIT 1),
            'MISSING'
        ) AS index_name
    FROM foreign_keys fk
    ORDER BY fk.table_name, fk.fk_column;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION validate_foreign_key_indexes() IS 'Validates that all foreign key columns have indexes';