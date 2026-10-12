import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // Electron windows do not run reliably in parallel.
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  reporter: 'list',
  forbidOnly: !!process.env.CI,
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
