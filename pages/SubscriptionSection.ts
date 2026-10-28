/**
 * Footer Subscription Section (shared by the home page and cart page).
 * The page uses `#susbscribe_email`, `#subscribe`, and `#success-subscribe`.
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SubscriptionSection extends BasePage {
  readonly heading: Locator = this.page.getByText('Subscription', { exact: true });
  readonly emailInput: Locator = this.page.locator('#susbscribe_email');
  readonly subscribeButton: Locator = this.page.locator('#subscribe');
  readonly successMessage: Locator = this.page.locator('#success-subscribe');

  /** Submit the subscription form using the provided email. */
  async subscribe(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }
}
