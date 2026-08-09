## Why

Cuando la base de datos y/o el cache están caídos pero la web app sigue en pie, cualquier ruta que los toque devuelve un **500 genérico** (`error: "Internal server error"`) sin exponer qué dependencia falló (`code` se pierde en el envelope), la semántica HTTP es incorrecta para una dependencia degradada (debería ser 503), no hay un readiness que detecte servicios caídos, las lecturas cache-first no sirven datos cacheados ante una DB caída, y las páginas SSR muestran un error plano en vez de una vista amigable de "servicio no disponible".

## What Changes

- **Mapeo HTTP de `InfraError` a 503** (`DB_ERROR`, `CACHE_ERROR`, `EXTERNAL_API_ERROR`) con header `Retry-After` y mensaje client-safe. El 500 queda reservado para errores desconocidos/no-`BaseError`.
- **Exponer el `code` estable en el envelope de error** (nuevo campo `error.code`) para que clientes y operadores distingan `DB_ERROR` vs `CACHE_ERROR` vs `UNKNOWN_ERROR`; `details` se conserva en `meta`.
- **`GET /api/health/readiness`** (público): pingea DB (`SELECT 1`) y cache (SET+GET), devuelve estado por-dependencia (`{ db, cache }`) y responde `200` si todo está arriba o `503` con los servicios caídos. `/api/health` se mantiene como liveness simple.
- **Degradación elegante en lecturas cache-first**: si hay un valor cacheado y la DB falla al recomputar, se sirve el dato stale marcado con header `x-stale: true`; si el cache cae, se hace bypass directo a la DB (ya degrada a miss). Las lecturas no fallan si una dependencia cae.
- **Páginas con error amigable**: en SSR, cuando un servicio lanza `InfraError`, la página renderiza un panel presentacional "Servicio no disponible · reintentar" en vez del error 500 plano.

## Capabilities

### New Capabilities

- `infrastructure/error-handling`: mapeo HTTP de errores de infraestructura — 503 + `Retry-After` para `InfraError`, `code` estable expuesto en el envelope de error.
- `infrastructure/health`: endpoint de readiness público que detecta disponibilidad de DB y cache por-dependencia.
- `infrastructure/resilience`: lecturas cache-first que degradan sin fallar — stale-serve con `x-stale` cuando la DB cae y cache-down con fallback a DB.
- `frontend/error-pages`: páginas SSR que renderizan un panel presentacional de "servicio no disponible" ante fallos de infraestructura.

### Modified Capabilities

Ninguna — `infrastructure/monitoring` (liveness `/api/health`) mantiene sus requirements sin cambios; el readiness es una capacidad nueva separada.

## Impact

- **Código**: `src/shared/errors/map-error-to-http.ts`, `src/shared/http/create-api-response-util.ts`, `src/shared/http/api-envelope-types.ts`, `src/shared/http/api-response-serialize-util.ts`, nueva ruta `src/pages/api/health/readiness.ts`, `src/lib/cache/cache-store.ts` o helper de stale-cache, repos cache-first de los dominios `anime`/`music`, páginas SSR (`src/pages/index.astro`, `src/pages/anime/**`), componente presentacional compartido `service-unavailable`, `src/config/public-routes.ts` (+`/api/health/readiness`).
- **APIs**: envelope de error gana `error.code`; `InfraError` pasa de 500 a 503+`Retry-After`; nuevas respuesta `x-stale` en lecturas degradadas; nueva ruta pública `/api/health/readiness`.
- **Tests**: actualizar `db-degradation.test.ts` (500→503), añadir tests de readiness, stale-serve y code en envelope.
- **Docs**: `AGENTS.md` (tabla de API routes + patrón de errores), `README.md` (sección Current status/API).