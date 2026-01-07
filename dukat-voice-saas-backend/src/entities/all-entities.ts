import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity, TenantEntity } from './shared/BaseEntity';

// ============================================
// DATABASE 1: AUTHENTICATION & USERS
// ============================================

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({ default: false, name: 'email_verified' })
  emailVerified!: boolean;

  @Column({ default: false, name: 'mfa_enabled' })
  mfaEnabled!: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'mfa_secret' })
  mfaSecret?: string;

  @Column({ default: 'active' })
  status!: 'active' | 'suspended' | 'deleted';

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles!: UserRole[];

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs!: AuditLog[];
}

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  permissions!: string[];

  @Column({ default: true, name: 'is_system' })
  isSystem!: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles!: UserRole[];
}

@Entity('user_roles')
export class UserRole extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'role_id' })
  roleId!: string;

  @Column({ nullable: true, name: 'tenant_id' })
  tenantId?: string;

  @ManyToOne(() => User, (user) => user.roles)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Tenant, (tenant) => tenant.userRoles)
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;
}

@Entity('sessions')
export class Session extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  token!: string;

  @Column({ name: 'refresh_token' })
  refreshToken!: string;

  @Column({ name: 'device_id' })
  deviceId!: string;

  @Column({ name: 'device_type' })
  deviceType!: string;

  @Column({ name: 'ip_address' })
  ipAddress!: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ default: false })
  revoked!: boolean;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  action!: string;

  @Column({ name: 'entity_type' })
  entityType!: string;

  @Column({ nullable: true, name: 'entity_id' })
  entityId?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
  oldValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
  newValues?: Record<string, any>;

  @Column({ name: 'ip_address' })
  ipAddress!: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent?: string;

  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

// ============================================
// DATABASE 2: TENANTS & CONFIGURATION
// ============================================

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  domain!: string;

  @Column({ name: 'plan_tier' })
  planTier!: 'starter' | 'business' | 'enterprise';

  @Column({ default: 'active' })
  status!: 'active' | 'suspended' | 'pending' | 'inactive';

  @Column({ type: 'jsonb', default: {} })
  settings!: {
    timezone: string;
    language: string;
    currency: string;
    businessHours: Record<string, any>;
  };

  @Column({ type: 'timestamp', nullable: true, name: 'trial_ends_at' })
  trialEndsAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'subscription_ends_at' })
  subscriptionEndsAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @OneToMany(() => TenantConfig, (config) => config.tenant)
  config!: TenantConfig[]; // Changed to OneToMany as TenantConfig has a unique tenantId

  @OneToMany(() => ApiKey, (apiKey) => apiKey.tenant)
  apiKeys!: ApiKey[];

  @OneToMany(() => Webhook, (webhook) => webhook.tenant)
  webhooks!: Webhook[];

  @OneToMany(() => FeatureFlag, (featureFlag) => featureFlag.tenant)
  featureFlags!: FeatureFlag[];

  @OneToMany(() => UsageQuota, (quota) => quota.tenant)
  quotas!: UsageQuota[];

  @OneToMany(() => UserRole, (userRole) => userRole.tenant)
  userRoles!: UserRole[];
}

@Entity('tenant_configs')
export class TenantConfig extends BaseEntity {
  @Column({ unique: true, name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'jsonb', default: {}, name: 'voice_settings' })
  voiceSettings!: {
    ttsProvider: 'elevenlabs' | 'google' | 'amazon';
    ttsModel: string;
    sttProvider: 'whisper' | 'google' | 'amazon';
    sttModel: string;
    language: string;
    voiceId: string;
    speakingRate: number;
    pitch: number;
    volumeGainDb: number;
    timeoutSeconds: number;
    silenceTimeoutMs: number;
  };

  @Column({ type: 'jsonb', default: {}, name: 'agent_settings' })
  agentSettings!: {
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-2' | 'llama-2';
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    contextWindow: number;
    knowledgeBaseIds: string[];
    toolsEnabled: boolean;
    fallbackEnabled: boolean;
    escalationThreshold: number;
  };

