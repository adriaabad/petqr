import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fakeGitHub, hash, TEST_KEY } from '../fake-github';
import { DATA_PATHS } from '../../src/deployment';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('petqr-language', 'en');
    } catch {}
  });
});
async function interceptGitHub(page: Page) {
  const files: Record<string, Uint8Array> = {};
  for (const path of DATA_PATHS)
    files[path] = new Uint8Array(await readFile('tests/fixtures/' + path));
  for (const name of ['cooper', 'luna', 'mochi'])
    files[`assets/pets/${name}.webp`] = new Uint8Array(
      await readFile(`tests/fixtures/assets/pets/${name}.webp`),
    );
  files['src/core.ts'] = new TextEncoder().encode('Keep application source');
  const api = fakeGitHub(files),
    metadata = JSON.parse(await readFile('.test-site/data/deployment.json', 'utf8'));
  await page.route('https://api.github.com/**', async (route) => {
    const request = route.request(),
      headers = {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
        'access-control-allow-headers': 'authorization,content-type,x-github-api-version,accept',
      };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const response = await api.fetch(request.url(), {
      method: request.method(),
      headers: request.headers(),
      body: request.postData(),
    });
    await route.fulfill({ status: response.status, headers, body: await response.text() });
  });
  await page.route('**/data/deployment.json?publication=*', async (route) => {
    await route.fulfill({
      json: {
        ...metadata,
        commit: api.head,
        dataShas: Object.fromEntries(DATA_PATHS.map((path) => [path, hash(api.files[path])])),
        photoShas: Object.fromEntries(
          Object.keys(api.files)
            .filter((path) => path.startsWith('assets/pets/'))
            .map((path) => [path, hash(api.files[path])]),
        ),
      },
    });
  });
  return api;
}
async function connect(page: Page, key = TEST_KEY) {
  await page.getByRole('button', { name: 'Connect GitHub', exact: true }).click();
  await page.getByLabel('Temporary access key', { exact: true }).fill(key);
  await page
    .getByLabel('I selected only this repository and Contents: Read and write.', { exact: true })
    .check();
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
}

test('authenticated Save publishes one atomic update, tracks deployment and never stores the access key', async ({
  page,
}) => {
  const api = await interceptGitHub(page),
    errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Name', { exact: true }).fill('Saved directly');
  await connect(page);
  await expect(page.locator('#github-publishing')).toContainText('Connected as test-owner');
  expect(await page.locator('input[type=password]').count()).toBe(0);
  await page.getByRole('button', { name: 'Save and publish', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('petqr-tests/pets');
  await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
  await expect(page.locator('#github-publishing')).toContainText(
    'Published. The website now includes your changes.',
  );
  expect(new TextDecoder().decode(api.files['data/pets.json'])).toContain('Saved directly');
  expect(new TextDecoder().decode(api.files['src/core.ts'])).toBe('Keep application source');
  expect(api.calls.filter((call) => call.method === 'PATCH')).toHaveLength(1);
  expect(api.calls.find((call) => call.method === 'PATCH')!.body.force).toBe(false);
  for (const call of api.calls) {
    expect(call.path).not.toContain(TEST_KEY);
    if (call.path.endsWith('/git/blobs'))
      expect(Buffer.from(call.body.content, 'base64').toString('utf8')).not.toContain(TEST_KEY);
  }
  await page.getByRole('button', { name: 'Site settings', exact: true }).click();
  await page.getByRole('button', { name: 'Save draft on this device', exact: true }).click();
  const stored = await page.evaluate(async () => {
    const data = await new Promise<unknown>((ok, no) => {
      const request = indexedDB.open('petqr-local-draft', 1);
      request.onerror = () => no(request.error);
      request.onsuccess = () => {
        const database = request.result,
          get = database.transaction('draft').objectStore('draft').get('current');
        get.onsuccess = () => {
          ok(get.result);
          database.close();
        };
      };
    });
    return JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
      draft: data,
    });
  });
  expect(stored).not.toContain(TEST_KEY);
  expect(await page.content()).not.toContain(TEST_KEY);
  await page.getByRole('button', { name: 'Disconnect GitHub', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Connect GitHub', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Connect GitHub', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('visitors cannot publish without a valid scoped key and unsupported broad keys never reach the API', async ({
  page,
}) => {
  const api = await interceptGitHub(page);
  await page.goto('editor/');
  await page.getByRole('button', { name: 'Save and publish', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Connect GitHub');
  const link = page.getByRole('link', {
    name: 'Create a limited access key in GitHub',
    exact: true,
  });
  await expect(link).toHaveAttribute('href', /contents=write/);
  await expect(link).toHaveAttribute('href', /expires_in=7/);
  await page.getByLabel('Temporary access key', { exact: true }).fill('ghp_broad_classic_key');
  await page
    .getByLabel('I selected only this repository and Contents: Read and write.', { exact: true })
    .check();
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.locator('[data-error]')).toContainText('fine-grained');
  expect(api.calls).toHaveLength(0);
  api.readOnly = true;
  await page.getByLabel('Temporary access key', { exact: true }).fill(TEST_KEY);
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.locator('[data-error]')).toContainText('does not have write access');
  expect(api.calls.every((c) => c.method === 'GET')).toBe(true);
  await expect(page.getByLabel('Temporary access key', { exact: true })).toHaveValue('');
});
test('newer remote edits are preserved and the owner sees a conflict without any upload', async ({
  page,
}) => {
  const api = await interceptGitHub(page);
  await page.goto('editor/');
  await connect(page);
  await expect(page.locator('#github-publishing')).toContainText('Connected as');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByLabel('Name', { exact: true }).fill('Local draft');
  api.advance('data/pets.json', new TextEncoder().encode('Newer independent owner changes'));
  await page.getByRole('button', { name: 'Save and publish', exact: true }).click();
  await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
  await expect(page.locator('[data-error]')).toContainText('Newer changes exist');
  expect(api.calls.every((c) => c.method === 'GET')).toBe(true);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Local draft');
});
