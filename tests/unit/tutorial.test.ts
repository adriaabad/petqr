import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseConfig } from '../../src/shared/model';
import { renderTutorial } from '../../src/public/tutorial-view';
import { renderIndex, renderProfile } from '../../src/public/render';

const site = JSON.parse(await readFile('tests/fixtures/data/site.json', 'utf8'));
test('visual tutorial has six illustrated steps, template actions and no pet/contact payload', () => {
  const config = parseConfig({ version: 1, site, pets: [], contacts: [] });
  for (const lang of ['en', 'es', 'ca'] as const) {
    const html = renderTutorial(config.site, lang);
    assert.equal((html.match(/class="tutorial-step"/g) || []).length, 6);
    assert.equal((html.match(/class="tutorial-visual /g) || []).length, 6);
    assert.match(html, /template_owner=adriaabad&amp;template_name=petqr/);
    assert.match(html, /GitHub Actions/);
    assert.match(html, /\.github\/workflows\/pages\.yml/);
    assert.match(html, /Run workflow/);
    assert.match(html, /Jekyll/);
    assert.match(html, /href="#activate-pages"/);
    assert.equal((html.match(/class="tutorial-activation"/g) || []).length, 1);
    assert.match(html, /Commit changes/);
    assert.match(html, /href="\.\.\/editor\/"/);
    assert.doesNotMatch(html, /PHOTO_CREDITS.txt|Cooper|Luna|Mochi|contact-aina/);
  }
});
test('tutorial calls to action preserve root and nested hosting paths', () => {
  const config = parseConfig({
    version: 1,
    site,
    pets: [{ id: 'my-pet', name: 'My pet', species: 'Dog' }],
    contacts: [],
  });
  assert.match(renderIndex(config, 'ca'), /href="tutorial\/">Vull el meu PetQR/);
  assert.match(
    renderProfile(config, config.pets[0], 'es'),
    /href="\.\.\/\.\.\/tutorial\/">Quiero mi PetQR/,
  );
  const url = new URL('../../tutorial/', 'https://owner.example/pets/p/my-pet/');
  assert.equal(url.href, 'https://owner.example/pets/tutorial/');
});
