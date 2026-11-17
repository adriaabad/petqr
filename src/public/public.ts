import type { Config, Language } from '../shared/model';
import { contactLink } from '../shared/core';
import { renderIndex, renderProfile, skipLink } from './render';
import { preferredLanguage, t } from '../shared/i18n';
import { bindPreferences, copy, toast } from '../shared/preferences';
import { bindPhotoGallery } from './gallery';
document.documentElement.classList.add('js');
const base = new URL(/* @vite-ignore */ '../', import.meta.url);
// This bundle only enhances already rendered static HTML. Network failure leaves emergency actions intact.
async function start() {
  const marker = document.querySelector<HTMLMetaElement>('meta[name="petqr-id"]')?.content;
  const response = await fetch(
    new URL(marker ? `p/${marker}/profile.json` : 'data/index.json', base),
  );
  if (!response.ok) throw new Error('Profile enhancement unavailable');
  const config = (await response.json()) as Config;
  let lang = preferredLanguage(config.site.defaultLanguage);
  function render(next: Language) {
    lang = next;
    document.documentElement.lang = lang;
    const skip = skipLink(lang);
    document.body.innerHTML =
      skip + (marker ? renderProfile(config, config.pets[0], lang) : renderIndex(config, lang));
    bindPreferences(render);
    bindPhotoGallery();
    document.querySelectorAll<HTMLElement>('[data-copy]').forEach(
      (b) =>
        (b.onclick = () => {
          void copy(b.dataset.copy!, lang);
        }),
    );
    const button = document.querySelector<HTMLButtonElement>('[data-share-location]');
    if (button)
      button.onclick = () => {
        const result = document.querySelector<HTMLElement>('[data-location-result]')!;
        button.disabled = true;
        if (!navigator.geolocation) {
          result.textContent = t(
            'Location unavailable. Contact the owner and describe where you are.',
            lang,
          );
          button.disabled = false;
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const link = document.createElement('a');
            link.className = 'button';
            link.textContent = t('Open WhatsApp with location', lang);
            link.rel = 'noopener noreferrer';
            link.href = contactLink(
              'whatsapp',
              button.dataset.shareLocation!,
              `${t('I found your pet. Here is my location:', lang)} https://www.openstreetmap.org/?mlat=${position.coords.latitude.toFixed(5)}&mlon=${position.coords.longitude.toFixed(5)}#map=16/${position.coords.latitude.toFixed(5)}/${position.coords.longitude.toFixed(5)}`,
            );
            result.replaceChildren(link);
            button.disabled = false;
          },
          () => {
            result.textContent = t(
              'Location unavailable. Contact the owner and describe where you are.',
              lang,
            );
            button.disabled = false;
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 },
        );
      };
  }
  render(lang);
}
void start().catch(() => {
  bindPreferences((lang) => toast(t('Language unavailable offline', lang)));
});
