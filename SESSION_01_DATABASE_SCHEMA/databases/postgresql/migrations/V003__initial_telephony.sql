-- Create the 'public.calls' table
CREATE TABLE public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'initiated', -- e.g., 'initiated', 'in-progress', 'completed', 'failed'
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  cost NUMERIC(10, 4),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'calls' table
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'calls' table:
-- Admins can view all calls
CREATE POLICY "Admins can view all calls" ON public.calls
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view calls belonging to their tenant
CREATE POLICY "Tenant users can view their tenant's calls" ON public.calls
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Tenant users can insert calls for their tenant (e.g., via API)
CREATE POLICY "Tenant users can insert calls for their tenant" ON public.calls
FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Tenant users can update calls for their tenant (e.g., status updates)
CREATE POLICY "Tenant users can update calls for their tenant" ON public.calls
FOR UPDATE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can delete any call
CREATE POLICY "Admins can delete any call" ON public.calls
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.call_recordings' table
CREATE TABLE public.call_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  duration_seconds INTEGER,
  transcription TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'call_recordings' table
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'call_recordings' table:
-- Admins can view all call recordings
CREATE POLICY "Admins can view all call recordings" ON public.call_recordings
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view recordings belonging to their tenant
CREATE POLICY "Tenant users can view their tenant's call recordings" ON public.call_recordings
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Tenant users can insert recordings for their tenant
CREATE POLICY "Tenant users can insert recordings for their tenant" ON public.call_recordings
FOR INSERT TO authenticated WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can delete any call recording
CREATE POLICY "Admins can delete any call recording" ON public.call_recordings
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.phone_numbers' table
CREATE TABLE public.phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  number TEXT NOT NULL UNIQUE,
  capabilities JSONB DEFAULT '{}', -- e.g., 'voice', 'sms', 'mms'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'pending'
  assigned_to TEXT, -- e.g., 'agent_id', 'department_name'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'phone_numbers' table
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'phone_numbers' table:
-- Admins can view all phone numbers
CREATE POLICY "Admins can view all phone numbers" ON public.phone_numbers
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view phone numbers belonging to their tenant
CREATE POLICY "Tenant users can view their tenant's phone numbers" ON public.phone_numbers
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can insert new phone numbers
CREATE POLICY "Admins can insert phone numbers" ON public.phone_numbers
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any phone number
CREATE POLICY "Admins can update any phone number" ON public.phone_numbers
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant admins can update their tenant's phone numbers
CREATE POLICY "Tenant admins can update their tenant's phone numbers" ON public.phone_numbers
FOR UPDATE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can delete any phone number
CREATE POLICY "Admins can delete any phone number" ON public.phone_numbers
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add indexes for performance
CREATE INDEX idx_calls_tenant_id ON public.calls (tenant_id);
CREATE INDEX idx_calls_from_number ON public.calls (from_number);
CREATE INDEX idx_calls_to_number ON public.calls (to_number);
CREATE INDEX idx_call_recordings_call_id ON public.call_recordings (call_id);
CREATE INDEX idx_call_recordings_tenant_id ON public.call_recordings (tenant_id);
CREATE INDEX idx_phone_numbers_tenant_id ON public.phone_numbers (tenant_id);