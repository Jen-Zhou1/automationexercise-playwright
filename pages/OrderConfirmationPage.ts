/**
 * Order confirmation page (pages/OrderConfirmationPage.ts)
 * Verified: `h2[data-qa="order-placed"]` shows "Order Placed!" +
 * "Congratulations! Your order has been confirmed!" +
 * Invoice download link `a[href^="/download_invoice/"]` (the demo site returns plain-text invoice content).
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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
   * Download the invoice and save it to this run's directory.
   * `saveAs()` only resolves once the file is actually on disk and throws on its
   * own if it is not, so no extra existsSync check is needed.
   * @returns the saved absolute path
   */
  async downloadInvoice(savePath: string): Promise<string> {
    const download = await this.clickAndWaitForDownload(this.downloadInvoiceLink);
    await download.saveAs(savePath);
    return savePath;
  }

  /** Click Continue on the order confirmation page to return home. */
  async continueToHome(): Promise<void> {
    await this.click(this.continueButton);
  }
}
