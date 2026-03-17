# Builder Site

Static marketing site with a lightweight Python admin panel for editing content and uploading images.

## What is included

- A Docker image that can run either the public site or the admin panel
- A GitHub Actions workflow that publishes the image to GHCR
- A `docker-compose.yml` file that pulls the published image from GHCR
- Persistent local mounts for `assets/data` and `assets/uploads` so admin edits survive container restarts

## GitHub and GHCR setup

1. Create a GitHub repository for this project.
2. Push this folder to the repository.
3. Update `.env` from `.env.example` if you want to override ports or the image name. The default GHCR image is `ghcr.io/qudy2001/suttonbuilder:latest`.
4. Push to `main` or `master`, or create a version tag like `v1.0.0`.

The workflow in [`.github/workflows/publish-ghcr.yml`](/Users/raylv/Developer/Builder Site/.github/workflows/publish-ghcr.yml) will build the image and publish it to GHCR.

If the package is private, log in before pulling:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## Running with Docker Compose

Create a local `.env` file from `.env.example`, then run:

```bash
docker compose pull
docker compose up -d
```

Services:

- Public site: `http://localhost:4173`
- Admin panel: `http://localhost:4174`

The compose file keeps these paths writable and persistent:

- `assets/data`
- `assets/uploads`

## Image commands

The published image supports two runtime modes:

```bash
docker run --rm -p 4173:8080 ghcr.io/qudy2001/suttonbuilder:latest site
docker run --rm -p 4174:8080 ghcr.io/qudy2001/suttonbuilder:latest admin
```

## Local notes

- This folder was not a git repository when I prepared it, so the files are ready for GitHub but the repo still needs `git init` and an initial push if you have not already done that.
- The admin panel writes to `assets/data/site-content.json` and `assets/uploads/`.
