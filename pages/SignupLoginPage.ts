/**
 * Signup / login page (pages/SignupLoginPage.ts)
 * The site uses a single page for `/signup` and `/login`, which carries both forms at the same time.
 */
import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '../config/env';
import { SITE_MESSAGES } from '../testdata/site-messages';

export class SignupLoginPage extends BasePage {
  // Login form (data-qa verified)
  readonly loginEmail: Locator = this.page.locator('[data-qa="login-email"]');
  readonly invalidLoginEmail: Locator = this.page.locator('[data-qa="login-email"]:invalid');
  readonly loginPassword: Locator = this.page.locator('[data-qa="login-password"]');
  readonly loginButton: Locator = this.page.locator('[data-qa="login-button"]');
  readonly loginError: Locator = this.page.getByText('Your email or password is incorrect!');
  readonly logoutLink: Locator = this.page.locator('a[href="/logout"]');

  // Registration form (first step: name + email)
  readonly signupName: Locator = this.page.locator('[data-qa="signup-name"]');
  readonly signupEmail: Locator = this.page.locator('[data-qa="signup-email"]');
  readonly signupButton: Locator = this.page.locator('[data-qa="signup-button"]');
  readonly signupEmailExistsError: Locator = this.page.getByText(SITE_MESSAGES.signupEmailExists, {
    exact: true,
  });

  /** Open the login page; if already on `/login` after logout, wait for the form instead of navigating again. */
  async open(): Promise<void> {
    const pathname = new URL(this.page.url()).pathname.replace(/\/+$/, '');
    if (pathname !== '/login') {
      await super.goto('/login');
    } else {
      await this.page.waitForLoadState('domcontentloaded', {
        timeout: env.timeouts.navigation,
      });
      await this.assertSiteAvailable();
    }
    await this.page.getByRole('heading', { name: 'Login to your account' }).waitFor({
      state: 'visible',
      timeout: env.timeouts.expect,
    });
  }

  /** Fill in name and email and submit, then wait for either the account-creation form or the duplicate-email result. */
  async startSignup(name: string, email: string): Promise<'new-user' | 'existing-email'> {
    await this.fill(this.signupName, name);
    await this.fill(this.signupEmail, email);
    await this.click(this.signupButton);

    const createAccountForm = this.page.locator('[data-qa="create-account"]');
    let result: 'new-user' | 'existing-email' | undefined;
    await expect
      .poll(
        async () => {
          if (await createAccountForm.isVisible()) {
            result = 'new-user';
          } else if (await this.signupEmailExistsError.isVisible()) {
            result = 'existing-email';
          }
          return result !== undefined;
        },
        { timeout: env.timeouts.registration },
      )
      .toBe(true);
    if (result === undefined) {
      throw new Error('Signup completed without a recognized result');
    }
    return result;
  }

  /** Submit the login and return the result so success and negative scenarios can assert separately. */
  async login(email: string, password: string): Promise<'success' | 'failure' | 'validation'> {
    await this.fill(this.loginEmail, email);
    await this.fill(this.loginPassword, password);

    const isInvalid = await this.loginEmail.evaluate(
      (input: HTMLInputElement) => !input.checkValidity(),
    );
    if (isInvalid) {
      await this.click(this.loginButton);
      return 'validation';
    }

    await this.click(this.loginButton);

    let result: 'success' | 'failure' | undefined;
    await expect
      .poll(
        async () => {
          if (await this.logoutLink.isVisible()) {
            result = 'success';
          } else if (await this.loginError.isVisible()) {
            result = 'failure';
          }
          return result !== undefined;
        },
        { timeout: env.timeouts.navigation },
      )
      .toBe(true);
    if (result === undefined) {
      throw new Error('Login completed without a recognized result');
    }
    return result;
  }
}
