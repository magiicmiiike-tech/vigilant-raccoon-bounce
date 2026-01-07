-- Create the 'public.emergency_calls' table
CREATE TABLE public.emergency_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL, -- Link to a regular call if applicable
  caller_id TEXT NOT NULL,
  location_data JSONB NOT NULL, -- e.g., { "latitude": ..., "longitude": ..., "address": ... }
  psap_id UUID REFERENCES public.psap_info(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'initiated', -- 'initiated', 'routed', 'connected', 'resolved'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'emergency_calls' table
ALTER TABLE public.emergency_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'emergency_calls' table:
-- Admins can view all emergency calls
CREATE POLICY "Admins can view all emergency calls" ON public.emergency_calls
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view emergency calls belonging to their tenant
CREATE POLICY "Tenant users can view their tenant's emergency calls" ON public.emergency_calls
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Tenant users can insert emergency calls for their tenant (e.g., via API)
CREATE POLICY "Tenant users can insert emergency calls for their tenant" ON public.emergency_calls
FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can update any emergency call
CREATE POLICY "Admins can update any emergency call" ON public.emergency_calls
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any emergency call
CREATE POLICY "Admins can delete any emergency call" ON public.emergency_calls
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.emergency_contacts' table
CREATE TABLE public.emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Optional: link to a specific user within the tenant
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'emergency_contacts' table
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'emergency_contacts' table:
-- Admins can view all emergency contacts
CREATE POLICY "Admins can view all emergency contacts" ON public.emergency_contacts
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view emergency contacts belonging to their tenant
CREATE POLICY "Tenant users can view their tenant's emergency contacts" ON public.emergency_contacts
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Tenant users can insert emergency contacts for their tenant
CREATE POLICY "Tenant users can insert emergency contacts for their tenant" ON public.emergency_contacts
FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Tenant users can update emergency contacts for their tenant
CREATE POLICY "Tenant users can update emergency contacts for their tenant" ON public.emergency_contacts
FOR UPDATE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can delete any emergency contact
CREATE POLICY "Admins can delete any emergency contact" ON public.emergency_contacts
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.psap_info' table (Public Safety Answering Point)
CREATE TABLE public.psap_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone_number TEXT,
  contact_email TEXT,
  jurisdiction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'psap_info' table
ALTER TABLE public.psap_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'psap_info' table:
-- Admins can view all PSAP info
CREATE POLICY "Admins can view all PSAP info" ON public.psap_info
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can insert new PSAP info
CREATE POLICY "Admins can insert PSAP info" ON public.psap_info
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any PSAP info
CREATE POLICY "Admins can update any PSAP info" ON public.psap_info
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any PSAP info
CREATE POLICY "Admins can delete any PSAP info" ON public.psap_info
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add indexes for performance
CREATE INDEX idx_emergency_calls_tenant_id ON public.emergency_calls (tenant_id);
CREATE INDEX idx_emergency_calls_call_id ON public.emergency_calls (call_id);
CREATE INDEX idx_emergency_calls_psap_id ON public.emergency_calls (psap_id);
CREATE INDEX idx_emergency_contacts_tenant_id ON public.emergency_contacts (tenant_id);
CREATE INDEX idx_emergency_contacts_user_id ON public.emergency_contacts (user_id);
CREATE INDEX idx_psap_info_zip_code ON public.psap_info (zip_code);