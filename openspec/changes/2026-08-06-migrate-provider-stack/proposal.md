## Why

El stack objetivo documentado en `AGENTS.md` (PostgreSQL, Dragonfly, Rustrak) no coincide con los providers que el código aún usa en producción (Turso/LibSQL, Upstash Redis REST, Sentry). Migrar la capa de infraestructura a providers auto-alojados elimina la dependencia de servicios gestionados de terceros, unifica el entorno real con el stack objetivo y habilita un pipeline reproducible vía Docker. Esta propuesta es el "provider swap" que OpenSpec rastrea como cambio pendiente.

## What Changes

- **BREAKING** — Reemplazar Turso SQLite por **PostgreSQL**: migrar los 22 schemas Drizzle de `drizzle-orm/sqlite-core` a `drizzle-orm/pg-core`, cambiar el cliente de `@libsql/client`+`drizzle-orm/libsql` a un driver `pg`/Node, y reemplazar las variables `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` por `DATABASE_URL`.
- **BREAKING** — Adaptar el adapter de Better Auth de `provider: 'sqlite'` a PostgreSQL y regenerar el schema de auth para `pg-core`.
- **BREAKING** — Reemplazar Upstash Redis REST por **Dragonfly** (Redis-compatible): cambiar el cliente de `@upstash/redis` a un cliente Redis estándar apuntando a una URL de Dragonfly; reemplazar `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` por variables de conexión Redis.
- **BREAKING** — Reemplazar Sentry por **Rustrak** (compatible con SDK de Sentry): migrar `src/lib/monitoring` para apuntar a un DSN de Rustrak manteniendo la API de `initServerSentry`/`initAstroSentry`/`wrapReactComponentWithSentry`, que pasan a ser passthrough/no-op.
- **BREAKING** — Actualizar `src/config/env.ts`, `.env.example`, y las dependencias de `package.json`.
- Crear el `drizzle.config` que falta (requisito bloqueante para `db:generate`/`db:migrate`).
- Ajustar JSDoc y comentarios que referencian Turso/Upstash/SQLite/Sentry.
- **Degradación elegante**: la app no debe fallar si un servicio no está disponible. Si Dragonfly cae, el cache degrada a miss (`cacheGet`/`cacheSet` no lanzan) y `withCache` cae directo a la base de datos; si la DB cae, las rutas dependientes devuelven un error tipado elegante (`mapErrorToHttp`) en vez de un crash de servidor; el monitoreo (Rustrak) nunca lanza en runtime.
- **Stack local aislado**: añadir `docker-compose` que levanta PostgreSQL, Dragonfly y Rustrak con URLs/credenciales locales separadas de las de producción, para desarrollo y pruebas sin tocar el entorno de producción.

## Capabilities

### New Capabilities

- `infrastructure/database`: Persistencia relacional vía Drizzle sobre PostgreSQL (`pg-core`) usando un driver Node, con cliente singleton y configuración de `drizzle-kit` para generar/aplicar migraciones.
- `infrastructure/cache`: Capa de cache Redis-compatible (Dragonfly) con cliente singleton, primitivas de cache y TTLs.
- `infrastructure/monitoring`: Reporte de errores y trazas auto-alojado compatible con el SDK de Sentry (Rustrak), con funciones de inicialización no-op cuando el DSN está ausente y que nunca lanzan en runtime.
- `infrastructure/local-development`: Instancia local aislada del stack completo (PostgreSQL, Dragonfly, Rustrak) orquestada con `docker-compose`, usando URLs/credenciales separadas de las de producción para desarrollo y pruebas.

### Modified Capabilities

Ninguna — `openspec/specs/` no contiene capacidades comprometidas todavía; todas las deltas son capacidades nuevas.

## Impact

- **Código**: `src/lib/db/**` (22 schemas + client + config), `src/lib/auth/server.ts`, `src/lib/cache/**`, `src/lib/monitoring/**`, `src/config/env.ts`, `package.json`.
- **Config**: `.env.example`, se reemplazarán las variables `TURSO_*`, `UPSTASH_*`, `SENTRY_DSN` por las del nuevo; se añadirá un `.env.local` de ejemplo para el stack local.
- **Dependencias**: salen `@libsql/client`, `@upstash/redis`, `@sentry/*`; entran `pg`/`postgres`, un cliente Redis, y apuntes de Rustrak (DSN compatible con SDK Sentry).
- **Infraestructura**: base de datos PostgreSQL, servidor Dragonfly, instancia Rustrak.
- **Supuesto registrado**: driver y proyecto objetivo, PostgreSQL genérico (no Supabase) según decisión del usuario; si el cliente Redis requiere nombre/servidor, se detalle en el design.