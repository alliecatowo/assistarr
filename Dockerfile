# syntax=docker/dockerfile:1

# ============================================
# Assistarr Docker Build
# Multi-stage build for minimal production image
# ============================================

# Base image with Node.js LTS
FROM node:26-alpine AS base

# Install pnpm globally
# Node 25+ no longer bundles corepack, so install pnpm directly.
RUN npm install -g pnpm@9.12.3

# ============================================
# Dependencies Stage
# Install all dependencies (dev + prod)
# ============================================
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Build Stage
# Build the Next.js application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Skip environment validation during build (vars come from runtime)
ENV SKIP_ENV_VALIDATION=1

# Build the application with standalone output
RUN pnpm build

# Bundle the migration runner into one file (drizzle + postgres inlined) so the
# runtime image needs no node_modules for it
RUN pnpm exec esbuild lib/db/migrate.ts --bundle --platform=node --format=esm \
    --outfile=migrate.mjs --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"

# ============================================
# Runtime Stage
# Minimal production image
# ============================================
FROM node:26-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrations are applied on start (see CMD) by the bundled runner
COPY --from=builder --chown=nextjs:nodejs /app/lib/db/migrations ./lib/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/migrate.mjs ./migrate.mjs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check — uses /api/ready (fast, no DB round-trip) for liveness
# Full DB health available at /api/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/ready || exit 1

# Start the application
CMD ["sh", "-c", "node migrate.mjs && node server.js"]
