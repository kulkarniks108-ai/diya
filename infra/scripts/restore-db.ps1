# ── Database Restore ─────────────────────────────────────────────────────────
# Restores a PostgreSQL backup from a .sql file into the running container.
#
# Usage:
#   .\infra\scripts\restore-db.ps1 -BackupFile .\backups\2026-06-13_120000_secondeye_dev.sql
#
# WARNING: This will overwrite all existing data in the database.

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $ProjectRoot

# Validate backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "ERROR: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Verify db container is running
$dbStatus = docker compose ps db --format "{{.State}}" 2>$null
if ($dbStatus -ne "running") {
    Write-Host "ERROR: Database container is not running." -ForegroundColor Red
    Write-Host "Start the stack first: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "WARNING: This will overwrite all data in secondeye_dev!" -ForegroundColor Red
$response = Read-Host "Are you sure? (y/n)"

if ($response -ne 'y') {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

$resolvedPath = Resolve-Path $BackupFile
$sizeKB = [math]::Round((Get-Item $resolvedPath).Length / 1024, 1)

Write-Host "Restoring database from backup..." -ForegroundColor Cyan
Write-Host "  Source:   $resolvedPath ($sizeKB KB)" -ForegroundColor Gray
Write-Host "  Database: secondeye_dev" -ForegroundColor Gray

# Pipe the SQL file into psql inside the container
Get-Content $resolvedPath -Raw | docker compose exec -T db psql -U admin -d secondeye_dev --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Restore complete." -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying Alembic migration state..." -ForegroundColor Cyan
    docker compose exec api alembic current
} else {
    Write-Host "❌ Restore failed." -ForegroundColor Red
    exit 1
}
