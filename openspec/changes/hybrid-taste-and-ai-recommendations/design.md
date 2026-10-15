## Context

Fase 4 of `ROADMAP.md` depends on Fase 1 (Catalog), Fase 2 (User Profile & Lists), and Track D.3 (`pgvector` embeddings per anime). Under Decisión D7 and D8, external LLM calls must be bounded by cache-first + hard rate-limits, and no heavy local ML model may run on the 8 GB RAM VPS.

## Goals / Non-Goals

**Goals:**

- Deliver instant (<50ms) personalized recommendations with zero external API cost via Tier 1 (`UserTasteProfile` + `pgvector` in PostgreSQL).
- Provide rich contextual and conversational curation (*mood*, *marathon*, *spoiler-free rationale*) via Tier 2 (Gemini function calling) over the pre-filtered Tier-1 candidate pool.
- Guarantee 100% availability: if Gemini is unconfigured, rate-limited, or down, Tier 1 serves the request transparently with `meta.tier = 'deterministic'`.

**Non-Goals:**

- Running local LLM inference on the 4 vCPU / 8 GB RAM VPS.

## Decisions

### 1. Five-factor engagement scoring and franchise deduplication

Adapted from Tatakai's `engagementFromHistory` (`src/hooks/api/useRecommendationEngine.ts`):
$$\text{engagement} = \text{round}\Big((0.30 \cdot \text{breadth} + 0.25 \cdot \text{completion} + 0.20 \cdot e^{-\text{days}/28} + 0.15 \cdot \text{consistency} + 0.10 \cdot \text{progress}) \times 100\Big)$$
Before computing the user's centroid taste vector and top genre/studio weights, `dedupeFranchiseSignals` groups seed anime connected by `'Sequel'` / `'Prequel'` in `anime_relation` and retains only the highest-signal entry per franchise so a single multi-season franchise cannot saturate the recommendation rail.

### 2. Tier-1 candidate retrieval in PostgreSQL (`pgvector` + parental floor)

Tier 1 computes a weighted average of the top $K \le 30$ seed embeddings in PostgreSQL (or queries nearest neighbors to the top seeds), excludes all `mal_id`s already present in `user_anime_list` or `watch_progress`, applies the `parentalVariant` filter (`safe` by default), and ranks candidates by combined vector similarity + genre/studio affinity + Bayesian catalog score.

### 3. Tier-2 Gemini curation over bounded candidate set

When a contextual mode (`mood`, `marathon`, `quick_watch`, `assistant`) is requested:
1. Check Dragonfly cache key `recs:ai:${userId}:${contextHash}` (`TTL: 6 hours`).
2. Enforce per-user rate limit in Dragonfly (e.g., 10 AI curations / hour / user).
3. Pass the top 40 Tier-1 candidate summaries + `UserTasteProfile` to Gemini with `fetch_recommendations` tool schema returning `{ malId, reason }[]`.
4. Hydrate returned `mal_id`s from local PostgreSQL rows. If Gemini fails, times out (`6000 ms`), or returns fewer than 4 valid IDs, seamlessly fill/fallback from Tier-1 ranked candidates.
