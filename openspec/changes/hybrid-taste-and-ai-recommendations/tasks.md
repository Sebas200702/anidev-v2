# Tasks — Hybrid taste profile and AI recommendations (Etapa 4)

## 1. Signal assembly & franchise deduplication (`T-13.1`)

- [ ] 1.1 Write failing unit tests for `computeHistoryEngagement` (5-factor formula with 28-day decay) and `dedupeFranchiseSignals` (collapsing `Sequel`/`Prequel` chains from `anime_relation`).
- [ ] 1.2 Implement `src/domains/recommendations/utils/engagement-scoring/` and `franchise-dedupe/`.

## 2. Tier-1 PostgreSQL + `pgvector` recommender (`T-13.2`)

- [ ] 2.1 Add optional `embedding` vector column and index on `anime` (aligned with Track D.3) and write failing repository integration tests.
- [ ] 2.2 Implement `recommendationRepository` and `tasteProfileService` in `src/domains/recommendations/` excluding watched/listed `mal_id`s, enforcing `parentalVariant`, and generating factor-based `reasons`.

## 3. Tier-2 Gemini contextual curator & fallback (`T-13.3`)

- [ ] 3.1 Add optional `GEMINI_API_KEY` to `src/config/env.ts` and write failing unit tests for `geminiCuratorService` (structured `fetch_recommendations` tool call, Dragonfly cache hit, rate-limit enforcement, and automatic fallback to Tier 1 on timeout/error).
- [ ] 3.2 Implement `geminiCuratorService` and `recommendationsCache` in `src/domains/recommendations/`.
- [ ] 3.3 Add `GET /api/recommendations` and `POST /api/recommendations/curate` routes with Zod request/response validation.

## 4. UI rails & E2E verification (`T-13.4`)

- [ ] 4.1 Build presentational recommendation cards/rails displaying the explainable `reasons` badge and register them in `/showcase`.
- [ ] 4.2 Add Playwright E2E tests covering deterministic Tier-1 recommendations and Tier-2 fallback behavior.
