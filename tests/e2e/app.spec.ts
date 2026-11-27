import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFile } from 'node:fs/promises';
import { importArchive } from '../../src/editor/archive';
import jsQR from 'jsqr';
import { unzipSync, strFromU8 } from 'fflate';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('petqr-language', 'en');
    } catch {
      /* Sandboxed profile previews intentionally cannot access storage. */
    }
  });
});
test('PetQR calls to action open the six-step visual tutorial with languages and mobile layout', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page.locator('.page-actions .tutorial-cta').click();
  await expect(page).toHaveURL(/\/test-repo\/tutorial\/$/);
  await expect(
    page.getByRole('heading', { name: 'Your PetQR, step by step.', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tutorial-step')).toHaveCount(6);
  await expect(page.locator('.tutorial-visual')).toHaveCount(6);
  await expect(page.locator('.tutorial-hero .button.primary')).toHaveAttribute(
    'href',
    /template_owner=adriaabad&template_name=petqr/,
  );
  await page.locator('a[href="#steps"]').click();
  await expect(page.locator('#steps')).toBeInViewport();
  await page.getByLabel('Language', { exact: true }).selectOption('ca');
  await expect(page).toHaveTitle('Vull el meu PetQR · PetQR');
  await expect(
    page.getByRole('heading', { name: 'El teu PetQR, pas a pas.', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.tutorial-details > summary').click();
  await expect(page.locator('.tutorial-details .publication-guide')).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});
test('tutorial is reachable from profiles and remains complete without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4174/test-repo/p/cooper-7f2a/');
  await page.locator('footer .tutorial-cta').click();
  await expect(page).toHaveURL(/\/test-repo\/tutorial\/$/);
  await expect(page.locator('.tutorial-step')).toHaveCount(6);
  await expect(
    page.getByRole('heading', { name: 'Your PetQR, step by step.', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tutorial-ready a[href="../editor/"]')).toHaveAttribute(
    'href',
    '../editor/',
  );
  await context.close();
});
test('editor, Help and Export link to the visual tutorial and plain photos export without credits', async ({
  page,
}) => {
  await page.goto('editor/');
  await expect(page.locator('.sidebar .tutorial-cta')).toHaveAttribute(
    'href',
    /\/test-repo\/tutorial\/$/,
  );
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await expect(page.locator('.help-content .tutorial-cta')).toHaveAttribute(
    'href',
    /\/test-repo\/tutorial\/$/,
  );
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  await expect(page.getByRole('dialog').locator('.tutorial-cta')).toHaveAttribute(
    'href',
    /\/test-repo\/tutorial\/$/,
  );
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirm publication · ZIP', exact: true }).click();
  const file = await pending,
    files = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  expect(files['PHOTO_CREDITS.txt']).toBeUndefined();
  expect(files['PUBLISHING.txt']).toBeDefined();
});
test('desktop dashboard loads cleanly and manages multiple pets', async ({ page }) => {
  await page.route('**/data/config.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.pets[0].shortId = 'c0ffee12';
    await route.fulfill({ json: config });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('editor/');
  await expect(page).toHaveTitle('PetQR · Local editor');
  await expect(page.locator('.pet-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Duplicate', exact: true }).first().click();
  await expect(page.locator('.pet-card')).toHaveCount(4);
  await expect(page.locator('.pet-card').nth(1)).toContainText('Cooper (2)');
  await expect(
    page.locator('.pet-card').nth(1).getByRole('link', { name: 'View profile' }),
  ).toHaveAttribute('href', /\/p\/[a-f0-9]{8}\/$/);
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: 'Delete', exact: true }).first().click();
  await expect(page.locator('.pet-card')).toHaveCount(4);
  expect(errors).toEqual([]);
});
test('editor preview and exported public files reflect edits while keeping the ID', async ({
  page,
}) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Name', { exact: true }).fill('Cooper updated');
  await expect(page.locator('#profile-preview')).toHaveAttribute('srcdoc', /Cooper updated/);
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirm publication · ZIP' }).click();
  const file = await downloaded;
  const path = await file.path();
  expect(path).toBeTruthy();
  const result = importArchive(new Uint8Array(await readFile(path!)));
  expect(result.config.pets[0].id).toBe('cooper-7f2a');
  expect(result.config.pets[0].name).toBe('Cooper updated');
  expect(result.images.size).toBe(3);
});
test('profile works on mobile without lost status under subdirectory hosting with language switching', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('p/luna-92bd/');
  await expect(page.getByRole('heading', { name: 'Luna', exact: true })).toBeVisible();
  await expect(page.locator('.missing-banner, .status')).toHaveCount(0);
  await expect(page.locator('a[href="tel:+12025550188"]').first()).toBeVisible();
  await page.getByLabel('Language', { exact: true }).selectOption('ca');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
  await expect(page.getByText('Aquest animal està perdut.', { exact: false })).toHaveCount(0);
  await page.getByText('Tots els detalls', { exact: true }).click();
  await expect(page.locator('.full-details')).toHaveAttribute('open', '');
  await expect(page.locator('.full-details')).toContainText('Gat');
  await expect(page.getByText('Collar verd blavós', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map((i) => (i as HTMLImageElement).decode().catch(() => {})));
  });
  await page.screenshot({
    path: join(process.env.PETQR_SCREENSHOT_DIR || tmpdir(), 'petqr-mobile.png'),
    fullPage: true,
  });
});
test('photo thumbnails sit below the main photo and switch it without navigation on mobile', async ({
  page,
}) => {
  await page.route('**/p/cooper-7f2a/profile.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.pets[0].photos.push({ path: 'assets/pets/luna.webp', alt: 'Additional photograph' });
    await route.fulfill({ json: config });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('p/cooper-7f2a/');
  const image = page.locator('.additional-photos img').last();
  await expect(image).toBeVisible();
  await image.evaluate((image) => (image as HTMLImageElement).decode());
  const box = (await image.boundingBox())!;
  expect(box.width).toBeGreaterThan(100);
  expect(box.height).toBeCloseTo(box.width, 0);
  await expect(page.locator('.full-details')).not.toHaveAttribute('open');
  await expect(page.locator('.additional-photos a').last()).toHaveAttribute(
    'href',
    /assets\/pets\/luna.webp$/,
  );
  const main = page.locator('.profile-photo img');
  const frame = (await page.locator('.profile-photo').boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(frame.y + frame.height);
  expect(await main.evaluate((image) => getComputedStyle(image).objectFit)).toBe('cover');
  await page.locator('.photo-thumbnail').last().click();
  await expect(main).toHaveAttribute('src', /assets\/pets\/luna.webp$/);
  await expect(main).toHaveAttribute('alt', 'Additional photograph');
  await expect(page.locator('.photo-thumbnail').last()).toHaveAttribute('aria-current', 'true');
  expect(page.url()).toMatch(/p\/cooper-7f2a\/$/);
  await page.locator('.photo-thumbnail').first().click();
  await expect(main).toHaveAttribute('src', /assets\/pets\/cooper.webp$/);
});

test('fictional contact values still provide call, WhatsApp and email buttons', async ({
  page,
}) => {
  await page.route('**/p/cooper-7f2a/profile.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.contacts = [
      {
        id: 'example-person',
        name: 'Alex Riu',
        phone: '00000000000',
        whatsapp: '00000000000',
        email: 'alex@example.invalid',
        preferred: 'phone',
        language: 'en',
        publish: true,
        consent: true,
      },
    ];
    config.pets[0].contacts = [{ id: 'example-person' }];
    await route.fulfill({ json: config });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('p/cooper-7f2a/');
  const contacts = page.locator('.contacts-public');
  await expect(contacts.getByRole('link', { name: 'Call Alex Riu', exact: true })).toHaveAttribute(
    'href',
    'tel:00000000000',
  );
  await expect(
    contacts.getByRole('link', { name: 'WhatsApp Alex Riu', exact: true }),
  ).toHaveAttribute('href', 'https://wa.me/00000000000');
  await expect(contacts.getByRole('link', { name: 'Email Alex Riu', exact: true })).toHaveAttribute(
    'href',
    'mailto:alex@example.invalid',
  );
  await expect(page.locator('.quick-contact a')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Help and Export explain template setup, independent hosting and automatic updates in Catalan', async ({
  page,
}) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await expect(page.locator('.setup-guide')).toHaveAttribute('open', '');
  await expect(
    page.getByRole('link', { name: 'Create my copy on GitHub', exact: false }),
  ).toHaveAttribute('href', /template_owner=adriaabad&template_name=petqr/);
  await expect(page.locator('.publication-guide')).toContainText('Settings → Pages');
  await expect(page.locator('.publication-guide')).toContainText('GitHub Actions');
  await page.getByLabel('Language', { exact: true }).selectOption('ca');
  await expect(page.getByRole('button', { name: 'Configuració', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Exportar fitxers', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.publication-guide')).toContainText('Commit changes');
  await expect(dialog.locator('.publication-guide')).toContainText('PUBLISHING.txt');
  await expect(
    dialog.getByRole('link', { name: 'Crear la meva còpia a GitHub', exact: false }),
  ).toHaveAttribute('href', /visibility=public/);
  const pending = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Confirmar publicació · ZIP', exact: true }).click();
  const download = await pending;
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  expect(strFromU8(files['PUBLISHING.txt'])).toContain('Crear i publicar la teva web');
  expect(strFromU8(files['PUBLISHING.txt'])).toContain('No pugis el ZIP directament');
});

test('emergency contact and warnings remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4174/test-repo/p/cooper-7f2a/');
  await expect(page.getByRole('heading', { name: 'Cooper', exact: true })).toBeVisible();
  await expect(page.locator('a[href="tel:+12025550142"]').first()).toBeVisible();
  await expect(
    page.getByText('Chicken allergy. Please do not offer treats.', { exact: true }),
  ).toBeVisible();
  await context.close();
});
test('simple pet form exports chip and registration only with explicit consent and has no GitHub connection or status controls', async ({
  page,
}) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Advanced', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect GitHub', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save and publish', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Status', { exact: true })).toHaveCount(0);
  await expect(page.locator('details[data-section="emergency"]')).toHaveCount(0);
  await page.getByLabel('Microchip number', { exact: true }).fill('000123456789012');
  await page.getByLabel('Registration number', { exact: true }).fill('REG-00042');
  page.once('dialog', (d) => d.dismiss());
  await page.getByLabel('Publish microchip number', { exact: true }).click();
  await expect(page.getByLabel('Publish microchip number', { exact: true })).not.toBeChecked();
  await expect(page.locator('#profile-preview')).not.toHaveAttribute(
    'srcdoc',
    /000123456789012|REG-00042/,
  );
  for (const label of ['Publish microchip number', 'Publish registration number']) {
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByLabel(label, { exact: true }).check();
  }
  await expect(
    page.frameLocator('#profile-preview').getByText('000123456789012', { exact: true }),
  ).toBeVisible();
  await expect(
    page.frameLocator('#profile-preview').getByText('REG-00042', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirm publication · ZIP' }).click();
  const file = await downloaded;
  const result = importArchive(new Uint8Array(await readFile((await file.path())!)));
  expect(result.config.pets[0].sections.filter((s) => s.id === 'identification')).toHaveLength(1);
  const fields = result.config.pets[0].sections.find((s) => s.id === 'identification')!.fields;
  expect(fields.find((f) => f.key === 'microchip')?.value).toBe('000123456789012');
  expect(fields.find((f) => f.key === 'registration')?.value).toBe('REG-00042');
  expect(result.config.pets[0].id).toBe('cooper-7f2a');
});
test('standard health and behavior text boxes preserve privacy and export together', async ({
  page,
}) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).nth(2).click();
  await expect(page.locator('details[data-section="appearance"]')).toHaveCount(0);
  await expect(page.getByLabel('Accent color', { exact: true })).toHaveCount(0);
  await expect(page.locator('.demo-note')).toHaveCount(0);
  const medical = page.locator('details[data-section="data-medical"]');
  await medical.locator('summary').click();
  await medical.getByLabel('Allergies', { exact: true }).fill('PRIVATE_ALLERGY');
  await medical.getByLabel('Health conditions', { exact: true }).fill('PRIVATE_CONDITION');
  await expect(page.locator('#profile-preview')).not.toHaveAttribute(
    'srcdoc',
    /PRIVATE_ALLERGY|PRIVATE_CONDITION/,
  );
  const allergy = medical
    .locator('.field-row')
    .filter({ has: page.getByLabel('Allergies', { exact: true }) });
  page.once('dialog', (dialog) => dialog.dismiss());
  await allergy.getByLabel('Publish', { exact: true }).click();
  await expect(allergy.getByLabel('Publish', { exact: true })).not.toBeChecked();
  for (const label of ['Allergies', 'Health conditions']) {
    const field = medical
      .locator('.field-row')
      .filter({ has: page.getByLabel(label, { exact: true }) });
    page.once('dialog', (dialog) => dialog.accept());
    await field.getByLabel('Publish', { exact: true }).check();
  }
  const behavior = page.locator('details[data-section="data-behavior"]');
  await behavior.locator('summary').click();
  await behavior
    .getByLabel('Behavior and handling notes', { exact: true })
    .fill('Approach slowly and contact the owner.');
  await behavior.getByLabel('Publish', { exact: true }).check();
  await expect(page.locator('#profile-preview')).toHaveAttribute('srcdoc', /PRIVATE_ALLERGY/);
  await expect(page.locator('#profile-preview')).toHaveAttribute('srcdoc', /PRIVATE_CONDITION/);
  await expect(page.locator('#profile-preview')).toHaveAttribute(
    'srcdoc',
    /Approach slowly and contact the owner/,
  );
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirm publication · ZIP' }).click();
  const file = await pending;
  const result = importArchive(new Uint8Array(await readFile((await file.path())!)));
  const pet = result.config.pets[2];
  const health = pet.sections.filter((section) => section.id === 'medical');
  expect(health).toHaveLength(1);
  expect(health[0].fields.map((field) => field.key).sort()).toEqual(['allergies', 'conditions']);
  expect(health[0].fields.every((field) => field.publish && field.consent)).toBe(true);
  expect(pet.sections.find((section) => section.id === 'behavior')?.fields[0].value).toBe(
    'Approach slowly and contact the owner.',
  );
});

