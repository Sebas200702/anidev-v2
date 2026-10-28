# MinIO Community Edition, built from source.
#
# Upstream stopped publishing CE binaries and container images in October 2025
# (github.com/minio/minio#21647) and the repository is now archived: pulling the
# official image is no longer possible (the repo was removed from Docker Hub),
# and the last published tags predate the 2025-10-15 security release. Building
# from the tagged source is the only way to run a patched CE build we control.
# AGPLv3: the source for each pinned tag lives at github.com/minio/minio and
# github.com/minio/mc.
#
# The image carries both binaries: `minio` for the object store service and
# `mc` for the one-shot bucket init job, which runs them via /bin/sh -c so the
# alias, bucket creation and policy land in one session (see
# docker-compose.yml).
FROM golang:1.25-alpine AS build

ARG MINIO_TAG=RELEASE.2025-10-15T17-29-55Z
ARG MC_TAG=RELEASE.2025-08-13T08-35-41Z

RUN apk add --no-cache git
# Static build: no CGO, so the binaries run unmodified on the alpine runtime.
ENV CGO_ENABLED=0
# Each repo is cloned at its pinned tag and built with -mod=readonly, so the
# dependency graph is exactly the tag's go.sum. The ldflags mirror
# buildscripts/gen-ldflags.go upstream: without them the binary reports
# `DEVELOPMENT.GOGET`, which hides which CE tag a container runs. CommitID
# stays unset (`--version` shows it as DEVELOPMENT.GOGET); the tag identifies
# the build.
RUN git clone --depth 1 --branch "${MINIO_TAG}" \
      https://github.com/minio/minio.git /src/minio \
  && git clone --depth 1 --branch "${MC_TAG}" \
      https://github.com/minio/mc.git /src/mc
WORKDIR /src/minio
RUN go build -mod=readonly -trimpath -o /out/minio \
      -ldflags "-s -w \
        -X github.com/minio/minio/cmd.Version=${MINIO_TAG} \
        -X github.com/minio/minio/cmd.ReleaseTag=${MINIO_TAG} \
        -X github.com/minio/minio/cmd.CopyrightYear=2025" \
      .
WORKDIR /src/mc
RUN go build -mod=readonly -trimpath -o /out/mc \
      -ldflags "-s -w \
        -X github.com/minio/mc/cmd.Version=${MC_TAG} \
        -X github.com/minio/mc/cmd.ReleaseTag=${MC_TAG}" \
      .

FROM alpine:3.22

RUN apk add --no-cache ca-certificates \
  && addgroup -S minio \
  && adduser -S -G minio minio \
  && mkdir /data \
  && chown minio:minio /data
COPY --from=build /out/minio /usr/local/bin/minio
COPY --from=build /out/mc /usr/local/bin/mc

# Console (9001) is optional in production; the API port (9000) is what the app
# and the bucket init job talk to.
EXPOSE 9000 9001

# Unprivileged: a fresh `minio_data` named volume inherits the minio-owned
# /data from the image. A volume created by an older root build needs a
# one-time `chown` (or recreation) before this image can write to it.
USER minio
ENTRYPOINT ["minio"]
CMD ["server", "/data", "--console-address", ":9001"]
