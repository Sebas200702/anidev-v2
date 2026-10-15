## Why

ROADMAP Fase 4 defines AI-powered personalized recommendations as a key differentiator for AniDev v2, while Decisión D3 (`pgvector` in PostgreSQL) and Decisión D7 (strict external API cost budget via cache-first + rate-limiting) require that recommendations be fast, explainable, and inexpensive to operate on the 8 GB RAM VPS.

Comparing AniDev v1 (which called Google Gemini 2.0 Flash on every uncached recommendation request) with `Snozxyx/Tatakai` (`src/hooks/api/useRecommendationEngine.ts`) reveals a clear architectural opportunity:
- Tatakai builds a deterministic, multi-signal `TasteProfile` from user activity using an explicit 5-factor engagement formula (`breadth * 0.30 + completion * 0.25 + recency * 0.20 + consistency * 0.15 + progress * 0.10` with 28-day exponential decay) and deduplicates franchise sequels (`dedupeFranchiseSignals`) before ranking candidates.
- AniDev v1 excelled at natural-language contextual curation (*mood*, *marathon*, *quick watch*, *spoiler-free why-you'll-like-it*) via Gemini function calling (`fetch_recommendations` returning `mal_ids`).

Combining both into a **Two-Tier Hybrid Recommendation Engine** gives AniDev v2 sub-50ms zero-cost recommendations for standard rails (*"For You"*, *"Because you watched X"*) via Tier 1 (`UserTasteProfile` + `pgvector` cosine similarity + franchise deduplication in PostgreSQL), while reserving Tier 2 (Google Gemini re-ranking and spoiler-free explanation over Tier-1 candidates, cached in Dragonfly) for explicit natural-language contexts.

## What Changes

- **Signal assembly & `UserTasteProfile` (`src/domains/recommendations/` or `src/domains/search/`)**:
  - Compute per-anime engagement (`0–100`) from `watch_progress`, `user_anime_list`, and `search_history` using the 5-factor formula and `anime_relation` franchise deduplication so multiple seasons of one series do not dominate recommendations.
- **Tier-1 PostgreSQL hybrid recommender (`pgvector` + SQL filters)**:
  - Query candidate anime using `pgvector` embedding similarity against the user's weighted seed embeddings, excluding already watched/listed `mal_id`s and enforcing the parental-control floor (`safe` vs `full`), returning explainable `reasons` and factor breakdowns in <50ms with $0 external API cost.
- **Tier-2 Contextual Gemini curator (`fetch_recommendations` + Dragonfly cache)**:
  - Feed top Tier-1 candidates + user taste profile + context (`mood`, `marathon`, `quick_watch`, `similar_to`, `natural_language`) to Gemini with strict Zod output validation, Dragonfly caching, per-user rate limiting, and automatic fallback to Tier-1 results if Gemini times out or errors.

## Capabilities

### New Capabilities

- `recommendations/hybrid-engine`: Two-tier personalized anime recommendation engine combining deterministic 5-factor engagement profiling, franchise deduplication, and `pgvector` similarity (Tier 1) with cached Gemini contextual curation and fallback (Tier 2).

## Impact

- **Database**: Uses `user_anime_list`, `watch_progress`, `search_history`, `anime_relation`, and the `pgvector` embedding column on `anime` (Track D.3).
- **Domains**: New `src/domains/recommendations/` vertical slice (`repositories/`, `services/`, `mappers/`, `cache/`, `schemas/`, `types/`).
- **Routes**: `GET /api/recommendations` and `POST /api/recommendations/curate`.
