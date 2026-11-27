# User guide

## Manage pets

Open `/editor/` on your deployed website. **My pets** lists all profiles in the current local session. Add pet generates a new ID. Edit opens identity, identification numbers, contacts, photos, health and handling notes. Every pet uses the same standard appearance. Duplicate creates a new ID and copies the public/draft information; review the copy before publishing. Move up/down changes the dashboard/index order. Delete requires confirmation because its physical QR tags stop working after the next deployment.

Basic identity, introduction and photos are public information. There is one editor mode. Microchip and registration numbers are available directly in Identity; each has an explicit publication checkbox and consent confirmation. Leave them unpublished to keep them in the local draft. Health & emergency always offers Allergies and Health conditions text areas; Behavior & handling always offers a free-text notes box. There are no preset handling instructions. Medical fields require publication consent. Existing additional fields remain editable in their sections, but there are no Advanced/custom-field builders.

## Languages

The Language control changes the interface. It starts with a saved preference, then a supported browser language, then the site's default. English, Spanish and Catalan are bundled locally. **Edit translation** in the pet editor selects which free-text translation you enter. A plain text value acts as a fallback; translated values fall back to the site's default and another available translation. A finder sees the best available version without an external translation service. Contact preferred language is informational.

## Contacts

Add a contact in Contacts. Enter only methods you want public, choose a preference, and confirm Publish contact. Assign it from a pet's Contacts section. Shared values are maintained once. Use **Override for this pet** for pet-specific name/method details; **Use shared details** removes overrides. Order assigned contacts by emergency priority. Blank override methods clear those actions for that animal. The public page offers available methods directly, with the preferred one first.

Contact buttons open the relevant application. WhatsApp/email are not sent automatically. Copy contact copies only public details. Local clipboard/geolocation availability depends on the browser and secure origin; a location-permission failure does not remove call/email options.

Telegram is optional, under **More contact methods (optional)**. It is not involved in photo handling, storage or application authentication. Enter `username`, `@username` or a public `https://t.me/username` link, or leave blank. The export normalizes the username. Invalid values get an inline explanation; the preview omits the invalid method and shows a warning without blocking photo editing. Export still requires valid public data.

## Identification and existing warnings

New pets and duplicates receive eight-character IDs for short URLs. An existing long-ID animal can have a stable `shortId` configured without changing its original ID. The QR dialog, public index and profile buttons use the short address; the old address also keeps working without JavaScript. Restoring an older local draft or importing an older backup retains the deployed short address for that same ID. Both addresses depend only on your own Pages copy. Do not change or remove a published ID/shortId after printing tags.

Microchip and registration numbers are text, so leading zeros and registry prefixes are preserved. Published and confirmed numbers appear directly on the public profile. Existing handling/medical warning fields remain available; PetQR does not diagnose or generate veterinary advice. The lost/found/custom status selector, badges, loss banner and legacy loss instructions are no longer displayed. Legacy data is preserved for compatibility.

Changing names, numbers, photos or instructions never changes the ID/URL. Always export/upload/deploy to update the page behind the printed QR. There is no direct GitHub connection or access-key field. The local preview intentionally shows only publishable data, so a draft identification or medical field will not appear until you select Publish and confirm.

## Address and outdoor access

Open **Address & outdoor access** to enter a complete home address, choose whether the animal stays home, may go out independently or only goes out accompanied, and describe its usual area and instructions. The default is **Not specified**; the app never assumes a cat may roam. Each field has its own Publish checkbox. Home addresses and areas require an explicit consent confirmation and are excluded from public ZIPs/previews until confirmed. Published details appear directly on the profile, so finders can distinguish authorized outings from a reason to contact the owner. This is not a lost/found status.

## Photos

Add photo opens a local crop canvas. Use zoom and horizontal/vertical position sliders, Rotate, then Use photo. Processing stays on the device and strips original metadata during re-encoding. The picker accepts browser-decodable photos: common JPEG, PNG, WebP, GIF, AVIF and BMP, plus HEIC/HEIF when natively supported. MIME-less camera exports can also be selected. SVG and documents are rejected. Animated images use the first frame.

There is no fixed input MB or megapixel limit in the app. The browser must still decode the original; very large images may exceed device memory, and compression cannot supply an unavailable decoder. Errors suggest another browser or JPEG/PNG conversion. Large decoded photos are downscaled for smooth editing. The crop starts at 1200×900, then quality and, if needed, dimensions are reduced until the WebP (JPEG fallback) output is at most 300 KB. A notification shows original and resulting sizes.

