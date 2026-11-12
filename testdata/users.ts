/**
 * testdata/users.ts
 * Account data is produced by utils/data-generator; only the invalid
 * credential sets are static, because they must stay wrong on purpose.
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

/** Data-driven authentication failures (tests/01-auth.spec.ts). */
export interface InvalidLoginAttempt {
  email: string;
  password: string;
  reason: string;
  /** True when HTML5 validation stops the submit before it reaches the server */
  blockedByBrowserValidation?: boolean;
}

export const INVALID_LOGIN_ATTEMPTS: InvalidLoginAttempt[] = [
  {
    email: 'not_exist_qa@example.com',
    password: 'WrongPass!999',
    reason: 'unregistered email',
  },
  {
    /* The site returns the same message for an unknown account, so this case
       checks that a wrong password never reveals whether the account exists. */
    email: 'locked_out_qa@example.com',
    password: 'wrong_password',
    reason: 'wrong password for a non-existent account',
  },
  {
    email: 'not-an-email-format',
    password: env.testUserPassword,
    reason: 'invalid email (HTML5 validation)',
    blockedByBrowserValidation: true,
  },
];
