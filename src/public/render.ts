import { contactLink, resolvedContacts, textOf, petPath } from '../shared/core';
import type { Config, Pet, Language, Localized } from '../shared/model';
import { t } from '../shared/i18n';
import { creditedPhotos } from '../shared/photo-credits';
export function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
export const paw =
  '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><ellipse cx="8" cy="10" rx="4" ry="5" transform="rotate(-20 8 10)"/><ellipse cx="17" cy="6" rx="4" ry="5"/><ellipse cx="26" cy="11" rx="4" ry="5" transform="rotate(20 26 11)"/><ellipse cx="3.8" cy="18" rx="3.4" ry="4.4" transform="rotate(-25 3.8 18)"/><path d="M9 20c3-7 10-7 13-1 2 3 6 6 2 9-3 3-5 0-9 0s-6 3-9 0c-3-3 1-5 3-8Z"/></svg>';
export function skipLink(lang: Language): string {
  return `<a class="skip-link" href="#main">${lang === 'en' ? 'Skip to content' : lang === 'es' ? 'Saltar al contenido' : 'Salta al contingut'}</a>`;
}
export function controls(lang: Language): string {
  return `<div class="preferences"><label><span class="sr-only">${t('Language', lang)}</span><select data-language aria-label="${t('Language', lang)}">${(['en', 'es', 'ca'] as const).map((l) => `<option value="${l}" ${l === lang ? 'selected' : ''}>${{ en: 'English', es: 'Español', ca: 'Català' }[l]}</option>`).join('')}</select></label><label><span class="sr-only">${t('Theme', lang)}</span><select data-theme aria-label="${t('Theme', lang)}">${['System', 'Light', 'Dark'].map((v) => `<option value="${v.toLowerCase()}">${t(v, lang)}</option>`).join('')}</select></label></div>`;
}
export function brand(href: string): string {
  return `<a class="brand" href="${esc(href)}">${paw}<span>PetQR</span></a>`;
}
export function tutorialButton(lang: Language, prefix = '', classes = ''): string {
  return `<a class="button tutorial-cta ${classes}" href="${esc(prefix + 'tutorial/')}">${t('I want my PetQR', lang)} <span aria-hidden="true">↗</span></a>`;
}
export function footer(config: Config, lang: Language, prefix = '', showTutorial = true): string {
  return `<footer>${showTutorial ? `<div class="footer-tutorial">${tutorialButton(lang, prefix)}</div>` : ''}<p>${t('Public information. Share only what you are comfortable publishing.', lang)}</p>${creditedPhotos(config).length ? `<p><a href="${esc(prefix)}PHOTO_CREDITS.txt">${t('Photo credits', lang)}</a></p>` : ''}${config.site.attribution ? `<p>PetQR · ${config.site.sourceUrl ? `<a href="${esc(config.site.sourceUrl)}" rel="noopener noreferrer">${t('Open-source project', lang)}</a>` : 'MIT · Open source'}</p>` : ''}</footer>`;
}
export function photo(pet: Pet, lang: Language, prefix: string, lazy = false): string {
  const p = pet.photos[0];
  return p
    ? `<img src="${esc(prefix + p.path)}" alt="${esc(textOf(p.alt, lang) || pet.name)}" style="${photoPosition(p)}" width="1200" height="900" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`
    : `<div class="photo-empty" role="img" aria-label="${esc(pet.name)}">${paw}</div>`;
}
function photoPosition(photo: Pet['photos'][number]): string {
  return `object-position:${photo.focus?.x ?? 50}% ${photo.focus?.y ?? 50}%`;
}
export function renderProfile(
  config: Config,
  pet: Pet,
  lang: Language,
  prefix = '../../',
  preview = false,
): string {
  const tr = (key: string) => t(key, lang),
    local = (v: Localized | undefined) => textOf(v, lang, config.site.defaultLanguage);
  const contacts = resolvedContacts(config, pet);
  const primary = contacts.find((c) =>
    (['phone', 'whatsapp', 'email', 'telegram'] as const).some(
      (kind) => c[kind] && contactLink(kind, c[kind]!),
    ),
  );
  const locationContact = contacts.find((c) => c.whatsapp && contactLink('whatsapp', c.whatsapp));
  const quick = primary
    ? `<nav class="quick-contact" aria-label="${tr('Contact my people')}">${(
        ['phone', 'whatsapp', 'email', 'telegram'] as const
      )
        .filter((k) => primary[k] && contactLink(k, primary[k]!))
        .sort((a, b) => Number(b === primary.preferred) - Number(a === primary.preferred))
        .map(
          (k, i) =>
            `<a class="button ${i === 0 ? 'primary' : ''}" href="${esc(contactLink(k, primary[k]!))}" rel="noopener noreferrer">${tr({ phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', telegram: 'Telegram' }[k])}<span class="sr-only"> ${esc(primary.name)}</span></a>`,
        )
        .join('')}</nav>`
    : '';
  const sections = pet.sections.filter((section) => section.id !== 'emergency');
  const isIdentifier = (section: string, key: string) =>
    section === 'identification' && ['microchip', 'registration', 'registry'].includes(key);
  const residenceLabels: Record<string, string> = {
    homeAddress: 'Home address',
    address: 'Home address',
    outdoorAccess: 'Outdoor access',
    roamingArea: 'Usual area and outdoor instructions',
  };
  const isResidence = (section: string, key: string) =>
    section === 'location' && Object.hasOwn(residenceLabels, key);
  const residence = sections
    .filter((section) => section.id === 'location')
    .flatMap((section) => section.fields)
    .filter(
      (field) =>
        Object.hasOwn(residenceLabels, field.key) &&
        field.publish &&
        (field.key === 'outdoorAccess' || field.consent) &&
        local(field.value).trim(),
    );
  const residenceHTML = residence.length
    ? `<section class="residence-public" aria-label="${tr('Address & outdoor access')}"><h2>${tr('Address & outdoor access')}</h2><dl class="pet-identifiers">${residence.map((field) => `<div><dt>${tr(residenceLabels[field.key])}</dt><dd>${esc(local(field.value))}</dd></div>`).join('')}</dl></section>`
    : '';
  const identifiers = sections
    .filter((section) => section.id === 'identification')
    .flatMap((section) => section.fields)
    .filter(
      (field) =>
        ['microchip', 'registration', 'registry'].includes(field.key) &&
        field.publish &&
        field.consent &&
        local(field.value).trim(),
    );
  const identification = identifiers.length
    ? `<dl class="pet-identifiers">${identifiers.map((field) => `<div><dt>${tr(field.key === 'microchip' ? 'Microchip number' : 'Registration number')}</dt><dd>${esc(local(field.value))}</dd></div>`).join('')}</dl>`
    : '';
  const warnings = sections
    .flatMap((s) =>
      s.fields
        .filter(
          (f) => f.kind === 'warning' && !isIdentifier(s.id, f.key) && !isResidence(s.id, f.key),
        )
        .map(
          (f) =>
            `<div class="notice warning"><strong>${esc(local(f.label))}</strong><p>${esc(local(f.value))}</p></div>`,
        ),
    )
    .join('');
  const details = sections
    .map((s) => {
      const values = s.fields.filter(
        (f) => f.kind !== 'warning' && !isIdentifier(s.id, f.key) && !isResidence(s.id, f.key),
      );
      return values.length
        ? `<section class="detail-section"><h3>${esc(local(s.title))}</h3><dl>${values.map((f) => `<div><dt>${esc(local(f.label))}</dt><dd>${f.kind === 'link' ? `<a href="${esc(local(f.value))}" rel="noopener noreferrer">${esc(local(f.value))}</a>` : esc(local(f.value))}</dd></div>`).join('')}</dl></section>`
        : '';
    })
    .join('');
  return `<header class="public-header">${brand(config.site.ownerIndex ? prefix : '#main')}${controls(lang)}</header><main id="main" class="profile">

  <div class="profile-top"><div class="profile-media"><div class="profile-photo">${photo(pet, lang, prefix)}</div>${pet.photos.length > 1 ? `<section class="additional-photos" aria-label="${tr('More photos')}"><div class="gallery">${pet.photos.map((p, index) => `<a href="${esc(prefix + p.path)}" class="photo-thumbnail" data-photo-index="${index}" ${index === 0 ? 'aria-current="true"' : ''} target="_blank" rel="noopener noreferrer" aria-label="${tr('View photo')} ${index + 1} / ${pet.photos.length}"><img src="${esc(prefix + p.path)}" alt="${esc(local(p.alt) || pet.name)}" style="${photoPosition(p)}" width="160" height="120" loading="lazy"></a>`).join('')}</div></section>` : ''}</div><div class="profile-intro"><div class="name-row"><h1>${esc(pet.name)}</h1></div><p class="species">${esc(local(pet.species))}${pet.breed ? ` · ${esc(local(pet.breed))}` : ''}</p><p class="introduction">${esc(local(pet.introduction) || tr('Please contact my people so I can get home safely.'))}</p>
  ${identification}
  ${residenceHTML}
  <section class="contacts-public" aria-label="${tr('Contact my people')}"><h2>${tr('Contact my people')}</h2>${
    contacts.length
      ? contacts
          .map(
            (c, i) =>
              `<div class="public-contact"><div class="contact-heading"><strong>${esc(c.name)}</strong><span>${esc(local(c.relationship))}</span></div><div class="contact-actions">${(
                ['phone', 'whatsapp', 'email', 'telegram'] as const
              )
                .filter((k) => c[k])
                .sort((a, b) => Number(b === c.preferred) - Number(a === c.preferred))
                .map((k, j) =>
                  contactLink(k, c[k]!)
                    ? `<a class="button ${i === 0 && j === 0 ? 'primary' : ''}" href="${esc(contactLink(k, c[k]!))}" ${k === 'whatsapp' || k === 'telegram' ? 'rel="noopener noreferrer"' : ''}>${tr({ phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', telegram: 'Telegram' }[k])}<span class="sr-only"> ${esc(c.name)}</span></a>`
                    : `<span class="contact-placeholder">${esc(c[k])}</span>`,
                )
                .join(
                  '',
                )}<button class="button subtle enhanced-only" data-copy="${esc([c.name, c.phone, c.whatsapp, c.email, c.telegram].filter(Boolean).join(' · '))}">${tr('Copy contact')}</button></div>${c.availability ? `<p class="muted small">${esc(local(c.availability))}</p>` : ''}</div>`,
          )
          .join('')
      : `<p>${tr('No public contact is available.')}</p>`
  }</section>
  ${locationContact && !preview ? `<details class="location-share enhanced-only"><summary>${tr('Share my location')}</summary><p>${tr('Your browser will ask for location permission. A map link will be prepared in WhatsApp. You choose whether to send it. PetQR does not store your location.')}</p><button class="button" data-share-location="${esc(locationContact.whatsapp)}">${tr('Share my location')}</button><div data-location-result aria-live="polite"></div></details>` : ''}</div></div>
  ${warnings ? `<section class="critical-section" aria-label="${tr('Important information')}">${warnings}</section>` : ''}
  <details class="full-details"><summary>${tr('Full details')}</summary>${details || `<p>${esc(local(pet.species))}</p>`}</details>
  ${config.site.ownerIndex ? `<a class="back-link" href="${esc(prefix)}">← ${tr('All pets')}</a>` : ''}</main>${!preview ? quick : ''}${footer(config, lang, prefix)}<div class="toast" role="status" aria-live="polite" id="toast"></div>`;
}
export function renderIndex(config: Config, lang: Language): string {
  return `<header class="public-header">${brand('./')}${controls(lang)}</header><main id="main" class="owner-index"><div class="page-heading"><div><h1>${esc(config.site.title)}</h1><p>${t('Your pets, their people, always connected.', lang)}</p></div><div class="page-actions">${tutorialButton(lang, '', 'primary')}<a class="button" href="editor/">${t('Local editor', lang)}</a></div></div>${config.site.ownerIndex ? `<div class="pet-grid">${config.pets.map((p) => `<article class="pet-card"><a class="card-photo" href="${petPath(p)}">${photo(p, lang, '', true)}</a><div class="card-body"><div class="name-row"><h2><a href="${petPath(p)}">${esc(p.name)}</a></h2></div><p class="species">${esc(textOf(p.species, lang))}</p><a class="button primary" href="${petPath(p)}">${t('View profile', lang)} <span aria-hidden="true">↗</span></a></div></article>`).join('')}</div>` : `<p>${t('Profiles are public, including when the index is disabled.', lang)}</p>`}</main>${footer(config, lang)}<div class="toast" role="status" id="toast"></div>`;
}
export function htmlDocument(
  body: string,
  options: {
    title: string;
    lang: Language;
    prefix: string;
    indexing?: boolean;
    canonical?: string;
    photo?: string;
    script: string;
    description?: string;
  },
): string {
  const { title, lang, prefix, indexing, canonical, photo: ogPhoto, script, description } = options;
  return `<!doctype html>\n<html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${esc(title)}</title><meta name="description" content="${esc(description || 'Pet identification & emergency contacts · PetQR')}"><meta name="robots" content="${indexing ? 'index, follow' : 'noindex, nofollow'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="Pet identification · PetQR"><meta property="og:type" content="website">${canonical ? `<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">` : ''}${ogPhoto ? `<meta property="og:image" content="${esc(ogPhoto)}">` : ''}<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}assets/style.css"><script type="module" src="${prefix}assets/${script}"></script></head><body>${skipLink(lang)}${body}</body></html>`;
}
