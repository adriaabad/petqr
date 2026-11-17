import type { Config, Language } from '../shared/model';
import { t } from '../shared/i18n';
import { templateURL, publicationGuide } from '../shared/publishing';
import { brand, controls, esc, footer, paw } from './render';

const copy = {
  ca: {
    eyebrow: 'GUIA VISUAL · 6 PASSOS',
    title: 'El teu PetQR, pas a pas.',
    intro:
      'Una fitxa per a cada mascota. Un QR perquè et puguin contactar. Crea la teva còpia i fes-la teva.',
    create: 'Crear la meva còpia',
    start: 'Veure els passos',
    benefit: 'Sense compte PetQR · Sense subscripció',
    journey: 'D’una còpia a una placa.',
    journeyText: 'Comença a GitHub. Després edita les teves dades i deixa que la web es publiqui.',
    own: 'LA TEVA MASCOTA',
    owner: 'El teu contacte',
    tag: 'LA SEVA PLACA',
    name: 'Nom de la mascota',
    photo: 'Les teves fotos',
    details: 'Veure la guia detallada',
    ready: 'La teva web. Les teves mascotes.',
    readyText:
      'Crea la còpia al teu compte de GitHub. Activa Pages una vegada i després cada actualització que hi pugis es publicarà automàticament.',
    editor: 'Obrir l’editor',
    editorHint: 'Si aquesta ja és la teva còpia, pots anar directament a l’editor.',
    steps: [
      [
        'Crea la teva còpia',
        'Prem «Crear la meva còpia», inicia sessió a GitHub i tria el teu compte, un nom i Public.',
      ],
      [
        'Activa la teva web',
        'A Settings → Pages, tria GitHub Actions. Després executa Actions → Validate, test & deploy PetQR → Run workflow.',
      ],
      [
        'Presenta la teva mascota',
        'Obre /editor/ a la teva web. Canvia les fotos, el nom i els contactes. Marca només les dades que vulguis publicar.',
      ],
      [
        'Exporta i puja els fitxers',
        'Descarrega i extreu el ZIP. Puja data/ i assets/ a l’arrel del teu repositori amb Add file → Upload files. Prem Commit changes.',
      ],
      [
        'Espera el verd',
        'GitHub comprova i publica els canvis. Quan Actions acabi en verd, obre la fitxa i revisa que tot sigui correcte.',
      ],
      [
        'Genera i prova el QR',
        'A l’editor de la teva web, prem QR de la mascota. Escaneja’l amb el mòbil abans d’imprimir-lo i no canviïs després la seva adreça.',
      ],
    ],
    live: 'La teva web està publicada',
    edit: 'Edita',
    export: 'Exporta',
    scan: 'Escaneja i contacta',
  },
  es: {
    eyebrow: 'GUÍA VISUAL · 6 PASOS',
    title: 'Tu PetQR, paso a paso.',
    intro:
      'Una ficha para cada mascota. Un QR para que puedan contactarte. Crea tu copia y hazla tuya.',
    create: 'Crear mi copia',
    start: 'Ver los pasos',
    benefit: 'Sin cuenta PetQR · Sin suscripción',
    journey: 'De una copia a una placa.',
    journeyText: 'Empieza en GitHub. Después edita tus datos y deja que la web se publique.',
    own: 'TU MASCOTA',
    owner: 'Tu contacto',
    tag: 'SU PLACA',
    name: 'Nombre de la mascota',
    photo: 'Tus fotos',
    details: 'Ver la guía detallada',
    ready: 'Tu web. Tus mascotas.',
    readyText:
      'Crea la copia en tu cuenta de GitHub. Activa Pages una vez y después cada actualización que subas se publicará automáticamente.',
    editor: 'Abrir el editor',
    editorHint: 'Si esta ya es tu copia, puedes ir directamente al editor.',
    steps: [
      [
        'Crea tu copia',
        'Pulsa «Crear mi copia», inicia sesión en GitHub y elige tu cuenta, un nombre y Public.',
      ],
      [
        'Activa tu web',
        'En Settings → Pages, elige GitHub Actions. Después ejecuta Actions → Validate, test & deploy PetQR → Run workflow.',
      ],
      [
        'Presenta a tu mascota',
        'Abre /editor/ en tu web. Cambia las fotos, el nombre y los contactos. Marca solo los datos que quieras publicar.',
      ],
      [
        'Exporta y sube los archivos',
        'Descarga y extrae el ZIP. Sube data/ y assets/ a la raíz de tu repositorio mediante Add file → Upload files. Pulsa Commit changes.',
      ],
      [
        'Espera el verde',
        'GitHub comprueba y publica los cambios. Cuando Actions termine en verde, abre la ficha y revisa que todo sea correcto.',
      ],
      [
        'Genera y prueba el QR',
        'En el editor de tu web, pulsa QR de la mascota. Escanéalo con el móvil antes de imprimirlo y no cambies después su dirección.',
      ],
    ],
    live: 'Tu web está publicada',
    edit: 'Edita',
    export: 'Exporta',
    scan: 'Escanea y contacta',
  },
  en: {
    eyebrow: 'VISUAL GUIDE · 6 STEPS',
    title: 'Your PetQR, step by step.',
    intro:
      'A profile for each pet. A QR code so people can reach you. Create your copy and make it yours.',
    create: 'Create my copy',
    start: 'See the steps',
    benefit: 'No PetQR account · No subscription',
    journey: 'From a copy to a tag.',
    journeyText: 'Start on GitHub. Then edit your information and let your website publish.',
    own: 'YOUR PET',
    owner: 'Your contact',
    tag: 'THEIR TAG',
    name: 'Pet name',
    photo: 'Your photos',
    details: 'See the detailed guide',
    ready: 'Your website. Your pets.',
    readyText:
      'Create the copy in your GitHub account. Enable Pages once, then each update you upload will publish automatically.',
    editor: 'Open the editor',
    editorHint: 'If this is already your copy, you can go straight to the editor.',
    steps: [
      [
        'Create your copy',
        'Choose “Create my copy”, sign in to GitHub and select your own account, a name and Public.',
      ],
      [
        'Enable your website',
        'In Settings → Pages, choose GitHub Actions. Then run Actions → Validate, test & deploy PetQR → Run workflow.',
      ],
      [
        'Introduce your pet',
        'Open /editor/ on your website. Change the photos, name and contacts. Select only the information you want to publish.',
      ],
      [
        'Export and upload',
        'Download and extract the ZIP. Upload data/ and assets/ to your repository root using Add file → Upload files. Choose Commit changes.',
      ],
      [
        'Wait for green',
        'GitHub checks and publishes your changes. When Actions finishes in green, open the profile and check everything is correct.',
      ],
      [
        'Create and test the QR',
        'In your website’s editor, choose the pet’s QR code. Scan it with your phone before printing and keep its address unchanged afterwards.',
      ],
    ],
    live: 'Your website is published',
    edit: 'Edit',
    export: 'Export',
    scan: 'Scan and contact',
  },
} as const;

