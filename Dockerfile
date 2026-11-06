# SelfPressBooks – production image (Next.js standalone + better-sqlite3)
# NOTE: this Dockerfile was written but NOT built in the development container.

# ---- deps: install with build tools for the native better-sqlite3 module ----
FROM node:20-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

# ---- build ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public && npm run build

# ---- runtime ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/app/data
RUN groupadd -r app && useradd -r -g app -d /app app \
  && mkdir -p /app/data/uploads && chown -R app:app /app/data
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# Read at runtime (not traced by Next): DB schema and the admin script.
COPY --from=builder --chown=app:app /app/lib/schema.sql ./lib/schema.sql
COPY --from=builder --chown=app:app /app/scripts ./scripts
# The admin script needs these modules; make sure they exist even if tracing trimmed them.
COPY --from=builder --chown=app:app /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=app:app /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=app:app /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder --chown=app:app /app/node_modules/bcryptjs ./node_modules/bcryptjs
USER app
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
