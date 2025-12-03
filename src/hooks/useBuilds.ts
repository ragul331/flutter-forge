import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Build } from '@/types/build';
import { useToast } from '@/hooks/use-toast';

export function useBuilds() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Initial fetch
    const fetchBuilds = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('builds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching builds:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch builds',
          variant: 'destructive',
        });
      } else {
        setBuilds(data as Build[]);
      }
      setIsLoading(false);
    };

    fetchBuilds();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('builds-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'builds',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setBuilds((prev) => [payload.new as Build, ...prev]);
            toast({
              title: 'New Build',
              description: `Build ${(payload.new as Build).id.slice(0, 8)} started`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setBuilds((prev) =>
              prev.map((build) =>
                build.id === payload.new.id ? (payload.new as Build) : build
              )
            );
            
            const newBuild = payload.new as Build;
            if (newBuild.status === 'success') {
              toast({
                title: 'Build Complete',
                description: `Build ${newBuild.id.slice(0, 8)} finished successfully`,
              });
            } else if (newBuild.status === 'failed') {
              toast({
                title: 'Build Failed',
                description: `Build ${newBuild.id.slice(0, 8)} failed`,
                variant: 'destructive',
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setBuilds((prev) => prev.filter((build) => build.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { builds, isLoading };
}
