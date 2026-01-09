-- Create the 'public.subscriptions' table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL, -- e.g., 'basic', 'premium', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'subscriptions' table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'subscriptions' table:
-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view their tenant's subscriptions
CREATE POLICY "Tenant users can view their tenant's subscriptions" ON public.subscriptions
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can insert new subscriptions
CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any subscription
CREATE POLICY "Admins can update any subscription" ON public.subscriptions
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant admins can update their tenant's subscriptions (e.g., cancel)
CREATE POLICY "Tenant admins can update their tenant's subscriptions" ON public.subscriptions
FOR UPDATE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can delete any subscription
CREATE POLICY "Admins can delete any subscription" ON public.subscriptions
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.invoices' table
CREATE TABLE public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'void', 'failed'
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'invoices' table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'invoices' table:
-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices" ON public.invoices
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view their tenant's invoices
CREATE POLICY "Tenant users can view their tenant's invoices" ON public.invoices
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can insert new invoices
CREATE POLICY "Admins can insert invoices" ON public.invoices
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any invoice
CREATE POLICY "Admins can update any invoice" ON public.invoices
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any invoice
CREATE POLICY "Admins can delete any invoice" ON public.invoices
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.usage_records' table
CREATE TABLE public.usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- e.g., 'call_minutes', 'api_requests', 'storage_gb'
  usage_value NUMERIC(10, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'usage_records' table
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'usage_records' table:
-- Admins can view all usage records
CREATE POLICY "Admins can view all usage records" ON public.usage_records
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view their tenant's usage records
CREATE POLICY "Tenant users can view their tenant's usage records" ON public.usage_records
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can insert new usage records
CREATE POLICY "Admins can insert usage records" ON public.usage_records
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any usage record
CREATE POLICY "Admins can delete any usage record" ON public.usage_records
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add indexes for performance
CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions (tenant_id);
CREATE INDEX idx_invoices_tenant_id ON public.invoices (tenant_id);
CREATE INDEX idx_invoices_subscription_id ON public.invoices (subscription_id);
CREATE INDEX idx_usage_records_tenant_id ON public.usage_records (tenant_id);
CREATE INDEX idx_usage_records_subscription_id ON public.usage_records (subscription_id);
CREATE INDEX idx_usage_records_metric_name ON public.usage_records (metric_name);