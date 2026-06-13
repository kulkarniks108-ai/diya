# ── Database Backup ──────────────────────────────────────────────────────────
# Creates a timestamped pg_dump of the running PostgreSQL container.
# Output: ./backups/<timestamp>_secondeye_dev.sql
#
# Usage:
#   .\infra\scripts\backup-db.ps1

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $ProjectRoot

# Verify db container is running
$dbStatus = docker compose ps db --format "{{.State}}" 2>$null
if ($dbStatus -ne "running") {
    Write-Host "ERROR: Database container is not running." -ForegroundColor Red
    Write-Host "Start the stack first: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

# Create backups directory if it doesn't exist
$backupDir = Join-Path $ProjectRoot "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Generate timestamped filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = Join-Path $backupDir "${timestamp}_secondeye_dev.sql"

Write-Host "Creating database backup..." -ForegroundColor Cyan
Write-Host "  Container: diya-db" -ForegroundColor Gray
Write-Host "  Database:  secondeye_dev" -ForegroundColor Gray
Write-Host "  Output:    $backupFile" -ForegroundColor Gray

# Run pg_dump inside the container and pipe output to local file
docker compose exec -T db pg_dump -U admin --clean --if-exists --no-owner --no-privileges secondeye_dev > $backupFile

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $backupFile).Length
    $sizeKB = [math]::Round($size / 1024, 1)
    Write-Host "✅ Backup complete: $backupFile ($sizeKB KB)" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed." -ForegroundColor Red
    Remove-Item $backupFile -ErrorAction SilentlyContinue
    exit 1
}
