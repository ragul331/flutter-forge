import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface UpdateStatusRequest {
  build_id: string;
  status: 'queued' | 'building' | 'success' | 'failed';
  stage: 'pending' | 'checkout' | 'dependencies' | 'build' | 'upload' | 'complete';
  progress: number;
  artifact_url?: string;
  github_run_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');

    // Verify webhook secret if configured
    const requestSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret && requestSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const {
      build_id,
      status,
      stage,
      progress,
      artifact_url,
      github_run_id,
    }: UpdateStatusRequest = await req.json();

    console.log(`Updating build ${build_id}: status=${status}, stage=${stage}, progress=${progress}`);

    // Validate required fields
    if (!build_id || !status || !stage || progress === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate progress range
    if (progress < 0 || progress > 100) {
      return new Response(
        JSON.stringify({ error: 'Progress must be between 0 and 100' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      status,
      stage,
      progress,
    };

    if (artifact_url) {
      updateData.artifact_url = artifact_url;
    }

    if (github_run_id) {
      updateData.github_run_id = github_run_id;
    }

    // Update build record
    const { data, error } = await supabase
      .from('builds')
      .update(updateData)
      .eq('id', build_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating build:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update build' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Build not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Build ${build_id} updated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        build: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
