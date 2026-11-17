# Third-party notices

PetQR's source is MIT licensed. Its dependency licenses remain applicable. `package-lock.json` pins the reproducible dependency tree; installed packages include their own license files.

Runtime libraries bundled into the editor:

- **node-qrcode** (`qrcode`), MIT — https://github.com/soldair/node-qrcode
- **fflate**, MIT — https://github.com/101arrowz/fflate
- **Zod**, MIT — https://github.com/colinhacks/zod
- Transitive QR dependencies retain their original license notices; see `node_modules/*/LICENSE*` after `npm ci`.

Build/test-only tools include TypeScript (Apache-2.0), Vite (MIT), tsx (MIT), Playwright (Apache-2.0), axe-core (MPL-2.0) and jsQR (Apache-2.0). They are not remotely loaded by a deployed profile. These source URLs are documentation, not runtime dependencies.

The current ten application photos were supplied by the repository owner as Pexels downloads and use the [Pexels License](https://www.pexels.com/license/). Their optional credits have been removed at the owner’s request. See [photo usage](PHOTOS.md). These images retain their own license, separate from the MIT source-code license. Isolated regression fixtures are not deployed.
