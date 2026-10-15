# Tasks — Resilient playback engine and AniSkip (Etapa 3B)

## 1. Enriched episode source & subtitle schema (`T-11.1`)

- [ ] 1.1 Extend `episodeSource` (`provider`, `serverName`, `format`, `quality`, `audio`, `headers`, `priority`) and `episodeSubtitle` (`label`, `format`, `isDefault`) in `src/lib/db/schemas/episode.ts` with backward-compatible defaults.
- [ ] 1.2 Generate the Drizzle migration (`bun run db:generate`) and add repository/mapper unit folders in `src/domains/watch/` (or `src/domains/anime/`).

## 2. PlaybackCoordinator & serialized adapter registry (`T-11.2`)

- [ ] 2.1 Write failing unit tests for `PlaybackCoordinator` (generation cancellation, same-episode position continuity, 5s progress throttle, immediate flush on dispose/completed) and `SourceAdapterRegistry` (serialized `switchTo` queue).
- [ ] 2.2 Implement `PlaybackCoordinator` and `SourceAdapterRegistry` in `src/domains/watch/core/` (each file $\le 150$ lines).
- [ ] 2.3 Write failing unit tests for parallel candidate probing (`probePlaybackCandidate`, `firstFulfilled` with 1500ms timeout) and `HlsController` failover (`MAX_NETWORK_RETRIES = 2`, `MAX_MEDIA_RETRIES = 2`, `swapAudioCodec`, `advanceCandidate`).
- [ ] 2.4 Implement candidate probing and `HlsController` / `DirectController`.

## 3. AniSkip service & OP/ED music cross-linking (`T-12`)

- [ ] 3.1 Write failing unit tests for `skipSegmentsService` (200 hit, 404 negative cache, 3000ms timeout graceful `[]` fallback, and OP/ED music metadata attachment).
- [ ] 3.2 Implement `skipSegmentsCache`, `skipSegmentsService`, and `GET /api/anime/[malId]/episodes/[number]/skip-times.ts`.

## 4. Player UI integration & showcase (`T-11.3`)

- [ ] 4.1 Wire `PlaybackCoordinator` into the Fase 3 `<PersistentMusicPlayer />` and Fase 5 `<EpisodeVideoPlayer />` islands with keyboard shortcuts, quality/server selector, and accessible *"Skip Intro / Outro"* button.
- [ ] 4.2 Register presentational player controls in `/showcase` and add Playwright E2E coverage.
