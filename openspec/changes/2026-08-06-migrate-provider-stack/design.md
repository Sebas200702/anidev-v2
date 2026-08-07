## Context

El código aún corre sobre Turso (SQLite), Upstash Redis REST y Sentry (ver `proposal.md - Why`). Todo descansa en tres módulos de infraestructura: `src/lib/db/**` (cliente `@libsql/client` + 22 schemas `sqlite-core`), `src/lib/cache/**` (cliente `@upstash/redis`), y `src/lib/monitoring/**` (SDKs `@sentry/*`). Las variables de entorno viven en `src/config/env.ts` con validación Zod eager. No existe `drizzle.config`, pero `package.json` ya expone `db:generate`/`db:migrate`. El despliegue es Astro SSR (adapter Vercel) con Bun.

## Goals / Non-Goals

**Goals:**
- Migrar toda la persistencia a PostgreSQL genérico vía driver Node (`pg`), con `pg-core` en los 22 schemas.
- Cambiar el adapter de Better Auth de `provider: 'sqlite'` a `'postgres'`.
- Sustituir Upstash por un cliente Redis estándar conectado a Dragonfly conservando la API de cache (`cacheGet`/`cacheSet`/`cacheDel`/`withCache`).
- Apuntar el monitoreo (SDK Sentry) a un backend auto-hospedado Rustrak mediante el DSN.
- Dejar `drizzle.config` listo para `db:generate`/`db:migrate`.
- Implementar degradación elegante: la app no falla si un servicio está caído (cache degrada a miss+fallo a DB; rutas de DB devuelven error tipado; monitoreo nunca lanza).
- Proveer un stack local aislado con `docker-compose` (PostgreSQL + Dragonfly + Rustrak) con URLs/credenciales separadas de producción.

**Non-Goals:**
- No se migran datos existentes de Turso (fuera de alcance; la base es recargable desde fuentes públicas).
- No se cambia la semántica de negocio ni los contratos de repos/servicios/rutas.
- No se toca la infraestructura desplegada de Dragonfly; solo el lado de código cliente.

## Decisions

### D1: Driver PostgreSQL — `pg` (node-postgres) en `drizzle-orm/node-postgres`
- **Elección**: usar un `Pool` de `pg` con `drizzle-orm/node-postgres` y una sola variable `DATABASE_URL`.
- **Por qué**: el usuario eligió "Postgres genérico (pg/Node)"; `pg` es el driver Node estándar, soportado por `drizzle-orm/node-postgres` y compatible con Bun. Evita depender de un pooler serverless de proveedor.
- **Alternativas**: `postgres-js` (más moderno pero menos convencional para este repo), `@neondatabase/serverless` o el pooler de Supabase (rechazados porque no es Postgres genérico).

### D2: `drizzle-orm/pg-core` en todos los schemas
- `sqliteTable` → `pgTable`; import de `drizzle-orm/sqlite-core` → `drizzle-orm/pg-core`.
- `integer({ mode: 'boolean' })` → `boolean(...)` (SQLite representaba booleanos como int; Postgres tiene tipo nativo).
- `integer({ mode: 'timestamp_ms' })` → `timestamp(col, { mode: 'date' })`; los defaults SQLite `unixepoch(...)` pasan a `sql`\`now()\``, conservando `$onUpdate`.
- Índices y `primaryKey` compuesto de `sqlite-core` → equivalentes de `pg-core`.
- Nombres de tabla/columna se mantienen (snake_case) para no romper repos y consultas.

### D3 — Adapter de Better Auth a `provider: 'postgres'`
- Cambiar `drizzleAdapter(db, { provider: 'sqlite' })` → `'postgres'` y regenerar el schema de auth con `bun run auth:generate`. El resto de la config en `src/lib/auth/server.ts` no cambia.

### D4 — Cache sustituido por `ioredis` (protocolo Redis estándar)
- **Elección**: `ioredis` con URL `REDIS_URL` (`redis://host:port`), compatible con Dragonfly.
- **Por qué**: Upstash usa REST HTTP; Dragonfly habla protocolo Redis nativo. `ioredis` cubre get/set/ex/del y mantiene el API de cache sin romper llamadas de dominio.
- **Adaptación**: `cache-primitives` hoy delega `get<T>` (Upstash deserializa solo) y `set(..., { ex })`. Con `ioredis`, `get` devuelve string → hay que `JSON.parse` explícito; `set(key, value, 'EX', ttl)`; `del(key)`. `cacheSet` ya hace `JSON.stringify`, así que solo cambia el transporte y la conversión en `cacheGet`.
- **Alternativa**: `redis` v4 de node-redis — más verboso; `ioredis` es el cliente habitual para Dragonfly.

### D5 — Monitoreo hacia Rustrak conservando la superficie Sentry
- Mantener `initServerSentry`/`initAstroSentry`/`wrapReactComponentWithSentry` y los SDK `@sentry/*`; el cambio es apuntar el DSN a la instancia auto-hospedada Rustrak (que habla el protocolo de Sentry). `SENTRY_DSN` se conserva como nombre de variable.
- **Por qué**: AGENTS.md indica que Rustrak es "Sentry-SDK compatible" y "no-ops when DSN unset"; migrar solo el DSN evita reescribir la capa y conserva el comportamiento no-op.
- **No se renombra** la variable DSN ni se cambia `tracesSampleRate`/`NODE_ENV`.

