/**
 * 购物车页（pages/CartPage.ts）
 * 已核实：
 *  - 有商品：#cart_info_table 内 tr#product-<id> 行；
 *    名称 .cart_description h4 a / 单价 .cart_price p / 小计 .cart_total .cart_total_price /
 *    数量 .cart_quantity button
 *  - 移除：.cart_quantity_delete[data-product-id]（AJAX，行由 JS 移除）
 *  - 去结算：#do_action a.check_out（"Proceed To Checkout"）
 *  - 空车：#empty_cart 显示
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

  /** 购物车中的商品名列表 */
  async getItemNames(): Promise<string[]> {
    return this.productRows.locator('.cart_description h4 a').allInnerTexts();
  }

  /** 返回指定商品的购物车行。 */
  productRow(productId: string): Locator {
    return this.page.locator(`#product-${productId}`);
  }

  /** 某一行的小计元素，如 "Rs. 1000" */
  lineTotal(productId: string): Locator {
    return this.page.locator(`#product-${productId} .cart_total_price`);
  }

  /** 某一行显示数量的元素 */
  lineQuantity(productId: string): Locator {
    return this.page.locator(`#product-${productId} .cart_quantity button`);
  }

  /** 返回指定商品的单价元素。 */
  linePrice(productId: string): Locator {
    return this.page.locator(`#product-${productId} .cart_price`);
  }

  /** 移除商品（AJAX 删除，等待行消失） */
  async removeItem(productId: string): Promise<void> {
    await this.click(this.page.locator(`.cart_quantity_delete[data-product-id="${productId}"]`));
  }

  async proceedToCheckout(): Promise<void> {
    await this.click(this.checkoutButton);
  }

  /** 在访客结算弹窗中进入注册/登录页。 */
  async chooseRegisterOrLoginAtCheckout(): Promise<void> {
    await this.click(this.checkoutRegisterLoginLink);
  }
}
