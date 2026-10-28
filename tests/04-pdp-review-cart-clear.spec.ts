/**
 * Product detail coverage for official cases 8, 13, 17, and 21:
 * verify details/reviews, add a requested quantity, and remove the product from cart.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { ProductsPage } from '../pages/ProductsPage';
import { PRODUCT_DETAIL_SCENARIO, PRODUCTS } from '../testdata/products';
import { uniqueEmail } from '../utils/data-generator';
import { log } from '../utils/logger';

test('验证商品目录、详情字段并提交商品评价（官方场景 8、21） @regression', async ({ page }) => {
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

test('商品详情页按数量加购 → 购物车数量与小计正确 → 移除商品 @regression', async ({ page }) => {
  const { product, quantity, expectedLineTotal } = PRODUCT_DETAIL_SCENARIO;

  // 1. 打开详情页，设置数量后加购
  const detail = new ProductDetailPage(page);
  await detail.goto(product.id);
  await detail.setQuantity(quantity);
  await detail.addToCart();
  await detail.viewCartFromModal();

  // 2. Verify the product row, requested quantity, and calculated line total.
  const cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(1);
  await expect(cart.productRows.first()).toContainText(product.name);
  await expect(cart.lineQuantity(product.id)).toHaveText(String(quantity));
  await expect(cart.lineTotal(product.id)).toHaveText(`Rs. ${expectedLineTotal}`);
  log.pass(`购物车行：${product.name} × ${quantity}，小计 Rs. ${expectedLineTotal}`);

  // 3. 移除商品（AJAX 删除，行由 JS 移除）→ 空车状态
  await cart.removeItem(product.id);
  await expect(cart.productRows).toHaveCount(0);
  await expect(cart.emptyCartMessage).toBeVisible();
  log.pass('移除成功，购物车为空');
});
