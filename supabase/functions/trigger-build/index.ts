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
  console.log('[DEBUG_LOG] ==========================================');
  console.log('[DEBUG_LOG] Trigger Build Function Started');
  console.log('[DEBUG_LOG] ==========================================');
  console.log('[DEBUG_LOG] Request method:', req.method);
  console.log('[DEBUG_LOG] Request URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[DEBUG_LOG] Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DEBUG_LOG] Loading environment variables...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const githubOwner = Deno.env.get('GITHUB_OWNER');
    const githubRepo = Deno.env.get('GITHUB_REPO');

    console.log('[DEBUG_LOG] Environment variables check:');
    console.log('[DEBUG_LOG]   SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('[DEBUG_LOG]   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
    console.log('[DEBUG_LOG]   GITHUB_TOKEN:', githubToken ? 'SET' : 'NOT SET');
    console.log('[DEBUG_LOG]   GITHUB_OWNER:', githubOwner || 'NOT SET');
    console.log('[DEBUG_LOG]   GITHUB_REPO:', githubRepo || 'NOT SET');

    // Create Supabase client with service role key for admin access
    console.log('[DEBUG_LOG] Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[DEBUG_LOG] Supabase client created');

    // Parse request body
    console.log('[DEBUG_LOG] Parsing request body...');
    const { environment, base_url }: TriggerBuildRequest = await req.json();
    console.log('[DEBUG_LOG] Request body parsed:');
    console.log('[DEBUG_LOG]   environment:', environment);
    console.log('[DEBUG_LOG]   base_url:', base_url);

    // Validate inputs
    console.log('[DEBUG_LOG] Validating inputs...');
    if (!environment || !base_url) {
      console.log('[DEBUG_LOG] Validation failed: Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: environment and base_url' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('[DEBUG_LOG] Input validation passed');

    // Validate base_url format
    console.log('[DEBUG_LOG] Validating base_url format...');
    try {
      new URL(base_url);
      console.log('[DEBUG_LOG] base_url format is valid');
    } catch (error) {
      console.log('[DEBUG_LOG] Validation failed: Invalid base_url format', error);
      return new Response(
        JSON.stringify({ error: 'Invalid base_url format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert build record
    console.log('[DEBUG_LOG] Inserting build record into database...');
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
      console.error('[DEBUG_LOG] Error inserting build:', JSON.stringify(insertError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to create build record' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[DEBUG_LOG] Build record created successfully');
    console.log('[DEBUG_LOG] Build ID:', build.id);

    // Trigger GitHub Actions workflow via repository_dispatch
    console.log('[DEBUG_LOG] ==========================================');
    console.log('[DEBUG_LOG] Checking GitHub configuration...');
    console.log('[DEBUG_LOG] ==========================================');
    
    if (githubToken && githubOwner && githubRepo) {
      console.log('[DEBUG_LOG] GitHub configuration is present');
      console.log('[DEBUG_LOG] Preparing GitHub API request...');
      
      const githubApiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`;
      const callbackUrl = `${supabaseUrl}/functions/v1/update-status`;
      
      console.log('[DEBUG_LOG] GitHub API URL:', githubApiUrl);
      console.log('[DEBUG_LOG] Callback URL:', callbackUrl);
      
      const payload = {
        event_type: 'flutter_build',
        client_payload: {
          build_id: build.id,
          environment,
          base_url,
          callback_url: callbackUrl,
        },
      };
      
      console.log('[DEBUG_LOG] Request payload:', JSON.stringify(payload, null, 2));
      console.log('[DEBUG_LOG] Sending request to GitHub API...');
      
      try {
        const dispatchResponse = await fetch(githubApiUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${githubToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('[DEBUG_LOG] GitHub API response received');
        console.log('[DEBUG_LOG] Response status:', dispatchResponse.status);
        console.log('[DEBUG_LOG] Response status text:', dispatchResponse.statusText);
        console.log('[DEBUG_LOG] Response headers:', Object.fromEntries(dispatchResponse.headers.entries()));

        const responseText = await dispatchResponse.text();
        console.log('[DEBUG_LOG] Response body:', responseText);

        if (!dispatchResponse.ok) {
          console.error('[DEBUG_LOG] GitHub dispatch failed!');
          console.error('[DEBUG_LOG] Status:', dispatchResponse.status);
          console.error('[DEBUG_LOG] Error response:', responseText);
          
          // Update build to failed status
          console.log('[DEBUG_LOG] Updating build status to failed...');
          await supabase
            .from('builds')
            .update({ status: 'failed', stage: 'pending' })
            .eq('id', build.id);
          console.log('[DEBUG_LOG] Build status updated to failed');

          return new Response(
            JSON.stringify({ 
              error: 'Failed to trigger GitHub workflow',
              build_id: build.id,
              github_error: responseText,
              github_status: dispatchResponse.status,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log('[DEBUG_LOG] ✓ GitHub workflow triggered successfully!');
        console.log('[DEBUG_LOG] Updating build status to building...');
        
        // Update status to building
        const { error: updateError } = await supabase
          .from('builds')
          .update({ status: 'building' })
          .eq('id', build.id);

        if (updateError) {
          console.error('[DEBUG_LOG] Error updating build status:', updateError);
        } else {
          console.log('[DEBUG_LOG] Build status updated to building');
        }

        console.log('[DEBUG_LOG] GitHub workflow triggered for build:', build.id);
      } catch (githubError) {
        console.error('[DEBUG_LOG] ==========================================');
        console.error('[DEBUG_LOG] GitHub API error occurred!');
        console.error('[DEBUG_LOG] ==========================================');
        console.error('[DEBUG_LOG] Error type:', githubError?.constructor?.name);
        console.error('[DEBUG_LOG] Error message:', githubError?.message);
        console.error('[DEBUG_LOG] Error stack:', githubError?.stack);
        console.error('[DEBUG_LOG] Full error:', JSON.stringify(githubError, null, 2));
        
        console.log('[DEBUG_LOG] Updating build status to failed...');
        await supabase
          .from('builds')
          .update({ status: 'failed', stage: 'pending' })
          .eq('id', build.id);
        console.log('[DEBUG_LOG] Build status updated to failed');

        return new Response(
          JSON.stringify({ 
            error: 'Failed to connect to GitHub',
            build_id: build.id,
            error_details: githubError?.message || 'Unknown error',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      console.warn('[DEBUG_LOG] ==========================================');
      console.warn('[DEBUG_LOG] GitHub configuration missing!');
      console.warn('[DEBUG_LOG] ==========================================');
      console.warn('[DEBUG_LOG] Missing variables:');
      if (!githubToken) console.warn('[DEBUG_LOG]   - GITHUB_TOKEN');
      if (!githubOwner) console.warn('[DEBUG_LOG]   - GITHUB_OWNER');
      if (!githubRepo) console.warn('[DEBUG_LOG]   - GITHUB_REPO');
      console.warn('[DEBUG_LOG] Build will remain in queued state');
      console.warn('[DEBUG_LOG] Please configure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO secrets');
    }

    console.log('[DEBUG_LOG] ==========================================');
    console.log('[DEBUG_LOG] Function completed successfully');
    console.log('[DEBUG_LOG] ==========================================');
    
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
    console.error('[DEBUG_LOG] ==========================================');
    console.error('[DEBUG_LOG] Unexpected error occurred!');
    console.error('[DEBUG_LOG] ==========================================');
    console.error('[DEBUG_LOG] Error type:', error?.constructor?.name);
    console.error('[DEBUG_LOG] Error message:', error?.message);
    console.error('[DEBUG_LOG] Error stack:', error?.stack);
    console.error('[DEBUG_LOG] Full error:', JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        error_details: error?.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
