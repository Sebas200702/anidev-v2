## 1. Pass the Bun adapter build-arg in the Docker publishing workflows

- [x] 1.1 Add `build-args: |` with `ASTRO_ADAPTER=bun` to the "Build and push Docker image" step in `.github/workflows/release.yml`
- [x] 1.2 Add the same `build-args: |` block with `ASTRO_ADAPTER=bun` to the matching step in `.github/workflows/deploy.yml`

## 2. Verify and release

- [x] 2.1 Confirm the Dockerfile needs no change (`ARG`/`ENV` already consume `ASTRO_ADAPTER`) and the workflow YAML is valid
- [ ] 2.2 Run the Verification gate and open a PR to `master` on branch `ci/fix-docker-astro-bun-build-arg`
- [ ] 2.3 Run `bun run release:patch` on the branch so the PR carries the version bump and `v0.1.2` tag, then merge and push the tag to trigger `release.yml` and rebuild the image
