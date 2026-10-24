# AniDev v2 — Roadmap

> Estado: vivo. Este documento define **qué** se construye y **en qué orden**.
> El **cómo** de cada feature vive en su change de OpenSpec (`openspec/changes/`),
> que es la fuente de verdad ejecutable, y en la arquitectura objetivo detallada
> en [`ARCHITECTURE.md`](./ARCHITECTURE.md). Este roadmap es la vista de producto;
> los specs son el contrato.

## Contexto

AniDev v2 es una reconstrucción desde cero de v1 (cerrada, solo referencia) con
mejor arquitectura y prácticas, enriquecida con los patrones de ingeniería de
reproducción, sincronización de progreso, salas **Watch2Gether** y
recomendación híbrida auditados frente a `Snozxyx/Tatakai` (ver
[`ARCHITECTURE.md`](./ARCHITECTURE.md)). La v1 define el **piso de paridad**; la
meta es igualarla y superarla por _slices verticales_.

**Principio rector:** _priorizar el descubrimiento claro de contenido_ (ver
`PRODUCT.md`). El orden de fases lo refleja: primero endurecer cimientos, luego
el catálogo y la búsqueda, identidad/listas, música, IA, streaming y
Watch2Gether.

## Estado actual (24 de octubre de 2026)

Cimientos endurecidos (Fase 0 salvo SEO base); catálogo, búsqueda y obra
impresa expuestos por API; listas y progreso con API de servidor. La UI aún
cubre solo home, búsqueda y ficha de anime básica.

| Dominio | Estado |
|---|---|
| **infra** | Health, error-handling, monitoring (Rustrak), resilience/degradación, cache multicapa (Dragonfly), response-schema validation en el wrapper, request-id, rate-limiting, CSP y cabeceras de seguridad, `pg.Pool` acotado. |
| **anime** | Read: lista/detalle/`full`/characters/staff/episodios (`/api/anime/:malId/episodes`). **Búsqueda avanzada**: filtros (season/score), sort whitelist, free-text indexado (`pg_trgm`, también sinónimos), floor parental safe-only. Páginas `/anime/[malId]/[slug]` y `/search?genre=` (taxonomía por género). El reparto omite personajes con nombre provisional. |
| **search** | Historial por usuario (record best-effort + read/clear authed) y búsqueda de catálogo pública `GET /api/search?q=&type=anime\|manga`. |
| **manga** | Obra impresa (manga, novela, one-shot): `/api/manga` (filtros, safe), `/api/manga/:malId` (reparto con voz) y `/full`. Sin páginas. |
| **music** | Read: lista + detalle, nº de tema, rango de episodios y enlaces de tienda. Sin player. |
| **media** | Optimización de imágenes (Sharp), proxy con guarda SSRF, streaming `Range` `206`, caché de imágenes en disco acotado. |
| **auth** | Login/register/logout/session (Better Auth). |
| **user** | Perfil (read con privacidad owner-only + writes de identidad), listas relacionales (`/api/user/lists`) y progreso de visionado con *Continue Watching* (`/api/user/watch-progress`). Sin UI. |

**Archivados (OpenSpec):** migración provider stack (Turso→Postgres, Upstash→
Dragonfly, Sentry→Rustrak), `api-response-schema-in-wrapper`, unit folders,
`standardize-frontend-flow`, user writes, `advanced-anime-search`,
`e2e-testing-methodology` + `expand-test-coverage-and-fix-e2e-bugs`,
`platform-audit-and-stabilization`, `component-showcase`,
`home-shell-and-featured-carousel`, `catalog-coverage-fields`,
`episode-catalog-api`, `taxonomy-and-discover`,
`relational-lists-and-watch-progress` y `printed-media-domain`. Sus deltas
están sincronizados en `openspec/specs/`.

