## 1. Entorno y dependencias

- [x] 1.1 Actualizar `.env.example`: reemplazar `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` por `DATABASE_URL`, y `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` por `REDIS_URL`; conservar el resto.
- [x] 1.2 Actualizar `src/config/env.ts`: schema Zod (quitar Turso/Upstash, añadir `DATABASE_URL` y `REDIS_URL` obligatorias con `z.url()`), objeto de parse y JSDoc de `@module`/`@property`.
- [x] 1.3 Actualizar la augmentation `ImportMetaEnv` en `src/types/env.d.ts` si referencia las variables legacy.
- [x] 1.4 Actualizar dependencias en `package.json`: eliminar `@libsql/client` y `@upstash/redis`; añadir `pg`, `ioredis` (y `@types/pg` en dev).
- [x] 1.5 Ejecutar `bun install` y verificar resolución de dependencias.

## 2. Persistencia PostgreSQL

- [x] 2.1 Migrar `src/lib/db/client.ts` a `drizzle-orm/node-postgres` con `Pool` de `pg` conectado a `DATABASE_URL`; actualizar JSDoc.
- [x] 2.2 Migrar los 22 schemas de `drizzle-orm/sqlite-core` a `drizzle-orm/pg-core`: `sqliteTable`→`pgTable`, `integer({mode:'boolean'})`→`boolean`, `integer({mode:'timestamp_ms'})`→`timestamp(..., {mode:'date'})`, defaults `unixepoch(...)`→`sql`\`now()\``.
- [x] 2.3 Migrar el schema de auth (`auth-schema.ts`) a `pg-core` y sus relaciones.
- [x] 2.4 Actualizar JSDoc de `src/lib/db/index.ts`, `src/lib/db/config.ts` y schemas que referencien Turso/SQLite.
- [x] 2.5 Crear `drizzle.config.ts` (dialect `postgresql`, `DATABASE_URL`, directorio `drizzle/`) para habilitar `db:generate`/`db:migrate`.
- [x] 2.6 Regenerar el schema de Better Auth con `bun run auth:generate`.

## 3. Cache sobre Dragonfly

- [x] 3.1 Migrar `src/lib/cache/client.ts` a `ioredis` con `REDIS_URL`; actualizar JSDoc.
- [x] 3.2 Ajustar `cache-primitives.ts` al API de `ioredis`: `JSON.parse` en `cacheGet`, `set(key, value, 'EX', ttl)` en `cacheSet`, `del(key)` en `cacheDel`; actualizar JSDoc (Upstash→Redis).
- [x] 3.3 Actualizar JSDoc de `src/lib/cache/index.ts` y `src/lib/cache/config.ts` (referencias a Upstash REST).

## 4. Monitoreo Rustrak

- [x] 4.1 Actualizar `src/lib/monitoring/sentry.ts` y `index.ts`: JSDoc apuntando a Rustrak auto-hospedado; mantener API y comportamiento no-op con DSN ausente.

## 5. Auth y middleware

- [x] 5.1 Cambiar `drizzleAdapter(db, { provider: 'sqlite' })` a `provider: 'postgres'` en `src/lib/auth/server.ts` y actualizar JSDoc.
- [x] 5.2 Revisar `src/middleware/auth-middleware.ts` y cualquier referencia a Turso/SQLite en middleware.

## 6. Degradación elegante

- [x] 6.1 Envolver operaciones de `ioredis` en try/catch en `cache-primitives.ts`: `cacheGet` resuelve `null` ante fallo de conexión, `cacheSet`/`cacheDel` no lanzan; log de advertencia con pino (sin propagar).
- [x] 6.2 Verificar que `withCache` cae directo a la DB cuando el cache degrada (test de integración del wrapper con cache caído).
- [x] 6.3 Revisar repos/servicios de DB: consultas envueltas en try/catch que traducen fallos de conexión a `AppError` para que `mapErrorToHttp` devuelva un error elegante sin crash.
- [x] 6.4 Confirmar que el `Pool` de `pg` conecta lazy (sin conexión en import) para permitir arrancar con DB caída.
- [x] 6.5 Verificar que `initServerSentry`/`initAstroSentry`/`wrapReactComponentWithSentry` nunca lanzan en runtime (backend caído o DSN ausente).

## 7. Stack local aislado

- [x] 7.1 Crear `docker-compose.yml` con servicios PostgreSQL, Dragonfly y Rustrak: puertos locales, volúmenes nombrados, red propia y healthchecks por servicio.
- [x] 7.2 Crear `.env.local.example` con las URLs/credenciales del stack local (distintas de producción) y documentar su uso en `AGENTS.md` o un README breve.
- [ ] 7.3 Verificar que `docker compose up` levanta los tres servicios y que `db:migrate` aplica contra la instancia local.

## 8. Pruebas y gate de verificación

- [x] 8.1 Actualizar/añadir tests de `cache-primitives` (mockeando el cliente `ioredis`) cubriendo round-trip, miss, TTL y degradación a miss ante fallo de conexión.
- [x] 8.2 Actualizar/añadir tests de `env` para las nuevas variables `DATABASE_URL`/`REDIS_URL` (con `vi.mock('@config/env')` según convención).
- [x] 8.3 Añadir test de degradación: repos/servicios de DB devuelven `AppError` mapeable cuando la DB está caída.
- [x] 8.4 Ejecutar el gate completo: `bun run format` → `bun run check` → `bun run check:types` → `bun run test` → `bun run build`.
- [x] 8.5 Revisar que no queden referencias residuales a `TURSO`, `UPSTASH`, `sqlite-core`, `@libsql/client` o `@upstash/redis` en `src/`.
