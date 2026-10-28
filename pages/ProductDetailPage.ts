/**
 * 商品详情页（pages/ProductDetailPage.ts）
 * 已核实：数量输入 #quantity，加购按钮 class="cart"（读隐藏域 #product_id）。
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductDetailPage extends BasePage {
  readonly productInformation: Locator = this.page.locator('.product-information');
  readonly productName: Locator = this.productInformation.locator('h2');
  readonly category: Locator = this.productInformation.locator('p').filter({ hasText: 'Category:' });
  readonly price: Locator = this.productInformation.locator('span span');
  readonly availability: Locator = this.productInformation.locator('p').filter({
    hasText: 'Availability:',
  });
  readonly condition: Locator = this.productInformation.locator('p').filter({ hasText: 'Condition:' });
  readonly brand: Locator = this.productInformation.locator('p').filter({ hasText: 'Brand:' });
  readonly quantity: Locator = this.page.locator('#quantity');
  readonly addToCartButton: Locator = this.page.locator('button.cart');
  readonly cartModal: Locator = this.page.locator('#cartModal');
  readonly modalViewCart: Locator = this.page.locator('#cartModal a[href="/view_cart"]');
  readonly reviewName: Locator = this.page.locator('#name');
  readonly reviewEmail: Locator = this.page.locator('#email');
  readonly reviewText: Locator = this.page.locator('#review');
  readonly reviewHeading: Locator = this.page.getByText('Write Your Review', { exact: true });
  readonly submitReviewButton: Locator = this.page.locator('#button-review');
  readonly reviewSuccessMessage: Locator = this.page.getByText('Thank you for your review.', {
    exact: true,
  });

  async goto(productId: string): Promise<void> {
    await super.goto(`/product_details/${productId}`);
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.fill(this.quantity, String(quantity));
  }

  async addToCart(): Promise<void> {
    await this.click(this.addToCartButton);
    await this.expectVisible(this.cartModal);
    await this.expectText(this.cartModal, 'Added!');
  }

  async viewCartFromModal(): Promise<void> {
    await this.click(this.modalViewCart);
  }

  /** 提交商品名称、邮箱和评价内容。 */
  async submitReview(name: string, email: string, review: string): Promise<void> {
    await this.fill(this.reviewName, name);
    await this.fill(this.reviewEmail, email);
    await this.fill(this.reviewText, review);
    await this.click(this.submitReviewButton);
  }
}
