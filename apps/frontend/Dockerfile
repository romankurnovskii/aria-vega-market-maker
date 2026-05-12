FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root workspace manifests
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./

# Copy packages and frontend manifest
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/ ./packages/

# Install dependencies in freeze mode
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY apps/frontend/ ./apps/frontend/

WORKDIR /app/apps/frontend

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
