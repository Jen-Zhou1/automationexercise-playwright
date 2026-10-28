/**
 * POM base class (pages/BasePage.ts)
 * ---------------------------------------------------------------------------
 * Base class for all page objects: it contains only shared capabilities, not business logic.
 * Locator strategy is standardized as: data-qa attribute > #id > semantic class > text (see README "selector strategy").
 */
import { Page, Locator, expect } from '@playwright/test';
import { env } from '../config/env';

export const SITE_OVERLOAD_MESSAGE = 'This website is under heavy load (queue full)';

export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Open a site-relative path */
  async goto(path: string): Promise<void> {
    await this.page.goto(path, {
      waitUntil: 'domcontentloaded',
      timeout: env.timeouts.navigation,
    });
    await this.assertSiteAvailable();
  }

  protected async click(locator: Locator): Promise<void> {
    await this.assertSiteAvailable();
    await locator.click();
    await this.assertSiteAvailable();
  }

  protected async fill(locator: Locator, value: string): Promise<void> {
    await this.assertSiteAvailable();
    await locator.fill(value);
  }

  protected async textOf(locator: Locator): Promise<string> {
    return (await locator.innerText()).trim();
  }

  protected async expectVisible(locator: Locator): Promise<void> {
    await this.assertSiteAvailable();
    await expect(locator).toBeVisible();
  }

  protected async expectText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toContainText(text);
  }

  /** Wait for the URL to match (Playwright auto-waiting replaces fixed sleep) */
  protected async expectUrl(pattern: RegExp | string): Promise<void> {
    await this.page.waitForURL(pattern);
  }

  protected async assertSiteAvailable(): Promise<void> {
    const bodyText = await this.page.locator('body').innerText();
    if (bodyText.includes(SITE_OVERLOAD_MESSAGE)) {
      throw new Error(
        `Automation Exercise is overloaded (queue full) at ${this.page.url()}`,
      );
    }
  }
}
