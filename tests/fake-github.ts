import { createHash } from 'node:crypto';
import { DATA_PATHS, type Deployment } from '../src/deployment';
export const TEST_KEY = 'github_pat_' + 'test_only_not_a_real_credential_12345';
export const hash = (bytes: Uint8Array) =>
  createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
export function fakeGitHub(initial: Record<string, Uint8Array>, repository = 'petqr-tests/pets') {
  let files = { ...initial },
    tree = hash(Buffer.from('initial-tree')),
    head = '1'.repeat(40),
    refs = 0;
  const blobs = new Map(Object.values(files).map((bytes) => [hash(bytes), bytes]));
  const trees = new Map<string, Record<string, Uint8Array>>([[tree, { ...files }]]),
    commits = new Map<string, { tree: string; parents: string[] }>([[head, { tree, parents: [] }]]);
  const calls: Array<{ path: string; method: string; body: any; options: RequestInit }> = [];
  const state = {
    calls,
    denyWrite: false,
    readOnly: false,
    invalidKey: false,
    truncated: false,
    race: false,
    patchConflict: false,
    get files() {
      return files;
    },
    get head() {
      return head;
    },
    advance(path: string, bytes: Uint8Array) {
      files = { ...files, [path]: bytes };
      blobs.set(hash(bytes), bytes);
      tree = hash(
        Buffer.from(JSON.stringify(Object.keys(files).map((name) => [name, hash(files[name])]))),
      );
      trees.set(tree, { ...files });
      head = hash(Buffer.from(head + tree));
      commits.set(head, { tree, parents: [] });
    },
    deployment(): Deployment {
      return {
        repository,
        repositoryId: 123,
        branch: 'main',
        commit: head,
        dataShas: Object.fromEntries(DATA_PATHS.map((path) => [path, hash(initial[path])])),
        photoShas: Object.fromEntries(
          Object.keys(initial)
            .filter((path) => path.startsWith('assets/pets/'))
            .map((path) => [path, hash(initial[path])]),
        ),
        configuredPublicUrl: '',
        resolvedPublicUrl: '',
      };
    },
    fetch: async (input: RequestInfo | URL, options: RequestInit = {}) => {
      const url = new URL(String(input)),
        path = url.pathname,
        method = options.method || 'GET',
        body = options.body ? JSON.parse(String(options.body)) : null;
      calls.push({ path, method, body, options });
      const response = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), {
          status,
          headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
        });
      if (url.origin !== 'https://api.github.com') return response({}, 500);
      if (state.invalidKey) return response({}, 401);
      if (state.denyWrite && method !== 'GET') return response({}, 403);
      if (path === '/user') return response({ login: 'test-owner', name: 'Test Owner', id: 42 });
      const root = `/repos/${repository}`;
      if (path === root)
        return response({
          full_name: repository,
          id: 123,
          default_branch: 'main',
          permissions: { push: !state.readOnly },
        });
      if (method === 'GET' && path === root + '/git/ref/heads/main') {
        refs++;
        if (state.race && refs === 3)
          state.advance('src/unrelated.ts', Buffer.from('New independent code'));
        return response({ object: { sha: head } });
      }
      if (method === 'GET' && path.startsWith(root + '/git/commits/')) {
        const commit = commits.get(path.split('/').pop()!);
        return commit ? response({ tree: { sha: commit.tree } }) : response({}, 404);
      }
      if (method === 'GET' && path.startsWith(root + '/git/trees/')) {
        const entries = trees.get(path.split('/').pop()!);
        return entries
          ? response({
              sha: tree,
              truncated: state.truncated,
              tree: Object.entries(entries).map(([path, bytes]) => ({
                path,
                type: 'blob',
                mode: '100644',
                sha: hash(bytes),
              })),
            })
          : response({}, 404);
      }
      if (method === 'POST' && path === root + '/git/blobs') {
        const bytes = Buffer.from(body.content, 'base64'),
          sha = hash(bytes);
        blobs.set(sha, bytes);
        return response({ sha }, 201);
      }
      if (method === 'POST' && path === root + '/git/trees') {
        const base = trees.get(body.base_tree);
        if (!base) return response({}, 422);
        const next = { ...base };
        for (const entry of body.tree) next[entry.path] = blobs.get(entry.sha)!;
        const sha = hash(
          Buffer.from(JSON.stringify(Object.keys(next).map((path) => [path, hash(next[path])]))),
        );
        trees.set(sha, next);
        return response({ sha }, 201);
      }
      if (method === 'POST' && path === root + '/git/commits') {
        const sha = hash(Buffer.from(JSON.stringify(body)));
        commits.set(sha, { tree: body.tree, parents: body.parents });
        return response({ sha }, 201);
      }
      if (method === 'PATCH' && path === root + '/git/refs/heads/main') {
        const commit = commits.get(body.sha);
        if (state.patchConflict || body.force !== false || commit?.parents[0] !== head)
          return response({}, 422);
        head = body.sha;
        tree = commit.tree;
        files = { ...trees.get(tree)! };
        return response({ object: { sha: head } });
      }
      return response({}, 404);
    },
  };
  return state;
}
