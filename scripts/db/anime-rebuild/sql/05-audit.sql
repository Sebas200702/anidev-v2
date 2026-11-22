-- audit (dry run): builds the plan in TEMP tables and prints counts per action plus five
-- examples each. Writes nothing.
\ir 04-plan.sql

\qecho '== sources'
SELECT 'anilist entries' AS metric, count(*) AS count FROM anilist_rows
UNION ALL SELECT 'anilist MAL ids in catalog', count(*) FROM src_anilist s
  WHERE EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = s.mal_id)
UNION ALL SELECT 'offline MAL ids in catalog', count(*) FROM src_offline s
  WHERE EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = s.mal_id)
UNION ALL SELECT 'anilist → MAL id map', count(*) FROM ani_map;

\qecho '== relations (AniList edges from catalog anime)'
SELECT CASE
    WHEN node_type <> 'ANIME' THEN 'skip: related is not anime (' || node_type || ')'
    WHEN v.app_value IS NULL THEN 'skip: unmapped type'
    WHEN related_anime_id IS NULL THEN 'skip: related AniList id has no MAL id'
    WHEN NOT EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = e.anime_id)
      OR NOT EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = e.related_anime_id)
      THEN 'skip: anime not in catalog'
    WHEN e.anime_id = e.related_anime_id THEN 'skip: self relation'
    WHEN EXISTS (SELECT 1 FROM anime_relation r WHERE r.anime_id = e.anime_id
      AND r.related_anime_id = e.related_anime_id AND r.relation_type = v.app_value)
      THEN 'skip: already stored'
    ELSE 'insert' END AS outcome, count(*) AS edges
FROM anilist_edges e
LEFT JOIN vocab v ON (v.kind, v.source, v.source_value) = ('relation', 'anilist', e.anilist_type)
GROUP BY 1 ORDER BY 1;

SELECT 'insert ' || CASE WHEN pair_known THEN '(pair stored with another type)'
  ELSE '(new pair)' END AS action, relation_type, count(*) AS rows
FROM relation_plan GROUP BY 1, 2 ORDER BY 1, 3 DESC;

\qecho '== relation examples (5 per kind)'
SELECT kind, anime_id, title, relation_type, related_anime_id, related_title FROM (
  SELECT CASE WHEN p.pair_known THEN 'pair known' ELSE 'new pair' END AS kind, p.anime_id,
    a.title, p.relation_type, p.related_anime_id, b.title AS related_title,
    row_number() OVER (PARTITION BY p.pair_known ORDER BY p.anime_id, p.related_anime_id) AS n
  FROM relation_plan p JOIN anime a ON a.mal_id = p.anime_id
  JOIN anime b ON b.mal_id = p.related_anime_id
) s WHERE n <= 5 ORDER BY kind, n;

\qecho '== offline-db relatedAnime (untyped: reported, never inserted)'
SELECT 'pairs with no stored or planned relation' AS metric, count(*) AS count
FROM offline_untyped;
SELECT o.anime_id, a.title, o.related_anime_id, b.title AS related_title
FROM offline_untyped o JOIN anime a ON a.mal_id = o.anime_id
JOIN anime b ON b.mal_id = o.related_anime_id
ORDER BY o.anime_id, o.related_anime_id LIMIT 5;

\qecho '== unmapped vocabulary (skipped)'
SELECT kind, source, value, rows FROM unmapped_vocab ORDER BY kind, source, rows DESC;

\qecho '== field changes'
SELECT action, field, count(*) AS rows FROM field_plan GROUP BY 1, 2 ORDER BY 1, 2;
SELECT 'excluded (' || reason || ')' AS majority, field, count(*) AS rows
FROM majority_excluded GROUP BY 1, 2 ORDER BY 1, 2;

\qecho '== field examples (5 per action and field)'
SELECT action, field, anime_id, title, previous_value, new_value FROM (
  SELECT p.action, p.field, p.anime_id, a.title,
    left(replace(p.previous_value, E'\n', ' '), 60) AS previous_value,
    left(replace(p.new_value, E'\n', ' '), 60) AS new_value,
    row_number() OVER (PARTITION BY p.action, p.field ORDER BY p.anime_id) AS n
  FROM field_plan p JOIN anime a ON a.mal_id = p.anime_id
) s WHERE n <= 5 ORDER BY action, field, n;

\qecho '== excluded majority examples (5 per reason and field)'
SELECT reason, field, anime_id, title, previous_value, new_value FROM (
  SELECT x.reason, x.field, x.anime_id, a.title, x.previous_value, x.new_value,
    row_number() OVER (PARTITION BY x.reason, x.field ORDER BY x.anime_id) AS n
  FROM majority_excluded x JOIN anime a ON a.mal_id = x.anime_id
) s WHERE n <= 5 ORDER BY reason, field, n;
