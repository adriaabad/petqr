import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  telegramSchema,
  parseConfig,
  publicConfig,
  explainError,
  fieldSchema,
} from '../../src/shared/model';
import { contactLink } from '../../src/shared/core';
import { profilePreview } from '../../src/shared/preview';
import { renderProfile } from '../../src/public/render';
const [site, contacts, pets] = await Promise.all(
  ['site', 'contacts', 'pets'].map(async (name) =>
    JSON.parse(await readFile(`tests/fixtures/data/${name}.json`, 'utf8')),
  ),
);
const fixture = () => parseConfig({ version: 1, site, contacts, pets });

test('example contacts retain call, WhatsApp and email actions on the QR profile', () => {
  const config = fixture();
  config.contacts = [
    {
      id: 'placeholder-contact',
      name: 'Alex Riu',
      phone: '00000000000',
      whatsapp: '+00 (000) 000-000',
      email: 'alex@example.invalid',
      preferred: 'phone',
      language: 'en',
      publish: true,
      consent: true,
    },
  ];
  config.pets[0].contacts = [{ id: 'placeholder-contact' }];
  const html = renderProfile(config, config.pets[0], 'en');
  assert.match(html, /href="tel:00000000000"/);
  assert.match(html, /href="https:\/\/wa.me\/00000000000"/);
  assert.match(html, /href="mailto:alex@example.invalid"/);
  assert.equal((html.match(/class="quick-contact"/g) || []).length, 1);
  assert.equal(contactLink('phone', '00000000000'), 'tel:00000000000');
  assert.equal(contactLink('whatsapp', '+00 (000) 000-000'), 'https://wa.me/00000000000');
  assert.equal(contactLink('email', 'Alex@EXAMPLE.INVALID'), 'mailto:Alex@EXAMPLE.INVALID');
  assert.equal(contactLink('email', 'alex@example.org'), 'mailto:alex@example.org');
  assert.equal(contactLink('phone', '+1 202 555 0101'), 'tel:+12025550101');
});

test('optional Telegram accepts blank, username, @username and public profile links', () => {
  for (const value of ['', ' ', '\t']) assert.equal(telegramSchema.parse(value), '');
  for (const value of [
    'person_123',
    '@person_123',
    ' @person_123 ',
    'https://t.me/person_123',
    't.me/person_123',
    'https://telegram.me/person_123/',
  ])
    assert.equal(telegramSchema.parse(value), 'person_123');
  assert.equal(contactLink('telegram', '@person_123'), 'https://t.me/person_123');
});
test('invalid Telegram gives instructions instead of exposing a regex', () => {
  for (const value of [
    '+34 600 123 456',
    '12345',
    'ab',
    'https://other.example/person_123',
    'https://t.me/+invite',
  ]) {
    const result = telegramSchema.safeParse(value);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(explainError(result.error), /Enter a Telegram username/);
      assert.doesNotMatch(explainError(result.error), /\^\$|pattern|patró/);
      assert.match(explainError(result.error, 'ca'), /Deixa-ho buit/);
    }
  }
});
test('photo preview tolerates an invalid contact and unrelated drafts without changing or exporting invalid data', () => {
  const draft = fixture();
  draft.contacts[0].telegram = '+34 600 123 456';
  draft.pets[1].name = '';
  draft.pets[0].sections[0].fields.push(
    fieldSchema.parse({ key: 'private', label: 'Private', value: 'DO_NOT_PUBLISH' }),
  );
  const before = JSON.stringify(draft),
    preview = profilePreview(draft, draft.pets[0].id);
  assert.equal(preview.config.pets.length, 1);
  assert.equal(preview.config.contacts[0].phone, draft.contacts[0].phone);
  assert.equal(preview.config.contacts[0].telegram, '');
  assert.deepEqual(preview.incompleteContacts, [draft.contacts[0].name]);
  assert.equal(JSON.stringify(draft), before);
  assert.doesNotMatch(JSON.stringify(preview.config), /DO_NOT_PUBLISH/);
  assert.throws(() => publicConfig(draft), /Telegram/);
});
test('invalid pet-specific Telegram overrides are omitted from preview without inheriting another username', () => {
  const draft = fixture();
  draft.contacts[0].telegram = 'shared_person';
  draft.pets[0].contacts[0].overrides = { telegram: 'invalid value' };
  const preview = profilePreview(draft, draft.pets[0].id);
  assert.equal(preview.config.pets[0].contacts[0].overrides?.telegram, '');
  assert.equal(draft.pets[0].contacts[0].overrides?.telegram, 'invalid value');
  draft.pets[0].contacts[0].overrides!.telegram = '@different_person';
  assert.equal(publicConfig(draft).pets[0].contacts[0].overrides?.telegram, 'different_person');
});
