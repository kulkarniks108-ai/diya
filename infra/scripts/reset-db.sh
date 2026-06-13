#!/usr/bin/env bash
# Reset the database completely (destroys data) and run migrations

cd "$(dirname "$0")/../.."

echo "WARNING: This will destroy all data in the local database!"
read -p "Are you sure? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Dropping database volume and recreating..."
    docker compose stop db
    docker compose rm -f db
    docker volume rm diya_postgres_data
    docker compose up -d db
    
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo "Running migrations..."
    ./infra/scripts/migrate-db.sh
    echo "✅ Database reset complete."
else
    echo "Aborted."
fi
