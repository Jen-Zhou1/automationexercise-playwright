# GitHub Copilot Coding Conventions (This Project)

> This file is for GitHub Copilot / AI assistants as a reference to generate code consistent with this project's style.

## Mandatory Rules

1. **Selector priority**: `[data-qa="..."]` > stable `href` / attribute > `#id` > semantic class > text.
   - The `href` tier is explicit: the site's navigation, category and brand links are the most stable handles it offers.
   - Do not use long XPath or CSS selectors that depend on element hierarchy (for example, `div > div > span:nth-child(2)`).
   - Do not use a bare positional selector (`:nth-child()`, `nth()`, `.first()` / `.last()`, or an index) to identify a list item;
     use `filter({ hasText })`, a `data-*` attribute, or `getByRole` to identify it instead. Position in a list is not identity.
   - After filtering by a stable identity, `.first()` is allowed only when the filtered locator is expected to match exactly one element.
     Do not use `.first()` to hide ambiguous matches; add a uniqueness assertion when multiple matches are possible.
   - A locator referenced from two places becomes a named `readonly` field on the page object. Duplicated selector strings
     drift apart, and one of them silently starts matching something else.
2. **Never synchronise with `page.waitForTimeout()`** (or any fixed sleep / retry loop with a timer). Use Playwright's
   automatic waiting: `expect(locator).toBeVisible()`, `locator.click()` (includes built-in clickability waiting),
   `page.waitForURL()`, `page.waitForResponse()`, `page.waitForEvent()`.
   - The only whitelist is `helpers/stabilize.ts`: freezing a JavaScript carousel and waiting for fonts/images genuinely
     cannot be expressed as a web-first assertion. A new call is allowed only there, with a comment naming what is being
     waited for and why no assertion can express it. `waitForTimeout` anywhere else is a defect, not a style issue.
3. **Page elements and actions belong only in `pages/`**; test files (`tests/`) should contain only orchestration and assertions,
   and should not directly pile up locators inside tests.
4. **Test data belongs only in `testdata/`**; dynamic data (unique email, etc.) should use `utils/data-generator.ts`.
   Environment-specific values belong only in `config/env.ts` and should be read from `process.env.AE_*`.
   - **Data is per-test and self-contained.** A test creates what it needs and deletes what it created — an account it
     registers must be removed by that same test. Never rely on state left by an earlier test or a previous run, and never
     reuse a fixed email: the site rejects duplicates, so a stale account turns into a failure in a different test.
   - Ordering is not a contract. Any test must pass when run alone (`--grep "its title"`) and in any position.
5. **Tests must import `test/expect` from `../fixtures/base-fixtures`**;
   do not import directly from `@playwright/test`.
6. **Use web-first assertions** (`await expect(locator).to...`);
   do not use manual checks such as `expect(await locator.isVisible()).toBe(true)`.
7. **Failure evidence**: the global config in `playwright.config.ts` already sets
   `screenshot: only-on-failure` / `video: retain-on-failure` / `trace: retain-on-failure`;
   do not repeat these in individual test cases.
8. **New pages** should inherit from `BasePage`, and reusable operations should be written as methods with business-verb names
   (`startSignup`, `proceedToCheckout`, `pay`).
9. **Visual regression** runs in exactly three projects — `chrome` (1280×720), `tablet-chrome` (800×1280, with
   `grep: /@visual/` declared at **project** level) and `mobile-chrome` (412×839) — listed once in `env.visualProjects`;
   the two narrow viewports are also in `env.narrowVisualProjects`, which selects the wider 2% page tolerance. Skip
   unsupported projects through those lists, never by hard-coding a project name inside a spec. Adding a fourth viewport
   means editing `playwright.config.ts` **and** both env lists; startup validation throws if a listed project is not
   enabled, so a typo fails loudly instead of silently skipping the suite.
10. **Accessibility checks** should use `scanAccessibilityPage` from `utils/a11y.ts`, which appends to the single per-run
    aggregate (`reports/a11y/axe-scan-<timestamp>.json`). Never call `AxeBuilder` directly in a test. The suite gates
    `critical` findings by default (`AE_A11Y_GATE=critical`); `serious` / `moderate` / `minor` are recorded only. Set
    `AE_A11Y_GATE=record` when auditing a public site nobody on the team controls.
11. **Tags: exactly four** — `@smoke`, `@regression`, `@visual`, `@a11y`. Every functional test carries `@regression`;
    smoke tests carry `@smoke @regression` (smoke is a true subset, never `@smoke` alone); visual and a11y tests carry
    their own tag only. Do not invent `@core`, `@extended`, `@sanity` or other subsets — they create tests that no
    command selects.
12. **User actions go through `BasePage` wrappers** (`click` / `fill` / `check` / `selectOption` / `pressKey` / `scrollTo` /
    `setInputFiles` / `clickAndWaitForDownload`), never `locator.click()` directly; the wrappers carry the queue-full fast-fail check.
13. **Assert the business outcome, not the presence of an element.**
    - Assert the value the user sees (`Blue Top`, `Rs. 500`), not the label of the field that contains it.
    - Never `toContainText` against a collection of rows: a single matching row passes even when the list is wrong.
      Locate the row, and assert the ordered set or the row count instead.
    - A negative path must end on its business conclusion — the cart is empty, the order does not exist — not merely
      "the modal stayed hidden". That assertion also passes when the modal appears 300 ms later.
14. **No duplicate or redundant tests.**
    - Before adding a case, check [`capstone/automation-test-plan.md`](../capstone/automation-test-plan.md) and the existing
      specs: a journey already covered by the smoke lane must not be re-implemented as a second full test.
    - Drive variants with a loop over `testdata/`, not by copy-pasting a `test()` block. Copies drift, and their titles
      stop describing what they assert.
    - One `test()` covers one journey. Do not register or log in a second time inside it to reach another scenario —
      that is what the fixtures are for.
15. **A failure must be diagnosable without a re-run.**
    - Group a long journey with `test.step` by business phase (`register`, `add to cart`, `pay`), so the report names the
      phase that broke instead of a line number.
    - Pass a message to an assertion when the default one would not identify the record under test.
    - Assert a block of fields in one array assertion rather than N sequential `expect`s: N waits turn a failure into a
      timeout with no message, and cost N × `expect.timeout` before it gives up.
16. **Keep documentation in sync with the code.**
    - Before finalizing a change, check whether `README.md` and the capstone documents (`architecture.md`,
      `ai-usage-log.md`, `automation-test-plan.md`) still match the current implementation and update them in the same
      patch when a command, file layout, workflow, or architecture detail changes.

## Code Style

- Add a block comment at the top of the file explaining what this page/tool is and the verified structural basis.
- Write JSDoc for public methods (including parameter meanings and site-specific behavior notes).
- Use `utils/logger.ts`'s `log.step/info/pass/warn` for console output instead of raw `console.log`.
