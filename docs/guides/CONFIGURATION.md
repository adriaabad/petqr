# Configuration reference

The browser editor manages JSON for you. Files in `data/` contain **publishable data only**. All files are UTF-8. The build rejects invalid/unknown keys, duplicate IDs, invalid links, unpublished fields, unconfirmed sensitive data and missing/oversized image references. Errors identify the affected property path.

## Files and versions

`version.json` is the number `1`. Unsupported versions fail instead of silently dropping data. A complete JSON import uses `{ "version": 1, "site": {...}, "contacts": [...], "pets": [...] }`; ZIP import/export separates these into four files. Unknown keys are rejected. Future migrations must explicitly convert supported earlier versions and preserve custom data.

### site.json

| Property | Default | Meaning |
| --- | --- | --- |
| title | PetQR | Public index title |
| defaultLanguage | en | `en`, `es` or `ca`; also the fallback for translated fields |
| publicUrl | empty | Exact final HTTP(S) site root, including a project path; no query, fragment or credentials |
| ownerIndex | true | Whether the public overview lists pets; does not make profiles/config confidential |
| attribution | true | Show the project attribution footer |
| sourceUrl | empty | Optional source repository link, controlled by each owner |
| fictional | false | Legacy compatibility only; demonstration notices and their editor control have been removed |

An explicit publicUrl wins over `PAGES_BASE_URL`, which the workflow obtains from `actions/configure-pages`. All assets use relative paths regardless of this URL. The final URL is required for QR codes; local/unknown destinations are rejected.

### contacts.json

An ordered array of reusable contacts. Required: `id`, `name`. Optional: `relationship`, `phone`, `whatsapp`, `email`, `telegram`, `availability`. Other properties: `preferred` (`phone`, `whatsapp`, `email`, `telegram`; default phone), `language` (default en), `publish` and `consent` (both default false). Public data requires both true. Each `id` is unique; phone links normalize punctuation and messages/email are URI encoded.

Contact language is useful availability information; PetQR does not automatically translate messages. Telegram is optional: a username, @username or public t.me/telegram.me profile link is accepted and normalized. Phone numbers, group invites and unrelated URLs are not Telegram usernames. Invalid values get a clear translated message. Telephone numbers may contain an initial plus, digits, spaces, parentheses and hyphens. Owners should include country codes, particularly for WhatsApp.

### pets.json

An ordered array. Each pet has:

| Property | Meaning |
| --- | --- |
| id | Stable unique 3–64 character lowercase alphanumeric/hyphen identifier. Never change after printing. New pets use eight random hexadecimal characters, checked against existing IDs and short routes. |
| shortId | Optional stable short address, 3–12 lowercase alphanumeric/hyphen characters. The canonical path and QR use `p/shortId/`; `p/id/` also remains functional. All IDs and short routes must be unique across pets. Never change/remove a published shortId after printing tags. |
| name | Required public name, 1–100 characters |
| species, breed, introduction | Plain or translated text; species may be empty for a newly created draft |
| status | Legacy compatibility: `safe`, `missing`, `found`, `custom`; no longer displayed or editable |
| statusLabel | Legacy compatibility only; no longer displayed |
| emergency | Legacy loss instructions; retained in data but no longer displayed |
| photos | Up to 30 `{path, alt, credit?}` objects. First is featured. Path must be a flat filename under `assets/pets/`, ending in .webp/.png/.jpg/.jpeg. No external image URLs, SVG or traversal. Optional credit has `author`, `source`, `license`, `licenseUrl`, `changes` strings. Source/license URLs accept HTTP(S) or empty values. No license is inferred for uploads. |
| contacts | Ordered `{id, overrides?}` assignments. Order determines priority. Overrides can replace a name, relationship, method, phone, WhatsApp, email, Telegram, language, availability or publication flags. Unset values inherit; empty strings clear an optional method. |
| sections | Custom or built-in `{id, title, fields}` sections |
| theme | Legacy compatibility only. The renderer uses a fixed standard appearance and the editor no longer offers per-pet colors, backgrounds or decorations. |
| indexing | false by default; enables index/follow metadata and sitemap inclusion only when canonical URL is known |

Basic identity, introduction and photos are inherently public. Microchip and registration numbers are stored as fields in the `identification` section, with keys `microchip` and `registration`; legacy `registry` is also supported. These are text values, not numeric values. Both require Publish and consent before export/display. All contacts need confirmation before use. Override publication is evaluated against the confirmed shared contact; private override values are removed from exports rather than hidden in the UI.

## Extensible sections and fields

The `location` section supports `homeAddress`, `outdoorAccess` and `roamingArea`. Address/area values require Publish plus consent even when an imported field claims `sensitive:false`. Outdoor access is optional translated text; the editor offers Stays at home / May go out independently / Only goes out accompanied, with Not specified as the empty default. Publish is still opt-in. These selected fields render directly on the profile and are omitted from repeated expanded details.

`PHOTO_CREDITS.txt` is generated from selected `photos[].credit` metadata, not copied from the documentation's original asset catalog. It is included in exports only when selected photos contain credit metadata; the build follows the same rule. Removing a photo removes its current attribution entry; missing metadata never means a public-domain dedication.

Existing category IDs: identity, identification, medical, behavior, care, location, emergency. Legacy `emergency` sections are preserved but no longer displayed. `src/shared/fields.ts` retains compatible category labels and keys. The simplified editor edits existing fields without an Advanced builder. Custom sections and fields can still be configured in source using the same schema and rendering path:

```json
{
  "id": "care",
  "title": { "en": "Everyday care", "es": "Cuidados diarios", "ca": "Cures diàries" },
  "fields": [{
    "key": "environment",
    "label": { "en": "Environment", "es": "Entorno", "ca": "Entorn" },
    "value": "Owner-written instructions",
    "kind": "text",
    "publish": true,
    "sensitive": false,
    "consent": false
  }]
}
```

`kind`: text, warning (visible outside expanded details), or link (HTTP(S) only). Fields default to unpublished. `sensitive:true` requires `consent:true` **and** `publish:true`. Medical section fields and keys identifying microchips/tattoos/registries require consent regardless of a user-supplied sensitive flag. The editor confirms before enabling publication. Empty private sections are excluded from exports.

Translated values are strings or objects with optional en/es/ca entries. Fallback: current language → configured default → en → es → ca → empty. Avoid confidential content in every language, not just the one currently shown.

Use custom fields for species-specific data without changing TypeScript. If you add a new first-class property, update schemas, editor, filtering, rendering, tests and documentation together. Never use a new property to carry unpublished data into public sources.
