import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TriggerBuildPayload } from '@/types/build';
import { useToast } from '@/hooks/use-toast';

export function useTriggerBuild() {
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast } = useToast();

  const triggerBuild = async (payload: TriggerBuildPayload) => {
    setIsTriggering(true);

    try {
      const { data, error } = await supabase.functions.invoke('trigger-build', {
        body: payload,
      });

      if (error) {
        console.error('Error triggering build:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to trigger build',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Build Triggered',
        description: `Build ${data.build_id?.slice(0, 8) || ''} has been queued`,
      });

      return data;
    } catch (err) {
      console.error('Error triggering build:', err);
      toast({
        title: 'Error',
        description: 'Failed to trigger build. Please check your configuration.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsTriggering(false);
    }
  };

  return { triggerBuild, isTriggering };
}
