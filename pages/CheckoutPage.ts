/**
 * 结算页（pages/CheckoutPage.ts）
 * 已核实：地址确认 #address_delivery / #address_invoice；
 * 订单备注 #ordermsg textarea[name=message]；
 * Place Order → a.check_out[href="/payment"]。
 */
import { Locator } from '@playwright/test';
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

  /** 核对配送和账单地址中的注册资料字段。 */
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

    for (const address of [this.deliveryAddress, this.invoiceAddress]) {
      for (const line of expectedLines) {
        await this.expectText(address, line);
      }
    }
  }

  /** 确认结算页的订单明细表已显示。 */
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
