# PetQR

A little tag. A way home.

PetQR gives every pet a permanent identification page and a printable QR code. Manage dogs, cats, rabbits, birds or any other companions in one independent repository. Your copy includes the entire application: no PetQR account, server, database, API key, subscription or central domain.

**English · [Español](docs/QUICKSTART.es.md) · [Català](docs/QUICKSTART.ca.md)**

![PetQR local dashboard with three fictional pets](docs/screenshots/dashboard.png)

[See a mobile emergency profile in Catalan](docs/screenshots/mobile.png).

## Start on GitHub — no coding needed

1. The maintainer first enables **Settings → General → Template repository** for this repository. As a user, click **Use this template → Create a new repository**. Choose **your own account**, any repository name, and **Public** for free GitHub Pages hosting. If the source is not yet marked as a template, download it and upload these files, including `.github/workflows/pages.yml`, to a new repository.
2. In **your new repository**, open **Settings → Pages → Build and deployment → Source**, and select **GitHub Actions**. Enable Actions if your organization restricts them.
3. Open **Actions → Validate, test & deploy PetQR → Run workflow** on your default branch. The first run publishes clearly labeled fictional examples. Wait for the green deployment, then follow its Pages URL. No personal access token or extra secret is needed.
4. Visit `<your Pages URL>/editor/`. In **Site settings**, verify the public site URL, including the repository path. The workflow fills it from your repository's Pages metadata; an explicit custom URL overrides it.
5. Replace the example pets using **Edit**, or delete them and **Add pet**. Add your contacts in **Contacts**, confirm publication, and assign them to each pet. Set the preferred order for emergency contacts. Turn off **Demo data notice** after replacing all fictional data.
6. **Preview profile**, then **Export files → Confirm publication · ZIP**. Extract the download. Replace the repository's **entire `data/` folder** with the exported `data/`, and upload/merge the exported photos into `assets/pets/`. Keep the existing application source and workflow. GitHub's **Add file → Upload files** supports uploading a folder's contents. Confirm that the exported files have the exact paths below, rather than an extra ZIP folder prefix. Commit the changes to your default branch.
7. Wait for Actions to finish. Open each pet's **View profile** and confirm the contacts, photo and warnings on your phone. Local editor changes do not update your website until this upload/deployment step.
8. In the editor, open **QR code** for each pet. Download SVG for printing/engraving or PNG for other tools. **Test destination** opens the final deployed URL; also scan the exported/printed QR with more than one phone. Keep the URL and stable pet ID unchanged after printing.

The project works with `https://USERNAME.github.io/REPOSITORY/`, `https://USERNAME.github.io/` and custom domains. Those are URL patterns, not dependencies on a particular account. A copy continues to work if its original repository disappears.

## What is included

- Any number of profiles, each built to a real `p/PET_ID/index.html`, with emergency contacts available even without JavaScript.
- A local visual dashboard: add, edit, duplicate, reorder and delete; shared contacts and pet-specific overrides.
- One simple pet form with microchip and registration numbers, multilingual free text, explicit sensitive-field publication and filtered ZIP export/import. Existing extra details remain editable without an Advanced mode.
- Local photo crop, rotation, pan, compression to at most 300 KB, WebP/JPEG conversion, alt text, featured photo and ordering. No remote image service.
- Bundled QR generator: SVG/PNG, resolution, colors with enforced contrast, error correction, quiet zone, labels, destination check, millimeter tag designer and print layout.
- English, Spanish and Catalan; browser preference, manual selection, fallback language; system/light/dark modes, keyboard focus, reduced motion and responsive layouts.
- Optional finder location sharing: explicit permission, a WhatsApp draft, and a separate manual send. No PetQR server receives location.
- Strict TypeScript and runtime schema validation, automated unit/build/browser/accessibility tests, MIT license and GitHub Pages deployment.

## Public means public

**Only put information you intend to publish in this repository.** Every committed source file, photo, JSON file and generated asset can be read. Health records, contact details and identification numbers may be sensitive. An unpublished editor field stays in the current browser session and is excluded from the public ZIP; saving a local draft is optional and uses this browser's local storage database. Anyone with access to the browser/device may access that draft.

The build **rejects** unpublished/unconfirmed configuration in the repository; it does not turn a public repository into a private vault. Medical fields and identification numbers require explicit publication consent. Uploaded photographs are re-encoded locally to remove the original EXIF metadata. Never upload original personal documents, precise home addresses, secrets or local draft files.

Disabling the owner index removes the overview links, but the public editor configuration still contains all **published** profiles. `noindex`, `robots.txt` and hard-to-guess URLs are not privacy controls. Deleting data from a later deployment does not remove Git history, caches or other people's copies. See the [privacy guide](docs/PRIVACY.md).

## Everyday tasks

**Add several pets:** Add pet creates a random, stable eight-character ID, keeping URLs and QR payloads short. The editor checks existing IDs and short addresses to avoid collisions. Duplicate copies information but creates its own new short ID/QR. The dashboard order is saved in `data/pets.json`.

**Short URLs for existing pets:** An optional stable `shortId` in the pet configuration gives an older long-ID profile a shorter address, such as `p/a1b2c3d4/`. The original logical ID stays unchanged. Both URLs serve complete static profiles, including without JavaScript; QR downloads, profile links and canonical metadata use the short one. No third-party URL shortener is involved. Keep both `id` and any published `shortId` unchanged after printing tags. Restoring older local drafts or importing backups preserves the deployed short address of the same animal.

