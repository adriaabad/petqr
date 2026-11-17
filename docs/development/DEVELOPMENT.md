# Development and architecture

## Data flow

```text
data/{version,site,contacts,pets}.json + referenced assets/pets/*
  → strict schema + publication + image validation
  → Vite bundles local TypeScript enhancement/editor modules
  → static HTML rendering for index, editor and p/STABLE_ID/index.html
  → dist/ + narrowly scoped per-profile JSON + published editor configuration
  → any static host
```

Public HTML contains usable contact links and warnings before scripts load. JavaScript enhances language/theme controls, copy contact and optional location sharing. Failure to fetch enhancement JSON leaves the initial HTML usable. Each static profile loads only its own published JSON/contacts. The editor's published config includes all public pets so it can manage the collection; it is not a private endpoint.

## Modules

- `src/shared/model.ts`: Zod schemas, strong inferred types, public filtering, publication checks, errors and new IDs.
- `src/shared/core.ts`: dependency-free text/URL/contact helpers for public pages. The profile does not load Zod/QR/editor code.
- `src/shared/fields.ts`: translated category labels and extensible field suggestions.
- `src/shared/i18n.ts`: local UI phrases and language preference resolution.
- `src/public/render.ts`: escaped semantic HTML rendering and SEO metadata.
- `src/public/public.ts` / `src/shared/preferences.ts`: small progressive enhancements.
- `src/editor/editor.ts`: dashboard/forms, draft state, contact assignments, previews and user actions.
- `src/editor/images.ts`: canvas crop/pan/rotate/re-encode workflow; no original metadata copied.
- `src/shared/preview.ts`: scoped public previews that warn about incomplete optional contact methods without mutating the draft or relaxing export validation.
- `src/editor/archive.ts`: whitelist-based ZIP import and filtered export; bounded extraction sizes.
- `src/editor/draft.ts`: opt-in IndexedDB draft persistence, including processed images.
- `src/editor/qr.ts`: bundled QR encoder, contrast validation, SVG composition and tag layout.
- `scripts/config.ts`, `validate.ts`, `build.ts`: configuration loading, image existence limits, clean build and route/SEO generation.

The build runs programmatic Vite with independent TS entry points. The Vite CLI is only a local static preview. Source/config changes require a new build; browser editor changes immediately update the local preview. Assets resolve relative to each entry's emitted URL and continue working beneath arbitrary repository paths. New builds clean dist so removed pet pages disappear.

## Design system

Off-white `#f6f7f4`, forest text `#153c33`, green action `#246049`, white surfaces and subtle green-gray borders. System fonts avoid external requests. Layout uses a sidebar dashboard, photo-first cards, collapsible forms and a readable profile; on phones the sidebar becomes top navigation and profiles become a single column. Profile accents/backgrounds/icons are decorative; emergency/contact contrast stays fixed. Focus indicators, 44px controls, reduced motion, semantic headings/labels, native details/dialog and system/manual themes are supported. Runtime strings and owner-provided data are escaped before HTML interpolation.

## Tests

Run `npm run build && npm test`. Unit tests cover validation, uniqueness/references, immutable destinations, translated fallbacks, sensitive filtering/overrides, safe links, malformed files, QR constraints, tag composition and ZIP round trips. Static tests inspect actual emitted HTML, relative referenced assets, noindex/sitemap defaults, per-profile JSON scope and public bundle size.

Install Playwright Chromium, then `npm run test:e2e`. This builds immutable fictional fixtures from `tests/fixtures/` into a separate `.test-site/` directory. It never replaces the owner's production `dist/`. The strict test HTTP server exposes these fixtures under both root and `/test-repo/`, covering management, preview/export, mobile/languages, no-JS emergency access, consent, QR downloads, image processing, overflow/themes and axe WCAG AA checks. Static tests inspect the actual owner's `dist/` dynamically, so changing/deleting every demo pet does not break deployment. Chrome is the Windows default channel; CI uses downloaded Chromium. Browser tests are included in Pages CI. Real phones, screen readers, printing and a live Pages deployment remain separate release checks.

## Add a language

Add its code to the supported language lists/types and localized schema, add translations in i18n.ts, field labels/category names and language selectors, update text fallback and tests, then build/test. Owner free-text translations use the same language keys. Keep all dictionaries local. No runtime translation API is permitted.

## Add species-specific fields

Prefer the existing sections/fields schema; no schema change is needed. The editor has one simple mode and no optional-field builder. Microchip and registration inputs reuse consent-filtered identification fields. Existing custom data remains editable; legacy loss settings are accepted but not rendered. New medical or identifier data must participate in consent filtering; test it with a sentinel that is absent from public exports/output before publication. Never place private values into new top-level public properties.

## Security and maintenance

Keep the lockfile and dependency licenses. Dependencies are build-time or locally bundled, not runtime CDN URLs. No `eval`, remote script, raw owner HTML or repository-write token is used. Image filenames disallow path traversal and active SVG. Imported archives only accept expected configuration files and safe image paths, with extraction limits. Preview iframes are sandboxed without scripts. Any new import feature must keep these boundaries.

Preview frames allow same-origin image access so newly processed local Blob photos render; `allow-scripts` stays absent, owner text is escaped and no scripts are inserted into preview documents. Never enable both same-origin and scripts for these frames.

Future ideas, not implemented: authorized GitHub writes, cross-device draft synchronization, additional languages and a physical tag scanning lab. They are deliberately unnecessary for the current static workflow.
