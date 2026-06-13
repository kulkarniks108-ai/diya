# Run database migrations against the running Docker database

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $ProjectRoot

Write-Host "Running Alembic migrations..." -ForegroundColor Cyan
docker compose exec api alembic upgrade head
Write-Host "✅ Migrations complete." -ForegroundColor Green
