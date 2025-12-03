# Flutter Build Automation - Setup Guide

## Overview

This system provides a complete CI/CD solution for Flutter applications with:
- Web dashboard for triggering builds
- Real-time progress tracking
- Artifact download when complete
- Integration with GitHub Actions

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Dashboard  │────▶│  Lovable Cloud  │────▶│  GitHub Actions │
│   (React/TS)    │     │  (Edge Funcs)   │     │  (Flutter Build)│
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │                 │             │
        └──────────────▶│    Database     │◀────────────┘
          (Realtime)    │   (Postgres)    │   (Callbacks)
                        │                 │
                        └─────────────────┘
```

## Quick Start

### 1. Configure Lovable Cloud Secrets

Navigate to your Lovable Cloud settings and add these secrets:

| Secret Name | Required | Description |
|-------------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub PAT with `repo` scope |
| `GITHUB_OWNER` | Yes | Your GitHub username/org |
| `GITHUB_REPO` | Yes | Your Flutter repository name |
| `WEBHOOK_SECRET` | Yes | Secure string for callbacks |

### 2. Set Up GitHub Repository

In your Flutter repository:

1. Create `.github/workflows/flutter_build.yml` (see GITHUB_WORKFLOW.md)
2. Add repository secrets:
   - `WEBHOOK_SECRET` (same value as Lovable Cloud)

### 3. Enable GitHub Actions

1. Go to your repository → Settings → Actions → General
2. Enable "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select "Read and write permissions"

### 4. Test the Integration

1. Open the Flutter Build Automation dashboard
2. Select an environment (dev, qa, staging, prod)
3. Enter a base URL (e.g., `https://your-api.ngrok-free.app`)
4. Click "Start Build"
5. Watch the real-time progress updates
6. Download the APK when complete

## Database Schema

### builds table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| environment | TEXT | dev, qa, staging, prod |
| base_url | TEXT | API base URL for the build |
| status | TEXT | queued, building, success, failed |
| stage | TEXT | Current build stage |
| progress | INTEGER | 0-100 percentage |
| artifact_url | TEXT | Download URL when complete |
| github_run_id | TEXT | GitHub Actions run ID |
| created_at | TIMESTAMP | When build was triggered |
| updated_at | TIMESTAMP | Last update time |

## Edge Functions

### trigger-build

Endpoint: `POST /functions/v1/trigger-build`

Request:
```json
{
  "environment": "qa",
  "base_url": "https://api.example.com"
}
```

Response:
```json
{
  "success": true,
  "build_id": "uuid-here",
  "message": "Build triggered successfully"
}
```

### update-status

Endpoint: `POST /functions/v1/update-status`

Headers:
- `x-webhook-secret`: Your webhook secret

Request:
```json
{
  "build_id": "uuid-here",
  "status": "building",
  "stage": "dependencies",
  "progress": 40,
  "artifact_url": "optional",
  "github_run_id": "optional"
}
```

## Flutter Configuration

In your Flutter app, access the build-time variables:

```dart
const String baseUrl = String.fromEnvironment('BASE_URL');
const String environment = String.fromEnvironment('ENV');
```

## Security Considerations

1. **Never expose GitHub tokens** - All GitHub API calls go through edge functions
2. **Validate URLs** - Base URLs are validated before use
3. **Webhook authentication** - Callback API requires secret header
4. **RLS policies** - Database access controlled by Row Level Security

## Troubleshooting

### Builds stuck in "queued"

- Check if GitHub secrets are configured
- Verify GitHub token has correct permissions
- Check edge function logs for errors

### Real-time updates not working

- Ensure browser supports WebSocket
- Check browser console for Supabase errors
- Verify realtime is enabled on the builds table

### Download not available

- Wait for build to reach 100% / success status
- Check if artifact upload succeeded in GitHub Actions
- Verify artifact retention period hasn't expired
