import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GitHubPublisher, blobSHA } from '../src/github';
import { parseConfig, fieldSchema } from '../src/model';
import { publicFiles } from '../src/public-files';
import { DATA_PATHS, parseDeployment, tokenCreationURL } from '../src/deployment';
import { fakeGitHub, hash, TEST_KEY } from './fake-github';

const [site, contacts, pets] = await Promise.all(
  ['site', 'contacts', 'pets'].map(async (name) =>
    JSON.parse(await readFile(`tests/fixtures/data/${name}.json`, 'utf8')),
  ),
);
const fixture = () => parseConfig({ version: 1, site, contacts, pets });
async function setup() {
  const config = fixture(),
    images = new Map<string, Uint8Array>();
  for (const pet of config.pets)
    for (const photo of pet.photos)
      images.set(photo.path, new Uint8Array(await readFile('tests/fixtures/' + photo.path)));
  const files = await publicFiles(config, images, new URL('https://example.com/'));
  files['src/unrelated.ts'] = new TextEncoder().encode('Keep application code');
  const api = fakeGitHub(files),
    publisher = new GitHubPublisher(api.fetch as typeof fetch);
  return { config, images, files, api, publisher, deployment: api.deployment() };
}
test('Git blob hashing matches GitHub for UTF-8 and binary files', async () => {
  for (const bytes of [new TextEncoder().encode('Hola, món!'), new Uint8Array([0, 255, 123])])
    assert.equal(await blobSHA(bytes), hash(bytes));
});
test('publication metadata and key creation links contain only public settings', async () => {
  const { deployment } = await setup();
  assert.deepEqual(parseDeployment(deployment), deployment);
  const url = new URL(tokenCreationURL('petqr-tests/pets'));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.searchParams.get('contents'), 'write');
  assert.equal(url.searchParams.get('expires_in'), '7');
  assert.equal(url.searchParams.get('target_name'), 'petqr-tests');
  assert.throws(() => tokenCreationURL('../evil'));
  assert.throws(() => parseDeployment({ ...deployment, dataShas: {} }), /Reload/);
});
test('broad keys and other repository targets are rejected before any network request', async () => {
  const { publisher, api, deployment } = await setup();
  await assert.rejects(
    publisher.connect('ghp_broad_key', 'petqr-tests/pets', deployment),
    /fine-grained/,
  );
  await assert.rejects(
    publisher.connect(TEST_KEY, 'other-owner/other-repo', deployment),
    /repository that published/,
  );
  assert.equal(api.calls.length, 0);
});
test('invalid credentials and accounts without write access cannot connect or publish', async () => {
  for (const mode of ['invalidKey', 'readOnly'] as const) {
    const { publisher, api, deployment } = await setup();
    api[mode] = true;
    await assert.rejects(publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment));
    assert.equal(publisher.connection, null);
    assert.ok(api.calls.every((call) => call.method === 'GET'));
  }
});
test('nothing is written when public data has no changes', async () => {
  const { publisher, api, deployment, config, images } = await setup();
  await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
  assert.equal(
    await publisher.publish(await publicFiles(config, images, new URL('https://example.com'))),
    null,
  );
  assert.ok(api.calls.every((call) => call.method === 'GET'));
});
test('public data and new photos publish atomically while preserving unrelated source files', async () => {
  const { publisher, api, deployment, config, images } = await setup();
  await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
  api.advance('src/unrelated.ts', Buffer.from('Keep newer code'));
  config.pets[0].name = 'Updated pet';
  config.pets[0].photos.push({ path: 'assets/pets/new.webp', alt: 'New photo' });
  images.set('assets/pets/new.webp', new Uint8Array([1, 2, 3]));
  config.pets[0].sections[0].fields.push(
    fieldSchema.parse({ key: 'private', label: 'Private', value: 'PRIVATE_SENTINEL' }),
  );
  const publication = await publisher.publish(
    await publicFiles(config, images, new URL('https://example.com')),
  );
  assert.ok(publication);
  assert.match(new TextDecoder().decode(api.files['data/pets.json']), /Updated pet/);
  assert.doesNotMatch(new TextDecoder().decode(api.files['data/pets.json']), /PRIVATE_SENTINEL/);
  assert.equal(new TextDecoder().decode(api.files['src/unrelated.ts']), 'Keep newer code');
  assert.deepEqual([...api.files['assets/pets/new.webp']], [1, 2, 3]);
  const patches = api.calls.filter((c) => c.method === 'PATCH');
  assert.equal(patches.length, 1);
  assert.equal(patches[0].body.force, false);
  assert.equal(
    api.calls.filter((c) => c.path.endsWith('/git/commits') && c.method === 'POST').length,
    1,
  );
  for (const call of api.calls) {
    assert.equal(call.options.credentials, 'omit');
    assert.equal(call.options.redirect, 'error');
    assert.ok(!call.path.includes(TEST_KEY));
  }
  assert.ok(!JSON.stringify(publisher.connection).includes(TEST_KEY));
  assert.ok(!JSON.stringify(publisher).includes(TEST_KEY));
  assert.ok(!JSON.stringify(api.files).includes(TEST_KEY));
});
test('stale deployed data blocks connection before writing', async () => {
  const { publisher, api, deployment } = await setup();
  api.advance('data/pets.json', Buffer.from('Newer owner data'));
  await assert.rejects(
    publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment),
    /Newer changes/,
  );
  assert.ok(api.calls.every((call) => call.method === 'GET'));
});
test('remote edits after connection stop a save before any blob upload', async () => {
  const { publisher, api, deployment, config, images } = await setup();
  await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
  api.advance('data/pets.json', Buffer.from('Newer owner data'));
  config.pets[0].name = 'Local changes';
  await assert.rejects(
    publisher.publish(await publicFiles(config, images, new URL('https://example.com'))),
    /Newer changes/,
  );
  assert.ok(api.calls.every((call) => call.method === 'GET'));
});
test('independent remote photo edits are not overwritten even when JSON is unchanged', async () => {
  const { publisher, api, deployment, config, images } = await setup();
  await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
  api.advance('assets/pets/cooper.webp', Buffer.from('New owner photo'));
  config.pets[0].name = 'Local name';
  await assert.rejects(
    publisher.publish(await publicFiles(config, images, new URL('https://example.com'))),
    /Newer changes/,
  );
  assert.ok(api.calls.every((call) => call.method === 'GET'));
});
test('an imported photo cannot overwrite a different source image without a baseline', async () => {
  const { publisher, api, deployment, config, images } = await setup();
  await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
  api.advance('assets/pets/archived.webp', Buffer.from('Existing archived photo'));
  config.pets[0].photos.push({ path: 'assets/pets/archived.webp', alt: 'Imported' });
  images.set('assets/pets/archived.webp', Buffer.from('Different imported photo'));
  await assert.rejects(
    publisher.publish(await publicFiles(config, images, new URL('https://example.com'))),
    /Newer changes/,
  );
  assert.ok(api.calls.every((call) => call.method === 'GET'));
});
test('races during upload never move the branch or force an overwrite', async () => {
  for (const mode of ['race', 'patchConflict'] as const) {
    const { publisher, api, deployment, config, images } = await setup();
    await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
    const original = api.head;
    api[mode] = true;
    config.pets[0].name = 'Local changes';
    await assert.rejects(
      publisher.publish(await publicFiles(config, images, new URL('https://example.com'))),
      /Newer changes/,
    );
    assert.ok(api.calls.filter((c) => c.method === 'PATCH').every((c) => c.body.force === false));
    if (mode === 'patchConflict') assert.equal(api.head, original);
  }
});
test('private raw data, unreferenced images, source-code paths and embedded credentials are never uploaded', async () => {
  for (const mode of ['private', 'image', 'source', 'key'] as const) {
    const { publisher, api, deployment, config, images } = await setup();
    await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
    let files = await publicFiles(config, images, new URL('https://example.com'));
    if (mode === 'private') {
      config.pets[0].sections[0].fields.push(
        fieldSchema.parse({ key: 'private', label: 'Private', value: 'PRIVATE_SENTINEL' }),
      );
      files['data/pets.json'] = new TextEncoder().encode(JSON.stringify(config.pets));
    }
    if (mode === 'image') files['assets/pets/not-selected.webp'] = new Uint8Array([1]);
    if (mode === 'source') files['src/main.ts'] = new Uint8Array([1]);
    if (mode === 'key') {
      config.site.title = TEST_KEY;
      files = await publicFiles(config, images, new URL('https://example.com'));
    }
    await assert.rejects(publisher.publish(files));
    assert.ok(api.calls.every((c) => c.method === 'GET'));
  }
});
test('write permission failures do not update the branch and do not reveal the credential', async () => {
  const { publisher, api, deployment, config, images } = await setup();
  await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
  api.denyWrite = true;
  config.pets[0].name = 'Updated';
  const head = api.head;
  await assert.rejects(
    publisher.publish(await publicFiles(config, images, new URL('https://example.com'))),
    (error) =>
      error instanceof Error &&
      error.message.includes('denied') &&
      !error.message.includes(TEST_KEY),
  );
  assert.equal(api.head, head);
});
test('disconnect and session expiry prevent further authenticated requests', async () => {
  const { api, deployment } = await setup();
  let now = 1000;
  const publisher = new GitHubPublisher(api.fetch as typeof fetch, () => now);
  await publisher.connect(TEST_KEY, 'petqr-tests/pets', deployment);
  now += 31 * 60 * 1000;
  const count = api.calls.length;
  assert.equal(publisher.connection, null);
  await assert.rejects(publisher.publish({}), /expired/);
  assert.equal(api.calls.length, count);
  publisher.disconnect();
  assert.equal(publisher.connection, null);
  assert.ok(DATA_PATHS.every((path) => deployment.dataShas[path]));
});
