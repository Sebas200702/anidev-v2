# Manga cast relink

Re-resolves the `manga_character` links (all from the AniList import, which resolved
characters by global name: "Narrator" in 140 mangas) against the AniList cast of each
manga. There is no Jikan cast for manga, so AniList's manga cast is the reference. Plan
and evidence: `odd/tasks/catalog-rebuild.md` (T2, S4; design in L3/L4).

**Local database only.** `run.sh` refuses any host other than `localhost`, `127.0.0.1`
or `[::1]`; production is applied manually by the maintainer.

## Commands

```bash
bash scripts/db/manga-cast-relink/run.sh test                  # throwaway test schema
bash scripts/db/manga-cast-relink/run.sh fetch-list --out-dir DIR
bun scripts/db/cast-relink/fetch-anilist.ts DIR/manga-ids.txt --type MANGA \
  --out DIR/manga-api.jsonl --map DIR/manga-anilist-map.tsv --batch 20
bash scripts/db/manga-cast-relink/run.sh merge-api --api-jsonl DIR/manga-api.jsonl
bash scripts/db/manga-cast-relink/run.sh audit                 # dry run + summary
bash scripts/db/manga-cast-relink/run.sh apply                 # re-runs audit, ONE tx
bash scripts/db/manga-cast-relink/run.sh rollback              # ONE tx, exact undo
```

Everything lives in the `manga_cast_relink` schema. `norm_name` is the anime cast
relink's normalizer, copied verbatim from `scripts/db/cast-relink/sql/01-staging.sql`
(order-insensitive tokens, long vowels collapsed: "Doujima, Kengo" = "Kengo Dojima").

- `fetch-list` writes `DIR/manga-ids.txt` (distinct `manga_id` of `manga_character`) and
  `DIR/manga-anilist-map.tsv` (`mal_id<TAB>anilist_id` from
  `manga_external_ids.anilist_id`) and prints both counts.
- The fetch is the anime cast relink's batched, resumable fetcher with `--type MANGA`;
  its lines keep the `anime_id` key for the MAL manga id.
- `merge-api` loads the JSONL into `api_raw` and rebuilds `manga_cast` (AniList id, role,
  full/native name, image, `name_keys`) and `manga_cast_source` (`found` / `not-found` /
  `error`, cast size). Per manga the latest found line wins over errors. Idempotent.

## audit (dry run)

`audit` rebuilds only `audit` and `audit_add`. A **target** for AniList character X is
the character whose `character_external.anilist_id` is X, else `1000000000 + X`
(`creates_character` when that row does not exist).

| Decision | Reason | Meaning |
|---|---|---|
| `keep` | `in-anilist-cast` | the character's `character_external.anilist_id` is in the manga's cast |
| `repoint` | `name-match` | its `norm_name` matches exactly one cast entry's `name_keys` → target |
| `quarantine` | `ambiguous` | more than one cast entry matches the name |
| `quarantine` | `no-anilist-match` | the manga was found and no cast entry matches |
| `pending` | `not-fetched` / `not-found` / `fetch-error` / `cast-empty` | no usable AniList cast: untouched |

An empty AniList cast is missing data, not proof (cast relink L9), so it is `pending`.
`audit_add` lists the cast entries of a fetched manga covered by no `keep`/`repoint` pair
whose target the manga does not already link (role, target, `creates_character`).

## apply

One transaction; refused while the logs hold a batch (`run rollback first`).

| Step | Effect | Log |
|---|---|---|
| create | each missing synthetic target: `"character"` (`name` = AniList full name, `name_kanji` = native) + `character_external` (`anilist_id`) + AniList poster (`source 'anilist'`, `priority 30`, `size` NULL; `default.jpg` skipped) | `created_characters`, `created_media` |
| `quarantine`, `repoint` | every row of the pair is deleted | `removed_links` |
| `keep` | rows differing only by role case collapse to the UPPERCASE role | `removed_links` (`case-duplicate`) |
| `repoint`, add | `(manga, target)` inserted with the AniList role, once per pair, repoint before add; skipped when the manga already links the target | `inserted_links` (`source`) |
| `pending` | untouched | — |

`character.anilist_id` is deprecated and left NULL on created characters.

## rollback

Deletes the inserted links, created media, created `character_external` rows and created
characters, re-inserts the removed links and empties the logs, restoring
`manga_character`, `"character"`, `character_external` and `character_media` exactly. It
refuses when a created character is referenced by a row the batch did not write (a
`manga_character` link it did not insert, a `character_media` row it did not create, or
any `anime_character`, `character_voice_actor` or `character_nickname` row).

**Rollback order:** newest first — this rollback before
`scripts/db/character-external` and before `scripts/db/cast-relink`.

The database URL comes from `LOCAL_DATABASE_URL`, then `DATABASE_URL`, then `POSTGRES_*`.
