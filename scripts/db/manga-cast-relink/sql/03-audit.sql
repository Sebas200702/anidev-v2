-- audit (dry run): classifies every distinct manga_character pair (manga_id,
-- character_id) against the AniList cast of its manga (manga_cast), and lists in
-- audit_add the cast entries of a found manga with no local link. Reads public tables
-- only; writes only audit / audit_add in the current schema. Name matching never leaves
-- the same manga. Rules: README.md (catalog rebuild T2, S4).
BEGIN;

-- Drop only this schema's tables, never a same-named table further down search_path.
DO $$ BEGIN
  EXECUTE format('DROP TABLE IF EXISTS %1$I.audit, %1$I.audit_add', current_schema());
END $$;

CREATE TEMP TABLE pair ON COMMIT DROP AS
SELECT mc.manga_id, mc.character_id,
  array_agg(DISTINCT mc.role COLLATE "C" ORDER BY mc.role COLLATE "C") AS roles,
  min(e.anilist_id) AS local_anilist_id, norm_name(min(c.name)) AS name_key
FROM manga_character mc
LEFT JOIN "character" c ON c.mal_id = mc.character_id
LEFT JOIN character_external e ON e.character_id = mc.character_id
GROUP BY mc.manga_id, mc.character_id;

CREATE TEMP TABLE cast_key ON COMMIT DROP AS
SELECT DISTINCT manga_id, anilist_character_id, unnest(name_keys) AS name_key
FROM manga_cast;
CREATE INDEX ON cast_key (manga_id, name_key);
ANALYZE pair;
ANALYZE cast_key;

-- Local character for each AniList id: the one whose character_external holds it, else
-- the synthetic 1e9 + id (created by apply when that row is missing).
CREATE TEMP TABLE target ON COMMIT DROP AS
SELECT k.anilist_character_id,
  coalesce(e.character_id, 1000000000 + k.anilist_character_id) AS character_id,
  e.character_id IS NULL AND NOT EXISTS (
    SELECT 1 FROM "character" c WHERE c.mal_id = 1000000000 + k.anilist_character_id
  ) AS creates_character
FROM (SELECT DISTINCT anilist_character_id FROM manga_cast) k
LEFT JOIN character_external e ON e.anilist_id = k.anilist_character_id;
CREATE UNIQUE INDEX ON target (anilist_character_id);
ANALYZE target;

CREATE TEMP TABLE resolved ON COMMIT DROP AS
SELECT p.*, s.status, coalesce(s.cast_size, 0) AS cast_size,
  EXISTS (
    SELECT 1 FROM manga_cast k
    WHERE k.manga_id = p.manga_id AND k.anilist_character_id = p.local_anilist_id
  ) AS is_in_cast,
  ARRAY(
    SELECT DISTINCT k.anilist_character_id FROM cast_key k
    WHERE k.manga_id = p.manga_id AND k.name_key = p.name_key
    ORDER BY 1
  ) AS candidates
FROM pair p
LEFT JOIN manga_cast_source s ON s.manga_id = p.manga_id;

CREATE TABLE audit (
  manga_id integer NOT NULL,
  character_id integer NOT NULL,
  roles text[] NOT NULL,
  decision text NOT NULL CHECK (decision IN ('keep', 'repoint', 'quarantine', 'pending')),
  reason text NOT NULL,
  anilist_character_id integer,
  target_character_id integer,
  creates_character boolean NOT NULL DEFAULT false,
  PRIMARY KEY (manga_id, character_id)
);

INSERT INTO audit
SELECT r.manga_id, r.character_id, r.roles, v.decision, v.reason,
  CASE v.decision WHEN 'keep' THEN coalesce(t.anilist_character_id, r.local_anilist_id)
    WHEN 'repoint' THEN t.anilist_character_id END,
  CASE WHEN v.decision = 'repoint' THEN t.character_id END,
  v.decision = 'repoint' AND t.creates_character
FROM resolved r
LEFT JOIN target t ON cardinality(r.candidates) = 1 AND NOT r.is_in_cast
  AND t.anilist_character_id = r.candidates[1]
CROSS JOIN LATERAL (
  SELECT CASE
      WHEN r.status IS NULL OR r.status <> 'found' OR r.cast_size = 0 THEN 'pending'
      WHEN r.is_in_cast OR t.character_id = r.character_id THEN 'keep'
      WHEN cardinality(r.candidates) <> 1 THEN 'quarantine'
      ELSE 'repoint'
    END AS decision,
    CASE
      WHEN r.status IS NULL THEN 'not-fetched'
      WHEN r.status = 'error' THEN 'fetch-error'
      WHEN r.status = 'not-found' THEN 'not-found'
      -- an empty AniList cast is missing data, not proof (cast-relink L9)
      WHEN r.cast_size = 0 THEN 'cast-empty'
      WHEN r.is_in_cast OR t.character_id = r.character_id THEN 'in-anilist-cast'
      WHEN cardinality(r.candidates) > 1 THEN 'ambiguous'
      WHEN cardinality(r.candidates) = 0 THEN 'no-anilist-match'
      ELSE 'name-match'
    END AS reason
) v;

-- Cast entries of a found manga that no keep/repoint pair covers and whose target is not
-- already linked to the manga.
CREATE TABLE audit_add (
  manga_id integer NOT NULL,
  anilist_character_id integer NOT NULL,
  role text,
  target_character_id integer NOT NULL,
  creates_character boolean NOT NULL,
  PRIMARY KEY (manga_id, anilist_character_id)
);

INSERT INTO audit_add
SELECT k.manga_id, k.anilist_character_id, k.role, t.character_id, t.creates_character
FROM manga_cast k
JOIN target t ON t.anilist_character_id = k.anilist_character_id
WHERE EXISTS (SELECT 1 FROM manga_character mc WHERE mc.manga_id = k.manga_id)
  AND NOT EXISTS (
    SELECT 1 FROM audit a
    WHERE a.manga_id = k.manga_id AND a.decision IN ('keep', 'repoint')
      AND a.anilist_character_id = k.anilist_character_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM manga_character mc
    WHERE mc.manga_id = k.manga_id AND mc.character_id = t.character_id
  );

COMMIT;
