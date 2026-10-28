# Automate GitHub Releases on tag push

## Problem

Tags are created automatically (`standard-version`), and `release.yml` builds and
pushes the Docker image on every `v*` tag — but the GitHub Release itself is never
created. Releases have to be published by hand, and 15 of the 25 tags
(`v0.1.0`–`v0.1.3`, `v0.2.0`–`v0.2.2`, `v0.7.0`, `v0.12.0`–`v0.18.0`) currently
have no release.

## Approach

1. Add a `github-release` job to `.github/workflows/release.yml` (triggered by the
   same `v*` tag push) that publishes the GitHub Release with notes extracted from
   the version's `CHANGELOG.md` section, falling back to `gh --generate-notes` when
   the section is missing. The job is idempotent (skips when the release exists).
2. Backfill the 15 missing releases from their tags, using the `CHANGELOG.md`
   section present at each tag, and mark `v0.18.0` as *latest*.

## Scope

- Tooling only (CI workflow + one-off backfill); no runtime behavior delta →
  `skip_specs: true`.
