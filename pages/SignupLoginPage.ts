/**
 * 注册 / 登录页（pages/SignupLoginPage.ts）
 * 站点 /signup 与 /login 是同一页面（同时承载两个表单）。
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '../config/env';

export class SignupLoginPage extends BasePage {
  // 登录表单（data-qa 已核实）
  readonly loginEmail: Locator = this.page.locator('[data-qa="login-email"]');
  readonly invalidLoginEmail: Locator = this.page.locator('[data-qa="login-email"]:invalid');
  readonly loginPassword: Locator = this.page.locator('[data-qa="login-password"]');
  readonly loginButton: Locator = this.page.locator('[data-qa="login-button"]');
  readonly loginError: Locator = this.page.getByText('Your email or password is incorrect!');
  readonly logoutLink: Locator = this.page.locator('a[href="/logout"]');

  // 注册表单（第一步：姓名 + 邮箱）
  readonly signupName: Locator = this.page.locator('[data-qa="signup-name"]');
  readonly signupEmail: Locator = this.page.locator('[data-qa="signup-email"]');
  readonly signupButton: Locator = this.page.locator('[data-qa="signup-button"]');
  readonly signupEmailExistsError: Locator = this.page.getByText(
    'Email Address already exist!',
    { exact: true },
  );

  /** 打开登录页；登出后若已在 /login，则直接等待表单而不重复导航。 */
  async goto(): Promise<void> {
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

  /** 填写姓名和邮箱并提交，等待站点返回创建表单或重复邮箱结果。 */
  async startSignup(name: string, email: string): Promise<'new-user' | 'existing-email'> {
    await this.fill(this.signupName, name);
    await this.fill(this.signupEmail, email);
    await this.click(this.signupButton);
    return Promise.race([
      this.page
        .locator('[data-qa="create-account"]')
        .waitFor({ state: 'visible', timeout: env.timeouts.registration })
        .then(() => 'new-user' as const),
      this.signupEmailExistsError
        .waitFor({ state: 'visible', timeout: env.timeouts.registration })
        .then(() => 'existing-email' as const),
    ]);
  }

  /** 提交登录并返回结果，供成功和负向场景分别断言。 */
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

    return Promise.race([
      this.logoutLink
        .waitFor({ state: 'visible', timeout: env.timeouts.navigation })
        .then(() => 'success' as const),
      this.loginError
        .waitFor({ state: 'visible', timeout: env.timeouts.navigation })
        .then(() => 'failure' as const),
    ]);
  }
}