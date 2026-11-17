import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { parseConfig } from '../../src/shared/model';
import { exportArchive, importArchive } from '../../src/editor/archive';
import { publicationGuide, repositoryURL, templateURL } from '../../src/shared/publishing';
import { icon } from '../../src/editor/icons';
import { paw } from '../../src/public/render';

test('publication links use the independent repository, including root Pages sites, and reject misleading hosts', () => {
  assert.equal(
    repositoryURL('https://family.github.io/animals/'),
    'https://github.com/family/animals',
  );
  assert.equal(
    repositoryURL('https://family.github.io/'),
    'https://github.com/family/family.github.io',
  );
  for (const input of [
    'https://pets.example/animals',
    'https://family.github.io.evil.example/animals',
    'https://github.io/animals',
    'https://user:pass@family.github.io/animals',
    'https://family.github.io/a/b',
    'https://family.github.io/animals?owner=other',
    'javascript:alert(1)',
  ]) {
    assert.equal(repositoryURL(input), undefined, input);
  }
  const guide = publicationGuide('https://family.github.io/animals/', 'ca', true);
  assert.match(guide, /https:\/\/github.com\/family\/animals\/settings\/pages/);
  assert.match(guide, /https:\/\/github.com\/family\/animals\/actions\/workflows\/pages.yml/);
  assert.match(guide, /template_owner=adriaabad&amp;template_name=petqr/);
  assert.match(guide, /GitHub Actions/);
  assert.match(guide, /Use this template/);
  assert.match(guide, /PUBLISHING.txt/);
  assert.equal(new URL(templateURL).searchParams.get('visibility'), 'public');
});

test('localized ZIP instructions and photo focus survive export/import without changing profile addresses', async () => {
  const values = await Promise.all(
    ['version', 'site', 'contacts', 'pets'].map(
      async (key) =>
        [key, JSON.parse(await readFile(`tests/fixtures/data/${key}.json`, 'utf8'))] as const,
    ),
  );
  const config = parseConfig(Object.fromEntries(values));
  config.pets = [config.pets[0]];
  config.site.publicUrl = 'https://independent.github.io/animals';
  config.pets[0].photos = [config.pets[0].photos[0]];
  config.pets[0].photos[0].focus = { x: 45, y: 15 };
  const photo = config.pets[0].photos[0];
  const images = new Map([
    [photo.path, new Uint8Array(await readFile('tests/fixtures/' + photo.path))],
  ]);
  const zip = await exportArchive(config, images, new URL(config.site.publicUrl), 'ca');
  const files = unzipSync(zip);
  const instructions = strFromU8(files['PUBLISHING.txt']);
  assert.match(instructions, /Crear i publicar la teva web/);
  assert.match(instructions, /https:\/\/github.com\/independent\/animals/);
  assert.match(instructions, /No pugis el ZIP directament/);
  assert.match(instructions, /Settings → Pages/);
  assert.match(instructions, /Commit changes/);
  const restored = importArchive(zip).config;
  assert.deepEqual(restored.pets[0].photos[0].focus, photo.focus);
  assert.equal(restored.pets[0].id, config.pets[0].id);
  assert.equal(restored.pets[0].shortId, config.pets[0].shortId);
  assert.throws(() =>
    parseConfig({
      ...config,
      pets: [{ ...config.pets[0], photos: [{ ...photo, focus: { x: 50, y: -1 } }] }],
    }),
  );
});

test('My pets uses the same paw geometry and orientation as the brand', () => {
  assert.equal(icon('pets').replace(' width="21" height="21"', ''), paw);
});