**Changes planificados listos para ejecutar (`openspec/changes/`):**
- `resilient-playback-and-aniskip` _(en curso)_ — Motor `PlaybackCoordinator` (leases por generación + `AbortController` + continuidad de segundo exacto), `HlsController` con *fast-probe* paralelo (1.5 s) y failover automático, esquema `episode_source` enriquecido e integración con **AniSkip** + catálogo musical OP/ED.
- `watch2gether-synchronized-rooms` — Salas sincronizadas **Watch2Gether** para anime y música (`public`, `invite`, `password` con `password_hash` server-only), reloj en tiempo real y Pub/Sub en Dragonfly + SSE, corrección de deriva en 3 niveles ($>2.5\text{ s}$ seek, $0.35\text{–}2.5\text{ s}$ `playbackRate` $\pm 0.08$, $\le 0.35\text{ s}$ `1.0x`), cola compartida, chat, reacciones y encuestas.
- `watch-progress-client-sync` — Seguimiento de las listas: sync de progreso en el cliente (`localStorage` + `sendBeacon` + merge al iniciar sesión) y e2e de listas/progreso. Depende del player de `resilient-playback-and-aniskip`.
- `ingest-queue-postgres` / `isolated-provider-service` — Track D: cola de ingesta del scraper sobre Postgres y servicio de proveedores aislado del VPS.
- `hybrid-taste-and-ai-recommendations` — Motor híbrido de recomendaciones en 2 niveles: Nivel 1 determinista + `pgvector` en PostgreSQL (`UserTasteProfile` con score de engagement de 5 factores + deduplicación de franquicias, <50 ms, coste $0) y Nivel 2 curador contextual con Gemini (`fetch_recommendations`) cacheado en Dragonfly con fallback automático al Nivel 1.

## Cómo se entrega cada feature

Cada capacidad se implementa como **slice vertical completo**, no por capas
horizontales:

```text
repository → service → mapper → cache → schema (Zod) → API → isla/página → showcase → tests
```

Reglas transversales en **todas** las fases:

- **OpenSpec obligatorio**: `SPECIFY → PLAN → TASKS → IMPLEMENT`. Nada se codea sin spec aprobado.
- **TDD** con Vitest: test que falla antes del fix.
- **Accesibilidad**: contraste ≥ 4.5:1, navegación por teclado, `focus-visible`, `prefers-reduced-motion`.
- **Diseño dark-only**, tokens de Tailwind v4, sin colores hardcodeados.
- **SEO** y performance por defecto (SSR + islas on-demand).
- **Gate de verificación**: `format → check → check:types → test → build`.

---

## Fases

### Fase 0 — Cerrar y endurecer cimientos · _prioridad P0/P1_

Desbloquea todo lo demás. Estabiliza la base y corrige los hallazgos críticos de
la auditoría técnica antes de escalar las fases de producto.
_(Changes archivados: `platform-audit-and-stabilization` y `component-showcase`.)_

- [x] Terminar changes abiertos: provider stack, response-schema wrapper, unit folders, frontend-flow, user writes (todos archivados).
- [x] **Privacidad en perfiles (`T-01`)**: proyectar `preferences` e `history.watchedAnimes` como `owner-only` en `GET /api/user/:userId` (incluso en *cache hit*).
- [x] **Streaming HTTP `Range` (`206`) y caché de medios (`T-02`, `T-03`, `T-07`)**: incluir `version`/`resolution` en `buildRawMetaKey`, eliminar doble `JSON.stringify`, servir audio/vídeo en `ReadableStream` con soporte `Range` (`206 Partial Content`) sin cargar archivos completos en `Buffer` de RAM, añadir timeout (`8 s`) + guarda anti-SSRF en `fetchMediaAsset`, y mover las imágenes optimizadas (Sharp) de base64 en Dragonfly a caché en disco acotado con `Cache-Control: public, max-age=31536000, immutable`.
- [x] **Consistencia de errores y degradación en Home (`T-04`)**: unificar el sobre de error con `createErrorResponse` en `withZodValidation` y `/media`, omitir `error.details` en respuestas 503 al cliente y añadir `try/catch` con `<ServiceUnavailable />` (503) en `src/pages/index.astro`.
- [x] **Índices PostgreSQL, FKs y `pg.Pool` acotado (`T-05`, `T-06`)**: índices B-tree en todas las FKs de tablas `*_media`/`music_*` y columnas de filtro/sort de `anime`, índice único en `profile.user_id`, GIN `pg_trgm` en `anime_title_synonym.title`, `ON DELETE CASCADE` en uniones de catálogo, límite `max: 20` en `pg.Pool` y reubicación de `resolveMediaAssets` fuera de `src/shared/` con regla en `biome.json`.
- [x] **Middleware transversal (`T-08`)**: `x-request-id`, rate-limiting en Dragonfly, sesión ligera (saltar DB en `/media/*`, `/api/health*`, `/showcase` y cachear sesión 60 s en Dragonfly), CSP + headers de seguridad (`nosniff`, `DENY`, `Referrer-Policy`).
- [ ] **SEO base**: sitemaps segmentados (anime, manga, música, géneros, estáticos) + `robots.txt`. _(Único pendiente de la Fase 0.)_
- [x] **Patrón de UI documentado y `/showcase` operativo** (living docs — change `component-showcase`, archivado 2026-10-15).

