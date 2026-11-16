/**
 * Footer Subscription Section (shared by the home page and cart page).
 * The page uses `#susbscribe_email`, `#subscribe`, and `#success-subscribe`.
 */
import { Locator } from '@playwright/test';
import { Component } from './Component';

export class SubscriptionSection extends Component {
  readonly heading: Locator = this.page.getByText('Subscription', { exact: true });
  readonly emailInput: Locator = this.page.locator('#susbscribe_email');
  readonly subscribeButton: Locator = this.page.locator('#subscribe');
  readonly successMessage: Locator = this.page.locator('#success-subscribe');

  /** Bring the footer subscription block into view (it sits far below the fold on every page). */
  async scrollIntoView(): Promise<void> {
    await this.scrollTo(this.heading);
  }

  /** Submit the subscription form using the provided email. */
  async subscribe(email: string): Promise<void> {
    /* Base-class actions: subscribe is one of the first calls the site throttles. */
    await this.fill(this.emailInput, email);
    await this.click(this.subscribeButton);
  }
}
