/**
 * TC-01 Account lifecycle (site TC 1-5): register, logout/re-login, delete account
 *
 * Headline case:  TC-01
 * Negative branch: login failure matrix (wrong password / unknown email / empty fields),
 * kept inside the same file so TC-01 owns every authentication verdict.
 *
 * Tags: @regression (both branches). The project keeps exactly four tags -
 * @smoke, @regression, @visual, @a11y. Negative branches are part of regression;
 * a separate @extended tag would give one meaning two switches.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { HomePage } from '../pages/HomePage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { AccountPage } from '../pages/AccountPage';
import { log } from '../utils/logger';
import { env } from '../config/env';
import { INVALID_LOGIN_ATTEMPTS } from '../testdata/users';

test('Register → Logout → Duplicate Email Error → Re-login & Delete Account @regression', async ({
  page,
  registeredUser,
}) => {
  /* Must equal the fixture budget, cleanup included. A smaller value
     (registration alone) makes the fixture's cleanup allowance unusable. */
  test.setTimeout(env.timeouts.accountLifecycle);

  const account = new AccountPage(page);
  const home = new HomePage(page);

  await test.step('Register a new account (performed by the registeredUser fixture)', async () => {
    // The fixture already submitted the form; the assertion belongs here.
    await account.expectAccountCreated();
    log.pass(`Account created successfully: ${registeredUser.email}`);
  });

  await test.step('Continue to home and confirm the logged-in state', async () => {
    await account.continueToHome();
    await home.expectLoggedInAs(registeredUser.name);
  });

  await test.step('Log out → redirected to the login page', async () => {
    await home.logout();
    await expect(page).toHaveURL(/\/login/);
    log.pass('Logged out successfully and returned to the login page');
  });

  await test.step('Reuse the same email for signup → duplicate-email error', async () => {
    const signup = new SignupLoginPage(page);
    await signup.open();
    expect(await signup.startSignup(registeredUser.name, registeredUser.email)).toBe('existing-email');
    await expect(signup.signupEmailExistsError).toBeVisible();
  });

  await test.step('The existing account is still usable after the duplicate-signup error', async () => {
    const signup = new SignupLoginPage(page);
    expect(await signup.login(registeredUser.email, registeredUser.password)).toBe('success');
    await home.expectLoggedInAs(registeredUser.name);
    log.pass('Re-logged in successfully');
  });

  await test.step('Delete the account → logged-out home page', async () => {
    await home.deleteAccount();
    await account.expectAccountDeleted();
    await account.continueToHome();
    await home.expectLoggedOut();
  });
});

test.describe('Login Errors (data-driven / negative)', () => {
  for (const attempt of INVALID_LOGIN_ATTEMPTS) {
    test(`Login failure: ${attempt.reason} @regression`, async ({ page }) => {
      const login = new SignupLoginPage(page);

      await test.step(`Attempt to log in with ${attempt.reason}`, async () => {
        await login.open();
        const result = await login.login(attempt.email, attempt.password);

        if (attempt.blockedByBrowserValidation) {
          expect(result).toBe('validation');
          await expect(page).toHaveURL(/\/login/);
          await expect(login.invalidLoginEmail).toHaveCount(1);
          log.pass(`Blocked by browser HTML5 validation: ${attempt.email}`);
        } else {
          expect(result).toBe('failure');
          await expect(login.loginError).toBeVisible();
          await expect(page).toHaveURL(/\/login/);
          log.pass(`Server returned an error message: ${attempt.email}`);
        }
      });
    });
  }
});
