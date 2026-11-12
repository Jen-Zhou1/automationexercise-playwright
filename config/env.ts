/**
 * Configurations (config/env.ts)
 *
 * The only module that reads process.env. Every other file imports `env`,
 * so a machine-specific value can never leak into a page object or a test.
 */
import 'dotenv/config';

const toPositiveInteger = (
  value: string | undefined,
  fallback: number,
  variableName: string,
): number => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} must be a positive integer; received "${value}"`);
  }
  return parsed;
};

const toAccessibilityGate = (value: string | undefined): 'critical' | 'record' => {
  const gate = value ?? 'critical';
  if (gate === 'critical' || gate === 'record') {
    return gate;
  }
  throw new Error(`AE_A11Y_GATE must be "critical" or "record"; received "${gate}"`);
};

/** Budget for the registration flow alone. */
const registrationTimeout = toPositiveInteger(
  process.env.AE_REGISTRATION_TIMEOUT,
  240_000,
  'AE_REGISTRATION_TIMEOUT',
);

/**
 * Total budget for an account-owning test: registration plus failure cleanup.
 * The `registeredUser` fixture and the test's own `test.setTimeout()` must use
 * this same number. The fixture timeout covers register + use + cleanup, but
 * `test.setTimeout()` is the real ceiling - if it is smaller, the cleanup
 * allowance is cut off before it can run.
 */
const accountLifecycleTimeout = registrationTimeout + 60_000;

/**
 * Budget for flows that keep going after registration (smoke, visual checkout,
 * a11y checkout). It must stay >= accountLifecycle, otherwise the test timeout
 * truncates the fixture's cleanup window; the extra 120 s pays for
 * search -> add to cart -> checkout -> payment -> screenshot or scan.
 */
const journeyTimeout = accountLifecycleTimeout + 120_000;

export const env = {
  /** Root URL of the site under test. */
  baseUrl: process.env.AE_BASE_URL ?? 'https://automationexercise.com',

  /** Password used for every generated test account. */
  testUserPassword: process.env.AE_TEST_PASSWORD ?? 'Passw0rd!123',

  /** Timeouts in milliseconds; each is overridable through an AE_* variable. */
  timeouts: {
    test: toPositiveInteger(process.env.AE_TEST_TIMEOUT, 120_000, 'AE_TEST_TIMEOUT'),
    registration: registrationTimeout,
    /** Registration + cleanup; shared by the account tests and the fixture. */
    accountLifecycle: accountLifecycleTimeout,
    /** Registration followed by a multi-page journey (07 smoke, 08 and 09 checkout). */
    journey: journeyTimeout,
    action: toPositiveInteger(process.env.AE_ACTION_TIMEOUT, 30_000, 'AE_ACTION_TIMEOUT'),
    navigation: toPositiveInteger(process.env.AE_NAV_TIMEOUT, 90_000, 'AE_NAV_TIMEOUT'),
    expect: toPositiveInteger(process.env.AE_EXPECT_TIMEOUT, 20_000, 'AE_EXPECT_TIMEOUT'),
  },

  /**
   * Visual tests run on Desktop Chrome (1280), Pixel 7 (412) and the tablet
   * viewport (800). The tablet is restricted to visual tests by `grep: /@visual/`
   * in playwright.config.ts, so functional and a11y tests never repeat there.
   */
  visualProjects: ['chrome', 'mobile-chrome', 'tablet-chrome'],

  /**
   * Narrow viewports: full-page captures are taller and wrap text differently,
   * so the same change spreads over more pixel rows. They get a 2% tolerance
   * instead of 1%.
   */
  narrowVisualProjects: ['mobile-chrome', 'tablet-chrome'],

  /** Accessibility scans run only in Desktop Chrome. */
  accessibilityProject: 'chrome',

  /** Fail the a11y suite on critical findings unless explicitly set to record-only. */
  accessibilityGate: toAccessibilityGate(process.env.AE_A11Y_GATE),

  /** Patterns for blocking third-party ads and analytics. */
  adDomains: [
    '**://*googlesyndication*/**',
    '**://*doubleclick*/**',
    '**://*google-analytics*/**',
    '**://*googletagmanager*/**',
  ],
} as const;

export type Env = typeof env;
