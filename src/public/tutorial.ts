import type { Config, Language } from '../shared/model';
import { preferredLanguage } from '../shared/i18n';
import { bindPreferences } from '../shared/preferences';
import { skipLink } from './render';
import { renderTutorial, tutorialTitle } from './tutorial-view';

document.documentElement.classList.add('js');
const base = new URL(/* @vite-ignore */ '../', import.meta.url);
async function start() {
  const response = await fetch(new URL('data/tutorial.json', base));
  if (!response.ok) throw new Error('Tutorial enhancement unavailable');
  const { site } = (await response.json()) as { site: Config['site'] };
  function render(lang: Language) {
    document.documentElement.lang = lang;
    document.title = tutorialTitle(lang);
    document.body.innerHTML = skipLink(lang) + renderTutorial(site, lang);
    bindPreferences(render);
  }
  render(preferredLanguage(site.defaultLanguage));
}
// The complete visual guide remains available if the enhancement cannot load.
void start().catch(() => {});