function visual(step: number, lang: Language): string {
  const w = copy[lang];
  const sketches = [
    `<div class="mock-window"><div class="mock-window-bar"><i></i><i></i><i></i><span>GitHub</span></div><div class="mock-window-body"><div class="mock-repo">${paw}<strong>petqr</strong><span class="mock-badge">Public</span></div><div class="mock-line"></div><div class="mock-line short"></div><div class="mock-button">Use this template <span>↗</span></div></div></div>`,
    `<div class="mock-window"><div class="mock-window-bar"><span>Settings <b>›</b> Pages</span></div><div class="mock-window-body"><span class="mock-label">Source</span><div class="mock-select">GitHub Actions <b>⌄</b></div><div class="mock-run"><span>▶</span> Run workflow</div></div></div>`,
    `<div class="mock-window"><div class="mock-window-bar"><span>PetQR <b>/</b> ${w.edit}</span></div><div class="mock-window-body mock-editor"><div class="mock-avatar">${paw}</div><div><span class="mock-label">${w.name}</span><div class="mock-input"></div><span class="mock-label">${w.owner}</span><div class="mock-input short"></div></div><div class="mock-photo-chips"><i></i><i></i><i></i><span>${w.photo}</span></div></div></div>`,
    `<div class="mock-transfer"><div class="mock-zip"><span>↓</span><strong>ZIP</strong></div><span class="mock-arrow">→</span><div class="mock-folders"><div>▰ <strong>data/</strong></div><div>▰ <strong>assets/</strong></div><span>Upload files</span></div></div>`,
    `<div class="mock-window"><div class="mock-window-bar"><span>GitHub Actions</span></div><div class="mock-window-body"><div class="mock-checks"><span>✓ Validate</span><span>✓ Build</span><span>✓ Publish</span></div><div class="mock-success"><span>●</span> ${w.live}</div></div></div>`,
    `<div class="mock-finish"><div class="mock-tag"><span class="mock-tag-hole"></span>${paw}<strong>PetQR</strong><span class="mock-qr-icon">QR</span></div><span class="mock-arrow">→</span><div class="mock-phone"><div class="mock-phone-paw">${paw}</div><strong>${w.own}</strong><div class="mock-phone-actions"><span>☎</span><span>✉</span></div><span>${w.scan}</span></div></div>`,
  ];
  return `<div class="tutorial-visual visual-${step + 1}" aria-hidden="true">${sketches[step]}</div>`;
}
export function renderTutorial(site: Config['site'], lang: Language): string {
  const w = copy[lang],
    prefix = '../';
  const config: Config = { version: 1, site, pets: [], contacts: [] };
  const create = `<a class="button primary" href="${esc(templateURL)}" target="_blank" rel="noopener noreferrer">${w.create} <span aria-hidden="true">↗</span></a>`;
  return `<div class="tutorial-page"><header class="public-header">${brand(prefix)}${controls(lang)}</header><main id="main" class="tutorial-main"><section class="tutorial-hero"><div><p class="tutorial-eyebrow">${w.eyebrow}</p><h1>${w.title}</h1><p class="tutorial-lead">${w.intro}</p><div class="tutorial-actions">${create}<a class="button" href="#steps">${w.start} <span aria-hidden="true">↓</span></a></div><p class="tutorial-benefit">${w.benefit}</p></div><div class="tutorial-hero-art" aria-hidden="true"><div class="hero-orbit"></div><div class="hero-pet-card"><div class="hero-pet-avatar">${paw}</div><span>${w.own}</span><div class="hero-line"></div><div class="hero-contact">☎ &nbsp; WhatsApp &nbsp; ✉</div></div><div class="hero-pet-tag">${paw}<strong>PetQR</strong><span>QR</span></div><span class="hero-art-caption">PetQR <b>→</b> ${w.owner}</span></div></section><section id="steps" class="tutorial-steps-section"><div class="tutorial-section-heading"><p class="tutorial-eyebrow">01 — 06</p><h2>${w.journey}</h2><p>${w.journeyText}</p></div><ol class="tutorial-steps">${w.steps.map(([title, description], index) => `<li class="tutorial-step">${visual(index, lang)}<div class="tutorial-step-copy"><span class="tutorial-step-number">${String(index + 1).padStart(2, '0')}</span><h3>${title}</h3><p>${description}</p></div></li>`).join('')}</ol></section><section class="tutorial-ready"><div>${paw}<h2>${w.ready}</h2><p>${w.readyText}</p></div><div class="tutorial-actions">${create}<a class="button" href="${prefix}editor/">${w.editor}</a></div><p class="hint">${w.editorHint}</p></section><details class="tutorial-details"><summary>${w.details}</summary>${publicationGuide(site.publicUrl, lang, true)}</details></main>${footer(config, lang, prefix, false)}</div>`;
}
export function tutorialTitle(lang: Language): string {
  return `${t('I want my PetQR', lang)} · PetQR`;
}
