-- Create the 'public.call_metrics' table
CREATE TABLE public.call_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL, -- e.g., 'latency', 'jitter', 'packet_loss', 'sentiment'
  metric_value NUMERIC(10, 4) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'call_metrics' table
ALTER TABLE public.call_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'call_metrics' table:
-- Admins can view all call metrics
CREATE POLICY "Admins can view all call metrics" ON public.call_metrics
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view call metrics belonging to their tenant
CREATE POLICY "Tenant users can view their tenant's call metrics" ON public.call_metrics
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can insert new call metrics
CREATE POLICY "Admins can insert call metrics" ON public.call_metrics
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any call metric
CREATE POLICY "Admins can delete any call metric" ON public.call_metrics
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.voice_quality_logs' table
CREATE TABLE public.voice_quality_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  log_level TEXT NOT NULL, -- 'info', 'warn', 'error'
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'voice_quality_logs' table
ALTER TABLE public.voice_quality_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'voice_quality_logs' table:
-- Admins can view all voice quality logs
CREATE POLICY "Admins can view all voice quality logs" ON public.voice_quality_logs
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view voice quality logs belonging to their tenant
CREATE POLICY "Tenant users can view their tenant's voice quality logs" ON public.voice_quality_logs
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can insert new voice quality logs
CREATE POLICY "Admins can insert voice quality logs" ON public.voice_quality_logs
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete any voice quality log
CREATE POLICY "Admins can delete any voice quality log" ON public.voice_quality_logs
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create the 'public.tenant_analytics' table (for aggregated tenant-level data)
CREATE TABLE public.tenant_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  total_calls INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  average_call_duration NUMERIC(10, 2) DEFAULT 0,
  total_recordings INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the 'tenant_analytics' table
ALTER TABLE public.tenant_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'tenant_analytics' table:
-- Admins can view all tenant analytics
CREATE POLICY "Admins can view all tenant analytics" ON public.tenant_analytics
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant users can view their tenant's analytics
CREATE POLICY "Tenant users can view their tenant's analytics" ON public.tenant_analytics
FOR SELECT TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can insert new tenant analytics
CREATE POLICY "Admins can insert tenant analytics" ON public.tenant_analytics
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update any tenant analytics
CREATE POLICY "Admins can update any tenant analytics" ON public.tenant_analytics
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant admins can update their tenant's analytics (e.g., via internal processes)
CREATE POLICY "Tenant admins can update their tenant's analytics" ON public.tenant_analytics
FOR UPDATE TO authenticated USING (tenant_id IN (SELECT tenant_id FROM public.tenant_configs WHERE admin_user_id = auth.uid()));

-- Admins can delete any tenant analytics
CREATE POLICY "Admins can delete any tenant analytics" ON public.tenant_analytics
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add indexes for performance
CREATE INDEX idx_call_metrics_tenant_id ON public.call_metrics (tenant_id);
CREATE INDEX idx_call_metrics_call_id ON public.call_metrics (call_id);
CREATE INDEX idx_voice_quality_logs_tenant_id ON public.voice_quality_logs (tenant_id);
CREATE INDEX idx_voice_quality_logs_call_id ON public.voice_quality_logs (call_id);
CREATE INDEX idx_tenant_analytics_tenant_id ON public.tenant_analytics (tenant_id);