test('home address, roaming permission and usual area are opt-in and export together', async ({
  page,
}) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Add pet', exact: true }).click();
  const location = page.locator('details[data-section="data-location"]');
  await location.locator('summary').click();
  await expect(location.getByLabel('Outdoor access', { exact: true })).toHaveValue('');
  await location.getByLabel('Home address', { exact: true }).fill('PRIVATE_ADDRESS_123');
  await location
    .getByLabel('Usual area and outdoor instructions', { exact: true })
    .fill('PRIVATE_AREA_123');
  await location
    .getByLabel('Outdoor access', { exact: true })
    .selectOption('May go out independently');
  await expect(page.locator('#profile-preview')).not.toHaveAttribute(
    'srcdoc',
    /PRIVATE_ADDRESS_123|PRIVATE_AREA_123/,
  );
  const address = location
    .locator('.field-row')
    .filter({ has: page.getByLabel('Home address', { exact: true }) });
  page.once('dialog', (dialog) => dialog.dismiss());
  await address.getByLabel('Publish', { exact: true }).click();
  await expect(address.getByLabel('Publish', { exact: true })).not.toBeChecked();
  for (const label of ['Home address', 'Usual area and outdoor instructions']) {
    page.once('dialog', (dialog) => dialog.accept());
    await location
      .locator('.field-row')
      .filter({ has: page.getByLabel(label, { exact: true }) })
      .getByLabel('Publish', { exact: true })
      .check();
  }
  await location
    .locator('.field-row')
    .filter({ has: page.getByLabel('Outdoor access', { exact: true }) })
    .getByLabel('Publish', { exact: true })
    .check();
  const residence = page.frameLocator('#profile-preview').locator('.residence-public');
  await expect(residence).toContainText('PRIVATE_ADDRESS_123');
  await expect(residence).toContainText('PRIVATE_AREA_123');
  await expect(residence).toContainText('May go out independently');
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirm publication · ZIP' }).click();
  const file = await pending;
  const result = importArchive(new Uint8Array(await readFile((await file.path())!)));
  const sections = result.config.pets
    .at(-1)!
    .sections.filter((section) => section.id === 'location');
  expect(sections).toHaveLength(1);
  expect(sections[0].fields).toHaveLength(3);
  expect(sections[0].fields.find((field) => field.key === 'homeAddress')?.consent).toBe(true);
});