### D6 — Variables de entorno
- Eliminar `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` → añadir `DATABASE_URL` (obligatoria, `z.url()`).
- Eliminar `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` → añadir `REDIS_URL` (obligatoria, `z.url()`).
- Conservar `SENTRY_DSN`, `APP_BASE_URL`, `BETTER_AUTH_SECRET`, `LOG_LEVEL`, `NODE_ENV`.
- Actualizar `.env.example`, `env.ts` (schema + parse + JSDoc) y la augmentation `types/env.d` si existe.

### D7 — Crear `drizzle.config.ts` (pendiente del repo)
- Config apuntando a `DATABASE_URL`, dialect `postgresql`, y directorio de migraciones (`drizzle/`).
- `db:generate`/`db:migrate` quedan operativos contra PostgreSQL.

### D8 — Degradación elegante (app no falla ante servicio caído)
- **Cache**: `cacheGet`/`cacheSet`/`cacheDel` envuelven la llamada a `ioredis` en try/catch; ante error de conexión, `cacheGet` resuelve `null` (miss) y `cacheSet`/`cacheDel` resuelven sin efecto, de modo que `withCache` cae directo a la fuente de verdad (DB).
- **DB**: mantener `DATABASE_URL` obligatoria en config (validación eager de sintaxis), pero la conexión es lazy — el `Pool` de `pg` no conecta en import. Las rutas/servicios envuelven consultas en try/catch y traducen el fallo a un `AppError` que `mapErrorToHttp` convierte en una respuesta de error elegante (5xx), sin crash del proceso. El pool de `pg` reintenta automáticamente al volver la DB.
- **Monitoreo**: los SDKs de Sentry ya no lanzan cuando el backend está caído ni tienen DSN; se conserva el comportamiento no-op y se verifica con test que no tiran.
- **Por qué**: objetivos del usuario ("todo degrada, incl. DB", "cache cae directo a DB").
- **Alternativa**: hacer `DATABASE_URL` opcional — rechazado para no romper el fail-fast de config de AGENTS.md; la DB degrada en runtime, no en arranque.

### D9 — `docker-compose` para stack local aislado
- Añadir `docker-compose.yml` con tres servicios: PostgreSQL, Dragonfly y Rustrak, cada uno con puertos, volúmenes nombrados y healthchecks propios, en una red definida por compose.
- Provisionar contrastes locales (`DATABASE_URL` apuntando a `postgres://localhost:<puerto>/...`, `REDIS_URL` a `redis://localhost:<puerto>`, `SENTRY_DSN`/Rustrak a `http://localhost:<puerto>/...`).
- Añadir un `.env.local.example` que apunta al stack local (separado de `.env.example` de producción).
- **Por qué**: stack reproducible y aislado; AGENTS.md ya usa Docker/CD.
- **Alternativa**: correr servicios manualmente en la máquina — rechazada porque no aísla versiones central y no es reproducible.

## Risks / Trade-offs

- **Tipado de `pg` + Bun** → validar con `bun run check:types` y `build`; si `pg` da problemas en Bun, Node >=22 lo soporta igual.
- **Diferencia boolean/timestamp** → asegurar el mapeo correcto en los schemas; mitigar revisando los 22 schemas uno a uno y cubriendo con `db:generate` para detectar diferencias de dialecto.
- **Dragonfly no disponible en dev** → el cache degrada a miss sin error; los dominios siguen sirviendo desde DB.
- **Adaptación JSON en cache** → riesgo de romper serialización si no se ajusta `cacheGet` con `JSON.parse`; cubierto con tests de primitivas de cache.
- **Regenerar schema de auth** → si no se regenera, el schema de auth queda desincronizado con `pg-core`; tarea explícita en `tasks.md`.
- **Tragar errores de cache puede enmascarar misconfiguración** → se registra un log de advertencia (pino) una vez por fallo para no ocultar problemas, sin propagar la excepción.
- **DB caída silenciosa de queries de rutas** → asegurado con try/catch + `AppError` + `mapErrorToHttp`; test explícito de degradación en `tasks.md`.

## Migration Plan

1. Actualizar `.env.example` + `env.ts`: `DATABASE_URL` y `REDIS_URL`.
2. Migrar cliente y schemas DB a `pg-core`, y crear `drizzle.config`.
3. Migrar el cliente de cache a `ioredis` y ajustar `cache-primitives`.
4. Apuntar el monitoreo al DSN de Rustrak (sin cambios de API).
5. Regenerar migraciones: `bun run db:generate` (SQL Postgres) y `bun run db:migrate` (aplica a la instancia).
6. `bun run auth:generate` para el schema de auth en `pg-core`.
7. Actualizar dependencias en `package.json` (quitar `@libsql/client`, `@upstash/redis`; añadir `pg`, `ioredis`).
8. Implementar degradación elegante (cache try/catch → miss; repos/servicios DB → `AppError`; monitoreo no lanza).
9. Añadir `docker-compose.yml` (Postgres + Dragonfly + Rustrak), `.env.local.example` y documentación de uso.
10. Rollback: mantener el commit del swap reversible; si falla, volver al `master` anterior y restaurar el env legacy.

## Open Questions

Ninguna que cambie arquitectura o tareas. El cliente `ioredis` se asume adecuado para Dragonfly por protocolo. Si en dev no hay Dragonfly, los tests de cache usan un stub (detalle en `tasks.md`).