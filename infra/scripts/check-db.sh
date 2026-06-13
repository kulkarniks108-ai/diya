#!/usr/bin/env bash
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
#   ./infra/scripts/check-db.sh

set -uo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

PASSED=0
FAILED=0
WARNINGS=0

pass() { ((PASSED++)); echo "  ✅ PASS: $1"; }
fail() { ((FAILED++)); echo "  ❌ FAIL: $1"; }
warn() { ((WARNINGS++)); echo "  ⚠️  WARN: $1"; }

echo ""
echo "═══════════════════════════════════════════════"
echo "  Diya Database Health Check"
echo "═══════════════════════════════════════════════"
echo ""

# ── Check 1: Container running
echo "[1/5] Container Status"
DB_STATE=$(docker compose ps db --format "{{.State}}" 2>/dev/null)
if [ "$DB_STATE" = "running" ]; then
    pass "Database container is running"
else
    fail "Database container is not running (state: $DB_STATE)"
    echo ""
    echo "Cannot continue. Start the stack: docker compose up -d"
    exit 1
fi

# ── Check 2: pg_isready
echo "[2/5] PostgreSQL Connection"
if docker compose exec db pg_isready -U admin -d secondeye_dev > /dev/null 2>&1; then
    pass "PostgreSQL is accepting connections"
else
    fail "PostgreSQL is not ready"
fi

# ── Check 3: Expected tables
echo "[3/5] Table Verification"
EXPECTED_TABLES=("users" "auth_sessions" "safety_events" "alembic_version")
ACTUAL_TABLES=$(docker compose exec -T db psql -U admin -d secondeye_dev -t -A -c \
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>/dev/null)

for TABLE in "${EXPECTED_TABLES[@]}"; do
    if echo "$ACTUAL_TABLES" | grep -qw "$TABLE"; then
        pass "Table '$TABLE' exists"
    else
        fail "Table '$TABLE' is MISSING"
    fi
done

# ── Check 4: Alembic migration state
echo "[4/5] Alembic Migration State"
API_STATE=$(docker compose ps api --format "{{.State}}" 2>/dev/null)
if [ "$API_STATE" = "running" ]; then
    ALEMBIC_OUTPUT=$(docker compose exec api alembic current 2>&1)
    if echo "$ALEMBIC_OUTPUT" | grep -q "(head)"; then
        pass "Alembic is at head"
    else
        fail "Alembic is NOT at head"
        warn "Run: docker compose exec api alembic upgrade head"
    fi
else
    warn "API container is not running - cannot verify Alembic state"
fi

# ── Check 5: Volume
echo "[5/5] Volume Status"
if docker volume inspect diya_postgres_data > /dev/null 2>&1; then
    pass "Volume 'diya_postgres_data' exists"
else
    fail "Volume 'diya_postgres_data' not found"
fi

# ── Summary
echo ""
echo "═══════════════════════════════════════════════"
if [ $FAILED -gt 0 ]; then
    echo "  Results: $PASSED passed, $FAILED failed, $WARNINGS warnings"
elif [ $WARNINGS -gt 0 ]; then
    echo "  Results: $PASSED passed, $FAILED failed, $WARNINGS warnings"
else
    echo "  Results: $PASSED passed, $FAILED failed, $WARNINGS warnings"
fi
echo "═══════════════════════════════════════════════"
echo ""

if [ $FAILED -gt 0 ]; then exit 1; else exit 0; fi