**Salida:** base blindada en seguridad, memoria y latencia SQL + patrón de UI repetible.

---

### Fase 1 — Núcleo de descubrimiento 🎯 · _prioridad inmediata_

El corazón del producto. Convierte la v2 en un catálogo explorable de verdad.

- [x] **Búsqueda avanzada** — filtros: género, tipo, score (rango), estado, año, rating, temporada + `search_query`; orden configurable; paginación. **Estudio/productora y día de emisión quedan diferidos** hasta el backfill del Track D. _(Change archivado: `advanced-anime-search`; optimización `Promise.all` + búsqueda en `anime_title_synonym` en `platform-audit-and-stabilization`.)_
- [x] **Homepage** — héroe SSR (carrusel de destacados: los más populares con
  banner + clearlogo, cacheado como un solo payload) + grilla top-rated, sobre
  el nuevo app shell y la capa de tokens. **Rails temáticos adicionales**
  (por temporada, por género) quedan pendientes.
  _(Change archivado: `home-shell-and-featured-carousel`; elegibilidad set-based
  y fan-out por lotes en `platform-audit-and-stabilization`.)_
- [ ] **Ficha de anime completa** — sinopsis, géneros, personajes, relacionados, banners (servicios sobre tablas relacionales existentes).
- [ ] **Taxonomía** — por género ✅ (`/search?genre=`, change archivado `taxonomy-and-discover`); **por estudio/productora pendiente**.
- [x] **Control parental** — exclusión de ratings adultos embebida en las queries del catálogo (default seguro, fail-closed; variante `full` requiere opt-in, change pendiente).
- [x] **Historial de búsqueda** — persistido por usuario autenticado (read/clear en `/api/search-history`).

**Salida:** descubrimiento end-to-end; prerequisito de las recomendaciones IA.

---

### Fase 2 — Identidad y listas · _retención + base de personalización_

_(Change semilla: `relational-lists-and-watch-progress`.)_

- [ ] **Perfil completo** — avatar (subida + recorte vía dominio media/Pinata), preferencias (color de énfasis, control parental), campos extendidos para IA (géneros/estudios favoritos, nivel de fanatismo, frecuencia, formato preferido).
- [ ] **OAuth e importación externa** — flujos de proveedores además de email/password + importación/sincronización idempotente de listas con **MyAnimeList** y **AniList** aprovechando `anime.mal_id` y `anime_external_ids`.
- [ ] **Listas de anime relacionales (`user_anime_list`)** — _API lista (change archivado `relational-lists-and-watch-progress`); falta la UI y el sync de cliente (`watch-progress-client-sync`)._ — reemplaza el CSV `profile.favorite_animes` por una tabla relacional con estados (`watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`), `is_favorite`, `score` (1–10) y add/remove **optimista + deshacer**.

**Salida:** cuenta con estado propio e integridad referencial; datos estructurados que alimentan la IA.

