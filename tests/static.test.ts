import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { parseConfig, petPath } from '../src/model';
const config = parseConfig(JSON.parse(await readFile('dist/data/config.json', 'utf8')));

test('static distribution includes project and dependency license notices', async () => {
  assert.match(await readFile('dist/LICENSE.txt', 'utf8'), /MIT License/);
  const licenses = await readFile('dist/THIRD_PARTY_LICENSES.txt', 'utf8');
  for (const name of ['qrcode', 'fflate', 'zod']) assert.ok(licenses.includes(name));
});
test('publishing metadata contains source file hashes, and the editor restricts credential network destinations', async () => {
  const metadata = JSON.parse(await readFile('dist/data/deployment.json', 'utf8'));
  for (const path of [
    'data/version.json',
    'data/site.json',
    'data/contacts.json',
    'data/pets.json',
  ])
    assert.match(metadata.dataShas[path], /^[a-f0-9]{40}$/);
  assert.doesNotMatch(
    JSON.stringify(metadata),
    /access_token|client_secret|authorization|github_pat_/i,
  );
  const editor = await readFile('dist/editor/index.html', 'utf8');
  assert.match(editor, /Content-Security-Policy/);
  assert.match(editor, /connect-src 'self' https:\/\/api.github.com/);
  assert.match(editor, /object-src 'none'/);
});
test('all configured standalone routes have HTML, metadata, assets and scoped JSON', async () => {
  for (const pet of config.pets) {
    const path = resolve('dist', petPath(pet.id), 'index.html'),
      html = await readFile(path, 'utf8');
    assert.match(html, /<h1>/);
    assert.ok(html.includes(pet.indexing ? 'index, follow' : 'noindex, nofollow'));
    assert.ok(html.includes('petqr-id" content="' + pet.id));
    for (const match of html.matchAll(
      /(?:src="([^"#]+\.(?:js|webp|jpg|jpeg|png|svg))"|href="([^"#]+\.css)")/g,
    )) {
      const source = match[1] || match[2];
      if (/^https?:/.test(source)) continue;
      const asset = resolve(dirname(path), source);
      assert.equal((await stat(asset)).isFile(), true, asset);
    }
    const data = JSON.parse(await readFile(resolve(dirname(path), 'profile.json'), 'utf8'));
    assert.equal(data.pets.length, 1);
    assert.equal(data.pets[0].id, pet.id);
    assert.ok(
      data.contacts.every((c: { id: string }) => pet.contacts.some((ref) => ref.id === c.id)),
    );
    assert.doesNotMatch(html, /<script[^>]+src="https?:|<link[^>]+href="https?:[^>]+stylesheet/);
    assert.doesNotMatch(html, /editor.js/);
  }
  const directories = await readdir('dist/p').catch(() => []);
  assert.deepEqual(directories.sort(), config.pets.map((p) => p.id).sort());
});
test('public build has editor and includes only explicitly indexed pet URLs in sitemap', async () => {
  assert.ok((await readFile('dist/editor/index.html', 'utf8')).includes('assets/editor.js'));
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const pet of config.pets) {
    const listed = sitemap.includes('/p/' + pet.id + '/');
    assert.equal(listed, pet.indexing && Boolean(config.site.publicUrl));
  }
});
test('public enhancement never bundles the editor, QR library or runtime validator', async () => {
  const modules = await readdir('dist/assets'),
    shared = modules.filter((f) => f.startsWith('shared-'));
  assert.ok(shared.length);
  for (const file of shared) {
    const content = await readFile('dist/assets/' + file, 'utf8');
    assert.ok(content.length < 50000, 'Public shared bundle too large: ' + content.length);
    assert.doesNotMatch(content, /ZodError|QRMaskPattern/);
  }
});
