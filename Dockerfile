FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS build
# Build-time switch: ASTRO_ADAPTER=bun emits a standalone Bun server
# (dist/server/entry.mjs); the default (Vercel) targets serverless deploy.
ARG ASTRO_ADAPTER
ENV ASTRO_ADAPTER=$ASTRO_ADAPTER
COPY --from=install /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
# env.ts validates eagerly at import during the build; supply valid placeholders
# (runtime uses real values from the container/environment).
ARG DATABASE_URL=postgres://x:x@localhost:5432/x
ARG REDIS_URL=redis://localhost:6379
ARG APP_BASE_URL=http://localhost:3000
ARG BETTER_AUTH_SECRET=build-time-placeholder-at-least-32-chars
ENV DATABASE_URL=$DATABASE_URL \
    REDIS_URL=$REDIS_URL \
    APP_BASE_URL=$APP_BASE_URL \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
RUN bun run build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 bunjs \
  && adduser --system --uid 1001 astro

COPY --from=build --chown=astro:bunjs /app/dist ./dist
COPY --from=build --chown=astro:bunjs /app/node_modules ./node_modules
COPY --from=build --chown=astro:bunjs /app/package.json ./package.json

USER astro

EXPOSE 3000

CMD ["bun", "run", "dist/server/entry.mjs"]
