/**
 * Authentication lifecycle (TC 1-5): register, logout/re-login, delete account
 * Data-driven invalid-login/browser-validation scenarios
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
  test.setTimeout(env.timeouts.registration);

  // 1. Confirm the registration result (the fixture performed the action; assertions happen here)
  const account = new AccountPage(page);
  await account.expectAccountCreated();
  log.pass(`Account created successfully: ${registeredUser.email}`);

  // 2. Continue back home and confirm the logged-in state
  await account.continueToHome();
  const home = new HomePage(page);
  await home.expectLoggedInAs(registeredUser.name);

  // 3. Log out → return to the login page
  await home.logout();
  await expect(page).toHaveURL(/\/login/);
  log.pass('Logged out successfully and returned to the login page');

  // 4. Reuse the registered email to verify duplicate signup error.
  const signup = new SignupLoginPage(page);
  await signup.goto();
  expect(await signup.startSignup(registeredUser.name, registeredUser.email)).toBe('existing-email');
  await expect(signup.signupEmailExistsError).toBeVisible();

  // 5. The existing account remains usable after duplicate signup error.
  expect(await signup.login(registeredUser.email, registeredUser.password)).toBe('success');
  await home.expectLoggedInAs(registeredUser.name);
  log.pass('Re-logged in successfully');

  // 6. Delete the account and confirm the logged-out home page as lifecycle cleanup.
  await home.deleteAccount();
  await account.expectAccountDeleted();
  await account.continueToHome();
  await home.expectLoggedOut();
});

test.describe('Login Errors (data-driven)', () => {
  for (const attempt of INVALID_LOGIN_ATTEMPTS) {
    test(`Login failure: ${attempt.reason} @regression`, async ({ page }) => {
      const login = new SignupLoginPage(page);
      await login.goto();
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
  }
});