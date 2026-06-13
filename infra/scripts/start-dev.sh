#!/usr/bin/env bash
# Start the local development environment

# Navigate to project root
cd "$(dirname "$0")/../.."

echo "Starting Diya Development Stack..."

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "No .env found. Copying from .env.example..."
    cp .env.example .env
    echo "Please update .env with your keys (like GEMINI_API_KEY) if needed."
fi

# Bring up Docker compose
docker compose up --build -d

echo ""
echo "============================================="
echo "✅ Services started in the background."
echo "============================================="
echo "API (FastAPI):       http://localhost:8000"
echo "Simulator (Goggles): http://localhost:9000"
echo "pgAdmin:             http://localhost:5050"
echo "PostgreSQL:          localhost:5432"
echo ""
echo "To view logs, run: docker compose logs -f"
echo "To stop, run:      ./infra/scripts/stop-dev.sh"
echo "============================================="
