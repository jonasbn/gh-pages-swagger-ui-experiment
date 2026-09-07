---
name: update-swagger-ui
description: Use when updating the Swagger-UI version in api-docs/ — covers download, rsync, initializer restore, and cleanup of files dropped by upstream
---

# Update Swagger-UI

A reference/technique skill for syncing a new Swagger-UI `dist/` release into `api-docs/`.

## Steps

1. **Create a branch**
   ```bash
   git checkout -b update-swagger-ui-vX.Y.Z
   ```

2. **Download the release tarball**
   ```bash
   curl -L "https://api.github.com/repos/swagger-api/swagger-ui/tarball/vX.Y.Z" -o swagger-ui-X.Y.Z.tar.gz
   tar xzf swagger-ui-X.Y.Z.tar.gz
   ```
   The extracted directory is named `swagger-api-swagger-ui-<sha>/`.

3. **Sync dist/ into api-docs/**
   ```bash
   rsync -rv --safe-links --no-perms --no-owner --no-group --chmod=D755,F644 \
     swagger-api-swagger-ui-*/dist/ api-docs/
   ```
   Use `rsync`, not `cp` — `cp` is aliased with `-i` in this shell and will prompt interactively for every file.

   Why not `-av`: `-a` would copy the third-party tarball's permissions, ownership, and symlinks verbatim. The flags above instead normalize to static-site perms (dirs 755, files 644) and `--safe-links` discards any symlink that points outside `api-docs/`, so a tampered tarball can't smuggle one into the repo.

4. **Restore swagger-initializer.js**
   rsync overwrites it with the upstream default (single `url:`). Restore the custom multi-URL version from git or from memory — it must contain the `urls: [...]` array with three entries:
   - `../swagger.json` — local file from the repo
   - `https://jonasbn.github.io/gh-pages-swagger-ui-experiment/swagger.json` — GitHub Pages
   - `https://petstore.swagger.io/v2/swagger.json` — upstream Petstore

   Also ensure `layout: "StandaloneLayout"` is set (not the default `"BaseLayout"`).

5. **Remove files dropped by upstream**
   Check `git status` for tracked files that are now missing from the new dist. Use `git rm` — plain `rm` is also aliased with `-i`.
   ```bash
   git rm api-docs/<dropped-file>
   ```
   Example: `.map` files were dropped in v5.32.8.

6. **Commit and open a PR**
   ```bash
   git add api-docs/
   git commit -m "Update Swagger-UI to vX.Y.Z"
   git push -u origin update-swagger-ui-vX.Y.Z
   gh pr create ...
   ```

## Common Mistakes

| Mistake | Fix |
|---|---|
| Using `cp -r dist/ api-docs/` | Use the hardened `rsync` from step 3 instead |
| Using `rsync -av` | `-a` inherits the tarball's perms/owner/symlinks — use the flag set in step 3 |
| Forgetting to restore `swagger-initializer.js` | Always check it after rsync; upstream uses a single `url:` key |
| Missing dropped upstream files | Run `git status` — missing tracked files show as deleted but unstaged |
| Using `rm` to delete tracked files | Use `git rm` so git stages the deletion |
