# User guide

## Manage pets

Open `/editor/` on your deployed website. **My pets** lists all profiles in the current local session. Add pet generates a new ID. Edit opens basic information, contacts, emergency status, photos and appearance. Duplicate creates a new ID and copies the public/draft information; review the copy before publishing. Move up/down changes the dashboard/index order. Delete requires confirmation because its physical QR tags stop working after the next deployment.

Basic identity, introduction, photos, emergency message and appearance are public information. Advanced fields are opt-in. The **Basic** editor keeps existing details accessible; **Advanced** adds suggested optional fields and custom sections. Collapse categories you do not need. Every animal uses the same extensible fields, so bird/reptile/environmental instructions do not require a special account or code change.

## Languages

The Language control changes the interface. It starts with a saved preference, then a supported browser language, then the site's default. English, Spanish and Catalan are bundled locally. **Edit translation** in the pet editor selects which free-text translation you enter. A plain text value acts as a fallback; translated values fall back to the site's default and another available translation. A finder sees the best available version without an external translation service. Contact preferred language is informational.

## Contacts

Add a contact in Contacts. Enter only methods you want public, choose a preference, and confirm Publish contact. Assign it from a pet's Contacts section. Shared values are maintained once. Use **Override for this pet** for pet-specific name/method details; **Use shared details** removes overrides. Order assigned contacts by emergency priority. Blank override methods clear those actions for that animal. The public page offers available methods directly, with the preferred one first.

Contact buttons open the relevant application. WhatsApp/email are not sent automatically. Copy contact copies only public details. Local clipboard/geolocation availability depends on the browser and secure origin; a location-permission failure does not remove call/email options.

Telegram is optional, under **More contact methods (optional)**. It is not involved in photo handling, storage or application authentication. Enter `username`, `@username` or a public `https://t.me/username` link, or leave blank. The export normalizes the username. Invalid values get an inline explanation; the preview omits the invalid method and shows a warning without blocking photo editing. Export still requires valid public data.

## Warnings and missing pets

Set safe/missing/found/custom under Emergency message. A missing pet receives a prominent emergency banner. The always-visible message should be concise and actionable. In Advanced, select a field's **Warning** type to show urgent handling/medical information outside Full details. PetQR shows owner-written information; it does not diagnose or generate veterinary advice.

Changing status, name, age, photos or instructions never changes the ID/URL. Always export/upload/deploy to update the page behind the printed QR. The local preview intentionally shows only publishable data, so a draft medical field will not appear until you select Publish and confirm.

## Photos

Add photo opens a local crop canvas. Use zoom and horizontal/vertical position sliders, Rotate, then Use photo. Processing stays on the device and strips original metadata during re-encoding. The picker accepts browser-decodable photos: common JPEG, PNG, WebP, GIF, AVIF and BMP, plus HEIC/HEIF when natively supported. MIME-less camera exports can also be selected. SVG and documents are rejected. Animated images use the first frame.

There is no fixed input MB or megapixel limit in the app. The browser must still decode the original; very large images may exceed device memory, and compression cannot supply an unavailable decoder. Errors suggest another browser or JPEG/PNG conversion. Large decoded photos are downscaled for smooth editing. The crop starts at 1200×900, then quality and, if needed, dimensions are reduced until the WebP (JPEG fallback) output is at most 300 KB. A notification shows original and resulting sizes.

Add descriptive alt text. The first image is featured; Make featured, Move up/down and Remove manage the gallery. There are at most 30 images per pet. Small photos may be enlarged; choose a clear source.

## QR and tags

Configure the final public site URL first, including any repository path. The workflow's automatic URL is loaded into the editor on a deployed build. QR code opens a real local generator. Choose error correction (M default), a 4–12-module quiet zone, high-contrast colors, resolution and optional name label. Low-contrast/inverted colors are rejected. SVG is resolution independent; PNG is rasterized at the selected width.

The tag designer provides circle, rectangle, rounded rectangle and square shapes. Set dimensions (41–120 mm), optional phone and short text. Circles/squares use equal sides. The QR uses at least 25 mm with a white quiet zone. Tags deliberately keep the QR black on white. SVG is suitable for vector editing; engravers may need text converted to paths in their own tool. Use Download tag PNG or Print for other workflows. Check the print dialog's actual-size/100% scaling setting.

Use a flat, durable, high-contrast surface. Preserve at least four clear modules around the QR. Larger/longer URLs may need larger tags. Avoid holes, decorations, scratches or curved edges inside the quiet zone. Test the actual printed or engraved result with multiple phones under ordinary lighting. Opening Test destination checks a URL but does not prove a physical engraving can be scanned.

## Import, export and local drafts

Export files shows a public-data warning, then downloads a ZIP. It contains four JSON files under data/ and referenced images under assets/pets/. Replace the repository's data/ and upload/merge the photos, commit to the default branch and wait for deployment. Files do not upload themselves.

Import files accepts the complete public ZIP or one complete configuration JSON. It replaces your draft after confirmation. Individual site/contacts/pets JSON fragments must be combined into the complete version/site/contacts/pets shape, or loaded together as a ZIP. No source JSON editing is necessary for routine use.

Save draft on this device explicitly saves the full draft/images in this browser. Restore it when returning; Forget deletes it. This is local storage, not authentication or cross-device synchronization. Reset examples restores the currently **deployed configuration**, which contains fictional examples only until you replace them. Leaving an unsaved session warns before discarding edits. A public ZIP intentionally cannot recover unpublished fields.
