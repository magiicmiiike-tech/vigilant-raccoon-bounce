# Technical Specification - Database Schema

## Architecture

- **Distributed Microservices DBs:** Each service has its own database instance/schema to ensure decoupling.
- **Shared Standards:** All services use a common `BaseEntity` for consistency in primary keys (UUID v4) and audit timestamps.
- **Tenant Isolation:** Enforced via `tenant_id` on all customer-facing tables.

## Database Catalog

1. **Auth:** Manages users, RBAC roles, and JWT sessions. Uses `bcrypt` for password hashing logic at the application level.
2. **Tenants:** Centralized tenant registry, configuration settings, and API key management.
3. **Telephony:** High-volume call tracking, recording metadata, and number inventory.
4. **Billing:** Subscription state, metered usage tracking, and invoice history.
5. **Analytics:** Performance metrics and voice quality logs for observability.
6. **Emergency:** E911 routing data and emergency contact compliance.

## Security & Compliance

- **Soft Deletes:** `deleted_at` timestamps on all critical entities.
- **JSONB:** Used for flexible metadata and configurations to avoid schema rigidness.
- **Indexing:** Indexes placed on `tenant_id`, foreign keys, and status columns for optimal query performance.