test('replacing an attributed photo with a new upload removes stale authorship and preserves new credit in the ZIP', async ({
  page,
}) => {
  await page.route('**/data/config.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.pets[0].photos[0].credit = {
      author: 'STOCK_AUTHOR',
      source: 'https://example.com/stock',
      license: 'CC BY 4.0',
    };
    await route.fulfill({ json: config });
  });
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.locator('details[data-section="photos"] > summary').click();
  await page.getByText('Photo authorship and license (optional)', { exact: true }).click();
  await expect(page.getByLabel('Photo author', { exact: true })).toHaveValue('STOCK_AUTHOR');
  await page.locator('.photo-item').getByRole('button', { name: 'Remove', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add photo', exact: true }).click();
  await (await chooser).setFiles('tests/fixtures/assets/pets/luna.webp');
  await expect(page.locator('.crop-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Use photo', exact: true }).click();
  await page.getByText('Photo authorship and license (optional)', { exact: true }).click();
  await expect(page.getByLabel('Photo author', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Photo license or permission', { exact: true })).toHaveValue('');
  await expect(
    page.frameLocator('#profile-preview').getByRole('link', { name: 'Photo credits', exact: true }),
  ).toHaveCount(0);
  await page.getByLabel('Photo author', { exact: true }).fill('MY_PHOTO_AUTHOR');
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirm publication · ZIP' }).click();
  const file = await pending;
  const bytes = new Uint8Array(await readFile((await file.path())!));
  const config = importArchive(bytes).config;
  expect(config.pets[0].photos[0].credit?.author).toBe('MY_PHOTO_AUTHOR');
  expect(config.pets[0].photos[0].credit?.license).toBe('');
  const credits = strFromU8(unzipSync(bytes)['PHOTO_CREDITS.txt']);
  expect(credits).toContain('MY_PHOTO_AUTHOR');
  expect(credits).not.toContain('STOCK_AUTHOR');
});

test('QR settings require a public URL and produce SVG and PNG files', async ({ page }) => {
  await page.route('**/data/config.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.pets[0].shortId = 'c0ffee12';
    await route.fulfill({ json: config });
  });
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Public site URL', { exact: true }).fill('');
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await page.getByRole('button', { name: 'QR code', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('QR codes require a final public URL.');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Public site URL', { exact: true }).fill('https://owner.example/animals');
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await page.getByRole('button', { name: 'QR code', exact: true }).first().click();
  await expect(page.locator('.url-display')).toContainText(
    'https://owner.example/animals/p/c0ffee12/',
  );
  await expect(page.locator('[data-qr] svg')).toBeVisible();
  await page.getByLabel('Resolution', { exact: true }).selectOption('512');
  await expect(page.locator('[data-qr-3d] svg')).toBeVisible();
  await page.getByLabel('3D QR size (mm)', { exact: true }).fill('60');
  for (const name of [
    'Download SVG',
    'Download PNG',
    'Download 3D SVG',
    'Download tag SVG',
    'Download tag PNG',
  ]) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name, exact: true }).click();
    const result = await pending;
    expect(result.suggestedFilename()).toMatch(/\.(svg|png)$/);
    if (name === 'Download 3D SVG') {
      expect(result.suggestedFilename()).toMatch(/-qr-3d\.svg$/);
      const content = await readFile((await result.path())!, 'utf8');
      expect(content).toContain('width="60mm" height="60mm"');
      expect(content).toContain('<path fill="#000000"');
      expect(content).not.toContain('stroke=');
      expect(content).not.toContain('<rect');
      const pixels = await page.evaluate(async (svg) => {
        const image = new Image();
        image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 600;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(image, 0, 0, 600, 600);
        return Array.from(ctx.getImageData(0, 0, 600, 600).data);
      }, content);
      expect(jsQR(new Uint8ClampedArray(pixels), 600, 600)?.data).toBe(
        'https://owner.example/animals/p/c0ffee12/',
      );
    }
    if (name === 'Download PNG') {
      const bytes = await readFile((await result.path())!);
      const decoded = await page.evaluate(async (data) => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        return {
          pixels: Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data),
          width: canvas.width,
          height: canvas.height,
        };
      }, bytes.toString('base64'));
      expect(jsQR(new Uint8ClampedArray(decoded.pixels), decoded.width, decoded.height)?.data).toBe(
        'https://owner.example/animals/p/c0ffee12/',
      );
    }
  }
  await page.getByLabel('Foreground', { exact: true }).fill('#cccccc');
  await expect(page.locator('[data-qr-error]')).toContainText('contrast');
});
test('image crop, rotate and publication ZIP include the processed photo', async ({ page }) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.locator('details[data-section=photos] > summary').click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add photo', exact: true }).click();
  await (await chooser).setFiles('tests/fixtures/assets/pets/luna.webp');
  await expect(page.locator('.crop-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Rotate 90°', exact: true }).click();
  await page.getByLabel('Zoom / crop', { exact: true }).fill('1.3');
  await page.getByRole('button', { name: 'Use photo', exact: true }).click();
  await expect(page.locator('.photo-item')).toHaveCount(2);
  await page.getByRole('button', { name: 'Make featured', exact: true }).click();
  await expect(page.locator('.photo-item').first()).toContainText('Featured');
});

