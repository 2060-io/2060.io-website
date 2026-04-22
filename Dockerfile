# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Stage 1 — install dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Install only production + dev deps needed to build.
COPY package.json package-lock.json* ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2 — build the standalone Next.js app
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 — minimal runtime image
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user for the runtime.
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001 -G nodejs

# Copy the standalone server + static assets + public assets.
# `output: "standalone"` in next.config.ts produces `.next/standalone` with
# a minimal server.js plus a pruned node_modules tree.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
