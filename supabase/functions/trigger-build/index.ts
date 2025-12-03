import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerBuildRequest {
  environment: 'dev' | 'qa' | 'staging' | 'prod';
  base_url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const githubOwner = Deno.env.get('GITHUB_OWNER');
    const githubRepo = Deno.env.get('GITHUB_REPO');

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { environment, base_url }: TriggerBuildRequest = await req.json();

    console.log(`Triggering build for environment: ${environment}, base_url: ${base_url}`);

    // Validate inputs
    if (!environment || !base_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: environment and base_url' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate base_url format
    try {
      new URL(base_url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid base_url format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert build record
    const { data: build, error: insertError } = await supabase
      .from('builds')
      .insert({
        environment,
        base_url,
        status: 'queued',
        stage: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting build:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create build record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Created build record: ${build.id}`);

    // Trigger GitHub Actions workflow via repository_dispatch
    if (githubToken && githubOwner && githubRepo) {
      try {
        const dispatchResponse = await fetch(
          `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `token ${githubToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event_type: 'flutter_build',
              client_payload: {
                build_id: build.id,
                environment,
                base_url,
                callback_url: `${supabaseUrl}/functions/v1/update-status`,
              },
            }),
          }
        );

        if (!dispatchResponse.ok) {
          const errorText = await dispatchResponse.text();
          console.error('GitHub dispatch error:', errorText);
          
          // Update build to failed status
          await supabase
            .from('builds')
            .update({ status: 'failed', stage: 'pending' })
            .eq('id', build.id);

          return new Response(
            JSON.stringify({ 
              error: 'Failed to trigger GitHub workflow',
              build_id: build.id,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Update status to building
        await supabase
          .from('builds')
          .update({ status: 'building' })
          .eq('id', build.id);

        console.log(`GitHub workflow triggered for build: ${build.id}`);
      } catch (githubError) {
        console.error('GitHub API error:', githubError);
        
        await supabase
          .from('builds')
          .update({ status: 'failed', stage: 'pending' })
          .eq('id', build.id);

        return new Response(
          JSON.stringify({ 
            error: 'Failed to connect to GitHub',
            build_id: build.id,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      console.warn('GitHub configuration missing - build will remain in queued state');
      console.warn('Please configure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO secrets');
    }

    return new Response(
      JSON.stringify({
        success: true,
        build_id: build.id,
        message: 'Build triggered successfully',
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
