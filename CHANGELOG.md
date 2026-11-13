# Changelog

## 1.0.1 — 2026-11-13

- Accept optional Telegram usernames, @usernames and public profile links, with translated inline validation instead of regex errors.
- Keep photo editing working when contact methods or unrelated drafts are incomplete; exports remain strictly validated.
- Render newly processed local photos inside the script-disabled preview instead of a blocked/blank image.
- Remove fixed 15 MB / 50 MP source image restrictions and accept browser-decodable photo formats. Automatically compress new photos to at most 300 KB as WebP/JPEG.
- Explain browser format/memory limits, show before/after sizes and test a >15 MB BMP combined with an invalid Telegram field.

## 1.0.0 — 2026-11-13

- Independent, serverless multi-pet static profiles and local visual editor.
- Shared contacts, per-pet overrides, stable IDs, emergency warnings and missing/found status.
- English, Spanish and Catalan, themed responsive public pages and browser-local draft storage.
- Privacy-aware public ZIP import/export and strict schema/image validation.
- Local photo processing, bundled QR export and printable tag layouts.
- GitHub Pages Actions workflow, automated tests and open-source documentation.
