-- verify_auth_schema.sql
-- Run this after applying V001__initial_auth.sql

DO $$
DECLARE
    test_result JSONB;
    uuid_test_result JSONB;
    rls_test_result JSONB;
    fk_validation_result RECORD;
    index_validation_result RECORD;
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'AUTH SCHEMA VERIFICATION';
    RAISE NOTICE '=========================================';
    
    -- 1. Verify tables exist
    RAISE NOTICE '1. Checking table existence...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE '   ✓ profiles table exists';
    ELSE
        RAISE EXCEPTION '   ✗ profiles table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_sessions') THEN
        RAISE NOTICE '   ✓ app_sessions table exists';
    ELSE
        RAISE EXCEPTION '   ✗ app_sessions table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        RAISE NOTICE '   ✓ roles table exists';
    ELSE
        RAISE EXCEPTION '   ✗ roles table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        RAISE NOTICE '   ✓ permissions table exists';
    ELSE
        RAISE EXCEPTION '   ✗ permissions table missing';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_roles') THEN
        RAISE NOTICE '   ✓ profile_roles table exists';
    ELSE
        RAISE EXCEPTION '   ✗ profile_roles table missing';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        RAISE NOTICE '   ✓ role_permissions table exists';
    ELSE
        RAISE EXCEPTION '   ✗ role_permissions table missing';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        RAISE NOTICE '   ✓ api_keys table exists';
    ELSE
        RAISE EXCEPTION '   ✗ api_keys table missing';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
        RAISE NOTICE '   ✓ password_reset_tokens table exists';
    ELSE
        RAISE EXCEPTION '   ✗ password_reset_tokens table missing';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_attempts') THEN
        RAISE NOTICE '   ✓ login_attempts table exists';
    ELSE
        RAISE EXCEPTION '   ✗ login_attempts table missing';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE '   ✓ audit_logs table exists';
    ELSE
        RAISE EXCEPTION '   ✗ audit_logs table missing';
    END IF;
    
    -- 2. Test UUID generation
    RAISE NOTICE '2. Testing UUID generation...';
    uuid_test_result := test_uuid_generation();
    IF (uuid_test_result->>'all_uuids_valid')::BOOLEAN THEN
        RAISE NOTICE '   ✓ UUID generation works correctly';
    ELSE
        RAISE EXCEPTION '   ✗ UUID generation failed: %', uuid_test_result;
    END IF;
    
    -- 3. Test cascade deletes
    RAISE NOTICE '3. Testing cascade deletes...';
    -- Create test data
    DECLARE
        test_tenant_id UUID := gen_random_uuid();
        test_profile_id UUID;
        test_session_id UUID;
        test_role_id UUID;
        test_api_key_id UUID;
        test_password_reset_token_id UUID;
    BEGIN
        -- Create test profile
        INSERT INTO profiles (tenant_id, email, password_hash)
        VALUES (test_tenant_id, 'cascade_test@example.com', 'hash')
        RETURNING id INTO test_profile_id;
        
        -- Create test session
        INSERT INTO app_sessions (tenant_id, profile_id, access_token_hash, expires_at)
        VALUES (test_tenant_id, test_profile_id, 'test_token_hash', NOW() + INTERVAL '1 hour')
        RETURNING id INTO test_session_id;
        
        -- Create test role
        INSERT INTO roles (name, description, tenant_id)
        VALUES ('test_role_cascade', 'Test role for cascade', test_tenant_id)
        RETURNING id INTO test_role_id;
        
        -- Assign role to profile
        INSERT INTO profile_roles (profile_id, role_id)
        VALUES (test_profile_id, test_role_id);

        -- Create test API key
        INSERT INTO api_keys (tenant_id, profile_id, name, key)
        VALUES (test_tenant_id, test_profile_id, 'test_api_key', 'test_key_value')
        RETURNING id INTO test_api_key_id;

        -- Create test password reset token
        INSERT INTO password_reset_tokens (profile_id, token, expires_at)
        VALUES (test_profile_id, 'test_reset_token', NOW() + INTERVAL '1 hour')
        RETURNING id INTO test_password_reset_token_id;
        
        -- Test cascade delete
        test_result := test_cascade_delete(test_profile_id);
        
        IF (test_result->>'cascade_working')::BOOLEAN THEN
            RAISE NOTICE '   ✓ Cascade deletes work correctly';
            RAISE NOTICE '     Sessions deleted: %', test_result->>'sessions_deleted';
            RAISE NOTICE '     Profile roles deleted: %', test_result->>'profile_roles_deleted';
            RAISE NOTICE '     API keys deleted: %', test_result->>'api_keys_deleted';
            RAISE NOTICE '     Password reset tokens deleted: %', test_result->>'password_reset_tokens_deleted';
        ELSE
            RAISE EXCEPTION '   ✗ Cascade delete failed: %', test_result;
        END IF;
        -- Clean up the role created for this test
        DELETE FROM roles WHERE id = test_role_id;
    END;
    
    -- 4. Test Row Level Security
    RAISE NOTICE '4. Testing Row Level Security...';
    rls_test_result := test_row_level_security();
    IF (rls_test_result->>'tests_passed')::BOOLEAN THEN
        RAISE NOTICE '   ✓ RLS tests passed';
        RAISE NOTICE '     - Can access own tenant: %', rls_test_result->>'can_access_own_tenant';
        RAISE NOTICE '     - Cannot access other tenant: %', rls_test_result->>'cannot_access_other_tenant';
        RAISE NOTICE '     - Admin can access all: %', rls_test_result->>'admin_can_access_all';
        RAISE NOTICE '     - User cannot access admin data: %', rls_test_result->>'user_cannot_access_admin_data';
    ELSE
        RAISE EXCEPTION '   ✗ RLS tests failed: %', rls_test_result;
    END IF;
    
    -- 5. Verify foreign key constraints
    RAISE NOTICE '5. Verifying foreign key constraints...';
    FOR fk_validation_result IN SELECT * FROM validate_foreign_keys() LOOP
        IF fk_validation_result.is_valid THEN
            RAISE NOTICE '   ✓ %.% -> %.%', 
                fk_validation_result.table_name,
                fk_validation_result.column_name,
                fk_validation_result.foreign_table_name,
                fk_validation_result.foreign_column_name;
        ELSE
            RAISE EXCEPTION '   ✗ Foreign key constraint missing: %', fk_validation_result.constraint_name;
        END IF;
    END LOOP;
    
    -- 6. Verify indexes on foreign keys
    RAISE NOTICE '6. Verifying indexes on foreign keys...';
    FOR index_validation_result IN SELECT * FROM validate_foreign_key_indexes() LOOP
        IF index_validation_result.index_exists THEN
            RAISE NOTICE '   ✓ %.% has index: %', 
                index_validation_result.table_name,
                index_validation_result.foreign_key_column,
                index_validation_result.index_name;
        ELSE
            RAISE EXCEPTION '   ✗ Missing index on %.%', 
                index_validation_result.table_name,
                index_validation_result.foreign_key_column;
        END IF;
    END LOOP;
    
    -- 7. Verify RLS is enabled
    RAISE NOTICE '7. Verifying RLS is enabled...';
    IF EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'app_sessions', 'roles', 'permissions', 'profile_roles', 'role_permissions', 'api_keys', 'password_reset_tokens', 'login_attempts')
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '   ✓ RLS is enabled on all tables';
    ELSE
        RAISE EXCEPTION '   ✗ RLS not enabled on all tables';
    END IF;
    
    -- 8. Verify audit logging
    RAISE NOTICE '8. Verifying audit logging...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE '   ✓ audit_logs table exists';
        
        -- Create and delete a test record to trigger audit
        DECLARE
            audit_test_id UUID;
            audit_count_before INTEGER;
            audit_count_after INTEGER;
        BEGIN
            SELECT COUNT(*) INTO audit_count_before FROM audit_logs;
            
            -- Create test profile (should trigger audit)
            INSERT INTO profiles (tenant_id, email, password_hash)
            VALUES (gen_random_uuid(), 'audit_test@example.com', 'hash')
            RETURNING id INTO audit_test_id;
            
            -- Update test profile (should trigger audit)
            UPDATE profiles SET first_name = 'Test' WHERE id = audit_test_id;
            
            -- Delete test profile (should trigger audit)
            DELETE FROM profiles WHERE id = audit_test_id;
            
            SELECT COUNT(*) INTO audit_count_after FROM audit_logs;
            
            IF audit_count_after > audit_count_before THEN
                RAISE NOTICE '   ✓ Audit logging is working (% new audit entries)', 
                    audit_count_after - audit_count_before;
            ELSE
                RAISE WARNING '   ⚠ Audit logging may not be working (no new entries)';
            END IF;
        END;
    ELSE
        RAISE EXCEPTION '   ✗ audit_logs table missing';
    END IF;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'ALL VERIFICATIONS PASSED ✓';
    RAISE NOTICE '=========================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Verification failed: %', SQLERRM;
END $$;
