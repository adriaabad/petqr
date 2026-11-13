# Changelog

## 1.1.2 — 2026-11-13

- Generate short eight-character pet IDs, checking collisions with existing IDs and short addresses. Duplicates receive their own address.
- Add optional stable `shortId` addresses for existing pets without changing their logical IDs. Both old and short routes serve the complete profile without a redirect, JavaScript requirement or external shortening service.
- Use the short address consistently in the dashboard, public index, QR exports and canonical metadata; keep old printed tags working.
- Preserve deployed short addresses when restoring an older local draft or importing an older backup of the same animal.

## 1.1.1 — 2026-11-13

- Revert optional direct GitHub publishing. Restore the local editor and manual ZIP upload workflow, without access keys.
- Remove the Advanced mode, optional-field builders and missing/found/custom status controls and badges.
- Add microchip and registration number inputs to the main identity form, preserving leading zeros and requiring explicit consent before publication.
- Show confirmed identification numbers directly on public profiles. Preserve existing owner data, photos and compatible legacy fields; old loss-status settings are no longer displayed.

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
