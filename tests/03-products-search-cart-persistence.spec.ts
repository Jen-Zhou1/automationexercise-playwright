/**
 * Product search and add-to-cart coverage, including data-driven search, request spying,
 * a mocked server failure path, and cart persistence across login.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { PRODUCTS, SEARCH_SCENARIOS } from '../testdata/products';
import { env } from '../config/env';
import {
  spyOnAddToCart,
  mockAddToCartFailure,
  resetNetworkMocks,
  type AddToCartCall,
} from '../utils/network';
import { log } from '../utils/logger';

test('搜索商品 → 加购 → 购物车可见（含网络拦截与 Mock 验证） @regression', async ({ page }) => {
  const addToCartCalls: AddToCartCall[] = spyOnAddToCart(page); // 监听（不篡改）加购请求

  const products = new ProductsPage(page);
  await products.goto();

  // —— 数据驱动：多个搜索词 ——
  for (const scenario of SEARCH_SCENARIOS) {
    await products.search(scenario.keyword);
    const names = await products.getVisibleProductNames();
    await expect
      .poll(() => products.productCards.count())
      .toBeGreaterThanOrEqual(scenario.minResults);
    for (const expected of scenario.expectContains) {
      expect(names.some((n) => n.includes(expected)), `结果应包含 ${expected}`).toBe(true);
    }
    log.pass(`搜索 "${scenario.keyword}" → ${names.length} 个结果`);
  }

  // —— 搜索 Blue → Mock 500 验证失败路径 ——
  await products.search('Blue');
  await mockAddToCartFailure(page);
  const [mockResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/add_to_cart/')),
    products.clickAddToCartByName('Blue Top'),
  ]);
  expect(mockResponse.status(), 'Mock 应让加购请求返回 500').toBe(500);
  // 服务端 500 → jQuery success 回调不触发 → 弹窗不应出现
  await expect(products.cartModal).toBeHidden();
  log.pass('Mock 500 验证通过：加购失败时弹窗不出现（错误路径符合预期）');

  await resetNetworkMocks(page);

  // —— 真实加购 → 网络请求验证 → 购物车断言 ——
  const productId = await products.addToCartByName('Blue Top');
  expect(productId, 'Blue Top 的 product-id 应为 1').toBe('1');
  expect(addToCartCalls.map((call) => call.productId)).toContain('1');
  log.pass(`网络拦截确认：GET /add_to_cart/${productId} 已发出`);

  await products.viewCartFromModal();
  const cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(1);
  await expect(cart.productRows.first()).toContainText('Blue Top');
  log.pass('购物车中出现 Blue Top');
});

test('搜索加购后登出再登录，购物车商品仍保留（官方场景 20） @regression', async ({
  page,
  authedUser,
}) => {
  test.setTimeout(env.timeouts.registration);
  const home = new HomePage(page);
  await home.logout();

  const products = new ProductsPage(page);
  await products.goto();
  await products.search(PRODUCTS.blueTop.name);
  const matchingNames = await products.getVisibleProductNames();
  expect(matchingNames).toContain(PRODUCTS.blueTop.name);

  const addedNames: string[] = [];
  for (const [index, name] of matchingNames.entries()) {
    await products.addToCartByName(name);
    addedNames.push(name);
    if (index < matchingNames.length - 1) {
      await products.continueShopping();
    }
  }

  await products.viewCartFromModal();
  let cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(addedNames.length);
  for (const name of addedNames) {
    await expect(cart.productRows.filter({ hasText: name })).toHaveCount(1);
  }

  const signup = new SignupLoginPage(page);
  await signup.goto();
  expect(await signup.login(authedUser.user.email, authedUser.user.password)).toBe('success');
  await home.expectLoggedInAs(authedUser.user.name);

  cart = new CartPage(page);
  await cart.goto();
  await expect(cart.productRows).toHaveCount(addedNames.length);
  for (const name of addedNames) {
    await expect(cart.productRows.filter({ hasText: name })).toHaveCount(1);
  }
});
