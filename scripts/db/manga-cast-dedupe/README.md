# Manga cast dedupe (MAL vs AniList import)

The scraper (`anime-scraper-v2`, MAL manga characters) inserts `manga_character` rows with
real MyAnimeList character ids and Title-case roles (`Main`, `Supporting`) next to the
AniList-import rows with UPPERCASE roles (`MAIN`, `SUPPORTING`, `BACKGROUND`). This removes
the resulting duplicates. Context: `odd/tasks/catalog-rebuild.md` (T1/T2, L7–L10).

**Local database only.** `run.sh` refuses any host other than `localhost`, `127.0.0.1` or
`[::1]`; production is applied manually by the maintainer. **Run `apply`/`rollback` while
no load is running**: both lock the seven tables and fail after 10 s if a writer holds them.

## Commands

```bash
bash scripts/db/manga-cast-dedupe/run.sh test      # throwaway test schemas
bash scripts/db/manga-cast-dedupe/run.sh audit     # dry run: counts + 5 examples per kind
bash scripts/db/manga-cast-dedupe/run.sh apply     # ONE transaction = one logged batch
bash scripts/db/manga-cast-dedupe/run.sh rollback  # ONE transaction, exact undo of the last batch
```

Needs the manga cast staging of `scripts/db/manga-cast-relink` (`manga_cast_relink.manga_cast`
and `norm_name`), otherwise `audit`/`apply` are refused. Logs live in `manga_cast_dedupe`.

## Rules (`sql/02-plan.sql`)

**Kind A** — the same `(manga_id, character_id)` has a Title-case row and an UPPERCASE row:
the UPPERCASE row is removed, the MAL row kept (cast-relink `dedupe` / `jikan-same-pair`).

**Kind B** — a real MAL character R (Title-case row) and a synthetic S = `1e9 + X`
(UPPERCASE row) in the same manga, where the AniList entry X of that manga holds
`norm_name(R.name)` ("Doujima, Kengo" = "Kengo Dojima"). R ≡ X by the cast-derived rule of
`character-external/sql/02-cast-ids.sql`, on manga casts: in each manga of R, the only
`manga_cast` entry with R's key is a candidate; R ≡ X when all candidates agree. Then S is
merged into R exactly like `character-external merge-twins` (its moves file is included
as is): `anime_character`, `manga_character`, `character_voice_actor`,
`character_nickname` and `character_media` rows move to R, a key R already holds is
skipped and deleted, S and its `character_external` row are deleted, and R's
`character_external.anilist_id` becomes X. Kind A runs after the merge, so S's moved
UPPERCASE row next to R's MAL row is removed too (`merged-pair`).

Pairs left untouched and counted by `audit`:

| Status | Meaning |
|---|---|
| `ambiguous` | R matches several entries of a manga only, its manga disagree, or it derives another X |
| `shared-anilist` | several real characters derive X |
| `no-external` | R has no `character_external` row |
| `anilist-disagrees` | R's `character_external.anilist_id` is another id (kept) |
| `anilist-taken` | a third character holds X |

## apply, guard and re-runs

`apply` rebuilds the plan inside its transaction, so it acts on the rows present at that
moment. A plan with nothing to do is refused (`nothing to apply`): applying twice never
writes a second batch. After more MAL rows arrive, `audit` lists only the new actionable
pairs (left-alone pairs are listed again) and `apply` writes them as a new batch.

Every changed row is logged with its `batch_id`: `merged_pairs`, `updated_externals`
(previous `anilist_id` and `updated_at`), `deleted_characters`, `deleted_externals`,
`moved_*`, `skipped_*` (whole rows) and `removed_links` (kind A, reason `same-pair` or
`merged-pair`).

## rollback

Undoes the **last** batch (run it again for the previous one) and deletes its logs,
restoring the seven tables exactly. It is refused, writing nothing, on drift: a row the
batch moved to R is gone, R's `character_external` row no longer holds the id the batch
set, a deleted synthetic id or a removed link exists again. Rows added later that
reference R stay with R.

Order with the other scripts: roll back every batch of this one before rolling back
`manga-cast-relink` or `character-external` (it moves rows they wrote and deletes
synthetic characters they kept).

The database URL comes from `LOCAL_DATABASE_URL`, then `DATABASE_URL`, then `POSTGRES_*`.
