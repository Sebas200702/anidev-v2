-- audit (dry run): builds the plan in TEMP tables and prints the counts. Writes nothing.
\ir 02-plan.sql

SELECT 'source ' || CASE origin WHEN 1 THEN 'anime cast' ELSE 'manga cast' END AS metric,
  count(*) AS count
FROM fill_source GROUP BY origin
UNION ALL SELECT 'source anilist ids', count(DISTINCT anilist_id) FROM fill_source
UNION ALL SELECT 'kanji placeholder (NULL)', count(*) FROM "character"
  WHERE name_kanji IS NULL
UNION ALL SELECT 'kanji placeholder (= name)', count(*) FROM "character"
  WHERE name_kanji = name
UNION ALL SELECT 'kanji placeholder with anilist_id', count(*) FROM "character" c
  JOIN character_external e ON e.character_id = c.mal_id AND e.anilist_id IS NOT NULL
  WHERE c.name_kanji IS NULL OR c.name_kanji = c.name
UNION ALL SELECT 'kanji ' || decision || CASE WHEN previous_kanji IS NULL THEN ' (was NULL)'
  ELSE ' (was = name)' END, count(*) FROM kanji_plan GROUP BY decision, previous_kanji IS NULL
UNION ALL SELECT 'characters without poster', count(*) FROM "character" c
  WHERE NOT EXISTS (SELECT 1 FROM character_media m
                    WHERE m.character_id = c.mal_id AND m.media_type = 'poster')
UNION ALL SELECT 'without poster, with anilist_id', count(*) FROM character_external e
  WHERE e.anilist_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM character_media m
    WHERE m.character_id = e.character_id AND m.media_type = 'poster')
UNION ALL SELECT 'poster fill', count(*) FROM poster_plan
UNION ALL SELECT 'poster skipped (only placeholder image)', count(DISTINCT e.character_id)
  FROM character_external e JOIN fill_source s ON s.anilist_id = e.anilist_id
  WHERE s.image_url ~ '/default\.(jpg|png)$'
    AND NOT EXISTS (SELECT 1 FROM source_image i WHERE i.anilist_id = e.anilist_id)
    AND NOT EXISTS (SELECT 1 FROM character_media m
                    WHERE m.character_id = e.character_id AND m.media_type = 'poster')
ORDER BY 1;
