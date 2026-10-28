/**
 * Anonymous Product Catalog/Home Page: TC 12, 18, 19, 22
 * Multi-item cart, category/brand browsing, recommended products
 */
import { test, expect } from '../fixtures/base-fixtures';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { ProductsPage } from '../pages/ProductsPage';
import { PRODUCTS } from '../testdata/products';

test('Add Multiple Products to Cart → Verify Price & QTY @regression', async ({ page }) => {
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

test('Browse Categories & Brands → Verify Lists → Add to Cart from Brand Page @regression', async ({ page }) => {
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

test('Add Recommended Product to Cart → Verify Cart @regression', async ({ page }) => {
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
