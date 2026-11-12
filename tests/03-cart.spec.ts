/**
 * TC-05 Cart (site TC 12, 13, 17, 20)
 * Multi-item cart, quantity/subtotal from the PDP, removal, and cart persistence across logout/login.
 *
 * Everything here ends with a cart-side business assertion (row count, unit price,
 * quantity, subtotal, empty state) — that is the boundary against 02-catalog.spec.ts.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SignupLoginPage } from '../pages/SignupLoginPage';
import { PRODUCTS, PRODUCT_DETAIL_SCENARIO } from '../testdata/products';
import { env } from '../config/env';
import { log } from '../utils/logger';

test('Add Multiple Products to Cart → Verify Price & QTY @regression', async ({ page }) => {
  const products = new ProductsPage(page);
  let firstId = '';
  let secondId = '';

  await test.step('Add two different products from the catalog', async () => {
    await products.open();
    firstId = await products.addToCartByName(PRODUCTS.blueTop.name);
    await products.continueShopping();
    secondId = await products.addToCartByName(PRODUCTS.menTshirt.name);
    await products.viewCartFromModal();
  });

  await test.step('Each row shows its own unit price, quantity and line total', async () => {
    const cart = new CartPage(page);
    await expect(cart.productRows).toHaveCount(2);
    await expect(cart.linePrice(firstId)).toContainText(String(PRODUCTS.blueTop.unitPrice));
    await expect(cart.linePrice(secondId)).toContainText(String(PRODUCTS.menTshirt.unitPrice));
    await expect(cart.lineQuantity(firstId)).toHaveText('1');
    await expect(cart.lineQuantity(secondId)).toHaveText('1');
    await expect(cart.lineTotal(firstId)).toContainText(String(PRODUCTS.blueTop.unitPrice));
    await expect(cart.lineTotal(secondId)).toContainText(String(PRODUCTS.menTshirt.unitPrice));
  });
});

test('Add to Cart from PDP with Set QTY → Verify Cart QTY & Total → Remove Product @regression', async ({ page }) => {
  const { product, quantity, expectedLineTotal } = PRODUCT_DETAIL_SCENARIO;

  await test.step(`Open the PDP, set QTY=${quantity} and add to cart`, async () => {
    const detail = new ProductDetailPage(page);
    await detail.openProduct(product.id);
    await detail.setQuantity(quantity);
    await detail.addToCart();
    await detail.viewCartFromModal();
  });

  await test.step('Cart shows the requested quantity and the calculated line total', async () => {
    const cart = new CartPage(page);
    await expect(cart.productRows).toHaveCount(1);
    await expect(cart.productRows.first()).toContainText(product.name);
    await expect(cart.lineQuantity(product.id)).toHaveText(String(quantity));
    await expect(cart.lineTotal(product.id)).toHaveText(`Rs. ${expectedLineTotal}`);
    log.pass(`Cart row: ${product.name} × ${quantity}, subtotal Rs. ${expectedLineTotal}`);
  });

  await test.step('Remove the row → empty cart', async () => {
    const cart = new CartPage(page);
    await cart.removeItem(product.id);
    await expect(cart.productRows).toHaveCount(0);
    await expect(cart.emptyCartMessage).toBeVisible();
    log.pass('Removal succeeded, cart is empty');
  });
});

test('Search Product → Add to Cart → Logout → Relogin → Cart Items Remains @regression', async ({
  page,
  authedUser,
}) => {
  /* As in 01: authedUser builds on registeredUser, so the budget is the full
     account lifecycle, not registration alone. */
  test.setTimeout(env.timeouts.accountLifecycle);
  const home = new HomePage(page);
  const products = new ProductsPage(page);
  const addedNames: string[] = [];

  await test.step('Log out so the cart is filled in a guest session', async () => {
    await home.logout();
  });

  await test.step('Search Blue Top and add every matching product to the cart', async () => {
    await products.open();
    await products.search(PRODUCTS.blueTop.name);
    const matchingNames = await products.getVisibleProductNames();
    expect(matchingNames).toContain(PRODUCTS.blueTop.name);

    for (const [index, name] of matchingNames.entries()) {
      await products.addToCartByName(name);
      addedNames.push(name);
      if (index < matchingNames.length - 1) {
        await products.continueShopping();
      }
    }
    await products.viewCartFromModal();
  });

  await test.step('The guest cart holds exactly those products', async () => {
    const cart = new CartPage(page);
    await expect(cart.productRows).toHaveCount(addedNames.length);
    for (const name of addedNames) {
      await expect(cart.productRows.filter({ hasText: name })).toHaveCount(1);
    }
  });

  await test.step('Log in again → the same rows are still there', async () => {
    const signup = new SignupLoginPage(page);
    await signup.open();
    expect(await signup.login(authedUser.user.email, authedUser.user.password)).toBe('success');
    await home.expectLoggedInAs(authedUser.user.name);

    const cart = new CartPage(page);
    await cart.open();
    await expect(cart.productRows).toHaveCount(addedNames.length);
    for (const name of addedNames) {
      await expect(cart.productRows.filter({ hasText: name })).toHaveCount(1);
    }
  });
});
