import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  parseConfig,
  setValidationLanguage,
  petSchema,
  newPet,
  preserveProfileAddresses,
  fieldSchema,
  publicConfig,
  assertPublishable,
  petPath,
  publicPetURL,
  textOf,
  contactLink,
  resolvedContacts,
  explainError,
} from '../../src/shared/model';
import { renderProfile, renderIndex, htmlDocument } from '../../src/public/render';
import { qrSVG, qr3DSVG, validQRColors, tagSVG } from '../../src/editor/qr';
import { importArchive, exportArchive } from '../../src/editor/archive';
import { deployedURL } from '../../scripts/build';
import { strToU8, zipSync } from 'fflate';

const site = JSON.parse(await readFile('tests/fixtures/data/site.json', 'utf8')),
  contacts = JSON.parse(await readFile('tests/fixtures/data/contacts.json', 'utf8')),
  pets = JSON.parse(await readFile('tests/fixtures/data/pets.json', 'utf8'));
const fixture = () => parseConfig({ version: 1, site, contacts, pets });

test('new pet identifiers are short and skip existing identifiers and short routes', (context) => {
  const candidates = ['00000000', '11111111', '22222222'];
  context.mock.method(
    crypto,
    'randomUUID',
    () => `${candidates.shift()}-0000-4000-8000-000000000000`,
  );
  const pet = newPet([{ id: '00000000' }, { id: 'legacy-pet', shortId: '11111111' }]);
  assert.equal(pet.id, '22222222');
  assert.match(pet.id, /^[a-f0-9]{8}$/);
  assert.equal(pet.shortId, undefined);
});

