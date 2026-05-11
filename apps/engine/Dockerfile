FROM node:24-slim

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy root workspace manifests
COPY package.json pnpm-workspace.yaml tsconfig.base.json tsconfig.json pnpm-lock.yaml ./

# Copy package manifests for each package to optimize layer caching
COPY packages/config/package.json ./packages/config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/core/package.json ./packages/core/
COPY packages/persistence/package.json ./packages/persistence/
COPY packages/providers/package.json ./packages/providers/
COPY packages/steps/package.json ./packages/steps/
COPY packages/strategy/package.json ./packages/strategy/
COPY packages/orchestration/package.json ./packages/orchestration/
COPY packages/executor/package.json ./packages/executor/
COPY apps/engine/package.json ./apps/engine/

# Install dependencies in freeze mode with ignored native scripts
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source directories
COPY packages/ ./packages/
COPY apps/engine/ ./apps/engine/

# Compile the entire TypeScript monorepo workspace
RUN npx tsc -b

EXPOSE 3000

CMD ["node", "apps/engine/dist/main.js"]