**Identification numbers:** Edit → Identity → Microchip number / Registration number. These optional text inputs preserve leading zeros. Select the corresponding Publish checkbox and confirm before including either number on the public profile. Unpublished numbers stay in the browser and are excluded from exports.

**Existing details:** Previously configured additional fields remain editable in their existing sections. Medical/identification publication asks for consent. Use Edit translation to enter translated free text without changing the interface language. The Advanced mode, new custom-field builders and lost/found status are no longer shown. Legacy configuration stays compatible without deleting existing data.

**Photos:** Edit → Photos → Add photo. Crop, pan/zoom and rotate before Use photo. Add alt text; choose Make featured or reorder. Upload the exported image files along with the configuration. Photo removal updates the public page; manually remove unused photos from the repository if desired, remembering history can retain them.

Photos are automatically converted to WebP (JPEG fallback), at most 1200 px / 300 KB. There is no fixed source-file size limit: input decoding depends on the browser/device. Common JPEG, PNG, WebP, GIF, AVIF and BMP files are supported by current browsers; HEIC/HEIF requires native browser support. Animated images become a still photo. Unsupported formats require conversion or another browser. The original photo never leaves the device.

**Telegram is optional:** under More contact methods, enter `username`, `@username` or a public `https://t.me/username` link, or leave blank. PetQR does not require a Telegram account, bot or API. Incomplete contact methods show a preview warning without blocking photo editing; correct them before exporting.

**Design:** Edit → Appearance. Accent colors are decorative so they cannot reduce contact/warning contrast. Choose a background and icon. Site settings controls the public index and attribution. Each profile's indexing starts disabled.

**Keep a draft:** Site settings → Save draft on this device. It is never automatically uploaded. Restore or forget it explicitly. Clearing browser data may erase it. Public ZIPs are portable backups of **published** information only.

## Local development

Install Node.js **22.12+** (24 LTS used in CI), then:

```sh
npm ci
npm run dev
```

Open the printed local URL, then `/editor/`. After changing source/configuration files, rebuild/restart the dev command. Browser editor changes have their own live preview. Public QR creation intentionally refuses localhost URLs.

```sh
npm run validate
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run preview
```

Build before running tests that inspect generated routes. Static checks adapt to your real configuration; browser tests separately build fictional fixtures in `.test-site/` and never overwrite your production `dist/`. You can delete every demo pet without breaking deployment tests. Browser tests use Chrome on Windows and Playwright Chromium elsewhere. Set `PETQR_BROWSER=msedge` (or an installed Playwright channel) to override, or `PETQR_BROWSER=chromium` to use downloaded Chromium. The test server covers real requests under `/test-repo/` as well as the root. Screenshots/test artifacts go to the operating system's temporary folder unless `PETQR_SCREENSHOT_DIR` is set.

## Files you upload from the editor

```text
data/
  version.json      # schema version, currently 1
  site.json         # title, language, final URL, index and attribution
  contacts.json     # confirmed public shared contacts
  pets.json         # ordered profiles and selected public fields
assets/pets/
  <photo>.webp      # or locally hosted PNG/JPEG
```

Replacing `data/pets.json` removes deleted pets on the next clean build; there are no per-pet source files to delete. **Deleting a profile invalidates existing physical tags.** Never reuse another animal's old ID. Stable QR destinations depend on keeping the domain, repository path and pet ID. Renaming a repository/domain requires preserving redirects on the old host or replacing tags.

## Deployment and portability

The workflow validates files and images, builds every HTML route, runs unit/browser/accessibility checks and deploys `dist/` with official Pages actions. Deploy permissions are restricted to the deployment job. PRs are checked without deploying. Any default branch name works. GitHub Pages itself is an external hosting dependency; its policies, availability and domain are outside PetQR's control.

To migrate, `npm ci && npm run build`, then upload **all contents of `dist/`** to any static web host with directory index support. Configure `data/site.json.publicUrl` before building if your final address changes. No runtime CDN, fonts, scripts, remote configuration or mandatory third-party requests are used. Optional contact/map links are opened only through finder interaction. See the [deployment guide](docs/DEPLOYMENT.md).

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Configuration reference](docs/CONFIGURATION.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Privacy guide](docs/PRIVACY.md)
- [Architecture and development](docs/DEVELOPMENT.md)
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [MIT license](LICENSE)

## Limits and release checks

This release is browser-only: no automatic GitHub writes, accounts, sync, tracking, analytics or veterinary diagnosis. Keep direct repository uploads under GitHub's current limits. A ZIP import is limited to 60 MB compressed / 120 MB extracted, and photographs to 30 per pet. New photos are reduced to at most 300 KB. Source decoding depends on browser codecs and device memory; the app has no arbitrary 15 MB upload limit. Local drafts depend on browser quotas. No technical fixed maximum number of pets is imposed, but very large collections depend on device memory and hosting limits.

Tag SVGs use ordinary text so vector editors can edit them; convert text to paths in your engraving application if needed. Printers, materials and scanners vary: always physically test before engraving. Automated accessibility checks are included, but human assistive-technology testing remains necessary. Deployment is provided as a workflow; a live GitHub run requires your own repository and Pages settings. There is deliberately no hardcoded upstream repository URL: set the optional source URL in your own installation.

Fictional examples use reserved example emails and fictional North American 555-01xx numbers; **do not contact them**. Demo photographs were AI generated and are included for replacement. The code and documentation are licensed under MIT; see [third-party notices](THIRD_PARTY_NOTICES.md) for bundled dependencies.
