# Dukat Voice AI SaaS - Entity Relationship Diagram

## Overview
This document describes the complete database schema for the Dukat Voice AI SaaS platform, consisting of 6 interconnected databases with 34 tables.

## Database 1: Authentication & Users

### Core Tables

#### `users`
- Primary entity for all system users
- Contains authentication credentials and user profile
- Soft delete support with `deleted_at`

**Relations:**
- One-to-many with `user_roles`
- One-to-many with `sessions`
- One-to-many with `audit_logs`

#### `roles`
- System and custom roles with permissions
- Supports RBAC (Role-Based Access Control)

#### `user_roles`
- Junction table linking users to roles
- Supports multi-tenancy with `tenant_id`

#### `sessions`
- User session management
- Supports device tracking and token revocation

#### `audit_logs`
- Comprehensive audit trail for all user actions
- Stores before/after values for data changes

## Database 2: Tenants & Configuration

### Core Tables

#### `tenants`
- Multi-tenant isolation at the core
- Each tenant has unique domain and configuration

**Relations:**
- One-to-one with `tenant_configs`
- One-to-many with all other tenant-related tables

#### `tenant_configs`
- Hierarchical configuration system
- Versioned configurations with rollback support

#### `api_keys`
- Secure API key management
- Hashed storage with scopes and rate limiting

#### `webhooks` & `webhook_deliveries`
- Event-driven architecture support
- Reliable delivery with retry policies

#### `feature_flags`
- Gradual feature rollout system
- A/B testing and targeted rollouts

#### `usage_quotas`
- Resource usage tracking and limits
- Real-time quota enforcement

## Database 3: Voice Infrastructure

### Core Tables

#### `calls`
- Core telephony call records
- Tracks call lifecycle and metadata

**Relations:**
- One-to-many with `call_segments`
- One-to-many with `call_recordings`

#### `call_segments`
- Call segmentation for IVR, agent, hold, etc.
- Enables detailed call analytics

#### `call_recordings`
- Secure call recording storage
- Supports encryption and compliance

#### `phone_numbers`
- Telephone number inventory and management
- Carrier integration and capabilities

#### `emergency_locations`
- E911/E112 compliance support
- Address validation and geocoding

## Database 4: AI Agents & Conversations

### Core Tables

#### `agents`
- AI agent configurations and training
- Model settings and performance metrics

**Relations:**
- One-to-many with `conversations`

#### `conversations`
- Complete conversation history
- Context preservation across sessions

#### `messages`
- Individual message-level tracking
- Sentiment analysis and intent detection

#### `knowledge_bases` & `documents`
- RAG (Retrieval Augmented Generation) support
- Document chunking and embedding

## Database 5: Analytics & Metrics

### Core Tables

#### `call_metrics`
- Aggregated call performance data
- Supports multiple time granularities

#### `agent_metrics`
- Agent performance and quality metrics
- Customer satisfaction tracking

#### `voice_quality_metrics`
- Real-time voice quality monitoring
- MOS scores and network metrics

#### `usage_metrics`
- Resource usage for billing
- Cost tracking and optimization

## Database 6: Billing & Subscriptions

### Core Tables

#### `subscriptions`
- Tenant subscription management
- Plan tiers and billing cycles

#### `invoices`
- Invoice generation and tracking
- Line item detail and tax support

#### `payments`
- Payment processing and reconciliation
- Multiple payment method support

#### `billing_events`
- Event sourcing for billing operations
- Audit trail for financial compliance

## Key Relationships

### Tenant-Centric Design
```
tenants (1) → (1) tenant_configs
tenants (1) → (N) api_keys
tenants (1) → (N) webhooks
tenants (1) → (N) calls
tenants (1) → (N) agents
tenants (1) → (N) subscriptions
```

### Call Flow
```
calls (1) → (N) call_segments
calls (1) → (N) call_recordings
calls (1) → (N) conversations
```

### AI Pipeline
```
agents (1) → (N) conversations
conversations (1) → (N) messages
knowledge_bases (1) → (N) documents
```

## Indexing Strategy

### Primary Indexes
- All tables: `id` (UUID primary key)
- Most tables: `tenant_id` for multi-tenant isolation
- Lookup fields: `email`, `domain`, `call_sid`, `session_id`

### Performance Indexes
- Date-based: `created_at`, `updated_at`, `metric_date`
- Status fields: `status`, `enabled`, `is_revoked`
- Composite indexes for common query patterns

## Data Retention Policies

### Operational Data
- Active data: 90 days (hot storage)
- Historical data: 1-3 years (warm storage)
- Archived data: 7+ years (cold storage)

### Compliance Data
- Call recordings: 7 years (regulated industries)
- Audit logs: 10 years (SOC 2, HIPAA)
- Billing records: 7 years (tax compliance)

## Security Considerations

### Data Encryption
- At rest: AES-256 encryption
- In transit: TLS 1.3
- Sensitive fields: API keys, passwords, payment info

### Access Control
- Row-level security by `tenant_id`
- Column-level encryption for sensitive data
- Audit logging for all data access

## Scalability Design

### Partitioning Strategy
- Time-based partitioning for metrics tables
- Tenant-based sharding for large tenants
- Geographic partitioning for global deployment

### Read/Write Separation
- Primary database: Write operations
- Read replicas: Analytics and reporting
- Cache layer: Redis for frequently accessed data

## Backup & Recovery

### Backup Strategy
- Full backups: Daily
- Incremental backups: Hourly
- Transaction logs: Continuous

### Recovery Objectives
- RPO (Recovery Point Objective): 5 minutes
- RTO (Recovery Time Objective): 15 minutes
- DR (Disaster Recovery): Multi-region replication