  @Column({ type: 'jsonb', default: {}, name: 'telephony_settings' })
  telephonySettings!: {
    provider: 'twilio' | 'bandwidth' | 'vonage' | 'custom';
    sipTrunk: string;
    callerId: string;
    recordingEnabled: boolean;
    recordingStorage: 's3' | 'gcs' | 'azure';
    recordingRetentionDays: number;
    emergencyEnabled: boolean;
    e911Provider: string;
    callRouting: Record<string, any>;
  };

  @Column({ type: 'jsonb', default: {}, name: 'integration_settings' })
  integrationSettings!: {
    crm: Record<string, any>;
    calendar: Record<string, any>;
    communication: Record<string, any>;
  };

  @Column({ default: 1 })
  version!: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.config)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column({ unique: true, name: 'key_hash' })
  keyHash!: string;

  @Column({ default: 'live' })
  environment!: 'live' | 'test' | 'development';

  @Column({ type: 'jsonb', default: [] })
  scopes!: string[];

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @Column({ nullable: true, name: 'last_used_ip' })
  lastUsedIp?: string;

  @Column({ default: false, name: 'is_revoked' })
  isRevoked!: boolean;

  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  secret?: string;

  @Column({ type: 'jsonb', default: [] })
  events!: string[];

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'jsonb', default: {}, name: 'retry_policy' })
  retryPolicy!: {
    maxAttempts: number;
    backoffFactor: number;
  };

  @ManyToOne(() => Tenant, (tenant) => tenant.webhooks)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToMany(() => WebhookDelivery, (delivery) => delivery.webhook)
  deliveries!: WebhookDelivery[];
}

@Entity('webhook_deliveries')
export class WebhookDelivery extends BaseEntity {
  @Column({ name: 'webhook_id' })
  webhookId!: string;

  @Column({ name: 'event_id' })
  eventId!: string;

  @Column({ name: 'event_type' })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ default: 'pending' })
  status!: 'pending' | 'success' | 'failed' | 'retrying';

  @Column({ default: 0 })
  attempts!: number;

  @Column({ default: 3, name: 'max_attempts' })
  maxAttempts!: number;

  @Column({ type: 'timestamp', nullable: true, name: 'next_attempt_at' })
  nextAttemptAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_attempt_at' })
  lastAttemptAt?: Date;

  @Column({ nullable: true, name: 'last_response_code' })
  lastResponseCode?: number;

  @Column({ type: 'text', nullable: true, name: 'last_response_body' })
  lastResponseBody?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @ManyToOne(() => Webhook, (webhook) => webhook.deliveries)
  @JoinColumn({ name: 'webhook_id' })
  webhook!: Webhook;
}

@Entity('feature_flags')
export class FeatureFlag extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  enabled!: boolean;

  @Column({ default: 0, name: 'rollout_percentage' })
  rolloutPercentage!: number;

  @Column({ type: 'jsonb', default: [], name: 'target_users' })
  targetUsers!: string[];

  @Column({ type: 'jsonb', default: [], name: 'target_segments' })
  targetSegments!: string[];

  @ManyToOne(() => Tenant, (tenant) => tenant.featureFlags)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

@Entity('usage_quotas')
export class UsageQuota extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'resource_type' })
  resourceType!: 'call_minutes' | 'api_requests' | 'storage_mb' | 'agent_sessions';

  @Column({ name: 'resource_name' })
  resourceName!: string;

  @Column('bigint', { name: 'limit_value' })
  limitValue!: number;

  @Column('bigint', { default: 0, name: 'current_usage' })
  currentUsage!: number;

  @Column({ default: 'monthly' })
  period!: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @Column({ type: 'timestamp', nullable: true, name: 'reset_at' })
  resetAt?: Date;

  @Column({ type: 'jsonb', default: [], name: 'notifications_sent' })
  notificationsSent!: Array<{
    type: string;
    sentAt: Date;
    threshold: number;
  }>;

  @ManyToOne(() => Tenant, (tenant) => tenant.quotas)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

// ============================================
// DATABASE 3: VOICE INFRASTRUCTURE
// ============================================

