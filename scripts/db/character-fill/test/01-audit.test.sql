-- T3 audit: the plan per character, a dry run that writes nothing, and absent staging.
\ir fixtures.sql
\ir ../sql/01-log.sql

\o /dev/null
\ir ../sql/03-audit.sql
\o

DO $$
BEGIN
  ASSERT (SELECT array_agg((character_id, anilist_id, previous_kanji, natives, decision)::text
                           ORDER BY character_id) FROM kanji_plan)
    = ARRAY[(1, 101, NULL, '{夜神月}', 'fill')::text,
            (2, 102, 'Ryuk', '{リューク}', 'fill')::text,
            (4, 104, 'Near', '{ニア,ネア}', 'conflict')::text],
    format('kanji_plan: %s', (SELECT string_agg((character_id, natives, decision)::text, ' '
      ORDER BY character_id) FROM kanji_plan));
  ASSERT (SELECT array_agg((character_id, image_url)::text ORDER BY character_id)
          FROM poster_plan)
    = ARRAY[(1, 'https://s4.anilist.co/c/large/b101-a.jpg')::text,
            (3, 'https://s4.anilist.co/c/large/b103.jpg')::text,
            (5, 'https://s4.anilist.co/c/large/b105.jpg')::text],
    format('poster_plan: %s', (SELECT string_agg((character_id, image_url)::text, ' '
      ORDER BY character_id) FROM poster_plan));
  ASSERT all_same('before_'), 'audit writes no public table';
  ASSERT (SELECT count(*) FROM applied) + (SELECT count(*) FROM kanji_updates)
    + (SELECT count(*) FROM kanji_conflicts) + (SELECT count(*) FROM inserted_posters) = 0,
    'audit writes no log';
END $$;

-- A missing staging table (or schema) is not read: only the anime cast remains.
\set manga_table 'missing_schema.manga_cast'
\o /dev/null
\ir ../sql/03-audit.sql
\o
DO $$
BEGIN
  ASSERT (SELECT array_agg((character_id, decision)::text ORDER BY character_id)
          FROM kanji_plan)
    = ARRAY['(1,fill)', '(4,fill)'],
    format('kanji_plan without manga: %s', (SELECT string_agg((character_id, decision)::text,
      ' ' ORDER BY character_id) FROM kanji_plan));
  ASSERT (SELECT array_agg(character_id ORDER BY character_id) FROM poster_plan)
    = ARRAY[1, 3], 'posters without manga';
END $$;
\set cast_table 'missing_schema.anilist_cast'
\o /dev/null
\ir ../sql/03-audit.sql
\o
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT 1 FROM kanji_plan) AND NOT EXISTS (SELECT 1 FROM poster_plan),
    'no staging at all plans nothing';
  ASSERT all_same('before_'), 'audit writes no public table';
END $$;
\set cast_table 'character_fill_test.anilist_cast'
\set manga_table 'character_fill_test.manga_cast'
