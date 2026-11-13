export const DATA_PATHS = [
  'data/version.json',
  'data/site.json',
  'data/contacts.json',
  'data/pets.json',
] as const;
export interface Deployment {
  repository: string | null;
  repositoryId: number | null;
  branch: string | null;
  commit: string | null;
  dataShas: Record<string, string>;
  photoShas: Record<string, string>;
  configuredPublicUrl: string;
  resolvedPublicUrl: string;
}
export function repositoryName(value: string): string {
  const name = value.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name) || name.length > 200)
    throw new Error('Enter a repository as owner/name.');
  return name;
}
export function parseDeployment(value: unknown): Deployment {
  if (!value || typeof value !== 'object')
    throw new Error('Reload the editor to get safe publishing information.');
  const data = value as Deployment;
  if (data.repository) repositoryName(data.repository);
  if (
    !data.dataShas ||
    !DATA_PATHS.every((path) => /^[a-f0-9]{40}$/.test(data.dataShas[path])) ||
    !data.photoShas ||
    typeof data.photoShas !== 'object' ||
    Object.entries(data.photoShas).some(
      ([path, sha]) =>
        !/^assets\/pets\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/i.test(path) ||
        !/^[a-f0-9]{40}$/.test(sha),
    )
  )
    throw new Error('Reload the editor to get safe publishing information.');
  return {
    ...data,
    repository: data.repository || null,
    repositoryId: typeof data.repositoryId === 'number' ? data.repositoryId : null,
    branch: data.branch || null,
    commit: data.commit || null,
    configuredPublicUrl: data.configuredPublicUrl || '',
    resolvedPublicUrl: data.resolvedPublicUrl || '',
  };
}
export function tokenCreationURL(repository: string): string {
  const name = repositoryName(repository),
    url = new URL('https://github.com/settings/personal-access-tokens/new');
  url.search = new URLSearchParams({
    name: `PetQR ${name.split('/')[1]}`.slice(0, 40),
    description: `Publish PetQR data and photos. Select only ${name}.`,
    target_name: name.split('/')[0],
    expires_in: '7',
    contents: 'write',
  }).toString();
  return url.href;
}
