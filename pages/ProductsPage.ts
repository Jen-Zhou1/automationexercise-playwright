/**
 * 商品列表 / 搜索页（pages/ProductsPage.ts）
 * 已核实结构：
 *  - 搜索框 #search_product + 按钮 #submit_search（JS 跳转 /products?search=）
 *  - 商品卡 .single-products → .productinfo p(名称) h2(价 Rs.) a.add-to-cart[data-product-id]
 *  - 加购成功弹窗 #cartModal（"Added!" + View Cart 链接 + Continue Shopping）
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

  // 加购弹窗
  readonly cartModal: Locator = this.page.locator('#cartModal');
  readonly modalViewCart: Locator = this.page.locator('#cartModal a[href="/view_cart"]');
  readonly continueShoppingButton: Locator = this.page.locator('#cartModal .close-modal');

  async goto(): Promise<void> {
    await super.goto('/products');
  }

  /** 搜索：填关键词 → 点击 → 等待整页跳转完成 */
  async search(keyword: string): Promise<void> {
    await this.fill(this.searchBox, keyword);
    await this.click(this.searchButton);
    await this.page.waitForURL(/\/products\?search=/, { waitUntil: 'domcontentloaded' });
    await this.productCards.first().waitFor({ state: 'visible' });
  }

  /** 按名称定位商品卡（名称唯一；过滤掉其它卡片的噪声） */
  productCard(name: string): Locator {
    return this.productCards.filter({ hasText: name }).first();
  }

  /** 按类别名称定位侧栏类别标题。 */
  categoryHeading(name: string): Locator {
    return this.categorySidebar.locator(`.panel-title a[href="#${name}"]`);
  }

  /** 按子类别名称定位类别链接。 */
  categoryLink(name: string): Locator {
    return this.categorySidebar.locator('a[href^="/category_products/"]').filter({
      hasText: name,
    }).first();
  }

  /** 按品牌名称定位侧栏链接。 */
  brandLink(name: string): Locator {
    return this.brandSidebar.locator('a[href^="/brand_products/"]').filter({
      hasText: name,
    }).first();
  }

  /** 从商品卡片打开对应详情页。 */
  async openProductDetails(name: string): Promise<void> {
    await this.page
      .locator('.product-image-wrapper')
      .filter({ hasText: name })
      .first()
      .locator('a[href^="/product_details/"]')
      .click();
  }

  /** 打开指定商品分类。 */
  async openCategory(name: string): Promise<void> {
    await this.click(this.categoryLink(name));
  }

  /** 打开指定品牌商品列表。 */
  async openBrand(name: string): Promise<void> {
    await this.click(this.brandLink(name));
  }

  /** 从当前展示的推荐商品中加购第一件，并等待站点确认弹窗。 */
  async addRecommendedProductToCart(): Promise<void> {
    await this.recommendedItems.scrollIntoViewIfNeeded();
    const activeProduct = this.recommendedItems.locator('.item.active');
    await activeProduct.locator('.add-to-cart').first().click();
    await this.expectVisible(this.cartModal);
    await this.expectText(this.cartModal, 'Added!');
  }

  /**
   * 点击某个商品的"Add to cart"，等待弹窗出现，返回其 product-id。
   * 注意：卡片 DOM 里有两个 add-to-cart 链接（info 层 + overlay 悬浮层），
   * 只点 .productinfo 里那个可见的。
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

  /** 点击商品卡片的加购按钮，不等待成功弹窗（用于验证失败响应）。 */
  async clickAddToCartByName(name: string): Promise<void> {
    await this.productCard(name).locator('.productinfo a.add-to-cart').click();
  }

  async viewCartFromModal(): Promise<void> {
    await this.click(this.modalViewCart);
  }

  async continueShopping(): Promise<void> {
    await this.click(this.continueShoppingButton);
  }

  /** 当前页商品名列表（搜索断言用） */
  async getVisibleProductNames(): Promise<string[]> {
    return this.productCards.locator('.productinfo p').allInnerTexts();
  }
}
