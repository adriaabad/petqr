import type { Language } from './model';
import { esc } from '../public/render';

export const templateURL =
  'https://github.com/new?template_owner=adriaabad&template_name=petqr&name=petqr&visibility=public';
const words = {
  en: {
    title: 'Create and publish your website',
    create: 'Create my copy on GitHub',
    account: 'Create a GitHub account',
    intro:
      'For your first website, create your own copy of the template. If you already have one, update it with the ZIP.',
    setup: 'First-time setup',
    first: [
      'Sign in to GitHub, or create a free account. Choose “Create my copy on GitHub”, select your own account, give the repository a name and choose Public. Confirm “Create repository”.',
      'In the new repository, open Settings → Pages. Under Build and deployment → Source, select GitHub Actions. This is a one-time setting.',
      'Open Actions → Validate, test & deploy PetQR → Run workflow. If GitHub asks, enable workflows. Wait for the green result and open the website link shown by the deployment.',
      'Open /editor/ on YOUR new website. It automatically detects its own public address. Edit your animals, photos and contacts there, then export your files.',
    ],
    missing:
      'Cannot see “Use this template” on GitHub? Sign in and use the direct “Create my copy” link above.',
    update: 'Update your existing website',
    steps: [
      'Download and extract the ZIP. Upload the extracted data/ and assets/ folders to the top level of YOUR repository using Add file → Upload files. Replace the matching files; keep the folder structure. Do not upload the ZIP itself.',
      'Choose Commit changes on the default branch. GitHub checks and publishes the website automatically. Follow the result in Actions.',
      'Once the deployment is green, refresh the public profile and check its details. Generate and print QR codes only from your own published website.',
    ],
    automatic:
      'After the initial Pages setup, each saved change in GitHub rebuilds and publishes the website. The local editor prepares your ZIP; downloading it does not upload it to GitHub.',
    repo: 'Open this website’s repository',
    pages: 'Pages settings',
    actions: 'View deployment',
    included: 'These instructions are also included as PUBLISHING.txt in the ZIP.',
  },
  es: {
    title: 'Crear y publicar tu web',
    create: 'Crear mi copia en GitHub',
    account: 'Crear una cuenta de GitHub',
    intro:
      'Para tu primera web, crea tu propia copia de la plantilla. Si ya tienes una, actualízala con el ZIP.',
    setup: 'Configuración inicial',
    first: [
      'Inicia sesión en GitHub o crea una cuenta gratuita. Pulsa “Crear mi copia en GitHub”, selecciona tu cuenta, pon un nombre al repositorio y elige Public. Confirma “Create repository”.',
      'En el repositorio nuevo, abre Settings → Pages. En Build and deployment → Source, selecciona GitHub Actions. Solo debes configurarlo una vez.',
      'Abre Actions → Validate, test & deploy PetQR → Run workflow. Si GitHub lo solicita, activa los flujos de trabajo. Espera el resultado verde y abre el enlace de la web que aparece en la publicación.',
      'Abre /editor/ en TU nueva web. Detecta automáticamente su propia dirección pública. Edita allí tus animales, fotos y contactos y después exporta los archivos.',
    ],
    missing:
      '¿No aparece “Use this template” en GitHub? Inicia sesión y utiliza el enlace directo “Crear mi copia” de arriba.',
    update: 'Actualizar tu web existente',
    steps: [
      'Descarga y extrae el ZIP. Sube las carpetas data/ y assets/ extraídas a la raíz de TU repositorio mediante Add file → Upload files. Sustituye los archivos coincidentes y conserva la estructura de carpetas. No subas el ZIP directamente.',
      'Pulsa Commit changes en la rama predeterminada. GitHub comprueba y publica la web automáticamente. Sigue el resultado en Actions.',
      'Cuando la publicación esté en verde, actualiza la ficha pública y revisa sus datos. Genera e imprime los QR únicamente desde tu propia web publicada.',
    ],
    automatic:
      'Tras configurar Pages por primera vez, cada cambio guardado en GitHub reconstruye y publica la web. El editor local prepara el ZIP; descargarlo no lo sube a GitHub.',
    repo: 'Abrir el repositorio de esta web',
    pages: 'Configuración de Pages',
    actions: 'Ver publicación',
    included: 'Estas instrucciones también se incluyen como PUBLISHING.txt en el ZIP.',
  },
  ca: {
    title: 'Crear i publicar la teva web',
    create: 'Crear la meva còpia a GitHub',
    account: 'Crear un compte de GitHub',
    intro:
      'Per a la primera web, crea la teva pròpia còpia de la plantilla. Si ja en tens una, actualitza-la amb el ZIP.',
    setup: 'Configuració inicial',
    first: [
      'Inicia sessió a GitHub o crea un compte gratuït. Prem “Crear la meva còpia a GitHub”, selecciona el teu compte, posa un nom al repositori i tria Public. Confirma “Create repository”.',
      'Al repositori nou, obre Settings → Pages. A Build and deployment → Source, selecciona GitHub Actions. Només ho has de configurar una vegada.',
      'Obre Actions → Validate, test & deploy PetQR → Run workflow. Si GitHub ho demana, activa els fluxos de treball. Espera el resultat verd i obre l’enllaç de la web que apareix a la publicació.',
      'Obre /editor/ a la TEVA web nova. Detecta automàticament la seva pròpia adreça pública. Edita-hi els animals, les fotos i els contactes i després exporta els fitxers.',
    ],
    missing:
      'No apareix “Use this template” a GitHub? Inicia sessió i utilitza l’enllaç directe “Crear la meva còpia” de més amunt.',
    update: 'Actualitzar la teva web existent',
    steps: [
      'Descarrega i extreu el ZIP. Puja les carpetes data/ i assets/ extretes a l’arrel del TEU repositori amb Add file → Upload files. Substitueix els fitxers coincidents i conserva l’estructura de carpetes. No pugis el ZIP directament.',
      'Prem Commit changes a la branca predeterminada. GitHub comprova i publica la web automàticament. Segueix el resultat a Actions.',
      'Quan la publicació estigui en verd, actualitza la fitxa pública i revisa’n les dades. Genera i imprimeix els QR només des de la teva pròpia web publicada.',
    ],
    automatic:
      'Després de configurar Pages per primera vegada, cada canvi desat a GitHub reconstrueix i publica la web. L’editor local prepara el ZIP; descarregar-lo no el puja a GitHub.',
    repo: 'Obrir el repositori d’aquesta web',
    pages: 'Configuració de Pages',
    actions: 'Veure la publicació',
    included: 'Aquestes instruccions també s’inclouen com a PUBLISHING.txt al ZIP.',
  },
} as const;

