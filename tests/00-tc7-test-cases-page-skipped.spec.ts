/**
 * Permanently skipped by policy: TC7 only verifies the site's official test-case index page.
 * The English scenario steps and automation coverage are maintained in docs/automation-test-plan.md.
 */
import { test, expect } from '../fixtures/base-fixtures';
import { TestCasesPage } from '../pages/TestCasesPage';

test.skip('TC7: verify the official Test Cases page (permanently skipped by policy) @regression', async ({ page }) => {
  const testCases = new TestCasesPage(page);
  await testCases.open();

  await expect(testCases.pageHeading).toBeVisible();
  await expect(testCases.scenarioLinks).toHaveCount(26);
  await expect(testCases.verifyTestCasesScenario).toBeVisible();
});
