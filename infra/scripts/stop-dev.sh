#!/usr/bin/env bash
# Stop the local development environment

cd "$(dirname "$0")/../.."

echo "Stopping Diya Development Stack..."
docker compose down
echo "✅ Stopped."
