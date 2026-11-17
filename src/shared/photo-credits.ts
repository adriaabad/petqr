import type { Config } from './model';

export function creditedPhotos(config: Config) {
  const seen = new Set<string>();
  return config.pets
    .flatMap((pet) => pet.photos)
    .filter((photo) => {
      if (!photo.credit || !Object.values(photo.credit).some((value) => value.trim())) return false;
      const key = photo.path + JSON.stringify(photo.credit);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// Only images referenced by the published configuration belong in the generated credits.
export function photoCreditsText(config: Config): string {
  const photos = creditedPhotos(config);
  return (
    'Photo credits / Crèdits de les fotografies\n\n' +
    (photos.length
      ? photos
          .map((photo) => {
            const credit = photo.credit!;
            return [
              `Image: ${photo.path}`,
              ...(
                [
                  ['Author', credit.author],
                  ['Source', credit.source],
                  ['License / permission', credit.license],
                  ['License URL', credit.licenseUrl],
                  ['Changes', credit.changes],
                ] as const
              )
                .filter(([, value]) => value.trim())
                .map(([label, value]) => `${label}: ${value}`),
            ].join('\n');
          })
          .join('\n\n')
      : 'No attribution metadata is specified for the current photos.') +
    '\n\nUploading, replacing or exporting an image does not transfer or remove copyright. Each photograph keeps its applicable rights and permissions.\n'
  );
}
