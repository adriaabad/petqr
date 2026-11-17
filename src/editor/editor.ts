import {
  parseConfig,
  setValidationLanguage,
  publicConfig,
  explainError,
  newPet,
  preserveProfileAddresses,
  petSchema,
  contactSchema,
  telegramSchema,
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
} from '../shared/model';
import { preferredLanguage, t } from '../shared/i18n';
import { brand, controls, photo, esc, renderProfile, tutorialButton } from '../public/render';
import { bindPreferences, toast } from '../shared/preferences';
import { categoryNames, tri } from '../shared/fields';
import { openQR } from './qr';
import { processImage } from './images';
import { profilePreview } from '../shared/preview';
import { exportArchive, importArchive, type ImageFiles } from './archive';
import { download } from './download';
import { draftStore } from './draft';
import { icon } from './icons';
import { publicationGuide } from '../shared/publishing';
import { bindPhotoGallery } from '../public/gallery';

const base = new URL(/* @vite-ignore */ '../', import.meta.url);
let config: Config,
  original: Config,
  lang: Language = 'en',
  contentLang: Language = 'en';
let screen: 'pets' | 'contacts' | 'settings' | 'help' | 'edit' = 'pets',
  selected = '',
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
  options: {
    type?: string;
    hint?: string;
    required?: boolean;
    max?: number;
    validate?: (value: string) => string;
  } = {},
) {
  const id = `input-${counter++}`;
  const error = options.validate?.(value) || '';
  const setter = (v: string | boolean) => {
    const next = String(v);
    fn(next);
    if (options.validate) {
      const message = options.validate(next);
      const input = document.getElementById(id);
      input?.setAttribute('aria-invalid', String(Boolean(message)));
      const errorNode = document.getElementById(`${id}-error`);
      if (errorNode) errorNode.textContent = message;
    }
  };
  return `<div class="form-control"><label for="${id}">${esc(tr(label))}</label><input id="${id}" type="${options.type || 'text'}" value="${esc(value)}" ${bind(setter)} ${options.required ? 'required' : ''} maxlength="${options.max || 1000}" ${options.validate ? `aria-invalid="${Boolean(error)}"` : ''} aria-describedby="${options.hint ? `${id}-hint ` : ''}${options.validate ? `${id}-error` : ''}">${options.hint ? `<span id="${id}-hint" class="hint">${esc(tr(options.hint))}</span>` : ''}${options.validate ? `<span id="${id}-error" class="field-error" role="status">${esc(error)}</span>` : ''}</div>`;
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
  const id = `text-${counter++}`;
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
  return `<div class="form-control"><label for="${id}">${esc(tr(label))}</label>${area ? `<textarea id="${id}" ${attr} maxlength="10000">${esc(current)}</textarea>` : `<input id="${id}" ${attr} maxlength="1000" value="${esc(current)}">`}</div>`;
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
    const detail = explainError(error, lang).replace(
      /^contacts\.(\d+)\./gm,
      (_, index) =>
        `${tr('Contacts')} → ${config.contacts[Number(index)]?.name || Number(index) + 1} → `,
    );
    box.textContent = `${tr('Validation errors')}\n${detail}`;
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
    ['settings', 'Settings'],
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
    )}</nav>${tutorialButton(lang, base.href)}<p class="sidebar-note">${tr('Local only. Nothing is uploaded automatically.')}</p></aside><main class="app-main" id="main"><div class="topbar"><span class="context">PetQR / ${tr('Local editor')}</span>${controls(lang)}</div><div id="errors" class="error-box" role="alert"></div>${content}</main></div><div class="toast" role="status" aria-live="polite" id="toast"></div>`;
}
function exportStrip() {
  return `<div class="export-strip"><div><strong>${tr('Changes stay on this device. Export when you’re ready.')}</strong><p>${tr('Only selected public fields are exported. Unpublished fields remain in this browser session.')}</p></div>${button('Export files', openExport)}</div>`;
}
function dashboard() {
  return `<div class="page-heading"><div><h1>${tr('A little tag. A way home.')}</h1><p>${tr('Your pets, their people, always connected.')}</p></div>${button(
    'Add pet',
    () => {
      const pet = newPet(config.pets);
      pet.name = lang === 'en' ? 'New pet' : lang === 'es' ? 'Nuevo animal' : 'Animal nou';
      config.pets.push(pet);
      selected = pet.id;
      screen = 'edit';
      dirty = true;
      render();
    },
    'primary',
  )}</div><div class="pet-grid">${config.pets
    .map(
      (pet, index) =>
        `<article class="pet-card"><a class="card-photo" href="${new URL(petPath(pet), base).href}">${replaceImages(photo(pet, lang, base.href, index > 2))}</a><div class="card-body"><div class="name-row"><h2>${esc(pet.name)}</h2></div><p class="species">${esc(local(pet.species) || '—')}</p><div class="card-actions"><a class="button primary" href="${new URL(petPath(pet), base).href}">${tr('View profile')} ↗</a>${button('QR code', () => openQR(config, pet, lang))}${button(
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
            duplicate.id = newPet(config.pets).id;
            delete duplicate.shortId;
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
function identificationInput(pet: Pet, key: 'microchip' | 'registration', label: string) {
  let data = pet.sections.find((s) => s.id === 'identification');
  const field =
    data?.fields.find((f) => f.key === key) ||
    (key === 'registration' ? data?.fields.find((f) => f.key === 'registry') : undefined) ||
    fieldSchema.parse({
      key,
      label: { en: label, es: t(label, 'es'), ca: t(label, 'ca') },
      value: '',
      sensitive: true,
    });
  const attach = () => {
    data ||= pet.sections.find((section) => section.id === 'identification');
    if (!data) {
      data = { id: 'identification', title: tri(categoryNames.identification), fields: [] };
      pet.sections.push(data);
    }
    if (!data.fields.includes(field)) data.fields.push(field);
  };
  return `<div class="identification-input">${input(
    label,
    textOf(field.value, config.site.defaultLanguage),
    (value) => {
      attach();
      field.value = value;
    },
    { max: 100 },
  )}${check(
    key === 'microchip' ? 'Publish microchip number' : 'Publish registration number',
    field.publish && field.consent,
    (value) => {
      if (
        value &&
        !field.consent &&
        !confirm(
          tr(
            'Publish this sensitive information publicly? It may be copied and remain in Git history after removal.',
          ),
        )
      ) {
        render();
        return;
      }
      attach();
      field.publish = value;
      if (value) field.consent = true;
      render();
    },
  )}<p class="hint">${tr('Optional. Published identification numbers can be read by anyone.')}</p></div>`;
}
function photoAttribution(photo: Pet['photos'][number]) {
  const fields: [keyof NonNullable<typeof photo.credit>, string, string?][] = [
    ['author', 'Photo author'],
    ['source', 'Photo source URL', 'url'],
    ['license', 'Photo license or permission'],
    ['licenseUrl', 'License URL (optional)', 'url'],
    ['changes', 'Photo modifications (optional)'],
  ];
  return `<details class="optional-contact-method"><summary>${tr('Photo authorship and license (optional)')}</summary><div class="section-content"><p class="hint">${tr('A new photo does not inherit the previous author. Add the actual author and permission for this photo. Uploading does not transfer copyright.')}</p><div class="stack">${fields
    .map(([key, label, type]) =>
      input(
        label,
        photo.credit?.[key] || '',
        (value) => {
          const credit = {
            author: '',
            source: '',
            license: '',
            licenseUrl: '',
            changes: '',
            ...photo.credit,
            [key]: value,
          };
          if (Object.values(credit).some((entry) => entry.trim())) photo.credit = credit;
          else delete photo.credit;
        },
        { type },
      ),
    )
    .join('')}</div></div></details>`;
}
function editor() {
  const pet = currentPet();
  if (!pet) {
    screen = 'pets';
    return dashboard();
  }
  const identity = `<div class="form-grid">${input('Name', pet.name, (v) => (pet.name = v), { required: true, max: 100 })}${textInput('Species', pet.species, (v) => (pet.species = v))}${textInput('Breed', pet.breed, (v) => (pet.breed = v))}<div class="wide form-grid">${identificationInput(pet, 'microchip', 'Microchip number')}${identificationInput(pet, 'registration', 'Registration number')}</div><div class="wide">${textInput('Introduction', pet.introduction, (v) => (pet.introduction = v), true)}</div><div class="wide"><label>${tr('Stable ID')}<code>${esc(pet.id)}</code><span class="hint">${tr('Keep this ID unchanged once a tag is printed.')}</span></label></div></div>`;
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
  const photoContent = `<p class="hint">${tr('Photos are converted and compressed on this device to WebP or JPEG, up to 1200 px and 300 KB. Animated images use the first frame.')}</p>${button('Add photo', () => choosePhoto(pet))}<div class="photos-list">${pet.photos
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
        )}</div>${photoAttribution(p)}</div>`,
    )
    .join('')}</div>`;
  return `<div class="page-heading"><div><div class="row">${button(
    'Back',
    () => {
      screen = 'pets';
      render();
    },
    'subtle',
  )}<h1 style="font-size:1.7rem">${tr('Edit pet')} · ${esc(pet.name)}</h1></div></div>${button('Export files', openExport, 'primary')}</div><div class="row spread editor-toolbar">${select(
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
  )}</div><div class="spacer"></div><div class="editor-layout"><div class="editor-form">${section(tr('Identity'), identity, 'identity', true)}${section(tr('Contacts'), contactContent, 'contacts')}${section(tr('Photos'), photoContent, 'photos')}${dataSections(pet)}</div><aside class="preview-panel"><div class="row spread preview-heading"><span>${tr('Preview profile')}</span>${button('Preview profile', () => openPreview(pet), 'subtle')}</div><iframe title="${tr('Preview profile')}" id="profile-preview" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></aside></div>`;
}
const standardDetails: Record<
  string,
  { key: string; aliases: string[]; label: string; sensitive?: boolean; options?: string[] }[]