test('short profile addresses preserve the logical identifier and reject route collisions', () => {
  const c = fixture();
  c.pets[0].shortId = 'c0ffee12';
  assert.equal(petPath(c.pets[0]), 'p/c0ffee12/');
  assert.equal(
    publicPetURL('https://owner.example/animals', c.pets[0]),
    'https://owner.example/animals/p/c0ffee12/',
  );
  assert.equal(c.pets[0].id, 'cooper-7f2a');
  assert.match(renderIndex(c, 'en'), /href="p\/c0ffee12\/"/);
  assert.equal(publicConfig(c).pets[0].shortId, 'c0ffee12');
  const oldDraft = fixture();
  oldDraft.pets[0].name = 'Edited in an older draft';
  const restored = preserveProfileAddresses(oldDraft, c);
  assert.equal(restored.pets[0].shortId, 'c0ffee12');
  assert.equal(restored.pets[0].name, 'Edited in an older draft');
  assert.equal(oldDraft.pets[0].shortId, undefined);
  c.pets[1].shortId = 'c0ffee12';
  assert.throws(() => parseConfig(c), /Duplicate profile path/);
  c.pets[1].shortId = c.pets[0].id;
  assert.throws(() => parseConfig(c), /Duplicate profile path/);
  for (const unsafe of ['../private', 'a/b', '<script>', 'TOOUPPER']) {
    c.pets[0].shortId = unsafe;
    assert.throws(() => parseConfig(c));
  }
});
test('validation diagnostics support Spanish and Catalan', () => {
  try {
    for (const language of ['es', 'ca'] as const) {
      setValidationLanguage(language);
      assert.throws(
        () => parseConfig({}),
        (error) =>
          explainError(error, language).includes(
            language === 'es' ? 'se esperaba' : 'Tipus invàlid',
          ),
      );
    }
  } finally {
    setValidationLanguage('en');
  }
});
test('examples contain three unique pets with three stable destinations', () => {
  const c = fixture();
  assert.equal(new Set(c.pets.map((p) => p.id)).size, 3);
  assert.equal(
    new Set(c.pets.map((p) => publicPetURL('https://owner.example/animals', p.id))).size,
    3,
  );
});
test('duplicate pet and contact IDs fail with useful paths', () => {
  for (const group of ['pets', 'contacts'] as const) {
    const c = fixture();
    c[group].push(c[group][0] as never);
    assert.throws(() => parseConfig(c), /Duplicate ID/);
  }
});
test('missing contact references are rejected', () => {
  const c = fixture();
  c.pets[0].contacts.push({ id: 'unknown-id' });
  assert.throws(() => parseConfig(c), /Unknown contact/);
});
test('ID traversal and reserved path characters are rejected', () => {
  for (const id of ['../secrets', 'Pet Name', 'a/b', '<script>', 'x'])
    assert.throws(() => petSchema.parse({ id, name: 'Test', species: '' }));
});
test('changes to name, breed and status preserve URL and QR destination', () => {
  const pet = fixture().pets[0],
    before = publicPetURL('https://owner.example/animals/', pet.id);
  pet.name = 'A completely new name';
  pet.breed = 'Mixed';
  pet.status = 'found';
  assert.equal(publicPetURL('https://owner.example/animals', pet.id), before);
  assert.equal(petPath(pet.id), 'p/cooper-7f2a/');
});
test('project repositories, user repositories and custom domains produce correct URLs', () => {
  for (const root of [
    'https://someone.github.io/project',
    'https://someone.github.io',
    'https://pet.example/shelter',
  ])
    assert.equal(publicPetURL(root, 'pet-123'), root + '/p/pet-123/');
});
test('unknown and localhost QR destinations are blocked', () => {
  for (const root of [
    '',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'javascript:alert(1)',
    'http://[::1]',
  ])
    assert.throws(() => publicPetURL(root, 'pet-123'));
});
test('legacy lost-pet settings no longer render badges, banners or loss instructions', () => {
  const c = fixture();
  const html = renderProfile(c, c.pets[1], 'en');
  assert.doesNotMatch(html, /This pet is missing|missing-banner|class="status/);
  assert.match(html, /tel:\+12025550188/);
  assert.doesNotMatch(html, /Please do not chase/);
  assert.doesNotMatch(renderIndex(c, 'en'), /class="status/);
});

test('microchip and registration are visible only after publication consent, with leading zeros preserved', () => {
  const c = fixture();
  c.pets[0].sections.push({
    id: 'identification',
    title: 'ID',
    fields: [
      fieldSchema.parse({ key: 'microchip', label: 'Chip', value: '000123456789012' }),
      fieldSchema.parse({ key: 'registration', label: 'Registry', value: 'REG-00042' }),
    ],
  });
  const fields = c.pets[0].sections.at(-1)!.fields;
  assert.doesNotMatch(renderProfile(c, c.pets[0], 'ca'), /000123456789012|REG-00042/);
  for (const f of fields) f.publish = true;
  assert.doesNotMatch(renderProfile(c, c.pets[0], 'ca'), /000123456789012|REG-00042/);
  for (const f of fields) f.consent = true;
  const html = renderProfile(publicConfig(c), c.pets[0], 'ca');
  assert.match(html, /Número de microxip/);
  assert.match(html, /Número de registre/);
  assert.equal((html.match(/000123456789012/g) || []).length, 1);
  assert.equal((html.match(/REG-00042/g) || []).length, 1);
});
test('minimal optional profile renders without a photo or contact', () => {
  const c = fixture(),
    pet = petSchema.parse({ id: 'minimal-pet', name: 'Bird', species: 'Bird' });
  assert.match(renderProfile(c, pet, 'en'), /No public contact is available/);
});

test('profiles use one standard appearance and no demonstration banner even with legacy settings', () => {
  const c = fixture(),
    pet = c.pets[0];
  pet.theme = { accent: '#ff0000', background: 'sand', icon: 'heart' };
  c.site.fictional = true;
  const html = renderProfile(c, pet, 'en');
  assert.doesNotMatch(html, /theme-sand|#ff0000|pet-decoration|Fictional examples|demo-note/);
  assert.doesNotMatch(renderIndex(c, 'en'), /Fictional examples|demo-note/);
});
test('translation fallback uses the configured language, then available content', () => {
  assert.equal(textOf({ ca: 'Hola' }, 'en', 'es'), 'Hola');
  assert.equal(textOf({ en: 'Hello', es: 'Hola' }, 'ca', 'es'), 'Hola');
  assert.equal(textOf(undefined, 'ca'), '');
});
test('unpublished fields and contacts are absent from publishable data', () => {
  const c = fixture();
  c.pets[0].sections[0].fields.push(
    fieldSchema.parse({
      key: 'private-note',
      label: 'Secret label',
      value: 'CONFIDENTIAL_SENTINEL',
    }),
  );
  c.contacts.push({
    ...c.contacts[0],
    id: 'private-person',
    name: 'PRIVATE_PERSON',
    publish: false,
  });
  c.pets[0].contacts.push({ id: 'private-person' });
  const safe = publicConfig(c);
  assert.doesNotMatch(
    JSON.stringify(safe),
    /CONFIDENTIAL_SENTINEL|Secret label|PRIVATE_PERSON|private-person/,
  );
  assert.throws(() => assertPublishable(c), /unpublished/);
  assert.doesNotThrow(() => assertPublishable(safe));
});
test('microchip and medical consent cannot be bypassed by sensitive:false', () => {
  const c = fixture();
  for (const [section, key] of [
    ['identification', 'microchip'],
    ['medical', 'custom-health'],
  ])
    c.pets[0].sections.push({
      id: section,
      title: 'Sensitive',
      fields: [
        fieldSchema.parse({
          key,
          label: 'Hidden',
          value: 'SENSITIVE_SENTINEL',
          publish: true,
          sensitive: false,
        }),
      ],
    });
  assert.doesNotMatch(JSON.stringify(publicConfig(c)), /SENSITIVE_SENTINEL/);
});
test('confirmed sensitive fields are exported only after publication is enabled', () => {
  const c = fixture(),
    field = fieldSchema.parse({
      key: 'microchip',
      label: 'Chip',
      value: 'CHIP_SENTINEL',
      publish: true,
      consent: true,
    });
  c.pets[0].sections.push({ id: 'identification', title: 'ID', fields: [field] });
  assert.match(JSON.stringify(publicConfig(c)), /CHIP_SENTINEL/);
  field.publish = false;
  assert.doesNotMatch(JSON.stringify(publicConfig(c)), /CHIP_SENTINEL/);
});
test('overrides inherit publication state and do not create hidden default values', () => {
  const c = fixture(),
    ref = c.pets[1].contacts[1];
  assert.deepEqual(ref.overrides, { preferred: 'email' });
  const resolved = resolvedContacts(c, c.pets[1]);
  assert.equal(resolved[1].preferred, 'email');
  assert.equal(resolved[1].name, c.contacts[0].name);
});
test('private overrides are removed from public exports', () => {
  const c = fixture();
  c.pets[0].contacts[0].overrides = { phone: '+1 202 555 0101', publish: false };
  assert.doesNotMatch(JSON.stringify(publicConfig(c)), /555 0101/);
});
test('contact links normalize phone and safely encode messages and email', () => {
  assert.equal(contactLink('phone', '+34 (600) 123-456'), 'tel:+34600123456');
  assert.equal(
    contactLink('whatsapp', '+34 600 123 456', 'Hi & hello?'),
    'https://wa.me/34600123456?text=Hi%20%26%20hello%3F',
  );
  assert.equal(contactLink('email', 'name+pet@example.com'), 'mailto:name%2Bpet@example.com');
});
test('unsafe links and unknown data are rejected rather than silently discarded', () => {
  const c = fixture();
  c.pets[0].sections[0].fields.push(
    fieldSchema.parse({ key: 'x', label: 'x', value: 'javascript:alert(1)', kind: 'link' }),
  );
  assert.throws(() => parseConfig(c), /HTTP/);
  assert.throws(() => parseConfig({ ...fixture(), unknown: 'secret' }), /Unrecognized key/);
  assert.throws(() => parseConfig({ ...fixture(), version: 2 }), /1/);
});
test('untrusted text is escaped in HTML, attributes and SVG labels', async () => {
  const c = fixture(),
    p = c.pets[0];
  p.name = '<img src=x onerror=alert(1)>';
  const html = renderProfile(c, p, 'en');
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img/);
  const svg = await qrSVG('https://example.com/', { label: '</text><script>alert(1)</script>' });
  assert.doesNotMatch(svg, /<script>/);
});
test('subdirectory assets are relative on static profiles', () => {
  const c = fixture();
  const html = renderProfile(c, c.pets[0], 'en');
  assert.match(html, /src="\.\.\/\.\.\/assets\/pets\/cooper.webp"/);
  assert.doesNotMatch(html, /src="\/assets/);
});
test('social metadata does not include contact or health data and defaults to noindex', () => {
  const html = htmlDocument('body', {
    title: 'Cooper · PetQR',
    lang: 'en',
    prefix: '../../',
    script: 'public.js',
  });
  assert.match(html, /noindex, nofollow/);
  assert.doesNotMatch(html, /555|allerg/);
});
test('disabled owner index does not list pet names', () => {
  const c = fixture();
  c.site.ownerIndex = false;
  assert.doesNotMatch(renderIndex(c, 'en'), /Cooper|Luna|Mochi/);
});
test('QR color constraints reject inversion and low contrast', async () => {
  assert.equal(validQRColors('#000000', '#ffffff'), true);
  assert.equal(validQRColors('#ffffff', '#000000'), false);
  await assert.rejects(
    qrSVG('https://example.com', { foreground: '#aaaaaa', background: '#ffffff' }),
    /contrast/,
  );
});
test('QR SVG preserves quiet zones and different routes yield distinct modules', async () => {
  const a = await qrSVG(publicPetURL('https://example.com', 'pet-one')),
    b = await qrSVG(publicPetURL('https://example.com', 'pet-two'));
  assert.notEqual(a, b);
  assert.match(a, /<svg/);
  assert.match(a, /viewBox/);
});
test('3D QR SVG exports filled closed modules at a physical size without a background', () => {
  const svg = qr3DSVG('https://example.com/p/cooper/', { sizeMm: 50, margin: 4 });
  assert.match(svg, /width="50mm" height="50mm"/);
  assert.match(svg, /<path fill="#000000" d="M\d+ \d+h\d+v1h-\d+z/);
  assert.doesNotMatch(svg, /stroke=|<rect|<text|fill="#ffffff"/);
  assert.notEqual(svg, qr3DSVG('https://example.com/p/luna/', { sizeMm: 50 }));
  assert.throws(() => qr3DSVG('https://example.com', { sizeMm: 20 }), /25–120/);
});
test('print tag has millimeter dimensions and escaped text', async () => {
  const qr = await qrSVG('https://example.com');
  const tag = tagSVG(qr, {
    width: 50,
    height: 50,
    shape: 'Circle',
    name: '<Pet>',
    phone: '',
    text: '',
  });
  assert.match(tag, /width="50mm"/);
  assert.match(tag, /&lt;Pet&gt;/);
  assert.throws(
    () => tagSVG(qr, { width: 20, height: 20, shape: 'Square', name: 'x', phone: '', text: '' }),
    /25 mm/,
  );
});
test('configuration errors identify a required name', () => {
  const c = fixture();
  c.pets[0].name = '';
  try {
    parseConfig(c);
    assert.fail('Expected validation error');
  } catch (error) {
    assert.match(explainError(error), /pets.0.name/);
  }
});
test('public URL from Pages metadata respects explicit custom domains', () => {
  const c = fixture();
  assert.equal(
    deployedURL(c, { PAGES_BASE_URL: 'https://u.github.io/r/' }),
    'https://u.github.io/r',
  );
  c.site.publicUrl = 'https://pet.example';
  assert.equal(deployedURL(c, { PAGES_BASE_URL: 'https://u.github.io/r' }), 'https://pet.example');
});
test('ZIP public export/import round trip keeps photo bytes and excludes local-only fields', async () => {
  const c = fixture();
  c.pets[0].sections[0].fields.push(
    fieldSchema.parse({ key: 'secret', label: 'Private', value: 'ZIP_SECRET' }),
  );
  const images = new Map<string, Uint8Array>();
  for (const p of c.pets)
    for (const image of p.photos)
      images.set(image.path, new Uint8Array(await readFile('tests/fixtures/' + image.path)));
  const zip = await exportArchive(c, images, new URL('https://example.com'));
  assert.doesNotMatch(new TextDecoder().decode(zip), /ZIP_SECRET/);
  const imported = importArchive(zip);
  assert.deepEqual(imported.config, publicConfig(c));
  assert.equal(imported.images.size, 3);
});
test('malformed ZIP and missing configuration are rejected', () => {
  assert.throws(() => importArchive(strToU8('not a zip')));
  assert.throws(() => importArchive(zipSync({ 'unexpected.json': strToU8('{}') })), /Missing data/);
});
