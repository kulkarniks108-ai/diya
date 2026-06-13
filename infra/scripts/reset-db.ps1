# Reset the database completely (destroys data) and run migrations

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $ProjectRoot

Write-Host "WARNING: This will destroy all data in the local database!" -ForegroundColor Red
$response = Read-Host "Are you sure? (y/n)"

if ($response -eq 'y') {
    Write-Host "Dropping database volume and recreating..." -ForegroundColor Cyan
    docker compose stop db
    docker compose rm -f db
    docker volume rm diya_postgres_data
    docker compose up -d db
    
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    Write-Host "Running migrations..." -ForegroundColor Cyan
    .\infra\scripts\migrate-db.ps1
    Write-Host "✅ Database reset complete." -ForegroundColor Green
} else {
    Write-Host "Aborted." -ForegroundColor Yellow
}
