import { defineConfig, devices } from '@playwright/test';
import * as path from 'node:path';
import { env } from './config/env';

const runStamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
process.env.AE_A11Y_REPORT_RUN_ID = runStamp;

const runRoot = path.resolve(__dirname, 'reports', runStamp);
const desktopOptions = {
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
      use: { ...devices['Desktop Chrome'], ...desktopOptions },
    },
    // The public demo site is prone to overload. Keep all other browser projects
    // disabled by default; enable them only for an isolated or otherwise approved run.
    // {
    //   name: 'edge',
    //   use: { ...devices['Desktop Edge'], ...desktopOptions },
    // },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], ...desktopOptions },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], ...desktopOptions },
    // },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], ...desktopOptions },
    },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 13'], ...desktopOptions },
    // },
  ],
});
