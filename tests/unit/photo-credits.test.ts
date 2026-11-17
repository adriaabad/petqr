import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { parseConfig, publicConfig, fieldSchema } from '../../src/shared/model';
import { exportArchive, importArchive } from '../../src/editor/archive';
import { photoCreditsText } from '../../src/shared/photo-credits';
import { renderProfile } from '../../src/public/render';

async function fixture() {
  const values = await Promise.all(
    ['version', 'site', 'contacts', 'pets'].map(async (name) =>
      JSON.parse(await readFile(`tests/fixtures/data/${name}.json`, 'utf8')),
    ),
  );
  const config = parseConfig(
    Object.fromEntries(
      ['version', 'site', 'contacts', 'pets'].map((name, index) => [name, values[index]]),
    ),
  );
  config.pets = [config.pets[0]];
  return config;
}
const credit = {
  author: 'ORIGINAL_AUTHOR',
  source: 'https://example.com/original-photo',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  changes: 'Cropped and re-encoded.',
};

test('photo authorship and license survive ZIP export/import and credits describe only retained photos', async () => {
  const config = await fixture(),
    image = config.pets[0].photos[0];
  image.credit = { ...credit };
  const bytes = new Uint8Array(await readFile('tests/fixtures/' + image.path));
  const zip = await exportArchive(
    config,
    new Map([[image.path, bytes]]),
    new URL('https://example.com/'),
  );
  const files = unzipSync(zip);
  assert.match(strFromU8(files['PHOTO_CREDITS.txt']), /ORIGINAL_AUTHOR/);
  assert.match(strFromU8(files['PHOTO_CREDITS.txt']), /CC BY 4.0/);
  assert.match(strFromU8(files['PHOTO_CREDITS.txt']), /Cropped and re-encoded/);
  assert.deepEqual(importArchive(zip).config.pets[0].photos[0].credit, credit);
  const oldPath = image.path;
  config.pets[0].photos = [{ path: 'assets/pets/my-photo.webp', alt: 'My photograph' }];
  const ownZip = await exportArchive(
    config,
    new Map([
      [oldPath, bytes],
      ['assets/pets/my-photo.webp', bytes],
    ]),
    new URL('https://example.com/'),
  );
  const ownFiles = unzipSync(ownZip),
    restored = importArchive(ownZip);
  assert.equal(ownFiles[oldPath], undefined);
  assert.equal(ownFiles['PHOTO_CREDITS.txt'], undefined);
  assert.equal(restored.config.pets[0].photos[0].credit, undefined);
  assert.doesNotMatch(renderProfile(config, config.pets[0], 'en'), /PHOTO_CREDITS.txt/);
});

test('credit URLs cannot contain executable schemes, and missing credit never implies CC0', async () => {
  const config = await fixture();
  config.pets[0].photos[0].credit = { ...credit, source: 'javascript:alert(1)' };
  assert.throws(() => parseConfig(config), /HTTP/);
  delete config.pets[0].photos[0].credit;
  assert.doesNotMatch(photoCreditsText(config), /CC0|ORIGINAL_AUTHOR/);
});

test('addresses and roaming areas require consent, while authorized outings display without a lost status', async () => {
  const config = await fixture(),
    pet = config.pets[0];
  pet.sections.push({
    id: 'location',
    title: 'Residence',
    fields: [
      fieldSchema.parse({
        key: 'homeAddress',
        label: 'Address',
        value: 'PRIVATE_ADDRESS_123',
        publish: true,
        sensitive: false,
      }),
      fieldSchema.parse({
        key: 'roamingArea',
        label: 'Area',
        value: 'PRIVATE_AREA_123',
        publish: true,
        sensitive: false,
      }),
      fieldSchema.parse({
        key: 'outdoorAccess',
        label: 'Outdoor access',
        value: 'May go out independently',
        publish: true,
      }),
    ],
  });
  assert.doesNotMatch(JSON.stringify(publicConfig(config)), /PRIVATE_ADDRESS_123|PRIVATE_AREA_123/);
  assert.doesNotMatch(renderProfile(config, pet, 'en'), /PRIVATE_ADDRESS_123|PRIVATE_AREA_123/);
  const residence = pet.sections.at(-1)!;
  residence.fields[0].consent = true;
  residence.fields[1].consent = true;
  const html = renderProfile(config, pet, 'en');
  assert.match(html, /residence-public/);
  assert.match(html, /PRIVATE_ADDRESS_123/);
  assert.match(html, /May go out independently/);
  assert.ok(html.indexOf('PRIVATE_ADDRESS_123') < html.indexOf('full-details'));
  assert.doesNotMatch(html, /class="status|missing-banner/);
});
