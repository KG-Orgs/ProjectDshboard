# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@10.33.0

# ── Dependencies ──────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json  ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @contractor/backend... 

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=deps /app/packages/shared/node_modules  ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @contractor/shared build
RUN pnpm --filter @contractor/backend build

# ── Production image ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache wget

COPY --from=builder /app/packages/backend/dist          ./packages/backend/dist
COPY --from=builder /app/packages/backend/node_modules  ./packages/backend/node_modules
COPY --from=builder /app/packages/shared                ./packages/shared
COPY --from=builder /app/node_modules                   ./node_modules
COPY --from=builder /app/packages/backend/drizzle       ./packages/backend/drizzle

# Compat symlink: Render dashboard start commands often use dist/server.js.
RUN ln -sf backend/src/server.js packages/backend/dist/server.js

EXPOSE 3001
CMD ["node", "packages/backend/dist/backend/src/server.js"]
