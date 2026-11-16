import { defineConfig, devices } from '@playwright/test';
import * as os from 'node:os';
import * as path from 'node:path';
import { env } from './config/env';

/**
 * True for `npx playwright test --list` (counting tests, never running them).
 * A listing run still loads this config and starts a reporter, which would leave
 * an empty reports/<stamp> directory behind on every invocation. Listings are
 * therefore redirected to the OS temp directory and reduced to the list reporter.
 */
const isListing = process.argv.includes('--list');

/**
 * One run id shared by every process.
 * Playwright re-evaluates this config inside each worker; generating a new
 * timestamp per load would make the a11y report's runId disagree with the
 * reports/<stamp>/ directory it was written into.
 */
const runStamp =
  process.env.AE_REPORT_RUN_ID ??
  new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
process.env.AE_REPORT_RUN_ID = runStamp;

/** Real runs write into reports/<stamp>/; listings go to a temp directory. */
const runRoot = isListing
  ? path.join(os.tmpdir(), 'playwright-list', runStamp)
  : path.resolve(__dirname, 'reports', runStamp);

const sharedOptions = {
  baseURL: env.baseUrl,
  navigationTimeout: env.timeouts.navigation,
  actionTimeout: env.timeouts.action,
  headless: process.env.HEADLESS !== 'false',
  launchOptions: {
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 0,
  },
  /* Failure evidence only: screenshot, video and trace are written on failure. */
  trace: 'retain-on-failure' as const,
  screenshot: 'only-on-failure' as const,
  video: 'retain-on-failure' as const,
};

/**
 * Three viewports are enabled by default. The public demo site throttles under
 * load, so every extra project means one more full pass over the functional
 * suite. Cross-engine runs are opt-in: uncomment a project below and install
 * that engine first (`npx playwright install firefox webkit msedge`).
 */
const projects = [
  {
    name: 'chrome',
    // Desktop Chrome preset: 1280x720 CSS-pixel viewport.
    use: { ...devices['Desktop Chrome'], ...sharedOptions },
  },
  {
    name: 'mobile-chrome',
    // Pixel 7 preset: 412x839 CSS-pixel viewport (screen 412x915, DPR 2.625).
    use: { ...devices['Pixel 7'], ...sharedOptions },
  },
  {
    /**
     * Tablet viewport, visual suite only.
     * 800x1280 sits inside the site's `sm` band (768-991), the only Bootstrap 3
     * band otherwise unobserved: here responsive.css drops the product grid from
     * three columns to two, reflows the footer from five columns to three, and
     * switches the nav from a hamburger to a horizontal menu. 768 is avoided on
     * purpose - it is the exact boundary, so a vertical scrollbar taking ~15 px
     * would record the `xs` layout instead.
     * `grep` is a project-level filter: functional and a11y tests never run here.
     */
    name: 'tablet-chrome',
    grep: /@visual/,
    use: {
      ...sharedOptions,
      viewport: { width: 800, height: 1280 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: true,
    },
  },

  //* --- Disabled by default; enable one at a time when a cross-engine run is needed ---
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
  // {
  //   name: 'mobile-safari',
  //   // iPhone 13 binds WebKit, a different engine from mobile-chrome: its visual
  //   // baselines are separate automatically, because the project name differs.
  //   use: { ...devices['iPhone 13'], ...sharedOptions },
  // },
  //--- end of disabled block --- */
];

/**
 * Project names are plain strings in env.ts. Renaming one would silently skip
 * every visual or a11y test and still report green, so validation happens here,
 * at startup, where it fails loudly.
 */
const enabledProjectNames = new Set(projects.map((project) => project.name));
for (const required of [...env.visualProjects, env.accessibilityProject]) {
  if (!enabledProjectNames.has(required)) {
    throw new Error(
      `env.ts references project "${required}", which is not enabled. Enabled: ${[...enabledProjectNames].join(', ')}`,
    );
  }
}

export default defineConfig({
  timeout: env.timeouts.test,
  expect: {
    timeout: env.timeouts.expect,
    /**
     * Rendering stability only. Pixel tolerances belong to the tests
     * (tests/08-visual.spec.ts) so there is a single source of truth.
     */
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  testDir: './tests',
  outputDir: path.join(runRoot, 'artifacts'),

  /*
   * One worker, no parallelism: the shared demo site throttles, and the a11y
   * aggregate lives in module state inside a single process.
   */
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  /**
   * A listing run keeps only the list reporter (no HTML report, no results.json).
   * A real run writes both, so report/index.html is the single summary of the run.
   */
  reporter: isListing
    ? [['list']]
    : [
      ['list'],
      ['html', {
        open: 'never',
        outputFolder: path.join(runRoot, 'report'),
      }],
      ['json', { outputFile: path.join(runRoot, 'results.json') }],
    ],

  projects,
});
