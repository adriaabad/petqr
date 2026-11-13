import { buildSite } from './build';
// Owner configuration is never replaced with fixtures. Browser tests use a separate build tree.
await buildSite({ dataRoot: 'tests/fixtures', output: '.test-site', environment: {} });