> **Decisión documentada (G.6, 2026-10-15): verificación por email fuera de
> alcance de este cambio.** El registro neutraliza la enumeración (respuesta
> genérica ante duplicados) y el throttle frena el abuso, pero no hay flujo
> de verificación (token por correo, expiración, reenvío). Se implementa en
> un change dedicado cuando exista proveedor SMTP (Fase 2, junto a OAuth),
> no como parte del endurecimiento. Pre-publicación quedan además: un pase
> DAST y una prueba de carga (ver diseño §8).

---

### Fase 3 — Música y player · _joya de v1, dominio autocontenible_

_(Changes relacionados: `platform-audit-and-stabilization` para Range 206 y `resilient-playback-and-aniskip` para `PlaybackCoordinator`.)_

- [ ] **Player persistente** — `transition:persist` + `client:idle`, conectado a Nano Stores / Zustand y al **`PlaybackCoordinator`** compartido (cancelación por generación `PlaybackLease` + conservación exacta del segundo actual al conmutar modo Audio ↔ Vídeo o resolución).
- [ ] **Playlist** — add/remove con toast + undo, siguiente/anterior, shuffle, repeat, limpiar.
- [ ] **Cola "Up Next"** reordenable por drag & drop.
- [ ] **Versión/resolución**, modo audio/video, autoplay al terminar, player arrastrable minimizado.
- [ ] **Mejora sobre v1**: playlists **persistidas por usuario en BD** (no solo `sessionStorage`).
- [ ] **Descargas** — openings/endings en audio/video con versión/resolución vía `/api/download`.

**Salida:** paridad + superación del dominio más maduro de v1 sobre una base de reproducción sin fugas de memoria.

---

### Fase 4 — Recomendaciones IA Híbridas · _depende de catálogo + perfil + listas_

_(Change: `hybrid-taste-and-ai-recommendations`.)_

- [ ] **Nivel 1 — Motor Determinista + Vectorial en PostgreSQL (<50 ms, coste $0)**:
  - Construcción de `UserTasteProfile` a partir de `user_anime_list`, `watch_progress` y `search_history` usando ponderación de engagement en 5 factores (`breadth * 0.30 + completion * 0.25 + recency * 0.20 + consistency * 0.15 + progress * 0.10` con decaimiento exponencial de 28 días).
  - **Deduplicación de franquicias (`dedupeFranchiseSignals`)** mediante relaciones `Sequel`/`Prequel` en `anime_relation` para que múltiples temporadas de una misma serie no saturen las semillas ni los resultados.
  - Similitud vectorial con `pgvector` + afinidad de géneros/estudios + exclusión estricta de títulos ya vistos/listados y respeto del floor parental (`safe`/`full`), devolviendo `reasons` explicables por tarjeta.
- [ ] **Nivel 2 — Curador Contextual Gemini (`fetch_recommendations`)**:
  - Re-ranking y justificación sin spoilers sobre los 40 mejores candidatos prefiltrados por el Nivel 1 para contextos en lenguaje natural (*búsqueda actual, viendo, mood, similar-a, estacional, maratón, quick watch, asistente conversacional*).
  - **Cache-first en Dragonfly + rate-limit por usuario + fallback automático al Nivel 1** cuando Gemini devuelve vacío, supera el timeout (`6 s`) o no está disponible.

**Salida:** descubrimiento personalizado instantáneo, explicable y con coste de API acotado.

---

### Fase 5 — Watch / streaming resiliente y Watch2Gether ⚠️

En v1 `episode.video_url` está vacío: el streaming **no funciona end-to-end**.
_(Changes: `resilient-playback-and-aniskip`, `relational-lists-and-watch-progress` y `watch2gether-synchronized-rooms`.)_

