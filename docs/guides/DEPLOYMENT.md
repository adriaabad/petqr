# Deployment and migration

## GitHub template

Maintainers: push this complete project to a new repository, then enable **Settings → General → Template repository**. This GitHub setting cannot be enabled by a file in a local checkout. Public profile addresses are independent; the optional template-creation button links to the upstream template. Do not upload `node_modules/`, `dist/`, test artifacts or browser drafts.

The upstream repository is already marked as a template. [Create a new copy directly](https://github.com/new?template_owner=adriaabad&template_name=petqr&name=petqr&visibility=public) after signing in. Help and Export include these steps in English, Spanish and Catalan, and each exported ZIP includes PUBLISHING.txt. Pages must be activated once in the new repository; automatic enablement would require additional GitHub credentials and is deliberately not requested.

Users: **Use this template → Create a new repository**, choose your account/name, then **Settings → Pages → Source → GitHub Actions**. Public repositories can use GitHub Pages on GitHub Free. Organization rules may require allowing the official checkout/setup-node/configure-pages/upload-pages-artifact/deploy-pages actions. Open Actions and manually run **Validate, test & deploy PetQR** after the initial Pages setup.

On the default branch, relevant source/data/image/configuration changes trigger deployment. Manual dispatch is supported; deployments require the repository's default branch. Pull requests run validation, build and tests without deploying. The workflow installs locked dependencies, validates publication and image references, builds, runs unit/build/browser/accessibility checks, uploads `dist/` and deploys using the official Pages environment. Only the deploy job receives `pages:write` and `id-token:write`; no personal token is needed.

The build takes the final URL from Pages metadata when site.publicUrl is empty. A manually entered publicUrl takes precedence. Verify this after a domain/repository rename. Project sites have a repository path; user sites named `USERNAME.github.io` generally use the root. No SPA rewrites are needed: `p/ID/index.html` is physically generated for every pet.

## Custom domain

Set up the domain/DNS/HTTPS in **Settings → Pages**, following GitHub's current domain instructions. Set publicUrl in the editor if you want an explicit domain. A non-`.github.io` public URL emits a `CNAME` containing the hostname. Use the correct root/subdirectory for your chosen host; a CNAME does not configure DNS. For a custom domain's first release, confirm it serves your copy before printing tags.

## Updating data

1. Open `/editor/` on your deployed copy; it initially loads the **deployed public configuration**.
2. Optionally restore a local draft or import an earlier public ZIP. Imports replace the current session; they do not merge.
3. Edit, preview and export. Unpublished fields and unconfirmed contacts are omitted.
4. Extract the ZIP. Replace all four JSON files in `data/`, and upload exported `assets/pets/` files at the matching repository paths. Do not upload the ZIP itself as configuration.
5. Commit on the default branch. Actions rebuilds from clean output and deploys. Refresh the public pet URL after the green result.

All pets are stored in one `data/pets.json`; removing an entry removes its generated route after the next deployment. Original unused photos are not automatically deleted from source/history. The generated site copies only referenced photos.

## Another static host

```sh
npm ci
npm run validate
npm run build
npm test
```

Upload every file/folder **inside `dist/`** to a static host supporting directory indexes. Keep asset names, `p/ID/` paths and relative layout intact. HTTPS is recommended and required for browser geolocation on normal public origins. There is no server code, database, runtime environment variable or secret to migrate.

To preserve already printed QR codes, keep the original URL serving the page or a permanent redirect. Changing the destination in a new QR image cannot change a code already engraved on a collar. If the old domain/account disappears, a static QR using it cannot be repaired remotely. Independence from PetQR's maintainer does not remove the need to maintain your own hosting address.

## Troubleshooting

- **No workflow / no deployment:** verify `.github/workflows/pages.yml` was uploaded, Actions is enabled, Pages source is GitHub Actions and the run targets the default branch. Initial setup may need a manual run.
- **403 / environment approval:** check repository/organization permissions and `github-pages` environment rules. PetQR does not bypass account policies.
- **Validation error:** paths such as `pets.0.name` identify the source. Load the editor and export public data. Never commit a private draft just to bypass validation.
- **Missing image:** upload the exact exported filename under assets/pets; paths are case-sensitive on Pages.
- **Edits not visible:** export/upload/commit/deploy first. The editor has no repository write authorization. A local draft is not a deployed profile.
- **QR points to wrong site:** verify publicUrl, including repository path. Test the final link and scan the physical output before distribution.
- **Direct route 404:** ensure `dist/p/ID/index.html` exists and the entire dist tree was deployed. Do not replace the project with only its root HTML.

See GitHub's [official custom workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) for hosting policy changes and current setup.
