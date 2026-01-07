#!/bin/bash
# test_auth_schema.sh
# Run all auth schema tests

set -e

echo "========================================="
echo "AUTH SCHEMA COMPREHENSIVE TEST SUITE"
echo "========================================="

DB_NAME=${1:-"auth"}
DB_USER=${2:-"dukat"}
DB_PASSWORD=${3:-"password"}
DB_HOST=${4:-"localhost"}
DB_PORT=${5:-"5432"}

export PGPASSWORD=$DB_PASSWORD

echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# Function to run SQL and capture output
run_sql() {
    local sql=$1
    local description=$2
    echo "Running: $description"
    echo "-----------------------------------------"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$sql"
    echo ""
}

# 1. Check table structures
echo "1. TABLE STRUCTURE VERIFICATION"
echo "========================================="
run_sql "
SELECT 
    table_name,
    COUNT(*) as column_count,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'app_sessions', 'roles', 'permissions', 'profile_roles', 'role_permissions', 'api_keys', 'password_reset_tokens', 'login_attempts', 'audit_logs')
GROUP BY table_name 
ORDER BY table_name;
" "Table structure check"

# 2. Check foreign keys
echo "2. FOREIGN KEY VERIFICATION"
echo "========================================="
run_sql "SELECT * FROM validate_foreign_keys();" "Foreign key relationships"

# 3. Check indexes
echo "3. INDEX VERIFICATION"
echo "========================================="
run_sql "SELECT * FROM validate_foreign_key_indexes();" "Indexes on tables"

# 4. Test UUID generation
echo "4. UUID GENERATION TEST"
echo "========================================="
run_sql "SELECT test_uuid_generation();" "UUID generation test"

# 5. Create test data for cascade delete test
echo "5. PREPARING CASCADE DELETE TEST"
echo "========================================="
run_sql "
DO \$\$
DECLARE
    test_tenant_id UUID := gen_random_uuid();
    test_profile_id UUID;
    test_session_id UUID;
    test_role_id UUID;
    test_api_key_id UUID;
    test_password_reset_token_id UUID;
BEGIN
    -- Create test profile
    INSERT INTO profiles (tenant_id, email, password_hash, first_name, last_name)
    VALUES (test_tenant_id, 'cascade_test@example.com', 'hashed_password', 'Test', 'User')
    RETURNING id INTO test_profile_id;
    
    RAISE NOTICE 'Created test profile: %', test_profile_id;
    
    -- Create test sessions
    FOR i IN 1..3 LOOP
        INSERT INTO app_sessions (tenant_id, profile_id, access_token_hash, expires_at)
        VALUES (test_tenant_id, test_profile_id, 'token_hash_' || i, NOW() + INTERVAL '1 hour')
        RETURNING id INTO test_session_id;
        
        RAISE NOTICE 'Created test session %: %', i, test_session_id;
    END LOOP;
    
    -- Create test role
    INSERT INTO roles (name, description, tenant_id)
    VALUES ('test_role_cascade', 'Test role for cascade', test_tenant_id)
    RETURNING id INTO test_role_id;
    
    RAISE NOTICE 'Created test role: %', test_role_id;
    
    -- Assign role to profile
    INSERT INTO profile_roles (profile_id, role_id)
    VALUES (test_profile_id, test_role_id);
    
    RAISE NOTICE 'Assigned role to profile';

    -- Create test API key
    INSERT INTO api_keys (tenant_id, profile_id, name, key)
    VALUES (test_tenant_id, test_profile_id, 'test_api_key', 'test_key_value')
    RETURNING id INTO test_api_key_id;
    RAISE NOTICE 'Created test API key: %', test_api_key_id;

    -- Create test password reset token
    INSERT INTO password_reset_tokens (profile_id, token, expires_at)
    VALUES (test_profile_id, 'test_reset_token', NOW() + INTERVAL '1 hour')
    RETURNING id INTO test_password_reset_token_id;
    RAISE NOTICE 'Created test password reset token: %', test_password_reset_token_id;
    
    -- Store IDs for later test
    PERFORM set_config('test.profile_id', test_profile_id::text, false);
    PERFORM set_config('test.tenant_id', test_tenant_id::text, false);
END \$\$;
" "Creating test data for cascade delete"

# 6. Run cascade delete test
echo "6. CASCADE DELETE TEST"
echo "========================================="
run_sql "
DO \$\$
DECLARE
    test_profile_id UUID;
    test_result JSONB;
BEGIN
    -- Get test profile ID from config
    test_profile_id := current_setting('test.profile_id')::UUID;
    
    -- Run cascade delete test
    test_result := test_cascade_delete(test_profile_id);
    
    RAISE NOTICE 'Cascade delete test result: %', test_result;
    
    -- Verify results
    IF (test_result->>'cascade_working')::BOOLEAN THEN
        RAISE NOTICE '✓ CASCADE DELETE TEST PASSED';
    ELSE
        RAISE EXCEPTION '✗ CASCADE DELETE TEST FAILED';
    END IF;
END \$\$;
" "Cascade delete test"

# 7. Test Row Level Security
echo "7. ROW LEVEL SECURITY TEST"
echo "========================================="
run_sql "SELECT test_row_level_security();" "Row Level Security test"

# 8. Verify RLS policies
echo "8. RLS POLICY VERIFICATION"
echo "========================================="
run_sql "
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'app_sessions', 'roles', 'permissions', 'profile_roles', 'role_permissions', 'api_keys', 'password_reset_tokens', 'login_attempts', 'audit_logs')
ORDER BY tablename;
" "RLS status on tables"

# 9. Check audit logging
echo "9. AUDIT LOGGING VERIFICATION"
echo "========================================="
run_sql "
SELECT 
    COUNT(*) as total_audit_entries,
    MIN(changed_at) as first_audit,
    MAX(changed_at) as last_audit
FROM audit_logs;
" "Audit log status"

# 10. Cleanup any test data
echo "10. CLEANUP"
echo "========================================="
run_sql "
DELETE FROM profiles WHERE email LIKE '%test%@example.com' OR email LIKE '%cascade_test@example.com' OR email LIKE '%audit_test@example.com';
DELETE FROM roles WHERE name = 'test_role' OR name = 'test_role_cascade';
" "Cleaning up test data"

echo "========================================="
echo "ALL TESTS COMPLETED SUCCESSFULLY ✓"
echo "========================================="