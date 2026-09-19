import { defineConfig, devices } from '@playwright/test';

/**
 * Three projects, because they answer three different questions.
 *
 *   chromium  the functional suite, the one that gates a merge
 *   webkit    the same twenty cases on the engine behind Safari
 *   visual    twenty screenshot comparisons against committed Linux baselines
 *
 * Retries are zero on purpose. A retry turns a flaky test into a green tick and
 * throws away the only run that had anything to say. If a case cannot pass on
 * the first attempt it is a defect in the suite, and the policy for that is in
 * docs/flake-policy, not in this file.
 */

const BASE_URL = process.env.BASE_URL ?? 'https://automationexercise.com';

/** CI runs three test jobs against one shared demo host, so each is capped. */
const WORKERS = process.env.CI ? Number(process.env.PW_WORKERS ?? 1) : undefined;

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: WORKERS,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // The target carries third party advertising and a rotating carousel, so
      // a pixel-exact comparison would fail on weather rather than on change.
      // Masking handles the known movers; this covers antialiasing.
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['allure-playwright', { resultsDir: 'allure-results', detail: true }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    testIdAttribute: 'data-qa',
    // The demo host answers slowly under load and the suite should say so
    // rather than hanging: every request carries an identifying agent so the
    // owner can see who is generating the traffic.
    extraHTTPHeaders: {
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  },

  projects: [
    {
      name: 'chromium',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'webkit',
      testDir: './tests',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'visual',
      testDir: './vr-tests',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        // A fixed scale factor keeps the baselines comparable whatever the
        // machine that generated them thinks its screen is.
        deviceScaleFactor: 1,
      },
    },
  ],

  // Baselines are Chromium on Linux, generated in the image CI runs. The path
  // is deliberately flat and platform stamped: a baseline committed from a
  // Windows or macOS run would be compared against on Linux and silently pass.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{platform}{ext}',

  outputDir: 'test-results',
});