- [ ] **Spike de fuente de video** — decisión de legalidad/hosting/integración + backfill de episodios. **Bloqueante del backfill de fuentes de episodios.**
- [ ] **Esquema `episode_source` y `episode_subtitle` enriquecido** — añadir `provider`, `server_name`, `format` (`hls` | `mp4` | `webm`), `quality`, `audio` (`sub` | `dub`), `headers` (`jsonb`) y `priority`.
- [ ] **Video proxy de streaming** — streaming por `ReadableStream` con soporte de `Range` (`206 Partial Content`), reescritura segura de manifiestos `.m3u8` e inyección en servidor de cabeceras `Referer`/`User-Agent` (nunca exponiendo secretos de proxy en variables `PUBLIC_*`).
- [ ] **Motor de reproducción (`PlaybackCoordinator` + `HlsController`)** — sondeo rápido en paralelo de candidatos (`1500 ms` timeout vía `firstFulfilled`), reintentos acotados (`MAX_NETWORK_RETRIES = 2`, `MAX_MEDIA_RETRIES = 2`, `swapAudioCodec()`) y salto automático al siguiente servidor candidato.
- [ ] **Salto de Intro/Outro (AniSkip + Cruce con Música)** — resolución y caché en Dragonfly de segmentos `op`/`ed`/`recap` vía AniSkip (`malId` + `episodeNumber`) vinculados con los temas de `music` del anime.
- [ ] **Continuar viendo (`watch_progress`)** — sincronización en 3 capas (`localStorage` síncrono + `navigator.sendBeacon` + PostgreSQL `watch_progress`) con resolución de conflictos `isNewerOrBetter` (ventana de tolerancia de `1000 ms` desempatando por mayor `progress_seconds`), completado automático al $\ge 90\%$ y colapso a 1 tarjeta por anime.
- [ ] **Watch2Gether / Salas Sincronizadas (`watch-rooms`)** — salas de visualización y escucha en grupo (`public`, `invite`, `password` con `password_hash` verificado en servidor) para episodios de anime y playlists de música OP/ED:
  - Reloj en tiempo real y difusión de eventos en **Dragonfly (`watch:room:{id}:clock` + Pub/Sub) vía SSE** (cero escrituras en PostgreSQL por cada tick de reproducción).
  - **Corrección de deriva en 3 niveles (`computeDriftCorrection`)**: $|\Delta t| > 2.5\text{ s}$ → *hard seek*; $0.35\text{ s} < |\Delta t| \le 2.5\text{ s}$ → ajuste suave de `playbackRate` ($\pm 0.08$, rango `[0.92, 1.08]`); $|\Delta t| \le 0.35\text{ s}$ → `1.0x`.
  - Cola compartida de episodios/temas (`watch_room_queue`), chat en vivo con reacciones (`watch_room_message`), encuestas en tiempo real (`watch_room_poll`), transferencia automática de host al salir y cierre de salas inactivas ($>5\text{ min}$ sin heartbeat).

**Salida:** streaming resiliente individual y grupal (Watch2Gether) con sincronización de nivel producción.

---

### Fase 6 — Contenido enriquecido

- [ ] **Personajes / artistas / seiyuu** — páginas dedicadas (`/character`, `/artist`, `/voice-actor`) + **backfill** de enlaces voice-actor (v1: ~4.2k de 217k).
  _Datos listos (2026-10-19): el reparto completo por anime (la ficha HTML de
  MAL corta en 10; la API v2 da la lista entera), con rol fino de AniList,
  voz, biografía y retrato de cada personaje._
- [ ] **Schedule** — calendario semanal de estrenos/emisiones con filtro personalizado *"Mis series en emisión"* (cruzado con `user_anime_list.status = 'watching'`).
- [ ] **Colecciones** — `/collection/[slug]` con gestión personal.
- [ ] **Obra impresa: manga y novela** — _API completa (lista, detalle con voces, `/full`, búsqueda por tipo); faltan las páginas `/manga`._ — dominio nuevo (migración `0010`):
  70.958 obras (57.867 manga, 6.991 novelas, 6.000 one-shots) con sinopsis,
  capítulos, serialización, editorial, relaciones, enlaces y portada; reparto
  y staff propios; búsqueda con filtro por tipo.
  _(Change archivado: `printed-media-domain`; API `/api/manga`, `/api/manga/:malId`,
  `/api/manga/:malId/full` y `/api/search?type=manga`.)_

**Salida:** fichas ricas y conexiones cruzadas música ↔ artista ↔ seiyuu ↔ obra impresa.