@Entity('calls')
export class Call extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'call_sid' })
  callSid!: string;

  @Column({ name: 'from_number' })
  fromNumber!: string;

  @Column({ name: 'to_number' })
  toNumber!: string;

  @Column({ nullable: true, name: 'caller_name' })
  callerName?: string;

  @Column({ default: 'incoming' })
  direction!: 'incoming' | 'outgoing';

  @Column({ default: 'initiated' })
  status!: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'answered_at' })
  answeredAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
  endedAt?: Date;

  @Column({ type: 'int', nullable: true, name: 'duration_seconds' })
  durationSeconds?: number;

  @Column({ nullable: true, name: 'recording_url' })
  recordingUrl?: string;

  @Column({ nullable: true, name: 'transcription_url' })
  transcriptionUrl?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @OneToMany(() => CallSegment, (segment) => segment.call)
  segments!: CallSegment[];

  @OneToMany(() => CallRecording, (recording) => recording.call)
  recordings!: CallRecording[];
}

@Entity('call_segments')
export class CallSegment extends BaseEntity {
  @Column({ name: 'call_id' })
  callId!: string;

  @Column({ nullable: true, name: 'agent_id' })
  agentId?: string;

  @Column({ default: 'agent', name: 'segment_type' })
  segmentType!: 'agent' | 'ivr' | 'hold' | 'transfer';

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
  endedAt?: Date;

  @Column({ type: 'int', nullable: true, name: 'duration_seconds' })
  durationSeconds?: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Call, (call) => call.segments)
  @JoinColumn({ name: 'call_id' })
  call!: Call;
}

@Entity('call_recordings')
export class CallRecording extends BaseEntity {
  @Column({ name: 'call_id' })
  callId!: string;

  @Column({ name: 'recording_sid' })
  recordingSid!: string;

  @Column()
  url!: string;

  @Column({ nullable: true, name: 'transcription_url' })
  transcriptionUrl?: string;

  @Column({ name: 'duration_seconds' })
  durationSeconds!: number;

  @Column({ name: 'file_size_bytes' })
  fileSizeBytes!: number;

  @Column()
  format!: 'mp3' | 'wav';

  @Column({ default: false })
  encrypted!: boolean;

  @Column({ nullable: true, name: 'encryption_key' })
  encryptionKey?: string;

  @Column({ default: false })
  deleted!: boolean;

  @ManyToOne(() => Call, (call) => call.recordings)
  @JoinColumn({ name: 'call_id' })
  call!: Call;
}

@Entity('phone_numbers')
export class PhoneNumber extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  number!: string;

  @Column({ name: 'country_code' })
  countryCode!: string;

  @Column()
  type!: 'local' | 'toll-free' | 'mobile';

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true, name: 'provider_sid' })
  providerSid?: string;

  @Column({ default: 'active' })
  status!: 'active' | 'pending' | 'suspended' | 'released';

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo?: string;

  @Column({ type: 'jsonb', default: {} })
  capabilities!: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };

  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys) // Assuming phone numbers are linked to tenants
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToMany(() => EmergencyLocation, (location) => location.phoneNumber)
  emergencyLocations!: EmergencyLocation[];
}

@Entity('emergency_locations')
export class EmergencyLocation extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'phone_number_id' })
  phoneNumberId!: string;

  @Column()
  address!: string;

  @Column({ nullable: true, name: 'unit_number' })
  unitNumber?: string;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @Column()
  zipCode!: string;

  @Column()
  country!: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ default: 'pending', name: 'validation_status' })
  validationStatus!: 'pending' | 'validated' | 'failed';

  @Column({ nullable: true, name: 'validation_id' })
  validationId?: string;

  @ManyToOne(() => PhoneNumber, (phoneNumber) => phoneNumber.emergencyLocations)
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber!: PhoneNumber;
}

// ============================================
// DATABASE 4: AI AGENTS & CONVERSATIONS
// ============================================

@Entity('agents')
export class Agent extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'gpt-3.5-turbo' })
  model!: string;

  @Column({ type: 'jsonb', default: {} })
  configuration!: {
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    tools: string[];
    knowledgeBases: string[];
    voice: string;
    language: string;
  };

  @Column({ default: 'draft' })
  status!: 'draft' | 'active' | 'inactive' | 'training';

  @Column({ type: 'jsonb', default: {}, name: 'training_data' })
  trainingData!: {
    conversations: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
    intents: Record<string, any>;
    entities: Record<string, any>;
  };

  @Column({ type: 'jsonb', default: {}, name: 'performance_metrics' })
  performanceMetrics!: {
    totalCalls: number;
    averageSatisfaction: number;
    escalationRate: number;
    averageHandleTime: number;
  };

  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys) // Assuming agents are linked to tenants
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToMany(() => Conversation, (conversation) => conversation.agent)
  conversations!: Conversation[];
}

