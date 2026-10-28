import { defineConfig, devices } from '@playwright/test';
import * as path from 'node:path';
import { env } from './config/env';

const runStamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');

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
    // Optional desktop browser/device projects stay disabled until the
    // Desktop Chrome regression gate is stable. Uncomment one to enable it.
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
