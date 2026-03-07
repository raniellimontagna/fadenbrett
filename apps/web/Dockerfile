# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter @fadenbrett/web...

COPY apps/web/ apps/web/

# VITE_API_URL="" → requests go to same origin, proxied by Nginx
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @fadenbrett/web build

# ── Stage 2: serve ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
