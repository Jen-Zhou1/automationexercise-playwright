/**
 * 页脚订阅区块（首页与购物车共用）。
 * 页面使用 #susbscribe_email、#subscribe 和 #success-subscribe。
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SubscriptionSection extends BasePage {
  readonly heading: Locator = this.page.getByText('Subscription', { exact: true });
  readonly emailInput: Locator = this.page.locator('#susbscribe_email');
  readonly subscribeButton: Locator = this.page.locator('#subscribe');
  readonly successMessage: Locator = this.page.locator('#success-subscribe');

  /** 使用指定邮箱提交订阅表单。 */
  async subscribe(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }
}
