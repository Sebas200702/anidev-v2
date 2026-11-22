-- T4: applies the decisions of `audit` (rebuild it first with 03-audit.sql) in ONE
-- transaction. Every change is logged in this schema so 06-rollback.sql restores the
-- exact previous state. keep and pending-api pairs are left untouched. Refused while the
-- logs hold a batch that was not rolled back.

CREATE TABLE IF NOT EXISTS removed_links (
  anime_id integer NOT NULL, character_id integer NOT NULL, role text NOT NULL,
  decision text NOT NULL, reason text NOT NULL,
  PRIMARY KEY (anime_id, character_id, role)
);
CREATE TABLE IF NOT EXISTS inserted_links (
  anime_id integer NOT NULL, character_id integer NOT NULL, role text NOT NULL,
  PRIMARY KEY (anime_id, character_id, role)
);
CREATE TABLE IF NOT EXISTS created_characters (
  mal_id integer PRIMARY KEY, name text NOT NULL, name_kanji text, anilist_id integer
);
CREATE TABLE IF NOT EXISTS created_media (id integer PRIMARY KEY, character_id integer NOT NULL);
-- status 'set': anilist_id was NULL and got the single candidate; 'conflict': it already
-- held a different id, or the batch proposes several ids, so it was left unchanged.
CREATE TABLE IF NOT EXISTS updated_characters (
  mal_id integer PRIMARY KEY, previous_anilist_id integer,
  candidate_anilist_ids integer[] NOT NULL,
  status text NOT NULL CHECK (status IN ('set', 'conflict'))
);

SELECT EXISTS (SELECT 1 FROM removed_links) OR EXISTS (SELECT 1 FROM inserted_links)
  OR EXISTS (SELECT 1 FROM created_characters) OR EXISTS (SELECT 1 FROM created_media)
  OR EXISTS (SELECT 1 FROM updated_characters) AS has_batch \gset
\if :has_batch
DO $$ BEGIN
  RAISE EXCEPTION 'cast-relink: a batch is already applied; run rollback first';
END $$;
\else
BEGIN;

-- Synthetic targets missing from "character": one row per target, from the AniList cast
-- of the first anime that points to it.
WITH created AS (
  INSERT INTO "character" (mal_id, name, name_kanji, anilist_id)
  SELECT DISTINCT ON (a.target_character_id) a.target_character_id,
    coalesce(k.name_full, k.name_native, format('AniList %s', k.anilist_character_id)),
    k.name_native, k.anilist_character_id
  FROM audit a
  JOIN anilist_cast k ON k.anime_id = a.anime_id
    AND k.anilist_character_id = a.anilist_character_id
  WHERE a.decision = 'repoint' AND a.creates_character
  ORDER BY a.target_character_id, a.anime_id
  ON CONFLICT (mal_id) DO NOTHING
  RETURNING mal_id, name, name_kanji, anilist_id
)
INSERT INTO created_characters SELECT * FROM created;

-- Their AniList poster. Priority 30 ranks after the MAL posters (20/25), so a MAL image
-- added later for the same character wins; size NULL like the MAL rows.
WITH media AS (
  INSERT INTO character_media (character_id, media_type, src, size, source, priority)
  SELECT DISTINCT ON (c.mal_id) c.mal_id, 'poster', k.image_url, NULL, 'anilist', 30
  FROM created_characters c
  JOIN anilist_cast k ON k.anilist_character_id = c.anilist_id
  WHERE btrim(coalesce(k.image_url, '')) <> ''
    AND k.image_url !~ '/default\.(jpg|png)$'  -- AniList placeholder, not a portrait
  ORDER BY c.mal_id, k.anime_id
  ON CONFLICT DO NOTHING
  RETURNING id, character_id
)
INSERT INTO created_media SELECT * FROM media;

-- dedupe, quarantine and repoint: the pair's UPPERCASE rows leave anime_character.
WITH removed AS (
  DELETE FROM anime_character ac
  USING audit a
  WHERE ac.anime_id = a.anime_id AND ac.character_id = a.character_id
    AND ac.role = upper(ac.role)
    AND a.decision IN ('dedupe', 'quarantine', 'repoint')
  RETURNING ac.anime_id, ac.character_id, ac.role, a.decision, a.reason
)
INSERT INTO removed_links SELECT * FROM removed;

-- repoint: one link per (anime, target, role); several sources may share a target. Skipped
-- when the Jikan cast (Title-case role) already holds the target or the row exists.
WITH wanted AS (
  SELECT DISTINCT a.anime_id, a.target_character_id AS character_id, r.role
  FROM audit a CROSS JOIN LATERAL unnest(a.roles) AS r(role)
  WHERE a.decision = 'repoint' AND a.target_character_id IS NOT NULL
), inserted AS (
  INSERT INTO anime_character (anime_id, character_id, role)
  SELECT w.anime_id, w.character_id, w.role FROM wanted w
  WHERE NOT EXISTS (
    SELECT 1 FROM anime_character t
    WHERE t.anime_id = w.anime_id AND t.character_id = w.character_id
      AND t.role <> upper(t.role)
  )
  ON CONFLICT DO NOTHING
  RETURNING anime_id, character_id, role
)
INSERT INTO inserted_links SELECT * FROM inserted;

-- Real MAL targets get their AniList id when it is NULL; a different value is a conflict.
INSERT INTO updated_characters (mal_id, previous_anilist_id, candidate_anilist_ids, status)
SELECT c.mal_id, c.anilist_id, t.ids,
  CASE WHEN c.anilist_id IS NULL AND cardinality(t.ids) = 1 THEN 'set' ELSE 'conflict' END
FROM (
  SELECT target_character_id AS mal_id,
    array_agg(DISTINCT anilist_character_id ORDER BY anilist_character_id) AS ids
  FROM audit
  WHERE decision = 'repoint' AND target_character_id < 1000000000
    AND anilist_character_id IS NOT NULL
  GROUP BY 1
) t
JOIN "character" c ON c.mal_id = t.mal_id
WHERE c.anilist_id IS NULL OR cardinality(t.ids) > 1 OR c.anilist_id <> t.ids[1];

UPDATE "character" c SET anilist_id = u.candidate_anilist_ids[1]
FROM updated_characters u
WHERE u.mal_id = c.mal_id AND u.status = 'set';

COMMIT;
\endif
