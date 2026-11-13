import { DATA_PATHS, parseDeployment, repositoryName, type Deployment } from './deployment';
import { localImage, parseConfig, assertPublishable } from './model';

const API = 'https://api.github.com';
const SHA = /^[a-f0-9]{40}$/;
export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export interface Connection {
  repository: string;
  branch: string;
  login: string;
  name: string;
  userId: number;
  expiresAt: number;
}
interface Tree {
  sha: string;
  tree: Array<{ path: string; type: string; sha: string }>;
  truncated?: boolean;
}
interface Head {
  commit: string;
  tree: string;
  files: Map<string, string>;
}
export interface Publication {
  commit: string;
  url: string;
  dataShas: Record<string, string>;
  photoShas: Record<string, string>;
  changedFiles: string[];
}

export async function blobSHA(bytes: Uint8Array): Promise<string> {
  const header = new TextEncoder().encode(`blob ${bytes.byteLength}\0`),
    content = new Uint8Array(header.length + bytes.length);
  content.set(header);
  content.set(bytes, header.length);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1', content))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
function base64(bytes: Uint8Array): string {
  const pieces: string[] = [];
  for (let index = 0; index < bytes.length; index += 32768)
    pieces.push(String.fromCharCode(...bytes.subarray(index, index + 32768)));
  return btoa(pieces.join(''));
}
function validSHA(value: unknown): string {
  if (typeof value !== 'string' || !SHA.test(value))
    throw new Error('GitHub returned an unexpected response. Try again.');
  return value;
}
const conflict =
  'Newer changes exist in GitHub. Save a local draft or export it, then reload the editor before publishing. Nothing was overwritten.';

// The credential lives only in this instance's memory. Never add it to config, storage, URLs or logs.
export class GitHubPublisher {
  #token = '';
  #connection: Connection | null = null;
  #abort = new AbortController();
  #expected: Record<string, string> = {};
  #publishing = false;
  constructor(
    private fetcher: typeof fetch = fetch,
    private now: () => number = Date.now,
  ) {}
  get connection(): Connection | null {
    return this.#connection && this.now() < this.#connection.expiresAt
      ? { ...this.#connection }
      : null;
  }
  disconnect(): void {
    this.#token = '';
    this.#connection = null;
    this.#expected = {};
    this.#abort.abort();
    this.#abort = new AbortController();
  }
  async #request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    if (!this.#token) throw new Error('Connect GitHub before publishing.');
    if (this.#connection && this.now() >= this.#connection.expiresAt) {
      this.disconnect();
      throw new Error('The editor connection expired. Connect again.');
    }
    const url = new URL(path, API);
    if (!path.startsWith('/') || url.origin !== API) throw new Error('Unsafe GitHub request.');
    let response: Response;
    try {
      response = await this.fetcher.call(globalThis, url.href, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.#token}`,
          'X-GitHub-Api-Version': '2026-03-10',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.any([this.#abort.signal, AbortSignal.timeout(30000)]),
      });
    } catch {
      throw new Error('Could not reach GitHub. Your draft is still here. Try again.');
    }
    if (!response.ok) {
      if (response.status === 401) {
        this.disconnect();
        throw new GitHubError(401, 'The access key is invalid or expired. Connect again.');
      }
      if (response.status === 403 || response.status === 429) {
        if (response.headers.get('x-ratelimit-remaining') === '0' || response.status === 429)
          throw new GitHubError(response.status, 'GitHub rate limit reached. Wait and try again.');
        throw new GitHubError(
          403,
          'GitHub denied access. Select this repository and Contents: Read and write when creating the key. Repository rules may also require review.',
        );
      }
      if (response.status === 409 || response.status === 422)
        throw new GitHubError(response.status, conflict);
      if (response.status === 404)
        throw new GitHubError(
          404,
          'Repository or branch not available to this access key. Check the selected repository.',
        );
      throw new GitHubError(
        response.status,
        'GitHub could not save the changes. Your draft is still here.',
      );
    }
    return (await response.json()) as T;
  }
  #root(): string {
    return '/repos/' + this.#connection!.repository.split('/').map(encodeURIComponent).join('/');
  }
  async #head(): Promise<Head> {
    const root = this.#root(),
      branch = encodeURIComponent(this.#connection!.branch);
    const ref = await this.#request<{ object: { sha: string } }>(`${root}/git/ref/heads/${branch}`),
      commit = validSHA(ref.object?.sha);
    const object = await this.#request<{ tree: { sha: string } }>(`${root}/git/commits/${commit}`),
      tree = validSHA(object.tree?.sha);
    const entries = await this.#request<Tree>(`${root}/git/trees/${tree}?recursive=1`);
    if (entries.truncated || !Array.isArray(entries.tree))
      throw new Error(
        'Repository is too large for safe browser publishing. Use Export files instead.',
      );
    return {
      commit,
      tree,
      files: new Map(
        entries.tree
          .filter((item) => item.type === 'blob')
          .map((item) => [item.path, validSHA(item.sha)]),
      ),
    };
  }
  #checkData(head: Head): void {
    if (
      !DATA_PATHS.every((path) => this.#expected[path]) ||
      !Object.entries(this.#expected).every(([path, sha]) => head.files.get(path) === sha)
    )
      throw new Error(conflict);
  }
  async connect(token: string, repository: string, deployment: Deployment): Promise<Connection> {
    this.disconnect();
    deployment = parseDeployment(deployment);
    const target = repositoryName(repository);
    if (deployment.repository && deployment.repository.toLowerCase() !== target.toLowerCase())
      throw new Error('Use the repository that published this editor.');
    if (!/^github_pat_[a-zA-Z0-9_]{10,}$/.test(token.trim()))
      throw new Error(
        'Use a fine-grained access key starting with github_pat_. Broad classic keys are not accepted.',
      );
    if (!DATA_PATHS.every((path) => SHA.test(deployment.dataShas[path] || '')))
      throw new Error('Reload the editor to get safe publishing information.');
    this.#token = token.trim();
    this.#expected = { ...deployment.dataShas, ...deployment.photoShas };
    try {
      const user = await this.#request<{ login: string; name?: string; id: number }>('/user');
      const repo = await this.#request<{
        full_name: string;
        id: number;
        default_branch: string;
        permissions?: { push?: boolean };
        archived?: boolean;
        disabled?: boolean;
      }>(`/repos/${target.split('/').map(encodeURIComponent).join('/')}`);
      if (
        repo.full_name?.toLowerCase() !== target.toLowerCase() ||
        (deployment.repositoryId && repo.id !== deployment.repositoryId)
      )
        throw new Error('Use the repository that published this editor.');
      if (repo.permissions?.push === false || repo.archived || repo.disabled)
        throw new Error('This account does not have write access to the repository.');
      if (!user.login || !Number.isInteger(user.id) || !repo.default_branch)
        throw new Error('GitHub returned an unexpected response. Try again.');
      if (deployment.branch && repo.default_branch !== deployment.branch)
        throw new Error('The default branch changed. Reload the editor before publishing.');
      this.#connection = {
        repository: repo.full_name,
        branch: repo.default_branch,
        login: user.login,
        name: user.name || user.login,
        userId: user.id,
        expiresAt: this.now() + 30 * 60 * 1000,
      };
      this.#checkData(await this.#head());
      return { ...this.#connection };
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }
  async publish(files: Record<string, Uint8Array>): Promise<Publication | null> {
    if (this.#publishing) throw new Error('A publication is already in progress.');
    this.#publishing = true;
    try {
      return await this.#publish(files);
    } finally {
      this.#publishing = false;
    }
  }
  async #publish(files: Record<string, Uint8Array>): Promise<Publication | null> {
    if (!this.connection) throw new Error('The editor connection expired. Connect again.');
    const paths = Object.keys(files);
    if (
      !DATA_PATHS.every((path) => files[path]) ||
      paths.some(
        (path) => !DATA_PATHS.includes(path as (typeof DATA_PATHS)[number]) && !localImage(path),
      )
    )
      throw new Error('Only PetQR public data and pet photos can be published.');
    try {
      const read = (name: string) =>
        JSON.parse(new TextDecoder().decode(files[`data/${name}.json`]));
      const config = parseConfig({
        version: read('version'),
        site: read('site'),
        contacts: read('contacts'),
        pets: read('pets'),
      });
      assertPublishable(config);
      const photos = new Set(config.pets.flatMap((p) => p.photos.map((photo) => photo.path)));
      if (
        [...photos].some((path) => !files[path]) ||
        paths.some((path) => localImage(path) && !photos.has(path))
      )
        throw new Error('Unselected photo.');
    } catch {
      throw new Error('Only confirmed public data and referenced photos can be published.');
    }
    for (const path of paths) {
      if (localImage(path) && files[path].length > 5 * 1024 * 1024)
        throw new Error(
          'A photo exceeds the published size limit. Re-add it in Photos to compress it.',
        );
      if (path.startsWith('data/') && new TextDecoder().decode(files[path]).includes(this.#token))
        throw new Error('An access key was found in public data. Remove it before publishing.');
    }
    const head = await this.#head();
    this.#checkData(head);
    const hashes = Object.fromEntries(
        await Promise.all(paths.map(async (path) => [path, await blobSHA(files[path])])),
      ),
      changed = paths.filter((path) => hashes[path] !== head.files.get(path));
    if (
      paths.some(
        (path) =>
          localImage(path) &&
          !this.#expected[path] &&
          head.files.has(path) &&
          head.files.get(path) !== hashes[path],
      )
    )
      throw new Error(conflict);
    if (!changed.length) return null;
    const root = this.#root(),
      tree: Array<{ path: string; mode: string; type: string; sha: string }> = [];
    // Sequential writes avoid GitHub's secondary limits and make cancellation predictable.
    for (const path of changed) {
      const blob = await this.#request<{ sha: string }>(`${root}/git/blobs`, 'POST', {
        content: base64(files[path]),
        encoding: 'base64',
      });
      tree.push({ path, mode: '100644', type: 'blob', sha: validSHA(blob.sha) });
    }
    const nextTree = await this.#request<{ sha: string }>(`${root}/git/trees`, 'POST', {
      base_tree: head.tree,
      tree,
    });
    const check = await this.#request<{ object: { sha: string } }>(
      `${root}/git/ref/heads/${encodeURIComponent(this.#connection!.branch)}`,
    );
    if (validSHA(check.object?.sha) !== head.commit) throw new Error(conflict);
    const identity = {
      name: this.#connection!.name,
      email: `${this.#connection!.userId}+${this.#connection!.login}@users.noreply.github.com`,
    };
    const commit = await this.#request<{ sha: string }>(`${root}/git/commits`, 'POST', {
      message: 'Update public pet profiles with PetQR',
      tree: validSHA(nextTree.sha),
      parents: [head.commit],
      author: identity,
      committer: identity,
    });
    const sha = validSHA(commit.sha);
    await this.#request(
      `${root}/git/refs/heads/${encodeURIComponent(this.#connection!.branch)}`,
      'PATCH',
      { sha, force: false },
    );
    this.#expected = { ...hashes };
    return {
      commit: sha,
      url: `https://github.com/${this.#connection!.repository}/commit/${sha}`,
      dataShas: Object.fromEntries(DATA_PATHS.map((path) => [path, hashes[path]])),
      photoShas: Object.fromEntries(paths.filter(localImage).map((path) => [path, hashes[path]])),
      changedFiles: changed,
    };
  }
}
