# Third-party notices

PetQR's source is MIT licensed. Its dependency licenses remain applicable. `package-lock.json` pins the reproducible dependency tree; installed packages include their own license files.

Runtime libraries bundled into the editor:

- **node-qrcode** (`qrcode`), MIT — https://github.com/soldair/node-qrcode
- **fflate**, MIT — https://github.com/101arrowz/fflate
- **Zod**, MIT — https://github.com/colinhacks/zod
- Transitive QR dependencies retain their original license notices; see `node_modules/*/LICENSE*` after `npm ci`.

Build/test-only tools include TypeScript (Apache-2.0), Vite (MIT), tsx (MIT), Playwright (Apache-2.0), axe-core (MPL-2.0) and jsQR (Apache-2.0). They are not remotely loaded by a deployed profile. These source URLs are documentation, not runtime dependencies.

The three fictional demo photographs were generated for this project. They do not represent verified animal identities. Replace them with photographs you have permission to publish.
