# Start the local development environment

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $ProjectRoot

Write-Host "Starting Diya Development Stack..." -ForegroundColor Cyan

# Copy .env.example to .env if it doesn't exist
if (-Not (Test-Path .env)) {
    Write-Host "No .env found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please update .env with your keys (like GEMINI_API_KEY) if needed." -ForegroundColor Yellow
}

# Bring up Docker compose
docker compose up --build -d

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "✅ Services started in the background." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "API (FastAPI):       http://localhost:8000"
Write-Host "Simulator (Goggles): http://localhost:9000"
Write-Host "pgAdmin:             http://localhost:5050"
Write-Host "PostgreSQL:          localhost:5432"
Write-Host ""
Write-Host "To view logs, run: docker compose logs -f"
Write-Host "To stop, run:      .\infra\scripts\stop-dev.ps1"
Write-Host "=============================================" -ForegroundColor Green
