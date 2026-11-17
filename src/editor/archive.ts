import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { parseConfig, publicConfig, localImage, type Config } from '../shared/model';
import { photoCreditsText, creditedPhotos } from '../shared/photo-credits';
import { publicationInstructions } from '../shared/publishing';
export type ImageFiles = Map<string, Uint8Array>;
export async function exportArchive(
  draft: Config,
  images: ImageFiles,
  base: URL,
  language = draft.site.defaultLanguage,
): Promise<Uint8Array> {
  const config = publicConfig(draft);
  const files: Record<string, Uint8Array> = {};
  if (creditedPhotos(config).length) files['PHOTO_CREDITS.txt'] = strToU8(photoCreditsText(config));
  files['PUBLISHING.txt'] = strToU8(publicationInstructions(config.site.publicUrl, language));
  for (const key of ['version', 'site', 'contacts', 'pets'] as const)
    files[`data/${key}.json`] = strToU8(JSON.stringify(config[key], null, 2) + '\n');
  const paths = new Set(config.pets.flatMap((p) => p.photos.map((photo) => photo.path)));
  await Promise.all(
    [...paths].map(async (path) => {
      if (images.has(path)) {
        files[path] = images.get(path)!;
        return;
      }
      const response = await fetch(new URL(path, base));
      if (!response.ok) throw new Error(`Missing photo: ${path}`);
      files[path] = new Uint8Array(await response.arrayBuffer());
    }),
  );
  return zipSync(files, { level: 0 });
}
export function importArchive(bytes: Uint8Array): { config: Config; images: ImageFiles } {
  if (bytes.length > 60 * 1024 * 1024) throw new Error('ZIP is larger than 60 MB.');
  let total = 0;
  const files = unzipSync(bytes, {
    filter: (file) => {
      total += file.originalSize;
      if (total > 120 * 1024 * 1024 || file.originalSize > 15 * 1024 * 1024)
        throw new Error('Archive exceeds safe extraction limits.');
      return (
        ['data/version.json', 'data/site.json', 'data/contacts.json', 'data/pets.json'].includes(
          file.name,
        ) || localImage(file.name)
      );
    },
  });
  const read = (key: string) => {
    const content = files[`data/${key}.json`];
    if (!content) throw new Error(`Missing data/${key}.json in ZIP.`);
    return JSON.parse(strFromU8(content));
  };
  const config = parseConfig({
    version: read('version'),
    site: read('site'),
    contacts: read('contacts'),
    pets: read('pets'),
  });
  const images: ImageFiles = new Map();
  for (const pet of config.pets)
    for (const image of pet.photos) {
      if (!files[image.path]) throw new Error(`Missing photo in ZIP: ${image.path}`);
      images.set(image.path, files[image.path]);
    }
  return { config, images };
}