// Infer only standard GitHub Pages addresses; custom domains cannot reveal a repository.
export function repositoryURL(siteURL: string): string | undefined {
  try {
    const url = new URL(siteURL);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    )
      return;
    const match = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.github\.io$/i.exec(url.hostname);
    const parts = url.pathname.split('/').filter(Boolean);
    if (!match || parts.length > 1 || (parts[0] && !/^[a-z0-9_.-]+$/i.test(parts[0]))) return;
    return `https://github.com/${match[1]}/${parts[0] || url.hostname}`;
  } catch {
    return;
  }
}
export function publicationGuide(siteURL: string, lang: Language, expanded = false): string {
  const w = words[lang],
    repo = repositoryURL(siteURL);
  const list = (items: readonly string[]) =>
    `<ol>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>`;
  const link = (url: string, label: string) =>
    `<a class="button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  return `<section class="publication-guide"><h2>${w.title}</h2><p>${w.intro}</p><div class="settings-actions">${link(templateURL, w.create)}${link('https://github.com/signup', w.account)}</div><details class="setup-guide" ${expanded ? 'open' : ''}><summary>${w.setup}</summary>${list(w.first)}<p class="hint">${w.missing}</p></details><h3>${w.update}</h3>${list(w.steps)}<p>${w.automatic}</p>${repo ? `<div class="settings-actions">${link(repo, w.repo)}${link(repo + '/settings/pages', w.pages)}${link(repo + '/actions/workflows/pages.yml', w.actions)}</div>` : ''}<p class="hint">${w.included}</p></section>`;
}
export function publicationInstructions(siteURL: string, lang: Language): string {
  const w = words[lang];
  return `${w.title}\n\n${w.intro}\n\n${w.create}: ${templateURL}\n${w.account}: https://github.com/signup\n\n${w.setup}\n${w.first.map((item, index) => `${index + 1}. ${item}`).join('\n\n')}\n\n${w.missing}\n\n${w.update}\n${w.steps.map((item, index) => `${index + 1}. ${item}`).join('\n\n')}\n\n${w.automatic}\n${repositoryURL(siteURL) ? '\n' + w.repo + ': ' + repositoryURL(siteURL) + '\n' : ''}`;
}
