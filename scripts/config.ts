import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseConfig, assertPublishable, type Config } from '../src/shared/model';
export async function loadConfig(root = process.cwd()): Promise<Config> {
  const [version, site, contacts, pets] = await Promise.all(
    ['version', 'site', 'contacts', 'pets'].map(async (name) =>
      JSON.parse(await readFile(resolve(root, `data/${name}.json`), 'utf8')),
    ),
  );
  const config = parseConfig({ version, site, contacts, pets });
  assertPublishable(config);
  for (const pet of config.pets)
    for (const photo of pet.photos) {
      const path = resolve(root, photo.path);
      const info = await stat(path).catch(() => null);
      if (!info?.isFile()) throw new Error(`Pet ${pet.id}: missing image ${photo.path}`);
      if (info.size > 5 * 1024 * 1024)
        throw new Error(`Pet ${pet.id}: ${photo.path} exceeds the 5 MB published image limit.`);
    }
  return config;
}
