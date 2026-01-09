import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAllTables1689349200001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension for UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Database 1: Authentication & Users
    await this.createAuthTables(queryRunner);
    
    // Database 2: Tenants & Configuration
    await this.createTenantTables(queryRunner);
    
    // Database 3: Voice Infrastructure
    await this.createVoiceTables(queryRunner);
    
    // Database 4: AI Agents & Conversations
    await this.createAgentTables(queryRunner);
    
    // Database 5: Analytics & Metrics
    await this.createAnalyticsTables(queryRunner);
    
    // Database 6: Billing & Subscriptions
    await this.createBillingTables(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order to respect foreign key constraints
    await queryRunner.dropTable('billing_events', true);
    await queryRunner.dropTable('payments', true);
    await queryRunner.dropTable('invoices', true);
    await queryRunner.dropTable('subscriptions', true);
    
    await queryRunner.dropTable('usage_metrics', true);
    await queryRunner.dropTable('voice_quality_metrics', true);
    await queryRunner.dropTable('agent_metrics', true);
    await queryRunner.dropTable('call_metrics', true);
    
    await queryRunner.dropTable('documents', true);
    await queryRunner.dropTable('knowledge_bases', true);
    await queryRunner.dropTable('messages', true);
    await queryRunner.dropTable('conversations', true);
    await queryRunner.dropTable('agents', true);
    
    await queryRunner.dropTable('emergency_locations', true);
    await queryRunner.dropTable('phone_numbers', true);
    await queryRunner.dropTable('call_recordings', true);
    await queryRunner.dropTable('call_segments', true);
    await queryRunner.dropTable('calls', true);
    
    await queryRunner.dropTable('usage_quotas', true);
    await queryRunner.dropTable('feature_flags', true);
    await queryRunner.dropTable('webhook_deliveries', true);
    await queryRunner.dropTable('webhooks', true);
    await queryRunner.dropTable('api_keys', true);
    await queryRunner.dropTable('tenant_configs', true);
    await queryRunner.dropTable('tenants', true);
    
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('sessions', true);
    await queryRunner.dropTable('user_roles', true);
    await queryRunner.dropTable('roles', true);
    await queryRunner.dropTable('users', true);
  }

  private async createAuthTables(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'email',
          type: 'varchar',
          length: '255',
          isUnique: true,
          isNullable: false,
        },
        {
          name: 'password_hash',
          type: 'varchar',
          length: '255',
          isNullable: false,
        },
        {
          name: 'first_name',
          type: 'varchar',
          length: '100',
          isNullable: true,
        },
        {
          name: 'last_name',
          type: 'varchar',
          length: '100',
          isNullable: true,
        },
        {
          name: 'email_verified',
          type: 'boolean',
          default: false,
        },
        {
          name: 'mfa_enabled',
          type: 'boolean',
          default: false,
        },
        {
          name: 'mfa_secret',
          type: 'varchar',
          length: '255',
          isNullable: true,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'active'",
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        },
      ],
    }));

    // Indexes for users
    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_USERS_EMAIL',
      columnNames: ['email'],
      isUnique: true,
    }));

    await queryRunner.createIndex('users', new TableIndex({
      name: 'IDX_USERS_STATUS',
      columnNames: ['status'],
    }));

    // Roles table
    await queryRunner.createTable(new Table({
      name: 'roles',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'name',
          type: 'varchar',
          length: '100',
          isUnique: true,
          isNullable: false,
        },
        {
          name: 'description',
          type: 'varchar',
          length: '255',
          isNullable: true,
        },
        {
          name: 'permissions',
          type: 'jsonb',
          default: "'[]'",
        },
        {
          name: 'is_system',
          type: 'boolean',
          default: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // UserRoles table
    await queryRunner.createTable(new Table({
      name: 'user_roles',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'user_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'role_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Foreign keys for user_roles
    await queryRunner.createForeignKey('user_roles', new TableForeignKey({
      name: 'FK_USER_ROLES_USER_ID',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('user_roles', new TableForeignKey({
      name: 'FK_USER_ROLES_ROLE_ID',
      columnNames: ['role_id'],
      referencedTableName: 'roles',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Sessions table
    await queryRunner.createTable(new Table({
      name: 'sessions',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'user_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'token',
          type: 'varchar',
          length: '512',
          isNullable: false,
        },
        {
          name: 'refresh_token',
          type: 'varchar',
          length: '512',
          isNullable: false,
        },
        {
          name: 'device_id',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'device_type',
          type: 'varchar',
          length: '50',
          isNullable: false,
        },
        {
          name: 'ip_address',
          type: 'varchar',
          length: '45',
          isNullable: false,
        },
        {
          name: 'user_agent',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'expires_at',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'revoked',
          type: 'boolean',
          default: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Indexes for sessions
    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_SESSIONS_USER_ID',
      columnNames: ['user_id'],
    }));
    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_SESSIONS_REFRESH_TOKEN',
      columnNames: ['refresh_token'],
      isUnique: true,
    }));
    await queryRunner.createIndex('sessions', new TableIndex({
      name: 'IDX_SESSIONS_EXPIRES_AT',
      columnNames: ['expires_at'],
    }));

    // Foreign key for sessions
    await queryRunner.createForeignKey('sessions', new TableForeignKey({
      name: 'FK_SESSIONS_USER_ID',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Audit logs table
    await queryRunner.createTable(new Table({
      name: 'audit_logs',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'user_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'action',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'entity_type',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'entity_id',
          type: 'varchar',
          length: '100',
          isNullable: true,
        },
        {
          name: 'old_values',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'new_values',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'ip_address',
          type: 'varchar',
          length: '45',
          isNullable: false,
        },
        {
          name: 'user_agent',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Indexes for audit_logs
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_AUDIT_LOGS_USER_ID',
      columnNames: ['user_id'],
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_AUDIT_LOGS_ENTITY',
      columnNames: ['entity_type', 'entity_id'],
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_AUDIT_LOGS_CREATED_AT',
      columnNames: ['created_at'],
    }));

    // Foreign key for audit_logs
    await queryRunner.createForeignKey('audit_logs', new TableForeignKey({
      name: 'FK_AUDIT_LOGS_USER_ID',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  private async createTenantTables(queryRunner: QueryRunner): Promise<void> {
    // Tenants table
    await queryRunner.createTable(new Table({
      name: 'tenants',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'domain',
          type: 'varchar',
          length: '255',
          isUnique: true,
          isNullable: false,
        },
        {
          name: 'plan_tier',
          type: 'varchar',
          length: '50',
          isNullable: false,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'active'",
        },
        {
          name: 'settings',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'trial_ends_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'subscription_ends_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        },
      ],
    }));

    // Tenant configs table
    await queryRunner.createTable(new Table({
      name: 'tenant_configs',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isUnique: true,
          isNullable: false,
        },
        {
          name: 'voice_settings',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'agent_settings',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'telephony_settings',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'integration_settings',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'version',
          type: 'int',
          default: 1,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // API Keys table
    await queryRunner.createTable(new Table({
      name: 'api_keys',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'key_hash',
          type: 'varchar',
          length: '512',
          isUnique: true,
          isNullable: false,
        },
        {
          name: 'environment',
          type: 'varchar',
          length: '20',
          default: "'live'",
        },
        {
          name: 'scopes',
          type: 'jsonb',
          default: "'[]'",
        },
        {
          name: 'expires_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'last_used_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'last_used_ip',
          type: 'varchar',
          length: '45',
          isNullable: true,
        },
        {
          name: 'is_revoked',
          type: 'boolean',
          default: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Webhooks table
    await queryRunner.createTable(new Table({
      name: 'webhooks',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'url',
          type: 'text',
          isNullable: false,
        },
        {
          name: 'secret',
          type: 'varchar',
          length: '256',
          isNullable: true,
        },
        {
          name: 'events',
          type: 'jsonb',
          default: "'[]'",
        },
        {
          name: 'enabled',
          type: 'boolean',
          default: true,
        },
        {
          name: 'retry_policy',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Webhook deliveries table
    await queryRunner.createTable(new Table({
      name: 'webhook_deliveries',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'webhook_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'event_id',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'event_type',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'payload',
          type: 'jsonb',
          isNullable: false,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'pending'",
        },
        {
          name: 'attempts',
          type: 'int',
          default: 0,
        },
        {
          name: 'max_attempts',
          type: 'int',
          default: 3,
        },
        {
          name: 'next_attempt_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'last_attempt_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'last_response_code',
          type: 'int',
          isNullable: true,
        },
        {
          name: 'last_response_body',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'delivered_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Feature flags table
    await queryRunner.createTable(new Table({
      name: 'feature_flags',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'enabled',
          type: 'boolean',
          default: false,
        },
        {
          name: 'rollout_percentage',
          type: 'int',
          default: 0,
        },
        {
          name: 'target_users',
          type: 'jsonb',
          default: "'[]'",
        },
        {
          name: 'target_segments',
          type: 'jsonb',
          default: "'[]'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Usage quotas table
    await queryRunner.createTable(new Table({
      name: 'usage_quotas',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'resource_type',
          type: 'varchar',
          length: '50',
          isNullable: false,
        },
        {
          name: 'resource_name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'limit_value',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'current_usage',
          type: 'bigint',
          default: 0,
        },
        {
          name: 'period',
          type: 'varchar',
          length: '20',
          default: "'monthly'",
        },
        {
          name: 'reset_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'notifications_sent',
          type: 'jsonb',
          default: "'[]'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create indexes
    await queryRunner.createIndex('tenants', new TableIndex({
      name: 'IDX_TENANTS_DOMAIN',
      columnNames: ['domain'],
      isUnique: true,
    }));

    await queryRunner.createIndex('tenants', new TableIndex({
      name: 'IDX_TENANTS_STATUS',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('api_keys', new TableIndex({
      name: 'IDX_API_KEYS_KEY_HASH',
      columnNames: ['key_hash'],
      isUnique: true,
    }));

    await queryRunner.createIndex('api_keys', new TableIndex({
      name: 'IDX_API_KEYS_TENANT_ENV',
      columnNames: ['tenant_id', 'environment'],
    }));

    await queryRunner.createIndex('webhooks', new TableIndex({
      name: 'IDX_WEBHOOKS_TENANT_ENABLED',
      columnNames: ['tenant_id', 'enabled'],
    }));

    await queryRunner.createIndex('feature_flags', new TableIndex({
      name: 'IDX_FEATURE_FLAGS_TENANT_NAME',
      columnNames: ['tenant_id', 'name'],
      isUnique: true,
    }));

    await queryRunner.createIndex('usage_quotas', new TableIndex({
      name: 'IDX_USAGE_QUOTAS_TENANT_RESOURCE',
      columnNames: ['tenant_id', 'resource_type', 'resource_name'],
      isUnique: true,
    }));

    // Create foreign keys
    await queryRunner.createForeignKey('tenant_configs', new TableForeignKey({
      name: 'FK_TENANT_CONFIGS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('api_keys', new TableForeignKey({
      name: 'FK_API_KEYS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('webhooks', new TableForeignKey({
      name: 'FK_WEBHOOKS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('webhook_deliveries', new TableForeignKey({
      name: 'FK_WEBHOOK_DELIVERIES_WEBHOOK_ID',
      columnNames: ['webhook_id'],
      referencedTableName: 'webhooks',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('feature_flags', new TableForeignKey({
      name: 'FK_FEATURE_FLAGS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('usage_quotas', new TableForeignKey({
      name: 'FK_USAGE_QUOTAS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Foreign key for user_roles to tenants
    await queryRunner.createForeignKey('user_roles', new TableForeignKey({
      name: 'FK_USER_ROLES_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
      isNullable: true, // Tenant ID can be null for system-level roles
    }));
  }

  private async createVoiceTables(queryRunner: QueryRunner): Promise<void> {
    // Calls table
    await queryRunner.createTable(new Table({
      name: 'calls',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'call_sid',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'from_number',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'to_number',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'caller_name',
          type: 'varchar',
          length: '100',
          isNullable: true,
        },
        {
          name: 'direction',
          type: 'varchar',
          length: '10',
          default: "'incoming'",
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'initiated'",
        },
        {
          name: 'started_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'answered_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'ended_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'duration_seconds',
          type: 'int',
          isNullable: true,
        },
        {
          name: 'recording_url',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'transcription_url',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Call segments table
    await queryRunner.createTable(new Table({
      name: 'call_segments',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'call_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'agent_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'segment_type',
          type: 'varchar',
          length: '20',
          default: "'agent'",
        },
        {
          name: 'started_at',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'ended_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'duration_seconds',
          type: 'int',
          isNullable: true,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Call recordings table
    await queryRunner.createTable(new Table({
      name: 'call_recordings',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'call_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'recording_sid',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'url',
          type: 'text',
          isNullable: false,
        },
        {
          name: 'transcription_url',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'duration_seconds',
          type: 'int',
          isNullable: false,
        },
        {
          name: 'file_size_bytes',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'format',
          type: 'varchar',
          length: '10',
          isNullable: false,
        },
        {
          name: 'encrypted',
          type: 'boolean',
          default: false,
        },
        {
          name: 'encryption_key',
          type: 'varchar',
          length: '255',
          isNullable: true,
        },
        {
          name: 'deleted',
          type: 'boolean',
          default: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Phone numbers table
    await queryRunner.createTable(new Table({
      name: 'phone_numbers',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'number',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'country_code',
          type: 'varchar',
          length: '5',
          isNullable: false,
        },
        {
          name: 'type',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'provider',
          type: 'varchar',
          length: '50',
          isNullable: true,
        },
        {
          name: 'provider_sid',
          type: 'varchar',
          length: '100',
          isNullable: true,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'active'",
        },
        {
          name: 'assigned_to',
          type: 'varchar',
          length: '100',
          isNullable: true,
        },
        {
          name: 'capabilities',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Emergency locations table
    await queryRunner.createTable(new Table({
      name: 'emergency_locations',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'phone_number_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'address',
          type: 'varchar',
          length: '255',
          isNullable: false,
        },
        {
          name: 'unit_number',
          type: 'varchar',
          length: '50',
          isNullable: true,
        },
        {
          name: 'city',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'state',
          type: 'varchar',
          length: '50',
          isNullable: false,
        },
        {
          name: 'zip_code',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'country',
          type: 'varchar',
          length: '50',
          isNullable: false,
        },
        {
          name: 'latitude',
          type: 'decimal',
          precision: 10,
          scale: 8,
          isNullable: true,
        },
        {
          name: 'longitude',
          type: 'decimal',
          precision: 11,
          scale: 8,
          isNullable: true,
        },
        {
          name: 'validation_status',
          type: 'varchar',
          length: '20',
          default: "'pending'",
        },
        {
          name: 'validation_id',
          type: 'varchar',
          length: '100',
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create indexes
    await queryRunner.createIndex('calls', new TableIndex({
      name: 'IDX_CALLS_TENANT_STATUS',
      columnNames: ['tenant_id', 'status'],
    }));

    await queryRunner.createIndex('calls', new TableIndex({
      name: 'IDX_CALLS_CALL_SID',
      columnNames: ['call_sid'],
      isUnique: true,
    }));

    await queryRunner.createIndex('calls', new TableIndex({
      name: 'IDX_CALLS_CREATED_AT',
      columnNames: ['created_at'],
    }));

    await queryRunner.createIndex('call_segments', new TableIndex({
      name: 'IDX_CALL_SEGMENTS_CALL_ID',
      columnNames: ['call_id'],
    }));

    await queryRunner.createIndex('call_recordings', new TableIndex({
      name: 'IDX_CALL_RECORDINGS_CALL_ID',
      columnNames: ['call_id'],
    }));

    await queryRunner.createIndex('phone_numbers', new TableIndex({
      name: 'IDX_PHONE_NUMBERS_TENANT_NUMBER',
      columnNames: ['tenant_id', 'number'],
      isUnique: true,
    }));

    await queryRunner.createIndex('emergency_locations', new TableIndex({
      name: 'IDX_EMERGENCY_LOCATIONS_PHONE_NUMBER_ID',
      columnNames: ['phone_number_id'],
    }));

    // Create foreign keys
    await queryRunner.createForeignKey('calls', new TableForeignKey({
      name: 'FK_CALLS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('call_segments', new TableForeignKey({
      name: 'FK_CALL_SEGMENTS_CALL_ID',
      columnNames: ['call_id'],
      referencedTableName: 'calls',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('call_recordings', new TableForeignKey({
      name: 'FK_CALL_RECORDINGS_CALL_ID',
      columnNames: ['call_id'],
      referencedTableName: 'calls',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('phone_numbers', new TableForeignKey({
      name: 'FK_PHONE_NUMBERS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('emergency_locations', new TableForeignKey({
      name: 'FK_EMERGENCY_LOCATIONS_PHONE_NUMBER_ID',
      columnNames: ['phone_number_id'],
      referencedTableName: 'phone_numbers',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  private async createAgentTables(queryRunner: QueryRunner): Promise<void> {
    // Agents table
    await queryRunner.createTable(new Table({
      name: 'agents',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'model',
          type: 'varchar',
          length: '50',
          default: "'gpt-3.5-turbo'",
        },
        {
          name: 'configuration',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'draft'",
        },
        {
          name: 'training_data',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'performance_metrics',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Conversations table
    await queryRunner.createTable(new Table({
      name: 'conversations',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'agent_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'call_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'session_id',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'active'",
        },
        {
          name: 'context',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Messages table
    await queryRunner.createTable(new Table({
      name: 'messages',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'conversation_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'role',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'content',
          type: 'text',
          isNullable: false,
        },
        {
          name: 'audio_url',
          type: 'varchar',
          length: '500',
          isNullable: true,
        },
        {
          name: 'transcription',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Knowledge bases table
    await queryRunner.createTable(new Table({
      name: 'knowledge_bases',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'chunking_strategy',
          type: 'varchar',
          length: '20',
          default: "'chunk'",
        },
        {
          name: 'chunk_size',
          type: 'int',
          default: 1000,
        },
        {
          name: 'chunk_overlap',
          type: 'int',
          default: 200,
        },
        {
          name: 'document_count',
          type: 'int',
          default: 0,
        },
        {
          name: 'total_size_bytes',
          type: 'bigint',
          default: 0,
        },
        {
          name: 'embedding_config',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Documents table
    await queryRunner.createTable(new Table({
      name: 'documents',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'knowledge_base_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'name',
          type: 'varchar',
          length: '255',
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'file_type',
          type: 'varchar',
          length: '10',
          isNullable: false,
        },
        {
          name: 'file_path',
          type: 'text',
          isNullable: false,
        },
        {
          name: 'file_size_bytes',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'pending'",
        },
        {
          name: 'chunk_count',
          type: 'int',
          default: 0,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create indexes
    await queryRunner.createIndex('agents', new TableIndex({
      name: 'IDX_AGENTS_TENANT_STATUS',
      columnNames: ['tenant_id', 'status'],
    }));

    await queryRunner.createIndex('conversations', new TableIndex({
      name: 'IDX_CONVERSATIONS_SESSION_ID',
      columnNames: ['session_id'],
    }));

    await queryRunner.createIndex('conversations', new TableIndex({
      name: 'IDX_CONVERSATIONS_TENANT_STATUS',
      columnNames: ['tenant_id', 'status'],
    }));

    await queryRunner.createIndex('messages', new TableIndex({
      name: 'IDX_MESSAGES_CONVERSATION_ID',
      columnNames: ['conversation_id'],
    }));

    await queryRunner.createIndex('knowledge_bases', new TableIndex({
      name: 'IDX_KNOWLEDGE_BASES_TENANT_NAME',
      columnNames: ['tenant_id', 'name'],
    }));

    await queryRunner.createIndex('documents', new TableIndex({
      name: 'IDX_DOCUMENTS_KNOWLEDGE_BASE_ID',
      columnNames: ['knowledge_base_id'],
    }));

    // Create foreign keys
    await queryRunner.createForeignKey('agents', new TableForeignKey({
      name: 'FK_AGENTS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('conversations', new TableForeignKey({
      name: 'FK_CONVERSATIONS_AGENT_ID',
      columnNames: ['agent_id'],
      referencedTableName: 'agents',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('conversations', new TableForeignKey({
      name: 'FK_CONVERSATIONS_CALL_ID',
      columnNames: ['call_id'],
      referencedTableName: 'calls',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('messages', new TableForeignKey({
      name: 'FK_MESSAGES_CONVERSATION_ID',
      columnNames: ['conversation_id'],
      referencedTableName: 'conversations',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('knowledge_bases', new TableForeignKey({
      name: 'FK_KNOWLEDGE_BASES_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('documents', new TableForeignKey({
      name: 'FK_DOCUMENTS_KNOWLEDGE_BASE_ID',
      columnNames: ['knowledge_base_id'],
      referencedTableName: 'knowledge_bases',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  private async createAnalyticsTables(queryRunner: QueryRunner): Promise<void> {
    // Call metrics table
    await queryRunner.createTable(new Table({
      name: 'call_metrics',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'period',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'total_calls',
          type: 'int',
          default: 0,
        },
        {
          name: 'answered_calls',
          type: 'int',
          default: 0,
        },
        {
          name: 'missed_calls',
          type: 'int',
          default: 0,
        },
        {
          name: 'failed_calls',
          type: 'int',
          default: 0,
        },
        {
          name: 'total_duration',
          type: 'int',
          default: 0,
        },
        {
          name: 'average_handle_time',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
        },
        {
          name: 'average_wait_time',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
        },
        {
          name: 'service_level',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
        },
        {
          name: 'queue_metrics',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'metric_date',
          type: 'varchar',
          length: '10',
          isNullable: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Agent metrics table
    await queryRunner.createTable(new Table({
      name: 'agent_metrics',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'agent_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'period',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'calls_handled',
          type: 'int',
          default: 0,
        },
        {
          name: 'calls_escalated',
          type: 'int',
          default: 0,
        },
        {
          name: 'total_talk_time',
          type: 'int',
          default: 0,
        },
        {
          name: 'average_handle_time',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
        },
        {
          name: 'customer_satisfaction',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
        },
        {
          name: 'sentiment_scores',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'metric_date',
          type: 'varchar',
          length: '10',
          isNullable: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Voice quality metrics table
    await queryRunner.createTable(new Table({
      name: 'voice_quality_metrics',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'call_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'mos_score',
          type: 'decimal',
          precision: 4,
          scale: 2,
          isNullable: false,
        },
        {
          name: 'packet_loss',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
        },
        {
          name: 'jitter',
          type: 'int',
          isNullable: false,
        },
        {
          name: 'latency',
          type: 'int',
          isNullable: false,
        },
        {
          name: 'codec_metrics',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'metric_date',
          type: 'varchar',
          length: '10',
          isNullable: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Usage metrics table
    await queryRunner.createTable(new Table({
      name: 'usage_metrics',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'resource_type',
          type: 'varchar',
          length: '50',
          isNullable: false,
        },
        {
          name: 'resource_name',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'usage_amount',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'cost_cents',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'metric_date',
          type: 'varchar',
          length: '10',
          isNullable: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create indexes
    await queryRunner.createIndex('call_metrics', new TableIndex({
      name: 'IDX_CALL_METRICS_TENANT_DATE',
      columnNames: ['tenant_id', 'metric_date'],
    }));

    await queryRunner.createIndex('call_metrics', new TableIndex({
      name: 'IDX_CALL_METRICS_TIMESTAMP',
      columnNames: ['timestamp'],
    }));

    await queryRunner.createIndex('agent_metrics', new TableIndex({
      name: 'IDX_AGENT_METRICS_TENANT_AGENT_DATE',
      columnNames: ['tenant_id', 'agent_id', 'metric_date'],
    }));

    await queryRunner.createIndex('voice_quality_metrics', new TableIndex({
      name: 'IDX_VOICE_QUALITY_METRICS_TENANT_DATE',
      columnNames: ['tenant_id', 'metric_date'],
    }));

    await queryRunner.createIndex('usage_metrics', new TableIndex({
      name: 'IDX_USAGE_METRICS_TENANT_RESOURCE_DATE',
      columnNames: ['tenant_id', 'resource_type', 'metric_date'],
    }));

    // Create foreign keys
    await queryRunner.createForeignKey('call_metrics', new TableForeignKey({
      name: 'FK_CALL_METRICS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('agent_metrics', new TableForeignKey({
      name: 'FK_AGENT_METRICS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('agent_metrics', new TableForeignKey({
      name: 'FK_AGENT_METRICS_AGENT_ID',
      columnNames: ['agent_id'],
      referencedTableName: 'agents',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('voice_quality_metrics', new TableForeignKey({
      name: 'FK_VOICE_QUALITY_METRICS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('voice_quality_metrics', new TableForeignKey({
      name: 'FK_VOICE_QUALITY_METRICS_CALL_ID',
      columnNames: ['call_id'],
      referencedTableName: 'calls',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('usage_metrics', new TableForeignKey({
      name: 'FK_USAGE_METRICS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  private async createBillingTables(queryRunner: QueryRunner): Promise<void> {
    // Subscriptions table
    await queryRunner.createTable(new Table({
      name: 'subscriptions',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'plan_id',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'current_period_start',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'current_period_end',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'canceled_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'trial_ends_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'quantity',
          type: 'int',
          default: 1,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Invoices table
    await queryRunner.createTable(new Table({
      name: 'invoices',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'subscription_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'invoice_number',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'invoice_date',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'due_date',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'amount_due',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'amount_paid',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'amount_remaining',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'currency',
          type: 'varchar',
          length: '3',
          isNullable: false,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'draft'",
        },
        {
          name: 'line_items',
          type: 'jsonb',
          default: "'[]'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Payments table
    await queryRunner.createTable(new Table({
      name: 'payments',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'invoice_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'payment_method',
          type: 'varchar',
          length: '20',
          isNullable: false,
        },
        {
          name: 'payment_intent_id',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'amount',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'currency',
          type: 'varchar',
          length: '3',
          isNullable: false,
        },
        {
          name: 'status',
          type: 'varchar',
          length: '20',
          default: "'pending'",
        },
        {
          name: 'payment_date',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Billing events table
    await queryRunner.createTable(new Table({
      name: 'billing_events',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'tenant_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'event_type',
          type: 'varchar',
          length: '100',
          isNullable: false,
        },
        {
          name: 'data',
          type: 'jsonb',
          isNullable: false,
        },
        {
          name: 'event_date',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create indexes
    await queryRunner.createIndex('subscriptions', new TableIndex({
      name: 'IDX_SUBSCRIPTIONS_TENANT_STATUS',
      columnNames: ['tenant_id', 'status'],
    }));

    await queryRunner.createIndex('invoices', new TableIndex({
      name: 'IDX_INVOICES_TENANT_STATUS',
      columnNames: ['tenant_id', 'status'],
    }));

    await queryRunner.createIndex('invoices', new TableIndex({
      name: 'IDX_INVOICES_INVOICE_NUMBER',
      columnNames: ['invoice_number'],
      isUnique: true,
    }));

    await queryRunner.createIndex('payments', new TableIndex({
      name: 'IDX_PAYMENTS_TENANT_STATUS',
      columnNames: ['tenant_id', 'status'],
    }));

    await queryRunner.createIndex('billing_events', new TableIndex({
      name: 'IDX_BILLING_EVENTS_TENANT_EVENT_DATE',
      columnNames: ['tenant_id', 'event_date'],
    }));

    // Create foreign keys
    await queryRunner.createForeignKey('subscriptions', new TableForeignKey({
      name: 'FK_SUBSCRIPTIONS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('invoices', new TableForeignKey({
      name: 'FK_INVOICES_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('invoices', new TableForeignKey({
      name: 'FK_INVOICES_SUBSCRIPTION_ID',
      columnNames: ['subscription_id'],
      referencedTableName: 'subscriptions',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('payments', new TableForeignKey({
      name: 'FK_PAYMENTS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('payments', new TableForeignKey({
      name: 'FK_PAYMENTS_INVOICE_ID',
      columnNames: ['invoice_id'],
      referencedTableName: 'invoices',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('billing_events', new TableForeignKey({
      name: 'FK_BILLING_EVENTS_TENANT_ID',
      columnNames: ['tenant_id'],
      referencedTableName: 'tenants',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }
}