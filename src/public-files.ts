import { publicConfig, type Config } from './model';
export type ImageFiles = Map<string, Uint8Array>;
export async function publicFiles(
  draft: Config,
  images: ImageFiles,
  base: URL,
): Promise<Record<string, Uint8Array>> {
  const config = publicConfig(draft),
    files: Record<string, Uint8Array> = {};
  for (const key of ['version', 'site', 'contacts', 'pets'] as const)
    files[`data/${key}.json`] = new TextEncoder().encode(
      JSON.stringify(config[key], null, 2) + '\n',
    );
  const paths = new Set(config.pets.flatMap((p) => p.photos.map((photo) => photo.path)));
  await Promise.all(
    [...paths].map(async (path) => {
      if (images.has(path)) {
        files[path] = images.get(path)!;
        return;
      }
      const response = await fetch(new URL(path, base), { credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error(`Missing photo: ${path}`);
      files[path] = new Uint8Array(await response.arrayBuffer());
    }),
  );
  return files;
}
