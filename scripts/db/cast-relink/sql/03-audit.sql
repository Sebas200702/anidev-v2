-- T2 dry run: classifies every distinct UPPERCASE-role anime_character pair into `audit`
-- (rules in odd/tasks/cast-relink.md, L8). Reads public tables only; writes only `audit`
-- in the current schema. Title-case rows are the Jikan cast; synthetic ids are
-- 1000000000 + AniList character id. Name matching never leaves the same anime.
BEGIN;

-- Drop only the current schema's audit, never a same-named table further down search_path.
DO $$ BEGIN EXECUTE format('DROP TABLE IF EXISTS %I.audit', current_schema()); END $$;

CREATE TEMP TABLE up_pair ON COMMIT DROP AS
SELECT anime_id, character_id, array_agg(DISTINCT role ORDER BY role) AS roles
FROM anime_character
WHERE role = upper(role)
GROUP BY anime_id, character_id;

CREATE TEMP TABLE jikan_pair ON COMMIT DROP AS
SELECT DISTINCT ac.anime_id, ac.character_id, norm_name(c.name) AS name_key
FROM anime_character ac
JOIN "character" c ON c.mal_id = ac.character_id
WHERE ac.role <> upper(ac.role);
CREATE INDEX ON jikan_pair (anime_id, character_id);
CREATE INDEX ON jikan_pair (anime_id, name_key);

CREATE TEMP TABLE cast_key ON COMMIT DROP AS
SELECT DISTINCT anime_id, anilist_character_id, unnest(name_keys) AS name_key
FROM anilist_cast;
CREATE INDEX ON cast_key (anime_id, name_key);
CREATE INDEX ON cast_key (anime_id, anilist_character_id);
ANALYZE up_pair;
ANALYZE jikan_pair;
ANALYZE cast_key;

-- AniList candidates: a synthetic id names its AniList character directly; a real MAL
-- id is matched by its normalized name against that anime's AniList cast.
CREATE TEMP TABLE resolved ON COMMIT DROP AS
SELECT
  p.anime_id, p.character_id, p.roles,
  p.character_id >= 1000000000 AS is_synthetic,
  EXISTS (
    SELECT 1 FROM jikan_pair j
    WHERE j.anime_id = p.anime_id AND j.character_id = p.character_id
  ) AS is_jikan_pair,
  src.anime_id IS NOT NULL AS has_source,
  coalesce(src.cast_size, 0) AS cast_size,
  CASE WHEN p.character_id >= 1000000000 THEN ARRAY(
    SELECT DISTINCT k.anilist_character_id FROM cast_key k
    WHERE k.anime_id = p.anime_id
      AND k.anilist_character_id = p.character_id - 1000000000
  ) ELSE ARRAY(
    SELECT DISTINCT k.anilist_character_id FROM cast_key k
    WHERE k.anime_id = p.anime_id AND k.name_key = norm_name(c.name)
  ) END AS anilist_ids
FROM up_pair p
LEFT JOIN anilist_cast_source src ON src.anime_id = p.anime_id
LEFT JOIN "character" c ON c.mal_id = p.character_id;

-- Jikan-cast characters of the same anime sharing a name key with the single candidate.
CREATE TEMP TABLE matched ON COMMIT DROP AS
SELECT
  r.*,
  CASE WHEN cardinality(r.anilist_ids) = 1 THEN r.anilist_ids[1] END AS anilist_id,
  CASE WHEN cardinality(r.anilist_ids) = 1 AND NOT r.is_jikan_pair THEN ARRAY(
    SELECT DISTINCT j.character_id
    FROM cast_key k
    JOIN jikan_pair j ON j.anime_id = k.anime_id AND j.name_key = k.name_key
    WHERE k.anime_id = r.anime_id AND k.anilist_character_id = r.anilist_ids[1]
  ) ELSE '{}' END AS jikan_ids
FROM resolved r;

CREATE TABLE audit (
  anime_id integer NOT NULL,
  character_id integer NOT NULL,
  roles text[] NOT NULL,
  decision text NOT NULL
    CHECK (decision IN ('dedupe', 'keep', 'repoint', 'quarantine', 'pending-api')),
  reason text NOT NULL,
  anilist_character_id integer,
  target_character_id integer,
  creates_character boolean NOT NULL DEFAULT false,
  PRIMARY KEY (anime_id, character_id)
);

INSERT INTO audit (anime_id, character_id, roles, decision, reason,
                   anilist_character_id, target_character_id, creates_character)
SELECT
  m.anime_id, m.character_id, m.roles, v.decision, v.reason,
  CASE WHEN v.decision IN ('keep', 'repoint', 'quarantine') THEN m.anilist_id END,
  v.target,
  v.reason = 'real-to-synthetic'
    AND NOT EXISTS (SELECT 1 FROM "character" c WHERE c.mal_id = v.target)
FROM matched m
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN m.is_jikan_pair THEN 'dedupe'
      WHEN cardinality(m.anilist_ids) > 1 OR cardinality(m.jikan_ids) > 1 THEN 'quarantine'
      -- an empty or truncated CSV cast proves nothing: ask the API (T3)
      WHEN cardinality(m.anilist_ids) = 0
        AND (NOT m.has_source OR m.cast_size = 0 OR m.cast_size >= 25)
        THEN 'pending-api'
      WHEN cardinality(m.anilist_ids) = 0 THEN 'quarantine'
      WHEN m.is_synthetic AND cardinality(m.jikan_ids) = 0 THEN 'keep'
      ELSE 'repoint'
    END AS decision,
    CASE
      WHEN m.is_jikan_pair THEN 'jikan-same-pair'
      WHEN cardinality(m.anilist_ids) > 1 OR cardinality(m.jikan_ids) > 1 THEN 'ambiguous'
      WHEN cardinality(m.anilist_ids) = 0 AND NOT m.has_source THEN 'cast-missing'
      WHEN cardinality(m.anilist_ids) = 0 AND m.cast_size = 0 THEN 'cast-empty'
      WHEN cardinality(m.anilist_ids) = 0 AND m.cast_size >= 25 THEN 'cast-truncated'
      WHEN cardinality(m.anilist_ids) = 0 THEN 'no-anilist-match'
      WHEN m.is_synthetic AND cardinality(m.jikan_ids) = 0 THEN 'synthetic-in-anilist-cast'
      WHEN m.is_synthetic THEN 'synthetic-to-jikan'
      WHEN cardinality(m.jikan_ids) = 1 THEN 'real-to-jikan'
      ELSE 'real-to-synthetic'
    END AS reason,
    CASE
      WHEN m.is_jikan_pair OR cardinality(m.anilist_ids) <> 1
        OR cardinality(m.jikan_ids) > 1 THEN NULL
      WHEN cardinality(m.jikan_ids) = 1 THEN m.jikan_ids[1]
      WHEN NOT m.is_synthetic THEN 1000000000 + m.anilist_id
    END AS target
) v;

COMMIT;
