import { zipSync, unzipSync, strFromU8 } from 'fflate';
import { parseConfig, localImage, type Config } from './model';
import { publicFiles, type ImageFiles } from './public-files';
export type { ImageFiles } from './public-files';
export async function exportArchive(
  draft: Config,
  images: ImageFiles,
  base: URL,
): Promise<Uint8Array> {
  const files = await publicFiles(draft, images, base);
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
