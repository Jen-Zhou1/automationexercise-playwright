/**
 * Cart page (pages/CartPage.ts)
 * Verified:
 *  - Cart Items: rows `tr#product-<id>` inside `#cart_info_table`;
 *    item name `.cart_description h4 a`, unit price `.cart_price p`, subtotal `.cart_total .cart_total_price`,
 *    quantity `.cart_quantity button`
 *  - Remove Item: `.cart_quantity_delete[data-product-id]` (AJAX; the row is removed by JS)
 *  - Checkout: `#do_action a.check_out` ("Proceed To Checkout")
 *  - Empty Cart: `#empty_cart` is shown
 */
import { Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SubscriptionSection } from './SubscriptionSection';
import { env } from '../config/env';

export class CartPage extends BasePage {
  readonly subscription: SubscriptionSection;
  readonly cartTable: Locator = this.page.locator('#cart_info_table');
  readonly productRows: Locator = this.page.locator('#cart_info_table tr[id^="product-"]');
  readonly checkoutButton: Locator = this.page.locator('#do_action a.check_out');
  readonly emptyCartMessage: Locator = this.page.locator('#empty_cart');
  readonly checkoutModal: Locator = this.page.locator('#checkoutModal');
  readonly checkoutRegisterLoginLink: Locator = this.checkoutModal.locator('a[href="/login"]');

  constructor(page: Page) {
    super(page);
    this.subscription = new SubscriptionSection(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/view_cart', {
      waitUntil: 'commit',
      timeout: env.timeouts.navigation,
    });
    await this.page.waitForLoadState('domcontentloaded', {
      timeout: env.timeouts.navigation,
    });
    await this.assertSiteAvailable();
  }

  /** List of product names in the cart */
  async getItemNames(): Promise<string[]> {
    return this.productRows.locator('.cart_description h4 a').allInnerTexts();
  }

  /** Return the cart row for a specified product. */
  productRow(productId: string): Locator {
    return this.page.locator(`#product-${productId}`);
  }

  /** The subtotal element for a row, such as "Rs. 1000" */
  lineTotal(productId: string): Locator {
    return this.page.locator(`#product-${productId} .cart_total_price`);
  }

  /** The element that shows the quantity for a row */
  lineQuantity(productId: string): Locator {
    return this.page.locator(`#product-${productId} .cart_quantity button`);
  }

  /** Return the unit-price element for the specified product. */
  linePrice(productId: string): Locator {
    return this.page.locator(`#product-${productId} .cart_price`);
  }

  /** Remove an item (AJAX delete; wait for the row to disappear) */
  async removeItem(productId: string): Promise<void> {
    await this.click(this.page.locator(`.cart_quantity_delete[data-product-id="${productId}"]`));
  }

  async proceedToCheckout(): Promise<void> {
    await this.click(this.checkoutButton);
  }

  /** Open the registration/login page from the guest checkout modal. */
  async chooseRegisterOrLoginAtCheckout(): Promise<void> {
    await this.click(this.checkoutRegisterLoginLink);
  }
}
