/**
 * Cross-feature smoke journey: register a user, search/add a product, log out, then clean up.
 * Detailed checkout/payment and accessibility checks live in their dedicated suites.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { AccountPage } from '../pages/AccountPage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { PRODUCTS } from '../testdata/products';
import { spyOnAddToCart, type AddToCartCall } from '../utils/network';
import { log } from '../utils/logger';
import { env } from '../config/env';

test('新用户注册 → 搜索加购 → 登出并清理账户 @smoke', async ({
  page,
  registeredUser,
}) => {
  test.setTimeout(env.timeouts.registration * 2);

  // The fixture registers the user and leaves the account-created page open.
  const account = new AccountPage(page);
  await account.expectAccountCreated();
  await account.continueToHome();
  const home = new HomePage(page);
  await home.expectLoggedInAs(registeredUser.name);

  // Verify the product-search/add-to-cart integration in an authenticated session.
  const addToCartCalls: AddToCartCall[] = spyOnAddToCart(page);
  const products = new ProductsPage(page);
  await products.goto();
  await products.search(PRODUCTS.blueTop.name);
  const productId = await products.addToCartByName(PRODUCTS.blueTop.name);
  expect(addToCartCalls.map((c) => c.productId)).toContain(productId);

  await products.viewCartFromModal();
  const cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(1);
  await expect(cart.productRows).toContainText(PRODUCTS.blueTop.name);
  await home.logout();
  await home.expectLoggedOut();
  await expect(page).toHaveURL(/\/login/);

  // Log in once more so the generated account can be removed from the shared demo site.
  const login = new SignupLoginPage(page);
  await login.goto();
  expect(await login.login(registeredUser.email, registeredUser.password)).toBe('success');
  await home.expectLoggedInAs(registeredUser.name);
  await home.deleteAccount();
  await account.expectAccountDeleted();
  await account.continueToHome();
  await home.expectLoggedOut();
  log.pass('注册、搜索加购、登出及账户清理 Smoke 流程通过');
});
