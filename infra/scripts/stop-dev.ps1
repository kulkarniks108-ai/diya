# Stop the local development environment

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $ProjectRoot

Write-Host "Stopping Diya Development Stack..." -ForegroundColor Cyan
docker compose down
Write-Host "✅ Stopped." -ForegroundColor Green
