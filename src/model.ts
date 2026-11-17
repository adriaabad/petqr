import { z } from 'zod';
import en from 'zod/v4/locales/en.js';
import es from 'zod/v4/locales/es.js';
import ca from 'zod/v4/locales/ca.js';
import { safeURL, normalizeTelegram } from './core';
import { t } from './i18n';
export { safeURL, textOf, petPath, publicPetURL, resolvedContacts, contactLink } from './core';

export const languages = ['en', 'es', 'ca'] as const;
export type Language = (typeof languages)[number];
export const localized = z.union([
  z.string().max(10000),
  z
    .object({
      en: z.string().max(10000).optional(),
      es: z.string().max(10000).optional(),
      ca: z.string().max(10000).optional(),
    })
    .strict(),
]);
export type Localized = z.infer<typeof localized>;
export function setValidationLanguage(language: Language): void {
  z.config({ en, es, ca }[language]());
}
const id = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{2,63}$/, 'Use 3–64 lowercase letters, digits or hyphens.');
export function localImage(value: string): boolean {
  return /^assets\/pets\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/i.test(value);
}
const creditURL = z
  .string()
  .max(2000)
  .refine((value) => !value || safeURL(value), 'Use an HTTP(S) URL.')
  .default('');
export const photoCreditSchema = z
  .object({
    author: z.string().max(200).default(''),
    source: creditURL,
    license: z.string().max(200).default(''),
    licenseUrl: creditURL,
    changes: z.string().max(500).default(''),
  })
  .strict();
export const imageSchema = z
  .object({
    path: z.string().refine(localImage, 'Use a local assets/pets/ filename (WebP, PNG or JPEG).'),
    alt: localized,
    focus: z
      .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .strict()
      .optional(),
    credit: photoCreditSchema.optional(),
  })
  .strict();
export const fieldSchema = z
  .object({
    key: z.string().min(1).max(100),
    label: localized,
    value: localized,
    publish: z.boolean().default(false),
    sensitive: z.boolean().default(false),
    consent: z.boolean().default(false),
    kind: z.enum(['text', 'warning', 'link']).default('text'),
  })
  .strict();
export const sectionSchema = z
  .object({
    id: z.string().min(1).max(100),
    title: localized,
    fields: z.array(fieldSchema).max(500),
  })
  .strict();
const phone = z
  .string()
  .max(30)
  .refine(
    (v) => !v || /^\+?[0-9 ()-]{3,30}$/.test(v),
    'Use a telephone number, with optional +, spaces, parentheses and hyphens.',
  );
export const telegramSchema = z
  .string()
  .transform(normalizeTelegram)
  .refine(
    (value) => !value || /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value),
    'Enter a Telegram username, @username or https://t.me/username. Leave blank if you do not use Telegram.',
  );
const contactFields = {
  name: z.string().min(1).max(100),
  relationship: localized.optional(),
  phone: phone.optional(),
  whatsapp: phone.optional(),
  email: z.union([z.literal(''), z.email()]).optional(),
  telegram: telegramSchema.optional(),
  preferred: z.enum(['phone', 'whatsapp', 'email', 'telegram']).default('phone'),
  language: z.enum(languages).default('en'),
  availability: localized.optional(),
  publish: z.boolean().default(false),
  consent: z.boolean().default(false),
};
export const contactSchema = z.object({ id, ...contactFields }).strict();
export const contactOverrideSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    relationship: localized.optional(),
    phone: phone.optional(),
    whatsapp: phone.optional(),
    email: z.union([z.literal(''), z.email()]).optional(),
    telegram: telegramSchema.optional(),
    preferred: z.enum(['phone', 'whatsapp', 'email', 'telegram']).optional(),
    language: z.enum(languages).optional(),
    availability: localized.optional(),
    publish: z.boolean().optional(),
    consent: z.boolean().optional(),
  })
  .strict();
