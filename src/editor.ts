import {
  parseConfig,
  setValidationLanguage,
  publicConfig,
  explainError,
  newPet,
  petSchema,
  contactSchema,
  fieldSchema,
  needsConsent,
  textOf,
  petPath,
  type Config,
  type Pet,
  type Contact,
  type Language,
  type Localized,
  type Field,
} from './model';
import { preferredLanguage, t } from './i18n';
import { brand, controls, status, photo, esc, renderProfile } from './render';
import { bindPreferences, toast } from './preferences';
import { fields, categoryNames, tri } from './fields';
import { openQR } from './qr';
import { processImage } from './images';
import { exportArchive, importArchive, type ImageFiles } from './archive';
import { download } from './download';
import { draftStore } from './draft';
import { icon } from './icons';

const base = new URL(/* @vite-ignore */ '../', import.meta.url);
let config: Config,
  original: Config,
  lang: Language = 'en',
  contentLang: Language = 'en';
let screen: 'pets' | 'contacts' | 'settings' | 'help' | 'edit' = 'pets',
  selected = '',
  advanced = false,
  dirty = false,
  previewCSS = '';
let images: ImageFiles = new Map();
const imageURLs = new Map<string, string>();
const binding = new Map<string, (value: string | boolean) => void>(),
  actions = new Map<string, () => void | Promise<void>>();
let counter = 0,
  previewTimer: ReturnType<typeof setTimeout>;
