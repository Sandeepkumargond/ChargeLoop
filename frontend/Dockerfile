# ============================================================
# ChargeLoop Frontend - Production Dockerfile
# ============================================================
# Multi-stage build: build Next.js → serve with minimal image

FROM node:22-alpine AS base
WORKDIR /app

# ============================================================
# Install dependencies
# ============================================================
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ============================================================
# Build Next.js application
# ============================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Production runtime
# ============================================================
FROM base AS runner

RUN apk add --no-cache dumb-init

# Non-root user
RUN addgroup -g 1001 -S chargeloop && \
    adduser -S chargeloop -u 1001 -G chargeloop

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only what's needed for production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=chargeloop:chargeloop /app/.next/standalone ./
COPY --from=builder --chown=chargeloop:chargeloop /app/.next/static ./.next/static

USER chargeloop

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
