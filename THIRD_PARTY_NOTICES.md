# Third-party notices

PetQR's source is MIT licensed. Its dependency licenses remain applicable. `package-lock.json` pins the reproducible dependency tree; installed packages include their own license files.

Runtime libraries bundled into the editor:

- **node-qrcode** (`qrcode`), MIT — https://github.com/soldair/node-qrcode
- **fflate**, MIT — https://github.com/101arrowz/fflate
- **Zod**, MIT — https://github.com/colinhacks/zod
- Transitive QR dependencies retain their original license notices; see `node_modules/*/LICENSE*` after `npm ci`.

Build/test-only tools include TypeScript (Apache-2.0), Vite (MIT), tsx (MIT), Playwright (Apache-2.0), axe-core (MPL-2.0) and jsQR (Apache-2.0). They are not remotely loaded by a deployed profile. These source URLs are documentation, not runtime dependencies.

The current ten application photos were supplied by the repository owner as Pexels downloads and use the [Pexels License](https://www.pexels.com/license/). They are locally resized and re-encoded as WebP; image rights are separate from the MIT source-code license. The [source photo catalog](docs/PHOTO_CREDITS.md) records the supplied photographer identifiers and photo IDs. The live website and exported ZIP generate `PHOTO_CREDITS.txt` only from currently selected images and their individual attribution metadata. New uploads receive no automatic license or inherited author. Stock photos illustrate fictional profiles and do not verify real animal identities. Isolated test fixtures retain older assets only for regression testing and are not deployed.
