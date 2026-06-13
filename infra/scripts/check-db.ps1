# ── Database Health Check ────────────────────────────────────────────────────
# Verifies the database layer is healthy and correctly configured.
#
# Checks:
#   1. Database container is running
#   2. PostgreSQL accepts connections (pg_isready)
#   3. All expected tables exist
#   4. Alembic migration state is current (at head)
#   5. Database volume is mounted
#
# Usage:
#   .\infra\scripts\check-db.ps1

$ProjectRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $ProjectRoot

$passed = 0
$failed = 0
$warnings = 0

function Pass($msg) { $script:passed++; Write-Host "  ✅ PASS: $msg" -ForegroundColor Green }
function Fail($msg) { $script:failed++; Write-Host "  ❌ FAIL: $msg" -ForegroundColor Red }
function Warn($msg) { $script:warnings++; Write-Host "  ⚠️  WARN: $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Diya Database Health Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Check 1: Container running ──────────────────────────────────────────
Write-Host "[1/5] Container Status" -ForegroundColor White
$dbState = docker compose ps db --format "{{.State}}" 2>$null
if ($dbState -eq "running") {
    Pass "Database container is running"
} else {
    Fail "Database container is not running (state: $dbState)"
    Write-Host ""
    Write-Host "Cannot continue. Start the stack: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

# ── Check 2: pg_isready ─────────────────────────────────────────────────
Write-Host "[2/5] PostgreSQL Connection" -ForegroundColor White
$pgReady = docker compose exec db pg_isready -U admin -d secondeye_dev 2>$null
if ($LASTEXITCODE -eq 0) {
    Pass "PostgreSQL is accepting connections"
} else {
    Fail "PostgreSQL is not ready"
}

# ── Check 3: Expected tables ────────────────────────────────────────────
Write-Host "[3/5] Table Verification" -ForegroundColor White
$expectedTables = @("users", "auth_sessions", "safety_events", "alembic_version")
$actualTables = docker compose exec db psql -U admin -d secondeye_dev -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>$null
$actualTableList = $actualTables -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }

foreach ($table in $expectedTables) {
    if ($actualTableList -contains $table) {
        Pass "Table '$table' exists"
    } else {
        Fail "Table '$table' is MISSING"
    }
}

# ── Check 4: Alembic migration state ────────────────────────────────────
Write-Host "[4/5] Alembic Migration State" -ForegroundColor White

# Check if API container is running (needed for alembic)
$apiState = docker compose ps api --format "{{.State}}" 2>$null
if ($apiState -eq "running") {
    $alembicCurrent = docker compose exec api alembic current 2>&1 | Select-String -Pattern "\(head\)"
    if ($alembicCurrent) {
        Pass "Alembic is at head"
    } else {
        $currentRev = docker compose exec api alembic current 2>&1 | Select-String -Pattern "^[a-f0-9]"
        Fail "Alembic is NOT at head (current: $currentRev)"
        Warn "Run: docker compose exec api alembic upgrade head"
    }
} else {
    Warn "API container is not running - cannot verify Alembic state"
}

# ── Check 5: Volume ─────────────────────────────────────────────────────
Write-Host "[5/5] Volume Status" -ForegroundColor White
$volumeInfo = docker volume inspect diya_postgres_data 2>$null
if ($LASTEXITCODE -eq 0) {
    Pass "Volume 'diya_postgres_data' exists"
} else {
    Fail "Volume 'diya_postgres_data' not found"
}

# ── Summary ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Results: $passed passed, $failed failed, $warnings warnings" -ForegroundColor $(if ($failed -gt 0) { "Red" } elseif ($warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($failed -gt 0) { exit 1 } else { exit 0 }
