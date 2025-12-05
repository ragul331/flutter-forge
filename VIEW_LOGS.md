# How to View Supabase Edge Function Logs

## Option 1: Supabase Dashboard (Recommended for Production)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project (Project ID: `nlpowqrypdbvtwkdlrwg`)

2. **Navigate to Edge Functions:**
   - Click on **"Edge Functions"** in the left sidebar
   - Click on **"trigger-build"** function

3. **View Logs:**
   - Click on the **"Logs"** tab
   - You'll see all `[DEBUG_LOG]` entries with timestamps
   - Logs are shown in real-time as requests come in

## Option 2: Test Locally to See Logs in Terminal

You can run the function locally to see logs directly in your terminal:

```bash
# Navigate to your project
cd /Users/ragulpr/steam-a/ev-flutter-automation/flutter-forge

# Start Supabase locally (if not already running)
supabase start

# Serve the function locally
supabase functions serve trigger-build --env-file .env.local

# In another terminal, test the function:
curl -X POST http://localhost:54321/functions/v1/trigger-build \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "environment": "dev",
    "base_url": "https://53367a27f111.ngrok-free.app"
  }'
```

## Option 3: Check Logs via Supabase API

You can also query logs programmatically, but the dashboard is easier.

## What to Look For in the Logs

When you trigger a build, check for these key log entries:

### ✅ Success Indicators:
- `[DEBUG_LOG] GitHub configuration is present`
- `[DEBUG_LOG] GitHub API response received`
- `[DEBUG_LOG] Response status: 204` (or 200)
- `[DEBUG_LOG] ✓ GitHub workflow triggered successfully!`

### ❌ Error Indicators:
- `[DEBUG_LOG] GitHub configuration missing!` → Missing secrets
- `[DEBUG_LOG] Response status: 401` → Invalid GitHub token
- `[DEBUG_LOG] Response status: 404` → Wrong repo name
- `[DEBUG_LOG] Response status: 422` → Workflow file issue

## Quick Access

**Direct Dashboard Link:**
- Replace `YOUR_PROJECT_REF` with your project reference
- https://supabase.com/dashboard/project/nlpowqrypdbvtwkdlrwg/functions/trigger-build/logs

## Troubleshooting

If you don't see logs:
1. Make sure the function was actually called (check your web app)
2. Wait a few seconds - logs may take a moment to appear
3. Check the time range filter in the dashboard
4. Ensure you're looking at the correct function (`trigger-build`)
