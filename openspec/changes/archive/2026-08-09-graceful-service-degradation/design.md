## Context

El flujo de errores hoy es: repositorios convierten fallos de conexión en `InfraError` → `mapErrorToHttp` devuelve **500** con mensaje genérico y `createErrorResponse` **descarta el `code`**, así que clientes/operadores no distinguen cuál dependencia cayó. El cache ya degrada a miss (`cacheGet`/`cacheSet` con try/catch) y `withCache` cae a la DB, pero si la DB cae la lectura muere con 500. La única ruta de salud es liveness (`/api/health`). Las páginas SSR (`anime/[malId]/[slug]`, `anime/[malId]/index`) no capturan `InfraError`, así que el framework termina renderizando un error plano. Variables/env módulos: `env.ts` eager, test runner sin `.env` (mock obligatorio).

Ver `proposal.md - Why` para la motivación y `openspec/changes/graceful-service-degradation/specs/**` para los requirements.

## Goals / Non-Goals

**Goals:**
- Semántica HTTP correcta: dependencia caída = **503** + `Retry-After`; el envelope expone `code` (`DB_ERROR`/`CACHE_ERROR`/`EXTERNAL_API_ERROR`/`UNKNOWN_ERROR`).
- Readiness real de DB y cache por-dependencia.
- Lecturas cache-first que no rompen cuando una dependencia cae: stale-serve con marca, cache-down con fallback a DB.
- Páginas SSR con vista amigable "Servicio no disponible" (presentacional, sin JS).
- Todo con TDD y dentro del gate de verificación.

**Non-Goals:**
- No se cambia el contrato interno de repositorios/servicios excepto donde el stale-serve lo requiere (retorno de `isStale`).
- No se toca la política de liveness `/api/health`.
- No se implementa badge visual de "datos stale" en páginas (la marca es a nivel HTTP/resultado).
- No se añaden client-side islands.

## Decisions

### D1 — `InfraError` → 503 + `Retry-After`; `HttpErrorResponse` gana `headers`
- `mapErrorToHttp` rama `InfraError`: `status: 503`, `body.code` = `error.code`, `body.message` = `'Service unavailable'` (genérico, igual de seguro que el actual), `body.meta.details` conserva `error.details`. Añade `headers: { 'Retry-After': '30' }` (constante `INFRA_RETRY_AFTER_SECONDS = 30`). Se conserva `Sentry.captureException` y el log `error`.
- El tipo `HttpErrorResponse` se amplía con `headers?: Record<string, string>`. La rama de error desconocido sigue en 500 con `UNKNOWN_ERROR` (sin `Retry-After`).
- **Por qué**: 500 debe significar "bug del servidor"; 503 es la semántica correcta para "dependencia caída, reintenta luego". `Retry-After` es lo que esperan clientes y balanceadores.
- **Alternativas**: mantener 500 con `Retry-After` (rechazado: semántica incorrecta); devolver 502 (rechazado: 502 = gateway impropio, aqui la web app está sana).

### D2 — Envelope de error expone `code`; stale se transporta por header `x-stale`
- `ApiEnvelope` gana `code?: string`. `createErrorResponse` copia `body.code` al envelope.
- `createErrorResponse` pasa a devolver `{ payload: ApiEnvelope<null>, headers?: Record<string,string> }` (los headers vienen del mapper). `withErrorHandling` hace `jsonResponse(payload, headers, payload.status)`. Es el único consumidor de la creación de respuestas de error; blast-radius pequeño (grep+update tests).
- El schema de validación de respuestas (`api-schema.ts`) se actualiza con `code?: string` opcional.
- Para stale: en respuestas exitosas, `meta.stale === true` se convierte en header `x-stale: true` en `jsonResponse`/`withErrorHandling` (y permanece en `meta`). Así la marca es HTTP, sin filtrar datos al cliente.
- **Por qué**: un solo punto (mapper) define la respuesta de error; el `code` es el contrato estable para branchear.
- **Alternativas**: meter `code` solo en `meta` (rechazado: ocultaría el contrato y el spec pide `error.code`); devolver headers como campo interno del envelope (rechazado: mezcla transporte con payload).

### D3 — `GET /api/health/readiness` con probes por-dependencia
- Nueva ruta `src/pages/api/health/readiness.ts` usando `withErrorHandling`, con dos probes privadas:
  - `probeDatabase()`: `await db.execute(sql\`select 1\`)` → `'ok'`; en catch → `'down'` + log warn.
  - `probeCache()`: `cacheSet('health:readiness:{ts}', ping, {ttlSeconds: 10})` + `cacheGet` round-trip → `'ok'` si devuelve `ping`; si no → `'down'` (+ `cacheDel` best-effort).
- Respuesta: `data: { db, cache }` con `status: 200` si ambos `'ok'`, si no `503`. Nunca lanza (probes con try/catch) → el `withErrorHandling` con result `{ data, status }` basta.
- Público: `/api/health/readiness` ya es público por el prefijo `/api/health` de `isPublicRoute` — no hace falta tocar `public-routes.ts`.
- **Por qué**: separar liveness (proceso vivo) de readiness (capaz de servir); probes baratas y no destructivas.
- **Alternativas**: SONDEAR en cada request con timeout (rechazado: coste en el hot path); mantener todo en `/api/health` (rechazado: acopla liveness a dependencias).

