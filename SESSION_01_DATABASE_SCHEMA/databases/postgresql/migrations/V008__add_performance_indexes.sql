-- V008__add_performance_indexes.sql
-- Performance optimization indexes and table settings

-- 1. Call routing optimization
CREATE INDEX IF NOT EXISTS idx_calls_routing ON calls(tenant_id, from_number, to_number, call_time DESC)
WHERE status IN ('initiated', 'ringing', 'answered');

-- 2. Recent calls index
CREATE INDEX IF NOT EXISTS idx_calls_recent ON calls(tenant_id, call_time DESC) WHERE call_time > NOW() - INTERVAL '24 hours';

-- 3. Users auth optimization
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(tenant_id, email, password_hash) WHERE status = 'active' AND deleted_at IS NULL;

-- 4. KB search optimization
CREATE INDEX IF NOT EXISTS idx_kb_search_optimized ON knowledge_base_chunks USING gin(search_tsvector, metadata);

-- 5. Conversation analysis
CREATE INDEX IF NOT EXISTS idx_conversation_analysis ON conversation_turns(call_id, speaker, start_time) INCLUDE (message, intent_detected, sentiment_score);

-- 6. Billing and cost analysis
CREATE INDEX IF NOT EXISTS idx_billing_analysis ON calls(tenant_id, call_time, cost_cents) WHERE cost_cents > 0;

-- 7. Phone number lookup
CREATE INDEX IF NOT EXISTS idx_phone_numbers_lookup ON phone_numbers(phone_number, tenant_id, status) INCLUDE (voice_agent_id, emergency_enabled);

-- 8. Tenant performance metrics
CREATE INDEX IF NOT EXISTS idx_tenant_performance ON tenant_analytics_daily(tenant_id, date DESC) INCLUDE (total_calls, ai_handled_percent, avg_satisfaction_score);

-- 9. Voice agent usage patterns
CREATE INDEX IF NOT EXISTS idx_agent_usage ON voice_agents(tenant_id, status, created_at) INCLUDE (name, llm_model);

-- 10. Audit trail for compliance
CREATE INDEX IF NOT EXISTS idx_audit_compliance ON audit_logs(tenant_id, created_at, action) WHERE resource_type IN ('user', 'call', 'document');

-- Composite indexes for common JOIN patterns
CREATE INDEX IF NOT EXISTS idx_calls_join_agent ON calls(voice_agent_id, tenant_id, call_time);
CREATE INDEX IF NOT EXISTS idx_conversation_join_call ON conversation_turns(call_id, tenant_id, speaker);

-- Covering indexes
CREATE INDEX IF NOT EXISTS idx_users_covering ON users(tenant_id, role, status) INCLUDE (email, first_name, last_name, last_login_at);
CREATE INDEX IF NOT EXISTS idx_calls_covering ON calls(tenant_id, call_time, status) INCLUDE (from_number, to_number, duration_seconds, ai_handled, satisfaction_score);

-- VACUUM/ANALYZE settings
ALTER TABLE calls SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.005, toast.autovacuum_vacuum_scale_factor = 0.02);
ALTER TABLE conversation_turns SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01);

-- Statistics
CREATE STATISTICS IF NOT EXISTS stats_calls_status ON status, duration_seconds, satisfaction_score FROM calls;
CREATE STATISTICS IF NOT EXISTS stats_users_tenant ON tenant_id, role, status FROM users;

-- Refresh materialized views if exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_agent_performance_daily') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agent_performance_daily;
    END IF;
END $$;

ANALYZE VERBOSE;