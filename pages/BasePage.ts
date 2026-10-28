/**
 * POM 基类（pages/BasePage.ts）
 * ---------------------------------------------------------------------------
 * 所有页面对象的父类：只放"通用能力"，不放业务。
 * 定位策略统一为：data-qa 属性 > #id > 语义 class > 文本（见 README「定位策略」）。
 */
import { Page, Locator, expect } from '@playwright/test';
import { env } from '../config/env';

export const SITE_OVERLOAD_MESSAGE = 'This website is under heavy load (queue full)';

export class BasePage {
  constructor(protected readonly page: Page) {}

  /** 打开站内相对路径 */
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

  /** 等待 URL 匹配（Playwright 自动等待，替代固定 sleep） */
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
