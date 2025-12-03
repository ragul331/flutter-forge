-- Create the builds table for tracking Flutter build jobs
CREATE TABLE public.builds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  environment TEXT NOT NULL CHECK (environment IN ('dev', 'qa', 'staging', 'prod')),
  base_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'building', 'success', 'failed')),
  stage TEXT DEFAULT 'pending' CHECK (stage IN ('pending', 'checkout', 'dependencies', 'build', 'upload', 'complete')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  artifact_url TEXT,
  github_run_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view builds (public dashboard)
CREATE POLICY "Anyone can view builds" 
ON public.builds 
FOR SELECT 
USING (true);

-- Create policy to allow edge functions to insert builds (using service role)
CREATE POLICY "Service role can insert builds" 
ON public.builds 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow edge functions to update builds (using service role)
CREATE POLICY "Service role can update builds" 
ON public.builds 
FOR UPDATE 
USING (true);

-- Enable realtime for the builds table
ALTER PUBLICATION supabase_realtime ADD TABLE public.builds;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_builds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_builds_updated_at
BEFORE UPDATE ON public.builds
FOR EACH ROW
EXECUTE FUNCTION public.update_builds_updated_at();

-- Create index for faster queries
CREATE INDEX idx_builds_created_at ON public.builds(created_at DESC);
CREATE INDEX idx_builds_status ON public.builds(status);