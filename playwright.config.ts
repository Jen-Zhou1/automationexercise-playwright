import { defineConfig, devices } from '@playwright/test';
import * as path from 'node:path';
import { env } from './config/env';

const runStamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
process.env.AE_A11Y_REPORT_RUN_ID = runStamp;

const runRoot = path.resolve(__dirname, 'reports', runStamp);
const sharedOptions = {
  baseURL: env.baseUrl,
  navigationTimeout: env.timeouts.navigation,
  actionTimeout: env.timeouts.action,
  headless: process.env.HEADLESS !== 'false',
  launchOptions: {
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 0,
  },
  trace: 'retain-on-failure' as const,
  screenshot: 'only-on-failure' as const,
  video: 'retain-on-failure' as const,
};

export default defineConfig({
  timeout: env.timeouts.test,
  expect: {
    timeout: env.timeouts.expect,
    toHaveScreenshot: { maxDiffPixels: 100 },
  },

  testDir: './tests',
  outputDir: path.join(runRoot, 'artifacts'),

  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['list'],
    ['html', {
      open: 'never',
      outputFolder: path.join(runRoot, 'report'),
    }],
    ['json', { outputFile: path.join(runRoot, 'results.json') }],
  ],

  projects: [
    {
      name: 'chrome',
      // Desktop Chrome preset: 1280x720 CSS-pixel viewport.
          use: { ...devices['Desktop Chrome'], ...sharedOptions },
    },
    // The public demo site is prone to overload. Keep all other browser projects
    // disabled by default; enable them only for an isolated or otherwise approved run.
    // {
    //   name: 'edge',
    //   use: { ...devices['Desktop Edge'], ...sharedOptions },
    // },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], ...sharedOptions },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], ...sharedOptions },
    // },
    {
      name: 'mobile-chrome',
      // Pixel 7 preset: 412x839 CSS-pixel viewport (412x915 screen, DPR 2.625).
      use: { ...devices['Pixel 7'], ...sharedOptions },
    },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 13'], ...sharedOptions },
    // },
  ],
});