---

### Fase 7 — Expansión del universo · _nuevas capacidades_

- [ ] **Social** — reseñas/comentarios con claves foráneas explícitas por anime/episodio (evitando tablas polimórficas sin FK), ratings/reacciones, perfiles públicos compartibles, seguir usuarios, feed de actividad, foros/clubs por temporada/género.
- [ ] **Notificaciones** — nuevos episodios de la watch list (push/email), recordatorios de estreno ligados al schedule e invitaciones a salas Watch2Gether.
- [ ] **Gamificación** — logros/insignias (maratones, joyas ocultas), retos de visualización.
- [ ] **AniDev Wrapped** — estadísticas anuales personalizadas calculadas sobre `watch_progress` y `user_anime_list`.
- [ ] **PWA / offline** — música descargada y listas.
- [ ] **i18n** — unificar UI (inglés) y prompts (español); múltiples idiomas.

**Salida:** comunidad y engagement; la v2 supera a v1 en ambición.

---

## Track D — Plataforma de Datos · _paralelo a las fases_

El catálogo de v2 es hoy un **volcado congelado (~2.25M filas, derivado de MAL)**
sin pipeline vivo: no se refresca, y faltan `studios`/`licensors`, `broadcast`,
trailers y `episode.video_url`. La ingesta se retoma desde el scraper existente
([`anime-scraper-v2`](https://github.com/Sebas200702/anime-scraper-v2)), cuya
arquitectura (cola de tareas en DB, rotación de proxies, multi-fuente, batch
upsert) es sólida pero falla por **bloqueos** y **tareas perdidas**.

**Fuentes:** Jikan v4 (metadata, characters, staff, episodios-metadata,
relaciones, **studios/producers/licensors**, **broadcast**, trailers) ·
AnimeThemes.moe (openings/endings con audio/video reales) · MAL CDN (imágenes) ·
Kitsu/TVDB/AniZip (IDs cruzados). Video de episodios: sin fuente legal → muro de Fase 5.

**Principio:** la app **solo lee** Postgres; el pipeline **escribe** Postgres +
índice de búsqueda. La app nunca llama a las fuentes de catálogo en request-time
(salvo AniSkip cacheado y el Nivel 2 de recomendaciones).

### D.0 — Dos modos de ejecución

- [ ] **Modo A — Backfill + reconciliación** (one-off, entorno **aislado NO-prod**): reconstruye un dataset de catálogo **completo y consistente** hasta el punto de ejecución. Concurrencia alta permitida (no compite con los 8 GB de prod). Al terminar → promoción.
- [ ] **Modo B — Update incremental** (recurrente, **prod**, ligero): solo añade/actualiza lo **nuevo** (recently-updated de MAL, temporada nueva, entidades faltantes); no barre todo. Baja concurrencia (respeta D8).
- [ ] **Dashboard de control** (prod): configurar **cadencia** (diaria/semanal) y **alcance** (fuentes/task-types), persistido en DB, disparado por `pg_cron`.
- [ ] **Promoción A → prod = diff-upsert** por clave de identidad (`mal_id`): insert nuevos + update cambiados, en **transacción atómica** con orden FK-safe (padres→hijos), **validación referencial previa** y **rollback** ante fallo. Política explícita de filas obsoletas: solo se eliminan huérfanas **no referenciadas por datos de usuario**. Preserva tablas de usuario/auth/listas y sus FKs. Swap destructivo **descartado**.

### D.1 — Endurecer el scraper (4 capas · aplica a ambos modos)

- [ ] **Fetcher resiliente**: clasificar respuesta (`ok / 429 / blocked / 404 / transient / invalid-body`); retry con backoff+jitter; respetar `Retry-After`; timeouts (`headersTimeout`/`bodyTimeout` + `AbortController`); detectar HTML/challenge antes de `JSON.parse`.
- [ ] **Proxies**: revivir proxies muertos con re-probe (que el pool no solo encoja); degradar en vez de `throw 'Not enough proxies'`; no penalizar al proxy por un 404 de la fuente.
- [ ] **Cola crash-safe**: claim con `FOR UPDATE SKIP LOCKED` + lease (`leased_until`) + reaper que re-encola leases expirados; usar `attempts` → `dead_letter` tras N; backoff vía `scheduledAt`; task-type re-encolable para refresh recurrente.
- [ ] **Rate-limit global**: token bucket por dominio/IP (no por-worker). `maxWorkers` **alto en Modo A** (entorno aislado) pero de **unidades en Modo B** (VPS prod 4c/8GB).

### D.2 — Portar a Postgres + integrar

- [ ] Portar de Turso/SQLite a **Postgres** (dialecto Drizzle pg); **anidev-v2 es dueño único del esquema/migraciones**, el scraper no define DDL.
- [ ] Correr como **servicio separado** en el compose self-hosted, escribiendo a la Postgres compartida.
- [ ] Scheduling de refresh con **`pg_cron`** (barrido estacional + recently-updated).

### D.3 — Índice y cobertura

- [ ] **Índice de búsqueda (Postgres-native, ver D3)**: el BM25 de ParadeDB se auto-mantiene en cada write (sin sync externo); el pipeline solo mantiene la tabla/vista denormalizada `anime_search` y **genera embeddings pgvector** por anime (synopsis+géneros) como columna a llenar (habilita recs híbridas de Fase 4).
- [ ] **Métricas de cobertura**: extender `statsReporter` con block-rate, 429-rate, dead-letters y **% de columnas llenas por tabla**.

### Backfills mapeados a features

| Backfill | Desbloquea |
|---|---|
| studios/licensors split + broadcast | Filtros de **estudio** y **día** (Fase 1), Schedule (Fase 6) |
| voice-actor links (~4.2k de 217k en v1) | Fichas de seiyuu (Fase 6) |
| episode `video_url` / `episode_source` | **Muro de Fase 5** — requiere decisión de fuente, no backfill |

**Estado (2026-10-18) — mitad esquema del backfill hecha** (change
`catalog-coverage-fields`): `anime` ya tiene `broadcast_day/time/timezone`
(índice por día), `aired_from/to`, `trailer_youtube_id/embed_url`, `duration`,
`source`, `rank`, `members`, `favorites`; `anime_producer` tiene `role`
(`studio|licensor|producer`) con PK `(anime_id, producer_id, role)` e índice
`(role, producer_id)`; `anime_external_ids` tiene `anilist_id`. El contrato de
escritura y la query de cobertura viven en el `design.md` del change. **Falta la
mitad de datos**: la corrida Fase 3 del scraper (mappers `/full` + promoción
diff-upsert con `role` en el conflict target).

---

## Frontend (islas · estado · caché)

Base: Astro 6 SSR (`output: 'server'`), `<ClientRouter/>` activo. El change
archivado `standardize-frontend-flow` fija zero-JS + islas on-demand, one-way y
presentational/container.

**Árbol de estado (usa el nivel más bajo que resuelva):**
1. Sin JS (`.astro`) → 2. `<form>`+API → 3. `useState` local (una isla) →
4. **Nano Stores** (estado compartido entre islas) → 5. `transition:persist` +
nanostore + `PlaybackCoordinator` (sobrevive navegación → **player**).

**Personalización vs caché (regla en una línea):** _la URL es el estado; el
shell es anónimo y cacheable; la personalización son islas client-side sobre
una API por-usuario sin caché._

- **Shell SSR anónimo cacheable** (`public, s-maxage, stale-while-revalidate`).
- **Control parental = variante de cache-key** (`safe` default / `full` authed
  opt-in) vía `Vary`/cookie coarse. Nunca cachear por user-id.
- **Islas personalizadas** (watchlist, continuar viendo, color) → fetch a API
  `private, no-store` sobre el shell cacheado.
- **Dragonfly reservado a JSON, sesiones y tiempo real (Watch2Gether Pub/Sub +
  rate-limit)**: los binarios de imágenes optimizadas viven en caché de disco
  local acotado + headers HTTP `immutable`.
- **Middleware**: resolución de sesión `pre` salta rutas de assets (`/media/*`,
  `/api/health*`, `/showcase`) y cachea sesiones resueltas 60 s en Dragonfly.

## Testing y costos

**Pirámide de testing** (corre en **CI/GitHub Actions, no en el VPS**):

- **Unit** (Vitest, TDD) — base, loop rápido del gate. Ya existe.
- **Integración** — Vitest + **Postgres/ParadeDB real en service container**.
- **E2E** — **Playwright** (`api` + `ui`), **smoke acotado** de journeys clave
  (search→ficha, auth, watchlist, player, Watch2Gether).
- **a11y** — **axe-core** en Playwright + sobre `/showcase`.

## Infra (self-hosted, VPS único)

Todo corre en **un VPS: 4 núcleos / 8 GB RAM / 100 GB SSD** (sin Vercel ni
Supabase). Servicios desplegados: **Postgres** (`database`), **Dragonfly**
(cache + Pub/Sub), **Rustrak** (monitoring), **app** (Astro vía
`@nurodev/astro-bun`), `libredb-studio`.

## Decisiones de arquitectura (log)

| # | Decisión | Estado |
|---|---|---|
| D1 | Scraper en **dos modos/entornos**: (A) **backfill+reconciliación** one-off en entorno aislado NO-prod → **promoción a prod = diff-upsert**; (B) **update incremental** en prod, ligero, vía `pg_cron` | ✅ decidido |
| D2 | Cola de ingesta = **Postgres-nativo** (`FOR UPDATE SKIP LOCKED` + `pg_cron`); rate-bucket en memoria | ✅ decidido |
| D3 | Búsqueda = **Postgres-only por etapas**: `pg_trgm`/tsvector + sinónimos (Stage 1) → **ParadeDB `pg_search`** BM25 (Stage 2) → **pgvector** (Stage 3, recs híbridas) | ✅ decidido |
| D4 | Estado entre islas: árbol de 5 niveles; **Nano Stores** primitivo único; **URL = estado** en descubrimiento; `transition:persist` + `PlaybackCoordinator` para el player | ✅ decidido |
| D5 | Personalización vs caché: **shell anónimo cacheable + islas personalizadas** sobre API `no-store`; control parental = variante de cache-key (`safe`/`full`); middleware `pre` salta `/media/*` y cachea sesión 60 s; binarios de imagen fuera de Dragonfly (en disco LRU + `immutable`) | ✅ decidido |
| D6 | Docs: **`/showcase`** (UI) + **Starlight** sitio estático separado + **referencia API generada** desde Zod→OpenAPI y JSDoc en CI + [`ARCHITECTURE.md`](./ARCHITECTURE.md) | ✅ decidido |
| D7 | Testing y costos: pirámide unit→integración→E2E→**a11y axe** en CI; **Recomendaciones en 2 niveles** (Nivel 1 `TasteProfile`+`pgvector` coste $0 / <50 ms; Nivel 2 Gemini cacheado con rate-limit y fallback al Nivel 1); **Fase 5 video = go/no-go con estimación de egress** | ✅ decidido |
| D8 | **Presupuesto de recursos**: todo en 1 VPS 4c/8GB/100GB. `pg.Pool` acotado (`max: 20`); streaming multimedia por `ReadableStream` + `Range` (`206`) sin buffers completos en RAM; media de video **fuera** del VPS | ✅ restricción fijada |
| D9 | **Watch2Gether (`watch-rooms`) híbrido PostgreSQL + Dragonfly Pub/Sub**: metadatos de sala (`password_hash` server-only), participantes, cola, mensajes y encuestas en PostgreSQL; reloj de reproducción en vivo (`watch:room:{id}:clock`) y eventos en tiempo real sobre **Dragonfly Pub/Sub + SSE**, con **corrección de deriva en 3 niveles** ($>2.5\text{ s}$ seek, $0.35\text{–}2.5\text{ s}$ `playbackRate` $\pm 0.08$, $\le 0.35\text{ s}$ `1.0x`) compartida para anime y música | ✅ decidido |
