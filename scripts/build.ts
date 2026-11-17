import { build } from 'vite';
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config';
import { dependencyLicenses } from './licenses';
import { htmlDocument, renderProfile, renderIndex, esc, paw } from '../src/public/render';
import { explainError, petPath, type Config } from '../src/shared/model';
import { photoCreditsText, creditedPhotos } from '../src/shared/photo-credits';
import { renderTutorial, tutorialTitle } from '../src/public/tutorial-view';

export function deployedURL(
  config: Config,
  env: Record<string, string | undefined> = process.env,
): string {
  if (config.site.publicUrl) return config.site.publicUrl.replace(/\/+$/, '');
  return (env.PAGES_BASE_URL || '').replace(/\/+$/, '');
}
export async function buildSite(
  options: {
    dataRoot?: string;
    output?: 'dist' | '.test-site';
    environment?: Record<string, string | undefined>;
  } = {},
) {
  const dataRoot = resolve(options.dataRoot || process.cwd());
  const outDir = resolve(options.output || 'dist');
  // Vite cleans this folder recursively. Restrict the resolved target before allowing cleanup.
  if (outDir !== resolve('dist') && outDir !== resolve('.test-site'))
    throw new Error('Unsafe build output directory.');
  const config = await loadConfig(dataRoot);
  config.site.publicUrl = deployedURL(config, options.environment);
  await build({
    configFile: false,
    publicDir: false,
    base: './',
    build: {
      outDir,
      emptyOutDir: true,
      target: 'es2022',
      rollupOptions: {
        input: {
          editor: resolve('src/editor/editor.ts'),
          public: resolve('src/public/public.ts'),
          tutorial: resolve('src/public/tutorial.ts'),
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/shared-[hash].js',
          assetFileNames: 'assets/[name][extname]',
        },
      },
    },
  });
  async function write(path: string, data: string | Uint8Array) {
    const dest = resolve(outDir, path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, data);
  }
  await copyFile('src/styles/style.css', resolve(outDir, 'assets/style.css'));
  await write(
    'favicon.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#e6efe6"/><g transform="translate(4 4)" fill="#246049">${paw.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`,
  );
  await write('.nojekyll', '');
  await write('LICENSE.txt', await readFile('LICENSE', 'utf8'));
  await write('THIRD_PARTY_LICENSES.txt', await dependencyLicenses());
  if (creditedPhotos(config).length) await write('PHOTO_CREDITS.txt', photoCreditsText(config));
  await write('data/tutorial.json', JSON.stringify({ site: config.site }));
  await write(
    'tutorial/index.html',
    htmlDocument(renderTutorial(config.site, config.site.defaultLanguage), {
      title: tutorialTitle(config.site.defaultLanguage),
      lang: config.site.defaultLanguage,
      prefix: '../',
      script: 'tutorial.js',
      canonical: config.site.publicUrl ? `${config.site.publicUrl}/tutorial/` : undefined,
      description: 'Create your own PetQR website with this visual, six-step tutorial.',
    }),
  );
  await write('data/config.json', JSON.stringify(config));
  // Disabled index must not embed or list pet identities. The editor still reads explicitly public data.
  const indexConfig = { ...config, pets: config.site.ownerIndex ? config.pets : [], contacts: [] };
  await write('data/index.json', JSON.stringify(indexConfig));
  await write(
    'index.html',
    htmlDocument(renderIndex(indexConfig, config.site.defaultLanguage), {
      title: config.site.title,
      lang: config.site.defaultLanguage,
      prefix: '',
      script: 'public.js',
    }),
  );
  await write(
    'editor/index.html',
    htmlDocument(
      '<main id="main"><p style="padding:32px">PetQR · Local editor</p><noscript>The local editor needs JavaScript. Public pet profiles work without it.</noscript></main>',
      {
        title: 'PetQR · Local editor',
        lang: config.site.defaultLanguage,
        prefix: '../',
        script: 'editor.js',
      },
    ),
  );
  const sitemap: string[] = [];
  for (const pet of config.pets) {
    const selected = {
      ...config,
      pets: [pet],
      contacts: config.contacts.filter((c) => pet.contacts.some((ref) => ref.id === c.id)),
    };
    const canonical = config.site.publicUrl
      ? `${config.site.publicUrl}/${petPath(pet)}`
      : undefined;
    const page = htmlDocument(renderProfile(selected, pet, config.site.defaultLanguage), {
      title: `${pet.name} · PetQR`,
      lang: config.site.defaultLanguage,
      prefix: '../../',
      script: 'public.js',
      indexing: pet.indexing,
      canonical,
      photo:
        config.site.publicUrl && pet.photos[0]
          ? `${config.site.publicUrl}/${pet.photos[0].path}`
          : undefined,
    });
    // Serve complete static HTML at both addresses: old printed tags also work without JavaScript.
    for (const route of new Set([petPath(pet), petPath(pet.id)])) {
      await write(
        `${route}index.html`,
        page.replace('</head>', `<meta name="petqr-id" content="${pet.id}"></head>`),
      );
      await write(`${route}profile.json`, JSON.stringify(selected));
    }
    for (const image of pet.photos) {
      const dest = resolve(outDir, image.path);
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(resolve(dataRoot, image.path), dest);
    }
    if (pet.indexing && canonical) sitemap.push(canonical);
  }
  await write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap.map((url) => `<url><loc>${esc(url)}</loc></url>`).join('')}</urlset>`,
  );
  await write(
    'robots.txt',
    `User-agent: *\nAllow: /\n${sitemap.length && config.site.publicUrl ? `Sitemap: ${config.site.publicUrl}/sitemap.xml\n` : ''}`,
  );
  await write(
    '404.html',
    htmlDocument(
      `<header class="public-header">PetQR</header><main id="main" class="profile"><h1>404</h1><p>Profile not found · Perfil no encontrado · Perfil no trobat</p><p>Contact the owner using any other information on the tag.</p></main>`,
      {
        title: '404 · PetQR',
        lang: config.site.defaultLanguage,
        prefix: config.site.publicUrl ? config.site.publicUrl + '/' : './',
        script: 'public.js',
      },
    ),
  );
  if (config.site.publicUrl) {
    const host = new URL(config.site.publicUrl).hostname;
    if (!host.endsWith('.github.io')) await write('CNAME', host);
  }
  console.log(
    `Generated ${config.pets.length} standalone pet routes, editor and ${config.site.ownerIndex ? 'public' : 'unlisted'} index.`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await buildSite();
  } catch (error) {
    console.error(explainError(error));
    process.exitCode = 1;
  }
}
