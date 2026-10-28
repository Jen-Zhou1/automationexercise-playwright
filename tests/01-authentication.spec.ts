/**
 * Authentication lifecycle coverage: registration, logout/re-login, account deletion,
 * and data-driven invalid-login/browser-validation scenarios.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { HomePage } from '../pages/HomePage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { AccountPage } from '../pages/AccountPage';
import { log } from '../utils/logger';
import { env } from '../config/env';
import { INVALID_LOGIN_ATTEMPTS } from '../testdata/users';

test('注册 → 登出 → 重复邮箱注册失败 → 原账号重登并删除（官方场景 1、2、4、5） @regression', async ({
  page,
  registeredUser,
}) => {
  test.setTimeout(env.timeouts.registration);

  // 1. 确认注册结果（fixture 只做了操作，断言在这）
  const account = new AccountPage(page);
  await account.expectAccountCreated();
  log.pass(`账户创建成功：${registeredUser.email}`);

  // 2. Continue 回到首页，确认登录态
  await account.continueToHome();
  const home = new HomePage(page);
  await home.expectLoggedInAs(registeredUser.name);

  // 3. 登出 → 回到登录页
  await home.logout();
  await expect(page).toHaveURL(/\/login/);
  log.pass('登出成功，回到登录页');

  // 4. Reuse the registered email to verify duplicate signup is rejected.
  const signup = new SignupLoginPage(page);
  await signup.goto();
  expect(await signup.startSignup(registeredUser.name, registeredUser.email)).toBe('existing-email');
  await expect(signup.signupEmailExistsError).toBeVisible();

  // 5. The existing account remains usable after duplicate signup is rejected.
  expect(await signup.login(registeredUser.email, registeredUser.password)).toBe('success');
  await home.expectLoggedInAs(registeredUser.name);
  log.pass('重新登录成功');

  // 6. Delete the account and confirm the logged-out home page as lifecycle cleanup.
  await home.deleteAccount();
  await account.expectAccountDeleted();
  await account.continueToHome();
  await home.expectLoggedOut();
});

test.describe('登录异常场景（数据驱动）', () => {
  for (const attempt of INVALID_LOGIN_ATTEMPTS) {
    test(`登录失败：${attempt.reason} @regression`, async ({ page }) => {
      const login = new SignupLoginPage(page);
      await login.goto();
      const result = await login.login(attempt.email, attempt.password);

      if (attempt.blockedByBrowserValidation) {
        expect(result).toBe('validation');
        await expect(page).toHaveURL(/\/login/);
        await expect(login.invalidLoginEmail).toHaveCount(1);
        log.pass(`被浏览器 HTML5 校验拦截：${attempt.email}`);
      } else {
        expect(result).toBe('failure');
        await expect(login.loginError).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
        log.pass(`服务端返回错误提示：${attempt.email}`);
      }
    });
  }
});