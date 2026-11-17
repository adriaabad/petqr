# Privacy guide

PetQR publishes static pages. GitHub Pages is public hosting. A public Git repository also publishes source files and history. **No editor visibility control can conceal something you already upload or commit.**

## Three kinds of information

| Kind | Examples | Handling |
| --- | --- | --- |
| Usually appropriate to publish | Pet name, species, public-safe identifying markings, owner-written approach instructions | Core identity/photo fields are public. Select Publish for optional identification and existing additional fields. |
| Needs explicit consideration/consent | Contact details, complete home addresses/roaming areas, microchip/tattoo/registry numbers, health conditions and medication | Contacts require a publication confirmation. Address/area, medical and identification fields require publication plus sensitive consent. An address is visible to anyone scanning the QR, not just a trusted finder. Use the minimum necessary information. |
| Should not be uploaded | Confidential personal documents, access tokens, private medical records, unpublished drafts | Keep outside the repository, exports and history. This application is not a secure records vault. |

This classification is guidance, not a guarantee that every use is safe. A pet photo, general neighborhood or public contact can still identify a person. Avoid embedding confidential information in names, custom labels, photo alt text, translated values or public messages.

## What the software does

- The editor holds changes in browser memory until export or an explicit local save. Nothing automatically uploads to GitHub or a PetQR service.
- Save draft writes the configuration and processed images to this browser's IndexedDB. Anyone using the device/browser may access it. Restore/Forget are explicit actions. Browser clearing, quota failures or private browsing may prevent persistence.
- Public ZIP export creates a new filtered configuration, removing unselected fields, unconfirmed sensitive fields, unpublished contacts and private contact overrides. It includes only referenced local images. The current draft is not replaced by this filtered version.
- The build rejects configuration carrying unpublished/unconfirmed values. Strict schemas reject unknown properties instead of silently allowing hidden data. This is an error detector, not protection for a file already committed.
- New photo uploads are drawn to a canvas, cropped/rotated and re-encoded as WebP (JPEG fallback), without copying original EXIF/GPS metadata, and compressed to at most 300 KB. Source decoding is local and depends on the browser/device. The visible image can still reveal a location. Files imported from an existing ZIP are already-public assets and are not automatically re-encoded again.
- Individual profiles default to noindex/nofollow; only deliberately indexed profiles appear in the sitemap. These are crawler hints, not access control.
- Optional photo author/source/license metadata is public with the photo and survives ZIP export/import. Only current selected photos enter the generated credits file. Removing EXIF or replacing an image does not transfer or erase copyright; confirm permission for each uploaded photo.
- Disabling the owner index removes the public listing. Published pet/contact data remains in editor configuration and direct routes. Obscurity is not privacy.
- No analytics, ads, trackers, remote fonts, remotely loaded scripts, mandatory APIs or image CDNs are included.

The finder may **choose** to call, open WhatsApp/email/Telegram or share location. Those services have their own privacy practices. Location is requested only after explicit interaction; coordinates are used to prepare an OpenStreetMap link in a WhatsApp draft. PetQR neither stores nor transmits the coordinates to its own server, and the finder manually sends the message. Permission denial leaves normal contact actions available.

## After accidental publication

Remove the information from the current data/photos, export and redeploy. Review public repository history, forks, caches, previews and prior downloads. Seek the host's guidance for sensitive-data/history removal. Consider replacing exposed contact methods/identifiers where appropriate. PetQR cannot recall copies or promise erasure from other people's devices.

Back up public ZIPs as public data. Treat any local browser draft containing private values as sensitive. Protect the device and avoid saving sensitive drafts in a shared browser.