> = {
  location: [
    {
      key: 'homeAddress',
      aliases: ['homeAddress', 'address'],
      label: 'Home address',
      sensitive: true,
    },
    {
      key: 'outdoorAccess',
      aliases: ['outdoorAccess'],
      label: 'Outdoor access',
      options: ['Stays at home', 'May go out independently', 'Only goes out accompanied'],
    },
    {
      key: 'roamingArea',
      aliases: ['roamingArea'],
      label: 'Usual area and outdoor instructions',
      sensitive: true,
    },
  ],
  medical: [
    { key: 'allergies', aliases: ['foodAllergies', 'allergies'], label: 'Allergies' },
    { key: 'conditions', aliases: ['conditions'], label: 'Health conditions' },
  ],
  behavior: [
    { key: 'handling', aliases: ['handling', 'approach'], label: 'Behavior and handling notes' },
  ],
};
function standardDetail(
  pet: Pet,
  sectionId: string,
  definition: (typeof standardDetails)[string][number],
) {
  let data = pet.sections.find((section) => section.id === sectionId);
  const field =
    data?.fields.find((field) => definition.aliases.includes(field.key)) ||
    fieldSchema.parse({
      key: definition.key,
      label: { en: definition.label, es: t(definition.label, 'es'), ca: t(definition.label, 'ca') },
      value: '',
      sensitive: sectionId === 'medical' || definition.sensitive,
      kind: sectionId === 'medical' ? 'warning' : 'text',
    });
  return fieldEditor(
    sectionId,
    field,
    undefined,
    () => {
      data ||= pet.sections.find((section) => section.id === sectionId);
      if (!data) {
        data = {
          id: sectionId,
          title: tri(categoryNames[sectionId as keyof typeof categoryNames]),
          fields: [],
        };
        pet.sections.push(data);
      }
      if (!data.fields.includes(field)) data.fields.push(field);
    },
    definition.label,
    definition.options
      ? (setValue) => {
          const current = textOf(field.value, 'en', config.site.defaultLanguage);
          const choices = [...definition.options!];
          if (current && !choices.includes(current)) choices.push(current);
          return select(
            definition.label,
            current,
            [
              { value: '', label: 'Not specified' },
              ...choices.map((value) => ({ value, label: value })),
            ],
            (value) => {
              setValue(value ? { en: value, es: t(value, 'es'), ca: t(value, 'ca') } : '');
            },
          );
        }
      : undefined,
  );
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
      const standards = standardDetails[s.id] || [];
      const standardKeys = new Set(standards.flatMap((definition) => definition.aliases));
      const visibleFields =
        data?.fields.filter(
          (field) =>
            !standardKeys.has(field.key) &&
            (s.id !== 'identification' ||
              !['microchip', 'registration', 'registry'].includes(field.key)),
        ) || [];
      if (s.id === 'emergency' || (!visibleFields.length && !standards.length)) return '';
      const sensitive = s.id === 'medical' || s.id === 'identification';
      return section(
        local(s.title),
        `${sensitive ? `<p class="sensitive-note">${tr('Sensitive details can identify an animal or expose health information. Publish only with informed consent.')}</p>` : ''}${s.id === 'location' ? `<p class="sensitive-note">${tr('Publish only the address or area you want anyone scanning the QR to see. Outdoor access describes permitted outings, not a lost/found status.')}</p>` : ''}${standards.map((definition) => standardDetail(pet, s.id, definition)).join('')}${
          visibleFields
            .map((f) =>
              fieldEditor(s.id, f, () => {
                data!.fields.splice(data!.fields.indexOf(f), 1);
                dirty = true;
                render();
              }),
            )
            .join('') || ''
        }`,
        `data-${s.id}`,
      );
    })
    .join('');
}
function fieldEditor(
  sectionId: string,
  field: Field,
  remove?: () => void,
  onChange = () => {},
  label = local(field.label),
  valueEditor?: (setValue: (value: Localized) => void) => string,
) {
  const setValue = (value: Localized) => {
    onChange();
    field.value = value;
  };
  return `<div class="field-row">${
    valueEditor ? valueEditor(setValue) : textInput(label, field.value, setValue, true)
  }<div class="field-options">${check('Publish', field.publish, (v) => {
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
    onChange();
    field.publish = v;
    render();
  })}${remove ? button('Remove', remove, 'subtle danger') : ''}</div></div>`;
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
  const optionalTelegram = `<details class="optional-contact-method" ${c.telegram ? 'open' : ''}><summary>${tr('More contact methods (optional)')}</summary><div class="section-content">${input('Telegram', c.telegram || '', (v) => (c.telegram = v), { hint: 'Optional. Enter username, @username or https://t.me/username. Leave blank if you do not use Telegram.', validate: (value) => (telegramSchema.safeParse(value).success ? '' : tr('Enter a Telegram username, @username or https://t.me/username. Leave blank if you do not use Telegram.')) })}</div></details>`;
  return `<div class="form-grid">${input('Contact name', c.name, (v) => (c.name = v), { required: true, max: 100 })}${textInput('Relationship', c.relationship, (v) => (c.relationship = v))}${input('Telephone', c.phone || '', (v) => (c.phone = v), { type: 'tel' })}${input('WhatsApp', c.whatsapp || '', (v) => (c.whatsapp = v), { type: 'tel' })}${input('Email', c.email || '', (v) => (c.email = v), { type: 'email' })}${select('Preferred method', c.preferred, contactMethods(), (v) => (c.preferred = v as Contact['preferred']))}${select(
    'Preferred language',
    c.language,
    [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'ca', label: 'Català' },
    ],
    (v) => (c.language = v as Language),
  )}<div class="wide">${textInput('Availability', c.availability, (v) => (c.availability = v))}</div></div>${optionalTelegram}<div class="spacer"></div>${check(
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
  return `<div class="settings-panel"><div class="page-heading"><div><h1>${tr('Settings')}</h1></div></div><div class="stack">${input('Site title', s.title, (v) => (s.title = v), { required: true, max: 100 })}${input('Public site URL', s.publicUrl, (v) => (s.publicUrl = v), { type: 'url', hint: 'Use the exact deployed site URL, including the repository path.' })}${select(
    'Default language',
    s.defaultLanguage,
    [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'ca', label: 'Català' },
    ],
    (v) => (s.defaultLanguage = v as Language),
  )}${check('Show public pet index', s.ownerIndex, (v) => (s.ownerIndex = v))}<p class="hint">${tr('Profiles are public, including when the index is disabled.')}</p>${check('Show attribution', s.attribution, (v) => (s.attribution = v))}${input('Project source URL (optional)', s.sourceUrl, (v) => (s.sourceUrl = v), { type: 'url' })}<div class="notice warning"><h2>${tr('Publishing & privacy')}</h2><p>${tr('Everything uploaded to GitHub Pages is public. Keep confidential records private. Publish an address only if you want it visible to anyone scanning the QR.')}</p></div></div><div class="settings-actions">${button('Import files', importFiles)}${button(
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
    config = preserveProfileAddresses(stored.config, original);
    images = stored.images;
    clearImageURLs();
    dirty = true;
    render();
  })}${button('Forget local draft', async () => {
    await draftStore('delete');
    toast(tr('Local draft deleted.'));
  })}${button(
    'Reset draft',
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
  return `<div class="help-content"><h1>${tr('Help')}</h1><div class="help-tutorial">${tutorialButton(lang, base.href, 'primary')}</div>${publicationGuide(config.site.publicUrl, lang, true)}<h2>${tr('Publishing & privacy')}</h2><p>${tr('Everything uploaded to GitHub Pages is public. Keep confidential records private. Publish an address only if you want it visible to anyone scanning the QR.')}</p><h2>${tr('Photos')}</h2><p>${tr('Photos are converted and compressed on this device to WebP or JPEG, up to 1200 px and 300 KB. Animated images use the first frame.')}</p><h2>${tr('QR code')}</h2><p>${tr('Keep at least four clear modules around the code. Print at least 25 mm, larger for long URLs. Test with multiple phones before engraving.')}</p><h2>${tr('Stable ID')}</h2><p>${tr('Keep this ID unchanged once a tag is printed.')}</p><div class="settings-actions">${button('Import files', importFiles)}${button('Export files', openExport, 'primary')}</div></div>`;
}
function clearImageURLs() {
  for (const url of imageURLs.values()) URL.revokeObjectURL(url);
  imageURLs.clear();
}
async function choosePhoto(pet: Pet) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.heic,.heif';
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
      toast(
        `${tr('Photo optimized')}: ${formatPhotoSize(file.size)} → ${formatPhotoSize(processed.bytes.length)} (${processed.extension.toUpperCase()})`,
      );
    } catch (error) {
      showError(error);
    }
  };
  input.click();
}
function previewDocument(pet: Pet) {
  const preview = profilePreview(config, pet.id),
    safe = preview.config;
  const published = safe.pets.find((p) => p.id === pet.id)!;
  const warning = preview.incompleteContacts.length
    ? `<p class="notice warning" role="status">${tr('Some contact methods are incomplete and are omitted from this preview. Correct them in Contacts before exporting.')} ${esc(preview.incompleteContacts.join(', '))}</p>`
    : '';
  const profile = renderProfile(safe, published, lang, base.href, true);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${previewCSS}</style></head><body>${warning}${replaceImages(profile)}</body></html>`;
}
function formatPhotoSize(bytes: number) {
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(bytes / (bytes >= 1024 * 1024 ? 1024 * 1024 : 1024))} ${bytes >= 1024 * 1024 ? 'MB' : 'KB'}`;
}
function updatePreview() {
  if (screen !== 'edit') return;
  const frame = document.querySelector<HTMLIFrameElement>('#profile-preview');
  if (!frame) return;
  try {
    frame.onload = () => {
      if (frame.contentDocument) bindPhotoGallery(frame.contentDocument);
    };
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
    dialog.innerHTML = `<div class="modal-heading"><h2>${tr('Preview profile')}</h2><button class="button">${tr('Close')}</button></div><iframe title="${tr('Preview profile')}" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" style="width:100%;height:72vh;border:0"></iframe>`;
    dialog.querySelector('iframe')!.onload = () => {
      const doc = dialog.querySelector('iframe')!.contentDocument;
      if (doc) bindPhotoGallery(doc);
    };
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
  dialog.innerHTML = `<div class="modal-heading"><h2>${tr('Export & publish')}</h2><button class="button" data-close>${tr('Close')}</button></div><div class="help-tutorial">${tutorialButton(lang, base.href)}</div><div class="notice warning">${tr('Everything uploaded to GitHub Pages is public. Keep confidential records private. Publish an address only if you want it visible to anyone scanning the QR.')}</div><div class="spacer"></div><p>${tr('Only selected public fields are exported. Unpublished fields remain in this browser session.')}</p><p class="hint">${safe.pets.length} ${tr('My pets')} · ${safe.contacts.length} ${tr('Contacts')}</p><div class="divider"></div>${publicationGuide(config.site.publicUrl, lang)}<div class="qr-output-actions"><button class="button primary" data-download>${tr('Confirm publication')} · ZIP</button></div><p class="error-box" data-error role="alert"></p>`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLElement>('[data-close]')!.onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  dialog.querySelector<HTMLButtonElement>('[data-download]')!.onclick = async () => {
    const button = dialog.querySelector<HTMLButtonElement>('[data-download]')!;
    button.disabled = true;
    try {
      const bytes = await exportArchive(config, images, base, lang);
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
      config = preserveProfileAddresses(next, original);
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
