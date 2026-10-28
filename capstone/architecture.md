# Architecture Overview

## Purpose and boundaries

This repository is a Playwright + TypeScript end-to-end test framework for the public Automation Exercise storefront. It verifies customer-facing journeys; TC7, which only opens the site's Test Cases listing page, is intentionally excluded.

The framework is organized around Page Object Model (POM), reusable fixtures, centralized configuration and test data, and Playwright's built-in reporting and failure artifacts.

## Main components

| Component | Responsibility |
|---|---|
| `tests/` | Orchestrate business scenarios, combine page-object actions, and make test assertions. |
| `pages/` | Encapsulate page locators and user-facing operations. Page classes extend `BasePage` where shared behavior is needed. |
| `fixtures/base-fixtures.ts` | Export the project's `test` and `expect`; configure shared page behavior, third-party request blocking, and registered/authenticated test-user fixtures. |
| `config/env.ts` | Read environment-specific values from `AE_*`, validate timeouts, and declare which browser projects run accessibility and visual tests. |
| `testdata/` | Hold reusable product, checkout, contact-form, and user data. Unique user data is produced by `utils/data-generator.ts`. |
| `utils/` | Provide shared logging, network helpers, data generation, and axe scan/report functionality. |
| `playwright.config.ts` | Define browser projects, timeouts, workers, retries, and per-run report/artifact locations. |
| `docs/` | Describe the automation plan, architecture, and CI pipeline guidance. |

## Test execution and browser projects

Desktop Chrome (`chrome`) and Pixel 7 mobile Chrome (`mobile-chrome`) are enabled by default. Desktop Edge, Firefox, WebKit, and mobile Safari project definitions remain commented out because the shared public demo site can become overloaded. Enable additional projects only when needed and when the site's capacity is appropriate.

Tests use Playwright's automatic waiting and web-first assertions; fixed sleeps are avoided. Tests import `test` and `expect` from `fixtures/base-fixtures.ts`. Page locators and reusable interactions belong in page objects, while test files focus on scenario orchestration and assertions.

The configuration sets `fullyParallel: false`, one worker locally, and two workers when `CI` is set. The shared demo site's queue-full response is treated as a test failure and reported explicitly. Keep browser runs serialized when exercising the public site; concurrency should be increased only when using an isolated environment that can support it.

## Browser-specific checks

- Accessibility scans in `tests/10-accessibility.spec.ts` run only in Desktop Chrome. Scan results are consolidated in `reports/accessibility/accessibility-report.json`; repeated findings are grouped while page-level scan details and historical runs are retained.
- Visual regression runs only in Desktop Chrome and mobile Chrome, with project-specific screenshot baselines.
- Other functional tests run in each enabled project unless their test code or project configuration says otherwise.

## Reporting and diagnostics

Each Playwright invocation writes an HTML report, JSON results, and test artifacts under a timestamped `reports/<timestamp>/` directory. Screenshots are captured only on failure; video and Trace are retained on failure. Open the latest HTML report with `npm run report`, or open a specific run with `npx playwright show-report reports\\<timestamp>\\report`.

The standalone axe report has a separate history file at `reports/accessibility/accessibility-report.json`. Use `npm run report:a11y` to list runs, `npm run report:a11y -- --latest` to print the newest complete run, or pass a run ID to inspect a historical run.

## Architectural references

- [Automation test plan](./automation-test-plan.md) maps official scenarios to coverage and defines execution policy.
- [Pipeline guidance](./pipelines.md) describes suite selection and report artifact expectations for CI.
- [README](../README.md) contains setup, commands, and repository conventions.
