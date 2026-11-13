import { buildSite } from './build';
// Owner configuration is never replaced with fixtures. Browser tests use a separate build tree.
await buildSite({
  dataRoot: 'tests/fixtures',
  output: '.test-site',
  environment: {
    GITHUB_REPOSITORY: 'petqr-tests/pets',
    GITHUB_REPOSITORY_ID: '123',
    GITHUB_REF_NAME: 'main',
    GITHUB_SHA: '1111111111111111111111111111111111111111',
  },
});
