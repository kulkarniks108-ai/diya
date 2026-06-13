#!/usr/bin/env bash
# ── Database Restore ─────────────────────────────────────────────────────────
# Restores a PostgreSQL backup from a .sql file into the running container.
#
# Usage:
#   ./infra/scripts/restore-db.sh ./backups/2026-06-13_120000_secondeye_dev.sql
#
# WARNING: This will overwrite all existing data in the database.

set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup-file.sql>"
    exit 1
fi

BACKUP_FILE="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Validate backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Verify db container is running
if ! docker compose ps db --format "{{.State}}" 2>/dev/null | grep -q "running"; then
    echo "ERROR: Database container is not running."
    echo "Start the stack first: docker compose up -d"
    exit 1
fi

echo "WARNING: This will overwrite all data in secondeye_dev!"
read -r -p "Are you sure? (y/n) " RESPONSE

if [ "$RESPONSE" != "y" ]; then
    echo "Aborted."
    exit 0
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Restoring database from backup..."
echo "  Source:   $BACKUP_FILE ($SIZE)"
echo "  Database: secondeye_dev"

# Pipe the SQL file into psql inside the container
docker compose exec -T db psql -U admin -d secondeye_dev --quiet < "$BACKUP_FILE"

echo "✅ Restore complete."
echo ""
echo "Verifying Alembic migration state..."
docker compose exec api alembic current
