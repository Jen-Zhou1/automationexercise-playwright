# Automation Exercise E-commerce Automation Test Framework

> Playwright + TypeScript + Page Object Model + Custom Fixtures  
> Target site: <https://automationexercise.com> (public e-commerce demo site)

This framework covers key user journeys and includes data-driven testing, network interception and mocking,
axe-core accessibility logging, visual regression, and failure screenshots/video/Trace. The currently enabled
projects are Desktop Chrome and Pixel 7 (mobile-chrome). Desktop Edge, Firefox, WebKit, and iPhone 13 (mobile WebKit)
are prepared in `playwright.config.ts` but are temporarily disabled with comments.

## Requirement Coverage

| Capability | Implementation location |
|---|---|
| POM, page objects, and reusable fixtures | `pages/` and `fixtures/base-fixtures.ts` |
| Environment, user/product/order data, and utilities | `config/`, `testdata/`, and `utils/` |
| HTML/JSON reports and failure evidence | `playwright.config.ts` and `reports/<timestamp>/` |
| User registration/login/logout, products, cart, checkout, order placement, and contact form | `tests/` |
| Network monitoring and mocked failure paths | `utils/network.ts` and `tests/03-products-search-cart-persistence.spec.ts` |
| Standalone axe-core scans and reporting | `tests/10-accessibility.spec.ts`, `utils/a11y.ts`, and `reports/a11y/` |
| Visual regression (Desktop and Mobile Chrome; no separate Tablet viewport) | `tests/09-visual-compare.spec.ts` and project-specific snapshots |
| Official 26 test scenarios and automation status | [`docs/automation-test-plan.md`](./docs/automation-test-plan.md) |

## Quick Start

Requires Node.js 22.12 or later. Install dependencies and the browser required for the currently enabled project:

```bash
npm install
npx playwright install chromium
npx playwright test
```

Common commands:

| Purpose | Command |
|---|---|
| Full test run for enabled browsers | `npm test` |
| Desktop Chrome / Pixel 7 mobile Chrome | `npx playwright test --project=chrome` / `npx playwright test --project=mobile-chrome` |
| Smoke / non-smoke regression tests | `npm run test:smoke` / `npm run test:regression` |
| Mobile Chrome regression + visual comparisons | `npm run test:regression:mobile` |
| Mobile Safari regression (isolated, single worker) | `npm run test:regression:mobile-safari` |
| Checkout E2E (single worker) | `npm run test:checkout` |
| Accessibility scan (single worker) | `npm run test:a11y` |
| Visual compare / update baselines (Desktop and Mobile Chrome only) | `npm run test:visual` / `npm run test:visual:update` |
| Playwright grep filtering | `npx playwright test --grep "@smoke"` / `npx playwright test --grep "@regression"` |
| Single test file | `npx playwright test tests/06-checkout-e2e.spec.ts` |
| Open the latest HTML report | `npm run report` |
| Type check | `npm run typecheck` |
| UI / debug mode | `npm run test:ui` / `npm run test:debug` |

Accessibility scans run only on Desktop Chrome; `npm run test:a11y` is fixed to `--project=chrome`.
If the full matrix is run, accessibility tests are skipped on other projects. Visual comparisons run on
Desktop Chrome and Pixel 7 mobile Chrome, with separate baselines for each project. Tablet is intentionally
not a separate visual-test viewport: its layout is sufficiently close to Desktop for this project, while Mobile
covers the materially different responsive layout. Add a Tablet baseline only if tablet-specific behavior or
an uncovered responsive breakpoint becomes a concrete requirement.

The public demo site throttles heavy traffic. By default, only Desktop Chrome and Pixel 7 mobile Chrome are enabled;
all other browser projects remain commented out in `playwright.config.ts`. Mobile Safari has a separate
`playwright.mobile-safari.config.ts` and runs with one worker so it does not change the default browser matrix.
The global setting uses a single worker;
checkout and accessibility commands also run serially to avoid browser parallel requests worsening site overload. If the site returns a queue-full page,
page objects report a clear overload error early instead of waiting for business elements to time out.

Other browser project configurations are intentionally left commented out. Enable them only when needed, install the
required browser, and run `npx playwright test --project=<name>` to target one. The Edge project uses local Microsoft Edge;
Pixel 7 uses Chromium and iPhone 13 uses WebKit.

