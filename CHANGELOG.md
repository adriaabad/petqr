# Changelog

## 1.1.5 — 2026-11-16

- Normalize four fictional profiles with invented responsible people, zero-filled telephone and identification numbers, reserved `.invalid` emails and fictional full addresses. Provide coherent introductions, authorized outings, health notes and handling text in English, Spanish and Catalan.
- Replace all published photos with the ten supplied Pexels images, compressed to WebP below 300 KiB each. Preserve their source/license metadata in ZIP exports and keep existing profile IDs and QR addresses unchanged.
- Fit complete portrait photos in dashboard cards and profile frames so faces and ears are not cropped.
- Display obvious placeholder telephone numbers and emails as plain text, without call, email, WhatsApp or location-sharing actions. Real contact methods retain their existing actions.

## 1.1.4 — 2026-11-14

- Add home address, authorized outdoor access and usual roaming area/instructions. Address and area publication require explicit consent; permitted outings appear directly on the public profile without restoring lost/found status.
- Attach optional author/source/license/modification metadata to each photo and preserve it in public JSON and ZIP round trips.
- Generate `PHOTO_CREDITS.txt` from only the photos referenced by the current configuration, both on export and build. Hide the credits link when a profile has no supplied attribution metadata.
- Keep new uploads free of inherited authorship or license claims. Replacing a photo removes its old credit from the current publication without changing anyone's legal rights.

## 1.1.3 — 2026-11-13

- Replace generated profile photos with locally hosted real public-domain/CC0 stock photos; give every current pet two photos and preserve the owner's uploaded turtle image.
- Publish source/author/license credits and show additional photos directly on the profile.
- Remove pet Appearance controls, custom colors/backgrounds/decorations and demonstration notices; use one standard appearance.
- Provide Allergies, Health conditions and Behavior and handling notes text areas for every pet, including new animals. Keep publication and medical consent checks, preserve legacy fields and export all new text together.
- Clear invented health/handling details and use invented contact names with NANPA-reserved nonworking 555-01xx numbers, at the owner's request.

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