export const petSchema = z
  .object({
    id,
    shortId: id.max(12).optional(),
    name: z.string().min(1).max(100),
    species: localized,
    breed: localized.optional(),
    introduction: localized.optional(),
    status: z.enum(['safe', 'missing', 'found', 'custom']).default('safe'),
    statusLabel: localized.optional(),
    emergency: localized.optional(),
    photos: z.array(imageSchema).max(30).default([]),
    contacts: z
      .array(z.object({ id, overrides: contactOverrideSchema.optional() }).strict())
      .default([]),
    sections: z.array(sectionSchema).max(100).default([]),
    theme: z
      .object({
        accent: z
          .string()
          .regex(/^#[0-9a-f]{6}$/i)
          .default('#27634b'),
        background: z.enum(['sage', 'sand', 'sky']).default('sage'),
        icon: z.enum(['paw', 'heart', 'none']).default('paw'),
      })
      .strict()
      .default({ accent: '#27634b', background: 'sage', icon: 'paw' }),
    indexing: z.boolean().default(false),
  })
  .strict();
export const siteSchema = z
  .object({
    title: z.string().min(1).max(100).default('PetQR'),
    defaultLanguage: z.enum(languages).default('en'),
    publicUrl: z
      .string()
      .default('')
      .refine(
        (v) => !v || (safeURL(v) && !new URL(v).search && !new URL(v).hash),
        'Enter an HTTP(S) site URL without a query or fragment.',
      ),
    ownerIndex: z.boolean().default(true),
    attribution: z.boolean().default(true),
    sourceUrl: z
      .string()
      .default('')
      .refine((v) => !v || safeURL(v), 'Enter an HTTP(S) URL.'),
    fictional: z.boolean().default(false),
  })
  .strict();
export const configSchema = z
  .object({
    version: z.literal(1),
    site: siteSchema,
    contacts: z.array(contactSchema),
    pets: z.array(petSchema),
  })
  .strict()
  .superRefine((config, ctx) => {
    for (const group of ['pets', 'contacts'] as const) {
      const used = new Set<string>();
      config[group].forEach((item, i) => {
        if (used.has(item.id))
          ctx.addIssue({
            code: 'custom',
            path: [group, i, 'id'],
            message: `Duplicate ID: ${item.id}`,
          });
        used.add(item.id);
      });
    }
    const routes = new Map<string, number>();
    config.pets.forEach((pet, i) => {
      for (const route of new Set([pet.id, ...(pet.shortId ? [pet.shortId] : [])])) {
        if (routes.has(route) && routes.get(route) !== i)
          ctx.addIssue({
            code: 'custom',
            path: ['pets', i, route === pet.id ? 'id' : 'shortId'],
            message: `Duplicate profile path: ${route}`,
          });
        routes.set(route, i);
      }
      const refs = new Set<string>();
      pet.contacts.forEach((ref, j) => {
        if (!config.contacts.some((c) => c.id === ref.id))
          ctx.addIssue({
            code: 'custom',
            path: ['pets', i, 'contacts', j],
            message: `Unknown contact: ${ref.id}`,
          });
        if (refs.has(ref.id))
          ctx.addIssue({
            code: 'custom',
            path: ['pets', i, 'contacts', j],
            message: 'Contact already assigned.',
          });
        refs.add(ref.id);
      });
      for (const [si, section] of pet.sections.entries())
        for (const [fi, field] of section.fields.entries()) {
          if (field.kind === 'link')
            for (const value of typeof field.value === 'string'
              ? [field.value]
              : Object.values(field.value)) {
              if (value && !safeURL(value))
                ctx.addIssue({
                  code: 'custom',
                  path: ['pets', i, 'sections', si, 'fields', fi, 'value'],
                  message: 'Links must use HTTP(S), without embedded credentials.',
                });
            }
        }
    });
  });
export type Config = z.infer<typeof configSchema>;
export type Pet = z.infer<typeof petSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Field = z.infer<typeof fieldSchema>;

export function parseConfig(input: unknown): Config {
  return configSchema.parse(input);
}
export function explainError(error: unknown, language: Language = 'en'): string {
  return error instanceof z.ZodError
    ? error.issues
        .map((i) => `${i.path.join('.') || 'configuration'}: ${t(i.message, language)}`)
        .join('\n')
    : error instanceof Error
      ? t(error.message, language)
      : String(error);
}
// Medical sections and identification numbers require consent even if imported JSON sets sensitive:false.
export function needsConsent(section: string, field: Field): boolean {
  return (
    field.sensitive ||
    section === 'medical' ||
    /microchip|tattoo|registration|registry|identification.number|address|roamingArea/i.test(
      field.key,
    )
  );
}
export function publicConfig(input: Config): Config {
  const config = structuredClone(parseConfig(input));
  config.contacts = config.contacts.filter((c) => c.publish && c.consent);
  const contacts = new Set(config.contacts.map((c) => c.id));
  for (const pet of config.pets) {
    pet.contacts = pet.contacts
      .filter((c) => contacts.has(c.id))
      .map((ref) => {
        if (!ref.overrides) return ref;
        const merged = { ...config.contacts.find((c) => c.id === ref.id)!, ...ref.overrides };
        if (!merged.publish || !merged.consent) return null;
        // Overrides inherit an already-confirmed contact, but still cannot carry unpublished values.
        return ref;
      })
      .filter((ref): ref is NonNullable<typeof ref> => ref !== null);
    pet.sections = pet.sections
      .map((section) => ({
        ...section,
        fields: section.fields.filter(
          (f) => f.publish && (!needsConsent(section.id, f) || f.consent),
        ),
      }))
      .filter((s) => s.fields.length);
  }
  return config;
}
export function assertPublishable(config: Config): void {
  if (JSON.stringify(publicConfig(config)) !== JSON.stringify(config))
    throw new Error(
      'Configuration contains unpublished or unconfirmed sensitive data. Export public files from the editor before committing. Do not upload private drafts.',
    );
}
export function newPet(existing: readonly Pick<Pet, 'id' | 'shortId'>[] = []): Pet {
  const used = new Set(existing.flatMap((pet) => [pet.id, ...(pet.shortId ? [pet.shortId] : [])]));
  let shortId: string;
  do shortId = crypto.randomUUID().slice(0, 8);
  while (used.has(shortId));
  return petSchema.parse({
    id: shortId,
    name: 'New pet',
    species: '',
    photos: [],
    contacts: [],
    sections: [],
  });
}
// Older local drafts/ZIPs must not remove the published short address of the same animal.
export function preserveProfileAddresses(draft: Config, deployed: Config): Config {
  const next = parseConfig(draft);
  const addresses = new Map(deployed.pets.map((pet) => [pet.id, pet.shortId]));
  for (const pet of next.pets) {
    const shortId = addresses.get(pet.id);
    if (shortId) pet.shortId = shortId;
  }
  return parseConfig(next);
}
