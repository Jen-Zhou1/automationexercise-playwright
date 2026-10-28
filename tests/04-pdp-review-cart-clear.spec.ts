/**
 * PDP: TC 8, 13, 17, 21
 * Verify product details/reviews, add target qty, remove product from cart
 */
import { test, expect } from '../fixtures/base-fixtures';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { ProductsPage } from '../pages/ProductsPage';
import { PRODUCT_DETAIL_SCENARIO, PRODUCTS } from '../testdata/products';
import { uniqueEmail } from '../utils/data-generator';
import { log } from '../utils/logger';

test('Verify Product Catalog & Details → Submit Product Review @regression', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
  await expect(products.productPageHeading).toHaveText('All Products');
  await expect(products.productCards.first()).toBeVisible();
  await products.openProductDetails(PRODUCTS.blueTop.name);

  const detail = new ProductDetailPage(page);
  await expect(detail.productInformation).toBeVisible();
  await expect(detail.productName).toHaveText(PRODUCTS.blueTop.name);
  await expect(detail.category).toContainText('Category:');
  await expect(detail.price).toContainText(String(PRODUCTS.blueTop.unitPrice));
  await expect(detail.availability).toContainText('In Stock');
  await expect(detail.condition).toContainText('New');
  await expect(detail.brand).not.toBeEmpty();

  await expect(detail.reviewHeading).toBeVisible();
  await detail.submitReview(
    'Automation QA',
    uniqueEmail('review'),
    'Product review submitted by automated test.',
  );
  await expect(detail.reviewSuccessMessage).toBeVisible();
});

test('Add to Cart from PDP with Set QTY → Verify Cart QTY & Total → Remove Product @regression', async ({ page }) => {
  const { product, quantity, expectedLineTotal } = PRODUCT_DETAIL_SCENARIO;

  // 1. Open PDP, set QTY, and add to cart
  const detail = new ProductDetailPage(page);
  await detail.goto(product.id);
  await detail.setQuantity(quantity);
  await detail.addToCart();
  await detail.viewCartFromModal();

  // 2. Verify the product row, target QTY, and calculated line total.
  const cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(1);
  await expect(cart.productRows.first()).toContainText(product.name);
  await expect(cart.lineQuantity(product.id)).toHaveText(String(quantity));
  await expect(cart.lineTotal(product.id)).toHaveText(`Rs. ${expectedLineTotal}`);
  log.pass(`Cart row: ${product.name} × ${quantity}, subtotal Rs. ${expectedLineTotal}`);

  // 3. Remove cart item (AJAX delete; JS removes the row) → empty cart
  await cart.removeItem(product.id);
  await expect(cart.productRows).toHaveCount(0);
  await expect(cart.emptyCartMessage).toBeVisible();
  log.pass('Removal succeeded, cart is empty');
});