const tr = (key: string) => t(key, lang);
const local = (value: Localized | undefined) => textOf(value, lang, config.site.defaultLanguage);
function bind(fn: (value: string | boolean) => void) {
  const id = `b${counter++}`;
  binding.set(id, fn);
  return `data-bind="${id}"`;
}
function action(fn: () => void | Promise<void>) {
  const id = `a${counter++}`;
  actions.set(id, fn);
  return `data-action="${id}"`;
}
function button(label: string, fn: () => void | Promise<void>, classes = '') {
  return `<button type="button" class="button ${classes}" ${action(fn)}>${esc(tr(label))}</button>`;
}
function input(
  label: string,
  value: string,
  fn: (value: string) => void,
  options: { type?: string; hint?: string; required?: boolean; max?: number } = {},
) {
  const id = `input-${counter++}`;
  return `<div class="form-control"><label for="${id}">${esc(tr(label))}</label><input id="${id}" type="${options.type || 'text'}" value="${esc(value)}" ${bind((v) => fn(String(v)))} ${options.required ? 'required' : ''} maxlength="${options.max || 1000}" ${options.hint ? `aria-describedby="${id}-hint"` : ''}>${options.hint ? `<span id="${id}-hint" class="hint">${esc(tr(options.hint))}</span>` : ''}</div>`;
}
function check(label: string, value: boolean, fn: (value: boolean) => void) {
  return `<label class="check"><input type="checkbox" ${value ? 'checked' : ''} ${bind((v) => fn(Boolean(v)))}>${esc(tr(label))}</label>`;
}
function select(
  label: string,
  value: string,
  options: { value: string; label: string }[],
  fn: (value: string) => void,
) {
  const id = `select-${counter++}`;
  return `<div class="form-control"><label for="${id}">${esc(tr(label))}</label><select id="${id}" ${bind((v) => fn(String(v)))}>${options.map((o) => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(tr(o.label))}</option>`).join('')}</select></div>`;
}
function textInput(
  label: string,
  value: Localized | undefined,
  fn: (value: Localized) => void,
  area = false,
) {
  const current = typeof value === 'string' ? value : value?.[contentLang] || '';
  const attr = bind((v) =>
    fn(
      typeof value === 'string' && contentLang === config.site.defaultLanguage
        ? String(v)
        : {
            ...(typeof value === 'string' ? { [config.site.defaultLanguage]: value } : value || {}),
            [contentLang]: String(v),
          },
    ),
  );
  return `<label>${esc(tr(label))}${area ? `<textarea ${attr} maxlength="10000">${esc(current)}</textarea>` : `<input ${attr} maxlength="1000" value="${esc(current)}">`}</label>`;
}
function move<T>(items: T[], index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= items.length) return;
  [items[index], items[next]] = [items[next], items[index]];
  dirty = true;
  render();
}
function mark() {
  dirty = true;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(updatePreview, 350);
}
function showError(error: unknown) {
  const box = document.getElementById('errors');
  if (box) {
    box.textContent = `${tr('Validation errors')}\n${explainError(error, lang)}`;
    box.scrollIntoView({ block: 'nearest' });
  } else toast(explainError(error, lang));
}
function clearErrors() {
  document.getElementById('errors')?.replaceChildren();
}
function currentPet() {
  return config.pets.find((p) => p.id === selected)!;
}
function imageURL(path: string) {
  if (images.has(path) && !imageURLs.has(path)) {
    const extension = path.split('.').pop();
    imageURLs.set(
      path,
      URL.createObjectURL(
        new Blob([images.get(path)! as BlobPart], {
          type:
            extension === 'webp' ? 'image/webp' : extension === 'png' ? 'image/png' : 'image/jpeg',
        }),
      ),
    );
  }
  return imageURLs.get(path) || new URL(path, base).href;
}
function replaceImages(html: string) {
  for (const [path] of images) html = html.replaceAll(esc(base.href + path), esc(imageURL(path)));
  return html;
}
function shell(content: string) {
  const nav: [typeof screen, string][] = [
    ['pets', 'My pets'],
    ['contacts', 'Contacts'],
    ['settings', 'Site settings'],
    ['help', 'Help'],
  ];
  return `<div class="app-shell"><aside class="sidebar">${brand(base.href)}<nav aria-label="PetQR">${nav
    .map(
      ([key, label]) =>
        `<button class="nav-button ${screen === key || (key === 'pets' && screen === 'edit') ? 'active' : ''}" ${screen === key ? 'aria-current="page"' : ''} ${action(
          () => {
            screen = key;
            render();
          },
        )}><span class="nav-symbol">${icon(key)}</span>${tr(label)}</button>`,
    )
    .join(
      '',
    )}</nav><p class="sidebar-note">${tr('Local only. Nothing is uploaded automatically.')}</p></aside><main class="app-main" id="main"><div class="topbar"><span class="context">PetQR / ${tr('Local editor')}</span>${controls(lang)}</div><div id="errors" class="error-box" role="alert"></div>${content}</main></div><div class="toast" role="status" aria-live="polite" id="toast"></div>`;
}
function exportStrip() {
  return `<div class="export-strip"><div><strong>${tr('Changes stay on this device. Export when you’re ready.')}</strong><p>${tr('Only selected public fields are exported. Unpublished fields remain in this browser session.')}</p></div>${button('Export files', openExport)}</div>`;
}
function dashboard() {
  return `<div class="page-heading"><div><h1>${tr('A little tag. A way home.')}</h1><p>${tr('Your pets, their people, always connected.')}</p></div>${button(
    'Add pet',
    () => {
      const pet = newPet();
      pet.name = lang === 'en' ? 'New pet' : lang === 'es' ? 'Nuevo animal' : 'Animal nou';
      config.pets.push(pet);
      selected = pet.id;
      screen = 'edit';
      dirty = true;
      render();
    },
    'primary',
  )}</div>${config.site.fictional ? `<p class="demo-note">${tr('Fictional examples. Replace all demo data before publishing.')}</p>` : ''}<div class="pet-grid">${config.pets
    .map(
      (pet, index) =>
        `<article class="pet-card"><a class="card-photo" href="${new URL(petPath(pet.id), base).href}">${replaceImages(photo(pet, lang, base.href, index > 2))}</a><div class="card-body"><div class="name-row"><h2>${esc(pet.name)}</h2>${status(pet, lang)}</div><p class="species">${esc(local(pet.species) || '—')}</p><div class="card-actions"><a class="button primary" href="${new URL(petPath(pet.id), base).href}">${tr('View profile')} ↗</a>${button('QR code', () => openQR(config, pet, lang))}${button(
          'Edit',
          () => {
            selected = pet.id;
            screen = 'edit';
            render();
          },
        )}</div></div><div class="card-tools">${button(
          'Duplicate',
          () => {
            const duplicate = structuredClone(pet);
            duplicate.id = `pet-${crypto.randomUUID()}`;
            duplicate.name += ' (2)';
            config.pets.splice(index + 1, 0, duplicate);
            dirty = true;
            render();
          },
          'subtle',
        )}${button(
          'Delete',
          () => {
            if (
              confirm(
                tr(
                  'Delete this pet? Existing physical QR tags will stop working after you deploy.',
                ),
              )
            ) {
              config.pets.splice(index, 1);
              dirty = true;
              render();
            }
          },
          'subtle danger',
        )}${index > 0 ? button('Move up', () => move(config.pets, index, -1), 'subtle') : ''}${index < config.pets.length - 1 ? button('Move down', () => move(config.pets, index, 1), 'subtle') : ''}</div></article>`,
    )
    .join(
      '',
    )}</div>${!config.pets.length ? `<p class="empty">${tr('No pets yet. Add your first companion.')}</p>` : ''}${exportStrip()}`;
}
function section(title: string, content: string, id: string, open = false) {
  return `<details data-section="${esc(id)}" ${open ? 'open' : ''}><summary>${esc(title)}</summary><div class="section-content">${content}</div></details>`;
}
function editor() {
  const pet = currentPet();
  if (!pet) {
    screen = 'pets';
    return dashboard();
  }
  const identity = `<div class="form-grid">${input('Name', pet.name, (v) => (pet.name = v), { required: true, max: 100 })}${textInput('Species', pet.species, (v) => (pet.species = v))}${textInput('Breed', pet.breed, (v) => (pet.breed = v))}<div class="wide">${textInput('Introduction', pet.introduction, (v) => (pet.introduction = v), true)}</div><div class="wide"><label>${tr('Stable ID')}<code>${esc(pet.id)}</code><span class="hint">${tr('Keep this ID unchanged once a tag is printed.')}</span></label></div></div>`;
  const emergency = `${select(
    'Status',
    pet.status,
    ['safe', 'missing', 'found', 'custom'].map((v) => ({
      value: v,
      label: v[0].toUpperCase() + v.slice(1),
    })),
    (v) => {
      pet.status = v as Pet['status'];
      render();
    },
  )}${textInput('Custom status', pet.statusLabel, (v) => (pet.statusLabel = v))}${textInput('Emergency message', pet.emergency, (v) => (pet.emergency = v), true)}<p class="hint">${tr('Emergency instructions stay visible in compact view.')}</p>`;
  const orderedContacts = [
    ...pet.contacts.map((ref) => config.contacts.find((c) => c.id === ref.id)!).filter(Boolean),
    ...config.contacts.filter((c) => !pet.contacts.some((ref) => ref.id === c.id)),
  ];
  const contactContent = `<p class="hint">${tr('Shared contacts are reused across pets. Order assigned contacts by emergency priority.')}</p>${
    orderedContacts.length
      ? orderedContacts
          .map((c) => {
            const index = pet.contacts.findIndex((ref) => ref.id === c.id);
            const ref = pet.contacts[index];
            return `<div class="assigned-contact">${check(c.name, index >= 0, (value) => {
              if (value) pet.contacts.push({ id: c.id });
              else pet.contacts.splice(index, 1);
              render();
            })}${
              ref
                ? `<div class="row">${index > 0 ? button('Move up', () => move(pet.contacts, index, -1)) : ''}${index < pet.contacts.length - 1 ? button('Move down', () => move(pet.contacts, index, 1)) : ''}${button(
                    ref.overrides ? 'Use shared details' : 'Override for this pet',
                    () => {
                      if (ref.overrides) delete ref.overrides;
                      else ref.overrides = {};
                      render();
                    },
                  )}</div>${ref.overrides ? `<div class="form-grid">${input('Contact name', ref.overrides.name ?? c.name, (v) => (ref.overrides!.name = v))}${input('Telephone', ref.overrides.phone ?? c.phone ?? '', (v) => (ref.overrides!.phone = v), { type: 'tel' })}${input('WhatsApp', ref.overrides.whatsapp ?? c.whatsapp ?? '', (v) => (ref.overrides!.whatsapp = v), { type: 'tel' })}${input('Email', ref.overrides.email ?? c.email ?? '', (v) => (ref.overrides!.email = v), { type: 'email' })}${select('Preferred method', ref.overrides.preferred ?? c.preferred, contactMethods(), (v) => (ref.overrides!.preferred = v as Contact['preferred']))}</div>` : ''}`
                : ''
            }</div>`;
          })
          .join('')
      : `<p>${tr('No contacts yet. Add one in Contacts.')}</p>`
  }`;
  const photoContent = `<p class="hint">${tr('Photos are processed on this device. Maximum 15 MB per file; exported at up to 1200 px.')}</p>${button('Add photo', () => choosePhoto(pet))}<div class="photos-list">${pet.photos
    .map(
      (p, i) =>
        `<div class="photo-item"><img src="${esc(imageURL(p.path))}" alt="${esc(local(p.alt))}">${textInput('Alternative text', p.alt, (v) => (p.alt = v))}<div class="row">${
          i === 0
            ? `<strong class="small">${tr('Featured')}</strong>`
            : button('Make featured', () => {
                pet.photos.splice(i, 1);
                pet.photos.unshift(p);
                dirty = true;
                render();
              })
        }${i > 0 ? button('Move up', () => move(pet.photos, i, -1)) : ''}${i < pet.photos.length - 1 ? button('Move down', () => move(pet.photos, i, 1)) : ''}${button(
          'Remove',
          () => {
            pet.photos.splice(i, 1);
            dirty = true;
            render();
          },
          'danger',
        )}</div></div>`,
    )
    .join('')}</div>`;
  const appearance = `<div class="form-grid">${input('Accent color', pet.theme.accent, (v) => (pet.theme.accent = v), { type: 'color' })}${select(
    'Background',
    pet.theme.background,
    ['sage', 'sand', 'sky'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
    (v) => (pet.theme.background = v as Pet['theme']['background']),
  )}${select(
    'Decorative icon',
    pet.theme.icon,
    ['paw', 'heart', 'none'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
    (v) => (pet.theme.icon = v as Pet['theme']['icon']),
  )}</div>${check('Allow search indexing', pet.indexing, (v) => {
    if (!v || confirm(tr('Public information. Share only what you are comfortable publishing.')))
      pet.indexing = v;
    else render();
  })}`;
  return `<div class="page-heading"><div><div class="row">${button(
    'Back',
    () => {
      screen = 'pets';
      render();
    },
    'subtle',
  )}<h1 style="font-size:1.7rem">${tr('Edit pet')} · ${esc(pet.name)}</h1></div></div>${button('Export files', openExport, 'primary')}</div><div class="row spread editor-toolbar"><div class="mode-switch">${button(
    'Basic',
    () => {
      advanced = false;
      render();
    },
    advanced ? '' : 'active',
  )}${button(
    'Advanced',
    () => {
      advanced = true;
      render();
    },
    advanced ? 'active' : '',
  )}</div>${select(
    'Edit translation',
    contentLang,
    [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'ca', label: 'Català' },
    ],
    (v) => {
      contentLang = v as Language;
      render();
    },
  )}</div><div class="spacer"></div><div class="editor-layout"><div class="editor-form">${section(tr('Identity'), identity, 'identity', true)}${section(tr('Contacts'), contactContent, 'contacts')}${section(tr('Emergency message'), emergency, 'emergency')}${section(tr('Photos'), photoContent, 'photos')}${section(tr('Appearance'), appearance, 'appearance')}${dataSections(pet)}${advanced ? button('Add section', () => addSection(pet)) : ''}</div><aside class="preview-panel"><div class="row spread preview-heading"><span>${tr('Preview profile')}</span>${button('Preview profile', () => openPreview(pet), 'subtle')}</div><iframe title="${tr('Preview profile')}" id="profile-preview" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe></aside></div>`;
}
function dataSections(pet: Pet) {
  const known = (Object.keys(categoryNames) as (keyof typeof categoryNames)[]).map((id) => ({
    id,
    title: tri(categoryNames[id]),
  }));
  const list = [...known, ...pet.sections.filter((s) => !(s.id in categoryNames))];
  return list
    .map((s) => {
      const data = pet.sections.find((item) => item.id === s.id);
      if (!advanced && !data?.fields.length) return '';
      const sensitive = s.id === 'medical' || s.id === 'identification';
      return section(
        local(s.title),
        `${sensitive ? `<p class="sensitive-note">${tr('Sensitive details can identify an animal or expose health information. Publish only with informed consent.')}</p>` : ''}${
          data?.fields
            .map((f) =>
              fieldEditor(s.id, f, () => {
                data.fields.splice(data.fields.indexOf(f), 1);
                dirty = true;
                render();
              }),
            )
            .join('') || ''
        }${advanced ? addFieldControl(pet, s) : ''}`,
        `data-${s.id}`,
      );
    })
    .join('');
}
function fieldEditor(sectionId: string, field: Field, remove: () => void) {
  return `<div class="field-row">${textInput(local(field.label), field.value, (v) => (field.value = v), true)}<div class="field-options">${check(
    'Publish',
    field.publish,
    (v) => {
      if (v && needsConsent(sectionId, field) && !field.consent) {
        if (
          !confirm(
            tr(
              'Publish this sensitive information publicly? It may be copied and remain in Git history after removal.',
            ),
          )
        ) {
          render();
          return;
        }
        field.consent = true;
      }
      field.publish = v;
      render();
    },
  )}${
    advanced
      ? `${select(
          'Type',
          field.kind,
          ['text', 'warning', 'link'].map((v) => ({
            value: v,
            label: v[0].toUpperCase() + v.slice(1),
          })),
          (v) => (field.kind = v as Field['kind']),
        )}${check('Sensitive information', field.sensitive, (v) => {
          field.sensitive = v;
          if (v) {
            field.publish = false;
            field.consent = false;
          }
          render();
        })}`
      : ''
  }${button('Remove', remove, 'subtle danger')}</div>${advanced ? textInput('Field label', field.label, (v) => (field.label = v)) : ''}</div>`;
}
function addFieldControl(pet: Pet, section: { id: string; title: Localized }) {
  const options = fields[section.id as keyof typeof fields] || [];
  let chosen = options[0]?.[0] || 'custom';
  return `<div class="row">${select('Optional fields', chosen, [...options.map((f) => ({ value: f[0], label: local(tri(f.slice(1))) })), { value: 'custom', label: 'Custom' }], (v) => (chosen = v))}${button(
    'Add field',
    () => {
      let data = pet.sections.find((s) => s.id === section.id);
      if (!data) {
        data = { ...section, fields: [] };
        pet.sections.push(data);
      }
      const known = options.find((f) => f[0] === chosen);
      data.fields.push(
        fieldSchema.parse({
          key: known?.[0] || `custom-${crypto.randomUUID()}`,
          label: known ? tri(known.slice(1)) : tr('Field label'),
          value: '',
          sensitive: section.id === 'medical',
          kind: chosen === 'video' || chosen === 'map' ? 'link' : 'text',
        }),
      );
      dirty = true;
      render();
    },
  )}</div>`;
}
function addSection(pet: Pet) {
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', tr('Add section'));
  dialog.innerHTML = `<form><h2>${tr('Custom section')}</h2><div class="spacer"></div><label>${tr('Section title')}<input name="title" required maxlength="100"></label><div class="qr-output-actions"><button class="button primary" type="submit">${tr('Add section')}</button><button class="button" type="button" data-cancel>${tr('Cancel')}</button></div></form>`;
  dialog.querySelector('form')!.onsubmit = (e) => {
    e.preventDefault();
    const title = dialog.querySelector<HTMLInputElement>('[name=title]')!.value.trim();
    if (!title) return;
    pet.sections.push({
      id: `custom-${crypto.randomUUID()}`,
      title: { [contentLang]: title },
      fields: [],
    });
    dirty = true;
    dialog.close();
    render();
  };
  dialog.querySelector<HTMLElement>('[data-cancel]')!.onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  document.body.append(dialog);
  dialog.showModal();
}
function contactMethods() {
  return [
    { value: 'phone', label: 'Call' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' },
    { value: 'telegram', label: 'Telegram' },
  ];
}
function contactForm(c: Contact) {
  return `<div class="form-grid">${input('Contact name', c.name, (v) => (c.name = v), { required: true, max: 100 })}${textInput('Relationship', c.relationship, (v) => (c.relationship = v))}${input('Telephone', c.phone || '', (v) => (c.phone = v), { type: 'tel' })}${input('WhatsApp', c.whatsapp || '', (v) => (c.whatsapp = v), { type: 'tel' })}${input('Email', c.email || '', (v) => (c.email = v), { type: 'email' })}${input('Telegram', c.telegram || '', (v) => (c.telegram = v))}${select('Preferred method', c.preferred, contactMethods(), (v) => (c.preferred = v as Contact['preferred']))}${select(
    'Preferred language',
    c.language,
    [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'ca', label: 'Català' },
    ],
    (v) => (c.language = v as Language),
  )}<div class="wide">${textInput('Availability', c.availability, (v) => (c.availability = v))}</div></div><div class="spacer"></div>${check(
    'Publish contact',
    c.publish && c.consent,
    (v) => {
      if (v && !confirm(tr('I understand these contact details will be public.'))) {
        render();
        return;
      }
      c.publish = v;
      c.consent = v;
      render();
    },
  )}`;
}
function contactsScreen() {
  return `<div class="page-heading"><div><h1>${tr('Contacts')}</h1><p>${tr('Shared contacts are reused across pets. Order assigned contacts by emergency priority.')}</p></div>${button(
    'Add contact',
    () => {
      config.contacts.push(
        contactSchema.parse({ id: `contact-${crypto.randomUUID()}`, name: tr('Contact name') }),
      );
      dirty = true;
      render();
    },
    'primary',
  )}</div>${config.contacts
    .map(
      (c, index) =>
        `<section class="contact-editor"><div class="row spread"><h2>${esc(c.name)}</h2>${button(
          'Delete',
          () => {
            if (confirm(tr('Delete this contact and remove its pet assignments?'))) {
              config.contacts.splice(index, 1);
              config.pets.forEach(
                (p) => (p.contacts = p.contacts.filter((ref) => ref.id !== c.id)),
              );
              dirty = true;
              render();
            }
          },
          'subtle danger',
        )}</div><div class="spacer"></div>${contactForm(c)}</section>`,
    )
    .join('')}${exportStrip()}`;
}
function settings() {
  const s = config.site;
  return `<div class="settings-panel"><div class="page-heading"><div><h1>${tr('Site settings')}</h1></div></div><div class="stack">${input('Site title', s.title, (v) => (s.title = v), { required: true, max: 100 })}${input('Public site URL', s.publicUrl, (v) => (s.publicUrl = v), { type: 'url', hint: 'Use the exact deployed site URL, including the repository path.' })}${select(
    'Default language',
    s.defaultLanguage,
    [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'ca', label: 'Català' },
    ],
    (v) => (s.defaultLanguage = v as Language),
  )}${check('Show public pet index', s.ownerIndex, (v) => (s.ownerIndex = v))}<p class="hint">${tr('Profiles are public, including when the index is disabled.')}</p>${check('Show attribution', s.attribution, (v) => (s.attribution = v))}${input('Project source URL (optional)', s.sourceUrl, (v) => (s.sourceUrl = v), { type: 'url' })}${check('Demo data notice', s.fictional, (v) => (s.fictional = v))}<div class="notice warning"><h2>${tr('Publishing & privacy')}</h2><p>${tr('Everything uploaded to GitHub Pages is public. Unlisted URLs and noindex do not provide privacy. Never upload confidential records or precise home addresses.')}</p></div></div><div class="settings-actions">${button('Import files', importFiles)}${button(
    'Save draft on this device',
    async () => {
      await draftStore('save', { config: parseConfig(config), images });
      dirty = false;
      toast(tr('Draft saved locally. Anyone using this browser may access it.'));
    },
  )}${button('Restore local draft', async () => {
    if (dirty && !confirm(tr('Unsaved session changes will be lost. Continue?'))) return;
    const stored = await draftStore('read');
    if (!stored) {
      toast(tr('No local draft is available.'));
      return;
    }
    config = parseConfig(stored.config);
    images = stored.images;
    clearImageURLs();
    dirty = true;
    render();
  })}${button('Forget local draft', async () => {
    await draftStore('delete');
    toast(tr('Local draft deleted.'));
  })}${button(
    'Reset examples',
    () => {
      if (confirm(tr('Replace the current draft with the deployed configuration?'))) {
        config = structuredClone(original);
        images.clear();
        clearImageURLs();
        dirty = false;
        render();
      }
    },
    'danger',
  )}</div>${exportStrip()}</div>`;
}
function help() {
  return `<div class="help-content"><h1>${tr('Help')}</h1><h2>${tr('Export & publish')}</h2><p>${tr('Download the ZIP, extract it, then replace the data/ folder and merge assets/pets/ into your repository. Commit the changes and wait for Pages to deploy.')}</p><h2>${tr('Publishing & privacy')}</h2><p>${tr('Everything uploaded to GitHub Pages is public. Unlisted URLs and noindex do not provide privacy. Never upload confidential records or precise home addresses.')}</p><h2>${tr('Photos')}</h2><p>${tr('Photos are processed on this device. Maximum 15 MB per file; exported at up to 1200 px.')}</p><h2>${tr('QR code')}</h2><p>${tr('Keep at least four clear modules around the code. Print at least 25 mm, larger for long URLs. Test with multiple phones before engraving.')}</p><h2>${tr('Stable ID')}</h2><p>${tr('Keep this ID unchanged once a tag is printed.')}</p><div class="settings-actions">${button('Import files', importFiles)}${button('Export files', openExport, 'primary')}</div></div>`;
}
function clearImageURLs() {
  for (const url of imageURLs.values()) URL.revokeObjectURL(url);
  imageURLs.clear();
}
async function choosePhoto(pet: Pet) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp';
  input.onchange = async () => {
    try {
      const file = input.files?.[0];
      if (!file) return;
      if (pet.photos.length >= 30) throw new Error('Maximum 30 photos per pet.');
      const processed = await processImage(file, lang);
      if (!processed) return;
      const path = `assets/pets/${crypto.randomUUID()}.${processed.extension}`;
      images.set(path, processed.bytes);
      pet.photos.push({ path, alt: { [contentLang]: pet.name } });
      dirty = true;
      render();
    } catch (error) {
      showError(error);
    }
  };
  input.click();
}
function previewDocument(pet: Pet) {
  const safe = publicConfig(config);
  const published = safe.pets.find((p) => p.id === pet.id)!;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${previewCSS}</style></head><body>${replaceImages(renderProfile(safe, published, lang, base.href, true))}</body></html>`;
}
function updatePreview() {
  if (screen !== 'edit') return;
  const frame = document.querySelector<HTMLIFrameElement>('#profile-preview');
  if (!frame) return;
  try {
    frame.srcdoc = previewDocument(currentPet());
    clearErrors();
  } catch (error) {
    showError(error);
  }
}
function openPreview(pet: Pet) {
  try {
    const dialog = document.createElement('dialog');
    dialog.style.width = 'min(1000px,95vw)';
    dialog.setAttribute('aria-label', tr('Preview profile'));
    dialog.innerHTML = `<div class="modal-heading"><h2>${tr('Preview profile')}</h2><button class="button">${tr('Close')}</button></div><iframe title="${tr('Preview profile')}" sandbox="allow-popups allow-popups-to-escape-sandbox" style="width:100%;height:72vh;border:0"></iframe>`;
    dialog.querySelector('iframe')!.srcdoc = previewDocument(pet);
    dialog.querySelector('button')!.onclick = () => dialog.close();
    dialog.onclose = () => dialog.remove();
    document.body.append(dialog);
    dialog.showModal();
  } catch (error) {
    showError(error);
  }
}
function openExport() {
  try {
    parseConfig(config);
  } catch (error) {
    showError(error);
    return;
  }
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', tr('Export & publish'));
  const safe = publicConfig(config);
  dialog.innerHTML = `<div class="modal-heading"><h2>${tr('Export & publish')}</h2><button class="button" data-close>${tr('Close')}</button></div><div class="notice warning">${tr('Everything uploaded to GitHub Pages is public. Unlisted URLs and noindex do not provide privacy. Never upload confidential records or precise home addresses.')}</div><div class="spacer"></div><p>${tr('Only selected public fields are exported. Unpublished fields remain in this browser session.')}</p><p class="hint">${safe.pets.length} ${tr('My pets')} · ${safe.contacts.length} ${tr('Contacts')}</p><div class="divider"></div><p>${tr('Download the ZIP, extract it, then replace the data/ folder and merge assets/pets/ into your repository. Commit the changes and wait for Pages to deploy.')}</p><div class="qr-output-actions"><button class="button primary" data-download>${tr('Confirm publication')} · ZIP</button></div><p class="error-box" data-error role="alert"></p>`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLElement>('[data-close]')!.onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  dialog.querySelector<HTMLButtonElement>('[data-download]')!.onclick = async () => {
    const button = dialog.querySelector<HTMLButtonElement>('[data-download]')!;
    button.disabled = true;
    try {
      const bytes = await exportArchive(config, images, base);
      download(bytes as BlobPart, 'petqr-public.zip', 'application/zip');
      toast(tr('Files exported.'));
      dialog.close();
    } catch (error) {
      dialog.querySelector('[data-error]')!.textContent = explainError(error);
    } finally {
      button.disabled = false;
    }
  };
}
function importFiles() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.zip,application/json,application/zip';
  input.onchange = async () => {
    try {
      const file = input.files?.[0];
      if (!file) return;
      if (
        !confirm(
          tr(
            'Import a PetQR ZIP or complete configuration JSON. This replaces your current draft.',
          ),
        )
      )
        return;
      let next: Config,
        nextImages: ImageFiles = new Map();
      if (file.size > 60 * 1024 * 1024) throw new Error('File is larger than 60 MB.');
      if (file.name.toLowerCase().endsWith('.zip')) {
        const result = importArchive(new Uint8Array(await file.arrayBuffer()));
        next = result.config;
        nextImages = result.images;
      } else {
        next = parseConfig(JSON.parse(await file.text()));
      }
      config = next;
      images = nextImages;
      clearImageURLs();
      dirty = true;
      screen = 'pets';
      render();
      toast(tr('Configuration imported.'));
    } catch (error) {
      showError(error);
    }
  };
  input.click();
}
function render() {
  setValidationLanguage(lang);
  const open = new Set(
    [...document.querySelectorAll<HTMLDetailsElement>('details[data-section][open]')].map(
      (d) => d.dataset.section,
    ),
  );
  binding.clear();
  actions.clear();
  counter = 0;
  document.documentElement.lang = lang;
  const content =
    screen === 'pets'
      ? dashboard()
      : screen === 'edit'
        ? editor()
        : screen === 'contacts'
          ? contactsScreen()
          : screen === 'settings'
            ? settings()
            : help();
  document.body.innerHTML = `<a class="skip-link" href="#main">${lang === 'en' ? 'Skip to content' : lang === 'es' ? 'Saltar al contenido' : 'Salta al contingut'}</a>${shell(content)}`;
  document.querySelectorAll<HTMLDetailsElement>('details[data-section]').forEach((d) => {
    if (open.has(d.dataset.section)) d.open = true;
  });
  bindPreferences((next) => {
    lang = next;
    contentLang = next;
    render();
  });
  document.body.onclick = (event) => {
    const target = (event.target as Element).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const fn = actions.get(target.dataset.action!);
    if (fn) {
      try {
        const result = fn();
        if (result instanceof Promise) void result.catch(showError);
      } catch (error) {
        showError(error);
      }
    }
  };
  document.body.oninput = (event) => {
    const element = event.target as HTMLInputElement;
    const setter = binding.get(element.dataset.bind || '');
    if (setter) {
      setter(element.type === 'checkbox' ? element.checked : element.value);
      mark();
    }
  };
  updatePreview();
}
window.addEventListener('beforeunload', (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});
async function start() {
  const [response, css] = await Promise.all([
    fetch(new URL('data/config.json', base)),
    fetch(new URL('assets/style.css', base)),
  ]);
  if (!response.ok) throw new Error('Could not load public configuration');
  config = parseConfig(await response.json());
  original = structuredClone(config);
  previewCSS = await css.text();
  lang = preferredLanguage(config.site.defaultLanguage);
  contentLang = lang;
  render();
}
void start().catch((error) => {
  document.body.textContent = explainError(error);
});
