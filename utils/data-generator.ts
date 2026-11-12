/**
 * Test data generator (utils/data-generator.ts)
 * ---------------------------------------------------------------------------
 * Why it exists: the site is a shared demo site and account data persists.
 * Each run generates a unique email and short stable display name; profile names
 * stay randomized. This keeps authenticated headers deterministic without reusing accounts.
 */
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import { ADDRESS } from '../testdata/address';
import type { TestUser } from '../testdata/users';

const FIRST_NAMES = ['Wei', 'Kun', 'Auto', 'QA', 'Lena', 'Marco', 'Sara', 'Kenji'];
const LAST_NAMES = ['Zhao', 'Wang', 'Test', 'Engineer', 'Nguyen', 'Silva'];

function pick<T>(list: readonly T[]): T {
  const index = Math.floor(Math.random() * list.length);
  const value = list[index];
  if (value === undefined) {
    throw new Error(`pick() index out of range: ${index}`);
  }
  return value;
}

/** Unique email: qa_<timestamp>_<random>@example.com */
export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}_${Date.now()}_${randomUUID().replace(/-/g, '')}@example.com`;
}

/** Generate a complete, registerable test user whose fields match the site's registration form */
export function generateUser(overrides: Partial<TestUser> = {}): TestUser {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return {
    name: 'QA',
    email: uniqueEmail(),
    password: env.testUserPassword,
    title: 'Mr',
    firstName,
    lastName,
    company: ADDRESS.company,
    address1: ADDRESS.address1,
    address2: ADDRESS.address2,
    country: ADDRESS.country,
    state: ADDRESS.state,
    city: ADDRESS.city,
    zipcode: ADDRESS.zipcode,
    mobile: ADDRESS.mobile,
    birth: { day: '15', month: '6', year: '1995' },
    ...overrides,
  };
}