test('an invalid optional Telegram does not block a photo over 15 MB, and the export contains a compressed image', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Contacts', exact: true }).click();
  const contact = page.locator('.contact-editor').first();
  await contact.locator('.optional-contact-method summary').click();
  await contact.getByLabel('Telegram', { exact: true }).fill('+34 600 123 456');
  await expect(contact.getByLabel('Telegram', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(contact.locator('.field-error')).toContainText('Leave blank');
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await expect(page.locator('#profile-preview')).toHaveAttribute(
    'srcdoc',
    /Some contact methods are incomplete/,
  );
  await expect(page.locator('#errors')).toBeEmpty();
  await page.locator('details[data-section=photos] > summary').click();
  const width = 2400,
    height = 2400,
    stride = width * 3,
    pixels = stride * height;
  const bmp = Buffer.alloc(54 + pixels);
  let noise = 42;
  for (let index = 54; index < bmp.length; index++) {
    noise = (Math.imul(1664525, noise) + 1013904223) >>> 0;
    bmp[index] = noise >>> 24;
  }
  bmp.write('BM');
  bmp.writeUInt32LE(bmp.length, 2);
  bmp.writeUInt32LE(54, 10);
  bmp.writeUInt32LE(40, 14);
  bmp.writeInt32LE(width, 18);
  bmp.writeInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26);
  bmp.writeUInt16LE(24, 28);
  bmp.writeUInt32LE(0, 30);
  bmp.writeUInt32LE(pixels, 34);
  expect(bmp.length).toBeGreaterThan(15 * 1024 * 1024);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add photo', exact: true }).click();
  await (
    await chooser
  ).setFiles({ name: 'large-camera-photo.bmp', mimeType: 'image/bmp', buffer: bmp });
  await expect(page.locator('.crop-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Use photo', exact: true }).click();
  await expect(page.locator('.photo-item')).toHaveCount(2);
  await expect(page.locator('#toast')).toContainText('Photo optimized');
  await expect(page.locator('#errors')).toBeEmpty();
  const sandbox = await page.locator('#profile-preview').getAttribute('sandbox');
  expect(sandbox?.split(' ')).toContain('allow-same-origin');
  expect(sandbox?.split(' ')).not.toContain('allow-scripts');
  const preview = page.frameLocator('#profile-preview');
  await preview.locator('.full-details summary').click();
  await expect(preview.locator('.gallery img').last()).toBeVisible();
  await expect
    .poll(() =>
      preview
        .locator('.gallery img')
        .last()
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  await expect(page.locator('#errors')).toContainText('Contacts → Alex (fictional) → telegram');
  await expect(page.locator('#errors')).not.toContainText('/^');
  await page.getByRole('button', { name: 'Contacts', exact: true }).click();
  await page
    .locator('.contact-editor')
    .first()
    .getByLabel('Telegram', { exact: true })
    .fill('https://t.me/person_123');
  await expect(
    page.locator('.contact-editor').first().getByLabel('Telegram', { exact: true }),
  ).toHaveAttribute('aria-invalid', 'false');
  await page.getByRole('button', { name: 'Export files', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Confirm publication · ZIP' }).click();
  const archive = importArchive(new Uint8Array(await readFile((await (await downloaded).path())!)));
  expect(archive.config.contacts[0].telegram).toBe('person_123');
  const added = archive.config.pets[0].photos[1];
  expect(added.path).toMatch(/\.(webp|jpg)$/);
  expect(archive.images.get(added.path)!.byteLength).toBeLessThanOrEqual(300 * 1024);
  expect(errors).toEqual([]);
});
test('dashboard and public profile pass automated WCAG AA checks', async ({ page }) => {
  for (const route of ['editor/', 'p/cooper-7f2a/']) {
    await page.goto(route);
    await page
      .locator(route === 'editor/' ? '.pet-card' : '.contacts-public')
      .first()
      .waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});
test('screenshots and dark-mode mobile dashboard have no overflow or runtime errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('editor/');
  await expect(page.locator('.pet-card')).toHaveCount(3);
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map((i) => (i as HTMLImageElement).decode().catch(() => {})));
  });
  await page.screenshot({
    path: join(process.env.PETQR_SCREENSHOT_DIR || tmpdir(), 'petqr-dashboard.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Theme', { exact: true }).selectOption('dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('shared contacts, assignment priority and pet-specific overrides update the public preview', async ({
  page,
}) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Contacts', exact: true }).click();
  await page.getByRole('button', { name: 'Add contact', exact: true }).click();
  const card = page.locator('.contact-editor').last();
  await card.getByLabel('Contact name', { exact: true }).fill('New fictional contact');
  await card.getByLabel('Telephone', { exact: true }).fill('+34 600 111 222');
  page.once('dialog', (d) => d.accept());
  await card.getByLabel('Publish contact', { exact: true }).click();
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.locator('details[data-section=contacts] summary').click();
  await page.getByLabel('New fictional contact', { exact: true }).check();
  const assigned = page
    .locator('.assigned-contact')
    .filter({ has: page.getByLabel('New fictional contact', { exact: true }) });
  await assigned.getByRole('button', { name: 'Move up', exact: true }).click();
  await assigned.getByRole('button', { name: 'Move up', exact: true }).click();
  await expect(page.locator('.assigned-contact').first()).toContainText('New fictional contact');
  await assigned.getByRole('button', { name: 'Override for this pet', exact: true }).click();
  await assigned.getByLabel('Telephone', { exact: true }).fill('+34 600 333 444');
  await expect(page.locator('#profile-preview')).toHaveAttribute('srcdoc', /tel:\+34600333444/);
  await expect(page.locator('#profile-preview')).not.toHaveAttribute('srcdoc', /tel:\+34600111222/);
});

test('local drafts are explicit, restorable and forgettable', async ({ page }) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Name', { exact: true }).fill('Local draft companion');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Save draft on this device', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('Draft saved locally.');
  await page.route('**/data/config.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.pets[0].shortId = 'c0ffee12';
    await route.fulfill({ json: config });
  });
  await page.reload();
  await expect(page.locator('.pet-card').first()).toContainText('Cooper');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Restore local draft', exact: true }).click();
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await expect(page.locator('.pet-card').first()).toContainText('Local draft companion');
  await expect(
    page.locator('.pet-card').first().getByRole('link', { name: 'View profile' }),
  ).toHaveAttribute('href', /\/p\/c0ffee12\/$/);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Forget local draft', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('Local draft deleted.');
});

