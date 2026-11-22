# Tatakai como referencia — ideas para evolucionar AniDev v2

> Fuente: DeepWiki de [`Snozxyx/Tatakai`](https://deepwiki.com/Snozxyx/Tatakai)
> (consultado 2026-11-04). Respuestas crudas en `docs/research/_tatakai-raw/`.
>
> **No copiamos: nos inspiramos.** Tatakai es un SPA React 19 + Vite +
> Supabase + Electron/Capacitor + móvil nativo + Rust. AniDev v2 es Astro SSR
> zero-JS + islands sobre PostgreSQL + Dragonfly. Varias de sus decisiones no
> aplican (SPA, Electron, nativo, Supabase RLS); otras son oro adaptadas a
> nuestra arquitectura. Cada sección separa **lo que hace Tatakai**, **lo que
> AniDev ya tiene/planea**, y **lo que adoptamos**.

## 1. Core Media Engine (refuerza `resilient-playback-and-aniskip`)

**Tatakai:** `useCombinedSources` agrega fuentes de varios proveedores +
extensiones; `mapRawSourcesToStreamingData` las normaliza (provider, calidad,
idioma, torrent/debrid); `selectPreferredSource` elige por settings del usuario.
Failover: `HlsAdapter` reintenta el manifest hasta `MAX_NETWORK_RETRIES`, luego
**avanza al siguiente candidato** del array `candidates`; en error de media llama
`recoverMediaError` y, si persiste, **swapea el codec de audio**. Abstracción de
extensiones: `SourceResult` canónico (`url`, `quality`, `headers`, `subtitles`,
`sourceType`), `ExtensionRegistry`, `resolveRemoteSources`. `content-graph.ts`
unifica/normaliza a formas "Media" estándar; `fetchAniZipMapping` resuelve IDs
entre AniList/MAL.

**AniDev ya planea:** `PlaybackCoordinator` (leases por generación +
`AbortController` + continuidad de segundo exacto), `HlsController` con fast-probe
paralelo (1.5 s) y failover automático, `episode_source` enriquecido, AniSkip.

**Adoptamos:**
- **Recuperación por swap de codec de audio** como escalón extra de failover
  antes de descartar una fuente (hoy el spec solo contempla avanzar de
  candidato) — barato y salva streams con audio roto.
- **Forma canónica `SourceResult`** para `episode_source`: dejar `headers` y
  `sourceType` explícitos por fuente habilita proxyeo correcto y multi-provider
  sin tocar el player.
- **Capa de normalización tipo `content-graph`**: un mapper único que colapsa
  proveedores a una forma "Media" antes del dominio — encaja con nuestros
  mappers por slice y evita lógica de proveedor filtrándose a UI.
- **Mapping de IDs AniZip/AniList↔MAL** para resolver fuentes cuando el
  catálogo propio no alcanza (útil para el provider aislado de Track D).

## 2. Watch Party & tiempo real (contrasta con `watch2gether-synchronized-rooms`)

**Divergencia de arquitectura, a decidir conscientemente.** Tatakai es **P2P
WebRTC con reloj del host**; AniDev planea **servidor-autoritativo con Dragonfly
Pub/Sub + SSE**. No migres a P2P a la ligera: el modelo server-authoritative es
más simple de operar y auditar y ya está especificado. Pero varias técnicas de
Tatakai son independientes del transporte y valen:

**Tatakai:** `ClockEstimator` estilo NTP (prefiere muestras de bajo RTT para el
offset local↔host vía `ping`/`pong`); `PlaybackTimeline` con `effectiveAt`;
drift en 3 niveles (≤0.05 s nada, 0.05–0.5 s rate ±3%, >0.5 s seek duro);
`ReadinessBarrier` (no arranca hasta que todos bufferearon); `host_epoch` que se
incrementa al transferir host e **invalida conexiones/comandos viejos**;
`postgres_changes` para chat/participantes con **polling como red de seguridad**
para converger en segundos si se pierde un evento.

**AniDev ya planea:** drift 3 niveles propios (>2.5 s seek, 0.35–2.5 s rate
±0.08, ≤0.35 s 1.0x), Pub/Sub + SSE, roles host/guest, `password_hash`
server-only, cola/chat/reacciones/encuestas.

**Adoptamos:**
- **`ReadinessBarrier`**: gate de "todos listos" antes de reproducir tras un
  seek/cambio de fuente — evita que el host corra solo. Falta en nuestro spec.
- **`host_epoch` monotónico** para invalidar comandos tras transferencia/caída
  de host (nuestro reloj server-authoritative igual necesita un epoch para
  descartar mensajes rezagados).
- **Polling de convergencia** como red de seguridad del SSE (si se cae un
  evento, reconciliar en N segundos) — robustez barata.
- **Estimación de offset por RTT bajo** para el ajuste fino del cliente, incluso
  con reloj del servidor como verdad.
- Revisar si nuestros umbrales de drift (>2.5 s para seek) no son demasiado
  laxos vs los 0.5 s de Tatakai; 2.5 s de desync es muy visible.

## 3. Frontend (divergencia fuerte: SSR zero-JS vs SPA)

**Tatakai:** React 19 SPA + `shadcn/ui` (Radix) + Tailwind + TanStack Query
(server state) + Zustand (client state, con `persist`). "Rails" (carruseles) con
`TVRail`/`TVContentCard`; theming por CSS vars (`theme.css` + `applyThemeVariables`
+ `useThemeStore`); reduced-motion (`0.01ms`); **TV mode** con navegación
espacial por D-Pad (`installSpatialNavigation`, foco restaurado con `data-tv-key`
+ `MutationObserver`) y hero cinemático.

**No copiamos:** el modelo SPA + TanStack Query + providers globales es lo
opuesto a nuestro zero-JS + islands on demand. Nuestra verdad de datos vive en
services de page routes, no en un `QueryClient` de cliente.

**Adoptamos:**
- **Theming por CSS variables con switch runtime** (`applyThemeVariables`) — ya
  somos dark-only con tokens `@theme`; el patrón habilita variantes/temas a
  futuro sin reescribir componentes.
- **Rails/content-cards como componentes presentacionales** reutilizables con
  progreso + rank embebidos (encaja con nuestro `/showcase` y carouseles).
- **Disciplina reduced-motion** (`0.01ms` en vez de desactivar) ya alineada con
  nuestras reglas de a11y — formalizarla como utility global.
- **TV mode como island futura** (`client:visible`), no como modo de app: hero
  cinemático + navegación por teclado/D-Pad con restauración de foco. Candidato
  a nueva feature ODD, no al core SSR.

## 4. Backend / infra (robustez de datos y seguridad)

**Tatakai:** `TatakaiAPI` (Supabase Edge Functions) como proxy+cache+auth de
AniList/MAL con `cacheMiddleware` Redis **por-ruta con TTL**; **Cloudflare Worker**
de streaming que reenvía `Range:` y reescribe URIs de playlists HLS, con **SSRF
guard `isBlockedHost()`** y password gate; `rateLimitMiddleware` **sliding-window
per-user/per-route** en Redis con buckets dedicados para endpoints sensibles
(login); CSP/security headers centralizados en `securityHeaders.ts` **espejados
en `vercel.json` y en el script de self-host**; telemetría PostHog (con
Do-Not-Track/GPC) + Sentry + Datadog; cache in-memory acotado del lado cliente
para mapping. RLS: hallazgo DB-1 (Supabase da `ALL` a `anon` por defecto) + script
`check-security-baseline.mjs` (DB-2: toda tabla nueva debe declarar decisión RLS).

**AniDev ya tiene:** media proxy (sharp) + Dragonfly cache (`CacheTtl`),
rate-limit (`rl:` buckets), Range streaming + SSRF/timeout (platform-audit), CSP
en `policy.ts`, Rustrak (Sentry-compatible), envelope + degradación 503.

**Adoptamos:**
- **Cache middleware por-ruta con TTL declarativo** (hoy el TTL es por-call);
  centralizarlo reduce olvidos y cachea GETs upstream de forma uniforme.
- **Script `check-security-baseline` en CI**: un gate que verifique invariantes
  de seguridad (headers presentes, SSRF guard activo, rutas sensibles con
  rate-limit tight) — portamos la idea DB-2 a nuestras tablas/middleware.
- **Buckets de rate-limit dedicados y tight para auth** (login/register) además
  del genérico por IP.
- **CSP como única fuente espejada** a cada target de deploy (ya la generamos en
  runtime desde `policy.ts`; asegurar que Dokploy/Vercel no la dupliquen a mano).
- **Telemetría con Do-Not-Track/GPC** respetado antes de emitir, si algún día
  sumamos analytics de producto (Rustrak ya cubre errores).

## 5. Qué NO tomar
- P2P WebRTC para watch party (mantener server-authoritative SSE).
- Modelo SPA + TanStack Query + Zustand global (rompe zero-JS).
- Supabase/RLS (corremos Postgres propio con Drizzle + Better Auth).
- Electron / móvil nativo / Rust translate engine (fuera de alcance).

## 6. Próximos pasos sugeridos (features ODD candidatas)
1. Enriquecer el spec `resilient-playback-and-aniskip`: codec-swap recovery +
   `SourceResult` canónico + normalizador tipo content-graph.
2. Enriquecer `watch2gether-synchronized-rooms`: `ReadinessBarrier`, `host_epoch`,
   polling de convergencia, revisión de umbrales de drift.
3. Nueva feature: **TV mode island** (hero cinemático + navegación por teclado).
4. Hardening infra: cache middleware por-ruta + `check-security-baseline` en CI +
   buckets tight de auth.
