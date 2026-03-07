# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# python3 + make + g++ are required to compile better-sqlite3 native bindings
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter @fadenbrett/api...

COPY apps/api/ apps/api/

RUN pnpm --filter @fadenbrett/api build

# ── Stage 2: production runtime ────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache python3 make g++ && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/

# Install only production deps (with native compilation)
RUN pnpm install --frozen-lockfile --filter @fadenbrett/api... --prod

# Copy compiled JS from builder
COPY --from=builder /app/apps/api/dist apps/api/dist

# Data directory for SQLite + uploads
RUN mkdir -p /app/data/uploads

ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    DB_PATH=/app/data/fadenbrett.db \
    UPLOAD_DIR=/app/data/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
