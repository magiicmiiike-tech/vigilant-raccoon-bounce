-- Create the 'public.tenants' table
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- e.g., 'active', 'suspended', 'deleted'
  plan_tier TEXT NOT NULL DEFAULT 'starter', -- e.g., 'starter', 'business', 'enterprise'
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS) for the 'tenants' table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'tenants' table:
-- Admins can view all tenants
CREATE POLICY "Admins can view all tenants" ON public.tenants
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant admins can view their own tenant
CREATE POLICY "Tenant admins can view their own tenant" ON public.tenants
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.tenant_configs WHERE tenant_id = id AND admin_user_id = auth.uid()));

-- Admins can insert new tenants
CREATE POLICY "Admins can insert tenants" ON public.tenants
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any tenant
CREATE POLICY "Admins can update any tenant" ON public.tenants
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any tenant
CREATE POLICY "Admins can delete any tenant" ON public.tenants
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.tenant_configs' table
CREATE TABLE public.tenant_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  config_data JSONB NOT NULL DEFAULT '{}', -- Stores various configuration settings
  admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- The primary admin for this tenant
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'tenant_configs' table
ALTER TABLE public.tenant_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'tenant_configs' table:
-- Admins can view all tenant configs
CREATE POLICY "Admins can view all tenant configs" ON public.tenant_configs
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant admins can view their own tenant config
CREATE POLICY "Tenant admins can view their own tenant config" ON public.tenant_configs
FOR SELECT TO authenticated USING (admin_user_id = auth.uid());

-- Admins can insert new tenant configs
CREATE POLICY "Admins can insert tenant configs" ON public.tenant_configs
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any tenant config
CREATE POLICY "Admins can update any tenant config" ON public.tenant_configs
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant admins can update their own tenant config
CREATE POLICY "Tenant admins can update their own tenant config" ON public.tenant_configs
FOR UPDATE TO authenticated USING (admin_user_id = auth.uid());

-- Admins can delete any tenant config
CREATE POLICY "Admins can delete any tenant config" ON public.tenant_configs
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add indexes for performance
CREATE INDEX idx_tenants_created_by ON public.tenants (created_by);
CREATE INDEX idx_tenants_domain ON public.tenants (domain);
CREATE INDEX idx_tenant_configs_tenant_id ON public.tenant_configs (tenant_id);
CREATE INDEX idx_tenant_configs_admin_user_id ON public.tenant_configs (admin_user_id);