FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
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
