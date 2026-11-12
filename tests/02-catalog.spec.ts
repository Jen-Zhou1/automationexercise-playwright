/**
 * TC-02/03/04 Product discovery (site TC 9, 18, 19, 21, 22)
 * Sidebar category/brand filters, keyword search, recommended items, product detail and review.
 *
 * This file is "discover and inspect a product"; anything that ends in a cart-side
 * assertion lives in 03-cart.spec.ts instead, so a failure points at one concern.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductsPage } from '../pages/ProductsPage';
import { BLUE_TOP_DETAILS, PRODUCTS, SEARCH_SCENARIOS } from '../testdata/products';
import { uniqueEmail } from '../utils/data-generator';
import { log } from '../utils/logger';
import {
  spyOnAddToCart,
  mockAddToCartFailure,
  resetNetworkMocks,
  type AddToCartCall,
} from '../utils/network';

test('Browse Categories & Brands → Verify Lists → Add to Cart from Brand Page @regression', async ({ page }) => {
  const products = new ProductsPage(page);

  await test.step('Filter by category: Women > Tops', async () => {
    await products.open();
    await expect(products.categorySidebar).toBeVisible();
    await products.expandCategory('Women');
    await products.openCategory('Tops');
    await expect(products.productPageHeading).toContainText(/Women\s*-\s*Tops Products/i);
    await expect(products.productCards.first()).toBeVisible();
  });

  await test.step('Filter by category: Men > Tshirts', async () => {
    await products.expandCategory('Men');
    await products.openCategory('Tshirts');
    await expect(products.productPageHeading).toContainText(/Men\s*-\s*Tshirts Products/i);
    await expect(products.productCards.first()).toBeVisible();
  });

  const brandProductName = await test.step('Filter by brand: POLO → add the first product', async () => {
    await products.open();
    await expect(products.brandSidebar).toBeVisible();
    await products.openBrand('POLO');
    await expect(products.productPageHeading).toContainText(/Polo Products/i);

    const name = (await products.getVisibleProductNames())[0];
    if (!name) {
      throw new Error('The selected brand page did not show any products');
    }
    await products.addToCartByName(name);
    await products.viewCartFromModal();
    return name;
  });

  await test.step('Cart holds exactly the product added from the brand page', async () => {
    /* Assert on the row set itself, not with toContainText: the latter passes if
       any single row matches, so a second product or a duplicated row would go
       unnoticed. */
    const cart = new CartPage(page);
    await expect(cart.productRows).toHaveCount(1);
    await expect(cart.productRows.first()).toContainText(brandProductName);
  });

  await test.step('Filter by brand: H&M', async () => {
    await products.open();
    await products.openBrand('H&M');
    await expect(products.productPageHeading).toContainText(/H&M Products/i);
    await expect(products.productCards.first()).toBeVisible();
  });
});

test('Search Product → Add to Cart → Verify Visible Cart (mock network interception) @regression', async ({ page }) => {
  const addToCartCalls: AddToCartCall[] = spyOnAddToCart(page); // Listen to add-to-cart requests without modification

  const products = new ProductsPage(page);
  await products.open();

  await test.step('Data-driven search terms return the expected products', async () => {
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
  });

  await test.step('Mock a 500 on add-to-cart → no success modal, cart stays empty', async () => {
    await products.search('Blue');
    await mockAddToCartFailure(page);
    const [mockResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/add_to_cart/')),
      products.clickAddToCartByName('Blue Top'),
    ]);
    expect(mockResponse.status(), 'The mock should cause the add-to-cart request to return 500').toBe(500);
    // Server 500 → jQuery success callback never fires → the modal shouldn't appear
    await expect(products.cartModal).toBeHidden();
    log.pass('Mock 500 validation passed: add-to-cart failure path do not show a modal as expected');

    /* "No modal appeared" alone is weak: even if the modal opened 300 ms after the
       500, toBeHidden has already passed. An empty cart is the business outcome
       this failure path actually promises. */
    const emptyCart = new CartPage(page);
    await emptyCart.open();
    await expect(emptyCart.productRows).toHaveCount(0);
    await expect(emptyCart.emptyCartMessage).toBeVisible();
    log.pass('Add-to-cart failure left the cart empty');
  });

  await test.step('Real add-to-cart → request observed → cart contains Blue Top', async () => {
    await resetNetworkMocks(page);
    await products.open();
    await products.search('Blue');
    const productId = await products.addToCartByName('Blue Top');
    expect(productId, `The product-id for Blue Top should be ${PRODUCTS.blueTop.id}`).toBe(
      PRODUCTS.blueTop.id,
    );
    expect(addToCartCalls.map((call) => call.productId)).toContain(PRODUCTS.blueTop.id);
    log.pass(`Network interception confirmed: GET /add_to_cart/${productId} was sent`);

    await products.viewCartFromModal();
    const cart = new CartPage(page);
    await expect(cart.productRows).toHaveCount(1);
    await expect(cart.productRows.first()).toContainText(PRODUCTS.blueTop.name);
    log.pass('Blue Top is present in the cart');
  });
});

test('Add Recommended Product to Cart → Verify Cart @regression', async ({ page }) => {
  const home = new HomePage(page);
  const products = new ProductsPage(page);

  const productId = await test.step('Freeze the carousel and read the active recommended product', async () => {
    await home.open();
    await expect(products.recommendedItems).toBeVisible();
    await expect(products.activeRecommendedProducts.first()).toBeVisible();

    /* The page object freezes the carousel, reads the id and clicks in one step:
       the strip advances every 5 seconds, so reading the id outside and
       re-resolving `.item.active` here could click a different product. */
    return products.addRecommendedProductToCart();
  });

  await test.step('Cart holds exactly that recommended product', async () => {
    await products.viewCartFromModal();
    const cart = new CartPage(page);
    await expect(cart.productRows).toHaveCount(1);
    await expect(cart.productRow(productId)).toBeVisible();
  });
});

test('Verify Product Catalog & Details → Submit Product Review @regression', async ({ page }) => {
  const products = new ProductsPage(page);

  await test.step('Open the catalog and assert the listing is rendered', async () => {
    await products.open();
    await expect(products.productPageHeading).toHaveText('All Products');
    await expect(products.productCards.first()).toBeVisible();
  });

  await test.step(`Open ${PRODUCTS.blueTop.name} and assert every documented attribute`, async () => {
    await products.openProductDetails(PRODUCTS.blueTop.name);

    const detail = new ProductDetailPage(page);
    await expect(detail.productInformation).toBeVisible();
    await expect(detail.productName).toHaveText(PRODUCTS.blueTop.name);
    /* Assert the value, not just the label: a category rendered as Men > Tshirts
       must fail here too. */
    await expect(detail.category).toContainText(`Category: ${BLUE_TOP_DETAILS.category}`);
    await expect(detail.price).toContainText(String(PRODUCTS.blueTop.unitPrice));
    await expect(detail.availability).toContainText('In Stock');
    await expect(detail.condition).toContainText('New');
    await expect(detail.brand).toContainText(`Brand: ${BLUE_TOP_DETAILS.brand}`);
  });

  await test.step('Submit a product review → thank-you message', async () => {
    const detail = new ProductDetailPage(page);
    await expect(detail.reviewHeading).toBeVisible();
    await detail.submitReview(
      'Automation QA',
      uniqueEmail('review'),
      'Product review submitted by automated test.',
    );
    await expect(detail.reviewSuccessMessage).toBeVisible();
  });
});
