/**
 * testdata/users.ts
 * Use utils/data-generator to generate user data for registration
 */
import { env } from '../config/env';

export interface TestUser {
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs';
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobile: string;
  birth: { day: string; month: string; year: string };
}

/** Data-driven authentication error scenario（01-account-access.spec.ts Checkout） */
export interface InvalidLoginAttempt {
  email: string;
  password: string;
  reason: string;
  /** Validate HTML5 will block invalid email */
  blockedByBrowserValidation?: boolean;
}

export const INVALID_LOGIN_ATTEMPTS: InvalidLoginAttempt[] = [
  {
    email: 'not_exist_qa@example.com',
    password: 'WrongPass!999',
    reason: 'unregistered email',
  },
  {
    email: 'locked_out_qa@example.com',
    password: 'wrong_password',
    reason: 'wrong password',
  },
  {
    email: 'not-an-email-format',
    password: env.testUserPassword,
    reason: 'invalid email(HTML5 validation)',
    blockedByBrowserValidation: true,
  },
];

/** Consistent for registration（Mr=id_gender1 / Mrs=id_gender2） */
export const DEFAULT_TITLE = 'Mr' as const;
