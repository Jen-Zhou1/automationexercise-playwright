/**
 * Automation Exercise official test-cases directory page.
 * The page uses links pointing to `#collapse1`–`#collapse26` to display 26 walkthrough scenarios.
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

  /** Open the official test-cases directory page from the home navigation. */
  async open(): Promise<void> {
    await this.goto('/');
    await this.click(this.navigationLink);
    await this.page.waitForURL(/\/test_cases/, { waitUntil: 'domcontentloaded' });
  }
}
