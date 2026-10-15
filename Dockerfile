FROM oven/bun:1.3 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS build
# Standalone server output is always emitted by @astrojs/node now; no adapter
# build-time switch needed.
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

RUN groupadd --system --gid 1001 bunjs \
  && useradd --system --uid 1001 --gid bunjs astro

# Runtime installs production dependencies only (devDependencies stay in the
# build stage); the standalone server needs no build tooling to run.
COPY --from=build /app/package.json /app/bun.lock* ./
RUN bun install --production --frozen-lockfile --ignore-scripts
COPY --from=build --chown=astro:bunjs /app/dist ./dist

USER astro

EXPOSE 3000

CMD ["bun", "run", "dist/server/entry.mjs"]