@Entity('conversations')
export class Conversation extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ nullable: true, name: 'agent_id' })
  agentId?: string;

  @Column({ nullable: true, name: 'call_id' })
  callId?: string;

  @Column({ name: 'session_id' })
  sessionId!: string;

  @Column({ default: 'active' })
  status!: 'active' | 'completed' | 'escalated' | 'failed';

  @Column({ type: 'jsonb', default: {} })
  context!: {
    userProfile: Record<string, any>;
    conversationHistory: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: Date;
    }>;
    extractedEntities: Record<string, any>;
    detectedIntents: string[];
  };

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Agent, (agent) => agent.conversations)
  @JoinColumn({ name: 'agent_id' })
  agent!: Agent;

  @ManyToOne(() => Call, (call) => call.segments) // Assuming conversations can be linked to calls
  @JoinColumn({ name: 'call_id' })
  call?: Call;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];
}

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @Column()
  role!: 'user' | 'assistant' | 'system';

  @Column('text')
  content!: string;

  @Column({ type: 'varchar', nullable: true, name: 'audio_url' })
  audioUrl?: string;

  @Column({ nullable: true })
  transcription?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: {
    sentiment: number;
    entities: Record<string, any>;
    intent: string;
    confidence: number;
  };

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;
}

@Entity('knowledge_bases')
export class KnowledgeBase extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'chunk', name: 'chunking_strategy' })
  chunkingStrategy!: 'chunk' | 'sentence' | 'paragraph';

  @Column({ default: 1000, name: 'chunk_size' })
  chunkSize!: number;

  @Column({ default: 200, name: 'chunk_overlap' })
  chunkOverlap!: number;

  @Column({ default: 0, name: 'document_count' })
  documentCount!: number;

  @Column('bigint', { default: 0, name: 'total_size_bytes' })
  totalSizeBytes!: number;

  @Column({ type: 'jsonb', default: {}, name: 'embedding_config' })
  embeddingConfig!: {
    model: string;
    dimensions: number;
    provider: 'openai' | 'cohere' | 'huggingface';
  };

  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys) // Assuming knowledge bases are linked to tenants
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToMany(() => Document, (document) => document.knowledgeBase)
  documents!: Document[];
}

@Entity('documents')
export class Document extends BaseEntity {
  @Column({ name: 'knowledge_base_id' })
  knowledgeBaseId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'file_type' })
  fileType!: 'pdf' | 'txt' | 'docx' | 'html' | 'md';

  @Column({ name: 'file_path' })
  filePath!: string;

  @Column('bigint', { name: 'file_size_bytes' })
  fileSizeBytes!: number;

  @Column({ default: 'pending' })
  status!: 'pending' | 'processing' | 'indexed' | 'failed';

  @Column({ type: 'int', default: 0, name: 'chunk_count' })
  chunkCount!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => KnowledgeBase, (knowledgeBase) => knowledgeBase.documents)
  @JoinColumn({ name: 'knowledge_base_id' })
  knowledgeBase!: KnowledgeBase;
}

// ============================================
// DATABASE 5: ANALYTICS & METRICS
// ============================================

@Entity('call_metrics')
export class CallMetric extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column()
  period!: 'minute' | 'hour' | 'day' | 'week' | 'month';

  @Column({ type: 'int', default: 0, name: 'total_calls' })
  totalCalls!: number;

  @Column({ type: 'int', default: 0, name: 'answered_calls' })
  answeredCalls!: number;

  @Column({ type: 'int', default: 0, name: 'missed_calls' })
  missedCalls!: number;

  @Column({ type: 'int', default: 0, name: 'failed_calls' })
  failedCalls!: number;

  @Column({ type: 'int', default: 0, name: 'total_duration' })
  totalDuration!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'average_handle_time' })
  averageHandleTime!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'average_wait_time' })
  averageWaitTime!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'service_level' })
  serviceLevel!: number;

  @Column({ type: 'jsonb', default: {}, name: 'queue_metrics' })
  queueMetrics!: {
    averageQueueTime: number;
    maxQueueTime: number;
    abandonedCalls: number;
  };

  @Index()
  @Column({ name: 'metric_date' })
  metricDate!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

