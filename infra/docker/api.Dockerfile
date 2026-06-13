FROM astral-sh/uv:python3.13-bookworm-slim AS builder

WORKDIR /app

# Enable bytecode compilation and copy environment path
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy package management files
COPY pyproject.toml uv.lock ./

# Install dependencies into a new virtual environment
RUN uv sync --frozen --no-install-project

# ==========================================

FROM python:3.13-slim-bookworm AS runner

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv /app/.venv

# Ensure the virtual environment is on the PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy the application code
COPY . /app/

# Expose FastAPI port
EXPOSE 8000

# Run the application (command overridden in docker-compose for hot reload)
CMD ["uv", "run", "fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
