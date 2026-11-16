/**
 * Reusable custom fixtures (fixtures/base-fixtures.ts)
 *
 * Tests must import { test, expect } from here, not from @playwright/test:
 *  - page           wrapped to detect the site's "queue full" page after each test
 *  - adBlocker      blocks third-party ads and analytics, applied automatically
 *  - registeredUser registers a fresh account and returns its data (best-effort cleanup)
 *  - authedUser     builds on registeredUser and returns { page, user } once logged in
 */
import { test as base, expect, type Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { AccountPage } from '../pages/AccountPage';
import { generateUser } from '../utils/data-generator';
import type { TestUser } from '../testdata/users';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { blockThirdPartyAds, getMainDocumentHealth } from '../utils/network';
import { SITE_MESSAGES } from '../testdata/site-messages';

export interface AuthedUser {
  page: Page;
  user: TestUser;
}

export const test = base.extend<{
  adBlocker: void;
  registeredUser: TestUser;
  authedUser: AuthedUser;
}>({
  /**
   * Queue-full detection, checked after the test body has finished.
   * It runs on failure as well as on success: a test that timed out because the
   * site was queueing would otherwise be reported as a plain "element not found".
   * On a pass the overload turns the test red; on a failure it only adds an
   * annotation and an attachment, so the original cause is preserved.
   */
  page: async ({ page }, use, testInfo) => {
    const documentHealth = getMainDocumentHealth(page);
    await use(page);

    if (page.isClosed()) {
      return;
    }

    let bodyText: string;
    try {
      bodyText = await page.locator('body').innerText({ timeout: 5_000 });
    } catch (error) {
      if (testInfo.status === 'passed') {
        throw error;
      }
      log.warn(`Site overload check skipped: ${(error as Error).message}`);
      return;
    }

    const unavailable =
      bodyText.includes(SITE_MESSAGES.queueFull) ||
      (documentHealth.hasResponse &&
        (documentHealth.status >= 500 || bodyText.trim().length === 0));
    if (!unavailable) {
      return;
    }

    const reason = bodyText.includes(SITE_MESSAGES.queueFull)
      ? 'queue full'
      : documentHealth.status >= 500
        ? `HTTP ${documentHealth.status}`
        : 'empty document';
    const message = `Automation Exercise returned ${reason} at ${page.url()}`;
    if (testInfo.status === 'passed') {
      throw new Error(message);
    }

    testInfo.annotations.push({ type: 'site-overload', description: message });
    await testInfo.attach('site-overload', {
      body: bodyText.slice(0, 4_000),
      contentType: 'text/plain',
    });
    log.warn(message);
  },

  // Applied to every test, so ad frames never interfere with locators or screenshots.
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
      await signup.open();
      const signupResult = await signup.startSignup(user.name, user.email);
      if (signupResult !== 'new-user') {
        throw new Error(`Email is already registered: ${user.email}`);
      }

      const account = new AccountPage(page);
      await account.fillAccountInfo(user);
      await account.submitCreateAccount();

      await use(user);

      /**
       * Cleanup. Accounts on the public demo site are permanent, so a failed test
       * must still remove its own user; otherwise every run leaves another
       * qa_xxx@example.com behind. Cleanup errors are logged only - they must not
       * hide the failure the test already has.
       */
      try {
        if (page.isClosed()) {
          return;
        }
        const home = new HomePage(page);
        /* No Logout link means the test already deleted the account itself. */
        if ((await home.logoutLink.count()) === 0) {
          return;
        }
        await home.deleteAccount();
        await new AccountPage(page).expectAccountDeleted();
        log.info(`Cleaned up test account: ${user.email}`);
      } catch (error) {
        log.warn(`Account cleanup failed for ${user.email}: ${(error as Error).message}`);
      }
    },
    /* Register + cleanup share this budget; the test must raise its own timeout to the same value */
    { timeout: env.timeouts.accountLifecycle },
  ],

  authedUser: async ({ page, registeredUser }, use) => {
    // registeredUser stops on the account-created page; continue to Home first.
    await new AccountPage(page).continueToHome();
    const home = new HomePage(page);
    await home.expectLoggedInAs(registeredUser.name);
    log.pass(`Authenticated:${registeredUser.email}`);
    await use({ page, user: registeredUser });
  },
});

export { expect };
