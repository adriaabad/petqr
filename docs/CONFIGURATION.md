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
| fictional | false | Show the fictional example warning |

An explicit publicUrl wins over `PAGES_BASE_URL`, which the workflow obtains from `actions/configure-pages`. All assets use relative paths regardless of this URL. The final URL is required for QR codes; local/unknown destinations are rejected.

### contacts.json

An ordered array of reusable contacts. Required: `id`, `name`. Optional: `relationship`, `phone`, `whatsapp`, `email`, `telegram`, `availability`. Other properties: `preferred` (`phone`, `whatsapp`, `email`, `telegram`; default phone), `language` (default en), `publish` and `consent` (both default false). Public data requires both true. Each `id` is unique; phone links normalize punctuation and messages/email are URI encoded.

Contact language is useful availability information; PetQR does not automatically translate messages. Telegram usernames use Telegram's conventional character/length rules. Telephone numbers may contain an initial plus, digits, spaces, parentheses and hyphens. Owners should include country codes, particularly for WhatsApp.

### pets.json

An ordered array. Each pet has:

| Property | Meaning |
| --- | --- |
| id | Stable unique 3–64 character lowercase alphanumeric/hyphen identifier. Never change after printing. The editor generates random UUID-based IDs. |
| name | Required public name, 1–100 characters |
| species, breed, introduction | Plain or translated text; species may be empty for a newly created draft |
| status | `safe`, `missing`, `found`, `custom`; defaults safe |
| statusLabel | Optional custom status text |
| emergency | Always-visible owner-written urgent instructions |
| photos | Up to 30 `{path, alt}` objects. First is featured. Path must be a flat filename under `assets/pets/`, ending in .webp/.png/.jpg/.jpeg. No external image URLs, SVG or traversal. |
| contacts | Ordered `{id, overrides?}` assignments. Order determines priority. Overrides can replace a name, relationship, method, phone, WhatsApp, email, Telegram, language, availability or publication flags. Unset values inherit; empty strings clear an optional method. |
| sections | Custom or built-in `{id, title, fields}` sections |
| theme | `{accent: "#27634b", background: "sage", icon: "paw"}`; background sage/sand/sky, icon paw/heart/none |
| indexing | false by default; enables index/follow metadata and sitemap inclusion only when canonical URL is known |

Basic identity, introduction, photos, status and urgent message are inherently public. Advanced fields have explicit Publish controls. All contacts need confirmation before use. Override publication is evaluated against the confirmed shared contact; private override values are removed from exports rather than hidden in the UI.

## Extensible sections and fields

Built-in category IDs: identity, identification, medical, behavior, care, location, emergency. `src/fields.ts` lists their field suggestions with three-language labels. Custom sections and fields use the same schema and rendering path:

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
