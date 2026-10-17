# deploy_cloudrun.ps1 — Helper script to deploy MachineryCopilot directly to Google Cloud Run
param (
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "machinery-copilot"
)

if (-not $ProjectId) {
    $ProjectId = Read-Host "Enter your Google Cloud Project ID"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Deploying MachineryCopilot to Cloud Run" -ForegroundColor Cyan
Write-Host " Project: $ProjectId | Region: $Region" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Set current project
gcloud config set project $ProjectId

# 2. Enable necessary GCP APIs
Write-Host "`n[1/3] Enabling Cloud Run and Artifact Registry APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 3. Deploy from source using Cloud Build
Write-Host "`n[2/3] Building and deploying container to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --source . `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --port 8080 `
    --memory 1Gi `
    --cpu 1

Write-Host "`n[3/3] Deployment complete!" -ForegroundColor Green
gcloud run services describe $ServiceName --platform managed --region $Region --format 'value(status.url)'
