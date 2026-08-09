## 1. Mapeo HTTP 503 + code en envelope

- [x] 1.1 TDD: añadir test de `mapErrorToHttp` para `InfraError` esperando `status: 503`, header `Retry-After`, `body.message` genérico y `body.code` preservado (`DB_ERROR`/`CACHE_ERROR`/`EXTERNAL_API_ERROR`).
- [x] 1.2 Ampliar `HttpErrorResponse` (`src/shared/errors/http-error-types.ts`) con `headers?: Record<string, string>`; añadir constante `INFRA_RETRY_AFTER_SECONDS = 30` (y `CacheTtl`/config si aplica) junto al mapper.
- [x] 1.3 Modificar la rama `InfraError` de `mapErrorToHttp`: `status: 503`, `message: 'Service unavailable'`, `headers: { 'Retry-After': '30' }`, conservando `Sentry.captureException` y el log `error`. La rama desconocida permanece en 500/`UNKNOWN_ERROR`.
- [x] 1.4 Añadir `code?: string` a `ApiEnvelope` (`api-envelope-types.ts`) y a `createErrorResponse` (`create-api-response-util.ts`): el envelope incluye `code` y además devuelve `headers` del mapper (retorno `{ payload, headers }`).
- [x] 1.5 Actualizar `withErrorHandling` para consumir `{ payload, headers }` y pasarlos a `jsonResponse(payload, headers, payload.status)`; actualizar bariles/index y cualquier consumidor directo de `createErrorResponse`. ✓ único consumidor runtime; barrel sin cambios.
- [x] 1.6 Actualizar `api-schema.ts`/`createApiResponseSchema` con `code?: string` opcional y actualizar los tests existentes del envelope de respuestas.
- [x] 1.7 Actualizar `db-degradation.test.ts` (y equivalentes de cache) a 500→503 con `Retry-After`; cubrir `UNKNOWN_ERROR` sigue en 500.

## 2. Readiness por-dependencia

- [ ] 2.1 TDD: test de `probeDatabase`/`probeCache` (o del módulo de health) con `@db/client` y cache mockeados: `select 1` ok → `'ok'`; fallo → `'down'` sin lanzar.
- [ ] 2.2 Implementar `src/pages/api/health/readiness.ts` con `withErrorHandling` y las probes `probeDatabase`/`probeCache` (cache: key con sufijo timestamp, TTL corto, round-trip SET+GET, `cacheDel` best-effort), respuesta `data: { db, cache }` con `200` si ambos arriba o `503` si alguno cae.
- [ ] 2.3 Test de la ruta: 200 con ambas dependencias ok; 503 y lista de caídas con una o ambas down; sin excepción cuando una probe falla.
- [ ] 2.4 Confirmar que `/api/health/readiness` queda público vía prefijo `/api/health` (test de `isPublicRoute`), sin tocar `public-routes.ts`.

## 3. Degradación elegante (stale-serve)

- [ ] 3.1 Añadir `CacheTtl.Stale` (30 días) a `src/lib/cache/config.ts` (o constate de la capa cache).
- [ ] 3.2 TDD: test de `withStaleCache` en `@lib/cache/cache-store` (mocks de primitivos): hit → `{ isStale: false }`; miss+compute ok → set de ambas keys y `{ isStale: false }`; compute con `InfraError` y valor `:stale` → `{ value: stale, isStale: true }`; sin valor `:stale` → rethrow del `InfraError`; error de dominio → rethrow sin stale.
- [ ] 3.3 Implementar `withStaleCache` en `src/lib/cache/cache-store.ts` (y exportarlo por el barrel `@lib/cache`), con firma genérica `{ key, staleKey, getCache, getStaleCache, setCache, setStaleCache, compute, shouldCache }`.
- [ ] 3.4 Adoptar `withStaleCache` en los servicios cache-first de DB (detalle `anime`, `anime-full`, `anime-list`, `anime-characters`, `anime-staff` y `music` donde existan): `key`/`staleKey` derivados del cache de dominio, `setStaleCache` con `CacheTtl.Stale`, retorno `{ value, isStale }`.
- [ ] 3.5 Propagar la marca: rutas API que usan estos servicios pasan `meta: { stale: isStale }` y `withErrorHandling`/`jsonResponse` convierte `meta.stale === true` en header `x-stale: true` (añadir test del wrapper).
- [ ] 3.6 Actualizar tests de los servicios adoptados (retorno `{ value, isStale }`) y añadir test de integración: cache con valor stale + DB caída → se sirve `isStale: true`; cache caída + DB ok → bypass a DB.

## 4. Página "Servicio no disponible"

- [ ] 4.1 Crear componente presentacional compartido `src/shared/components/service-unavailable/` (`ServiceUnavailable.astro` + `index.ts` barrel) con props `{ title, message, retryHref }`, heading + párrafo + `<a>` real (zero-JS), colores de tokens `@theme` y semántica/a11y (40h de TDD no aplica al .astro; verificación manual/build).
- [ ] 4.2 Actualizar páginas contenedoras SSR (`anime/[malId]/[slug].astro`, `anime/[malId]/index.astro`): try/catch del fetch; `InfraError` ⇒ `Astro.response.status = 503` + `<ServiceUnavailable />` dentro de `Base`; `DomainError`/not-found ⇒ mantener redirect `/404`.
- [ ] 4.3 Verificar que las páginas hoy sin fetch (`/`) no requieren cambios.

## 5. Docs y gate de verificación

- [ ] 5.1 Actualizar `AGENTS.md` (tabla de API routes con `/api/health/readiness`, patrón de errores: `InfraError` → 503 + `Retry-After`, `code` en envelope) y `README.md` (sección API/current status).
- [ ] 5.2 Ejecutar el gate completo local: `bun run format` → `bun run check` → `bun run check:types` → `bun run test` → `bun run build`.
- [ ] 5.3 Revisión DOUBT del cambio completo contra specs/diseño y `AGENTS.md` antes de abrir PR.