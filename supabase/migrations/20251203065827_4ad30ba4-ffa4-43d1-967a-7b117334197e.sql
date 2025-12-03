-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_builds_updated_at()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;