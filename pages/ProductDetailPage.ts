/**
 * PDP/Product Detail page (pages/ProductDetailPage.ts)
 * Verified: quantity input `#quantity`, add-to-cart button `class="cart"` (reads hidden field `#product_id`).
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { SITE_MESSAGES } from '../testdata/site-messages';

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

  async openProduct(productId: string): Promise<void> {
    await super.goto(`/product_details/${productId}`);
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.fill(this.quantity, String(quantity));
  }

  async addToCart(): Promise<void> {
    await this.click(this.addToCartButton);
    await this.expectVisible(this.cartModal);
    await this.expectText(this.cartModal, SITE_MESSAGES.addToCartSuccess);
  }

  async viewCartFromModal(): Promise<void> {
    await this.click(this.modalViewCart);
  }

  /** Submit the product name, email, and review text. */
  async submitReview(name: string, email: string, review: string): Promise<void> {
    await this.fill(this.reviewName, name);
    await this.fill(this.reviewEmail, email);
    await this.fill(this.reviewText, review);
    await this.click(this.submitReviewButton);
  }
}
