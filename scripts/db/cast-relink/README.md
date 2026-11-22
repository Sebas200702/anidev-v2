# Cast relink

Re-resolves the UPPERCASE-role `anime_character` links (AniList import) whose MAL id was
assigned by a global name lookup. Plan and evidence: `odd/tasks/cast-relink.md`.

**Local database only.** `run.sh` refuses any host other than `localhost`,
`127.0.0.1` or `[::1]`; production is applied manually by the maintainer.

## Sources (downloaded outside the repo, treated as untrusted data)

| Source | File |
|---|---|
| AniList Kaggle dataset (`calebmwelsh/anilist-anime-dataset`) | `anilist_anime_data_complete.csv` |
| anime-offline-database (`justsahil/anime-dataset`) | `anime-offline-database.jsonl` |

The CSV holds only the first AniList page of each cast (25 characters), so a character
missing from a 25-character cast is not proof that the link is wrong.

## Commands

```bash
bash scripts/db/cast-relink/run.sh test     # fixtures in a throwaway cast_relink_test schema
bash scripts/db/cast-relink/run.sh stage --anilist-csv PATH --offline-db PATH
bash scripts/db/cast-relink/run.sh audit    # dry run: rebuilds cast_relink.audit + summary
bash scripts/db/cast-relink/run.sh fetch-list --out-dir DIR      # ids to ask AniList for
bun scripts/db/cast-relink/fetch-anilist.ts DIR/pending-ids.txt --out DIR/anilist-api.jsonl \
  --map DIR/anilist-map.tsv [--rpm 30]
bash scripts/db/cast-relink/run.sh merge-api --api-jsonl DIR/anilist-api.jsonl
bash scripts/db/cast-relink/run.sh audit    # re-classifies with the API casts
bash scripts/db/cast-relink/run.sh apply    # re-runs audit, then writes in ONE transaction
bash scripts/db/cast-relink/run.sh rollback # restores the applied batch exactly
bun test scripts/db/cast-relink/test        # offline checks of the AniList client
```

`stage` writes only to the `cast_relink` schema: `anilist_cast` (cast per MAL anime id),
`anilist_cast_source` (cast size and source) and `anime_anilist_map` (MAL → AniList).

`audit` (dry run) reads `public.anime_character` / `public."character"` and rebuilds only
`cast_relink.audit`: one row per distinct UPPERCASE-role pair with `roles`, `decision`,
`reason`, `anilist_character_id`, `target_character_id` and `creates_character`, then prints
counts by decision/reason and the rows of anime 57810.

| Decision | Reason | Meaning |
|---|---|---|
| `dedupe` | `jikan-same-pair` | the Jikan cast (Title-case role) already holds the pair |
| `keep` | `synthetic-in-anilist-cast` | synthetic id whose AniList character is in that anime's cast |
| `repoint` | `synthetic-to-jikan` | synthetic id → same-name Jikan-cast character of the anime |
| `repoint` | `real-to-jikan` | unconfirmed MAL id → same-name Jikan-cast character |
| `repoint` | `real-to-synthetic` | unconfirmed MAL id → `1e9 + AniList id` (`creates_character` when missing) |
| `quarantine` | `ambiguous` | more than one AniList or Jikan candidate |
| `quarantine` | `no-anilist-match` | complete cast (< 25) without the character |
| `pending-api` | `cast-truncated` / `cast-empty` / `cast-missing` | CSV cast cut at 25, empty cast, or anime with no cast source (T3) |

## AniList API fallback (T3)

`fetch-list` writes `DIR/pending-ids.txt` (distinct anime ids of the `pending-api` audit
rows) and `DIR/anilist-map.tsv` (`mal_id<TAB>anilist_id` for those ids, from
`anime_anilist_map`).

`fetch-anilist.ts` (Bun, no dependencies) asks `https://graphql.anilist.co` for the full
cast of each id — `Media(id:)` when the map has the AniList id, else `Media(idMal:)` —
paging `characters(perPage: 25)` until `hasNextPage` is false. It appends one line per
anime: `{"anime_id", "found", "edges"}` (plus `"error"` when the fetch failed).

- **Rate limit:** at most `--rpm` requests per minute (default 30, one per page). HTTP
  429 waits `Retry-After` (+1 s); 5xx and network errors are retried 3 times with
  backoff, then the line is written with `found: false` and `error`.
- **Resumable:** ids already in the output without `error` are skipped, so the command
  can be stopped and re-run; errored ids are fetched again on the next run.
- Sends only a generic `User-Agent` (`cast-relink/1.0`) and no credentials.

`merge-api` loads the JSONL into `anilist_api_raw` and runs `sql/04-merge-api.sql`: for
every found anime (latest found line wins) its `anilist_cast` rows are replaced and
`anilist_cast_source` becomes (real cast size, `anilist-api`); not-found and errored
animes keep their staging. Re-running it is idempotent. An `anilist-api` cast is complete,
so the audit no longer treats it as truncated at 25. `stage` truncates staging, so run
`merge-api` again after any re-stage.

## Apply and rollback (T4)

`apply` re-runs the audit, then `sql/05-apply.sql` acts on its decisions in one
transaction and prints counts per action. Every change is logged in the `cast_relink`
schema:

| Decision | Effect | Log |
|---|---|---|
| `dedupe`, `quarantine` | the pair's UPPERCASE rows are deleted | `removed_links` |
| `repoint` | old UPPERCASE rows deleted; `(anime, target, role)` inserted per role, skipped when the anime already has the target with a Title-case (Jikan) role or the row exists (sources sharing a target insert once) | `removed_links`, `inserted_links` |
| `repoint` + `creates_character` | `"character"` row from the AniList cast (`name_full`, `name_native`, `anilist_id`) and, when `image_url` is set and is not the AniList `default.jpg` placeholder, a poster | `created_characters`, `created_media` |
| `repoint` to a real MAL id | `anilist_id` set when NULL; a different existing value (or several candidates) is left as is | `updated_characters` (`set` / `conflict`) |
| `keep`, `pending-api` | untouched | — |

AniList posters: `media_type = 'poster'`, `size` NULL, `source = 'anilist'`,
`priority = 30` — after the MAL posters (20/25), so a MAL image added later for the same
character wins.

`apply` is refused while the logs hold a batch. `rollback` (`sql/06-rollback.sql`, one
transaction) deletes the inserted links, created media and created characters, restores
`anilist_id` (only where it still holds the value the batch set), re-inserts the removed
links and empties the logs. It refuses when a created character is referenced by a link
or media row the batch did not create, since deleting it would cascade those rows away.

The database URL comes from `LOCAL_DATABASE_URL`, then `DATABASE_URL`, then `POSTGRES_*`.
