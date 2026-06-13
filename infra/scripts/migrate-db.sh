#!/usr/bin/env bash
# Run database migrations against the running Docker database

cd "$(dirname "$0")/../.."

echo "Running Alembic migrations..."
docker compose exec api alembic upgrade head
echo "✅ Migrations complete."
