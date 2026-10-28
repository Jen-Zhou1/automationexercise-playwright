/**
 * Anonymous catalog coverage for official cases 12, 18, 19, and 22:
 * multi-item cart, category/brand browsing, and recommended products.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { PRODUCTS } from '../testdata/products';

test('同一购物车加入多个商品并核对价格与数量（官方场景 12） @regression', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
  const firstId = await products.addToCartByName(PRODUCTS.blueTop.name);
  await products.continueShopping();
  const secondId = await products.addToCartByName(PRODUCTS.menTshirt.name);
  await products.viewCartFromModal();

  const cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(2);
  await expect(cart.linePrice(firstId)).toContainText(String(PRODUCTS.blueTop.unitPrice));
  await expect(cart.linePrice(secondId)).toContainText(String(PRODUCTS.menTshirt.unitPrice));
  await expect(cart.lineQuantity(firstId)).toHaveText('1');
  await expect(cart.lineQuantity(secondId)).toHaveText('1');
  await expect(cart.lineTotal(firstId)).toContainText(String(PRODUCTS.blueTop.unitPrice));
  await expect(cart.lineTotal(secondId)).toContainText(String(PRODUCTS.menTshirt.unitPrice));
});

test('浏览商品分类及品牌，验证列表并从品牌商品加购（官方场景 18、19） @regression', async ({ page }) => {
  const products = new ProductsPage(page);
  await products.goto();
  await expect(products.categorySidebar).toBeVisible();
  await products.categoryHeading('Women').click();
  await products.openCategory('Tops');
  await expect(products.productPageHeading).toContainText(/Women\s*-\s*Tops Products/i);
  await expect(products.productCards.first()).toBeVisible();

  await products.categoryHeading('Men').click();
  await products.openCategory('Tshirts');
  await expect(products.productPageHeading).toContainText(/Men\s*-\s*Tshirts Products/i);
  await expect(products.productCards.first()).toBeVisible();

  await products.goto();
  await expect(products.brandSidebar).toBeVisible();
  await products.openBrand('POLO');
  await expect(products.productPageHeading).toContainText(/Polo Products/i);
  const brandProductName = (await products.getVisibleProductNames())[0];
  if (!brandProductName) {
    throw new Error('The selected brand page did not show any products');
  }
  await products.addToCartByName(brandProductName);
  await products.viewCartFromModal();
  await expect(new CartPage(page).productRows).toContainText(brandProductName);

  await products.goto();
  await products.openBrand('H&M');
  await expect(products.productPageHeading).toContainText(/H&M Products/i);
  await expect(products.productCards.first()).toBeVisible();
});

test('从首页推荐商品区加购并在购物车中验证（官方场景 22） @regression', async ({ page }) => {
  const products = new ProductsPage(page);
  await new HomePage(page).open();
  await expect(products.recommendedItems).toBeVisible();
  const activeProducts = products.activeRecommendedProducts;
  await expect(activeProducts.first()).toBeVisible();
  const productId = await activeProducts.first().getAttribute('data-product-id');
  if (!productId) {
    throw new Error('The recommended product is missing its product ID');
  }

  await products.addRecommendedProductToCart();
  await products.viewCartFromModal();
  const cart = new CartPage(page);
  await expect(cart.productRows).toHaveCount(1);
  await expect(cart.productRow(productId)).toBeVisible();
});
