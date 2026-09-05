# ============================================================
# ChargeLoop Backend - Production Dockerfile
# ============================================================
# Uses multi-stage build for smaller image size.
# In Kubernetes, use server.js (single process) — K8s manages replicas.
# Do NOT use server-cluster.js inside containers.

FROM node:22-alpine AS base

WORKDIR /app

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Copy package files first for better Docker layer caching
COPY package*.json ./

# ============================================================
# Production dependencies only
# ============================================================
FROM base AS production-deps
RUN npm ci --only=production --ignore-scripts

# ============================================================
# Final production image
# ============================================================
FROM base AS production

# Non-root user for security
RUN addgroup -g 1001 -S chargeloop && \
    adduser -S chargeloop -u 1001 -G chargeloop

# Copy production dependencies
COPY --from=production-deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Remove dev files not needed in production
RUN rm -rf .env .git .gitignore nodemon.json server-cluster.js

# Set ownership
RUN chown -R chargeloop:chargeloop /app

USER chargeloop

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Use dumb-init to handle SIGTERM/SIGINT properly
# Use server.js (single process) — K8s deployment replicas handle scaling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