Add descriptive alt text. The first image is featured; Make featured, Move up/down and Remove manage the gallery. Additional images appear directly on the public page, outside collapsed details, and can be opened at their full saved size. There are at most 30 images per pet. Small photos may be enlarged; choose a clear source. Current stock-image sources and licenses are linked in Photo credits.

Open **Photo authorship and license (optional)** for a photo to record its actual author, source URL, license/permission, license URL and modifications. New uploads do not inherit the removed photo's author or receive CC0 automatically. Uploading, optimizing and exporting do not change the applicable rights. Keep any legally required attribution and modification notices for third-party photos. The current bundled stock photos use the Pexels License; photos you supply retain their own rights. The bundled contacts, addresses and microchip/registration numbers are fictional placeholders. The fictional telephone and WhatsApp numbers contain only zeros; emails use `.invalid`. Their call, WhatsApp and email buttons use the same standard links as real contacts. Replace example contact details before real-world use.

Exports with selected photo attribution metadata include a generated `PHOTO_CREDITS.txt` and embed the credit metadata in each selected photo's JSON entry. Import preserves it. The website build regenerates the file from current selected photos, so uploading only the exported `data/` and referenced images updates the credits too. Removed photos no longer appear; retained third-party photos keep their credits. A profile with no supplied credit metadata hides the footer credits link. The current Pexels photos have no optional credit metadata, so their public site and ZIP contain no photo-credit file or link.

If you overwrite an image file directly in GitHub using the same filename, update its credit metadata too. The app cannot infer the photographer or license from changed pixels. The editor's Add photo flow creates a new file and does not copy the previous credit.

## QR and tags

Configure the final public site URL first, including any repository path. The workflow's automatic URL is loaded into the editor on a deployed build. QR code opens a real local generator. Choose error correction (M default), a 4–12-module quiet zone, high-contrast colors, resolution and optional name label. Low-contrast/inverted colors are rejected. SVG is resolution independent; PNG is rasterized at the selected width.

For a 3D printer, use **Download 3D SVG**. Set the desired square size in millimeters first. This separate SVG contains one black filled shape made from closed QR modules, with no white background, strokes, text or tag border. Import it into your slicer as an SVG modifier or embossing shape, place it on a flat base, and set the raised height there (start with 0.8 mm). The SVG itself has no depth. Check the imported size and reserve at least four clear modules around the raised code: some slicers crop transparent margins when importing. Make sure the raised modules contrast with the base in the finished print, then scan a test print with a phone.

The tag designer provides circle, rectangle, rounded rectangle and square shapes. Set dimensions (41–120 mm), optional phone and short text. Circles/squares use equal sides. The QR uses at least 25 mm with a white quiet zone. Tags deliberately keep the QR black on white. SVG is suitable for vector editing; engravers may need text converted to paths in their own tool. Use Download tag PNG or Print for other workflows. Check the print dialog's actual-size/100% scaling setting.

Use a flat, durable, high-contrast surface. Preserve at least four clear modules around the QR. Larger/longer URLs may need larger tags. Avoid holes, decorations, scratches or curved edges inside the quiet zone. Test the actual printed or engraved result with multiple phones under ordinary lighting. Opening Test destination checks a URL but does not prove a physical engraving can be scanned.

## Import, export and local drafts

Export files shows a public-data warning, then downloads a ZIP. It contains four JSON files under data/ and referenced images under assets/pets/. Replace the repository's data/ and upload/merge the photos, commit to the default branch and wait for deployment. Files do not upload themselves.

Import files accepts the complete public ZIP or one complete configuration JSON. It replaces your draft after confirmation. Individual site/contacts/pets JSON fragments must be combined into the complete version/site/contacts/pets shape, or loaded together as a ZIP. No source JSON editing is necessary for routine use.

Save draft on this device explicitly saves the full draft/images in this browser. Restore it when returning; Forget deletes it. This is local storage, not authentication or cross-device synchronization. Reset draft restores the currently **deployed configuration**. Leaving an unsaved session warns before discarding edits. A public ZIP intentionally cannot recover unpublished fields.

## Photo gallery and publishing help

Photo frames are filled with fitted crops. Square thumbnails sit directly below the main photo; select one to view it in the same frame. Without JavaScript, each thumbnail opens its original image. Focus metadata is preserved through ZIP export/import.

Help and Export provide a direct link to create your own GitHub repository from the template. Follow the one-time Pages setup, edit the animals in your own deployed editor, then extract/upload the exported folders and commit. GitHub builds and publishes updates automatically. The ZIP includes PUBLISHING.txt in the editor’s selected language. Standard GitHub Pages URLs generate repository, Pages-settings and workflow shortcuts for that copy; custom domains keep the generic instructions.
