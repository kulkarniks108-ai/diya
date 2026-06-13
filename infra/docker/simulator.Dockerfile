FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

WORKDIR /app

# Enable bytecode compilation and copy environment path
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy package management files
COPY pyproject.toml uv.lock ./

# Install dependencies into a new virtual environment
RUN uv sync --frozen --no-install-project

# ==========================================

FROM python:3.13-slim-bookworm AS runner

WORKDIR /app

# Install system dependencies for OpenCV in runner
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder stage
COPY --from=builder /app/.venv /app/.venv

# Ensure the virtual environment is on the PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy the application code
COPY . /app/

# Expose FastAPI port
EXPOSE 9000

# Run the application (command overridden in docker-compose for hot reload)
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
