/**
 * Configurations（config/env.ts）
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

export const env = {
  /** Test site's root path */
  baseUrl: process.env.AE_BASE_URL ?? 'https://automationexercise.com',

  /** password for all registered users */
  testUserPassword: process.env.AE_TEST_PASSWORD ?? 'Passw0rd!123',

  /** Timeouts in milliseconds; overridable through AE_* environment variables. */
  timeouts: {
    test: toPositiveInteger(process.env.AE_TEST_TIMEOUT, 120_000, 'AE_TEST_TIMEOUT'),
    registration: toPositiveInteger(
      process.env.AE_REGISTRATION_TIMEOUT,
      240_000,
      'AE_REGISTRATION_TIMEOUT',
    ),
    action: toPositiveInteger(process.env.AE_ACTION_TIMEOUT, 30_000, 'AE_ACTION_TIMEOUT'),
    navigation: toPositiveInteger(process.env.AE_NAV_TIMEOUT, 90_000, 'AE_NAV_TIMEOUT'),
    expect: toPositiveInteger(process.env.AE_EXPECT_TIMEOUT, 20_000, 'AE_EXPECT_TIMEOUT'),
  },

  /** Visual tests run in Desktop Chrome and Pixel 7 mobile Chrome. */
  visualProjects: ['chrome', 'mobile-chrome'],

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