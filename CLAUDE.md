# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a static GitHub Pages site that hosts Swagger-UI to serve OpenAPI/Swagger documentation. The experiment demonstrates serving a Swagger UI without a backend server by hosting it as a static GitHub Pages site.

- `swagger.json` — the OpenAPI/Swagger definition (Petstore example) served from the repository root
- `api-docs/` — static Swagger-UI files (copied from the official `dist/` release)
- `api-docs/swagger-initializer.js` — the key configuration file that defines which API specs are displayed

## Local Development

Requires Ruby and Bundler.

```bash
bundle install
bundle exec jekyll serve
open http://localhost:4000/gh-pages-swagger-ui-experiment/api-docs/
```

## Architecture

The Swagger-UI (`api-docs/`) is a verbatim copy of the official Swagger-UI `dist/` release. The only customized file is `api-docs/swagger-initializer.js`, which configures three API definition sources:

1. `../swagger.json` — local file from the repo
2. `https://jonasbn.github.io/gh-pages-swagger-ui-experiment/swagger.json` — same file served via GitHub Pages
3. `https://petstore.swagger.io/v2/swagger.json` — the upstream Swagger Petstore

**When updating Swagger-UI**, copy the new `dist/` release over `api-docs/` and then reapply changes to `swagger-initializer.js` (it gets overwritten). A Perl comparison script is documented in README.md for identifying which files changed.

**Swagger-UI update procedure:**
(Also encoded as the `update-swagger-ui` skill — invoke that instead of following these steps manually.)
1. Download: `curl -L "https://api.github.com/repos/swagger-api/swagger-ui/tarball/vX.Y.Z" -o swagger-ui-X.Y.Z.tar.gz`
2. Extract and sync: `rsync -av swagger-api-swagger-ui-*/dist/ api-docs/` — use `rsync`, not `cp`, as `cp` is aliased with `-i` in this shell
3. Restore `swagger-initializer.js` (rsync overwrites it with upstream default)
4. Remove any files dropped by upstream with `git rm` — check `git status` after rsync to spot them (no need for the Perl `compare_directories.pl` script in README.md); e.g., `.map` files were dropped in v5.32.8
5. No version file is tracked in the repo — find the currently-installed version via `git log --oneline --all | grep -i swagger-ui` (prior update commits are titled "Update Swagger-UI to vX.Y.Z")

## CI

`.github/workflows/swagger-validator.yml` validates `swagger.json` on every push using the `mbowman100/swagger-validator-action`. GitHub Actions pins use commit SHAs per security best practice.

Dependabot monitors both GitHub Actions and Bundler dependencies weekly.

## Linting

Markdown linting is configured in `.markdownlint.json` (bare URLs and line-length rules are disabled).
