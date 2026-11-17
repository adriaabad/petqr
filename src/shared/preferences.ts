import type { Language } from './model';
import { t } from './i18n';
export function applyTheme(): void {
  let theme = 'system';
  try {
    theme = localStorage.getItem('petqr-theme') || theme;
  } catch {}
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll<HTMLSelectElement>('[data-theme]').forEach((s) => (s.value = theme));
}
export function bindPreferences(onLanguage: (lang: Language) => void): void {
  applyTheme();
  document.querySelectorAll<HTMLSelectElement>('[data-language]').forEach(
    (s) =>
      (s.onchange = () => {
        try {
          localStorage.setItem('petqr-language', s.value);
        } catch {}
        onLanguage(s.value as Language);
        document
          .querySelector<HTMLSelectElement>('[data-language]')
          ?.focus({ preventScroll: true });
      }),
  );
  document.querySelectorAll<HTMLSelectElement>('[data-theme]').forEach(
    (s) =>
      (s.onchange = () => {
        try {
          localStorage.setItem('petqr-theme', s.value);
        } catch {}
        applyTheme();
      }),
  );
}
let timer: ReturnType<typeof setTimeout>;
export function toast(message: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('visible'), 5000);
}
export async function copy(value: string, lang: Language): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast(t('Copied.', lang));
  } catch {
    toast(t('Unable to copy. Select and copy the URL manually.', lang));
  }
}
