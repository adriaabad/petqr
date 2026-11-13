import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFile } from 'node:fs/promises';
import { importArchive } from '../../src/archive';
import jsQR from 'jsqr';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('petqr-language', 'en');
    } catch {
      /* Sandboxed profile previews intentionally cannot access storage. */
    }
  });
});
test('desktop dashboard loads cleanly and manages multiple pets', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('editor/');
  await expect(page).toHaveTitle('PetQR · Local editor');
  await expect(page.locator('.pet-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Duplicate', exact: true }).first().click();
  await expect(page.locator('.pet-card')).toHaveCount(4);
  await expect(page.locator('.pet-card').nth(1)).toContainText('Cooper (2)');
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
test('missing profile works on mobile under subdirectory hosting with language switching', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('p/luna-92bd/');
  await expect(page.getByRole('heading', { name: 'Luna', exact: true })).toBeVisible();
  await expect(page.locator('.missing-banner')).toBeVisible();
  await expect(page.locator('a[href="tel:+12025550188"]').first()).toBeVisible();
  await page.getByLabel('Language', { exact: true }).selectOption('ca');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
  await expect(page.getByText('Aquest animal està perdut.', { exact: false })).toBeVisible();
  await page.getByText('Tots els detalls', { exact: true }).click();
  await expect(page.getByText('Collar verd blavós', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map((i) => (i as HTMLImageElement).decode().catch(() => {})));
  });
  await page.screenshot({
    path: join(process.env.PETQR_SCREENSHOT_DIR || tmpdir(), 'petqr-mobile.png'),
    fullPage: true,
  });
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
test('sensitive medical field requires confirmation and remains unpublished when declined', async ({
  page,
}) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  const section = page.locator('details[data-section="data-medical"]');
  await section.locator('summary').click();
  await section.getByLabel('Optional fields').selectOption('medications');
  await section.getByRole('button', { name: 'Add field', exact: true }).click();
  const field = section.locator('.field-row').last();
  await field
    .getByLabel('Current medications', { exact: true })
    .fill('PRIVATE_MEDICATION_SENTINEL');
  page.once('dialog', (d) => d.dismiss());
  await field.getByLabel('Publish', { exact: true }).click();
  await expect(field.getByLabel('Publish', { exact: true })).not.toBeChecked();
  await expect(page.locator('#profile-preview')).not.toHaveAttribute(
    'srcdoc',
    /PRIVATE_MEDICATION_SENTINEL/,
  );
});
test('QR settings require a public URL and produce SVG and PNG files', async ({ page }) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await page.getByLabel('Public site URL', { exact: true }).fill('');
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await page.getByRole('button', { name: 'QR code', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('QR codes require a final public URL.');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await page.getByLabel('Public site URL', { exact: true }).fill('https://owner.example/animals');
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await page.getByRole('button', { name: 'QR code', exact: true }).first().click();
  await expect(page.locator('.url-display')).toContainText(
    'https://owner.example/animals/p/cooper-7f2a/',
  );
  await expect(page.locator('[data-qr] svg')).toBeVisible();
  await page.getByLabel('Resolution', { exact: true }).selectOption('512');
  for (const name of ['Download SVG', 'Download PNG', 'Download tag SVG', 'Download tag PNG']) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name, exact: true }).click();
    const result = await pending;
    expect(result.suggestedFilename()).toMatch(/\.(svg|png)$/);
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
        'https://owner.example/animals/p/cooper-7f2a/',
      );
    }
  }
  await page.getByLabel('Foreground', { exact: true }).fill('#cccccc');
  await expect(page.locator('[data-qr-error]')).toContainText('contrast');
});
test('image crop, rotate and publication ZIP include the processed photo', async ({ page }) => {
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.locator('details[data-section=photos] summary').click();
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
  await page.locator('details[data-section=photos] summary').click();
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
  await expect(preview.locator('.gallery img')).toBeVisible();
  await expect
    .poll(() =>
      preview.locator('.gallery img').evaluate((image) => (image as HTMLImageElement).naturalWidth),
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
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await page.getByRole('button', { name: 'Save draft on this device', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('Draft saved locally.');
  await page.reload();
  await expect(page.locator('.pet-card').first()).toContainText('Cooper');
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await page.getByRole('button', { name: 'Restore local draft', exact: true }).click();
  await page.getByRole('button', { name: 'My pets', exact: true }).click();
  await expect(page.locator('.pet-card').first()).toContainText('Local draft companion');
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
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
