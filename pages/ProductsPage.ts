/**
 * Product Catalog / search page (pages/ProductsPage.ts)
 * Verified structure:
 *  - Search box `#search_product` + button `#submit_search` (JS redirects to `/products?search=`)
 *  - Product cards `.single-products` → `.productinfo p` (name), `h2` (price in Rs.), `a.add-to-cart[data-product-id]`
 *  - Add-to-cart success modal `#cartModal` ("Added!" + View Cart link + Continue Shopping)
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  readonly searchBox: Locator = this.page.locator('#search_product');
  readonly searchButton: Locator = this.page.locator('#submit_search');
  readonly productCards: Locator = this.page.locator('.single-products');
  readonly productPageHeading: Locator = this.page.locator('.title.text-center');
  readonly categorySidebar: Locator = this.page.locator('.category-products');
  readonly brandSidebar: Locator = this.page.locator('.brands-name');
  readonly recommendedItems: Locator = this.page.locator('.recommended_items');
  readonly activeRecommendedProducts: Locator = this.recommendedItems.locator(
    '.item.active .add-to-cart',
  );

  // Add-to-cart modal
  readonly cartModal: Locator = this.page.locator('#cartModal');
  readonly modalViewCart: Locator = this.page.locator('#cartModal a[href="/view_cart"]');
  readonly continueShoppingButton: Locator = this.page.locator('#cartModal .close-modal');

  async goto(): Promise<void> {
    await super.goto('/products');
  }

  /** Search: fill keyword → click → wait for the full-page redirect to finish */
  async search(keyword: string): Promise<void> {
    await this.fill(this.searchBox, keyword);
    await this.click(this.searchButton);
    await this.page.waitForURL(/\/products\?search=/, { waitUntil: 'domcontentloaded' });
    await this.productCards.first().waitFor({ state: 'visible' });
  }

  /** Locate a product card by name (the name is unique; this filters out other cards) */
  productCard(name: string): Locator {
    return this.productCards.filter({ hasText: name }).first();
  }

  /** Locate a category heading in the sidebar by category name. */
  categoryHeading(name: string): Locator {
    return this.categorySidebar.locator(`.panel-title a[href="#${name}"]`);
  }

  /** Locate a category link by subcategory name. */
  categoryLink(name: string): Locator {
    return this.categorySidebar.locator('a[href^="/category_products/"]').filter({
      hasText: name,
    }).first();
  }

  /** Locate a brand link in the sidebar by brand name. */
  brandLink(name: string): Locator {
    return this.brandSidebar.locator('a[href^="/brand_products/"]').filter({
      hasText: name,
    }).first();
  }

  /** Open the product details page from the product card. */
  async openProductDetails(name: string): Promise<void> {
    await this.page
      .locator('.product-image-wrapper')
      .filter({ hasText: name })
      .first()
      .locator('a[href^="/product_details/"]')
      .click();
  }

  /** Open a specific product category. */
  async openCategory(name: string): Promise<void> {
    await this.click(this.categoryLink(name));
  }

  /** Open the product list for a specific brand. */
  async openBrand(name: string): Promise<void> {
    await this.click(this.brandLink(name));
  }

  /** Add the first currently displayed recommended product to cart and wait for the confirmation modal. */
  async addRecommendedProductToCart(): Promise<void> {
    await this.recommendedItems.scrollIntoViewIfNeeded();
    const activeProduct = this.recommendedItems.locator('.item.active');
    await activeProduct.locator('.add-to-cart').first().click();
    await this.expectVisible(this.cartModal);
    await this.expectText(this.cartModal, 'Added!');
  }

  /**
   * Click the "Add to cart" button for a specific product and wait for the modal; return its product-id.
   * Note: The card DOM contains two add-to-cart links (info layer + overlay),
   * so only the visible one inside `.productinfo` should be clicked.
   */
  async addToCartByName(name: string): Promise<string> {
    const card = this.productCard(name);
    const addButton = card.locator('.productinfo a.add-to-cart');
    const productId = (await addButton.getAttribute('data-product-id')) ?? '';
    if (!productId) {
      throw new Error(`Could not determine product ID for "${name}"`);
    }
    await this.clickAddToCartByName(name);
    await this.expectVisible(this.cartModal);
    await this.expectText(this.cartModal, 'Added!');
    return productId;
  }

  /** Click the add-to-cart button on a product card without waiting for the success modal (used to validate failure responses). */
  async clickAddToCartByName(name: string): Promise<void> {
    await this.productCard(name).locator('.productinfo a.add-to-cart').click();
  }

  async viewCartFromModal(): Promise<void> {
    await this.click(this.modalViewCart);
  }

  async continueShopping(): Promise<void> {
    await this.click(this.continueShoppingButton);
  }

  /** Names of the products currently visible on the page (used for search assertions) */
  async getVisibleProductNames(): Promise<string[]> {
    return this.productCards.locator('.productinfo p').allInnerTexts();
  }
}
