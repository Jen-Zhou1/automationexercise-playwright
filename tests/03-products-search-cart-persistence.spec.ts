/**
 * Product Search and Add-to-Cart: TC 9, 20
 * Data-driven search, request spying, a mocked server failure path
 * Cart items consistency from anonymous to login
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

test('Search Product → Add to Cart → Verify Visible Cart (mock network interception) @regression', async ({ page }) => {
  const addToCartCalls: AddToCartCall[] = spyOnAddToCart(page); // Listen to add-to-cart requests without modification

  const products = new ProductsPage(page);
  await products.goto();

  // —— Data-driven: different search terms ——
  for (const scenario of SEARCH_SCENARIOS) {
    await products.search(scenario.keyword);
    const names = await products.getVisibleProductNames();
    await expect
      .poll(() => products.productCards.count())
      .toBeGreaterThanOrEqual(scenario.minResults);
    for (const expected of scenario.expectContains) {
      expect(names.some((n) => n.includes(expected)), `The result should contain ${expected}`).toBe(true);
    }
    log.pass(`Search "${scenario.keyword}" → ${names.length} results`);
  }

  // —— Search Blue → mock 500 to validate the failure path ——
  await products.search('Blue');
  await mockAddToCartFailure(page);
  const [mockResponse] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/add_to_cart/')),
    products.clickAddToCartByName('Blue Top'),
  ]);
  expect(mockResponse.status(), 'The mock should cause the add-to-cart request to return 500').toBe(500);
  // Server 500 → jQuery success callback never fires → the modal shouldn't appear
  await expect(products.cartModal).toBeHidden();
  log.pass('Mock 500 validation passed: add-to-cart failure path donot show a modal as expected');

  await resetNetworkMocks(page);

  // —— Real add-to-cart → network validation → cart assertions ——
  const productId = await products.addToCartByName('Blue Top');
  expect(productId, 'The product-id for Blue Top should be 1').toBe('1');
  expect(addToCartCalls.map((call) => call.productId)).toContain('1');
  log.pass(`Network interception confirmed: GET /add_to_cart/${productId} was sent`);

  await products.viewCartFromModal();
  const cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(1);
  await expect(cart.productRows.first()).toContainText('Blue Top');
  log.pass('Blue Top is present in the cart');
});

test('Search Product → Add to Cart → Logout → Relogin → Cart Items Remains @regression', async ({
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
