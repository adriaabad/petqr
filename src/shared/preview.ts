import { contactSchema, contactOverrideSchema, publicConfig, type Config } from './model';

// Incomplete optional contact methods must not prevent editing a photo. This is a preview-only
// projection: preserve the draft verbatim, flag omitted methods, and keep export validation strict.
export function profilePreview(
  draft: Config,
  petId: string,
): { config: Config; incompleteContacts: string[] } {
  const pet = draft.pets.find((p) => p.id === petId);
  if (!pet) throw new Error('Pet not found.');
  const scoped = structuredClone({
    ...draft,
    pets: [pet],
    contacts: draft.contacts.filter((c) => pet.contacts.some((ref) => ref.id === c.id)),
  });
  const incomplete = new Set<string>();
  for (const contact of scoped.contacts) {
    for (const method of ['phone', 'whatsapp', 'email', 'telegram'] as const) {
      const result = contactOverrideSchema.shape[method].safeParse(contact[method]);
      if (!result.success) {
        contact[method] = '';
        incomplete.add(contact.name || contact.id);
      } else if (result.data !== undefined) contact[method] = result.data;
    }
  }
  for (const ref of scoped.pets[0].contacts) {
    if (!ref.overrides) continue;
    for (const method of ['phone', 'whatsapp', 'email', 'telegram'] as const) {
      const result = contactOverrideSchema.shape[method].safeParse(ref.overrides[method]);
      if (!result.success) {
        ref.overrides[method] = '';
        incomplete.add(scoped.contacts.find((c) => c.id === ref.id)?.name || ref.id);
      } else if (result.data !== undefined) ref.overrides[method] = result.data;
    }
  }
  scoped.contacts = scoped.contacts.filter((contact) => {
    const valid = contactSchema.safeParse(contact).success;
    if (!valid) incomplete.add(contact.name || contact.id);
    return valid;
  });
  scoped.pets[0].contacts = scoped.pets[0].contacts.filter((ref) =>
    scoped.contacts.some((c) => c.id === ref.id),
  );
  return { config: publicConfig(scoped), incompleteContacts: [...incomplete] };
}
