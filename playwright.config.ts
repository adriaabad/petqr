import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  workers: 1,
  reporter: 'list',
  outputDir: join(tmpdir(), 'petqr-test-results'),
  use: {
    baseURL: 'http://127.0.0.1:4174/test-repo/',
    locale: 'en-US',
    launchOptions: {
      channel: process.env.PETQR_BROWSER || (process.platform === 'win32' ? 'chrome' : undefined),
    },
  },
  webServer: {
    command: 'node tests/server.mjs',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
  },
});
