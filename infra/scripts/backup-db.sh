#!/usr/bin/env bash
# ── Database Backup ──────────────────────────────────────────────────────────
# Creates a timestamped pg_dump of the running PostgreSQL container.
# Output: ./backups/<timestamp>_secondeye_dev.sql
#
# Usage:
#   ./infra/scripts/backup-db.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Verify db container is running
if ! docker compose ps db --format "{{.State}}" 2>/dev/null | grep -q "running"; then
    echo "ERROR: Database container is not running."
    echo "Start the stack first: docker compose up -d"
    exit 1
fi

# Create backups directory
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamped filename
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${TIMESTAMP}_secondeye_dev.sql"

echo "Creating database backup..."
echo "  Container: diya-db"
echo "  Database:  secondeye_dev"
echo "  Output:    $BACKUP_FILE"

# Run pg_dump inside the container
docker compose exec -T db pg_dump -U admin --clean --if-exists --no-owner --no-privileges secondeye_dev > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup complete: $BACKUP_FILE ($SIZE)"
