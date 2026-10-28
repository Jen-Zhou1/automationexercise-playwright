/**
 * 订单确认页（pages/OrderConfirmationPage.ts）
 * 已核实：h2[data-qa="order-placed"] "Order Placed!" +
 * "Congratulations! Your order has been confirmed!" +
 * 下载发票链接 a[href^="/download_invoice/"]（演示站返回纯文本发票内容）。
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { existsSync } from 'node:fs';

export class OrderConfirmationPage extends BasePage {
  readonly orderPlaced: Locator = this.page.locator('[data-qa="order-placed"]');
  readonly congratulations: Locator = this.page.getByText(/Congratulations! Your order has been confirmed!/);
  readonly downloadInvoiceLink: Locator = this.page.locator('a[href^="/download_invoice/"]');
  readonly continueButton: Locator = this.page.locator('a[data-qa="continue-button"]');

  async expectOrderPlaced(): Promise<void> {
    await this.expectVisible(this.orderPlaced);
    await this.expectText(this.orderPlaced, 'Order Placed!');
    await this.expectVisible(this.congratulations);
  }

  /**
   * 下载发票并保存到本次运行目录。
   * @returns 保存的绝对路径
   */
  async downloadInvoice(savePath: string): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadInvoiceLink.click(),
    ]);
    await download.saveAs(savePath);
    if (!existsSync(savePath)) {
      throw new Error(`发票文件未成功保存：${savePath}`);
    }
    return savePath;
  }

  /** 点击订单确认页 Continue 返回首页。 */
  async continueToHome(): Promise<void> {
    await this.click(this.continueButton);
  }
}
