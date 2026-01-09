-- migrations/billing/004_initial_billing_schema.sql
-- UP Migration
BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
CREATE TYPE plan_interval AS ENUM ('month', 'year');

-- Create plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    stripe_product_id VARCHAR(100),
    stripe_price_id VARCHAR(100),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) NOT NULL,
    interval plan_interval NOT NULL,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    plan_id UUID NOT NULL,
    stripe_subscription_id VARCHAR(100) UNIQUE,
    status subscription_status DEFAULT 'active',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);

-- Create indexes
CREATE UNIQUE INDEX idx_subscriptions_stripe_id 
    ON subscriptions(stripe_subscription_id) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_subscriptions_tenant_status 
    ON subscriptions(tenant_id, status) 
    WHERE deleted_at IS NULL;

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    subscription_id UUID NOT NULL,
    stripe_invoice_id VARCHAR(100) UNIQUE,
    status invoice_status DEFAULT 'draft',
    invoice_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ,
    amount_due NUMERIC(10,2) NOT NULL CHECK (amount_due >= 0),
    amount_paid NUMERIC(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
    currency VARCHAR(3) NOT NULL,
    invoice_pdf_url VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- Create indexes
CREATE UNIQUE INDEX idx_invoices_stripe_id 
    ON invoices(stripe_invoice_id) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_invoices_tenant_status 
    ON invoices(tenant_id, status) 
    WHERE deleted_at IS NULL;

-- Create invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit_amount NUMERIC(10,2) NOT NULL CHECK (unit_amount >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Create usage_records table
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    subscription_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    amount NUMERIC(10,4) NOT NULL CHECK (amount >= 0),
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT fk_usage_records_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_usage_records_subscription_timestamp 
    ON usage_records(subscription_id, timestamp) 
    WHERE deleted_at IS NULL;
    
CREATE INDEX idx_usage_records_tenant_metric_timestamp 
    ON usage_records(tenant_id, metric_type, timestamp) 
    WHERE deleted_at IS NULL;

-- Create payment_methods table (basic structure)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    user_id UUID, -- Soft reference to auth.users.id
    processor_token TEXT NOT NULL, -- Token from Stripe/other processor
    last_four_digits CHAR(4),
    card_type VARCHAR(50),
    expiration_month INTEGER,
    expiration_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create payment_intents table (basic structure)
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL, -- Soft reference
    invoice_id UUID, -- Optional: link to an invoice
    stripe_payment_intent_id VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'requires_payment_method', 'succeeded', 'failed'
    client_secret TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create coupons table (basic structure)
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- Optional: tenant-specific coupon
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'amount'
    discount_value NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3), -- Required if discount_type is 'amount'
    expires_at TIMESTAMPTZ,
    max_redemptions INTEGER,
    times_redeemed INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

COMMIT;

-- DOWN Migration (for rollback)
BEGIN;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS payment_intents;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS usage_records;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;
DROP TYPE IF EXISTS plan_interval;
DROP TYPE IF EXISTS invoice_status;
DROP TYPE IF EXISTS subscription_status;
COMMIT;