@Entity('agent_metrics')
export class AgentMetric extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ nullable: true, name: 'agent_id' })
  agentId?: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column()
  period!: 'minute' | 'hour' | 'day' | 'week' | 'month';

  @Column({ type: 'int', default: 0, name: 'calls_handled' })
  callsHandled!: number;

  @Column({ type: 'int', default: 0, name: 'calls_escalated' })
  callsEscalated!: number;

  @Column({ type: 'int', default: 0, name: 'total_talk_time' })
  totalTalkTime!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'average_handle_time' })
  averageHandleTime!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'customer_satisfaction' })
  customerSatisfaction!: number;

  @Column({ type: 'jsonb', default: {}, name: 'sentiment_scores' })
  sentimentScores!: {
    positive: number;
    neutral: number;
    negative: number;
  };

  @Index()
  @Column({ name: 'metric_date' })
  metricDate!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Agent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;
}

@Entity('voice_quality_metrics')
export class VoiceQualityMetric extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ nullable: true, name: 'call_id' })
  callId?: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ type: 'decimal', precision: 4, scale: 2, name: 'mos_score' })
  mosScore!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'packet_loss' })
  packetLoss!: number;

  @Column({ type: 'int' })
  jitter!: number;

  @Column({ type: 'int' })
  latency!: number;

  @Column({ type: 'jsonb', default: {}, name: 'codec_metrics' })
  codecMetrics!: {
    codec: string;
    bitrate: number;
    sampleRate: number;
  };

  @Index()
  @Column({ name: 'metric_date' })
  metricDate!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'call_id' })
  call?: Call;
}

@Entity('usage_metrics')
export class UsageMetric extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ name: 'resource_type' })
  resourceType!: string;

  @Column({ name: 'resource_name' })
  resourceName!: string;

  @Column('bigint', { name: 'usage_amount' })
  usageAmount!: number;

  @Column('bigint', { name: 'cost_cents' })
  costCents!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @Index()
  @Column({ name: 'metric_date' })
  metricDate!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

// ============================================
// DATABASE 6: BILLING & SUBSCRIPTIONS
// ============================================

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'plan_id' })
  planId!: string;

  @Column()
  status!: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';

  @Column({ type: 'timestamp', name: 'current_period_start' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamp', name: 'current_period_end' })
  currentPeriodEnd!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'canceled_at' })
  canceledAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'trial_ends_at' })
  trialEndsAt?: Date;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys) // Assuming subscriptions are linked to tenants
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToMany(() => Invoice, (invoice) => invoice.subscription)
  invoices!: Invoice[];
}

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ nullable: true, name: 'subscription_id' })
  subscriptionId?: string;

  @Column({ name: 'invoice_number' })
  invoiceNumber!: string;

  @Column({ type: 'timestamp', name: 'invoice_date' })
  invoiceDate!: Date;

  @Column({ type: 'timestamp', name: 'due_date' })
  dueDate!: Date;

  @Column('bigint', { name: 'amount_due' })
  amountDue!: number;

  @Column('bigint', { name: 'amount_paid' })
  amountPaid!: number;

  @Column('bigint', { name: 'amount_remaining' })
  amountRemaining!: number;

  @Column()
  currency!: string;

  @Column({ default: 'draft' })
  status!: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

  @Column({ type: 'jsonb', default: [], name: 'line_items' })
  lineItems!: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
    period: {
      start: Date;
      end: Date;
    };
  }>;

  @ManyToOne(() => Subscription, (subscription) => subscription.invoices)
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ nullable: true, name: 'invoice_id' })
  invoiceId?: string;

  @Column({ name: 'payment_method' })
  paymentMethod!: 'card' | 'bank_transfer' | 'paypal';

  @Column({ name: 'payment_intent_id' })
  paymentIntentId!: string;

  @Column('bigint')
  amount!: number;

  @Column()
  currency!: string;

  @Column({ default: 'pending' })
  status!: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

  @Column({ type: 'timestamp', name: 'payment_date' })
  paymentDate!: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Invoice, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}

@Entity('billing_events')
export class BillingEvent extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'event_type' })
  eventType!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, any>;

  @Column({ type: 'timestamp', name: 'event_date' })
  eventDate!: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}