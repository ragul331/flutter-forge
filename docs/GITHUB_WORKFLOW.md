# GitHub Actions Workflow for Flutter Build Automation

This document provides the GitHub Actions workflow YAML that should be added to your Flutter repository.

## Setup Instructions

1. Create a new file in your Flutter repository at `.github/workflows/flutter_build.yml`
2. Copy the workflow content below
3. Configure the required secrets in your GitHub repository settings

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Your Lovable Cloud URL (found in environment settings) |
| `WEBHOOK_SECRET` | A secure random string for authenticating callback requests |

## Workflow File

Create `.github/workflows/flutter_build.yml`:

```yaml
name: Flutter Build

on:
  repository_dispatch:
    types: [flutter_build]

jobs:
  build:
    runs-on: ubuntu-latest
    
    env:
      BUILD_ID: ${{ github.event.client_payload.build_id }}
      ENVIRONMENT: ${{ github.event.client_payload.environment }}
      BASE_URL: ${{ github.event.client_payload.base_url }}
      CALLBACK_URL: ${{ github.event.client_payload.callback_url }}

    steps:
      - name: Update Status - Checkout
        run: |
          curl -X POST "${{ env.CALLBACK_URL }}" \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.WEBHOOK_SECRET }}" \
            -d '{
              "build_id": "${{ env.BUILD_ID }}",
              "status": "building",
              "stage": "checkout",
              "progress": 10,
              "github_run_id": "${{ github.run_id }}"
            }'

      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Update Status - Dependencies
        run: |
          curl -X POST "${{ env.CALLBACK_URL }}" \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.WEBHOOK_SECRET }}" \
            -d '{
              "build_id": "${{ env.BUILD_ID }}",
              "status": "building",
              "stage": "dependencies",
              "progress": 25
            }'

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'
          channel: 'stable'
          cache: true

      - name: Install Dependencies
        run: flutter pub get

      - name: Update Status - Build
        run: |
          curl -X POST "${{ env.CALLBACK_URL }}" \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.WEBHOOK_SECRET }}" \
            -d '{
              "build_id": "${{ env.BUILD_ID }}",
              "status": "building",
              "stage": "build",
              "progress": 50
            }'

      - name: Build APK
        run: |
          flutter build apk --release \
            --dart-define=BASE_URL=${{ env.BASE_URL }} \
            --dart-define=ENV=${{ env.ENVIRONMENT }}

      - name: Update Status - Upload
        run: |
          curl -X POST "${{ env.CALLBACK_URL }}" \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.WEBHOOK_SECRET }}" \
            -d '{
              "build_id": "${{ env.BUILD_ID }}",
              "status": "building",
              "stage": "upload",
              "progress": 85
            }'

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        id: artifact-upload
        with:
          name: flutter-apk-${{ env.BUILD_ID }}
          path: build/app/outputs/flutter-apk/app-release.apk
          retention-days: 30

      - name: Get Artifact URL
        id: artifact-url
        run: |
          echo "url=https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}/artifacts/${{ steps.artifact-upload.outputs.artifact-id }}" >> $GITHUB_OUTPUT

      - name: Update Status - Complete
        run: |
          curl -X POST "${{ env.CALLBACK_URL }}" \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.WEBHOOK_SECRET }}" \
            -d '{
              "build_id": "${{ env.BUILD_ID }}",
              "status": "success",
              "stage": "complete",
              "progress": 100,
              "artifact_url": "${{ steps.artifact-url.outputs.url }}"
            }'

      - name: Update Status - Failed
        if: failure()
        run: |
          curl -X POST "${{ env.CALLBACK_URL }}" \
            -H "Content-Type: application/json" \
            -H "x-webhook-secret: ${{ secrets.WEBHOOK_SECRET }}" \
            -d '{
              "build_id": "${{ env.BUILD_ID }}",
              "status": "failed",
              "stage": "${{ job.status }}",
              "progress": 0
            }'
```

## Environment Configuration Guide

### Lovable Cloud Secrets

Configure these secrets in your Lovable Cloud project:

| Secret | Description | Example |
|--------|-------------|---------|
| `GITHUB_TOKEN` | Personal access token with `repo` scope | `ghp_xxxxxxxxxxxx` |
| `GITHUB_OWNER` | GitHub username or organization | `your-username` |
| `GITHUB_REPO` | Repository name | `your-flutter-app` |
| `WEBHOOK_SECRET` | Shared secret for callback authentication | `your-secure-random-string` |

### Creating a GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Flutter Build Automation"
4. Select the `repo` scope (Full control of private repositories)
5. Click "Generate token"
6. Copy the token and save it as `GITHUB_TOKEN` in Lovable Cloud secrets

### Generating a Webhook Secret

Generate a secure random string for the webhook secret:

```bash
openssl rand -hex 32
```

Use this value for both:
- `WEBHOOK_SECRET` in Lovable Cloud
- `WEBHOOK_SECRET` in GitHub repository secrets

## Progress Stages

| Stage | Progress | Description |
|-------|----------|-------------|
| pending | 0% | Build queued |
| checkout | 10% | Cloning repository |
| dependencies | 25-40% | Installing Flutter and packages |
| build | 50-80% | Building APK |
| upload | 85-90% | Uploading artifact |
| complete | 100% | Build finished |

## Troubleshooting

### Build Not Triggering

1. Verify `GITHUB_TOKEN` has `repo` scope
2. Check `GITHUB_OWNER` and `GITHUB_REPO` are correct
3. Ensure the workflow file exists at `.github/workflows/flutter_build.yml`
4. Check GitHub Actions is enabled for the repository

### Status Updates Not Working

1. Verify `WEBHOOK_SECRET` matches in both Lovable Cloud and GitHub
2. Check the callback URL is accessible
3. Review edge function logs in Lovable Cloud

### Build Failing

1. Check the GitHub Actions run logs
2. Verify Flutter version compatibility
3. Ensure all dependencies are correctly specified
