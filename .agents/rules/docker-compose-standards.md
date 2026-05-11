---
description: Expert Docker Compose standards for pnpm monorepos (Node 24, dev/prod, env files, persistent volumes)
globs: ['docker-compose*.yml', 'docker-compose*.yaml', 'Dockerfile*', '.env*']
version: 2.0.0
alwaysApply: false
trigger: always_on
---

# Docker Compose Architecture & Style Standards

This rule enforces production-grade Docker Compose patterns for a `pnpm` workspace monorepo containing Node applications (`engine`, `frontend`) and shared `packages`. It enforces clean dev/prod separation, correct env file handling, and safe volume mount strategies for stateful trading bots.

---

## 1. Response Constraints (Strict)

- **Preservation**: Do NOT remove existing services, volumes, or networks unless explicitly asked.
- **Images**: Always use `node:24-slim` (or current project Node version) for Node services.
- **Package Manager**: Always use `pnpm`. Never use `npm` or `yarn` in Dockerfiles or commands.
- **Formatting**: 2-space indent. No trailing spaces. One blank line between top-level keys.

---

## 2. Monorepo Directory Layout

```text
repo-root/
├── apps/
│   ├── engine/          ← Backend daemon loop / REST API
│   │   ├── Dockerfile
│   │   └── package.json
│   └── frontend/        ← Frontend UI
│       ├── Dockerfile
│       └── package.json
├── packages/            ← Shared domain logic, steps, providers
│   ├── core/
│   ├── orchestration/
│   └── ...
├── data/                ← Critical persistence directory (logs, JSON state)
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── pnpm-workspace.yaml
├── package.json
├── .env                 ← Local dev secrets
├── .env.example         ← Committed template
└── .env.prod            ← Production secrets
```

---

## 3. Environment Files

### Rules

- **`.env`**: Local development values. Always gitignored. Referenced in `docker-compose.dev.yml`.
- **`.env.prod`**: Production values. Always gitignored. Never generated locally. Referenced in `docker-compose.prod.yml`.
- **`.env.example`**: Committed to git. Contains all required keys with blank values.
- Never hardcode secrets in Compose files. All values come from env files.

---

## 4. Dockerfile Standards (pnpm Workspace)

Because this is a monorepo, Docker builds require workspace context.

### App Dockerfile (e.g., `apps/engine/Dockerfile`)

_Note: Context must be passed from the repo root in docker-compose._

```dockerfile
FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/engine/package.json ./apps/engine/
COPY packages/ ./packages/

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source code
COPY apps/engine/ ./apps/engine/

WORKDIR /app/apps/engine

CMD ["pnpm", "start"]

```

### Dockerfile Rules

- Use `corepack enable` to activate `pnpm`.
- Use `--mount=type=cache` for the pnpm store to speed up builds.
- Always install with `--frozen-lockfile`.
- `--no-install-recommends` on all `apt-get install` calls if system dependencies are needed.

---

## 5. Development Compose (`docker-compose.dev.yml`)

Key behaviours:

- Mounts source directories for hot reload.
- **Critical Persistence**: Always mount `./data:/app/data` to ensure the LP bot retains execution history, assignments, and logs.
- Prevents host `node_modules` from overwriting container modules using named volumes.

```yaml
services:
  engine:
    build:
      context: .
      dockerfile: apps/engine/Dockerfile
    image: lp-engine:dev
    command: pnpm --filter engine run dev
    env_file: .env
    ports:
      - '8000:8000'
    volumes:
      - .:/app # Mount full workspace for hot reload
      - ./data:/app/data # CRITICAL: Persist JSON state & logs
      - node_modules:/app/node_modules # Shadow host node_modules
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    image: lp-frontend:dev
    command: pnpm --filter frontend run dev --host 0.0.0.0
    env_file: .env
    ports:
      - '5173:5173'
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    restart: unless-stopped

volumes:
  node_modules:
```

---

## 6. Production Compose (`docker-compose.prod.yml`)

Key behaviours:

- Uses `env_file: .env.prod`.
- Maps a named volume to `/app/data` so the LP bot retains state across container rebuilds.
- `restart: always` for resilience.

```yaml
services:
  engine:
    build:
      context: .
      dockerfile: apps/engine/Dockerfile
    image: lp-engine:latest
    env_file: .env.prod
    expose:
      - '8000'
    volumes:
      - engine_data:/app/data # CRITICAL: Persist production state
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3
    restart: always

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile.prod
    image: lp-frontend:latest
    env_file: .env.prod
    expose:
      - '80'
    restart: always

volumes:
  engine_data:

networks:
  default:
    name: lp-system-prod
```

---

## 7. Security & Execution Rules

- **Data Safety**: Never run the engine without a persistent volume mapped to `/app/data`. The system relies on local JSON adapters (`@lp-system/persistence`) and will wipe positions/assignments if run purely ephemeral.
- **Networking**: Never expose internal database or metric ports to the host in production. Use `expose` (internal Docker network) rather than `ports` (host bind).

---

## 11. Common Commands Reference

```bash
# Start dev environment
docker compose -f docker-compose.dev.yml up --build

# Start dev in background
docker compose -f docker-compose.dev.yml up -d --build

# Tail logs for one service
docker compose -f docker-compose.dev.yml logs -f backend

# Rebuild a single service without restarting others
docker compose -f docker-compose.dev.yml up -d --build backend

# Run a one-off command (e.g. Alembic migration) in dev
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# Stop and remove containers (keep volumes)
docker compose -f docker-compose.dev.yml down

# Stop and remove containers AND volumes (wipe DB)
docker compose -f docker-compose.dev.yml down -v

# Production deploy (on remote server, .env.prod already present)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 12. Security Rules

- Never use `env_file: .env.prod` in a dev Compose file — a stale local `.env.prod`
  would silently point your dev containers at production databases.
- Never expose database ports (`27017`, `5432`) in prod — use `expose` (internal only),
  not `ports` (binds to host network).
- Nginx config and certs are always mounted `:ro` (read-only).
- `SECRET_KEY`, `MONGODB_URL`, and `POSTGRES_URL` must never appear in a committed file.
  They live only in `.env` (local) and `.env.prod` (remote).

---

## 13. Feature Checklist (Adding a New Service)

1. Add the service to **both** `docker-compose.dev.yml` and `docker-compose.prod.yml`.
2. Add any new env vars to **`.env.example`** with blank values.
3. Add the actual values to **`.env`** locally and update the remote `.env.prod` on the server.
4. Add a `healthcheck` to the new service.
5. Add `depends_on: condition: service_healthy` on any service that depends on it.
6. If it has persistent data, declare a named volume and add it to the top-level `volumes:` block.
7. Verify `.env` and `.env.prod` remain in `.gitignore`.