test('all three UI languages and secure contact actions require no external runtime requests', async ({
  page,
}) => {
  const remote: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4174/') && !request.url().startsWith('blob:'))
      remote.push(request.url());
  });
  await page.goto('editor/');
  await page.getByLabel('Language', { exact: true }).selectOption('es');
  await expect(page.getByRole('button', { name: 'Añadir animal', exact: true })).toBeVisible();
  await page.getByLabel('Idioma', { exact: true }).selectOption('ca');
  await expect(page.getByRole('button', { name: 'Afegir animal', exact: true })).toBeVisible();
  await page.getByLabel('Idioma', { exact: true }).selectOption('en');
  await expect(page.getByRole('button', { name: 'Add pet', exact: true })).toBeVisible();
  expect(remote).toEqual([]);
});

test('location is never requested before a finder explicitly presses share', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 41.38, longitude: 2.17 });
  await page.addInitScript(() => {
    (window as unknown as { geoCalls: number }).geoCalls = 0;
    const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (...args) => {
      (window as unknown as { geoCalls: number }).geoCalls++;
      original(...args);
    };
  });
  await page.goto('p/cooper-7f2a/');
  await page.locator('.location-share').waitFor({ state: 'attached' });
  expect(await page.evaluate(() => (window as unknown as { geoCalls: number }).geoCalls)).toBe(0);
  await page.locator('.location-share summary').click();
  expect(await page.evaluate(() => (window as unknown as { geoCalls: number }).geoCalls)).toBe(0);
  await page.getByRole('button', { name: 'Share my location', exact: true }).click();
  const link = page.getByRole('link', { name: 'Open WhatsApp with location', exact: true });
  await expect(link).toHaveAttribute('href', /https:\/\/wa.me\/12025550142\?text=/);
  await expect(link).toHaveAttribute('href', /41\.38000/);
  expect(await page.evaluate(() => (window as unknown as { geoCalls: number }).geoCalls)).toBe(1);
});
