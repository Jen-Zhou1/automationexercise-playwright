/**
 * Reusable CustomFixtures（fixtures/base-fixtures.ts）
 * ---------------------------------------------------------------------------
 * All tests should import from this file { test, expect }
 *
 *  - adBlocker    : Run before each test automatically
 *  - registeredUser: Register a new user in 2 steps and return userdata
 *  - authedUser   : Confirm that user is authenticated based on registeredUser and return { page, user }
 */
import { test as base, expect, type Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { AccountPage } from '../pages/AccountPage';
import { generateUser } from '../utils/data-generator';
import type { TestUser } from '../testdata/users';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { blockThirdPartyAds } from '../utils/network';
import { SITE_OVERLOAD_MESSAGE } from '../pages/BasePage';

export interface AuthedUser {
  page: Page;
  user: TestUser;
}

export const test = base.extend<{
  adBlocker: void;
  registeredUser: TestUser;
  authedUser: AuthedUser;
}>({
  page: async ({ page }, use, testInfo) => {
    await use(page);

    if (testInfo.status === 'passed' && !page.isClosed()) {
      const bodyText = await page.locator('body').innerText();
      if (bodyText.includes(SITE_OVERLOAD_MESSAGE)) {
        throw new Error(
          `Automation Exercise is overloaded (queue full) at ${page.url()}`,
        );
      }
    }
  },

  // Adblock is applied consistently to every test.
  adBlocker: [
    async ({ page }, use) => {
      await blockThirdPartyAds(page);
      await use();
    },
    { auto: true },
  ],

  registeredUser: [
    async ({ page }, use) => {
      const user = generateUser();
      log.step(`register new user: ${user.email}`);

      const signup = new SignupLoginPage(page);
      await signup.goto();
      const signupResult = await signup.startSignup(user.name, user.email);
      if (signupResult !== 'new-user') {
        throw new Error(`Email is already registered: ${user.email}`);
      }

      const account = new AccountPage(page);
      await account.fillAccountInfo(user);
      await account.submitCreateAccount();

      await use(user);
    },
    { timeout: env.timeouts.registration },
  ],

  authedUser: async ({ page, registeredUser }, use) => {
    // Login as new regsitered user, DO click Continue to redirect back to Home from SignUp page
    await new AccountPage(page).continueToHome();
    const home = new HomePage(page);
    await home.expectLoggedInAs(registeredUser.name);
    log.pass(`Authenticated:${registeredUser.email}`);
    await use({ page, user: registeredUser });
  },
});

export { expect };