## Purpose

Provides personalized, explainable anime recommendations through a two-tier hybrid engine: a deterministic 5-factor taste profile with `pgvector` similarity in PostgreSQL (Tier 1) and cached Google Gemini contextual curation with automatic fallback (Tier 2).

## ADDED Requirements

### Requirement: User taste profile combines multi-source engagement and deduplicates franchises

The recommendation engine MUST build a user's `TasteProfile` from `user_anime_list`, `watch_progress`, and `search_history`, weighting watch engagement by breadth, completion ratio, 28-day exponential recency decay, consistency, and progress, and MUST deduplicate sequel/prequel chains via `anime_relation` so a single franchise does not dominate seed selection.

#### Scenario: Sequel seasons of the same franchise are deduplicated in seed signals

- **WHEN** a user has watched 4 seasons of the same franchise linked by `Sequel`/`Prequel` relations in `anime_relation`
- **THEN** `dedupeFranchiseSignals` collapses those seasons into a single franchise seed using the strongest engagement/score signal

### Requirement: Tier-1 recommendations exclude watched titles and enforce the parental floor

Tier-1 recommendations MUST exclude every `mal_id` already present in the user's `watch_progress` or `user_anime_list` (`completed`, `watching`, `dropped`), MUST enforce the `safe` parental floor by default, and MUST return explainable `reasons` for each recommended anime without calling external AI APIs.

#### Scenario: Watched and completed anime are never recommended

- **WHEN** an authenticated user requests `GET /api/recommendations`
- **THEN** the returned list contains zero `mal_id`s that the user has already completed or is currently watching, and each item includes at least one human-readable reason

### Requirement: Tier-2 Gemini contextual curation is cached, rate-limited, and falls back to Tier 1

When a client requests contextual AI curation (`mood`, `marathon`, `quick_watch`), the system MUST serve cached results from Dragonfly when available, enforce a per-user rate limit, validate Gemini's returned `mal_id`s against local PostgreSQL catalog rows, and fall back to Tier-1 recommendations if Gemini fails, times out, or returns insufficient valid IDs.

#### Scenario: Gemini timeout or outage falls back to Tier-1 recommendations

- **WHEN** a user requests `GET /api/recommendations?context=marathon` and the Gemini API times out or returns an error
- **THEN** the endpoint still returns `200` with Tier-1 recommendations and `meta.fallback = true`
