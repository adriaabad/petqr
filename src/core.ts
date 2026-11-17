// Shared, dependency-free public-profile helpers. Runtime schemas stay in the editor/build.
import type { Config, Pet, Contact, Language, Localized } from './model';
export const languages = ['en', 'es', 'ca'] as const;
export function normalizeTelegram(value: string): string {
  const input = value.trim();
  if (!input) return '';
  if (input.startsWith('@')) return input.slice(1);
  const link = /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/?$/i.exec(
    input,
  );
  return link ? link[1] : input;
}
export function textOf(
  value: Localized | undefined,
  lang: Language,
  fallback: Language = 'en',
): string {
  return typeof value === 'string'
    ? value
    : value?.[lang] || value?.[fallback] || value?.en || value?.es || value?.ca || '';
}
export function safeURL(value: string): boolean {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
  } catch {
    return false;
  }
}
type ProfileAddress = string | Pick<Pet, 'id' | 'shortId'>;
export function petPath(pet: ProfileAddress): string {
  return `p/${typeof pet === 'string' ? pet : pet.shortId || pet.id}/`;
}
export function publicPetURL(siteUrl: string, pet: ProfileAddress): string {
  if (!siteUrl || !safeURL(siteUrl))
    throw new Error('Configure the final public site URL before generating QR codes.');
  const url = new URL(siteUrl);
  if (
    ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(url.hostname) ||
    url.hostname.endsWith('.localhost')
  )
    throw new Error('QR codes require your deployed public URL, not localhost.');
  return new URL(petPath(pet), siteUrl.replace(/\/+$/, '') + '/').href;
}
export function resolvedContacts(config: Config, pet: Pet): Contact[] {
  return pet.contacts.flatMap((ref) => {
    const contact = config.contacts.find((c) => c.id === ref.id);
    if (!contact) return [];
    const merged = { ...contact, ...ref.overrides };
    return merged.publish && merged.consent ? [merged] : [];
  });
}
export function contactLink(
  kind: 'phone' | 'whatsapp' | 'email' | 'telegram',
  value: string,
  message = '',
): string {
  if (!value.trim()) return '';
  if (kind === 'phone') return `tel:${value.replace(/[^+0-9]/g, '')}`;
  if (kind === 'whatsapp')
    return `https://wa.me/${value.replace(/\D/g, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  if (kind === 'telegram') return `https://t.me/${encodeURIComponent(normalizeTelegram(value))}`;
  return `mailto:${encodeURIComponent(value).replace(/%40/g, '@')}`;
}
