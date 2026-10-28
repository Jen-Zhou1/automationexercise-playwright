# GitHub Copilot Coding Conventions (This Project)

> This file is for GitHub Copilot / AI assistants as a reference to generate code consistent with this project's style.

## Mandatory Rules

1. **Selector priority**: `[data-qa="..."]` > `#id` > semantic class > text.
   - Do not use long XPath or CSS selectors that depend on element hierarchy (for example, `div > div > span:nth-child(2)`).
   - Do not use `:nth-child()` to select list items; use `filter({ hasText })` or data attributes instead.
2. **Do not use fixed sleep**. Use Playwright's automatic waiting: `expect(locator).toBeVisible()`,
   `locator.click()` (includes built-in clickability waiting), and `page.waitForURL()`.
   The only exception is waiting for third-party carousel/animation visual behavior, and the reason must be commented.
3. **Page elements and actions belong only in `pages/`**; test files (`tests/`) should contain only orchestration and assertions,
   and should not directly pile up locators inside tests.
4. **Test data belongs only in `testdata/`**; dynamic data (unique email, etc.) should use `utils/data-generator.ts`.
   Environment-specific values belong only in `config/env.ts` and should be read from `process.env.AE_*`.
5. **Tests must import `test/expect` from `../fixtures/base-fixtures`**;
   do not import directly from `@playwright/test`.
6. **Use web-first assertions** (`await expect(locator).to...`);
   do not use manual checks such as `expect(await locator.isVisible()).toBe(true)`.
7. **Failure evidence**: the global config in `playwright.config.ts` already sets
   `screenshot: only-on-failure` / `video: retain-on-failure` / `trace: retain-on-failure`;
   do not repeat these in individual test cases.
8. **New pages** should inherit from `BasePage`, and reusable operations should be written as methods with business-verb names
   (`startSignup`, `proceedToCheckout`, `pay`).
9. **Visual regression** may run only in the `chrome` and `mobile-chrome` projects; skip unsupported projects using the allowlist in `env.visualProjects`.
10. **Accessibility checks** should use `reportAccessibilityScan` to record results without blocking the business flow of the public demo site;
    when working with client projects, establish a baseline first, then enforce gating based on the reviewed severity levels.

## Code Style

- Add a block comment at the top of the file explaining what this page/tool is and the verified structural basis.
- Write JSDoc for public methods (including parameter meanings and site-specific behavior notes).
- Use `utils/logger.ts`'s `log.step/info/pass/warn` for console output instead of raw `console.log`.
