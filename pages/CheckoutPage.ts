/**
 * Checkout page (pages/CheckoutPage.ts)
 * Verified: address confirmation `#address_delivery` / `#address_invoice`;
 * Order Note `#ordermsg textarea[name=message]`;
 * Place Order → `a.check_out[href="/payment"]`.
 */
import { Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import type { TestUser } from '../testdata/users';

export class CheckoutPage extends BasePage {
  readonly deliveryAddress: Locator = this.page.locator('#address_delivery');
  readonly invoiceAddress: Locator = this.page.locator('#address_invoice');
  readonly reviewOrderHeading: Locator = this.page.getByRole('heading', {
    name: 'Review Your Order',
    exact: true,
  });
  readonly reviewOrderTable: Locator = this.page.locator('.table-responsive').first();
  readonly commentBox: Locator = this.page.locator('#ordermsg textarea[name="message"]');
  readonly placeOrderButton: Locator = this.page.locator('a.check_out[href="/payment"]');

  async expectAddressDetailsVisible(): Promise<void> {
    await this.expectVisible(this.deliveryAddress);
    await this.expectVisible(this.invoiceAddress);
  }

  /** Check the registered details in the shipping and billing address sections. */
  async expectAddressesMatch(user: TestUser): Promise<void> {
    const expectedLines = [
      user.firstName,
      user.lastName,
      user.company,
      user.address1,
      user.address2,
      user.city,
      user.state,
      user.zipcode,
      user.country,
      user.mobile,
    ];

    const expectedAddress = expectedLines.join(' ');

    for (const address of [this.deliveryAddress, this.invoiceAddress]) {
      await expect(address).toContainText(expectedAddress);
    }
  }

  /** Confirm that the checkout order-details table is visible. */
  async expectOrderReviewVisible(): Promise<void> {
    await this.expectVisible(this.reviewOrderHeading);
    await this.expectVisible(this.reviewOrderTable);
  }

  async addComment(text: string): Promise<void> {
    await this.fill(this.commentBox, text);
  }

  async placeOrder(): Promise<void> {
    await this.click(this.placeOrderButton);
    await this.page.waitForURL(/\/payment/, { waitUntil: 'domcontentloaded' });
  }
}
