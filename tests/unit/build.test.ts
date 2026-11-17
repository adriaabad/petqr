import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSite } from '../../scripts/build';
import { parseConfig } from '../../src/shared/model';

test('personalized and empty repositories build without demo identities, and test builds preserve production', async () => {
  const root = await mkdtemp(join(tmpdir(), 'petqr-config-test-'));
  const production = await readFile('dist/data/config.json', 'utf8');
  try {
    await mkdir(join(root, 'data'));
    const config = parseConfig({
      version: 1,
      site: {
        title: 'Independent family',
        defaultLanguage: 'ca',
        publicUrl: 'https://family.example/pets',
        ownerIndex: false,
      },
      contacts: [],
      pets: [
        {
          id: 'independent-bird',
          shortId: 'a1b2c3d4',
          name: 'Pip',
          species: 'Bird',
          indexing: true,
        },
      ],
    });
    for (const name of ['version', 'site', 'contacts', 'pets'] as const)
      await writeFile(join(root, 'data', name + '.json'), JSON.stringify(config[name]));
    await buildSite({ dataRoot: root, output: '.test-site', environment: {} });
    const html = await readFile('.test-site/p/independent-bird/index.html', 'utf8');
    assert.match(html, /lang="ca"/);
    assert.match(html, />Pip<\/h1>/);
    assert.match(html, /index, follow/);
    assert.doesNotMatch(html, /Cooper|Luna|Mochi/);
    const shortHTML = await readFile('.test-site/p/a1b2c3d4/index.html', 'utf8');
    assert.equal(shortHTML, html);
    assert.match(shortHTML, /rel="canonical" href="https:\/\/family.example\/pets\/p\/a1b2c3d4\/"/);
    for (const path of ['independent-bird', 'a1b2c3d4']) {
      const profile = JSON.parse(await readFile(`.test-site/p/${path}/profile.json`, 'utf8'));
      assert.equal(profile.pets[0].id, 'independent-bird');
      assert.equal(profile.pets[0].shortId, 'a1b2c3d4');
    }
    assert.match(await readFile('.test-site/sitemap.xml', 'utf8'), /a1b2c3d4/);
    assert.doesNotMatch(await readFile('.test-site/sitemap.xml', 'utf8'), /independent-bird/);
    assert.doesNotMatch(await readFile('.test-site/index.html', 'utf8'), /Pip|independent-bird/);
    await writeFile(join(root, 'data/pets.json'), '[]');
    await buildSite({ dataRoot: root, output: '.test-site', environment: {} });
    assert.equal(
      await stat('.test-site/p/independent-bird/index.html').then(
        () => true,
        () => false,
      ),
      false,
    );
    assert.match(await readFile('.test-site/editor/index.html', 'utf8'), /editor.js/);
    await assert.rejects(readFile('.test-site/p/a1b2c3d4/index.html'));
    assert.equal(await readFile('dist/data/config.json', 'utf8'), production);
  } finally {
    // Verify the generated absolute temporary directory before recursive cleanup on Windows.
    if (
      dirname(resolve(root)) !== resolve(tmpdir()) ||
      !basename(root).startsWith('petqr-config-test-')
    )
      throw new Error('Unsafe temporary cleanup target.');
    await rm(root, { recursive: true, force: true });
  }
});
