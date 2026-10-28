/**
 * Automation Exercise 官方测试用例目录页。
 * 页面使用指向 #collapse1–#collapse26 的链接展示 26 个演练场景。
 */
import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class TestCasesPage extends BasePage {
  readonly navigationLink: Locator = this.page.getByRole('link', {
    name: 'Test Cases',
    exact: true,
  });
  readonly pageHeading: Locator = this.page.getByRole('heading', {
    name: 'Test Cases',
    exact: true,
  });
  readonly scenarioLinks: Locator = this.page.getByRole('link', {
    name: /^Test Case \d+:/,
  });
  readonly verifyTestCasesScenario: Locator = this.page.getByRole('link', {
    name: 'Test Case 7: Verify Test Cases Page',
    exact: true,
  });

  /** 从首页导航打开官方测试用例目录页。 */
  async open(): Promise<void> {
    await this.goto('/');
    await this.click(this.navigationLink);
    await this.page.waitForURL(/\/test_cases/, { waitUntil: 'domcontentloaded' });
  }
}
