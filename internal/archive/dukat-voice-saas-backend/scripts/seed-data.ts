import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs'; // Using bcryptjs for consistency with auth-service
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'dukat_voice_saas',
  entities: [path.join(__dirname, '../src/entities/**/*.ts')], // Correct path for entities
  synchronize: false,
  logging: true,
});

async function seedData(): Promise<void> {
  console.log('🚀 Starting seed data process...');

  await dataSource.initialize();
  console.log('✅ Database connection established');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();
    console.log('✅ Transaction started');

    // ============================================
    // SEED DATABASE 1: AUTHENTICATION & USERS
    // ============================================

    console.log('🌱 Seeding authentication data...');

    // Create system roles
    const adminRoleIdResult = await queryRunner.query(`
      INSERT INTO roles (id, name, description, permissions, is_system, created_at, updated_at)
      VALUES (uuid_generate_v4(), 'admin', 'System Administrator', '["*"]', true, NOW(), NOW())
      RETURNING id;
    `);
    const adminRoleId = adminRoleIdResult[0].id;

    const userRoleIdResult = await queryRunner.query(`
      INSERT INTO roles (id, name, description, permissions, is_system, created_at, updated_at)
      VALUES (uuid_generate_v4(), 'user', 'Regular User', '["user:read", "user:write"]', true, NOW(), NOW())
      RETURNING id;
    `);
    const userRoleId = userRoleIdResult[0].id;

    const tenantAdminRoleIdResult = await queryRunner.query(`
      INSERT INTO roles (id, name, description, permissions, is_system, created_at, updated_at)
      VALUES (uuid_generate_v4(), 'tenant_admin', 'Tenant Administrator', '["tenant:*", "user:*", "api_key:*", "webhook:*", "config:*"]', true, NOW(), NOW())
      RETURNING id;
    `);
    const tenantAdminRoleId = tenantAdminRoleIdResult[0].id;

    const tenantUserRoleIdResult = await queryRunner.query(`
      INSERT INTO roles (id, name, description, permissions, is_system, created_at, updated_at)
      VALUES (uuid_generate_v4(), 'tenant_user', 'Tenant User', '["tenant:read", "user:read", "api_key:read"]', true, NOW(), NOW())
      RETURNING id;
    `);
    const tenantUserRoleId = tenantUserRoleIdResult[0].id;

    console.log(`✅ Created roles: admin, user, tenant_admin, tenant_user`);

    // Create system admin user
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    const adminUserIdResult = await queryRunner.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, email_verified, status, created_at, updated_at)
      VALUES (uuid_generate_v4(), 'admin@app.dukat.ai', $1, 'System', 'Administrator', true, 'active', NOW(), NOW())
      RETURNING id;
    `, [passwordHash]);
    const adminUserId = adminUserIdResult[0].id;

    // Assign admin role to system admin
    await queryRunner.query(`
      INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW());
    `, [adminUserId, adminRoleId]);

    console.log(`✅ Created system admin user: admin@app.dukat.ai`);

    // ============================================
    // SEED DATABASE 2: TENANTS & CONFIGURATION
    // ============================================

    console.log('🌱 Seeding tenant data...');

    // Create demo tenant
    const demoTenantIdResult = await queryRunner.query(`
      INSERT INTO tenants (id, name, domain, plan_tier, status, settings, metadata, created_at, updated_at)
      VALUES (uuid_generate_v4(), 'Demo Tenant', 'demo.dukat.ai', 'enterprise', 'active', 
        '{"timezone": "America/New_York", "language": "en-US", "currency": "USD"}'::jsonb,
        '{"demo": true, "onboarding_complete": false}'::jsonb,
        NOW(), NOW())
      RETURNING id;
    `);
    const demoTenantId = demoTenantIdResult[0].id;

    // Create tenant config
    await queryRunner.query(`
      INSERT INTO tenant_configs (id, tenant_id, voice_settings, agent_settings, telephony_settings, integration_settings, version, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 
        '{
          "ttsProvider": "elevenlabs",
          "ttsModel": "eleven_multilingual_v2",
          "sttProvider": "whisper",
          "sttModel": "whisper-large-v3",
          "language": "en-US",
          "voiceId": "21m00Tcm4TlvDq8ikWAM",
          "speakingRate": 1.0,
          "pitch": 0,
          "volumeGainDb": 0,
          "timeoutSeconds": 60,
          "silenceTimeoutMs": 10000
        }'::jsonb,
        '{
          "model": "gpt-4",
          "temperature": 0.7,
          "maxTokens": 2000,
          "systemPrompt": "You are a professional AI assistant for Dukat Voice AI SaaS.",
          "contextWindow": 20,
          "knowledgeBaseIds": [],
          "toolsEnabled": true,
          "fallbackEnabled": true,
          "escalationThreshold": 0.7
        }'::jsonb,
        '{
          "provider": "twilio",
          "sipTrunk": "",
          "callerId": "+15551234567",
          "recordingEnabled": true,
          "recordingStorage": "s3",
          "recordingRetentionDays": 90,
          "emergencyEnabled": true,
          "e911Provider": "rapid_sos",
          "callRouting": {
            "strategy": "round-robin",
            "agents": [],
            "businessHours": {},
            "afterHours": {}
          }
        }'::jsonb,
        '{
          "crm": {
            "provider": "salesforce",
            "apiKey": "",
            "syncContacts": false,
            "syncCalls": false
          },
          "calendar": {
            "provider": "google",
            "apiKey": "",
            "syncAppointments": false
          },
          "communication": {
            "slack": {
              "enabled": false,
              "webhookUrl": "",
              "channel": ""
            },
            "teams": {
              "enabled": false,
              "webhookUrl": ""
            }
          }
        }'::jsonb,
        1, NOW(), NOW());
    `, [demoTenantId]);

    console.log(`✅ Created demo tenant: Demo Tenant`);

    // Create tenant admin user
    const tenantAdminPasswordHash = await bcrypt.hash('TenantAdmin123!', 12);
    const tenantAdminUserIdResult = await queryRunner.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, email_verified, status, created_at, updated_at)
      VALUES (uuid_generate_v4(), 'admin@demo.dukat.ai', $1, 'Demo', 'Admin', true, 'active', NOW(), NOW())
      RETURNING id;
    `, [tenantAdminPasswordHash]);
    const tenantAdminUserId = tenantAdminUserIdResult[0].id;

    // Assign tenant admin role
    await queryRunner.query(`
      INSERT INTO user_roles (id, user_id, role_id, tenant_id, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW());
    `, [tenantAdminUserId, tenantAdminRoleId, demoTenantId]);

    console.log(`✅ Created tenant admin user: admin@demo.dukat.ai`);

    // Create API key for demo tenant
    const apiKeyHash = await bcrypt.hash('dk_demo_api_key_' + Date.now(), 10);
    await queryRunner.query(`
      INSERT INTO api_keys (id, tenant_id, name, key_hash, environment, scopes, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'Demo API Key', $2, 'live', 
        '["tenant:read", "tenant:write", "api_key:manage", "webhook:manage", "config:manage", "call:*", "agent:*"]'::jsonb,
        NOW(), NOW());
    `, [demoTenantId, apiKeyHash]);

    console.log(`✅ Created demo API key`);

    // Create default webhooks
    await queryRunner.query(`
      INSERT INTO webhooks (id, tenant_id, name, url, secret, events, enabled, retry_policy, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), $1, 'Call Events', 'https://demo.dukat.ai/webhooks/call-events', 'demo_webhook_secret_123456', 
          '["call.started", "call.ended", "call.recording.completed"]'::jsonb, false, 
          '{"maxAttempts": 3, "backoffFactor": 2.0}'::jsonb, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'Agent Events', 'https://demo.dukat.ai/webhooks/agent-events', 'demo_webhook_secret_789012', 
          '["agent.message", "agent.escalation"]'::jsonb, false,
          '{"maxAttempts": 5, "backoffFactor": 1.5}'::jsonb, NOW(), NOW());
    `, [demoTenantId]);

    console.log(`✅ Created default webhooks`);

    // Create feature flags
    await queryRunner.query(`
      INSERT INTO feature_flags (id, tenant_id, name, description, enabled, rollout_percentage, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), $1, 'voice_cloning', 'Enable voice cloning feature', false, 0, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'real_time_translation', 'Enable real-time translation', false, 0, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'advanced_analytics', 'Enable advanced analytics dashboard', true, 100, NOW(), NOW());
    `, [demoTenantId]);

    console.log(`✅ Created feature flags`);

    // Create usage quotas
    await queryRunner.query(`
      INSERT INTO usage_quotas (id, tenant_id, resource_type, resource_name, limit_value, current_usage, period, reset_at, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), $1, 'call_minutes', 'Monthly Call Minutes', 10000, 0, 'monthly', 
          (NOW() + INTERVAL '30 days')::timestamp, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'api_requests', 'API Requests per Minute', 1000, 0, 'minute', 
          (NOW() + INTERVAL '1 minute')::timestamp, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'storage_mb', 'Recording Storage (MB)', 10000, 0, 'monthly', 
          (NOW() + INTERVAL '30 days')::timestamp, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'agent_sessions', 'Concurrent Agent Sessions', 10, 0, 'daily', 
          (NOW() + INTERVAL '1 day')::timestamp, NOW(), NOW());
    `, [demoTenantId]);

    console.log(`✅ Created usage quotas`);

    // ============================================
    // SEED DATABASE 3: VOICE INFRASTRUCTURE
    // ============================================

    console.log('🌱 Seeding voice infrastructure data...');

    // Create phone numbers for demo tenant
    const phoneNumber1IdResult = await queryRunner.query(`
      INSERT INTO phone_numbers (id, tenant_id, number, country_code, type, provider, status, capabilities, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), $1, '+15551234567', '+1', 'local', 'twilio', 'active', 
          '{"voice": true, "sms": true, "mms": false, "fax": false}'::jsonb, NOW(), NOW())
      RETURNING id;
    `, [demoTenantId]);
    const phoneNumber1Id = phoneNumber1IdResult[0].id;

    await queryRunner.query(`
      INSERT INTO phone_numbers (id, tenant_id, number, country_code, type, provider, status, capabilities, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), $1, '+18005551234', '+1', 'toll-free', 'twilio', 'active',
          '{"voice": true, "sms": false, "mms": false, "fax": false}'::jsonb, NOW(), NOW());
    `, [demoTenantId]);

    console.log(`✅ Created phone numbers`);

    // Create emergency location
    await queryRunner.query(`
      INSERT INTO emergency_locations (id, tenant_id, phone_number_id, address, city, state, zip_code, country, 
        validation_status, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, $2, '123 Main St', 'New York', 'NY', '10001', 'US', 'validated', NOW(), NOW());
    `, [demoTenantId, phoneNumber1Id]);

    console.log(`✅ Created emergency location`);

    // Create sample calls
    const sampleCallIdResult = await queryRunner.query(`
      INSERT INTO calls (id, tenant_id, call_sid, from_number, to_number, direction, status, started_at, answered_at, 
        ended_at, duration_seconds, metadata, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'CA' || substr(md5(random()::text), 1, 32), '+15557654321', '+15551234567', 'incoming', 
        'completed', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '5 minutes', 300,
        '{"sample": true, "call_quality": "excellent", "sentiment": "positive"}'::jsonb, NOW(), NOW())
      RETURNING id;
    `, [demoTenantId]);
    const sampleCallId = sampleCallIdResult[0].id;

    // Create call segments
    await queryRunner.query(`
      INSERT INTO call_segments (id, call_id, segment_type, started_at, ended_at, duration_seconds, metadata, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'ivr', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes 30 seconds', 30,
        '{"ivr_menu": "main_menu", "selected_option": "speak_to_agent"}'::jsonb, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'agent', NOW() - INTERVAL '9 minutes 30 seconds', NOW() - INTERVAL '5 minutes', 270,
        '{"agent_id": "demo_agent_1", "escalated": false}'::jsonb, NOW(), NOW());
    `, [sampleCallId]);

    // Create call recording
    await queryRunner.query(`
      INSERT INTO call_recordings (id, call_id, recording_sid, url, duration_seconds, file_size_bytes, format, 
        created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'RE' || substr(md5(random()::text), 1, 32), 'https://storage.dukat.ai/recordings/demo.mp3', 
        300, 1024000, 'mp3', NOW(), NOW());
    `, [sampleCallId]);

    console.log(`✅ Created sample call data`);

    // ============================================
    // SEED DATABASE 4: AI AGENTS & CONVERSATIONS
    // ============================================

    console.log('🌱 Seeding AI agents data...');

    // Create demo agent
    const demoAgentIdResult = await queryRunner.query(`
      INSERT INTO agents (id, tenant_id, name, description, model, configuration, status, training_data, 
        performance_metrics, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'Demo Support Agent', 'Demo AI agent for customer support', 'gpt-4',
        '{
          "temperature": 0.7,
          "maxTokens": 2000,
          "systemPrompt": "You are a helpful customer support agent for Dukat Voice AI SaaS.",
          "tools": ["knowledge_base", "calendar", "crm"],
          "knowledgeBases": [],
          "voice": "female",
          "language": "en-US"
        }'::jsonb,
        'active',
        '{
          "conversations": [],
          "intents": {},
          "entities": {}
        }'::jsonb,
        '{
          "totalCalls": 0,
          "averageSatisfaction": 0,
          "escalationRate": 0,
          "averageHandleTime": 0
        }'::jsonb,
        NOW(), NOW())
      RETURNING id;
    `, [demoTenantId]);
    const demoAgentId = demoAgentIdResult[0].id;

    // Create knowledge base
    const knowledgeBaseIdResult = await queryRunner.query(`
      INSERT INTO knowledge_bases (id, tenant_id, name, description, chunking_strategy, chunk_size, chunk_overlap,
        embedding_config, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'Demo Knowledge Base', 'Sample knowledge base for demo purposes', 'chunk', 1000, 200,
        '{"model": "text-embedding-ada-002", "dimensions": 1536, "provider": "openai"}'::jsonb,
        NOW(), NOW())
      RETURNING id;
    `, [demoTenantId]);
    const knowledgeBaseId = knowledgeBaseIdResult[0].id;

    // Create sample documents
    await queryRunner.query(`
      INSERT INTO documents (id, knowledge_base_id, name, description, file_type, file_path, file_size_bytes,
        status, chunk_count, metadata, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'Getting Started Guide', 'Getting started with Dukat Voice AI', 'pdf',
        '/knowledge-base/getting-started.pdf', 204800, 'indexed', 50,
        '{"category": "documentation", "author": "Dukat Team"}'::jsonb, NOW(), NOW()),
        (uuid_generate_v4(), $1, 'API Documentation', 'Complete API reference', 'md',
        '/knowledge-base/api-docs.md', 51200, 'indexed', 25,
        '{"category": "documentation", "version": "1.0"}'::jsonb, NOW(), NOW());
    `, [knowledgeBaseId]);

    // Create sample conversation
    const conversationIdResult = await queryRunner.query(`
      INSERT INTO conversations (id, tenant_id, agent_id, call_id, session_id, status, context, metadata,
        created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, $2, $3, 'demo_session_' || substr(md5(random()::text), 1, 10), 'completed',
        '{
          "userProfile": {"name": "John Doe", "email": "john@example.com"},
          "conversationHistory": [],
          "extractedEntities": {},
          "detectedIntents": []
        }'::jsonb,
        '{"sample": true, "customer_satisfaction": 4.5}'::jsonb,
        NOW(), NOW())
      RETURNING id;
    `, [demoTenantId, demoAgentId, sampleCallId]);
    const conversationId = conversationIdResult[0].id;

    // Create sample messages
    await queryRunner.query(`
      INSERT INTO messages (id, conversation_id, role, content, metadata, created_at)
      VALUES 
        (uuid_generate_v4(), $1, 'user', 'Hello, I need help with setting up my account.', 
          '{"sentiment": 0.8, "entities": {}, "intent": "account_setup", "confidence": 0.9}'::jsonb, NOW()),
        (uuid_generate_v4(), $1, 'assistant', 'Hello! Id be happy to help you set up your account. Could you please provide your email address?',
          '{"sentiment": 0.9, "entities": {}, "intent": "request_information", "confidence": 0.95}'::jsonb, NOW()),
        (uuid_generate_v4(), $1, 'user', 'My email is john@example.com',
          '{"sentiment": 0.7, "entities": {"email": "john@example.com"}, "intent": "provide_information", "confidence": 0.85}'::jsonb, NOW()),
        (uuid_generate_v4(), $1, 'assistant', 'Thank you! Ive found your account. What specific help do you need with the setup?',
          '{"sentiment": 0.9, "entities": {}, "intent": "offer_assistance", "confidence": 0.92}'::jsonb, NOW());
    `, [conversationId]);

    console.log(`✅ Created AI agents and sample conversations`);

    // ============================================
    // SEED DATABASE 5: ANALYTICS & METRICS
    // ============================================

    console.log('🌱 Seeding analytics data...');

    // Create call metrics
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const metricDate = date.toISOString().split('T')[0];

      await queryRunner.query(`
        INSERT INTO call_metrics (id, tenant_id, timestamp, period, metric_date, total_calls, answered_calls, 
          missed_calls, failed_calls, total_duration, average_handle_time, average_wait_time, service_level,
          queue_metrics, created_at)
        VALUES (uuid_generate_v4(), $1, $2, 'day', $3, 
          floor(random() * 100 + 50)::int,
          floor(random() * 80 + 40)::int,
          floor(random() * 15 + 5)::int,
          floor(random() * 5 + 1)::int,
          floor(random() * 18000 + 9000)::int,
          (floor(random() * 300 + 180)::numeric / 100.0),
          (floor(random() * 60 + 30)::numeric / 100.0),
          (floor(random() * 20 + 80)::numeric / 100.0),
          '{
            "averageQueueTime": ' || floor(random() * 45 + 15) || ',
            "maxQueueTime": ' || floor(random() * 300 + 120) || ',
            "abandonedCalls": ' || floor(random() * 10 + 2) || '
          }'::jsonb,
          NOW());
      `, [demoTenantId, date, metricDate]);
    }

    // Create agent metrics
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const metricDate = date.toISOString().split('T')[0];

      await queryRunner.query(`
        INSERT INTO agent_metrics (id, tenant_id, agent_id, timestamp, period, metric_date, calls_handled,
          calls_escalated, total_talk_time, average_handle_time, customer_satisfaction, sentiment_scores,
          created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, 'day', $4,
          floor(random() * 50 + 20)::int,
          floor(random() * 5 + 1)::int,
          floor(random() * 9000 + 3000)::int,
          (floor(random() * 180 + 120)::numeric / 100.0),
          (floor(random() * 2 + 3)::numeric + random()),
          '{
            "positive": ' || floor(random() * 30 + 60) || ',
            "neutral": ' || floor(random() * 20 + 20) || ',
            "negative": ' || floor(random() * 10 + 5) || '
          }'::jsonb,
          NOW());
      `, [demoTenantId, demoAgentId, date, metricDate]);
    }

    // Create voice quality metrics
    for (let i = 0; i < 24; i++) {
      const date = new Date();
      date.setHours(date.getHours() - i);
      const metricDate = date.toISOString().split('T')[0];

      await queryRunner.query(`
        INSERT INTO voice_quality_metrics (id, tenant_id, call_id, timestamp, metric_date, mos_score, packet_loss,
          jitter, latency, codec_metrics, created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4,
          (floor(random() * 2 + 3)::numeric + random()),
          (random() * 0.5)::numeric,
          floor(random() * 20 + 5)::int,
          floor(random() * 100 + 50)::int,
          '{
            "codec": "opus",
            "bitrate": ' || floor(random() * 32 + 16) || ',
            "sampleRate": 48000
          }'::jsonb,
          NOW());
      `, [demoTenantId, sampleCallId, date, metricDate]);
    }

    // Create usage metrics
    const resources = ['call_minutes', 'api_requests', 'storage_mb', 'agent_sessions'];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const metricDate = date.toISOString().split('T')[0];

      for (const resource of resources) {
        await queryRunner.query(`
          INSERT INTO usage_metrics (id, tenant_id, timestamp, metric_date, resource_type, resource_name,
            usage_amount, cost_cents, metadata, created_at)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $4,
            floor(random() * 1000 + 500)::bigint,
            floor(random() * 1000 + 100)::bigint,
            '{"sample": true}'::jsonb,
            NOW());
        `, [demoTenantId, date, metricDate, resource, resource]);
      }
    }

    console.log(`✅ Created analytics and metrics data`);

    // ============================================
    // SEED DATABASE 6: BILLING & SUBSCRIPTIONS
    // ============================================

    console.log('🌱 Seeding billing data...');

    // Create subscription
    const subscriptionIdResult = await queryRunner.query(`
      INSERT INTO subscriptions (id, tenant_id, plan_id, status, current_period_start, current_period_end,
        quantity, metadata, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, 'enterprise_monthly', 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days',
        1, '{"billing_cycle": "monthly", "auto_renew": true}'::jsonb, NOW(), NOW())
      RETURNING id;
    `, [demoTenantId]);
    const subscriptionId = subscriptionIdResult[0].id;

    // Create invoice
    const invoiceIdResult = await queryRunner.query(`
      INSERT INTO invoices (id, tenant_id, subscription_id, invoice_number, invoice_date, due_date, amount_due,
        amount_paid, amount_remaining, currency, status, line_items, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, $2, 'INV-' || substr(md5(random()::text), 1, 8), NOW() - INTERVAL '15 days', 
        NOW() - INTERVAL '5 days', 99900, 99900, 0, 'USD', 'paid',
        '[
          {
            "description": "Enterprise Plan - Monthly Subscription",
            "quantity": 1,
            "unitAmount": 99900,
            "amount": 99900,
            "period": {
              "start": "' || (new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)).toISOString() || '",
              "end": "' || (new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)).toISOString() || '"
            }
          }
        ]'::jsonb,
        NOW(), NOW())
      RETURNING id;
    `, [demoTenantId, subscriptionId]);
    const invoiceId = invoiceIdResult[0].id;

    // Create payment
    await queryRunner.query(`
      INSERT INTO payments (id, tenant_id, invoice_id, payment_method, payment_intent_id, amount, currency,
        status, payment_date, metadata, created_at, updated_at)
      VALUES (uuid_generate_v4(), $1, $2, 'card', 'pi_' || substr(md5(random()::text), 1, 24), 99900, 'USD',
        'succeeded', NOW() - INTERVAL '15 days', '{"card_last4": "4242", "card_brand": "visa"}'::jsonb,
        NOW(), NOW());
    `, [demoTenantId, invoiceId]);

    // Create billing events
    const eventTypes = ['subscription.created', 'invoice.created', 'payment.succeeded', 'usage.recorded'];
    for (let i = 0; i < 10; i++) {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - Math.floor(Math.random() * 30));
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      await queryRunner.query(`
        INSERT INTO billing_events (id, tenant_id, event_type, data, event_date, metadata, created_at)
        VALUES (uuid_generate_v4(), $1, $2, '{"amount": ' || floor(random() * 100000 + 10000) || ', "currency": "USD"}'::jsonb,
          $3, '{"sample": true}'::jsonb, NOW());
      `, [demoTenantId, eventType, eventDate]);
    }

    console.log(`✅ Created billing and subscription data`);

    // ============================================
    // COMMIT TRANSACTION
    // ============================================

    await queryRunner.commitTransaction();
    console.log('✅ Transaction committed successfully');
    console.log('🎉 Seed data process completed successfully!');

    console.log('\n📊 SEED DATA SUMMARY:');
    console.log('====================');
    console.log('✅ 1 System admin user created');
    console.log('✅ 1 Demo tenant with configuration');
    console.log('✅ 1 Tenant admin user created');
    console.log('✅ API keys, webhooks, feature flags created');
    console.log('✅ Phone numbers and emergency locations configured');
    console.log('✅ Sample call data with recordings');
    console.log('✅ AI agent with knowledge base and conversations');
    console.log('✅ 30 days of analytics metrics');
    console.log('✅ Billing subscription with invoices and payments');
    console.log('✅ All data linked with proper foreign key relationships');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error during seed data process:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

// Run seed
seedData().catch((error) => {
  console.error('❌ Failed to seed data:', error);
  process.exit(1);
});