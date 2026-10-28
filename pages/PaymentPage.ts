/**
 * 支付页（pages/PaymentPage.ts）
 * 已核实 data-qa：name-on-card / card-number / cvc / expiry-month / expiry-year / pay-button。
 * 表单 POST /payment。
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import type { PaymentCard } from '../testdata/checkout';

export class PaymentPage extends BasePage {
  readonly nameOnCard: Locator = this.page.locator('[data-qa="name-on-card"]');
  readonly cardNumber: Locator = this.page.locator('[data-qa="card-number"]');
  readonly cvc: Locator = this.page.locator('[data-qa="cvc"]');
  readonly expiryMonth: Locator = this.page.locator('[data-qa="expiry-month"]');
  readonly expiryYear: Locator = this.page.locator('[data-qa="expiry-year"]');
  readonly payButton: Locator = this.page.locator('[data-qa="pay-button"]');

  async pay(card: PaymentCard): Promise<void> {
    await this.fill(this.nameOnCard, card.nameOnCard);
    await this.fill(this.cardNumber, card.cardNumber);
    await this.fill(this.cvc, card.cvc);
    await this.fill(this.expiryMonth, card.expiryMonth);
    await this.fill(this.expiryYear, card.expiryYear);
    await this.click(this.payButton);
  }
}