### D4 — Stale-serve con key compañera `:stale` (two-key)
- `withCache` se mantiene; se añade `withStaleCache` en `@lib/cache/cache-store` con firma genérica:
  ```
  { key, staleKey, getCache, getStaleCache, setCache, setStaleCache, compute, shouldCache } → { value, isStale }
  ```
  Flujo: `getCache(key)` → hit ⇒ `{ value, isStale: false }`. Miss ⇒ `compute()`:
  - Éxito ⇒ si `shouldCache`, `setCache(key)` (TTL normal) **y** `setStaleCache(staleKey)` (TTL largo, p. ej. nuevo `CacheTtl.Stale = 30d`) ⇒ `{ value, isStale: false }`.
  - Falla con `InfraError` ⇒ `getStaleCache(staleKey)`; si hay valor ⇒ `{ value: stale, isStale: true }`; si no ⇒ rethrow (el error tipado 503 se propaga).
  - Cualquier otro error (p. ej. `animeNotFound` del dominio) ⇒ rethrow sin stale (la DB estaba arriba; el not-found es real).
- Los caches de dominio no cambian: el servicio pasa de `withCache({...})` a `withStaleCache` usando `key: <cache>.key(x)`, `staleKey: <cache>.key(x) + ':stale'` y los primitivos `cacheGet`/`cacheSet` genéricos.
- Adopción en los servicios cache-first de datos DB de solo lectura: `anime` (detalle), `anime-full`, `anime-list`, `anime-characters`, `anime-staff` y `music` (según existan). La marca se expone como `meta.stale` en rutas API (→ header `x-stale`).
- **Por qué**: el fallo de recomputo ocurre justo cuando no hay valor *fresco* disponible (TTL expirado o primer hit); la key `:stale` guarda el último valor conocido sin los TTL cortos, permitiendo degradar a stale real sin tocar el shape de datos ni romper `cacheGet`/`cacheSet`.
- **Alternativas**: una sola key sin TTL con `cachedAt` (rechazado: cambia el shape de almacenamiento de todos los caches y rompe entradas existentes); servir stale solo cuando el cache devuelve valor (rechazado: no cubre el caso TTL-expirado, que es el que falla).

### D5 — Vista "Servicio no disponible" presentacional para páginas SSR
- Componente compartido `src/shared/components/service-unavailable/` con `ServiceUnavailable.astro` + `index.ts`: SFC presentacional con props `{ title, message, retryHref }`; heading + párrafo + `<a href={retryHref}>` real (sin JS), tokens de color `@theme`, semántica/A11y básica.
- Páginas contenedoras (`anime/[malId]/[slug].astro`, `anime/[malId]/index.astro`) envuelven el fetch en try/catch: `InfraError` ⇒ `Astro.response.status = 503` y renderizar `<ServiceUnavailable ... />` dentro del layout; `DomainError`/`animeNotFound` ⇒ mantener redirect 404 actual.
- **Por qué**: componentes presentacionales sin fetch (`presentational-container`); la página (container) decide estado HTTP y qué presentar.
- **Alternativas**: island React (rechazado: zero-JS, un `<a>` alcanza); reusar el componente de error de API (rechazado: la API es JSON, la página es HTML).

## Risks / Trade-offs

- [Semántica: cambiar 500→503 puede confundir monitores que esperan 500 para infras] → Mitigación: `Retry-After` + `code` expuesto; actualizar tests y docs (`AGENTS.md`/`README`) del mapeo.
- [`createErrorResponse` cambia de forma (`{ payload, headers }`)] → Mitigación: grep de usos (wrapper + tests) y actualización en el mismo task; el schema Zod de respuestas se alinea.
- [Key `:stale` puede crecer sin SENTIDO del todo] → Mitigación: TTL largo pero acotado (`CacheTtl.Stale`, 30 días); overwrite en cada recomputo exitoso.
- [Stale-serve puede esconder errores de datos] → Mitigación: solo aplica a lecturas cache-first de datos de catálogo (solo lectura); la marca `isStale`/`x-stale` es explícita.
- [DD con stale cambia el retorno de servicios (ahora `{ value, isStale }`)] → Mitigación: acotado a los servicios cache-first listados; páginas leen `value` y rutas API propagan `meta.stale`.
- [Probe de cache usa una key → colisiones en RRSS] → Mitigación: key con sufijo de timestamp y TTL corto.

## Migration Plan

1. Implementar D1+D2 (mapper, tipos, envelope, serialización) con tests (`db-degradation` 500→503, code en envelope).
2. Implementar D3 (readiness) con tests mockeando `@db/client`/cache.
3. Implementar D4 (primitiva stale + adopción por servicio) con tests de wrapper y de un servicio adoptado.
4. Implementar D5 (componente + páginas) con verificación del gate completo.
5. Actualizar `AGENTS.md` (tabla API routes, patrón de errores) y `README.md`.
6. Rollback: los cambios son aditivos sobre el envelope; revertir un commit previo no rompe contratos antiguos más allá del `code` opcional.

## Open Questions

- ¿Debe el readiness 503 incluir `Retry-After`? Aplazable sin cambiar specs (decisión de transporte).
- ¿Mostrar marca visual de datos stale en páginas SSR? Aplazable sin cambiar specs (solo se exige la marca HTTP).