# syntax=docker/dockerfile:1
# Root entrypoint for Render (API). Canonical twin: packages/backend/Dockerfile — keep in sync.
FROM node:20-alpine AS base
RUN npm install -g pnpm@10.33.0

# ── Dependencies ──────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json    ./packages/backend/
COPY packages/shared/package.json     ./packages/shared/
COPY packages/ai-actions/package.json ./packages/ai-actions/
RUN pnpm install --frozen-lockfile --filter @contractor/backend... 

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules    ./packages/backend/node_modules
COPY --from=deps /app/packages/shared/node_modules     ./packages/shared/node_modules
COPY --from=deps /app/packages/ai-actions/node_modules ./packages/ai-actions/node_modules
COPY . .
RUN pnpm --filter @contractor/shared build
RUN pnpm --filter @contractor/ai-actions build
RUN pnpm --filter @contractor/backend build

# ── Production image ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# poppler-utils provides pdftoppm (PDF→PNG for OCR).
# Pre-download the English Tesseract traineddata so the first OCR run doesn't
# hit the network; stored in /app/.tessdata which tesseract.js will find via
# TESSDATA_PREFIX / the TESSERACT_LANG_PATH env var.
RUN apk add --no-cache wget poppler-utils \
    && mkdir -p /app/.tessdata \
    && wget -q "https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata" \
         -O /app/.tessdata/eng.traineddata
ENV TESSERACT_LANG_PATH=/app/.tessdata

COPY --from=builder /app/packages/backend/dist          ./packages/backend/dist
COPY --from=builder /app/packages/backend/node_modules  ./packages/backend/node_modules
COPY --from=builder /app/packages/shared                ./packages/shared
COPY --from=builder /app/packages/ai-actions            ./packages/ai-actions
COPY --from=builder /app/node_modules                   ./node_modules
COPY --from=builder /app/packages/backend/drizzle       ./packages/backend/drizzle

# Compat symlink: Render dashboard start commands often use dist/server.js.
RUN ln -sf backend/src/server.js packages/backend/dist/server.js

EXPOSE 3001
CMD ["node", "packages/backend/dist/backend/src/server.js"]
