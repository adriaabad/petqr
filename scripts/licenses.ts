import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Include actual installed license texts for all production dependencies, including transitive ones.
export async function dependencyLicenses(): Promise<string> {
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  const sections = ['PetQR third-party dependency licenses\nGenerated from package-lock.json.'];
  for (const [path, metadata] of Object.entries(lock.packages) as [string, { dev?: boolean }][]) {
    if (!path || metadata.dev || !path.startsWith('node_modules/')) continue;
    const directory = resolve(path);
    const info = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
    const names = (await readdir(directory)).filter((name) =>
      /^licen[cs]e(?:[-.].*)?$/i.test(name),
    );
    sections.push(
      `\n${'='.repeat(72)}\n${info.name} ${info.version} (${info.license || 'see package license'})`,
    );
    if (!names.length) throw new Error(`Missing dependency license: ${info.name}`);
    for (const name of names) sections.push(await readFile(resolve(directory, name), 'utf8'));
  }
  return sections.join('\n') + '\n';
}