## Directory Structure

```text
config/       environment variables and timeouts
fixtures/     user registration, login state, and global interception setup
pages/        page objects and business actions
tests/        test orchestration and assertions
testdata/     user, product, form, and payment test data
utils/        logging, data generation, network, and accessibility tools
capstone/     requirements, test plan, architecture notes, and AI usage log, github pipeline
reports/      per-run reports, failure evidence, and axe scan records
```

## Test Files

| File | Main coverage |
|---|---|
| `01-authentication.spec.ts` | registration, logout, duplicate-email registration failure, re-login/deletion of the original account, and invalid login |
| `02-products-filter-cart.spec.ts` | multi-item cart, category/brand browsing, and recommended products |
| `03-products-search-cart-persistence.spec.ts` | product search, network interception/mocking, and cart persistence across login |
| `04-pdp-review-cart-clear.spec.ts` | product details, reviews, quantity, subtotal, and removal |
| `05-site-scroll-and-subscription.spec.ts` | home/cart subscription and scroll-to-top behaviors |
| `06-checkout-e2e.spec.ts` | independent E2E for shopping before registration, registering during checkout, and checking out as an existing user |
| `07-contact-us-form.spec.ts` | contact form validation errors, attachment upload, and successful submission |
| `08-register-search-cart-smoke.spec.ts` | registration, product search/add-to-cart, logout, and account cleanup smoke flow |
| `09-visual-compare.spec.ts` | home, catalog, details, login, contact form, cart, checkout, payment, and order confirmation |
| `10-accessibility.spec.ts` | axe scans for home, recommended items, catalog, category, brand, product detail, login, contact form, cart, checkout, payment, and order confirmation |

TC7 opens the site's Test Cases listing page rather than exercising customer-facing business behavior, so it is intentionally excluded from automation. Functional tests are grouped by behavior to avoid repeating the same flow just to manage authentication state. Test names use the `@smoke` and `@regression` tags:
08 is the only cross-feature smoke test; 07 belongs to both smoke and regression; the remaining functional tests are tagged as regression. Visual tests are not part of the functional tag group and are run separately with `npm run test:visual`; `npm run test:regression:mobile` combines Mobile Chrome regression cases with visual comparisons.
At present, `@smoke` finds 4 items (3 contact-form cases plus 1 cross-feature smoke case); `npm run test:regression` excludes case 07 because it also carries the `@smoke` tag, avoiding duplicate runs of the contact-form case in both smoke and regression workflows.
The registration, search/add-to-cart, and logout coverage from 08 is also validated in the dedicated authentication/search regression tests, but those tests are only tagged as regression, so they are not duplicated by the smoke command.
The detailed English steps, statuses, and mapping are governed by the test plan.

## Design and Diagnostics Conventions

- Locator priority is `[data-qa]`, `#id`, semantic class, and then text; avoid long XPath and hierarchy-based selectors.
- Page elements and business actions are encapsulated in `pages/`; test files are responsible only for orchestration and assertions.
- Use Playwright auto-waiting and web-first assertions; do not use fixed sleeps.
- Standalone accessibility scans run serially on Desktop Chrome with no retries. Each run creates a non-overwriting `reports/a11y/axe-scan-<local-timestamp>.json` containing per-page scans and rule-level aggregates (`pageCount`, `affectedPages`, `nodeCount`, and selector samples). Critical findings fail the suite by default after all scans are saved and summarized; set `AE_A11Y_GATE=record` to record findings without failing. `npm run report:a11y` lists report runs, while `npm run report:a11y -- --latest` or `npm run report:a11y -- <timestamp>` prints a full report. Functional regression does not rerun accessibility scans.
- Every run writes to `reports/<timestamp>/`, which includes HTML/JSON reports and test artifacts; screenshots, videos, and Trace are retained on failure. The report directory is not version-controlled.
- Per-run logs are generated by the Playwright reporter; application step logs are emitted by `utils/logger.ts`.
- Visual tests run in the `chrome` and `mobile-chrome` projects; keep their project-specific baselines under code review.

For more architecture decisions, see [`capstone/architecture.md`](./docs/architecture.md). For the AI-assisted development log, see [`capstone/ai-usage-log.md`](./docs/ai-usage-log.md).
