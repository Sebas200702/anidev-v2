# Production runbook — cast and catalog data correction

Replays on production the data corrections verified on the local clone
(`odd/tasks/cast-relink.md`, `odd/tasks/catalog-rebuild.md`). Run by the
maintainer on the VPS. Every step is one transaction, logged, and reversible.

**Expected result** (local clone, 2026-11-22): anime casts 476,811 → 306,597
rows, manga casts 194,613 → 132,219, characters 254,160 → 242,071 with one
`character_external` row each, 80,002 kanji filled, 52,515 portraits added,
200 typed anime relations, 509 anime field fixes. Production numbers will
differ slightly: the scraper kept writing after the clone.

## Before you start

| Need | Detail |
|---|---|
| App migration | `0016_character-external` applied (anidev-v2 #144) |
| Scraper | paused for the whole run (stop its Dokploy service or cron) |
| Tools on the VPS | `psql`, `pg_dump`, `bun`, `awk`, a checkout of branch `feat/catalog-rebuild` |
| Database host | the scripts refuse any host but `localhost`, `127.0.0.1` or `[::1]`: run them where Postgres listens on localhost (VPS port bound to 127.0.0.1, or inside a container that shares its network) |
| Data files | copy `.cast-relink-cache/` from the maintainer's machine; download the AniList Kaggle CSV (`calebmwelsh/anilist-anime-dataset`, `anilist_anime_data_complete.csv`) into it |

```bash
export LOCAL_DATABASE_URL='postgres://USER:PASS@localhost:5432/DB'   # production, via localhost
C=.cast-relink-cache
export PSQL_PAGER=cat PAGER=cat
```

## 1. Back up

```bash
pg_dump "$LOCAL_DATABASE_URL" -Fc -f /root/backup-cast-$(date +%F).dump \
  -t character -t character_external -t character_media -t character_nickname \
  -t character_voice_actor -t anime_character -t manga_character \
  -t anime -t anime_relation
```

The rollbacks below restore everything exactly; the dump is the last resort.

## 2. Run, in this order

Each `audit` is a dry run: read it before its `apply`. Stop at the first
error — nothing after it has run, and the logged batches can be rolled back.

| # | Step | Commands |
|---|---|---|
| 1 | Stage sources | `bash scripts/db/cast-relink/run.sh stage --anilist-csv $C/anilist_anime_data_complete.csv --offline-db $C/anime-offline-database.jsonl` |
| 2 | Anime casts the CSV lacks | `bash scripts/db/cast-relink/run.sh audit` (fetch-list reads the audit) · `bash scripts/db/cast-relink/run.sh fetch-list --out-dir $C` · `bun scripts/db/cast-relink/fetch-anilist.ts $C/pending-ids.txt --out $C/anilist-api.jsonl --map $C/anilist-map.tsv --batch 20` · `bash scripts/db/cast-relink/run.sh merge-api --api-jsonl $C/anilist-api.jsonl` |
| 3 | Anime cast relink | `bash scripts/db/cast-relink/run.sh audit` (again, with the API casts) → `apply` |
| 4 | Real character ids + merge twins | `bash scripts/db/character-external/run.sh backfill` → `merge-twins` |
| 5 | Manga casts | `bash scripts/db/manga-cast-relink/run.sh fetch-list --out-dir $C` · `bun scripts/db/cast-relink/fetch-anilist.ts $C/manga-ids.txt --type MANGA --out $C/manga-api.jsonl --map $C/manga-anilist-map.tsv --batch 20` · `bash scripts/db/manga-cast-relink/run.sh merge-api --api-jsonl $C/manga-api.jsonl` → `audit` → `apply` |
| 6 | Kanji + portraits | `bash scripts/db/character-fill/run.sh audit` → `apply` |
| 7 | Anime relations + fields | `bash scripts/db/anime-rebuild/run.sh audit` → `apply` |
| 8 | Manga casts from MAL (optional, after the scraper's MAL manga load in Mode A and `promote --only=character,character_media,manga_character`) | insert the missing `character_external` rows, then `bash scripts/db/manga-cast-dedupe/run.sh audit` → `apply` |

The fetcher is resumable: it skips ids already in the `.jsonl`, so the files
copied from the local run are reused and only ids new on production are
fetched (≈30 requests/min, AniList's limit).

## 3. Check

```sql
SELECT count(*) FROM anime_character;                       -- ≈ 306k
SELECT count(*) FROM manga_character;                       -- ≈ 132k
SELECT (SELECT count(*) FROM character) = (SELECT count(*) FROM character_external);  -- true
SELECT count(*) FROM anime_character u JOIN anime_character t
  ON t.anime_id = u.anime_id AND t.character_id = u.character_id
 AND t.role <> upper(t.role) WHERE u.role = upper(u.role);  -- 0
SELECT count(DISTINCT anime_id) FROM anime_character WHERE character_id = 95887;  -- "Narrator": 1, not 1,245
```

Then invalidate the app cache (Dragonfly `FLUSHALL`, or the `anime:*`,
`manga:*`, `people:*` keys) and spot-check `/api/anime/57810/characters`
(Shoushimin) and `/api/manga/35243` (Haikyuu!!).

## 4. Resume the scraper

Deploy anime-scraper-v2 #4 first, so it does not write the old errors back,
then restart it with `INCREMENTAL_HOT_REARM_LIMIT=150` and run
`bun run incremental:report`.

## Roll back

Latest batch first; each command restores its tables exactly.

```bash
bash scripts/db/anime-rebuild/run.sh rollback      # independent of the others
bash scripts/db/manga-cast-dedupe/run.sh rollback  # once per batch, before the rest
bash scripts/db/character-fill/run.sh rollback
bash scripts/db/manga-cast-relink/run.sh rollback
bash scripts/db/character-external/run.sh rollback
bash scripts/db/cast-relink/run.sh rollback
```

Rollback refuses when rows created by a batch are referenced by rows written
after it (for example by the scraper): keep the scraper paused until you have
decided to keep the result.
