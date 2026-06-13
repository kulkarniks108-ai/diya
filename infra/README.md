# Diya Infrastructure & DevOps: Local Development Guide

Welcome to the Diya infrastructure workspace! This guide will get you from `git clone` to a fully running, hot-reloading development environment in under 5 minutes.

## 🚀 5-Minute Quick Start

1. **Clone the repository.**
2. **Copy Environment Variables:** 
   We have automated this, but if you want to inspect what's needed:
   `cp .env.example .env`
   *(Optional)* Edit `.env` to include your `GEMINI_API_KEY`.
3. **Start the Stack:**
   * **Windows:** `.\infra\scripts\start-dev.ps1`
   * **Mac/Linux:** `./infra/scripts/start-dev.sh`
   *(This will automatically copy `.env.example` to `.env` if you skipped step 2!)*

You're done! Docker will fetch images, build the Python environments using ultra-fast `uv`, run the database migrations, and mount your local codebase for hot-reloading.

## 🏗 Architecture & Services

When you run the start script, Docker Compose creates a dedicated `diya_network` and brings up the following services:

| Service | Port | Description |
| :--- | :--- | :--- |
| **API (`diya-api`)** | `8000` | The core Python FastAPI backend. Connected to the DB. Hot-reloads on save. |
| **Simulator (`diya-simulator`)** | `9000` | The Smart Goggles hardware simulator. Generates live JPEG captures, SSE telemetry streams, and registers with the backend. |
| **Database (`diya-db`)** | `5432` | PostgreSQL 16. Stores all users, auth sessions, and safety events. |
| **pgAdmin (`diya-pgadmin`)**| `5050` | A web-based GUI to inspect the database. |

### Accessing the Web Interfaces
- **FastAPI Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Smart Goggle Simulator UI:** [http://localhost:9000](http://localhost:9000)
- **pgAdmin:** [http://localhost:5050](http://localhost:5050) *(Login: `admin@diya.local` / `admin`)*

## 🛠 Startup Flow

1. **Database Boot & Healthcheck:** The `db` container starts. The `api` container explicitly waits until Postgres passes a `pg_isready` health check.
2. **Auto-Migrations:** Before the FastAPI server starts, the command `uv run alembic upgrade head` is automatically executed to ensure your schema is always up-to-date.
3. **Hot-Reload Server:** `fastapi run` starts with `--reload`. The source folders (`backend/api` and `hardware/smart-goggles/simulator`) are volume-mounted inside the containers. **You do not need to rebuild containers when writing code.**

## 🔐 Environment Variables

The project uses a **strict, fail-fast** configuration strategy via Pydantic Settings.
- The single source of truth is the `.env` file at the root of the repository.
- **Fail Fast:** If you are missing a critical key (like a Database Password), the FastAPI container will instantly crash with a Pydantic Validation Error.
- **Docker Networking vs Local:** When running via Docker Compose, `DB_HOST` is set to `db`. If you ever need to run the API directly on your host machine without Docker, change it to `DB_HOST=localhost`.

## 🥽 Phone ↔ Backend ↔ Simulator Communication

To test the full hardware loop without physical hardware:
1. Ensure the stack is running.
2. Open the **Smart Goggle Simulator UI** at `http://localhost:9000`.
3. In the UI, click **"Register with Phone"**.
   *(Note: Ensure your Flutter app is running on the same local network and its IP is configured in the simulator UI if testing from a physical device).*
4. Once registered, you can click **"Trigger SOS"** from the Simulator UI.
5. The Simulator will fire a network request to the Phone, which will securely relay the SOS event to the FastAPI backend!

## 🔧 Scripts Reference

We provide granular, single-responsibility scripts in `infra/scripts/` (both `.ps1` and `.sh`):

* `start-dev`: Brings up the stack.
* `stop-dev`: gracefully stops the stack.
* `migrate-db`: Runs Alembic migrations against the running DB.
* `reset-db`: **DESTRUCTIVE!** Drops the Postgres volume, recreates it, and runs migrations from scratch. Perfect if you get your local schema into a tangled state.

## 🚑 Common Troubleshooting

**"The API container keeps crashing on startup!"**
Run `docker compose logs api`. You likely have a missing required variable in your `.env` file causing a validation crash.

**"My code changes aren't reflecting in the API!"**
Ensure you are editing files inside `backend/api/app/`. The volume mount maps `./backend/api:/app`. If you edit files outside this bound directory, the container won't see them.

**"Alembic says my database is out of sync."**
Run `./infra/scripts/reset-db.sh` to blow away the database and start fresh.
